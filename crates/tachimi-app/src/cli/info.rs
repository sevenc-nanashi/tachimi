use usage_rs::Args;

#[derive(Args)]
pub struct Info {
    #[usage(long = "key")]
    pub key: String,
}

pub fn run(_config: &crate::config::Config, args: &Info) -> anyhow::Result<()> {
    let agent = ureq::Agent::new_with_defaults();
    let info = crate::api::fetch_info(&agent, &args.key)?;
    println!("{}", serde_json::to_string_pretty(&info)?);
    Ok(())
}
