mod api;
mod cli;
mod config;

fn sync_data() -> anyhow::Result<()> {
    let data_path = tachimi_common::data_path();
    tracing::info!("Data path: {:?}", data_path);
    std::fs::create_dir_all(data_path.parent().expect("Failed to get parent directory"))?;
    serde_json::to_writer_pretty(
        std::fs::File::create(data_path).expect("Failed to create data file"),
        &tachimi_common::RootData {
            cli_path: std::env::current_exe().expect("Failed to get current executable path"),
        },
    )?;

    Ok(())
}

fn run_gui() -> anyhow::Result<()> {
    let cli_path = std::env::current_exe().expect("Failed to get current executable path");
    let gui_path = cli_path.with_file_name("tachimi-gui.exe");
    tracing::info!("GUI path: {:?}", gui_path);

    if !gui_path.exists() {
        anyhow::bail!("GUI executable not found: {:?}", gui_path);
    }

    std::process::Command::new(gui_path)
        .arg(std::env::current_exe().expect("Failed to get current executable path"))
        .spawn()?;

    Ok(())
}

fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_writer(std::io::stderr)
        .with_env_filter(
            tracing_subscriber::EnvFilter::builder()
                .with_default_directive(tracing::Level::INFO.into())
                .with_env_var("TACHIMI_LOG")
                .from_env()?,
        )
        .init();

    sync_data()?;

    if std::env::args().len() == 1 {
        // コマンド未指定時はGUIを起動する
        run_gui()?;

        return Ok(());
    }

    let cli = cli::Greet::parse();
    let config = config::load_config()?;
    match cli.command {
        cli::Commands::Version(version) => cli::version::run(&config, &version),
        cli::Commands::List(list) => cli::list::run(&config, &list),
        cli::Commands::Download(download) => cli::download::run(&config, &download),
        cli::Commands::Fetch(fetch) => cli::fetch::run(&config, &fetch),
        cli::Commands::Info(info) => cli::info::run(&config, &info),
        cli::Commands::ShallowFetch(fetch) => cli::shallow_fetch::run(&config, &fetch),
    }
}
