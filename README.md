# Money View OS

**Your money month by month, and what it looks like for the next 12 weeks.** A free kit from [Get AI Powers](https://getaipowers.com), run by Claude.

Most business owners know roughly what's in the bank and have no idea what it will look like in 6 weeks. Money View OS works on top of your accounts software: Xero today, and QuickBooks where your Claude shows Intuit's QuickBooks connector (Intuit says US only for now). It reads your invoices and your business bank feed, read only, and shows what's invoiced and due, what's been paid and what's still to come in and go out, with a forecast of the next 12 weeks. It works out how much to put aside for tax, and shows you the amount to move to your tax pot.

**Claude never moves money, and never sends an invoice.** The app suggests: "Move £640 to your Tax pot", with a button that opens your bank. You make the move, then tell the app you've done it. Invoices go into your accounts software as drafts for you to check and send, or Money View opens your accounts software's new invoice page. Money View OS never sends, pays, approves or deletes anything, and never asks for a bank login, a sort code, an account number or a card number.

Money View OS is one of 7 free tools from Get AI Powers, and it works fully on its own. The app's menu shows the others, and Get AI Powers sets them up with you on a free call.

Estimates to help you plan, not financial advice. Check big decisions with your accountant.

## What happens when you type /setup

You copy the kit, open it in Claude Code and type **/setup**. In about 25 minutes, Claude:

- **Gets to know your business**, in a short chat, then matches the app to your brand.
- **Asks which accounts software you use** and connects it. You need one: Money View works on top of it.
- **Switches on your business bank feed** inside your accounts software, click by click, so Claude can see your transactions, read only.
- **Confirms your regular payments**, your VAT and what your accountant tells you to put aside, one question at a time.
- **Shows you your first money view**, and how to raise an invoice.
- **Checks it all works and hands over.**

## What it does

- **Overview.** Cash today, your lowest point in the next 12 weeks, what you're owed and your tax pot, with a 12 week forecast you can rest your mouse on to see what's coming in and going out.
- **Months.** Each month: invoiced, paid, due, expected and going out. Past months are actual, future months are estimates.
- **Invoices.** They come from your accounts software. Write a new one and the app does the totals and the VAT, then put it in your accounts software as a draft (if you've set up that connection) or open its new invoice page. You check it and send it from there. Ask Claude for a polite reminder when one is late.
- **In and out.** Money you expect and bills going out, with Claude's suggestions waiting for your click, plus your VAT and tax dates.
- **What if.** Try a new van, a hire or losing a customer, and see what it does to your tightest week.
- **A tax pot.** The app works out what to put aside. You move the money yourself.
- **Every figure says where it came from and when.** "From Xero, 21 Oct" or "Estimate".

It's **yours to shape**: your VAT scheme, your tax year, how much makes you nervous, your own colours, in light or dark.

## What you need

- **Claude Code**, signed in with a paid Claude plan (Pro or Max). The Claude desktop app works too.
- Your accounts software: Xero today, or QuickBooks where your Claude shows Intuit's QuickBooks connector (Intuit says US only for now). Money View works on top of one, and can't connect to FreeAgent, Sage or other accounts apps yet.
- Nothing else to install in most cases. The app runs on your own computer using Node (Claude installs it for you if it's missing, with your permission).
- About 25 minutes, once.

## Get started

1. **Open Claude Code** in the Claude desktop app (the Code tab) or in the Terminal (on Windows, PowerShell). Any folder will do for this first step.
2. **Ask Claude to fetch the kit.** Paste this:
   > Copy https://github.com/georgecairns-ui/money-view-os into a folder called "Money View OS" in my Documents, then tell me how to open it and set it up.

   Claude copies everything onto your computer and gives you one line to open the new folder. In the desktop app, you choose the folder instead. (If your computer asks to install "command line developer tools" or Git, say yes; it's free and takes a few minutes.)
3. **Open the Money View OS folder in Claude Code and choose "Yes, I trust this folder".** The first time, Claude Code asks whether you trust the folder and warns that it pre-approves some permissions. Those permissions only let Claude update your money view and your business notes, and start the app, without stopping to ask each time. It still can't send, pay, move or delete anything. Press the down arrow, then Enter.
4. **Type `/setup`.**

Then it opens your money view and gives you its link, **http://localhost:4747/money/**. Bookmark it.

## Every day

| Say (or type the command) | What happens |
|---|---|
| "Update my money view", "what's in the bank?" | Claude reads your accounts and bank and brings your figures up to date |
| "What's coming in?", "how's cash looking?" | Claude tells you what the app shows, in plain words |
| "Invoice Greenway Café for the menu, £850" | A draft invoice, with the next number and your terms |
| "Put that in Xero" | The invoice goes into Xero as a draft, if you've set up that connection. You check it and send it from Xero |
| "Who owes me money?", "chase my invoices" | A list of what's overdue and a polite reminder for each, for you to send |
| "Can I afford a van?" | A what if on your 12 week view. It's an estimate: check it with your accountant |
| "How much should I put aside?", "I've moved it" | Your tax pot explained, and your move logged |
| "Is the bank feed working?" | Claude checks it can see your recent transactions, and tells you how to reconnect it if not |

## Your information

Your money view lives in this folder on your computer, in one file. Your notes about the business are in `context/`. Claude reads your accounts software and its bank feed through your own Claude account, read only. There's no Money View OS account or server; Get AI Powers can't see any of it. Read [docs/PRIVACY-AND-SAFETY.md](docs/PRIVACY-AND-SAFETY.md) for the detail.

## Want it set up properly for you?

Money View OS works on its own. If you'd like help turning it into a weekly habit for your whole team, Get AI Powers can help. Find us at [getaipowers.com](https://getaipowers.com).

## What's inside

```
START-HERE.md          Claude reads this first and runs setup (/setup)
toolkit.json           what this tool is, for attaching it to the others in the toolkit
ATTACHING.md           how the toolkit's tools attach to each other
CLAUDE.md              Claude's standing instructions in this folder
Open Money View.html   double-click to open your money view (or use the link Claude gives you)
setup/                 the 6 setup steps and the key scripts
context/               Claude's notes about your business and its money
.claude/skills/        saved know-how; each one also works as a command in Claude Code
files/                 your finance papers and an archive folder
apps/                  the app and its look (theme.css); apps/money/data/money.json is your money view
docs/                  privacy and safety
maintainers/           for people developing Money View OS itself
```

## Licence

Free to use and change for your own business. Not for resale. See [LICENSE](LICENSE) for the plain-English terms.

Fonts: Figtree (the app's font), plus Zilla Slab and Source Serif 4 for anyone who wants them, all under the SIL Open Font License (see `apps/shared/fonts/OFL.txt`).
