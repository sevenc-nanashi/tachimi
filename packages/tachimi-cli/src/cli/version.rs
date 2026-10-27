use tachimi_core::VersionInfo;

use usage_rs::Args;

#[derive(Args)]
pub struct Version {}

pub fn run(_config: &crate::config::Config, _args: &Version) -> anyhow::Result<()> {
    let version_info = VersionInfo {
        version: env!("CARGO_PKG_VERSION").to_string(),
    };
    println!("{}", serde_json::to_string_pretty(&version_info)?);
    Ok(())
}
