# Unwritten World · CivBench

A civilization strategy game and an AI-agent evaluation environment. Human players, generic MCP clients, compatible model APIs and built-in C++ opponents share authoritative game rules and player-view permissions. The Web frontend uses the Universe/Renaissance presentation.

Current playable-preview development version: **v2.50.1**. The game, native AI, SDK, MCP/API adapters and reusable build/test tooling are available as source. See [licensing](docs/LICENSING.md).

[Download the Windows x64 playable preview](https://github.com/Assangejulian/unwritten-world-civbench/releases/tag/v2.50.1-preview.1). Extract the entire ZIP and open `Start.cmd`; runtimes and built-in opponents are included.

New worlds support rainfall presets, resource abundance and optional barbarians. Strategic resource locations appear only after the relevant technology is researched. See [World setup](docs/WORLD_SETUP.md).

## Run locally

For the Windows playable preview, extract the entire distribution and open `Start.cmd`. The candidate includes its runtimes and native opponents. See [Playable preview instructions](docs/PLAYABLE_PREVIEW.md). Maintainers can build a local candidate with `npm run package:windows`; the allowlisted ZIP and SHA-256 are written under ignored `dist/`. Packaging does not publish the repository or include its history, saves or test output.

Install Node.js 24+, Git LFS and PowerShell. From the repository root:

```powershell
git lfs install
git lfs pull
npm --prefix environment/mcp ci
powershell -NoProfile -ExecutionPolicy Bypass -File ./Setup-Compiler.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File ./launch.ps1 -Browser
```

Do not point an independent checkout or test server at an existing game's port or saves. Downloaded runtimes, compiled opponents and personal worlds are created locally and excluded from Git.

## Documentation

- [Documentation index](docs/README.md)
- [MCP and model API setup](docs/MCP_QUICKSTART.md)
- [MCP query guide](docs/MCP_QUERY_GUIDE.md)
- [License and third-party notices](docs/LICENSING.md)
- [Repository privacy and publication policy](docs/REPOSITORY_PRIVACY.md)

Runtime artwork is under `web/assets/`; authored art sources and provenance are under `art-source/`. Retain third-party licenses and credits when redistributing assets. Local agent conversations, workstation notes, screenshots, API credentials, context databases and saves are excluded from publication.

Project-authored code, documentation and assets use [Apache-2.0](LICENSE) unless a file or its associated notice states otherwise. Third-party materials retain their original licenses. Local test histories, AI review reports and legacy development documents are not public deliverables; reusable test scripts remain available to generate fresh results.

## Development checks

```powershell
npm run check:privacy
npm run check:publication
npm run check:frames
npm run check:render-review
npm run check:lighting-relief
```

Browser checks use a local Playwright installation, or `CIV_BROWSER_MODULES` for optional audit dependencies. `CIV_CHROMIUM_EXECUTABLE` can select an installed Chromium. These settings contain local paths and should stay in an ignored local configuration.
