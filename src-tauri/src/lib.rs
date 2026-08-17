mod commands;
mod db;
mod keychain;
mod profile_data_store;
mod storage;
mod webview_policy;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(commands::webview::ChildWebviewState::default())
        .invoke_handler(tauri::generate_handler![
            commands::vault_list_bookmarks,
            commands::vault_save_bookmark,
            commands::vault_remove_bookmark,
            commands::vault_wipe_bookmarks,
            commands::audit_list_events,
            commands::audit_append_event,
            commands::audit_clear_events,
            commands::permission_list_records,
            commands::permission_append_record,
            commands::permission_clear_records,
            commands::download_list_records,
            commands::download_append_record,
            commands::download_clear_records,
            commands::db_stats,
            commands::db_export_json,
            commands::db_export_file,
            commands::db_import_json,
            commands::encryption::db_encryption_readiness,
            commands::encryption::db_export_encrypted,
            commands::encryption::db_import_encrypted,
            commands::webview::webview_show,
            commands::webview::webview_hide,
            commands::webview::webview_set_bounds
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
