use serde_json::Value;
use std::collections::HashMap;
use std::sync::Mutex;

pub struct Machine {
    pub data: Mutex<HashMap<String, Value>>,
    pub reducers: HashMap<String, (Value, fn(Value, &str, &str) -> Value)>,
    pub listeners: Mutex<Vec<Box<dyn Fn(&str, &Value) + Send + Sync>>>,
}

impl Machine {
    pub fn new(
        data: HashMap<String, Value>,
        reducers: HashMap<String, (Value, fn(Value, &str, &str) -> Value)>,
        listeners: Mutex<Vec<Box<dyn Fn(&str, &Value) + Send + Sync>>>,
    ) -> Self {
        Self {
            data: data.into(),
            reducers,
            listeners,
        }
    }

    pub fn consume(&self, event: String, payload: Option<String>) -> String {
        let mut data = self.data.lock().unwrap();
        for (key, value) in data.iter_mut() {
            if let Some((_initial_value, reducer)) = self.reducers.get(key) {
                let updated_value = reducer(
                    value.clone(),
                    &event,
                    &payload.as_deref().unwrap_or_default(),
                );
                if *value != updated_value {
                    *value = updated_value.clone();
                    for listener in self.listeners.lock().unwrap().iter() {
                        listener(key, &updated_value);
                    }
                }
            }
        }

        serde_json::to_string(&*data).unwrap()
    }
}

pub struct State {
    pub data: Mutex<HashMap<String, Value>>,
    pub listeners: Mutex<Vec<Box<dyn Fn(&str, &Value) + Send + Sync>>>,
    pub reducers: HashMap<String, (Value, fn(Value, &str, &str) -> Value)>,
    pub consume: fn(
        String,
        Option<String>,
        &mut HashMap<String, Value>,
        &HashMap<String, (Value, fn(Value, &str, &str) -> Value)>,
        &[Box<dyn Fn(&str, &Value) + Send + Sync>],
    ) -> String,
}

pub fn consume(
    event: String,
    payload: Option<String>,
    data: &mut HashMap<String, Value>,
    reducers: &HashMap<String, (Value, fn(Value, &str, &str) -> Value)>,
    listeners: &[Box<dyn Fn(&str, &Value) + Send + Sync>],
) -> String {
    for (key, value) in data.iter_mut() {
        if let Some((_initial_value, reducer)) = reducers.get(key) {
            let updated_value = reducer(
                value.clone(),
                &event,
                &payload.as_deref().unwrap_or_default(),
            );
            if *value != updated_value {
                *value = updated_value.clone();
                for listener in listeners.iter() {
                    listener(key, &updated_value);
                }
            }
        }
    }

    serde_json::to_string(&*data).unwrap()
}
