use std::sync::Mutex;

use chrono::Utc;
use tauri::webview::{DownloadEvent, NewWindowResponse};
use tauri::{AppHandle, LogicalPosition, LogicalSize, Manager, WebviewBuilder, WebviewUrl};
use uuid::Uuid;

use crate::db;
use crate::storage::download::DownloadRecord;
use crate::webview_policy::{decide_download, decide_navigation};

const CHILD_LABEL: &str = "veil-live-webview";

#[derive(Default)]
pub struct ChildWebviewState(pub Mutex<Option<tauri::Webview>>);

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

    if let Some(webview) = guard.as_ref() {
        webview
            .navigate(parsed)
            .map_err(|error| error.to_string())?;
        webview
            .set_position(LogicalPosition::new(x, y))
            .map_err(|error| error.to_string())?;
        webview
            .set_size(LogicalSize::new(width, height))
            .map_err(|error| error.to_string())?;
    } else {
        let window = app
            .get_window("main")
            .ok_or_else(|| "Main window not found.".to_string())?;

        let nav_app = app.clone();
        let nav_session_id = session_id.clone();
        let nav_profile = profile.clone();

        let download_app = app.clone();
        let download_session_id = session_id.clone();
        let download_profile = profile.clone();

        let new_window_app = app.clone();
        let new_window_session_id = session_id.clone();
        let new_window_profile = profile.clone();

        let builder = WebviewBuilder::new(CHILD_LABEL, WebviewUrl::External(parsed))
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

        let webview = window
            .add_child(
                builder,
                LogicalPosition::new(x, y),
                LogicalSize::new(width, height),
            )
            .map_err(|error| error.to_string())?;

        *guard = Some(webview);
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

    if let Some(webview) = guard.take() {
        webview.close().map_err(|error| error.to_string())?;
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

    if let Some(webview) = guard.as_ref() {
        webview
            .set_position(LogicalPosition::new(x, y))
            .map_err(|error| error.to_string())?;
        webview
            .set_size(LogicalSize::new(width, height))
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}
