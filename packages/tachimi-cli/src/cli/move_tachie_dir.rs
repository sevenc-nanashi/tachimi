use anyhow::Context;
use std::path::Path;
use usage_rs::Args;

#[derive(Args)]
pub struct MoveTachieDir {
    #[usage(long = "destination")]
    pub destination: String,
}

pub fn run(config: &crate::config::Config, args: &MoveTachieDir) -> anyhow::Result<()> {
    std::fs::create_dir_all(&config.tachie_dir)?;
    let source = config.tachie_dir.canonicalize()?;
    let destination = Path::new(&args.destination).canonicalize()?;
    anyhow::ensure!(
        !destination.starts_with(&source) && !source.starts_with(&destination),
        "移動元と移動先には、同じフォルダや親子関係のフォルダを指定できません"
    );
    anyhow::ensure!(
        !tachimi_common::data_dir()
            .canonicalize()?
            .starts_with(&source),
        "アプリの設定を含むフォルダは移動できません"
    );
    anyhow::ensure!(
        !std::fs::symlink_metadata(&config.tachie_dir)?.is_symlink()
            && !std::fs::symlink_metadata(&args.destination)?.is_symlink(),
        "リンクされたフォルダは移動先・移動元に指定できません"
    );
    anyhow::ensure!(
        std::fs::read_dir(&destination)?
            .next()
            .transpose()?
            .is_none(),
        "移動先には空のフォルダを選択してください"
    );
    let parent = destination
        .parent()
        .context("移動先の親フォルダがありません")?;
    let staging = tempfile::tempdir_in(parent)?;
    copy_directory(&source, staging.path())
        .context("立ち絵のコピーに失敗しました。元のデータは保持されています")?;
    std::fs::remove_dir(&destination).context("移動先の空フォルダを置き換えられませんでした")?;
    std::fs::rename(staging.path(), &destination)
        .context("コピーした立ち絵を配置できませんでした。元のデータは保持されています")?;
    crate::config::save_config(&crate::config::Config {
        tachie_dir: dunce::simplified(&destination).to_path_buf(),
    })
    .context("設定を保存できませんでした。元のデータと移動先のコピーは保持されています")?;
    std::fs::remove_dir_all(&source)
        .context("保存先は変更されましたが、元フォルダの削除に失敗しました")?;
    println!("{{}}");
    Ok(())
}

fn copy_directory(source: &Path, destination: &Path) -> anyhow::Result<()> {
    for entry in std::fs::read_dir(source)? {
        let entry = entry?;
        let target = destination.join(entry.file_name());
        let kind = entry.file_type()?;
        if kind.is_dir() {
            std::fs::create_dir(&target)?;
            copy_directory(&entry.path(), &target)?;
        } else if kind.is_file() {
            std::fs::copy(entry.path(), target)?;
        } else {
            anyhow::bail!(
                "リンクなどの特殊ファイルは移動できません: {:?}",
                entry.path()
            );
        }
    }
    Ok(())
}
