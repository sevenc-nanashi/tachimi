#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
#[serde(default)]
pub struct Config {
    pub tachie_dir: std::path::PathBuf,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            tachie_dir: tachimi_core::data_dir().join("tachies"),
        }
    }
}

pub fn load_config() -> anyhow::Result<Config> {
    let config_path = tachimi_core::data_path();

    if !config_path.exists() {
        let default_config = Config::default();
        std::fs::create_dir_all(
            config_path
                .parent()
                .expect("Failed to get parent directory"),
        )?;
        serde_json::to_writer_pretty(
            std::fs::File::create(&config_path).expect("Failed to create config file"),
            &default_config,
        )?;
        return Ok(default_config);
    }

    let config_file = std::fs::File::open(&config_path).expect("Failed to open config file");
    let config: Config = serde_json::from_reader(config_file).expect("Failed to parse config file");
    Ok(config)
}
