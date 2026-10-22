# Catalogue change: Money View OS's description

The catalogue entry for `money` in `apps/shared/catalogue.json` has a new description in this kit. The id (`money`), name (`Money View OS`), icon (`wallet`), app folder (`apps/money/`) and repository (`money-view-os`) are unchanged.

**21 October 2026 (this change):** the tool now shows money month by month with a 12 week forecast, lets the owner raise invoices into their accounts software as drafts, and works out a tax pot for the owner to fill themselves, so the description changed:

- `description`: "Your money month by month: what's invoiced, paid and due, and a forecast of the next 12 weeks. Raise invoices into your accounts app, and see what to put aside for tax. It never moves money."

**The previous text** (from the shared catalogue, written before the tool was specified): "Cash today and the next 12 weeks, with what's owed to you. It reads your accounts so you can see a tight week coming and chase the right invoices in time."

Task List OS, Pipeline OS and every other tool's own copy of `apps/shared/catalogue.json` still carry the previous text. The change is a shared-file change: it must be made in Task List OS first, then copied to every tool, the same as any other change to `catalogue.json`. Until then, this kit's copy differs from the others in this one entry only, and nothing else in the file has been touched. File Finder OS is still listed in every `main`; its removal arrives by pull request later.

`ATTACHING.md`'s toolkit table has the old row for this tool. Suggested wording for its "What it does" cell: "Your money month by month: what's invoiced, paid and due, and a forecast of the next 12 weeks. Raise invoices into your accounts app, and see what to put aside for tax. It never moves money." Make the change in Task List OS first, then copy it to every tool, per the shared-file rule.
