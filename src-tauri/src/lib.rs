mod commands;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::vault_list_bookmarks,
            commands::vault_save_bookmark,
            commands::vault_remove_bookmark,
            commands::vault_wipe_bookmarks,
            commands::audit_list_events,
            commands::audit_append_event,
            commands::audit_clear_events
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
