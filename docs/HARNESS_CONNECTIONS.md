# Local harness connections

New Game recognizes **40 registered local harness/client families**. The registry is `src/environment/harness-catalog.mjs`; binding and configuration are in `src/environment/harnesses.mjs`. Discovery checks explicit known profile, executable and PATH traces. These are installation/configuration traces, not proof that a product, account, model or MCP session is ready. The list is extensible, not a universal market inventory.

| Capability | Families |
| --- | --- |
| Default/shared configuration or overlay (11) | WorkBuddy, Antigravity, Claude Code, Kimi Code, ZCode, DeepSeek Harness, Cursor, Windsurf/Cascade, Gemini CLI, Qwen Code, Kiro |
| Isolated workspace/session configuration (12; overlaps the preceding row) | WorkBuddy, Claude Code, Kimi Code, DeepSeek Harness, Codex, Cursor, Gemini CLI, OpenCode, Qwen Code, CodeBuddy CLI, VS Code/Copilot, Kiro |
| Discovery and manual import only (25) | Claude Desktop, Cline, Roo Code, Kilo Code, Continue, GitHub Copilot CLI, Trae, Qoder, Zed, LM Studio, Cherry Studio, Chatbox, ChatWise, Jan, Msty, Goose, Amp, Factory Droid, Crush, Warp, AnythingLLM, OpenClaw, Augment/Auggie, Devin Local/CLI, JetBrains/AI Assistant |

Manual-only entries never rewrite guessed database/settings formats. Web-only/cloud services and arbitrary remote installations have no uniform local trace to discover. HTTP-only clients need a separate MCP transport bridge; this update does not publish a network service. WSL installations are a distinct environment.

The original default configuration adapters remain:

| Client | Default user configuration | Setup |
| --- | --- | --- |
| WorkBuddy | `.workbuddy/mcp.json`, `mcpServers` | Merge the game entry |
| Antigravity | `.gemini/config/mcp_config.json`, `mcpServers` | Merge the game entry |
| Claude Code | `.claude.json`, `mcpServers` | Merge a user-scope stdio entry; start `claude` in a terminal |
| Kimi Code | `.kimi-code/mcp.json`, `mcpServers` | Merge the game entry; start `kimi` in a terminal |
| ZCode | `.zcode/cli/config.json`, `mcp.servers` | Merge the native nested configuration |
| DeepSeek Harness | Game-owned `.civbench/connections/deepseek-harness.patch.json` | Generate a JSON-as-YAML `--patch` overlay; leave existing profiles intact |

`CLAUDE_CONFIG_DIR`, `KIMI_CODE_HOME` and `DSH_HOME` are honored when set in the game's environment. CLI discovery also checks PATH and conventional user-local executable directories; it does not execute those commands. A detected profile can be a leftover installation trace. Discovery does not establish authentication, model readiness or a running agent. Workspace overrides and custom installations may still require manual configuration.

## Player flow

1. Choose turn-based play and assign each external civilization to **External AI (MCP)**.
2. Open **Connection method**, select a detected client, then **Configure connection**.
3. Open that client, choose its model, enable/refresh the CivBench MCP, and start a new conversation. On first installation the client may require its own MCP refresh or restart; the game does not restart it.
4. Ask it to call `game_session`. Wait for the game's actual connected indicator before starting the match.

### Multiple sessions in one client

Choose **Independent session** for each civilization. This is the default for clients with verified workspace formats. Each instance gets its own game-owned working directory, MCP configuration and binding file under `.civbench/connections/instances/<id>/`. **Copy directory** gives the directory to open in the harness. Start a new conversation in that directory and choose its model there. A WorkBuddy/DeepSeek conversation in one directory and a WorkBuddy/Kimi conversation in another can therefore address different civilizations in the same world. Two instances may report the same model ID without affecting routing.

```text
Civilization 1 -> WorkBuddy -> Independent session -> directory A
Civilization 2 -> WorkBuddy -> Independent session -> directory B
Civilization 3 -> Codex     -> Independent session -> directory C
Civilization 4 -> Codex     -> Independent session -> directory D
```

The directory and configuration scope provide isolation, not the model name, tab title or an inferred private conversation ID. Two ordinary conversations in the same workspace can still share a tool set and binding. The game does not attach to arbitrary pre-existing conversations. A client must actually respect its per-project/per-process configuration; the runtime tests below establish protocol/configuration behavior, not every product/version's conversation implementation.

Codex instances write `.codex/config.toml`; the project must be trusted before Codex loads it. They also generate `Start-Codex.ps1` plus `Start-Codex.mjs` for explicit per-process MCP overrides without editing shared TOML. Run the PowerShell script in its directory for a CLI session; extra CLI/model arguments are forwarded. Alternatively, run `node Start-Codex.mjs`. The Node helper preserves embedded TOML quotes on Windows PowerShell 5 as well as PowerShell 7, propagates errors and relies on an available Codex CLI executable. No launcher is run automatically. For the Desktop app, open the separate directory, trust the project and start a new chat.

Claude Code instances use `.mcp.json`; the setup message gives `claude --strict-mcp-config --mcp-config .mcp.json` so the session uses the explicit server file. Kimi uses `.kimi-code/mcp.json`; WorkBuddy uses `.workbuddy/mcp.json`; VS Code uses `.vscode/mcp.json` with `servers`; OpenCode uses `opencode.json` with local command arrays; other formats follow their documented workspace locations. DSH uses the instance-specific patch filename instead of the shared path in the next section.

Reconfiguring the same civilization reuses its instance and leaves the generated configuration unchanged. Edited generated configurations reject rather than being overwritten. Unbind revokes only that instance. Pending-world cancellation/world cleanup revokes only bindings for that world. A transport follows its own binding across allowed world changes and rejects old-world commands. The discovery response hides instance paths and credentials; an authorized bind response returns only that instance's working directory so the host can open/copy it.

GUI launch is offered only for an identified running desktop executable. Claude Code, Kimi Code and DeepSeek Harness are started manually in a terminal; the game does not spawn terminal windows, submit prompts or select models.

### DeepSeek Harness overlay

Choose **DeepSeek Harness → Generate connection overlay**. The game writes a private patch list, with one `@deepseek-ai/dsh-mcp-client` insertion named `civbench_game`. It contains the Node stdio adapter and `CIV_BINDING_FILE`; it does not copy model/provider settings or modify `cordis.patch.yml`. Append `--patch` and the absolute generated filename to the existing launcher command. For a normal Windows Node CLI installation, for example:

```powershell
dsh web --patch "$env:USERPROFILE\.civbench\connections\deepseek-harness.patch.json"
```

Keep any existing profile, port and other required launcher options. The chosen DSH profile must provide the MCP client package. Restarting/reloading that profile and initiating its conversation remain user actions. This overlay is startup configuration, not automatic attachment to an already running DSH conversation. Desktop-owned profiles have their own launcher restrictions; do not assume the generic Node CLI can boot the reserved desktop profile.

Native Windows, WSL and remote clients have separate filesystem/runtime contexts. The generated overlay targets the game's local OS. A WSL/remote harness needs accessible adapter/binding paths and a Node executable in its own environment, or a separate bridge. Windows process discovery does not enumerate tools installed only inside WSL.

Model lists, subscriptions, authentication and model selection remain in the harness. MCP does not standardize those capabilities. The game neither guesses models nor reads provider keys to populate a fake model selector. The separate Model API controller continues to use its own provider settings.

### Automatic MCP names

New MCP civilizations use a read-only automatic name. Before a model identity is reported, the label is `待识别`; WorkBuddy or Antigravity is a client brand and is never substituted as a selected model. API civilizations keep their editable, user-supplied display name; editing their provider model ID does not rewrite it.

The adapter asks the client/model to include its actual model ID in `game_session({model: "actual-model-id"})` on first use and after switching models. This updates only that civilization's automatic display name, records the full ID, and preserves its current credential and world. Existing client heartbeats preserve the most recent report. A new client identity without a model clears an old automatic label rather than attributing its work to the previous model. Legacy/manual controllers and API labels are not rewritten by these reports.

This is reported model identity, not independent provider attestation. Standard MCP initialize identifies the harness, not its selected model. A harness/model that does not disclose its model ID remains `待识别`; the game cannot guarantee immediate synchronization with an unexposed model-picker event. No private conversation store, account data or provider key is scraped to guess a name. A harness with an explicit model-selection bridge can report the same field automatically.

Long model IDs are kept in full in controller metadata and clipped to 24 characters for the existing leader badge. Updates are recorded in deterministic replay and do not reveal an unmet opponent's model label. Setup polling reflects the server label without changing the pending-match settings or recreating the world.

Default/shared mode still permits only one civilization per registered client profile. Independent instances permit multiple civilizations from the same harness family. Different conversations alone do not establish credential isolation. Models, provider accounts and game civilizations are separate identities.

## Configuration and world changes

Supported JSON locations are listed above, relative to the current user's home unless an explicit supported data-root override is set.

The game merges a `civbench_game` server entry, preserves unrelated MCPs and settings, and backs up exact original bytes before writing. Invalid JSON or a conflicting non-game entry is rejected without overwriting it. Recognized legacy entries for this same game adapter are migrated to the persistent entry; an active connection to another civilization is refused. A client configuration editor should be closed or saved before configuring from the game.

ZCode's native settings use `mcp.servers`, not `mcpServers`. When native servers are empty, ZCode falls back to `.agents/mcp.json`; introducing a first native server would disable that fallback. The game therefore carries the effective fallback servers into native settings before adding itself, preserves unrelated native settings, and leaves the fallback file untouched. Malformed native/fallback structures reject. A conflicting existing DSH patch is also rejected rather than replaced.

The persistent server entry uses the existing Node stdio adapter and `CIV_BINDING_FILE`. Private bindings and configuration backups live in the user's `.civbench/connections/` directory outside the repository. A binding contains only one civilization's credential, match ID and epoch. Host and observer credentials are never included. Backups may contain the client's existing secrets and must remain private.

The adapter reads its binding per request. The game can therefore update a world without changing the client entry or replacing an initialized MCP transport. An in-flight request keeps its original destination. Old observation tokens and explicit old match IDs/epochs remain invalid in the new world. A live match cannot be silently reassigned; use **Unbind** first. Canceling or replacing a pending lobby removes its bindings, while the persistent client entry remains reusable.

The old `CIV_MATCH_URL` / `CIV_MATCH_TOKEN` environment mode remains supported for other harnesses and managed API players. Automatic setup does not alter gameplay rules or add privileged model tools.

## Authority and connection status

Discovery, binding, unbinding and opening clients are host-authorized lobby operations. A seat or observer cannot invoke them. Discovery replies contain capability states and client names, never resolved personal paths or credentials. The DSH setup message names its conventional relative overlay location. **Configured** means the local files were written; **Connected** requires actual MCP activity. Client identity is reported through MCP initialization and its existing heartbeat.

Client discovery checks known profile locations and running Windows executable identities. Only known, discovered clients can be opened; no caller-supplied executable or shell command is accepted. A closed client at an unknown custom installation location can still be configured but must be opened from the desktop. Other platforms can use detected profile files and manual launch.

MCP restricts game information and actions by civilization. An external harness's independent filesystem, shell or browser capabilities require its own permissions when conducting a strict benchmark; this connector is not an operating-system sandbox.

## Validation

`npm run check:harness-connections` uses disposable client profiles and real MCP SDK subprocesses. Thirteen groups cover the existing shared flows, six-family fixture discovery, direct/manual/workspace selection, model/replay behavior, two actual same-brand isolated WorkBuddy transports in the same match, correct directory copy controls, selective unbind and 1440/390px layout. Fixtures are fresh per run, and obsolete test transports are closed before the identity test to avoid contaminating its shared binding.

`npm run check:harness-expansion` checks all four added formats, exact backups, unrelated settings, ZCode fallback migration, malformed/conflicting configuration refusal, data-root/PATH discovery and terminal launch restrictions. Four actual SDK subprocesses use the generated entries to found cities and alternate two complete rounds. These identities simulate the four harnesses at the protocol boundary; they are not paid model sessions inside those products.

`npm run check:harness-instances` has seven groups covering all40 discovery rules, twelve workspace formats, two WorkBuddy plus two Codex transports with repeated brand/model identities, two complete rounds of actual play, cross-seat short/full-token rejection, fog, idempotence, traversal/wrong-family/modified-file refusal, independent world changes and selective revocation. Sixteen SDK subprocesses are used in total. Native local Codex CLI probes additionally confirm two distinct per-process bindings and execute the generated launchers with `mcp get` only. Untrusted project configuration stays disabled until user approval. These checks do not start Desktop chats or paid model turns.

Existing lobby/API regression checks cover manual exports, model API players and in-game stop/resume. A complete game restart loads the expanded backend registry; refreshing the page alone cannot update a running old server. No installed client configuration, live game, model task or provider account is changed merely by installing this source update.

## Format references

- [Claude Code MCP](https://code.claude.com/docs/en/mcp): stdio and user-scope `.claude.json`.
- [Kimi Code MCP](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/mcp): user/project `mcp.json` and `KIMI_CODE_HOME`.
- [ZCode MCP](https://zcode.z.ai/en/docs/mcp-services): native `mcp.servers`, `.agents` fallback and precedence.
- [DeepSeek Harness CLI](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/README.md) and [MCP client](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/mcp/mcp-client/README.md): `--patch`, insertion lists and stdio configuration.
- [WorkBuddy MCP scopes](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/MCP-Guide): user/project `.workbuddy/mcp.json`.
- [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp) and [configuration layers](https://learn.chatgpt.com/docs/config-file/config-basic): trusted project TOML and command-line overrides.
- [Cursor MCP](https://prod.cursor.com/docs/mcp), [Gemini CLI MCP](https://geminicli.com/docs/tools/mcp-server/), [OpenCode MCP](https://opencode.ai/docs/mcp-servers/), [Qwen Code configuration](https://qwenlm.github.io/qwen-code-docs/en/users/configuration/settings/), [VS Code MCP](https://code.visualstudio.com/docs/agents/reference/mcp-configuration), and [Kiro MCP](https://kiro.dev/docs/mcp/configuration/): workspace formats.
- [Windsurf legacy Cascade](https://docs.devin.ai/desktop/cascade/mcp): the legacy JSON config is distinct from the newer Devin Local agent configuration.
- [Cline MCP](https://github.com/cline/cline/blob/main/docs/mcp/mcp-overview.mdx), [Kilo MCP](https://kilo.ai/docs/automate/mcp/using-in-kilo-code), [Continue MCP](https://docs.continue.dev/customize/deep-dives/mcp), [Copilot CLI MCP](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers), [LM Studio MCP](https://beta.lmstudio.ai/docs/app/mcp), and [OpenClaw MCP](https://docs.openclaw.ai/mcp): broader client support and format/version differences. Detection-only entries remain manual until their writer/instance format is independently adapted.
