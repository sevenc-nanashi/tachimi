#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct DirList {
    pub cli_path: std::path::PathBuf,
}

pub fn data_dir() -> std::path::PathBuf {
    let mut data_dir = dirs::data_dir().expect("Failed to get data directory");
    data_dir.push(std::env::var("TACHIMI_APP_NAME").unwrap_or_else(|_| "tachimi".to_string()));
    data_dir
}

pub fn data_path() -> std::path::PathBuf {
    let mut data_path = data_dir();
    data_path.push("data.json");
    data_path
}
