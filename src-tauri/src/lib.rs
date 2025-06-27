use std::collections::HashMap;
use std::fs::{self, File, create_dir_all};
use std::io::Result;
use std::io::prelude::*;
use serde_json::{Value, json};
use std::sync::Mutex;
use tauri::Manager;
use tauri::path::PathResolver;

struct State {
  data: Mutex<HashMap<String, Value>>,
}

pub fn write_file(file_name: &str, content: Value) -> Result<()> {
  let data = json!(content);
  File::create(file_name)?;
  fs::write(file_name, data.to_string())?;
  Ok(())
}

fn sources_reducer(state: Value, event: &str, payload: &str) -> Value {
  let mut new_state = state.clone();
  match event {
    "add_source" => {
        let id = new_state.as_object().unwrap().len();
        let mut source: Value = serde_json::from_str(payload).unwrap();
        source.as_object_mut().unwrap().insert("id".to_string(), json!(id));
        new_state.as_object_mut().unwrap().insert(
            id.to_string(),
            source,
        );
        return new_state
    }
    "delete_source" => {
      let id: usize = payload.parse().unwrap();
      new_state.as_object_mut().unwrap().remove(&id.to_string());
      return new_state
    }
    _ => {
      println!("Unknown command: {}", event);
    }
  }
  state
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

fn state_identity(state: Value, event: &str, payload: &str) -> Value {
  // This function is a placeholder for state that does not change
  // It simply returns the state as is, without modification
  println!("State identity called with event: {}, payload: {}", event, payload);
  state
}

fn readings_reducer(state: Value, event: &str, payload: &str) -> Value {
  let mut new_state = state.clone();
  match event {
    "add_reading" => {
        let id = new_state.as_object().unwrap().len();
        let mut reading: Value = serde_json::from_str(payload).unwrap();
        reading.as_object_mut().unwrap().insert("id".to_string(), json!(id));
        new_state.as_object_mut().unwrap().insert(
            id.to_string(),
            reading,
        );
        return new_state
    }
    _ => {
      println!("Unknown command: {}", event);
    }
  }
  state
}

fn get_state_keys() -> HashMap<String, (Value, fn(Value, &str, &str) -> Value)> {
  let mut keys = HashMap::new();

  keys.insert("sources".to_string(), (json!({}), sources_reducer as fn(Value, &str, &str) -> Value));
  keys.insert("readings".to_string(), (json!({}), readings_reducer as fn(Value, &str, &str) -> Value));

  keys
}

#[tauri::command]
fn dispatch(app: tauri::AppHandle, event: String, payload: Option<String>, state: tauri::State<State>) -> String {
  let mut app_data_dir = app.path().app_data_dir().unwrap();
  println!("App data directory: {}", app_data_dir.display());

  // if dev mode, set app data directory to ""
  if cfg!(debug_assertions) {
    println!("Running in debug mode, using empty app data directory");
    app_data_dir = "".into();
  } else {
    println!("Running in production mode, using app data directory: {}", app_data_dir.display());
  }

  let mut updated_data = state.data.lock().unwrap().clone();
  let readable_data = updated_data.clone();

  let state_keys = get_state_keys();

  for (key, value) in readable_data.iter() {
    // this needs to be different for each key--state modification is a reducer
    let (_initial_value, reducer) = state_keys.get(key).unwrap();
    let updated_value = reducer(value.clone(), &event, &payload.clone().unwrap_or_default().clone());
    updated_data.insert(key.clone(), updated_value.clone());
    write_file(app_data_dir.join(&format!("{}.json", key)).to_str().unwrap(), json!(updated_value.clone())).expect("Failed to write to file");
  }
  *state.data.lock().unwrap() = updated_data.clone();
  serde_json::to_string(&updated_data).unwrap()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {

      let mut app_data_dir = app.path().app_data_dir().unwrap();
      // if dev mode, set app data directory to ""
      if cfg!(debug_assertions) {
        println!("Running in debug mode, using empty app data directory");
        app_data_dir = "".into();
      } else {
        println!("Running in production mode, using app data directory: {}", app_data_dir.display());
        if let Err(err) = create_dir_all(&app_data_dir) {
          eprintln!("Failed to create app data directory: {}", err);
        } else {
          println!("App data directory created successfully: {}", app_data_dir.display());
        }
      }

      let state = app.state::<State>();
      let mut data = state.data.lock().unwrap();

      for (name, attributes) in get_state_keys().iter() {
          let (initial_state, _modify_fn) = attributes;
          let initial_data = read_file(app_data_dir.join(&format!("{}.json", name)).to_str().unwrap(), initial_state.clone()).unwrap();
          let initial_json: Value = serde_json::from_str(&initial_data).unwrap();
          data.insert(name.to_string(), initial_json);
      }

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .manage(State { data: Mutex::new(HashMap::new()) })
    .invoke_handler(tauri::generate_handler![dispatch])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
