# Build prompt: Money View OS

**How to run this:** first make sure the Task List OS redesign (shared version 3) is checked and published. Then in the Claude desktop app, go to the Code tab, start a new session and choose your `getaipowers` folder inside `Repos`. Copy everything below the line, paste it in and send. Claude reads, comes back with a plan for you to OK, then does the rest, including GitHub and the Google Drive copy. It stops once more, just before publishing.

Updated 7 October 2026 for shared version 3 (Home dashboard, sidebar dropdowns, light and dark, the brand step in setup). The previous version is in `_archive/build-prompts-v2/`.

---

You're helping me (George, Get AI Powers) build **Money View OS**, one tool in our small business toolkit. I'm not a developer, so explain anything technical in plain English and give me exact click-by-click steps whenever I need to do something myself.

## The toolkit

The toolkit is a set of tools for UK small business owners: Task List OS (already built) plus 8 more. Each one is a complete kit someone can use on its own, and each one can be attached to any of the others, so whatever combination a customer has works as one app with one Claude. Attach all of them and they have the whole toolkit. That's the point Joey and I agreed: separate tools that are useful alone, that we can give away individually, and that click together into something bigger. The people using it run "boring" businesses: trades, agencies, recruiters, brewers, accountants. Smart, busy, non-technical. They'll never look at code.

## Read these first

1. **`ATTACHING.md`**, in the Google Drive toolkit folder: `~/Library/CloudStorage/GoogleDrive-george.cairns@getaipowers.com/Shared drives/Get AI Powers Brain/Claude/05_Marketing/small-business-toolkit/money-view-os/ATTACHING.md`. The rules every tool follows so they attach to each other and show each other in the menu. Treat it as the spec. Copy it into the repository unchanged.
2. **Task List OS, at `~/Repos/getaipowers/task-list-os`.** It's the reference build, and Money View OS must look, feel, set up and behave like it. Read README.md, START-HERE.md, CLAUDE.md, LICENSE, `maintainers/MAINTAINING.md`, `maintainers/TESTING.md`, `docs/CUSTOMISING.md`, `apps/server/`, `apps/shared/`, `apps/home/`, everything in `apps/task-list/` (especially its CLAUDE.md, `menu.json` and `home-boxes.js`), `context/`, `setup/`, `.claude/skills/README.md` and a few skills, including `match-my-brand`. Your tool copies its layout, look, helper, setup style, skills style and wording rules. Its own notes already say future tools go in `apps/<tool-name>/`.
3. **Task List OS's `apps/shared/VERSION`.** It must say 3 or later: the redesign with the Home dashboard, the sidebar dropdowns, light and dark, and `match-my-brand`. If it says less, stop and tell me the Task List OS redesign isn't published yet. Read `maintainers/SHARED-V3-CHANGES.md`: it is the exact list of what every tool copies and what each tool makes for itself (`installed.json`, `toolkit.json`, `menu.json`, `home-boxes.js`, `index.html`, the store). If another tool in `~/Repos/getaipowers/` has a newer shared version, use that one.

If anything in this brief contradicts how Task List OS actually works, Task List OS wins: tell me what you found and follow it. Load my `get-ai-powers-brand` and `brand-web-kit` skills before designing any screen, but follow Task List OS's look (its `theme.css`, light and dark) so the tools match when they're attached.

## This tool: Money View OS

**The pain.** Owners don't know whether they can afford the hire or the new van. The figures from their accountant are 3 months old by the time they see them.

**What it does.** Cash today, money coming in (invoices owed, expected, overdue), money going out (regular bills, one-offs, VAT and tax dates) and a 12-week cash forecast showing the low point before it arrives. A "what if" builder compares scenarios side by side (hire someone from March, lose the biggest client). Claude refreshes the numbers from a bank statement export or a connected accounts app, and flags things worth a look: an overdue invoice, unusual spending, a low point coming up.

**Data** (`apps/money/data/money.json`): settings (currency, financial year start, VAT registered and quarter dates, the balance that makes them nervous), accounts (name, balance, as-at date), money in and out (including repeating items), scenarios, flags, imports log.

**Screens:** overview (cash today, lowest point in the next 12 weeks and when, owed to them and how much is overdue); forecast chart (hand-built SVG, load my `dataviz` skill); in and out lists; what-if builder; flags tray.

**Skills:** update my money view, what's coming in, can I afford this, who owes me money. Chasing uses Task List OS's `polite-chaser`.

**Setup steps:** which bank and accounts app, how to export a statement (walk through the clicks for the common UK banks), regular bills, VAT. Task List OS already has Xero, QuickBooks, FreeAgent and Stripe connection guides: reuse them.

**Attached:** won deals and won proposals appear as expected income for them to confirm. Ad spend appears as money going out. Overdue invoices become chase tasks.

**Watch out for:**
- Everything labelled as an estimate with an "as at" date and its source. The screen and CLAUDE.md say it isn't financial advice and to check big decisions with their accountant.
- Never moves money. Never stores bank logins, card numbers or account numbers.
- Not tied to one bank. A statement export from any UK bank is the baseline; connections are a bonus.

## Set up the repository (do all of this for me)

1. Create the repository at `~/Repos/getaipowers/money-view-os`, next to `task-list-os`, and set it up the way Task List OS is set up (same branch habits, same `.gitignore`, same release script adapted for this tool).
2. Lay it out exactly like Task List OS, as set out in `ATTACHING.md` and `SHARED-V3-CHANGES.md`: kit files at the root, `toolkit.json`, `apps/server/`, `apps/shared/` (including `catalogue.json`), `apps/home/`, `apps/installed.json` listing only this tool, `apps/money/` (with `menu.json` for its sidebar pages and `home-boxes.js` for its Home boxes, all `defaultOn: false`), `context/`, `files/`, `setup/`, `.claude/skills/`, `docs/`, `maintainers/`, and the launcher `Open Money View.html`. Copy the shared parts across from Task List OS byte for byte, don't rewrite them.
3. Copy Task List OS's LICENSE and change only the product name. Copy this build prompt into `maintainers/BUILD-PROMPT.md` and `ATTACHING.md` to the root.
4. Write `toolkit.json`, `apps/money/ATTACH-CLAUDE.md` and `maintainers/MAINTAINING.md` for this tool.
5. Commit at each milestone (set up, plan agreed, app working, setup and skills written, tested on its own, tested attached) with a plain-English message.
6. Publish: create a public GitHub repository called `money-view-os` on the same account as Task List OS (`georgecairns-ui`) and push. Before the very first push, tell me in one line what's about to go public and wait for my yes. That's the only time you need to stop and ask.
7. Google Drive copy: refresh the Drive folder `~/Library/CloudStorage/GoogleDrive-george.cairns@getaipowers.com/Shared drives/Get AI Powers Brain/Claude/05_Marketing/small-business-toolkit/money-view-os/` as a plain copy of the published version (no git history), the same way Task List OS's Drive copy works. Anything in that folder that isn't part of the published version goes into an `_archive` folder inside it, never deleted. Add the same "don't edit here" note Task List OS's copy has.
8. If `gh` (the GitHub command line tool) isn't installed or logged in, install it or walk me through the login in numbered steps, then carry on.

## Make it customisable for clients

- **Look**: `apps/shared/theme.css` and `apps/shared/images/` only, set by the `match-my-brand` step during setup. Every screen in light and dark, in Task List OS's look.
- **The menu**: your tool uses the shared sidebar and `catalogue.json` as they are. Every other toolkit tool shows locked with the Book a free call panel. Don't build your own menu or your own booking link.
- **Words and settings**: labels, stages, categories and anything business-specific in one obvious place, documented in `docs/CUSTOMISING.md` the way Task List OS does it.
- **Demo data**: the same made-up people and businesses as Task List OS (Sam, Priya, Tom at Greenway Café, Marlow Dental and the rest: check its `demo-data.js`), so a demo of several attached tools feels like one believable business.

## Rules (same as Task List OS)

- No frameworks, no libraries, nothing loaded from the internet. The app runs through the shared helper at http://localhost:4747 and works offline.
- Every change to a data file goes through `store.update()`.
- You propose, they approve. Read and draft only in connected apps. Never anything that sends, pays, deletes or posts on the customer's behalf, and never pre-approve tools that could in `.claude/settings.json`.
- Any number the person relies on (totals, VAT, forecasts, cost per lead) is calculated by the app from the raw data, never typed in by Claude.
- Customer-facing words never say agent, repo, repository, artifact, JSON, schema, API or MCP. British English, digits for numbers, no em dashes anywhere, including code comments.
- Never commit filled-in `context/`, real data, a ticked `setup/progress.md` or "Setup: complete". Copy Task List OS's release checks.
- No prices for Get AI Powers services anywhere. Point to getaipowers.com only.
- Never delete files. Move them to `files/99-archive/` (or `_archive/` for build files) and tell me.

## How to work with me

1. Read everything above, then come back with a short plan before writing any code: the screens in words, the data file, the skills and what people say to trigger them, the setup steps, exactly what this tool reads from and sends to the others (from the table in `ATTACHING.md`), any changes the shared parts need, and anything in this brief you think is wrong. Push back if something won't work. Wait for my OK.
2. Don't change the shared parts or Task List OS's skills. If you think they need changing, tell me what and why; that change gets made in Task List OS first and copied to every tool.
3. Build it, then test by hand following Task List OS's `maintainers/TESTING.md` and section 5 of `SHARED-V3-CHANGES.md`, on a scratch copy, never the shipped data.
4. **Test it on its own**: fresh copy, run `/setup` as if you were the customer's Claude with a made-up business, use every page and skill.
5. **Test the menu**: on its own, every other tool shows locked, and clicking one opens the panel with the right booking link and tracking.
6. **Test it attached**: on a scratch copy of Task List OS, follow `ATTACHING.md` to attach this tool. Check both appear as dropdowns in the sidebar, Home offers both tools' boxes, nothing in Task List OS broke, setup didn't ask questions `context/` already answered, and every handoff in the table lands where it should and waits for a click.
7. Write MARKETING.md in `maintainers/`: one plain sentence on what it does, the before and after for the owner, and the 3 things to show in a 60-second video. Mark any time-saving claim "to check".
8. Publish (step 6 of the repository section) and refresh the Drive copy.
9. Finish by telling me in plain English: where it is, the GitHub link, how to open it, how to try the demo, how attaching went, what isn't finished, and what you'd improve next.

## Update, 21 October 2026

George's new brief and decisions override this prompt where they differ. They are in `maintainers/SPEC.md`.
