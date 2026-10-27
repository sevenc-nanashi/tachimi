use anyhow::Context;
use tachimi_common::TachieApiResponse;

pub fn api_base() -> String {
    std::env::var("TACHIMI_API_BASE").unwrap_or_else(|_| "https://tachimi.sevenc7c.com".to_owned())
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
