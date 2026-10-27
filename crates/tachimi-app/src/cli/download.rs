use usage_rs::Args;

#[derive(Args)]
pub struct Download {}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct DownloadInfo {}

pub fn run(config: &crate::config::Config, _args: &Download) -> anyhow::Result<()> {
    Ok(())
}
