use std::fs::{self, File};
use std::io::Result;
use std::io::prelude::*;
use serde_json::{Value, json};
use std::sync::Mutex;
use tauri::Manager;

struct State {
    readings: Mutex<Value>,
}

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

fn modify_state(state: Value, name: &str, payload: Option<String>) -> Value {
  let mut new_state = state.clone();
  match name {
    "add_reading" => {
      if let Some(reading) = payload {
        new_state.as_array_mut().unwrap().push(json!({ "name": name, "reading": reading }));
      }
    }
    _ => {
      println!("Unknown command: {}", name);
    }
  }
  new_state
}

#[tauri::command]
fn dispatch(name: String, payload: Option<String>) -> String {
  format!("{}: {}", name, payload.unwrap_or_default())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      let initial_data = read_file("readings.json".to_string()).unwrap();
      let initial_json: Value = serde_json::from_str(&initial_data).unwrap();
      let state = app.state::<State>();
      let mut readings = state.readings.lock().unwrap();
      *readings = initial_json;

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .manage(State { readings: Mutex::new(json!({})) })
    .invoke_handler(tauri::generate_handler![dispatch])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
