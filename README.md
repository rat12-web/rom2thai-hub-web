# ROM2THAI · Public Project Hub

**https://rat12-web.github.io/rom2thai-hub-web/**

Private read scope was explicitly approved by the owner on 2026-10-14.
A repository-scoped read-only deploy key and `HUB_READ_SSH_KEY` Actions secret
are installed. The key can read the whole private Hub; sparse checkout and public
allowlists restrict the workflow output to the status catalog and four UI assets.
The key cannot write to the private Hub. Real workflow evidence is in
[docs/QA_REPORT.json](docs/QA_REPORT.json).

**Authenticated cloud sync verified:** private read → allowlisted export → public
bot commit → Pages deploy → actual HTTP 200/Chrome desktop/mobile.
[Successful run](https://github.com/rat12-web/rom2thai-hub-web/actions/runs/38521776101).
The first read-only checkout run failed because credential cleanup requested an
uncached `.gitmodules` blob; sparse checkout now includes that metadata privately.
It is never exported. No need to keep the owner's Windows machine running.

Public, sanitized status dashboard. Authoritative source:
`rat12-web/thai-rom-cloud/main` (private). No ROM, BIOS, inventories,
original game scripts, credentials or private caches in this repository/site.

The scheduled public-repository GitHub Actions job checks the private Hub every
five minutes using a repository-scoped **read-only deploy key**. It exports only
allowlisted status fields and four authored UI files. Changed outputs are committed
and deployed in that same workflow. `GITHUB_TOKEN` is used only for this public
repository. No private Actions runners, paid APIs or external sync server required.

Open browsers check status.json every 60 seconds and on returning to the tab.
Sync is eventual, not instantaneous; GitHub scheduled runs can be delayed.
GitHub may disable schedules after 60 days of repository inactivity: re-enable
the workflow if needed. See Actions for failures; old data remains dated/hash-locked.
The visible source commit links to the private Hub for authorized owners.

Unknown percentages remain unknown; scoped pilot/draft counts are not whole-game
completion. Follow the scopes/qualifications in each game detail panel.

Manual refresh: Actions → Sync private Hub status and publish Pages → Run workflow.
Key rotation: replace the private Hub deploy key (read_only=true) and this repo's
`HUB_READ_SSH_KEY` Actions secret. Never put the key in code, logs or Pages artifacts.
