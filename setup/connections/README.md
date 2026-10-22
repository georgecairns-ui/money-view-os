# Connecting apps: which guide to follow

Use `.claude/skills/connect-a-tool/SKILL.md` for the general method (order of preference, safety rules, never ask for a key in chat). This folder has the specifics for each app. Follow the file for the app the person names.

Money View OS works on top of an accounts app and sees the bank only through that app's own bank feed.

| App | What it gives Money View | Recommended route | File |
|---|---|---|---|
| Xero | Invoices, payments, bank lines and balances (read only) | Claude connector (read-only) | `xero.md` |
| Xero, to put invoices in as drafts (optional) | Money View can create a draft invoice for the person to check and send from Xero | Xero's own open source connection, about 10 minutes | `xero-drafts.md` |
| QuickBooks Online | Invoices, payments, bank lines and balances. Supported only when Claude shows Intuit's QuickBooks connector (US customers only for now), which can also create an invoice for the person to check and send | Claude connector | `quickbooks.md` |
| FreeAgent (not supported yet) | Money View can't connect to it yet | None | `freeagent.md` |
| Sage (not supported yet) | Money View can't connect to it yet | None | `sage.md` |
| Bank feeds | Business bank transactions, through the accounts app's own bank feed (required) | Switched on inside the accounts app | `bank-feeds.md` |

Default for every app: read, and prepare drafts where the app allows. Claude never sends, pays, deletes, posts, cancels or changes anything on the person's behalf unless they ask for that one specific action in that conversation. Record every connection in `context/tools.md` once it is working.
