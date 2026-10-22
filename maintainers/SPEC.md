# Money View OS: build spec

Written 21 October 2026 from George's brief (below) and the 7 October build prompt (`maintainers/BUILD-PROMPT.md`). Every builder works from this file. The template is Content Machine OS (`~/Repos/getaipowers/content-machine-os`, shared version 7): copy its patterns (one page with a rail, Settings dialog, drawer, hover card, jobs, Brain dump, setup card, release checks). Where the template does something differently from this file and this file doesn't say why, copy the template and note it here.

Tool id `money`, name **Money View OS**, folder `apps/money/`, data file `apps/money/data/money.json`, code namespace `window.MV`, sidebar icon `wallet`, repository `money-view-os`, shared version 7, launcher `Open Money View.html`. `media` is not set (no photos or videos).

## CHANGE 2, 21 October 2026, late (overrides CHANGE 1 and everything below where they differ)

The code review of the first build, answered by the lead. Where a line below is struck through, it is dead: nobody builds or tests it.

- **A. Supported accounts apps.** **Xero**: full support (the official Claude connector reads; Xero's own XeroAPI connection is the optional drafts step). **QuickBooks**: supported only when the person's Claude shows Intuit's QuickBooks connector (Intuit says US only for now; UK "to check"). Its connector can create invoices: Claude only ever creates them, never sends. **FreeAgent, Sage and anything else: not supported yet.** Setup says in one plain paragraph that Money View can't connect to their accounts app yet, that Xero works today and QuickBooks will work once Intuit's Claude connection reaches the UK, and stops. No export or CSV fallback anywhere. `freeagent.md` and `sage.md` are short "not supported yet" notes. **The bank feed is required**: `money-02-your-bank.md` does not carry on without it (it helps them switch it on; if their bank isn't offered by the accounts app it says so and stops).
- **B. Income counting.** `taxPot` and `months` count money received only from invoice payments (which come from the accounts app). A bank line never adds income on its own (no double counting; no loans or refunds taxed). Bank lines stay for balances, spotting regular outgoings, flags, the money-out figures of past months and tax already paid.
- **C. Tax pot VAT.** An earlier VAT quarter whose return isn't due yet stays in the pot, less VAT already paid for it: outgoings or bank lines in category `tax` whose name or text says VAT, dated after that quarter ended (oldest quarter first, never below nothing). See the `taxPot` row in the model table.
- **D. Invoice numbers and output VAT.** `nextInvoiceNumber` is pre-filled in a new draft only when `sources.accounts.mode` is `drafts` (`MV.model.newInvoiceFor(data, today)`). Output VAT, and the "invoiced" figure in `months`, count only invoices that are in the accounts app: status `in-accounts` or `sent`, or `where: "accounts"`. Not `draft` or `waiting`.
- **E. Xero drafts.** The drafts connection needs the `accounting.invoices` permission only, never `accounting.transactions`. Claude never creates a contact: if the customer isn't already a contact in Xero (checked through the read-only connection), it sets the invoice back to `draft`, clears the request and flags "Add <customer> as a contact in Xero, then press Put it in Xero again". Deny rules by tool name wait until the real tool names have been seen (a "to check" in `MAINTAINING.md`).
- **F. Invoice buttons and `linked`.** Cancel invoice is hidden for invoices with `where: "accounts"`. Chase shows only for sent or overdue invoices (status `sent`, state sent, part paid or overdue), not for drafts, waiting ones or in-accounts ones not yet sent. A draft note that Claude links to an arriving accounts-app invoice gets the stored status `linked`: hidden from the list and every count, never shown as Cancelled. The stored statuses are `draft`, `waiting`, `in-accounts`, `sent`, `void`, `linked`.
- **G.** The Settings tax line is just "Ask your accountant what to put aside."
- **H. One set of source words** on every record: `accounts`, `you`, `ads`, `pipeline`, `proposals`, `claude`. `normalise` turns an older "xero", "quickbooks", "statement" or "bank" into `accounts`. Money View builds no skill of its own: `skills-to-upload/README.md` says so in one line.

## CHANGE 1, 21 October 2026 evening (overrides everything below where they differ, except where CHANGE 2 says otherwise)

George: "the Money View OS only works once it's connected to the financial application they use, like Xero or QuickBooks. It needs to guide them through setting it up so it has visibility of transactions in a business bank account, and that's it. It's super easy."

1. **An accounts app connection is required.** Supported: Xero, QuickBooks (with Intuit's connector), ~~FreeAgent, Sage~~ (not supported yet: CHANGE 2). Setup step 1 connects it (or checks an existing connection). With no accounts app, setup says in one plain paragraph that Money View works on top of an accounts app, suggests they talk to their accountant about one, and stops. There is no `book` mode: `sources.accounts.mode` is `none`, `read` or `drafts`.
2. **The bank comes through the accounts app's bank feed, and only that way.** Setup step 2 asks which bank, then walks them click by click through switching on the business bank feed inside their accounts app (Xero and QuickBooks each have one; ~~FreeAgent, Sage~~ are not supported yet), and checks Claude can see recent transactions. No direct bank connection, no Starling token, no statement imports. `sources.bank.mode` is `none` or `accounts-feed`. Drop the `import-a-statement` skill, `setup/connections/starling.md`, `files/05-finance/statements/`, the bank column guides (keep a short `setup/connections/bank-feeds.md` instead: per accounts app, how to connect a bank feed, and which UK banks each supports, "to check" where unsure). `transactions[].source` is the accounts app.
3. **Every invoice lives in the accounts app.** No Money View invoice book and no Money View PDF (drop `print.html`, `print.js`, `settings.invoice.from/paymentDetails/footer`, "Download PDF", "Mark as sent"). New invoice still opens the drawer (customer, lines, live totals from the model), then:
   - `mode: "drafts"`: **Put it in <app> as a draft** (as before). The owner checks and sends it in the app.
   - `mode: "read"`: **Open <app> to raise it** (a link to the app's new invoice page, from a small table in `model.js`: `MV.model.APPS` with name, home link, new invoice link per app) plus a line: "Your connection reads only, so you raise it in <app>. It shows here on the next refresh." The draft in Money View stays as a note with status `draft` until a matching invoice arrives from the accounts app (same customer and total), then it's linked (status `linked`, hidden) by Claude on refresh.
   - Setup offers the drafts connection for Xero (optional, `xero-drafts.md`); QuickBooks is `drafts` only when Intuit's connector shows a tool that creates an invoice, otherwise `read`.
   Invoices read from the accounts app (`where: "accounts"`) are the main list. Payments come from the accounts app, not typed in: "Record a payment" goes.
4. Settings keeps `invoice.termsDays` and `invoice.prefix` only as defaults for the drawer; numbering belongs to the accounts app (`nextInvoiceNumber` is a suggestion shown only in drafts mode, and Claude uses the app's own number).
5. Accounts balances also come from the accounts app (bank account balances in Xero and the like), `source` the app name. The tax pot is one of those bank accounts (a savings account or pot fed into the accounts app), or, if it isn't fed in, the sum of `potMoves`.

## George's brief (21 October 2026)

When someone installs it from the GitHub link, Claude asks: have you got your accounts software connected to Claude? If yes, it works. If not, Claude asks which accounts app they use and how they manage invoices now, and connects the right one. Then: which bank do you use? The bank link is read-only: it sees what is in the bank, never bank details. The app is a monthly view of income: what is invoiced and due, what has been paid, what is to be paid in the next few months. A forecast. They raise invoices through it, and it works with whatever accounts app they use. They can put money aside for tax in a pot.

## George's decisions (21 October 2026)

1. **Tax pot: the app suggests, the owner moves.** The app works out how much should be set aside, shows "Move £X to your Tax pot" with a button that opens their bank's website or app, and an "I've moved it" button that logs the move. Claude never moves money, anywhere, ever.
2. **Invoices: drafts in their accounts app.** The owner fills in an invoice in Money View (the app does the totals and VAT). "Put it in Xero as a draft" asks Claude to create it as a draft in the accounts app; the owner checks and sends it from there. ~~Where the connection can't create drafts, the owner downloads a branded A4 PDF (print page) and sends it themselves.~~ **[Superseded: no PDF and no print page. Where the connection can't create drafts, Money View opens the accounts app's new invoice page. See CHANGE 1 item 3.]** Claude never sends, approves or deletes an invoice.
3. Same framework, look, helper, setup style and wording rules as the other toolkit tools. Demo artifact uses Fern & Finch (2 person design studio in Bristol) and its clients from the other demos (Greenway Café, Marlow Dental and the rest), booking button to Joey: `https://calendly.com/joey-getaipowers/claude-chat`. The kit keeps the catalogue's booking link.

## What the connections can really do (checked 21 October 2026)

Builders: this is why setup is shaped the way it is. Say these things plainly in setup; mark anything not yet tried with a real account "to check" in `maintainers/MAINTAINING.md`.

- **Xero.** The Xero connector in the Claude app reads only (invoices, bills, bank transactions, contacts, cash position, aged receivables). It cannot create invoices. Xero's own open source connection (XeroAPI `xero-mcp-server`) can create and update draft invoices, but needs a Xero custom connection or developer app and a one-off install. Setup offers it as an optional extra ("Want Claude to put invoices into Xero as drafts? It needs one more connection, about 10 minutes."), never required. Whether a Xero custom connection costs extra: to check.
- ~~**QuickBooks, FreeAgent, Sage.** No official connection that creates invoices. Community-built ones exist; setup does not install them for the person. Reading works through whatever connection they have; drafts fall back to the PDF route. Their connection guides in `setup/connections/` (Xero, QuickBooks, FreeAgent come from the template; add `sage.md` in the same style).~~ **[Superseded 21 October 2026, late: see CHANGE 2 above.]**
- ~~**No accounts app** (Word, Excel, a notebook): Money View becomes their invoice book. Numbering, PDF and paid tracking all live in the app.~~ **[Superseded 21 October 2026, late: see CHANGE 2 above.]**
- ~~**Banks.** The read-only live feed comes, in this order: (a) the bank feed already inside their accounts app (Xero, QuickBooks and FreeAgent all have bank feeds, read through the accounts connection), (b) the bank's own read-only access where it gives one to account holders (Starling's personal access token with read permissions only: to check for business accounts), (c) a statement export (CSV) from any UK bank, which always works. Never ask for or store a bank login, sort code, account number or card number. A key, if any, is saved with `setup/scripts/save-key.sh` or `.ps1` into the computer's secure store, never in the folder or the chat.~~ **[Superseded 21 October 2026, late: see CHANGE 2 above.]**
- Moving money between pots needs a write permission no read-only feed has. That's another reason for decision 1.

## Wording rules (customer-facing text, and code comments)

British English. Digits for numbers. No em dashes anywhere. Never say agent, repo, repository, artifact, JSON, schema, API, MCP on screen (say "a connection"). No "delve", "game-changer", "unlock", "seamless", "leverage", no hype, no lists of 3 for effect. No prices for Get AI Powers services; point to getaipowers.com only. No demo mode or sample data in the kit (shared v6 rule). Every money figure on screen carries where it came from and when ("From Xero, 21 Oct", "Your statement, 18 Oct", "Estimate"). The page footer and `CLAUDE.md` say: "Estimates to help you plan, not financial advice. Check big decisions with your accountant."

## Data file: `apps/money/data/money.json`

Ships as exactly this (empty, no records):

```json
{
  "version": 1,
  "settings": {
    "businessName": "",
    "ownerName": "",
    "currency": "GBP",
    "businessType": "",
    "yearStart": "04-06",
    "weekStarts": 1,
    "nervousBalance": 0,
    "vat": { "registered": false, "scheme": "standard", "rate": 20, "flatRate": 0, "quarterEnds": [3, 6, 9, 12], "cashAccounting": false },
    "tax": { "setAsidePercent": 0, "potAccountId": null, "note": "" },
    "invoice": { "prefix": "INV-", "nextNumber": 1, "termsDays": 30 },   // ~~"from", "paymentDetails" and "footer" are removed: there is no PDF~~
    "bank": { "name": "", "link": "" }
  },
  "sources": {
    "accounts": { "app": "", "mode": "none", "checkedAt": null },
    "bank": { "mode": "none", "checkedAt": null }
  },
  "accounts": [],
  "invoices": [],
  "expected": [],
  "outgoings": [],
  "transactions": [],
  "potMoves": [],
  "scenarios": [],
  "flags": [],
  "imports": [],
  "activity": []
}
```

Shapes (every id from `ui.makeId`, every date `YYYY-MM-DD`, every timestamp ISO, every amount a number in pounds with up to 2 decimals, positive):

- `settings.businessType`: `""`, `sole-trader`, `partnership`, `limited`. `yearStart` is `MM-DD` (6 April by default, the UK tax year; a limited company uses its accounting year end + 1 day).
- `settings.vat.scheme`: `standard` or `flat`. `quarterEnds`: the months their VAT quarters end (1 to 12). `cashAccounting`: VAT counts when paid, not when invoiced.
- `settings.tax.setAsidePercent`: the owner's own choice (or their accountant's) of how much of money received, after VAT, to put aside for income or corporation tax. Claude may explain, never chooses. `potAccountId`: the account in `accounts` that is the tax pot.
- ~~`settings.invoice.paymentDetails`: free text the owner types for the PDF ("Bank transfer to Fern & Finch Ltd, details on request" or their own sort code and number). This is the only place bank details may appear, typed by the owner, never by Claude, and never read from the bank.~~ **[Superseded 21 October 2026, late: see CHANGE 2 above.]**
- `sources.accounts.mode`: `none`, `read` (connected, reads only), `drafts` (connected and can create draft invoices), ~~`book` (no accounts app; Money View is the invoice book)~~. `sources.bank.mode`: `none`, `accounts-feed`, ~~`bank-direct`, `statement`~~.
- `accounts[]`: `{ id, name, kind: "current"|"savings"|"pot"|"card", balance, asAt, source: "accounts"|"you", isTaxPot: false }` (~~"xero"|"statement"|"bank"~~ are now `accounts`). A card balance is money owed (shown as negative in totals).
- `invoices[]`:

```json
{
  "id": "i_x", "number": "INV-0042", "customer": "Greenway Café", "email": "",
  "issueDate": "2026-10-01", "dueDate": "2026-10-31",
  "lines": [ { "id": "l_x", "text": "Menu redesign", "qty": 1, "price": 850, "vatRate": 20 } ],
  "status": "draft",
  "payments": [ { "id": "y_x", "date": "2026-10-20", "amount": 500, "source": "accounts" } ],
  "where": "here", "ref": "", "request": null,
  "source": "you", "notes": "", "createdAt": "", "updatedAt": ""
}
```

  - `status` (stored): `draft` (being written in Money View), `waiting` (asked Claude to put it in the accounts app), `in-accounts` (a draft there, the owner still has to send it), `sent`, `void` (cancelled, kept), `linked` (a draft note whose real invoice has arrived: hidden, not counted, never shown as Cancelled). Paid, part paid and overdue are derived from `payments` and `dueDate`, never stored.
  - `where`: `here` (raised in Money View) or `accounts` (read from their accounts app on refresh). `ref`: the accounts app's own invoice number or id.
  - `request`: `null` or `{ "kind": "draft", "at": iso }` (put into the accounts app) or `{ "kind": "check", "at": iso }` (refresh this one). The app sets it and calls the job. Claude clears it.
  - `source`: `you`, `accounts`, `pipeline`, `proposals`, `claude`.
- `expected[]` (money in that isn't invoiced yet): `{ id, who, what, amount, date, chance: "likely"|"maybe", source: "you"|"pipeline"|"proposals"|"claude", status: "suggested"|"confirmed"|"invoiced"|"dropped", invoiceId: null, note }`. Only `confirmed` counts in the forecast; `suggested` waits for a click; `maybe` is drawn but only counts when the "Include maybes" switch is on.
- `outgoings[]`: `{ id, name, amount, category: "bills"|"staff"|"rent"|"software"|"suppliers"|"loan"|"tax"|"ads"|"other", repeat: "none"|"weekly"|"monthly"|"quarterly"|"yearly", date, endDate: null, vatIncluded: true, source: "you"|"accounts"|"ads"|"claude", status: "suggested"|"confirmed"|"dropped", note }` (~~"statement"~~ is now `accounts`). `date` is the next (or only) date. Only `confirmed` counts.
- `transactions[]` (imported bank lines, newest first, the app trims to 3000): `{ id, date, text, amount, dir: "in"|"out", accountId, source: "accounts", invoiceId: null, category: "" }`. ~~Claude matches money in to invoices (`invoiceId`) and adds a payment to that invoice.~~ **[Superseded: a bank line never creates a payment or adds income. A payment is added to an invoice only from what the accounts app shows against it. `category` is `tax` for a payment to HMRC (with "VAT" in `text` for VAT) and `transfer` for a move between the owner's own accounts.]**
- `potMoves[]`: `{ id, date, amount, note }`: what the owner says they moved to the tax pot (positive) or took out (negative).
- `scenarios[]`: `{ id, name, on: false, changes: [ { id, kind: "out"|"in"|"lose", name, amount, repeat, from, to: null, customer: "" } ], createdAt }`. `lose` removes every confirmed expected item and unpaid invoice for `customer` from `from`, and stops its repeating income.
- `flags[]` (written by Claude on a refresh): `{ id, kind: "overdue"|"unusual"|"low"|"tax"|"duplicate"|"other", text, at, status: "open"|"done"|"dismissed", invoiceId: null }`. The app also derives its own flags (see the model); stored flags never repeat a derived one.
- `imports[]`: `{ id, at, source, what, count }`, newest first, cap 100.
- `activity[]`: `{ at, what, ref }`, newest first, cap 200.

`validate(d)` in the store throws a plain message if `invoices`, `outgoings`, `expected`, `accounts` or `transactions` is the wrong type.

## The model: `apps/money/app/model.js` (the contract between builders)

Pure functions only (no DOM), on `window.MV.model`, also `module.exports` for Node tests. Every figure on screen comes from here. All money maths in pence internally (round half up to the penny at each line), returned in pounds.

| function | returns |
|---|---|
| `invoiceTotals(inv)` | `{ net, vat, gross }` from lines (`qty * price`, VAT per line at `vatRate`) |
| `invoicePaid(inv)` | sum of payments |
| `invoiceState(inv, today)` | `draft`, `waiting`, `in-accounts`, `sent`, `part-paid`, `paid`, `overdue`, `void` (overdue = sent or in-accounts, not fully paid, due before today) |
| `daysOverdue(inv, today)` | whole days, 0 if not overdue |
| `nextInvoiceNumber(settings, invoices)` | prefix + number padded to 4, never reusing a number already used. Used to pre-fill a new draft only when `sources.accounts.mode` is `drafts` |
| `newInvoice(settings, today, invoices?)` | a blank draft (issue today, due today + `termsDays`, one empty line); with `invoices` it carries the next number |
| `newInvoiceFor(data, today)` | `newInvoice` for the file as it stands: the number is filled only when `sources.accounts.mode === "drafts"`, otherwise empty (the accounts app numbers it) |
| `cashToday(data)` | `{ total, asAt (oldest asAt among accounts), accounts: [...] }`, pots included, cards subtracted |
| `owed(data, today)` | `{ total, overdue, count, overdueCount, list }` across unpaid invoices |
| `occurrences(item, from, to)` | dates a repeating outgoing or scenario change falls on in the range (monthly keeps the day, clamped to month end) |
| `forecast(data, today, weeks = 12, opts = { scenarioIds: [], maybes: false })` | `[{ weekStart, in, out, balance, items: [{ date, name, amount, dir, kind }] }]` starting from `cashToday`. In: unpaid invoices on their due date (overdue ones in week 1), confirmed expected. Out: confirmed outgoings, tax dates (below). Scenarios applied when listed |
| `lowPoint(forecastWeeks)` | `{ balance, weekStart }` |
| `months(data, today, back = 3, ahead = 6)` | per calendar month: `{ month, invoiced, paid, due, expected, out, net }` (past months from invoices in the accounts app, their payments and, for money out, the bank lines; future from the forecast rules. A bank line never adds to `paid`) |
| `vatQuarter(data, today)` | the current VAT quarter: `{ start, end, dueDate (end + 1 month + 7 days), outputVat, inputVat, owed }`. Output from invoices that are in the accounts app (`in-accounts`, `sent`, or `where: "accounts"`; never `draft`, `waiting`, `void` or `linked`) issued in the quarter (or paid, with `cashAccounting`; flat rate: `flatRate` % of gross received). Input from confirmed outgoings with `vatIncluded` at 1/6 of the amount when rate 20. Labelled estimate |
| `taxDates(data, today, weeks)` | estimated outgoings for VAT returns in range and, for sole traders, 31 January and 31 July payments; for limited companies, corporation tax 9 months and 1 day after the year end. Amounts: VAT from `vatQuarter`; income or corporation tax shown as "amount: ask your accountant" (0 in the forecast, flagged) unless the owner typed one as an outgoing |
| `taxPot(data, today)` | `{ shouldHave, inPot, moved, toMove }`: VAT on money received this VAT quarter and in an earlier quarter whose return isn't due yet (if registered), **less VAT already paid for that earlier quarter** (outgoings or bank lines in category `tax` whose name or text says VAT, dated after that quarter ended, applied oldest quarter first and never taking a quarter below nothing), plus `setAsidePercent` of money received (after VAT) since `yearStart`, minus income or corporation tax already paid out this year (outgoings or bank lines in category `tax` that don't say VAT). **Money received means invoice payments only**: a bank line never adds income; `inPot` = pot account balance if known, else sum of `potMoves` this year; `toMove` = max(0, shouldHave - inPot) |
| `derivedFlags(data, today)` | overdue invoices, low point under `nervousBalance` in the next 12 weeks, tax pot short by more than £50, data older than 7 days, suggested items waiting |
| `money(n)` | "£1,234.56" (or "£1,235" with `{ round: true }`), minus sign before the pound sign |
| `scenarioCompare(data, today, ids)` | for each scenario and "as things are": `{ id, name, lowPoint, endBalance, weeks }` |
| `normalise(d)` | fills missing lists and settings, drops broken records |

`apps/money/app/model.test` is not a file: tests live in `maintainers/test-model.js` (plain Node assertions), covering invoiceTotals, invoiceState, nextInvoiceNumber, occurrences (31st of the month, February), forecast, lowPoint, vatQuarter (standard, cash, flat), taxPot, months, scenarioCompare.

## The page (one page, like Content Machine OS)

`apps/money/index.html` is a single page. Sidebar shows one page: "Money view" (`menu.json` id `money`, icon `wallet`). Under the top bar (page name, a line showing "As at <date>, from <source>", Brain dump button, Claude status pill, light and dark switch) sits the **rail**: on the left a segmented switch **Overview | Months | Invoices | In and out | What if** (Invoices shows the overdue count); on the right **Refresh numbers** (runs the `refresh-money` job), **New invoice** (primary) and a gear for **Settings**. Each view has its own address (`#overview`, `#months`, `#invoices`, `#inout`, `#whatif`, `#invoice/<id>`) so Home boxes link straight to them.

Footer line on every view: "Estimates to help you plan, not financial advice. Check big decisions with your accountant."

### Setup card (shared v6)

Before setup (no `settings.businessName` and no accounts or invoices): "Let's set up your money view": open this folder in the Code tab of the Claude desktop app and type `/setup`, with a copy button. Every other empty state says what fills it.

### Overview

- **Stats strip** (each a button to its view): Cash today (with as-at and source), Lowest point in the next 12 weeks (amount and week, warning colour under `nervousBalance`, danger under 0), Owed to you (and overdue part), Tax pot (`toMove` as "Move £X" or "Up to date").
- **Forecast chart**: hand-built SVG (load the `dataviz` skill), 12 weekly points: the balance line, the nervous balance as a dashed line, below-zero shaded, the low point marked and labelled. Hovering a week (and keyboard focus) shows a small card: money in and out that week, item by item. Toggle "Include maybes". Under the chart one plain line from the model ("Your tightest week is w/c 17 Nov at £2,140, after the VAT return").
- **Tax pot box**: should have, in the pot, to move; **Open <bank>** (opens `settings.bank.link` in a new tab, hidden if empty) and **I've moved it** (amount box, prefilled with `toMove`, adds a `potMove`). One line: "Claude works this out from what you've been paid. It never moves money."
- **Flags tray**: derived flags first, then Claude's open flags. Each with its action: overdue → **Chase** (opens the invoice with the chaser), suggested items → **Check**, dismiss (kept, `dismissed`).
- **Coming up**: the next 14 days of money in and out as a short list.

### Months

A row per month (last 3, this month, next 6) with bars and figures: invoiced, paid, due, expected, money out, and the difference. This month highlighted. Click a month to see its items. Past months say "actual", future months "estimate". Under 560 pixels it becomes stacked cards (no sideways scroll, container queries as shared v6).

### Invoices

- Filter chips: All, Draft, Waiting for you to send, Due, Overdue, Paid, Cancelled. Search by customer or number. Sorted overdue first, then due date.
- Row: number, customer, issued, due, total, paid, state pill, where it lives (Money View, Xero draft, In Xero).
- **Invoice drawer** (from a row or New invoice): customer (suggests customers already used), email, issue and due date, lines (text, qty, price, VAT rate: 20, 5, 0, or "no VAT" when not registered) with totals worked out live by the model, notes. Buttons by state:
  - `draft` + `sources.accounts.mode` `drafts`: **Put it in <app> as a draft** (status `waiting`, `request.kind = "draft"`, calls `put-invoices-in-accounts`). Then a line: "Claude adds it to <app> as a draft. You check it and send it from there."
  - ~~`draft` + any other mode: **Download PDF** (opens the print page) and **Mark as sent**.~~ **[Superseded: `draft` + `read`: **Open <app> to raise it** and the line "Your connection reads only, so you raise it in <app>. It shows here on the next refresh." No PDF, no Mark as sent.]**
  - `in-accounts`: **Open <app>** (link), **I've sent it** (status `sent`).
  - sent and not fully paid: ~~**Record a payment** (date, amount),~~ **Chase** (asks Claude, through the `chase-invoices` job, to draft a polite reminder with `polite-chaser`; the draft shows in the drawer with **Copy** and **Open email**; never sent by Claude). **Chase shows only for sent or overdue invoices.** (Record a payment is gone: payments come from the accounts app.)
  - **Cancel invoice** (status `void`, with Undo). Never deleted. **Hidden for invoices with `where: "accounts"`.**
- ~~**Print page** `apps/money/print.html?id=<id>`: A4, the business's brand from `theme.css` and `images/`, from, to, number, dates, lines, VAT, total, payment details, footer. Uses the browser's print to PDF. Shows "Draft" across it while status is `draft`.~~ **[Superseded 21 October 2026, late: see CHANGE 2 above.]**

### In and out

3 sections: **Money coming in** (expected items, with suggested ones at the top waiting for **Confirm** or **Drop**, from Pipeline OS and Proposal OS when attached), **Money going out** (regular and one-off, grouped by category, with monthly total worked out by the app; suggested ones from the accounts app waiting for Confirm), **Tax and VAT dates** (from `taxDates`, each labelled estimate). Add, edit inline, drop (kept, `dropped`, with Undo).

### What if

A card per scenario: name, its changes ("Hire someone at £2,400 a month from March", "Lose Greenway Café from January"), on/off. **Add a what if** builds one with a simple form (kind, name, amount, repeat, from, to, customer). The chart shows "As things are" and every switched-on scenario as lines on the same axes; a table compares lowest point, when, and balance in 12 weeks (`scenarioCompare`). An "Ask Claude" box ("Can I afford a new van at £450 a month?") calls the `can-i-afford-this` job, which builds a scenario and writes a one-paragraph note in `scenarios[].note`; the numbers still come from the model.

### Settings dialog

Business name, first name, business type, year start, week starts, nervous balance, VAT (registered, scheme, rate, flat rate, quarter end months, cash accounting), tax set-aside percent with one line ("Ask your accountant what to put aside."), tax pot account, invoice prefix, next number, payment terms, bank name and link (~~from address, payment details, footer~~ removed: there is no PDF). Accounts list (name, kind, balance, as at: editable by the owner, marked source `you`).

## Home boxes (`home-boxes.js`, all `defaultOn: false`)

"Cash today" (size 1), "Lowest point" (size 1, tiny sparkline), "Owed to you" (size 1, overdue count, links to `#invoices`), "Tax pot" (size 1), "Next 14 days" (size 2). Before setup the first box shows the setup card.

## Claude jobs: `apps/money/claude-jobs.json`

| job | label | does |
|---|---|---|
| `refresh-money` | refreshing your money view | `update-my-money-view` |
| `put-invoices-in-accounts` | putting your invoices in as drafts | `put-invoices-in-my-accounts` for invoices with `request.kind = "draft"` |
| `chase-invoices` | drafting your reminders | `who-owes-me-money` for the named or overdue invoices: drafts only, into `invoices[].notes`-adjacent `chaser` field (`{ text, at }`) |
| `can-i-afford-this` | working out your what if | `can-i-afford-this` for the scenario with a `request` |

Each prompt ends "Move no money. Send nothing. Change nothing else." and keeps to `apps/money/data/money.json` and `context/`. Add `chaser: null` and `request` on scenarios to the shapes above (`scenarios[].request: null | { "question": "", "at": iso }`, `scenarios[].note: ""`).

## Skills (`.claude/skills/`), triggered by what people say

Shared (copied from the template): `connect-a-tool`, `human-email`, `keep-context-fresh`, `match-my-brand`, `polite-chaser`, `setup`, `sort-brain-dump`, `write-like-me`. **Changed 21 October 2026 (late, George): `file-it` is removed, `open-task-list` is renamed `open-money-view`, and `keep-context-fresh` and `match-my-brand` are trimmed to Money View. See `MAINTAINING.md`, "Money View OS stands alone".** Remove the content tool's own skills.

| skill | people say | does |
|---|---|---|
| `update-my-money-view` | "update my money view", "refresh my numbers", "what's in the bank" | Reads the connected accounts app (invoices, bills, bank transactions, balances) through its live connection only (~~or the newest statement in `files/05-finance/statements/`, or the bank's read-only access~~: no exports, no direct bank). Updates `accounts`, adds `transactions` (no duplicates: same date, amount and text), adds invoices with `where: "accounts"`, adds the payments the accounts app shows (never from a bank line), links a draft note to its arrived invoice (`linked`), suggests regular outgoings it spots (`status: "suggested"`), writes flags, logs an import. Never types a total, a forecast or a tax figure |
~~| `import-a-statement` | "here's my bank statement", "import this", a CSV dropped in | Reads a CSV or PDF statement from any UK bank (column guide in `references/banks.md`), same rules as above. Files the statement in `files/05-finance/statements/` |~~ **[Superseded 21 October 2026, late: see CHANGE 2 above.]**
| `raise-an-invoice` | "invoice Greenway Café for the menu, £850", "raise an invoice" | Creates a `draft` invoice in Money View with the next number and the terms, asks anything missing (one question), then offers to put it into the accounts app as a draft or ~~open the PDF~~ open the app's new invoice page |
| `put-invoices-in-my-accounts` | (the job) "put that in Xero" | For each invoice with `request.kind = "draft"`: creates it as a DRAFT in the accounts app through the connection (never approved, never sent, never emailed), sets `ref`, `status: "in-accounts"`, clears `request`. If the connection can't create drafts, sets the invoice back to `draft`, clears `request`, and writes a flag saying so in plain words. **Never creates a contact** (CHANGE 2, E): a customer who isn't already a contact in Xero sends the invoice back to `draft` with the flag "Add <customer> as a contact in Xero, then press Put it in Xero again" |
| `who-owes-me-money` | "who owes me money", "chase my invoices" | Lists unpaid and overdue invoices from the data, drafts reminders with `polite-chaser` into `invoices[].chaser`, attached: creates chase tasks in Task List OS (waiting for a click). Never sends |
| `whats-coming-in` | "what's coming in", "how's cash looking", "money check-in" | Reads what the app shows (forecast, low point, owed, tax pot) by running the same rules (read `model.js`; quote figures the app shows, never work out new ones in your head) and says it in plain words |
| `can-i-afford-this` | "can I afford a van", "what if I hire someone", "what if I lose Greenway" | Builds a scenario (changes only), switches it on, then explains what the app's What if view shows. Says it's an estimate, and to check big decisions with their accountant |
| `set-aside-for-tax` | "how much should I put aside", "tax pot" | Explains the app's tax pot figure and how it's worked out, reminds them they move the money themselves, logs a `potMove` when they say they've moved it |
| `sort-money-brain-dump` | (called by `sort-brain-dump`) | Turns brain dump notes about money into expected items, outgoings or invoices (all `suggested` or `draft`) |

Every skill: plain English, reads `context/` and `context/money.md` first, writes only through the data file (keeping the shapes, appending to `activity`), never moves money, never sends, never approves or deletes anything in the accounts app, never stores bank details. ~~Bank statement column guides for the common UK banks live once in `.claude/skills/import-a-statement/references/banks.md`.~~ **[Superseded: there are no statement imports and no column guides. `setup/connections/bank-feeds.md` has the clicks to switch on a bank feed; mark any not checked "to check".]**

## Setup (`setup/`)

`setup/progress.md` and the shared `setup` skill list:

1. Shared `05-get-to-know-the-business.md` with the brand step (from the template).
2. `setup/money-01-your-accounts.md`: **"Have you got your accounts software connected to Claude already?"** If yes: Claude checks it (reads the last 5 invoices and the bank accounts it can see), says what it found, and checks whether the connection can create draft invoices (look at the tools it offers). If not: **"Which accounts software do you use?"** (Xero, QuickBooks, ~~FreeAgent, Sage,~~ something else, none; FreeAgent, Sage and anything else get the "not supported yet" paragraph and setup stops) and ~~**"How do you send invoices at the moment?"** (from the accounts app, Word or Excel, an invoicing app, by hand)~~. Then connect it using `setup/connections/<app>.md`. For Xero, offer the optional drafts connection (`setup/connections/xero-drafts.md`, click by click, skippable). ~~With no accounts app, Money View becomes their invoice book (`mode: "book"`): ask their invoice numbering and the last number they used.~~ With no accounts app, setup says so in one plain paragraph and stops. Saves `sources.accounts`, `settings.invoice`, `context/money.md`.
3. `setup/money-02-your-bank.md`: **"Which bank do you use for the business?"** Explain read-only in one sentence ("Claude can see balances and payments, never your login or card, and it can't move money"). The feed is the accounts app's bank feed, and it is required: setup doesn't carry on without it, and stops if their bank isn't offered by the accounts app. ~~Starling's own read-only access (`setup/connections/starling.md`); otherwise a statement export from `banks.md` saved in `files/05-finance/statements/`.~~ Then: "Do you keep a separate pot or savings account for tax?" (which one; if not, suggest they make one in their bank app themselves). Saves `sources.bank`, `settings.bank` (name and the link to their online banking), `accounts`, `settings.tax.potAccountId`.
4. `setup/money-03-money-out.md`: runs `update-my-money-view`, then shows the regular payments it spotted for the person to confirm one by one (or all at once), asks about any big ones coming (one-offs, a loan ending), VAT (registered? scheme? quarter ends?), business type and year end, the tax set-aside percent ("what does your accountant tell you to put aside?", if they don't know: leave 0 and add a flag), and the balance that makes them nervous.
5. `setup/money-04-first-view.md`: checks expected income ("anything coming in that isn't invoiced yet?"), opens the app on Overview, explains the 4 numbers at the top and the chart in a few lines, shows how to raise an invoice.
6. `09-check-and-hand-over.md` adapted.

START-HERE.md follows the template's shape; its "What Money View OS is" list and ground rules carry decisions 1 and 2 and the connection facts above. Its person note says it needs about 25 minutes and, once trusted, Claude can read their accounts and update the money view without asking every time, but can't send, pay, move or delete anything.

## Context

New `context/money.md` (headings only): Accounts app and how we invoice, Bank and pots, VAT, Tax (what the accountant says), Regular bills, Customers who pay late, Things to watch.

## Attaching (`ATTACH-CLAUDE.md`, `toolkit.json`)

- Reads: Pipeline OS won deals → `expected` (`source: "pipeline"`, `status: "suggested"`); Proposal OS approved or won proposals → `expected` (`source: "proposals"`); Ads OS spend → `outgoings` (`source: "ads"`, `category: "ads"`, suggested).
- Sends to Task List OS: a chase task per overdue invoice ("Chase Greenway Café for INV-0042, £850, 12 days late"), "Send INV-0043 from Xero" for invoices sitting as drafts in the accounts app, "Move £640 to your Tax pot" when `toMove` is over £50. All written the way Content Machine OS writes tasks into Task List OS, waiting for the person's click.
- `catalogue.json`: in this kit only, change the `money` entry's description to: "Your money month by month: what's invoiced, paid and due, and a forecast of the next 12 weeks. Raise invoices into your accounts app, and see what to put aside for tax. It never moves money." Note it in `maintainers/SHARED-CATALOGUE-RENAME.md`. Keep the rest of `catalogue.json` exactly as the template has it (File Finder OS is still listed in every repo `main`; its removal arrives by pull request later).

## Settings (`.claude/settings.json`)

Allow `Read(./**)`, Edit and Write on `./apps/money/data/**`, `./apps/home/data/**`, `./context/**`, `./files/**`, Edit `./setup/progress.md`, and the start scripts. Pre-approve reading tools of the Xero connector only if the template pattern allows naming connector tools; never pre-approve anything that creates, sends, pays or deletes (including the Xero drafts tools: those always ask).

## Files and layout

```
apps/money/
  CLAUDE.md  ATTACH-CLAUDE.md  claude-jobs.json  menu.json  home-boxes.js  index.html  ~~print.html~~
  data/money.json
  app/ app.css app.js model.js components.js chart.js drawer.js settings.js
       view-overview.js view-months.js view-invoices.js view-inout.js view-whatif.js  ~~print.js~~
```

Release check (`maintainers/make-release.sh`): `apps/money/data/money.json` must equal the empty file above; refuse filled `context/money.md`, any `*.csv`, `*.pdf` or `*.xlsx` under `files/`, the `import-a-statement` skill, `setup/connections/starling.md` and `files/05-finance/statements/`, demo code, real data, and a `media` setting on this tool. It also checks the full banned-word list (and em and en dashes) over everything this tool ships.

## Tests

`maintainers/TESTING.md` adapted, plus `maintainers/test-model.js` (`node maintainers/test-model.js`). Hand tests: every view in light and dark, at 375, 768 and 1280 pixels, no sideways scroll; jobs through the fake Claude; ~~the print page to PDF~~ (no print page); the rail at 375 pixels (all 5 views visible, in 2 rows); attached to a scratch Task List OS.
