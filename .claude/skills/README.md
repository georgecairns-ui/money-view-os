# Skills

Saved know-how for running your money view. You don't need to remember any of this: ask in your own words and Claude picks the right one.

Each skill is a folder with a `SKILL.md` inside. Claude reads them from here whenever this folder is open.

## Your money view

In Claude Code, every skill is also a command: type `/` and its name, for example `/update-my-money-view`.

| Skill | Say something like | What happens |
|---|---|---|
| `update-my-money-view` | "Update my money view", "refresh my numbers", "what's in the bank?", or press **Refresh numbers** in the app | Claude reads your accounts app, including its business bank feed, and brings your invoices, payments and bank lines up to date. It suggests the regular bills it spots and flags anything odd. It never works out a total or a tax figure: the app does |
| `raise-an-invoice` | "Invoice Greenway Café for the menu, £850", "raise an invoice" | Claude notes the invoice, asks what's missing, then puts it in your accounts app as a draft, or opens the app's new invoice page if your connection only reads. The app does the totals and the VAT |
| `put-invoices-in-my-accounts` | "Put that in Xero", or **Put it in Xero as a draft** in the app | Claude creates the invoice as a draft in your accounts app. You check it and send it from there. It never sends, approves or deletes an invoice. If your connection can't create drafts, it tells you, and Money View opens your accounts app's new invoice page so you raise it there |
| `who-owes-me-money` | "Who owes me money?", "chase my invoices", or **Chase** in the app | Claude lists what's unpaid and overdue and drafts a polite reminder for each invoice you've sent, in your voice. You send them. When Task List OS is attached, each becomes a task waiting for your click |
| `whats-coming-in` | "What's coming in?", "how's cash looking?", "money check-in" | Claude tells you in plain words what the app shows: cash today, who owes you, your tightest week and your tax pot |
| `can-i-afford-this` | "Can I afford a van?", "what if I hire someone?", "what if I lose Greenway?" | Claude adds a what if and switches it on, then explains what your What if view shows. It's an estimate, and big decisions need your accountant |
| `set-aside-for-tax` | "How much should I put aside?", "tax pot", "I've moved it" | Claude explains your tax pot figure and how it's worked out, and logs the move when you say you've made it. It never moves money |
| `sort-money-brain-dump` | Press **Brain dump** on any page (or V) and talk | Claude turns the money part of a brain dump into things waiting for your click: money you expect, bills going out and invoices to raise |

## Keeping things organised

| Skill | Say something like | What happens |
|---|---|---|
| `sort-brain-dump` | Press **Brain dump** on any page (or V) and talk | Claude sorts it and hands the money part to `sort-money-brain-dump` |
| `connect-a-tool` | "Connect my Xero" | Claude walks you through connecting an app safely |
| `match-my-brand` | "Make it match my brand" | Your colours, font and logo on the app, from your website or brand guidelines |
| `setup` | `/setup` | Runs the setup, or carries on where it left off |
| `open-money-view` | "Open my money view" | Starts the app if needed and gives you the link, http://localhost:4747/money/ |
| `keep-context-fresh` | (automatic) | When you mention something new about the business or your money, Claude offers to update its notes |

## Writing

| Skill | Say something like | What happens |
|---|---|---|
| `human-email` | "Make this sound less robotic" | Any reminder or invoice note is checked so it reads like a person wrote it |
| `write-like-me` | "Learn how I write" | Claude learns your style (with permission) and writes in it |
| `polite-chaser` | "Chase this up for me" | A reminder for a late invoice at the right level of firmness, with the specifics |

## The rules every skill follows

- Claude never moves money, pays a bill, sends an invoice or approves anything. It reads, drafts and suggests; you check and do.
- Claude never works out a total, a forecast or a tax figure. The app does, and every figure says where it came from and when.
- Claude never stores a bank login, a sort code, an account number or a card number.
- Claude never changes or deletes anything in your accounts app.
- Everything stays in this folder or in the apps you've connected.
- The figures are estimates to help you plan, not financial advice. Check big decisions with your accountant.

## Adding your own

Ask Claude: "Make a skill for how we do X." It'll write one in this folder using the same format, and show it to you first.
