use std::sync::Mutex;

use chrono::Utc;
use tauri::webview::{DownloadEvent, NewWindowResponse};
use tauri::{AppHandle, LogicalPosition, LogicalSize, Manager, WebviewBuilder, WebviewUrl};
use uuid::Uuid;

use crate::db;
use crate::profile_data_store::{
    encode_id, get_or_create_persistent_data_store_id, is_persistent_profile,
    new_ephemeral_data_store_id, remove_data_store_blocking,
};
use crate::storage::download::DownloadRecord;
use crate::webview_policy::{decide_download, decide_navigation};

/// A fresh label per webview instance, not a fixed constant -- reusing the
/// same label for every profile switch risks Tauri's internal webview
/// registry seeing the new one as still-registering while the old one
/// (same label) hasn't fully deregistered yet.
fn new_child_label() -> String {
    format!("veil-live-webview-{}", Uuid::new_v4())
}

struct ActiveWebview {
    profile: String,
    data_store_id: [u8; 16],
    is_persistent: bool,
    webview: tauri::Webview,
}

#[derive(Default)]
pub struct ChildWebviewState(Mutex<Option<ActiveWebview>>);

fn record_navigation_event(
    app: &AppHandle,
    session_id: &str,
    profile: &str,
    url: &str,
    allowed: bool,
) {
    let _ = db::insert_audit_event(
        app,
        &crate::storage::audit::AuditEvent {
            id: Uuid::new_v4().to_string(),
            at: Utc::now().to_rfc3339(),
            event_type: "webview.navigation".to_string(),
            summary: format!(
                "Live WebView navigation {}.",
                if allowed { "allowed" } else { "blocked" }
            ),
            metadata_json: Some(
                serde_json::json!({
                    "sessionId": session_id,
                    "profile": profile,
                    "url": url,
                    "allowed": allowed
                })
                .to_string(),
            ),
        },
    );
}

fn record_new_window_event(app: &AppHandle, session_id: &str, profile: &str, url: &str) {
    let _ = db::insert_audit_event(
        app,
        &crate::storage::audit::AuditEvent {
            id: Uuid::new_v4().to_string(),
            at: Utc::now().to_rfc3339(),
            event_type: "webview.new_window_denied".to_string(),
            summary: "Live WebView denied a new-window/popup request.".to_string(),
            metadata_json: Some(
                serde_json::json!({
                    "sessionId": session_id,
                    "profile": profile,
                    "url": url
                })
                .to_string(),
            ),
        },
    );
}

fn record_download_event(app: &AppHandle, session_id: &str, profile: &str, url: &str) {
    let decision = decide_download(url);

    let _ = db::insert_download_record(
        app,
        &DownloadRecord {
            id: Uuid::new_v4().to_string(),
            session_id: session_id.to_string(),
            profile: profile.to_string(),
            url: url.to_string(),
            filename: decision.filename,
            extension: decision.extension,
            risk: decision.risk,
            status: "blocked".to_string(),
            reason: decision.reason,
            at: Utc::now().to_rfc3339(),
        },
    );
}

fn record_data_store_event(
    app: &AppHandle,
    profile: &str,
    id: &[u8; 16],
    event_type: &str,
    summary: &str,
) {
    let _ = db::insert_audit_event(
        app,
        &crate::storage::audit::AuditEvent {
            id: Uuid::new_v4().to_string(),
            at: Utc::now().to_rfc3339(),
            event_type: event_type.to_string(),
            summary: summary.to_string(),
            metadata_json: Some(
                serde_json::json!({
                    "profile": profile,
                    "dataStoreId": encode_id(id)
                })
                .to_string(),
            ),
        },
    );
}

/// Resolves the data store identifier a profile's webview should use: the
/// stored one for persistent profiles (created if this is the first time),
/// a fresh one for ephemeral profiles.
fn resolve_data_store_id(app: &AppHandle, profile: &str) -> Result<([u8; 16], bool), String> {
    let is_persistent = is_persistent_profile(profile);

    let id = if is_persistent {
        get_or_create_persistent_data_store_id(app, profile)?
    } else {
        new_ephemeral_data_store_id()
    };

    Ok((id, is_persistent))
}

/// Closes the given active webview and, if it was ephemeral, kicks off
/// deleting its data store in the background -- the actual "wipe on
/// close" for Temporary/Adult-style profiles.
///
/// The close itself is fast and synchronous. Actually deleting the data
/// store is not: WKWebsiteDataStore refuses removal ("data store is
/// currently opened") until the WKWebView referencing it has fully
/// deallocated, which close() only starts -- for a heavy page (video,
/// many in-flight requests) that can take well over a second. Blocking
/// the profile switch on that would make switching profiles feel broken,
/// so cleanup runs on a background thread with a generous retry budget
/// instead of failing (or stalling) the switch itself.
fn teardown_active_webview(app: &AppHandle, active: ActiveWebview) -> Result<(), String> {
    let ActiveWebview {
        profile,
        data_store_id,
        is_persistent,
        webview,
    } = active;

    webview.close().map_err(|error| error.to_string())?;
    drop(webview);

    if !is_persistent {
        let app = app.clone();
        std::thread::spawn(
            move || match remove_data_store_with_retry(&app, data_store_id) {
                Ok(()) => record_data_store_event(
                    &app,
                    &profile,
                    &data_store_id,
                    "webview.data_store.removed",
                    "Ephemeral profile data store removed on close.",
                ),
                Err(error) => record_data_store_event(
                    &app,
                    &profile,
                    &data_store_id,
                    "webview.data_store.removal_failed",
                    &format!("Ephemeral profile data store could not be removed: {error}"),
                ),
            },
        );
    }

    Ok(())
}

/// Retries a handful of times, spaced generously (empirically, WKWebView
/// teardown for a heavy page can take several seconds before
/// WKWebsiteDataStore will allow removal) -- deliberately few and widely
/// spaced, not tight/frequent, since this runs on a background thread
/// that still schedules work onto the *main* thread each attempt and
/// hammering that while the next profile's webview is trying to paint is
/// exactly the kind of contention worth avoiding.
fn remove_data_store_with_retry(app: &AppHandle, id: [u8; 16]) -> Result<(), String> {
    const DELAYS_MS: &[u64] = &[2000, 3000, 5000, 5000, 10000, 10000];

    let mut last_error = String::new();
    std::thread::sleep(std::time::Duration::from_millis(1500));

    for delay_ms in DELAYS_MS {
        match remove_data_store_blocking(app, id) {
            Ok(()) => return Ok(()),
            Err(error) => {
                last_error = error;
                std::thread::sleep(std::time::Duration::from_millis(*delay_ms));
            }
        }
    }

    Err(last_error)
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn webview_show(
    app: AppHandle,
    session_id: String,
    profile: String,
    url: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<serde_json::Value, String> {
    let decision = decide_navigation(&url);

    if !decision.allowed {
        hide_child_webview(&app)?;

        return Ok(serde_json::json!({
            "status": "blocked",
            "reason": decision.reason
        }));
    }

    let parsed = url::Url::parse(&url).map_err(|error| error.to_string())?;
    let state = app.state::<ChildWebviewState>();
    let mut guard = state
        .0
        .lock()
        .map_err(|_| "WebView state lock was poisoned.".to_string())?;

    let reuse_existing = matches!(guard.as_ref(), Some(active) if active.profile == profile);

    if reuse_existing {
        let active = guard.as_ref().unwrap();
        active
            .webview
            .navigate(parsed)
            .map_err(|error| error.to_string())?;
        active
            .webview
            .set_position(LogicalPosition::new(x, y))
            .map_err(|error| error.to_string())?;
        active
            .webview
            .set_size(LogicalSize::new(width, height))
            .map_err(|error| error.to_string())?;
    } else {
        if let Some(previous) = guard.take() {
            teardown_active_webview(&app, previous)?;
        }

        let window = app
            .get_window("main")
            .ok_or_else(|| "Main window not found.".to_string())?;

        let (data_store_id, is_persistent) = resolve_data_store_id(&app, &profile)?;

        let nav_app = app.clone();
        let nav_session_id = session_id.clone();
        let nav_profile = profile.clone();

        let download_app = app.clone();
        let download_session_id = session_id.clone();
        let download_profile = profile.clone();

        let new_window_app = app.clone();
        let new_window_session_id = session_id.clone();
        let new_window_profile = profile.clone();

        let mut builder = WebviewBuilder::new(new_child_label(), WebviewUrl::External(parsed))
            .on_navigation(move |nav_url| {
                let decision = decide_navigation(nav_url.as_str());
                record_navigation_event(
                    &nav_app,
                    &nav_session_id,
                    &nav_profile,
                    nav_url.as_str(),
                    decision.allowed,
                );
                decision.allowed
            })
            .on_download(move |_webview, event| {
                if let DownloadEvent::Requested { url, .. } = event {
                    record_download_event(
                        &download_app,
                        &download_session_id,
                        &download_profile,
                        url.as_str(),
                    );
                }

                false
            })
            .on_new_window(move |url, _features| {
                // Deny every new-window/popup request (target="_blank" links,
                // window.open(), print/export flows that open a new browsing
                // context, etc). Without this, such requests bypass on_download
                // and on_navigation entirely and are allowed by wry's default
                // behavior -- confirmed live: a Wikipedia PDF export opened
                // and was saved this way before this handler was added.
                record_new_window_event(
                    &new_window_app,
                    &new_window_session_id,
                    &new_window_profile,
                    url.as_str(),
                );
                NewWindowResponse::Deny
            });

        // data_store_identifier is macOS/iOS-only (see
        // docs/recommendations/SQLCIPHER_KEYCHAIN_SCOPE.md's capability
        // matrix); other platforms fall back to the shared default data
        // store until data_directory-based isolation is scoped for them.
        #[cfg(any(target_os = "macos", target_os = "ios"))]
        {
            builder = builder.data_store_identifier(data_store_id);
        }

        let webview = window
            .add_child(
                builder,
                LogicalPosition::new(x, y),
                LogicalSize::new(width, height),
            )
            .map_err(|error| error.to_string())?;

        record_data_store_event(
            &app,
            &profile,
            &data_store_id,
            "webview.data_store.opened",
            if is_persistent {
                "Persistent profile data store opened."
            } else {
                "Ephemeral profile data store opened."
            },
        );

        *guard = Some(ActiveWebview {
            profile,
            data_store_id,
            is_persistent,
            webview,
        });
    }

    Ok(serde_json::json!({
        "status": "ready",
        "reason": decision.reason
    }))
}

#[tauri::command]
pub fn webview_hide(app: AppHandle) -> Result<(), String> {
    hide_child_webview(&app)
}

fn hide_child_webview(app: &AppHandle) -> Result<(), String> {
    let state = app.state::<ChildWebviewState>();
    let mut guard = state
        .0
        .lock()
        .map_err(|_| "WebView state lock was poisoned.".to_string())?;

    if let Some(active) = guard.take() {
        teardown_active_webview(app, active)?;
    }

    Ok(())
}

#[tauri::command]
pub fn webview_set_bounds(
    app: AppHandle,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let state = app.state::<ChildWebviewState>();
    let guard = state
        .0
        .lock()
        .map_err(|_| "WebView state lock was poisoned.".to_string())?;

    if let Some(active) = guard.as_ref() {
        active
            .webview
            .set_position(LogicalPosition::new(x, y))
            .map_err(|error| error.to_string())?;
        active
            .webview
            .set_size(LogicalSize::new(width, height))
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}
