# インストール

Windows 向けの最新版をダウンロードできます。

<p id="release-status" role="status">最新版を確認中...</p>
<ul id="release-downloads"></ul>
<noscript>ダウンロードリンクを表示するには JavaScript を有効にしてください。</noscript>

## GUI アプリ

ダウンロードした GUI アプリの ZIP を展開し、`tachimi-gui.exe` を起動してください。
`tachimi.exe` は同じフォルダに置いたままにしてください。

## AviUtl2 プラグイン

`.au2pkg.zip` をダウンロードし、AviUtl2 にインストールしてください。

## YMM4 プラグイン

先に Tachimi GUI を一度起動してください。`.ymme` をダウンロードしてYMM4で開き、インストール後に再起動してください。ツールの「Tachimi」から利用できます。現行の.NET 10版YMM4／YMM4 Liteが対象です。

<script type="module">
  const status = document.getElementById("release-status");
  const downloads = document.getElementById("release-downloads");
  if (!status || !downloads) throw new Error("Release elements are missing");

  try {
    const response = await fetch("/api/updates", {
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 404) {
      throw new Error("リリースはまだ公開されていません。");
    }
    if (!response.ok) throw new Error("最新版の取得に失敗しました。時間をおいて再読み込みしてください。");
    const update = await response.json();
    status.textContent = `最新版: v${update.version}`;
    if (update.downloads.length === 0) {
      status.textContent += "（配布ファイルはまだ公開されていません）";
    }
    for (const download of update.downloads) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = download.url;
      link.textContent = download.name;
      item.append(link);
      downloads.append(item);
    }
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : String(error);
  }
</script>
