# Connecting apps: which guide to follow

Use `.claude/skills/connect-a-tool/SKILL.md` for the general method (find the route, check or switch on the connection, prove it with a real read, record it, and what to do when there's no connector). This folder has the specifics for each app. Follow the file for the app the person names. Every guide has the same 6 sections, in the same order: Connect, If there's no connector, Prove it, What Claude may and may not do, Record, Sources. (Gmail and Google Calendar always has a connector, so its guide leaves out the second; Microsoft 365's is called "If their email isn't a work account".)

Money View OS works on top of an accounts app and sees the bank only through that app's own bank feed.

| App | What it gives Money View | Recommended route | File |
|---|---|---|---|
| Xero | Invoices, payments, bank lines and balances (read only) | Claude connector (read-only) | `xero.md` |
| Xero, to put invoices in as drafts (optional, only when the person asks; never offered in setup) | Money View can create a draft invoice for the person to check and send from Xero | Xero's own open source connection, about 10 minutes | `xero-drafts.md` |
| QuickBooks Online | Invoices, payments, bank lines and balances. Supported only when Claude shows Intuit's QuickBooks connector (US customers only for now), which can also create an invoice for the person to check and send | Claude connector ("Intuit QuickBooks", US customers only); no Claude connector for everyone else, so Money View can't connect yet | `quickbooks.md` |
| FreeAgent (not supported yet) | Money View can't connect to it yet | None: no connector in Claude's directory on 29 October 2026 (an export can be read in chat when asked) | `freeagent.md` |
| Sage (not supported yet) | Money View can't connect to it yet | None: no connector in Claude's directory on 29 October 2026 (an export can be read in chat when asked) | `sage.md` |
| Bank feeds | Business bank transactions, through the accounts app's own bank feed (required) | Switched on inside the accounts app | `bank-feeds.md` |

Default for every app: read, and prepare drafts where the app allows. Claude never sends, pays, deletes, posts, cancels or changes anything on the person's behalf unless they ask for that one specific action in that conversation. Record every connection once a real read has worked (see "Recording a connection" below). `xero-drafts.md` is the one guide outside this shape: an optional extra with its own steps.

## Recording a connection

`apps/home/data/connections.json`. Claude creates it in setup; it never ships.

```json
{
  "version": 1,
  "connections": {
    "gmail-and-google-calendar": {
      "name": "Gmail and Google Calendar",
      "status": "connected",
      "how": "Claude connectors: Gmail, Google Calendar",
      "checked": "2026-10-28",
      "note": "Read; prepare drafts. Never send, delete, archive or label."
    },
    "sage": {
      "name": "Sage",
      "status": "export-only",
      "how": "CSV export into files/",
      "checked": "",
      "note": "No Claude connector"
    }
  }
}
```

- Key: the guide's file name in `setup/connections/` without `.md`. For an app with no guide, the app's name in lower case with hyphens (`my-booking-system`).
- `status`: one of `connected`, `needs-attention`, `export-only`, `no-connector`, `not-connected`, `not-used`.
- `checked`: `YYYY-MM-DD` of the last successful read. Required when `status` is `connected`.

Rules:
- Write `connected` only after a real read worked, with that day's date in `checked`.
- When a check-in's read fails, set `needs-attention`, keep the old `checked`, and say so in the check-in summary.
- `context/tools.md` stays as the note the person can read; `connections.json` is what the app shows.
