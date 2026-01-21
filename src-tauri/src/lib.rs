use std::collections::HashMap;
use std::fs::{self, create_dir_all, File};
use std::io::prelude::*;
use std::io::Result;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::{json, Value};
use tauri::Manager;
use uuid::Uuid;

mod hermenia;
use hermenia::{Machine};

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

fn create_persist_state_fn(app: &tauri::AppHandle) -> impl Fn(&str, &Value, &Value) {
    let mut app_data_dir = app.path().app_data_dir().unwrap();
    if cfg!(debug_assertions) {
        app_data_dir = "".into();
    }

    move |key: &str, value: &Value, event: &Value| {
        let file_path = app_data_dir.join(format!("{}.json", key));
        write_file(file_path.to_str().unwrap(), value).expect("Failed to write to file");
    }
}

fn create_persist_event_fn(app: &tauri::AppHandle) -> impl Fn(&str, &Value, &Value) {
    let mut app_data_dir = app.path().app_data_dir().unwrap();
    if cfg!(debug_assertions) {
        app_data_dir = "".into();
    }

    move |key: &str, value: &Value, event: &Value| {
        let file_path_str = app_data_dir
            .join(format!("{}.json", "events"))
            .to_str()
            .unwrap()
            .to_string();

        let existing_events_str = read_file(&file_path_str, json!({})).unwrap();
        let mut events: HashMap<String, Value> =
            serde_json::from_str(&existing_events_str).unwrap();
        let event_id = event["id"].as_str().unwrap().to_string();
        events.insert(event_id, event.clone());
        write_file(&file_path_str, &json!(events)).expect("Failed to write to events file");
    }
}

fn payload_identity(_state: Value, _event: &str, payload: &str) -> Value {
    serde_json::from_str(payload).unwrap_or(json!({}))
}

fn state_identity(state: Value, event: Value) -> Value {
    // This function is a placeholder for state that does not change
    // It simply returns the state as is, without modification
    println!(
        "State identity called with event: {}",
        event
    );
    state
}

fn sources_reducer(state: Value, event: Value) -> Value {
    let mut new_state = state.clone();
    match event["type"].as_str().unwrap() {
        "source_added" => {
            let id = Uuid::new_v4().to_string();
            let mut source: Value = event["payload"].clone();

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
            println!("Deleting source: {}", event["payload"]["id"]);
            let id: Uuid = serde_json::from_value(event["payload"]["id"].clone()).unwrap();
            new_state.as_object_mut().unwrap().remove(&id.to_string());
            return new_state;
        }
        _ => {
            println!("Unknown command: {}", event["type"].as_str().unwrap());
        }
    }
    state
}

fn settings_reducer(state: Value, event: Value) -> Value {
    let mut new_state = state.clone();
    match event["type"].as_str().unwrap() {
        "settings_updated" | "setting_added" => {
            let payload_value: Value = event["payload"].clone();
            for (key, value) in payload_value.as_object().unwrap() {
                new_state
                    .as_object_mut()
                    .unwrap()
                    .insert(key.to_string(), value.clone());
            }
            return new_state;
        }
        _ => {
            println!("Unknown command: {}", event["type"].as_str().unwrap());
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

            // let mut data = HashMap::new();
            let data: HashMap<String, Value> = HashMap::from([
                ("sources".to_string(), json!({})),
                ("settings".to_string(), json!({})),
                ("collections".to_string(), json!({})),
                ("sessions".to_string(), json!({})),
                ("learnings".to_string(), json!({})),
            ]);
            let mut listeners: Vec<Box<dyn Fn(&str, &Value, &Value) + Send + Sync>> = Vec::new();

            let reducers = HashMap::from([
                (
                    "sources".to_string(),
                    (json!({}), sources_reducer as fn(Value, Value) -> Value),
                ),
                (
                    "sessions".to_string(),
                    (json!({}), state_identity as fn(Value, Value) -> Value),
                ),
                (
                    "learnings".to_string(),
                    (json!({}), state_identity as fn(Value, Value) -> Value),
                ),
                (
                    "settings".to_string(),
                    (
                        json!({}),
                        settings_reducer as fn(Value, Value) -> Value,
                    ),
                ),
                (
                    "collections".to_string(),
                    (json!({}), state_identity as fn(Value, Value) -> Value),
                ),
            ]);

            // for (name, attributes) in reducers.iter() {
            //     let (initial_state, _modify_fn) = attributes;
            //     let initial_data = read_file(
            //         app_data_dir
            //             .join(&format!("{}.json", name))
            //             .to_str()
            //             .unwrap(),
            //         initial_state.clone(),
            //     )
            //     .unwrap();
            //     let initial_json: Value = serde_json::from_str(&initial_data).unwrap();
            //     data.insert(name.to_string(), initial_json);
            // }

            // listeners.push(Box::new(create_persist_state_fn(&app.handle())));
            // listeners.push(Box::new(create_persist_event_fn(&app.handle())));

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let machine = Machine::new(data, reducers, Mutex::new(std::mem::take(&mut listeners)));

            println!("{}", machine.consume("app_initialized".to_string(), None));

            let events_str = read_file(
                app_data_dir.join("events.json").to_str().unwrap(),
                json!({}),
            )
            .unwrap();

            let events: HashMap<String, Value> = serde_json::from_str(&events_str).unwrap();
            let mut sorted_events: Vec<_> = events.values().collect();
            sorted_events.sort_by_key(|e| e["createTime"].as_u64());

            for event in sorted_events {
                let event_type = event["type"].as_str().unwrap().to_string();
                let payload = event["payload"].to_string();
                machine.consume(event_type, Some(payload));
            }

            machine.subscribe(Box::new(create_persist_event_fn(&app.handle())));
            app.manage(machine);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![dispatch])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
