#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct RootData {
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

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct TachieInfo {
    pub dir: std::path::PathBuf,
    pub key: String,
    pub url: String,
    pub name: String,
    pub user: String,
    pub sha: String,
    pub parent_work: Option<ParentWork>,
    pub idx: usize,
    pub thumbnail: std::path::PathBuf,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct ParentWork {
    pub url: String,
    pub id: String,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct VersionInfo {
    pub version: String,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct DownloadInfo {}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct TachieApiResponse {
    pub title: String,
    pub user: String,
    pub sha: String,
    pub parent_work_url: Option<String>,
    pub thumbnail: String,
    pub approx_size: f64,
    pub date: String,
    pub idx: usize,
    pub download: String,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct ShallowUpdatesApiResponse {
    pub revisions: std::collections::BTreeMap<String, Option<usize>>,
}
