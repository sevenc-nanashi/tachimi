use tachimi_common::{DownloadInfo, TachieApiResponse};

use anyhow::Context;
use std::io::Read;
use usage_rs::Args;

#[derive(Args)]
pub struct Download {
    #[usage(long = "key")]
    pub key: String,
}

pub fn run(config: &crate::config::Config, args: &Download) -> anyhow::Result<()> {
    anyhow::ensure!(
        !args.key.is_empty()
            && args
                .key
                .bytes()
                .all(|c| c.is_ascii_alphanumeric() || c == b'-' || c == b'_'),
        "Key must contain only ASCII letters, digits, hyphens, or underscores"
    );
    let agent = ureq::Agent::new_with_defaults();
    let info = crate::api::fetch_info(&agent, &args.key)?;

    std::fs::create_dir_all(&config.tachie_dir)?;
    let destination = config.tachie_dir.join(&args.key);
    let staging = tempfile::tempdir_in(&config.tachie_dir)?;
    download_archive(&agent, &info.download, staging.path(), &config.tachie_dir)?;
    let checksums = archive_checksums(staging.path(), staging.path())?;
    save_metadata(&agent, &args.key, info, staging.path())?;
    serde_json::to_writer_pretty(
        std::fs::File::create(staging.path().join(".tachimi/checksums.json"))?,
        &checksums,
    )?;
    if destination.try_exists()? {
        let checksum_path = destination.join(".tachimi/checksums.json");
        let previous: Vec<FileChecksum> = match std::fs::File::open(checksum_path) {
            Ok(file) => {
                serde_json::from_reader(file).context("Failed to read previous checksums")?
            }
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => Vec::new(),
            Err(error) => return Err(error).context("Failed to open previous checksums"),
        };
        let previous = previous
            .into_iter()
            .map(|entry| (entry.path, entry.sha256))
            .collect();
        preserve_changes(&destination, &destination, staging.path(), &previous)?;
    }
    let backup = tempfile::tempdir_in(&config.tachie_dir)?;
    let backup_path = backup.path().join("previous");
    let existed = destination.try_exists()?;
    if existed {
        std::fs::rename(&destination, &backup_path).context("Failed to back up existing tachie")?;
    }
    if let Err(error) = std::fs::rename(staging.path(), &destination) {
        if existed {
            if let Err(restore_error) = std::fs::rename(&backup_path, &destination) {
                let backup_path = backup.keep();
                anyhow::bail!(
                    "Failed to save tachie: {error}; failed to restore previous tachie: {restore_error}; backup retained at {:?}",
                    backup_path.join("previous")
                );
            }
        }
        return Err(error).context("Failed to save tachie");
    }
    println!("{}", serde_json::to_string_pretty(&DownloadInfo {})?);
    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize)]
struct FileChecksum {
    path: std::path::PathBuf,
    sha256: String,
}

fn checksum(path: &std::path::Path) -> anyhow::Result<String> {
    let mut file = std::fs::File::open(path)?;
    let mut hash = ring::digest::Context::new(&ring::digest::SHA256);
    let mut buffer = [0; 8192];
    loop {
        let count = file.read(&mut buffer)?;
        if count == 0 {
            break;
        }
        hash.update(&buffer[..count]);
    }
    Ok(hash
        .finish()
        .as_ref()
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect())
}

fn archive_checksums(
    root: &std::path::Path,
    dir: &std::path::Path,
) -> anyhow::Result<Vec<FileChecksum>> {
    let mut checksums = Vec::new();
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let file_type = entry.file_type()?;
        if file_type.is_dir() {
            checksums.extend(archive_checksums(root, &path)?);
        } else if file_type.is_file() {
            checksums.push(FileChecksum {
                path: path.strip_prefix(root)?.to_path_buf(),
                sha256: checksum(&path)?,
            });
        } else {
            anyhow::bail!("Unsupported archive entry: {:?}", path);
        }
    }
    Ok(checksums)
}

fn preserve_changes(
    root: &std::path::Path,
    dir: &std::path::Path,
    staging: &std::path::Path,
    previous: &std::collections::HashMap<std::path::PathBuf, String>,
) -> anyhow::Result<()> {
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let relative = path.strip_prefix(root)?;
        if relative == std::path::Path::new(".tachimi") {
            continue;
        }
        let target = staging.join(relative);
        let file_type = entry.file_type()?;
        if file_type.is_dir() {
            if target.try_exists()? && !target.is_dir() {
                anyhow::bail!("更新先と既存フォルダが衝突しています: {:?}", relative);
            }
            std::fs::create_dir_all(&target)?;
            preserve_changes(root, &path, staging, previous)?;
        } else if file_type.is_file() {
            if let Some(old_checksum) = previous.get(relative) {
                if checksum(&path)? == *old_checksum {
                    continue;
                }
            }
            if target.try_exists()? {
                anyhow::bail!("更新先と変更済みファイルが衝突しています: {:?}", relative);
            }
            std::fs::copy(&path, &target)?;
        } else {
            anyhow::bail!("Unsupported existing entry: {:?}", relative);
        }
    }
    Ok(())
}

fn download_archive(
    agent: &ureq::Agent,
    url: &str,
    destination: &std::path::Path,
    temp_dir: &std::path::Path,
) -> anyhow::Result<()> {
    let mut archive_file = tempfile::tempfile_in(temp_dir)?;
    let mut response = agent.get(url).call().context("Failed to download ZIP")?;
    std::io::copy(&mut response.body_mut().as_reader(), &mut archive_file)?;
    let mut archive = zip::ZipArchive::new(archive_file).context("Failed to open ZIP")?;
    archive
        .extract(destination)
        .context("Failed to extract ZIP")
}

fn save_metadata(
    agent: &ureq::Agent,
    key: &str,
    info: TachieApiResponse,
    destination: &std::path::Path,
) -> anyhow::Result<()> {
    let metadata_dir = destination.join(".tachimi");
    std::fs::create_dir(&metadata_dir)?;
    let mut response = agent
        .get(&info.thumbnail)
        .call()
        .context("Failed to download thumbnail")?;
    std::io::copy(
        &mut response.body_mut().as_reader(),
        &mut std::fs::File::create(metadata_dir.join("thumbnail.png"))?,
    )?;
    serde_json::to_writer_pretty(
        std::fs::File::create(metadata_dir.join("data.json"))?,
        &super::list::TachieData {
            key: key.to_owned(),
            url: format!("https://tachie.net/w/{key}"),
            name: info.title,
            user: info.user,
            sha: info.sha,
            parent_work_url: info.parent_work_url,
            idx: info.idx,
        },
    )?;
    Ok(())
}
