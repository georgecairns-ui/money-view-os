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
- [ ] Their accounts app has a row in `apps/home/data/connections.json` that says `connected`, with a `checked` date from this setup. Do one small read now (their unpaid invoices) to check it still works. If it fails, follow `.claude/skills/connect-a-tool` until it reads again.
- [ ] Home shows the Connections box with their accounts app as Connected.

## 2. A regular refresh (their choice)

The tools named in this section are often not loaded yet: search your tools for them first.

### 2.1 Agree the day and time

Ask once, in plain words:

> Want me to bring your numbers up to date on my own, so the money view is fresh when you open it? I'd suggest Monday mornings at 8am. Shall I use that, or would other days or times suit you better? I'd only read. I'd never send, pay or move anything.

Say plainly: "It uses a little of your Claude allowance each time, and it only runs while your computer is on and the Claude app is open."

If they say no, note "Regular refresh: said no" in `setup/progress.md`, tell them they can say "update my money view" or press **Refresh numbers** any time, and go to section 3.

### 2.2 Let it read without stopping

A refresh that runs on its own stops if it has to ask permission, and nobody is there to answer. So, with their yes, allow the read-only tools of the accounts connection that's `connected` in `apps/home/data/connections.json`:

1. From your own list of tools, collect the names of that connection's read tools: exactly the ones its guide in `setup/connections/` lists under "Pre-approve for check-ins" (for Xero, `xero.md`; for QuickBooks, the rule in `quickbooks.md`). Never any name containing create, update, delete, send, mark, archive, add, remove, set, move, post, reply, label, trash or write, whatever else it matches, and never a tool of the optional Xero drafts connection: those always ask.
2. Show them the list in one line, for example: "Xero: read your invoices, bills, contacts, bank transactions and reports." Ask: "Can I let the regular refresh do just these without asking each time?"
3. If they say no, tell them plainly: "Then the regular refresh will stop at each permission prompt. If you'd rather, press Refresh numbers or say 'update my money view' whenever you want fresh figures." Note "Regular refresh: said no" in `setup/progress.md`, leave out 2.3 and go to section 3.
   With a yes, add them to `permissions.allow` in this folder's `.claude/settings.local.json` (create it if it isn't there, as `{ "permissions": { "allow": [] } }`), using the full tool names as they appear in your list (they start `mcp__`). Never add anything that sends, replies, forwards, deletes, archives, labels, pays, posts, books or changes anything.

`.claude/settings.local.json` stays on this computer and is never part of an update.

### 2.3 Create the regular refresh

Create it from this session, in this folder: a scheduled task runs in the folder it was made in.

First look with `list_scheduled_tasks` for an existing refresh task for this folder. If there is one, update it to the agreed days and times rather than making another. If not, create it yourself with the desktop app's scheduled tasks tool (`create_scheduled_task`):
- **Title:** "<their business> money refresh", for example "Harbour Bakery money refresh".
- **Prompt:** `In <full path of this folder>, run /update-my-money-view: follow .claude/skills/update-my-money-view/SKILL.md. Never send anything except emails the person has already approved in the app; apart from those, never reply, forward, delete, archive, label, pay or post anything.` Fill in this folder's full path.
- **When:** the days and times they agreed.

Then run it once now (`run_scheduled_task`) and check it finished without stopping to ask anything (`list_task_runs`). With the numbers just brought up to date, it adds little or nothing. If it stopped at a permission, ask the person before adding that tool, and only if it is read-only under 2.2's rule; then run it again. If the stop is at a tool that isn't read-only, tell them and leave it. Only ever one refresh task for this folder.

Then look up that first run's session with the desktop app's session tools (for example `get_session` with the run's session id) and check 2 things:
- **It ran in this folder.** If it ran somewhere else, delete nothing: update the task's prompt so it opens with this folder's full path, and run it again. If it still runs elsewhere, tell the person plainly that the regular refresh can't find this folder, and offer the alternative: they press Refresh numbers or say "update my money view" whenever they want fresh figures.
- **It didn't run in an Auto or Bypass permission mode.** If it did, tell the person in one line: "This session is set to act without asking, so the regular refresh would too." Then ask them to switch this session to the normal permission mode, where Claude asks first. Once it is switched, delete that refresh task and create it again from this session, so there is still only one. (The "delete nothing" rule above is only for the wrong-folder case.)

### 2.4 Record it

Check that `list_scheduled_tasks` shows exactly one refresh task for this folder, and that `.claude/settings.local.json`, if it's there, holds only the read tools 2.2 added with their yes. Note the days and times in `context/tools.md` and `setup/progress.md`.

## 3. Hand over

Give them a plain summary with real figures from the Overview, never an example. For instance:

> Here's where you are. You use Xero, read by Claude, and your business current account is read from your Xero bank feed. As at 21 October you've got £6,420 in the bank, £2,150 is owed to you (£850 of it overdue), and your tightest week in the next 12 is the week of 17 November at £2,140, after your VAT return. The app says £640 is left to move to your tax pot. I've confirmed 9 regular payments with you.

Say those figures only as the app shows them. Then tell them, briefly:

- **What's waiting on them**, in your own words: any overdue invoice to chase, suggested payments to confirm, the amount to move to their tax pot.
- **How a day looks**: open the Overview, press Refresh numbers when they want fresh figures, raise invoices from New invoice, and move the tax money themselves.
- **What to say next**: "update my money view", "what's coming in?", "who owes me money?", "invoice Greenway Café for the menu", "can I afford a van?", "how much should I put aside?", and "update my money view" for fresh numbers.
- Their link, **http://localhost:4747/money/**. Bookmark it.
- That Claude can read their accounts and update the money view without asking every time, but it can't send, pay, move or delete anything. Estimates to help them plan, not financial advice: check big decisions with their accountant.
- That they can say "get the latest version" any time and you will bring the app up to date, keeping everything of theirs.
- **Their connection**, in one line: which accounts app you connected, and that its bank feed is read through it.
- **The regular refresh**, if they chose it: the days and times it runs.
- **Xero only**, in these words: "If you'd ever like me to put invoices into Xero as drafts for you, say 'put invoices in Xero'."

## 4. Mark setup complete

Only now, at the very end:

1. In `CLAUDE.md`, change `Setup: not done yet` to `Setup: complete on <date>`.

Never commit any of these changes yourself; that's for the people who maintain this kit.

Tick this step in `setup/progress.md` and change "Setup status" to `complete on <date>`.
