#[tauri::command]
fn dispatch(action_type: String, payload: Option<String>) -> String {
  format!("{}: {}", action_type, payload.unwrap_or_default())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![dispatch])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
