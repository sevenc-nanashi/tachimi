use anyhow::Context;

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct TachieApiResponse {
    pub title: String,
    pub user: String,
    pub sha: String,
    #[serde(rename = "parentWorkUrl")]
    pub parent_work_url: Option<String>,
    pub thumbnail: String,
    #[serde(rename = "approxSize")]
    pub approx_size: f64,
    pub date: String,
    pub idx: usize,
    pub download: String,
}

pub fn api_base() -> String {
    std::env::var("TACHIMI_API_BASE").unwrap_or_else(|_| "https://tachimi.sevenc7c.com".to_owned())
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct ShallowUpdatesApiResponse {
    pub revisions: std::collections::BTreeMap<String, Option<usize>>,
}
pub fn fetch_info(agent: &ureq::Agent, key: &str) -> anyhow::Result<TachieApiResponse> {
    let mut response = agent
        .get(format!("{}/api/tachie", api_base().trim_end_matches('/')))
        .query("key", key)
        .call()
        .context("Failed to fetch tachie information")?;
    serde_json::from_reader(response.body_mut().as_reader())
        .context("Failed to parse tachie information")
}
