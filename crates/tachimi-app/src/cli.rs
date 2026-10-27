pub mod list;
pub mod download;
pub mod version;
use usage_rs::{Cli, Subcommands};

#[derive(Cli)]
#[usage(bin = "tachimi", version = "0.1.0", completion)]
pub struct Greet {
    #[usage(subcommand)]
    pub command: Commands,
}

#[derive(Subcommands)]
pub enum Commands {
    Version(version::Version),
    List(list::List),
}
