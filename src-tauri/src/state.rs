
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Mutex;

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
