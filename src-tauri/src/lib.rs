use std::collections::HashMap;
use std::fs::{self, create_dir_all, File};
use std::io::prelude::*;
use std::io::Result;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::{json, Value};
use tauri::Manager;
use uuid::Uuid;

mod state;
use state::{consume, State, Machine};

fn write_file(file_name: &str, content: &Value) -> Result<()> {
    let data = json!(content);
    File::create(file_name)?;
    fs::write(file_name, data.to_string())?;
    Ok(())
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

fn payload_identity(_state: Value, _event: &str, payload: &str) -> Value {
    serde_json::from_str(payload).unwrap_or(json!({}))
}

fn state_identity(state: Value, event: &str, payload: &str) -> Value {
    // This function is a placeholder for state that does not change
    // It simply returns the state as is, without modification
    println!(
        "State identity called with event: {}, payload: {}",
        event, payload
    );
    state
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

            source
                .as_object_mut()
                .unwrap()
                .insert("id".to_string(), json!(id));
            source
                .as_object_mut()
                .unwrap()
                .insert("createTime".to_string(), json!(timestamp));
            new_state
                .as_object_mut()
                .unwrap()
                .insert(id.to_string(), source);
            return new_state;
        }
        "source_deleted" => {
            let id: Uuid = payload.parse().unwrap();
            new_state.as_object_mut().unwrap().remove(&id.to_string());
            return new_state;
        }
        _ => {
            println!("Unknown command: {}", event);
        }
    }
    state
}

fn settings_reducer(state: Value, event: &str, payload: &str) -> Value {
    let mut new_state = state.clone();
    match event {
        "settings_updated" | "setting_added" => {
            let payload_value: Value = serde_json::from_str(payload).unwrap();
            for (key, value) in payload_value.as_object().unwrap() {
                new_state
                    .as_object_mut()
                    .unwrap()
                    .insert(key.to_string(), value.clone());
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
            reading
                .as_object_mut()
                .unwrap()
                .insert("id".to_string(), json!(id));
            new_state
                .as_object_mut()
                .unwrap()
                .insert(id.to_string(), reading);
            return new_state;
        }
        _ => {
            println!("Unknown command: {}", event);
        }
    }
    state
}

#[tauri::command]
fn dispatch(
    _app: tauri::AppHandle,
    event: String,
    payload: Option<String>,
    machine: tauri::State<Machine>,
) -> String {
    machine.consume(event, payload)
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
                println!(
                    "Running in production mode, using app data directory: {}",
                    app_data_dir.display()
                );
                if let Err(err) = create_dir_all(&app_data_dir) {
                    eprintln!("Failed to create app data directory: {}", err);
                } else {
                    println!(
                        "App data directory created successfully: {}",
                        app_data_dir.display()
                    );
                }
            }

            let state = app.state::<State>();
            let mut data = HashMap::new();
            let mut listeners: Vec<Box<dyn Fn(&str, &Value) + Send + Sync>> = Vec::new();

            let reducers = HashMap::from([
                (
                    "sources".to_string(),
                    (json!({}), sources_reducer as fn(Value, &str, &str) -> Value),
                ),
                (
                    "sessions".to_string(),
                    (json!({}), state_identity as fn(Value, &str, &str) -> Value),
                ),
                (
                    "learnings".to_string(),
                    (json!({}), state_identity as fn(Value, &str, &str) -> Value),
                ),
                (
                    "settings".to_string(),
                    (
                        json!({}),
                        settings_reducer as fn(Value, &str, &str) -> Value,
                    ),
                ),
                (
                    "collections".to_string(),
                    (json!({}), state_identity as fn(Value, &str, &str) -> Value),
                ),
            ]);

            for (name, attributes) in reducers.iter() {
                let (initial_state, _modify_fn) = attributes;
                let initial_data = read_file(
                    app_data_dir
                        .join(&format!("{}.json", name))
                        .to_str()
                        .unwrap(),
                    initial_state.clone(),
                )
                .unwrap();
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

            let machine = Machine::new(
                data,
                reducers,
                Mutex::new(std::mem::take(&mut listeners)),
            );

            println!("{}", machine.consume("app_initialized".to_string(), None));

            app.manage(machine);

            Ok(())
        })
        .manage(State {
            data: Mutex::new(HashMap::new()),
            listeners: Mutex::new(Vec::new()),
            reducers: HashMap::from([
                (
                    "sources".to_string(),
                    (json!({}), sources_reducer as fn(Value, &str, &str) -> Value),
                ),
                (
                    "sessions".to_string(),
                    (json!({}), state_identity as fn(Value, &str, &str) -> Value),
                ),
                (
                    "learnings".to_string(),
                    (json!({}), state_identity as fn(Value, &str, &str) -> Value),
                ),
                (
                    "settings".to_string(),
                    (
                        json!({}),
                        settings_reducer as fn(Value, &str, &str) -> Value,
                    ),
                ),
                (
                    "collections".to_string(),
                    (json!({}), state_identity as fn(Value, &str, &str) -> Value),
                ),
            ]),
            consume: consume,
        })
        .invoke_handler(tauri::generate_handler![dispatch])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
