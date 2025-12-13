use std::collections::HashMap;
use std::fs::{self, File, create_dir_all};
use std::io::Result;
use std::io::prelude::*;
use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::{Value, json};
use std::sync::Mutex;
use tauri::Manager;
use tauri::path::PathResolver;
use uuid::Uuid;

struct State {
  data: Mutex<HashMap<String, Value>>,
  listeners: Mutex<Vec<Box<dyn Fn(&str, &Value) + Send + Sync>>>,
}

fn write_file(file_name: &str, content: &Value) -> Result<()> {
  let data = json!(content);
  File::create(file_name)?;
  fs::write(file_name, data.to_string())?;
  Ok(())
}

fn sources_reducer(state: Value, event: &str, payload: &str) -> Value {
  let mut new_state = state.clone();
  match event {
    "source_added" => {
        let id = Uuid::new_v4().to_string();
        let mut source: Value = serde_json::from_str(payload).unwrap();

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_millis() as u64;

        source.as_object_mut().unwrap().insert("id".to_string(), json!(id));
        source.as_object_mut().unwrap().insert("createTime".to_string(), json!(timestamp));
        new_state.as_object_mut().unwrap().insert(
            id.to_string(),
            source,
        );
        return new_state
    }
    "source_deleted" => {
      let id: Uuid = payload.parse().unwrap();
      new_state.as_object_mut().unwrap().remove(&id.to_string());
      return new_state
    }
    _ => {
      println!("Unknown command: {}", event);
    }
  }
  state
}

fn read_file(file_name: &str, default_value: Value) -> Result<String> {
  let mut buffer = String::new();
  let mut file = match File::open(file_name) {
    Ok(file) => file,
    Err(_) => {
      write_file(file_name, &default_value)?;
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

fn settings_reducer(state: Value, event: &str, payload: &str) -> Value {
  let mut new_state = state.clone();
  match event {
    "settings_updated" | "setting_added" => {
      let payload_value: Value = serde_json::from_str(payload).unwrap();
      for (key, value) in payload_value.as_object().unwrap() {
        new_state.as_object_mut().unwrap().insert(key.to_string(), value.clone());
      }
      return new_state;
    }
    _ => {
      println!("Unknown command: {}", event);
    }
  }
  state
}

fn sessions_reducer(state: Value, event: &str, payload: &str) -> Value {
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

fn create_persist_fn(app: &tauri::AppHandle) -> impl Fn(&str, &Value) {
  let mut app_data_dir = app.path().app_data_dir().unwrap();
  if cfg!(debug_assertions) {
    app_data_dir = "".into();
  }

  move |key: &str, value: &Value| {
    let file_path = app_data_dir.join(format!("{}.json", key));
    write_file(file_path.to_str().unwrap(), value).expect("Failed to write to file");
  }
}

fn get_state_keys() -> HashMap<String, (Value, fn(Value, &str, &str) -> Value)> {
  let mut keys = HashMap::new();

  keys.insert("sources".to_string(), (json!({}), sources_reducer as fn(Value, &str, &str) -> Value));
  keys.insert("sessions".to_string(), (json!({}), state_identity as fn(Value, &str, &str) -> Value));
  keys.insert("learnings".to_string(), (json!({}), state_identity as fn(Value, &str, &str) -> Value));
  keys.insert("settings".to_string(), (json!({}), settings_reducer as fn(Value, &str, &str) -> Value));
  keys.insert("collections".to_string(), (json!({}), state_identity as fn(Value, &str, &str) -> Value));

  keys
}

fn dispatch_w_data(event: String, payload: Option<String>, state: tauri::State<State>) -> String {
  event
}

fn create_reducer_fn(state_keys: HashMap<String, (Value, fn(Value, &str, &str) -> Value)>) -> impl Fn(tauri::AppHandle, String, Option<String>, tauri::State<State>) -> String {

  move |app, event, payload, mut state| {
    let mut data = state.data.lock().unwrap();

    for (key, value) in data.iter_mut() {
      if let Some((_initial_value, reducer)) = state_keys.get(key) {
        let updated_value = reducer(value.clone(), &event, &payload.as_deref().unwrap_or_default());
        if *value != updated_value {
            *value = updated_value.clone();
            for listener in state.listeners.lock().unwrap().iter() {
              listener(key, &updated_value);
            }
        }
      }
    }

    serde_json::to_string(&*data).unwrap()
  }
}

#[tauri::command]
fn dispatch(app: tauri::AppHandle, event: String, payload: Option<String>, state: tauri::State<State>) -> String {
  let mut data = state.data.lock().unwrap();
  let state_keys = get_state_keys();

  for (key, value) in data.iter_mut() {
    if let Some((_initial_value, reducer)) = state_keys.get(key) {
      let updated_value = reducer(value.clone(), &event, &payload.as_deref().unwrap_or_default());
      if *value != updated_value {
          *value = updated_value.clone();
          for listener in state.listeners.lock().unwrap().iter() {
            listener(key, &updated_value);
          }
      }
    }
  }

  serde_json::to_string(&*data).unwrap()
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
      let mut listeners = state.listeners.lock().unwrap();

      for (name, attributes) in get_state_keys().iter() {
          let (initial_state, _modify_fn) = attributes;
          let initial_data = read_file(app_data_dir.join(&format!("{}.json", name)).to_str().unwrap(), initial_state.clone()).unwrap();
          let initial_json: Value = serde_json::from_str(&initial_data).unwrap();
          data.insert(name.to_string(), initial_json);
      }

      listeners.push(Box::new(create_persist_fn(&app.handle())));

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .manage(State { data: Mutex::new(HashMap::new()), listeners: Mutex::new(Vec::new()) })
    .invoke_handler(tauri::generate_handler![dispatch])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
