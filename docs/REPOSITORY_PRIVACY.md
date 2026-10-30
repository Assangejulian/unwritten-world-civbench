# Repository privacy and publication

| Publish after review | Keep local |
| --- | --- |
| Game source, tests, SDK and generic MCP implementation | API keys, seat/observer credentials, authenticated model configuration |
| Reusable setup, architecture and rule documentation | `Model_work/`, agent conversations, machine/session notes and private reviews |
| Runtime assets, authored art and required attribution | Saves, browser profiles, model context/SQLite databases and gameplay transcripts |
| Pinned tool versions, checksums and licenses | Downloaded tools, dependencies, generated binaries, logs and screenshots |

The public project license is Apache-2.0; third-party components retain their original terms. Historical test reports, AI comparison results, model/agent review reports and old root-level feature documents remain local. Public documentation is curated under `docs/`. Reusable test code remains public; each user can generate their own outputs. `scripts/publication-policy.mjs` is the shared boundary checked by source/privacy and distribution tooling.

Public documents use repository-relative paths or explicit placeholders. Scripts resolve local tools through installed packages or environment variables. Never encode a person's home folder, credential-file location or private service endpoint in a public script.

Art provenance may use `local-cache:<source filename>` for an original generated file that remains outside the repository. This is a source identifier, not a repository file path. Archived source/runtime paths and their hashes remain the reproducible asset references. The scanner also recognizes JSON-escaped Windows paths.

Third-party copyright notices, author contacts and licenses are intentional public attribution. Do not remove them as personal data. Usernames, account identifiers and paid-play transcripts in internal collaboration documents remain private by default. Promote useful technical knowledge into `docs/` after review instead of publishing an entire work log.

## Before a push

Run `npm run check:privacy`, review `git diff --cached`, and check new files separately. The scanner reports categories and locations, never secret values. Pattern scanning is a guardrail, not a guarantee that every sensitive string is recognized. Review images and binary files manually before publishing them.

`.gitignore` prevents adding ignored files; it does not untrack files already in the index. Removing a file with `git rm --cached` keeps the local copy and excludes it from the next committed tree. It does not erase earlier commits, tags, other branches, clones or remote caches.

Internal notes existed in previous commits. Future cleanup commits do not make those earlier versions private. If an actual credential was published, revoke or rotate it first. History rewriting and force-pushing require a separate coordinated operation; routine cleanup must not rewrite history or delete collaborators' work.

No repository upload or history rewrite is implied by a local privacy check.
