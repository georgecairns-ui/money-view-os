# Maintaining Money View OS

For people developing the kit itself. Customers never need this folder, but it is public on GitHub, so keep it free of anything private.

## What this project is

Money View OS is a tool of the small business toolkit, built the same way as Task List OS (the reference build), Pipeline OS and Content Machine OS (the direct template). A small business owner asks Claude to clone it, opens it in Claude Code and types `/setup`. It shows their money month by month: what's invoiced and due, what's been paid, what's coming in and going out over the next 12 weeks, and what to put aside for tax. They raise invoices in it, and it works with whatever accounts software they use.

- **Claude never moves money.** The app works out how much to set aside, shows "Move £X to your Tax pot" with a button that opens the person's bank, and an "I've moved it" button that logs the move. Moving money between pots needs a write permission no read-only feed has, and Claude never has it.
- **Money View works on top of a supported accounts app and needs one.** Supported: Xero (fully) and QuickBooks (only when the person's Claude shows Intuit's QuickBooks connector; Intuit says US customers only for now). FreeAgent, Sage and anything else are not supported yet: setup says so in one plain paragraph and stops. There is no export or CSV fallback anywhere. Every invoice lives in the accounts app. The bank is seen only through the bank feed inside it, and that feed is required.
- **Claude never types a total, a forecast or a tax figure.** The app does, in `apps/money/app/model.js`, from records Claude writes. Every figure on screen carries where it came from and when.
- **Claude never sends, approves or deletes an invoice.** The owner starts one in Money View. "Put it in Xero as a draft" asks Claude to create a draft in the accounts software (only through a connection that can); the owner checks and sends it from there. Where the connection only reads, Money View opens the accounts app's new invoice page (`MV.model.APPS`) and the invoice arrives on the next refresh.
- **No bank details are ever stored.** Never a login, sort code, account number or card number. The only key is the optional Xero drafts codes, saved with `setup/scripts/save-key.sh` or `.ps1` into the computer's secure store.

`maintainers/SPEC.md` is the build spec (data shape, the model, pages, skills, setup, attaching) and it is the contract. `maintainers/BUILD-PROMPT.md` has the 7 October prompt. Where the spec and the template differ, the template's pattern was copied and the spec notes it.

The tool's id is `money`, its folder is `apps/money/`, its code namespace is `window.MV`, its sidebar icon is `wallet` and its repository is `money-view-os`. `media` is not set: there are no photos or videos.

## Stack

- Same as the other toolkit OSs: no framework, no build step, nothing from the internet. Shared parts (`apps/server/`, `apps/shared/`, `apps/home/`, `ATTACHING.md`, `setup/scripts/start-app.*`, `setup/scripts/autostart-*`, `setup/scripts/save-key.*`, plus the shared skills `open-the-app`, `get-updates`, `connect-a-tool`, `human-email`, `polite-chaser`, `write-like-me`, `sort-brain-dump` and `setup`) are copied from the other tools, with the Money View OS exceptions listed under "Money View OS stands alone" below. **Never change them here: change them in Task List OS first, raise the shared version, then copy the change to every tool.** `SHARED-V3-CHANGES.md` through `SHARED-V11-CHANGES.md` are the exact record of what's shared and what each tool keeps for itself (they describe the full toolkit and are not edited here, so where they list `file-it`, `open-task-list`, `start-task-list.*` or the other connection guides, this file wins); read them in order. This kit is at shared version 11. Exceptions that are deliberately this tool's own: the `money` entry's description in `apps/shared/catalogue.json` (see `SHARED-CATALOGUE-RENAME.md`), the connection guides this tool added or rewrote in `setup/connections/` (`xero-drafts.md`, `bank-feeds.md`, the short "not supported yet" notes `sage.md` and `freeagent.md`, the Money View wording in `xero.md` and `quickbooks.md`, plus rows in `setup/connections/README.md`), the description line of the `setup` skill and the wording of `setup/05-get-to-know-the-business.md`, which name this tool. Copy those changes back to the shared copies only when they are wanted everywhere.
- `apps/money/` is this tool's own folder: `index.html`, `menu.json` (the page and the Home scripts), `home-boxes.js` (5 boxes, all off to start), `claude-jobs.json` (the 4 jobs below), `CLAUDE.md` (Claude's reference for the data), `ATTACH-CLAUDE.md` (what's copied into another folder's `CLAUDE.md` when attached) and `data/money.json`.
- `apps/money/app/`: `model.js` (pure functions, no DOM, also runs under Node: every figure on screen), `components.js`, `chart.js`, `drawer.js`, `settings.js`, the `view-*.js` views (Overview, Months, Invoices, In and out, What if) and `app.js` (the rail and the one page), with `app.css`. Every number the app shows is worked out in `model.js` from the raw data, never typed.
- There is no demo mode and no sample data (shared version 6 removed it from every tool): a fresh install shows a "Let's set up your money view" card with the phrase to say to Claude.

## Money View OS stands alone (George, 21 October 2026)

George: "The Money View OS should be a repository on its own... it needs to just be the Money View OS, and that's it." The kit was made from Content Machine OS, which came from Task List OS, so it carried parts Money View never uses. They were taken out. The originals still live in the other toolkit repositories, and `make-release.sh` refuses any of them coming back.

**Removed**

- 16 connection guides in `setup/connections/`: calendly, fathom, fireflies, gmail-and-google-calendar, google-drive, granola, hubspot, microsoft-365, notion, otter, pipedrive, read-ai, slack, stripe, tldv, zoom. Kept: `README.md` (rewritten to list only the rest), `xero.md`, `xero-drafts.md`, `quickbooks.md`, `freeagent.md`, `sage.md`, `bank-feeds.md`.
- The `file-it` skill (nothing in Money View sends a document anywhere) and the `files/` folders `01-admin`, `02-clients`, `03-sales`, `04-marketing`, `06-operations`, `07-team` and `08-projects`. Kept: `files/05-finance` and `files/99-archive`.
- `context/priorities.md` and `context/routines.md`. Nothing Money View uses reads them. Kept: `business.md`, `money.md`, `people.md` and `voice.md` (`polite-chaser`, `who-owes-me-money`, `human-email` and `write-like-me` read them to set the tone of a reminder) and `tools.md` (the connections).

**Renamed, then renamed again**

- `setup/scripts/start-task-list.sh` and `.ps1` were renamed `start-money-view.sh` and `.ps1`, and the skill `open-task-list` was renamed `open-money-view`, each saying Money View OS in its messages, launch agent and log file. **Shared version 11 (27 October 2026) undid that**: every tool's start script and open skill are now the same file, `setup/scripts/start-app.*` and `.claude/skills/open-the-app`, reading the folder's own name from `toolkit.json` rather than having it written in. They work the same way for the person using them. The helper's own `TLOS_PORT` and `TLOS_CLAUDE` settings and the `tlosAlive` check belong to the shared helper (`apps/server/`) and keep their names (existing installs rely on them).

**Kept shared and unchanged:** `open-the-app`, `get-updates`, `connect-a-tool`, `human-email`, `polite-chaser`, `write-like-me`, `sort-brain-dump` (all used by Money View), and `setup` (its description already names this tool). `connect-a-tool` still lists a plain export as its last-resort route; the Money View connection guides and setup step 2 override it (no exports anywhere).

**Kept shared but trimmed for Money View** (the shared copies would have sent Claude to files that don't exist here): `keep-context-fresh` (no `priorities.md` or `routines.md`, no Task List data file in its note) and `match-my-brand` (step 1 not step 5, `apps/money/index.html` not `apps/task-list/index.html`, "money view" not "task list"). Copy these back to the shared copies only if wanted everywhere.

**Task List OS wording** that described its features (tasks, inbox, calendar, calls, Review) as if Money View had them is gone from everything this tool owns. What stays is the attach rules: chase tasks, "Send INV-0043 from Xero" and "Move £X to your Tax pot" are sent to Task List OS when it is attached (`apps/money/ATTACH-CLAUDE.md`, the money skills), and the toolkit's "More tools" menu in `apps/shared/`.

## The data file

One file, `apps/money/data/money.json`. Its shape is in `SPEC.md` and in `apps/money/CLAUDE.md`. It ships empty, exactly as `SPEC.md` shows it, and the release check refuses anything else. Who writes what:

| Section | Who writes it |
|---|---|
| `settings` | The app (Settings) and setup. Claude fills the business, VAT, invoice and bank answers during setup only. `settings.tax.setAsidePercent` is only ever the owner's or their accountant's number. `settings.invoice.paymentDetails` is typed by the owner only |
| `sources`, `accounts`, `transactions`, `imports` | Claude (`update-my-money-view`), and the owner for accounts they type (`source: "you"`) |
| `invoices` | The app and the owner (they write and send them). Claude adds invoices read from the accounts software (`where: "accounts"`), payments it can match, a `chaser` draft, and sets `status`, `ref` and `request` only as the skills say. Paid, part paid and overdue are never stored |
| `expected`, `outgoings` | The owner and Claude. Claude's are `suggested` until the owner confirms them |
| `potMoves` | The owner (I've moved it), or Claude logging what the owner says they moved |
| `scenarios` | The owner (What if) and Claude (`can-i-afford-this`: changes and a note only) |
| `flags` | The app derives its own; Claude writes only what the app can't see |
| `activity` | Both, newest first, capped at 200 by the app |

**Rule for Claude: never write a total, a forecast or a tax figure.** `MV.model` works them out. Claude writes the records.

## The 4 Claude jobs

Defined in `apps/money/claude-jobs.json` (the shared job mechanism from `SHARED-V4-CHANGES.md`: the app asks `POST /api/claude/run/money/<job>` with only the job's name; the words Claude follows live in this file, never in the request). Each points at a skill in `.claude/skills/<name>/SKILL.md`, so it works the same whether the app triggers it or the person just asks Claude. Every prompt ends "Move no money. Send nothing. Change nothing else."

| Job | Skill | When |
|---|---|---|
| `refresh-money` | `update-my-money-view` | Refresh numbers |
| `put-invoices-in-accounts` | `put-invoices-in-my-accounts` | Put it in <app> as a draft |
| `chase-invoices` | `who-owes-me-money` | Chase |
| `can-i-afford-this` | `can-i-afford-this` | Ask Claude, in What if |

The other skills are for asking in chat: `raise-an-invoice`, `whats-coming-in`, `set-aside-for-tax`, and `sort-money-brain-dump` (called by the shared `sort-brain-dump`, which sends "any other tool" to the skill the tool's `ATTACH-CLAUDE.md` names, so the shared skill is not edited). How to switch on a bank feed in each accounts app lives once in `setup/connections/bank-feeds.md`; keep every unchecked item marked "to check".

## What the connections can really do (checked 21 October 2026)

- **Xero.** The Xero connector in the Claude app reads only. It cannot create invoices. Xero's own open source connection (XeroAPI `xero-mcp-server`) can create and update draft invoices, but needs a Xero custom connection and a one-off install: `setup/connections/xero-drafts.md`. It is optional, offered in setup step 2, never required.
- **QuickBooks.** Supported only when the person's Claude shows Intuit's QuickBooks connector (US customers only for now; UK: to check). It can create invoices; Claude only ever creates one when the person presses the button and never sends, updates or deletes. When it has no tool that creates an invoice, the mode is `read` and Money View opens QuickBooks' new invoice page.
- **FreeAgent, Sage and anything else.** Not supported yet. Setup says in one plain paragraph that Money View can't connect to their accounts app yet, that Xero works today and QuickBooks will work once Intuit's Claude connection reaches the UK, and stops. No export, no CSV, no other way in.
- **No accounts software.** Setup says so in one plain paragraph, suggests they talk to their accountant, and stops. There is no invoice book.
- **Banks.** Only through the bank feed inside the accounts app, read through the accounts connection, and the feed is required: setup doesn't carry on without it, and stops if their bank isn't offered by the accounts app. Setup walks the person through switching it on (`setup/connections/bank-feeds.md`) and checks Claude can see recent transactions. No direct bank connection, no bank key, no statement imports (George, 21 October evening).
- **Money received** is counted only from invoice payments, which come from the accounts app. Bank lines never add income on their own (no double counting; no loans or refunds taxed). They stay for balances, spotting regular outgoings and flags.

### To check (nothing below has been tried with a real account)

Work through this list with real accounts before announcing the tool, and remove an item only when it has been seen to work.

1. What a Xero custom connection costs, and whether it's open to every UK organisation (`xero-drafts.md`).
2. That the `accounting.invoices` permission alone is enough to create a draft invoice for an existing contact (we never use `accounting.transactions`, and the drafts connection has no contacts permission: contacts are read through the official read-only connection), and the permission names Xero offers today.
3. That `claude mcp add ... --env 'XERO_CLIENT_ID=${XERO_CLIENT_ID}'` really reads the codes from the environment on both Mac and Windows, and the `--scope user` choice.
4. The exact tool names in `xero-mcp-server` (`list-contacts`, `create-invoice`) and that an invoice made with it is always a draft with the status set to draft.
5. How `xero-mcp-server` picks a tax rate for a line, and that 20, 5 and 0 map correctly for a UK organisation.
6. **Deny rules.** Add deny rules to `.claude/settings.json` for every tool of the Xero drafts connection and of Intuit's QuickBooks connector that approves, sends, emails, voids, deletes or takes a payment (and for any tool that creates a contact), once the real tool names have been seen. Do not guess the names: nothing is denied by name today, and every creating tool asks the person first.
7. Whether each accounts app's bank feed is offered for the person's business bank (Barclays, HSBC, Lloyds, NatWest, Santander, Nationwide, Starling, Monzo, Tide, Revolut, Metro, Co-operative, Mettle), and the clicks in `bank-feeds.md`, all marked "to check" until seen with a real account.
8. How often a bank feed asks the person to renew their consent, per bank and accounts app.
9. Whether Claude has a connection for FreeAgent or Sage in the directory (the kit assumes not and doesn't support either; `sage.md` and `freeagent.md` are "not supported yet" notes).
10. That the Xero read connection's bank tools (bank accounts and bank transactions) give enough for the bank feed route in setup step 3.
11. That Claude can run `node -e` against `model.js` when the skills ask it to (the kit doesn't pre-approve it, so the person is asked the first time).
12. Whether Intuit's QuickBooks connector is open to UK customers yet, the name of its tool that creates an invoice, and whether an invoice created through it stays unsent until the person sends it from QuickBooks (setup says only that Claude doesn't send it).

## Attaching

`toolkit.json` and `apps/money/ATTACH-CLAUDE.md`. Reads: Pipeline OS won deals (suggested `expected` items, `source: "pipeline"`), Proposal Writing OS approved or won proposals (`source: "proposals"`) and Ads OS spend (suggested `outgoings`, `source: "ads"`). Sends to Task List OS: a chase task per overdue invoice, "Send INV-0043 from Xero" for drafts sitting in the accounts software, and "Move £640 to your Tax pot" when more than £50 is left to move, as suggested tasks in the task list's own format with `"source": { "tool": "money", "id": ... }`, waiting for the person's click. Money View OS never edits another tool's records.

## How the release works

`bash maintainers/make-release.sh` from the repo root runs `node maintainers/test-model.js`, builds `dist/money-view-os.zip`, a clean copy for a customer to download. It checks every file that ships is still a blank template (the data file must equal the empty file in `SPEC.md`; `context/money.md` and every other context file blank; no demo code; no `media` setting on this tool; nothing that sends, pays or creates pre-approved; nothing in `setup/as-installed/` but its README; `toolkit.json`'s `sharedVersion` matches `apps/shared/VERSION`; no file under `setup/scripts/`, `apps/server/` or `apps/shared/js/` names this tool, and none uses the old `open-task-list` or `start-task-list` names), copies the kit into a folder called "Money View OS" leaving out this `maintainers/` folder and clutter, runs the checks again on the copy plus structural ones (every file that must exist, no file or skill that belongs to another tool, only the 7 connection guides, every JSON file that must parse, every skill in `toolkit.json` present with a matching name, the 4 jobs pointing at real skills and ending with the 3 sentences, the app's scripts syntax-check cleanly, no em dash and no en dash, the full banned-word list over everything this tool owns (the page, the app's scripts, `menu.json`, `claude-jobs.json`, its skills, the setup steps, the guides and the notes; the shared skills, including `open-the-app` and `get-updates`, list banned words on purpose and are left out), no word customers shouldn't see in what the app shows or in the job labels, no old tool name in the files this tool owns including `skills-to-upload/`, and no Task List OS script, skill or helper name in them), refuses any `*.csv`, `*.pdf` or `*.xlsx` under `files/`, the `import-a-statement` skill and `setup/connections/starling.md`, then zips it. `dist/` is git-ignored. Publishing follows the other tools: a `claude/...` branch from `origin/main`, the release script run and passing, a pull request into `main`, never a direct push or a force push.

## Rules

- Test: by hand, see `maintainers/TESTING.md`. The helper has automatic checks that start it on a spare port and run against both `server.js` and `server.py`: `node maintainers/test-helper-media.js` (photos and videos; not relevant here, since Money View keeps none) and `node maintainers/test-helper-safety.js` (badly formed requests, and saves that must not overwrite a change made in between). Neither is part of `make-release.sh`.
- Anything committed ships, so never commit a filled-in `context/`, a non-empty data file, a ticked `setup/progress.md`, "Setup: complete" in `CLAUDE.md`, or any export from an accounts app.
- No prices for Get AI Powers services anywhere (point to getaipowers.com), no em dashes, British English, digits for numbers, no "delve", "game-changer", "unlock", "elevate" or hype. Customer-facing words never say agent, repo, repository, artifact, JSON, schema, API or MCP: say "a connection".
- Claude never moves money, and never sends, approves or deletes an invoice or anything in the accounts software.
- Claude never types a total, a forecast or a tax figure, and never chooses a tax percentage.
- Claude never stores or asks for a bank login, sort code, account number or card number, and never asks for a key in chat.
- Every figure on screen says where it came from and when. The page footer and `CLAUDE.md` say: "Estimates to help you plan, not financial advice. Check big decisions with your accountant."
- Claude never invents an invoice, a payment, a customer or an amount.
- Never delete files. Move them to `files/99-archive/` (or `_archive/` for build files) and say so.

## Open questions for George

- Decided 21 October (late): FreeAgent, Sage and any other accounts app are not supported yet, with no export fallback; QuickBooks is supported only with Intuit's connector; Xero is fully supported. `files/05-finance/statements/` and the statement skill were removed as asked.

- Shared skills `setup` (its description names the tool) is a shared file; `match-my-brand` was fixed here for Money View (step 1, not step 5). The `open-money-view` rename was done everywhere in shared version 11 (it's now `open-the-app`, the same file in every tool). The `match-my-brand` and `keep-context-fresh` fixes are still this tool's own and belong in Task List OS too if wanted everywhere. `sort-brain-dump` is untouched and still routes unclear notes to the task list as a fallback; with Task List OS not attached `sort-money-brain-dump` says what to do with them.
- `ATTACHING.md`'s toolkit table row for this tool carries the old description; the catalogue entry here has the new one (see `SHARED-CATALOGUE-RENAME.md`). The change needs making in Task List OS first, then copying to every tool.
- `skills-to-upload/` is not used by Money View OS (it builds no skill of its own). Its README now says so in one line, and the release check still refuses any zip in it and checks it for the old tool's name. Decide whether to drop the folder from the kit in shared version 8.
- The spec's original line said QuickBooks has "no official connection that creates invoices"; the template's `quickbooks.md` (and Intuit) say its connector can create, update and send invoices (US customers only for now). `quickbooks.md` now says Claude only ever creates, never sends, and only when the person presses the button.
