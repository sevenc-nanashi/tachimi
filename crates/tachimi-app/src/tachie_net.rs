#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct TachieData {
    pub name: String,
    pub user: String,
    pub sha: String,
}
