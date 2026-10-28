fn main() -> std::io::Result<()> {
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=../tachimi-common/icon_flipped.ico");
    if std::env::var("CARGO_CFG_TARGET_OS").expect("Target OS is not set") == "windows" {
        winresource::WindowsResource::new()
            .set_icon("../tachimi-common/icon_flipped.ico")
            .compile()?;
    }
    Ok(())
}
