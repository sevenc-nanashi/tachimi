use anyhow::Context;
use usage_rs::Args;

#[derive(Args)]
pub struct ShallowFetch {}

pub fn run(config: &crate::config::Config, _args: &ShallowFetch) -> anyhow::Result<()> {
    let keys = installed_keys(config)?;
    let updates = if keys.is_empty() {
        crate::api::ShallowUpdatesApiResponse {
            revisions: std::collections::BTreeMap::new(),
        }
    } else {
        let mut response = ureq::get(format!(
            "{}/api/shallow-updates",
            crate::api::api_base().trim_end_matches('/')
        ))
        .query("keys", keys.join(","))
        .call()
        .context("Failed to fetch tachie updates")?;
        serde_json::from_reader(response.body_mut().as_reader())
            .context("Failed to parse tachie updates")?
    };
    println!("{}", serde_json::to_string_pretty(&updates)?);
    Ok(())
}

fn installed_keys(config: &crate::config::Config) -> anyhow::Result<Vec<String>> {
    let tachies = if config.tachie_dir.try_exists()? {
        super::list::list_tachies(config)?
    } else {
        Vec::new()
    };
    let mut keys: Vec<_> = tachies.iter().map(|tachie| tachie.key.clone()).collect();
    keys.sort_unstable();
    keys.dedup();
    Ok(keys)
}
