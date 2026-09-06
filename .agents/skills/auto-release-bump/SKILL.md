---
name: auto-release-bump
description: Automatically bumps patch version in tauri.conf.json & package.json, commits changes, and pushes git tag to trigger Tauri Auto-Updater release workflow.
---

# Auto Release Bump Skill

Use this skill whenever the user asks to release a new version, bump version, or push an update release for AutoCommitPush.

## Workflow Instructions

When invoked or requested to release an update or push code:

1. **Read current version** from `src-tauri/tauri.conf.json` and `package.json`.
2. **Calculate next patch version** (e.g., `1.0.3` -> `1.0.4`, `1.0.4` -> `1.0.5`).
3. **Update version strings** in:
   - `src-tauri/tauri.conf.json` (`"version": "X.Y.Z"`)
   - `package.json` (`"version": "X.Y.Z"`)
4. **Execute Release Git Commands (PowerShell Compatible)**:
   Run the following terminal commands sequentially (using `;` as command separator for Windows PowerShell):
   ```powershell
   git add . ; git commit -m "Release vX.Y.Z {commit message / details}" ; git push ; git tag vX.Y.Z ; git push origin vX.Y.Z
   ```
5. **Notify the User**:
   Confirm to the user that version `vX.Y.Z` has been bumped, tagged, and pushed to GitHub. Remind them that GitHub Actions is building the `.exe` installer and `latest.json` on the cloud (takes ~3-5 mins), after which users can auto-update directly in the app.
