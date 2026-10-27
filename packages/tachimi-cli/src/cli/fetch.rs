use anyhow::Context;
use usage_rs::Args;

#[derive(Args)]
pub struct Fetch {
    #[usage(long = "key")]
    pub key: String,
}

pub fn run(_config: &crate::config::Config, args: &Fetch) -> anyhow::Result<()> {
    let agent = ureq::Agent::new_with_defaults();
    let info = crate::api::fetch_info(&agent, &args.key)
        .with_context(|| format!("Failed to fetch updates for {}", args.key))?;
    let updates = tachimi_common::ShallowUpdatesApiResponse {
        revisions: std::collections::BTreeMap::from([(args.key.clone(), Some(info.idx))]),
    };
    println!("{}", serde_json::to_string_pretty(&updates)?);
    Ok(())
}
