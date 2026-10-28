pub mod delete;
pub mod download;
pub mod fetch;
pub mod info;
pub mod list;
pub mod move_tachie_dir;
pub mod shallow_fetch;
pub mod version;
use usage_rs::{Cli, Subcommands};

#[derive(Cli)]
#[usage(bin = "tachimi", completion)]
pub struct Greet {
    #[usage(subcommand)]
    pub command: Commands,
}

#[derive(Subcommands)]
pub enum Commands {
    Ui,
    Version(version::Version),
    List(list::List),
    Config,
    MoveTachieDir(move_tachie_dir::MoveTachieDir),
    Download(download::Download),
    Delete(delete::Delete),
    Fetch(fetch::Fetch),
    Info(info::Info),
    ShallowFetch(shallow_fetch::ShallowFetch),
}
