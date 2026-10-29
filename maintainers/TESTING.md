# Testing Money View OS

How to test the whole thing as a customer would, without touching the repo. Also follow section 5 of `SHARED-V3-CHANGES.md` and the testing sections of `SHARED-V4-CHANGES.md`, `SHARED-V5-CHANGES.md`, `SHARED-V6-CHANGES.md` and `SHARED-V7-CHANGES.md` for the shared parts.

## 1. The model's own tests

Run these first, from the repo root. They need Node only and touch nothing:

```bash
node maintainers/test-model.js
node maintainers/test-connections.js
```

`test-connections.js` checks the shared Connections model (`apps/shared/js/connections.js`, shared version 13). `test-model.js` runs plain assertions on `apps/money/app/model.js`. It must print no failures. `make-release.sh` runs it too. If you change a rule in `model.js`, change the test in the same commit. What the tests must cover, so a future change can't quietly break a rule:

- **`invoiceTotals`**: net, VAT and gross from lines, VAT per line, rounding half up to the penny at each line, a line at 0% and at 5%, quantities with decimals, an empty invoice.
- **`invoiceState`** and **`daysOverdue`**: draft, waiting, in-accounts, sent, part-paid, paid, overdue (sent or in-accounts, not fully paid, due before today) and void, around midnight and across a month end; an invoice due today is not overdue; a part payment keeps it part-paid; an overpayment is paid.
- **`nextInvoiceNumber`**: prefix and number padded to 4, never reusing a number already used, including one used by an invoice read from the accounts software.
- **`occurrences`**: monthly on the 31st (clamped to the month end), February in a leap and a non-leap year, weekly, quarterly, yearly, an `endDate`.
- **`forecast`** and **`lowPoint`**: starts from `cashToday` (pots included, cards subtracted); unpaid invoices on their due date, overdue ones in week 1; only `confirmed` items count; `maybe` only with the switch; scenarios applied only when listed; tax dates; an empty file gives flat weeks.
- **`vatQuarter`**: standard, cash accounting and flat rate; input VAT at 1/6 of a VAT-inclusive amount at 20%; the due date (end of quarter plus 1 month and 7 days); an unregistered business gets none.
- **`taxPot`**: VAT on money received this quarter plus the set-aside percentage of money received after VAT since `yearStart`, minus tax already paid; `inPot` from the pot account, else from `potMoves`; `toMove` never negative; percentage 0 counts VAT only.
- **`months`**: past months from invoices, payments and transactions; future months from the forecast rules; the right month at the edges of a year.
- **`scenarioCompare`** and the `lose` kind: removes a customer's confirmed items and unpaid invoices from the date, and stops repeating income.
- **`normalise`** and **`money`**: missing lists and settings filled, broken records dropped; "£1,234.56", rounded, and a minus sign before the pound sign.

## 2. Make a fresh copy

Never test inside the repo: setup writes real details into it. Build the release zip and unzip it somewhere else:

```bash
bash maintainers/make-release.sh
```

Then unzip `dist/money-view-os.zip` into a test location, for example `Documents/Money View OS test`. Each test run starts from a fresh unzip. Then check the release script itself refuses what it should, on a scratch copy of the repo, by adding each of these and running it (each must stop with a plain message):

- a non-empty `invoices` (or `transactions`, or `accounts`) list in `apps/money/data/money.json`,
- a filled-in `context/money.md`,
- an empty file `skills-to-upload/test.zip`,
- a `media` setting on the money tool in `apps/installed.json` or `toolkit.json`,
- a ticked box in `setup/progress.md`,
- "Setup: complete" in `CLAUDE.md`,
- an `mcp__` permission that creates or sends, and any permission naming Xero, in `.claude/settings.json`,
- a sort code written as `12-34-56` in any shipped file,
- any file or skill removed on 21 October 2026 coming back (a connection guide such as `setup/connections/slack.md`, `.claude/skills/file-it`, `.claude/skills/open-task-list`, `context/priorities.md`, `context/routines.md`, `setup/scripts/start-task-list.sh`, a `files/01-admin` folder), or any extra file in `setup/connections/` or extra folder in `.claude/skills/`,
- the words `start-task-list`, `open-task-list`, `task-list-os`, `file-it` or `your task list` in a file this tool owns,
- a job in `claude-jobs.json` whose prompt doesn't end "Move no money. Send nothing. Change nothing else.".

## 3. Page checks

Run the app (`node apps/server/server.js` or `python3 apps/server/server.py`), open http://localhost:4747, go into Money View OS, and check at 375, 768 and 1280 pixels, in light and dark:

- **One page**: the sidebar shows one item, "Money view". Under the top bar is the rail: Overview | Months | Invoices | In and out | What if (Invoices shows the overdue count), Refresh numbers, New invoice and the Settings gear. Each view has its own address (`#overview`, `#months`, `#invoices`, `#inout`, `#whatif`, `#invoice/<id>`) and Back and Forward move between them. Nothing scrolls sideways from 320 to 2560 pixels.
- **Fresh install** (empty data file): every view and the first Home box show "Let's set up your money view" with the `/setup` line and a copy button. Every other empty state says what fills it. Nothing mentions a demo.
- **Footer**: every view says "Estimates to help you plan, not financial advice. Check big decisions with your accountant."
- **Every figure says where it came from and when**: "From Xero, 21 Oct" or "Estimate". Check cash today, owed, the tax pot, the months and the line under the chart.
- **Overview**: the 4 numbers, each a button to its view; the lowest point turns warning under `nervousBalance` and danger under 0; the chart has 12 weekly points, the dashed nervous line, the shaded below-zero area and the labelled low point; resting the mouse on a week or tabbing to it shows what's in and out, item by item, and the card never runs off the screen; "Include maybes" changes the line; the line under the chart matches the model; the tax pot box shows should have, in the pot and to move, **Open <bank>** opens `settings.bank.link` in a new tab and is hidden when it's empty, **I've moved it** adds a `potMove` with the amount prefilled; the flags tray shows derived flags first, then Claude's, with Chase, Check and dismiss; Coming up lists the next 14 days.
- **Months**: last 3, this month and next 6; this month highlighted; past months say actual and future ones estimate; clicking a month shows its items; under 560 pixels the rows are stacked cards.
- **Invoices**: the filter chips and search; overdue first; each row's state pill and where it lives. The list is read from the accounts app. In the drawer the totals and VAT are worked out live from the lines and a customer already used is suggested. With `sources.accounts.mode` `drafts` it offers **Put it in <app> as a draft**; with `read` it offers **Open <app> to raise it** (the right link from `MV.model.APPS`) and the line "Your connection reads only, so you raise it in <app>. It shows here on the next refresh."; there is no Download PDF, no Mark as sent and no Record a payment. Chase shows only for an invoice that has been sent and is not fully paid (not for a draft, one waiting for Claude, or one in the accounts app that isn't sent yet); Cancel invoice (with Undo) is hidden for an invoice read from the accounts app; a draft note that has been linked to its arriving invoice (`linked`) is not listed or counted and never shows as Cancelled; nothing is ever deleted.
- **No print page**: `apps/money/print.html` and `print.js` don't exist, and nothing links to them.
- **In and out**: suggested items wait at the top for Confirm or Drop, each with where it came from; adding, editing inline and dropping (with Undo) work; the monthly total is the app's; tax and VAT dates are labelled estimate.
- **What if**: adding a scenario with each kind (out, in, lose); the on and off switch; the chart draws "As things are" and every switched-on scenario on the same axes; the table matches `scenarioCompare`; the Ask Claude box sets `request` and calls the job.
- **Settings**: business name, first name, type, year start, week start, nervous balance, VAT, tax set-aside percent with its line, tax pot account, invoice prefix, payment terms, bank name and link, and the accounts list. A bad number is refused with a plain message. Save and reload: all kept.
- **Words on screen**: no agent, repo, repository, artifact, JSON, schema, API or MCP, no em dash, no hype, and no Get AI Powers prices.

## 4. Light and dark, phone widths, reduced motion

- **Light and dark**: every view, the drawer, the toast take the theme's colours in both. Text contrast at least 4.5 to 1, including the warning and danger colours on the chart and the state pills.
- **Phone width 320 and 375**: the rail's switch wraps to 2 rows so all 5 views (including What if) show with none off the edge (this was not seen in a real browser when it was written: check it); the sidebar opens from the menu button; nothing scrolls sideways on any view; the drawer is usable by touch.
- **Reduced motion**: with the OS setting on, nothing animates.

## 5. The 4 jobs, with a stand-in `claude`

Point `TLOS_CLAUDE` at a stand-in script that follows the job prompts without using real Claude (see Task List OS's own stand-in for the pattern). For each job, trigger it from the app and check:

- **`refresh-money`**: the stand-in adds accounts, transactions from the feed (no duplicate with the same date, amount and text), invoices with `where: "accounts"`, matched payments, suggested outgoings, flags and one `imports` entry; a draft note made in Money View is linked and closed when an invoice with the same customer and total arrives; it writes no total, forecast or tax figure; `sources.*.checkedAt` is set; `activity` gets a line at the front.
- **`put-invoices-in-accounts`**: for each invoice with `request.kind: "draft"`, the stand-in sets `ref`, `status: "in-accounts"` and clears `request`. With a stand-in that can't create drafts: the invoice goes back to `draft`, the request clears and a plain flag is written. An invoice without a request is untouched.
- **`chase-invoices`**: the stand-in fills `chaser` (`text` and `at`) on the named or overdue invoices only; status, payments and dates are byte for byte unchanged; nothing is sent.
- **`can-i-afford-this`**: the stand-in adds changes only, switches the scenario on, writes a `note` and clears `request`; no real invoice, outgoing or setting changes.

Then, with real Claude if you can: run `update-my-money-view` on a made-up business and confirm nothing is invented, no figure of Claude's own is written, and no bank detail is stored.

## 6. Claude never moves money or sends: a check by reading

Search the whole kit (`apps/money/`, `.claude/skills/`, `setup/`, `docs/`, `.claude/settings.json`) for anything that moves money, sends, approves or deletes. Expected result: nothing that does, in code or in a skill. In particular:

- `.claude/settings.json` allows no `mcp__` tool and no command that sends, pays, creates, schedules or deletes, and names no Xero tool. Edit and Write are limited to the data, context, files and progress paths.
- Every skill's rules say it never moves money, sends, approves or deletes, never types a total, a forecast or a tax figure, and never stores bank details. The Open buttons in the app only open a new browser tab.
- Search the skills and the setup steps for em dashes, the banned words and "delve", "game-changer", "unlock", "elevate", and for any list of 3 for effect.

## 7. Menu and locked-tool panel

As `SHARED-V3-CHANGES.md` section 5 describes: on a scratch copy, the sidebar shows Home, Money View OS as an open dropdown with its one page (Money view, carrying the overdue count), and the other 6 tools locked under "More tools" in catalogue order. Folding the dropdown shows the total waiting and the choice is remembered. Each locked tool opens the panel with the right tracking on its button link; Escape and a click outside close it; it works by keyboard and at phone width. `showMoreTools: false` in `catalogue.json` hides the locked tools completely. The `money` entry's description reads as in `SHARED-CATALOGUE-RENAME.md`.

## 8. Setup, as the customer's Claude

On a fresh unzip, run `/setup` as if you were the customer's Claude, with a made-up business, 3 times: with Xero, with QuickBooks (a stand-in Claude that does and then does not show Intuit's connector), with FreeAgent or Sage, and with none. Check:

- It asks one question at a time and saves as it goes (look at `context/money.md` and the data file between questions).
- Step 2 can't be skipped. It checks the connection itself with `session_connectors_status` (never asks what's on screen), switches it on or points to Connect, and proves it with "I can see N unpaid invoices, the oldest from <date>" before writing a `connected` row with today's date in `apps/home/data/connections.json`. With none (or Word, Excel, a notebook), it says in one plain paragraph that Money View works on top of an accounts app, suggests they talk to their accountant, leaves the step unticked and stops. With Xero it never offers the drafts connection, and sets `drafts` only when the drafts connection is already there. With QuickBooks and Intuit's connector it sets `drafts` only when it has seen a tool that creates invoices, otherwise `read`; without the connector, and with FreeAgent, Sage or anything else, it says the shared no-connector sentence word for word, records `export-only`, then says in one plain paragraph that Money View can't connect to their accounts app yet, that Xero works today and QuickBooks will work once Intuit's Claude connection reaches the UK, leaves the step unticked and stops. A connector that still won't connect is recorded `needs-attention` and setup stops at this step.
- Step 3 will not carry on without the bank feed: if no transactions show, or the bank isn't offered by the accounts app, it says so, notes "Waiting for a bank feed" and stops. It asks which bank, says the link is read only in one sentence, walks through switching on the business bank feed inside their accounts app from `setup/connections/bank-feeds.md`, checks Claude can see recent transactions before ticking, asks about a tax pot, and saves `sources.bank`, `settings.bank`, `accounts` and `settings.tax.potAccountId`. It never asks for a login, a sort code, an account number or a card number, and never asks for a key in chat.
- Step 4 runs `update-my-money-view`, confirms the suggested payments one by one or all at once, asks VAT, business type, year end, the tax percentage (with 0 and a flag if they don't know, never a suggested number) and the nervous balance.
- Step 5 asks about expected income, opens the Overview, explains the 4 numbers and raises an invoice.
- Step 6 passes every item in `setup/09-check-and-hand-over.md` and marks setup complete only at the very end. It offers the regular refresh at the agreed days and times (a "no" notes "Regular refresh: said no"), pre-approves only the accounts connection's read tools in `.claude/settings.local.json` (never a Xero drafts tool), creates exactly one scheduled task from this session with the shared rule sentence, runs it once and checks its folder and permission mode. The hand-over tells a Xero user to say "put invoices in Xero" for drafts.
- Nothing in the folder ends up containing a password, a key, a code, a sort code, an account number or a card number.

## 9. Attach to a scratch Task List OS (and the other tools)

Follow `ATTACHING.md` on a scratch copy of Task List OS, then check:

- Both tools show as dropdowns in the sidebar; Home offers both tools' boxes (this tool's start off, in the hidden list, per the shared rule); nothing in Task List OS broke; setup didn't ask what the business does a second time.
- `who-owes-me-money` adds a suggested chase task to Task List OS for each overdue invoice, and `put-invoices-in-my-accounts` "Send INV-0043 from Xero" for each draft in the accounts software, with `source.tool` set to `money`, a `source.id` that matches, `suggested: true` and `addedBy: "claude"`. A "Move £X to your Tax pot" task appears only when `toMove` is over £50. They show on its Review page with a New tag and need a click. Running any twice adds nothing twice. A task for a paid invoice or a sent draft is never added.
- With Pipeline OS also attached: a deal moved to `won` becomes one suggested `expected` item (`source: "pipeline"`) once, never twice, and no deal record is changed. Likewise Proposal Writing OS (`source: "proposals"`) and Ads OS spend (suggested `outgoings`, `source: "ads"`, `category: "ads"`).
- With none of those attached: everything above is skipped quietly, with no error.

## 10. Helper: Node and Python behave the same

Run the app once with `node apps/server/server.js` and once with `python3 apps/server/server.py` and repeat the page checks in section 3 for each: saving the data file, the job endpoints for all 4 jobs, and the backup file (`money.backup.json`) all behave the same in both. Also run `bash setup/scripts/start-app.sh` on the fresh unzip: it prints "Money View OS is running: http://localhost:4747" and does nothing if the helper is already running (`bash -n` on every `.sh` file is the minimum; the `.ps1` files can only be tested on Windows). `autostart-mac.sh install` should create `~/Library/LaunchAgents/com.getaipowers.money-view-os.plist` and `remove` should undo it. `node maintainers/test-helper-media.js` is the shared helper's own check for tools that keep photos or videos; it isn't part of this tool, which has no media, and it isn't part of `make-release.sh`. `node maintainers/test-helper-safety.js` is the shared helper's own check for badly formed requests and saves that must not overwrite a change made in between; it also isn't part of `make-release.sh`.

## What can't be tested without real Claude, a real accounts app and a real bank

- A real `/setup` run: everything above uses a stand-in `claude`, so the actual wording Claude uses when talking to a person, and how it handles an ambiguous answer, needs a run with real Claude.
- Every connection: the Xero read connection, the optional Xero drafts connection, QuickBooks (Intuit's connector, for US customers only for now), and every set of clicks in `bank-feeds.md`, all need real accounts. The "To check" list in `MAINTAINING.md` is the record of what hasn't been seen to work.
- Real bank feeds: which banks each accounts app really offers, and how often consent has to be renewed.
- Time saved: not measured. Don't quote a figure.
