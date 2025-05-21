use std::fs::{self, File};
use std::io::Result;
use std::io::prelude::*;

use serde_json::json;

pub fn read_file(file_name: String) -> Result<String> {
  let data = json!({});
  let mut buffer = String::new();
  let mut file = match File::open(&file_name) {
    Ok(file) => file,
    Err(_) => {
      println!("Creating file...");
      File::create(&file_name)?;
      fs::write(&file_name, data.to_string())?;
      File::open(&file_name)?
    }
  };

  file.read_to_string(&mut buffer)?;
  Ok(buffer)
}

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
