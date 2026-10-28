use anyhow::Context;
use usage_rs::Args;

#[derive(Args)]
pub struct Delete {
    #[usage(long = "key")]
    pub key: String,
}

pub fn run(config: &crate::config::Config, args: &Delete) -> anyhow::Result<()> {
    let dir = super::list::find_tachie_dir(config, &args.key)?
        .with_context(|| format!("立ち絵が見つかりません: {}", args.key))?;
    std::fs::remove_dir_all(&dir)
        .with_context(|| format!("立ち絵を削除できませんでした: {:?}", dir))?;
    println!("{{}}");
    Ok(())
}
