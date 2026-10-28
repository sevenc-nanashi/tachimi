# tachimi-ymm4 / tachimi.ymme

Tachimi でダウンロードした立ち絵を YMM4 のタイムラインに配置したり、配置した立ち絵から親作品一覧を取得するための YMM4 プラグイン。

## ビルド

```
bun run download:ymm4
dotnet build -c Debug
bun run create-symlink
dotnet format
```
