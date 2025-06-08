use std::collections::HashMap;
use std::fs::{self, File};
use std::io::Result;
use std::io::prelude::*;
use serde_json::{Value, json};
use std::sync::Mutex;
use tauri::Manager;

struct State {
    readings: Mutex<Value>,
    data: Mutex<HashMap<String, Value>>,
}

fn get_state_keys() -> Vec<(&'static str, Value)> {
    let keys = [
        ("sources", json!({})),
        ("readings", json!({})),
    ];
    keys.to_vec()
}

pub fn write_file(file_name: &str, content: Value) -> Result<()> {
  let data = json!(content);
  File::create(file_name)?;
  fs::write(file_name, data.to_string())?;
  Ok(())
}

pub fn read_file(file_name: &str, default_value: Value) -> Result<String> {
  let mut buffer = String::new();
  let mut file = match File::open(file_name) {
    Ok(file) => file,
    Err(_) => {
      write_file(file_name, default_value)?;
      File::open(file_name)?
    }
  };

  file.read_to_string(&mut buffer)?;
  Ok(buffer)
}

fn modify_state(state: Value, event: &str, payload: &str) -> Value {
  let mut new_state = state.clone();
  match event {
    "add_reading" => {
        new_state.as_array_mut().unwrap().push(json!({ "reading": payload }));
    }
    _ => {
      println!("Unknown command: {}", event);
    }
  }
  new_state
}

#[tauri::command]
fn dispatch(event: String, payload: Option<String>, state: tauri::State<State>) -> String {
  let mut updated_data = state.data.lock().unwrap().clone();
  let readable_data = updated_data.clone();

  for (key, value) in readable_data.iter() {
    // this needs to be different for each key--state modification is a reducer
    let updated_value = modify_state(value.clone(), &event, &payload.clone().unwrap_or_default().clone());
    updated_data.insert(key.clone(), updated_value.clone());
    write_file(&format!("{}.json", key), json!(updated_value.clone())).expect("Failed to write to file");
  }
  *state.data.lock().unwrap() = updated_data.clone();
  // serde_json::to_string(&updated_data).unwrap()

  let readings = state.readings.lock().unwrap().clone();
  let updated_readings = modify_state(readings, &event, &payload.clone().unwrap_or_default().clone());
  *state.readings.lock().unwrap() = updated_readings.clone();
  write_file("readings.json", json!(updated_readings.clone())).expect("Failed to write to file");
  updated_readings.to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {

      let state = app.state::<State>();
      let mut data = state.data.lock().unwrap();

      for (name, initial_data) in get_state_keys() {
          let initial_data = read_file(&format!("{}.json", name), initial_data).unwrap();
          let initial_json: Value = serde_json::from_str(&initial_data).unwrap();
          data.insert(name.to_string(), initial_json);
      }

      let initial_data = read_file(&"readings.json".to_string(), json!([])).unwrap();
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
    .manage(State { data: Mutex::new(HashMap::new()), readings: Mutex::new(json!({})) })
    .invoke_handler(tauri::generate_handler![dispatch])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
