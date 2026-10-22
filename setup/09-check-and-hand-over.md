# Step 6 of 6: check and hand over

Goal: prove it all works, then leave them with a clear picture of where their money stands and what they need to do.

## 1. What good looks like

Check these yourself. Fix anything that fails, then check again.

- [ ] The app opens at **http://localhost:4747/money/**.
- [ ] The Overview shows their real figures with where each came from and when, not placeholder text. Cash today, lowest point, owed and tax pot all show.
- [ ] The chart draws 12 weeks, and resting the mouse on a week shows what's in it.
- [ ] Invoices lists their real invoices from their accounts software. New invoice works out the total and the VAT, and offers **Put it in <app> as a draft** (drafts connection) or **Open <app> to raise it** (read only).
- [ ] In and out shows their confirmed payments, and anything suggested is waiting for **Confirm** or **Drop**.
- [ ] The tax pot box shows the amount to move, **Open <bank>** goes to their bank's page (if they gave one) and **I've moved it** logs a move.
- [ ] The **Refresh numbers** button can ask Claude to run a job. It needs Claude Code installed on this computer; if it isn't, the app says to ask Claude instead, rather than failing quietly.
- [ ] The app looks right in both light and dark (the moon or sun button at the top).
- [ ] Nothing secret (a password, a key, a sort code, an account number or a card number) is anywhere in this folder, and nothing was sent, paid, moved or changed in their accounts or bank.

## 2. Hand over

Give them a plain summary with real figures from the Overview, never an example. For instance:

> Here's where you are. You use Xero, read by Claude, and your business current account is read from your Xero bank feed. As at 21 October you've got £6,420 in the bank, £2,150 is owed to you (£850 of it overdue), and your tightest week in the next 12 is the week of 17 November at £2,140, after your VAT return. The app says £640 is left to move to your tax pot. I've confirmed 9 regular payments with you.

Say those figures only as the app shows them. Then tell them, briefly:

- **What's waiting on them**, in your own words: any overdue invoice to chase, suggested payments to confirm, the amount to move to their tax pot.
- **How a day looks**: open the Overview, press Refresh numbers when they want fresh figures, raise invoices from New invoice, and move the tax money themselves.
- **What to say next**: "update my money view", "what's coming in?", "who owes me money?", "invoice Greenway Café for the menu", "can I afford a van?", "how much should I put aside?", and "update my money view" for fresh numbers.
- Their link, **http://localhost:4747/money/**. Bookmark it.
- That Claude can read their accounts and update the money view without asking every time, but it can't send, pay, move or delete anything. Estimates to help them plan, not financial advice: check big decisions with their accountant.

## 3. A regular refresh (optional)

Only offer this if they want it, and only as a scheduled routine with the same "ask first" rule as anything else:

> Want me to bring your numbers up to date every Monday morning, so the money view is fresh when you open it? I'd only read. I'd never send, pay or move anything.

If they say yes, set it up as a scheduled task, and note it in `setup/progress.md`.

## 4. Mark setup complete

Only now, at the very end:

1. In `CLAUDE.md`, change `Setup: not done yet` to `Setup: complete on <date>`.

Never commit any of these changes yourself; that's for the people who maintain this kit.

Tick this step in `setup/progress.md` and change "Setup status" to `complete on <date>`.
