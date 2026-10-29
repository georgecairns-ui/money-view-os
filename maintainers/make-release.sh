#!/bin/bash
#
# MAKE RELEASE
# ------------
# Builds dist/money-view-os.zip: a clean copy of the kit for customers to download.
#
# Run it from the money-view-os folder with:   bash maintainers/make-release.sh
#
# What it does:
#   1. Checks the files that ship are still blank templates, so nobody's real invoices, bank lines,
#      business notes or setup progress can go out by mistake. Stops if not.
#   2. Copies the kit into a temporary folder called "Money View OS", leaving out this
#      maintainers folder, git history, old builds, backups and computer clutter.
#   3. Checks the copy is complete and every data and settings file is valid, and syntax-checks the app's scripts.
#   4. Zips it as dist/money-view-os.zip, replacing any older one.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
STAGE="$(mktemp -d "${TMPDIR:-/tmp}/money-view-os-build.XXXXXX")"
trap 'rm -rf "$STAGE"' EXIT
NAME="Money View OS"
OUT="$STAGE/$NAME"

fail() { echo "RELEASE STOPPED: $1" >&2; exit 1; }

# found <grep arguments>: prints what grep finds. grep exits 0 for a match, 1 for none and 2 when it could not do
# its job (a missing file, say); only 2 stops the release, so a check that couldn't run never passes by accident.
found() {
  local out rc=0
  out=$(grep -s "$@") || rc=$?
  [ "$rc" -le 1 ] || fail "a check could not run (grep exit $rc): grep $*"
  printf '%s' "$out"
}

# ---------- 0. The model's own tests, if they're there ----------
if [ -f "$ROOT/maintainers/test-model.js" ]; then
  node "$ROOT/maintainers/test-model.js" >/dev/null || fail "node maintainers/test-model.js failed. Run it to see why"
fi

# ---------- 1. Is everything that ships still a blank template? ----------
python3 - "$ROOT" <<'PYEOF' || fail "the files above are not a blank Money View OS kit (real data, or something removed that came back). For real data, restore with: git checkout -- apps/money/data context setup/progress.md CLAUDE.md
  (and remove any zip in skills-to-upload)"
import json, os, sys, pathlib, re
root = pathlib.Path(sys.argv[1])
problems = []

# The data file must equal the empty file in maintainers/SPEC.md, exactly
EMPTY = {
    "version": 1,
    "settings": {
        "businessName": "",
        "ownerName": "",
        "currency": "GBP",
        "businessType": "",
        "yearStart": "04-06",
        "weekStarts": 1,
        "nervousBalance": 0,
        "vat": {"registered": False, "scheme": "standard", "rate": 20, "flatRate": 0, "quarterEnds": [3, 6, 9, 12], "cashAccounting": False},
        "tax": {"setAsidePercent": 0, "potAccountId": None, "note": ""},
        "invoice": {"prefix": "INV-", "nextNumber": 1, "termsDays": 30},
        "bank": {"name": "", "link": ""},
    },
    "sources": {
        "accounts": {"app": "", "mode": "none", "checkedAt": None},
        "bank": {"mode": "none", "checkedAt": None},
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
    "activity": [],
}
data = json.loads((root / "apps/money/data/money.json").read_text())
if data != EMPTY:
    for key in sorted(set(data) | set(EMPTY)):
        if data.get(key) != EMPTY.get(key):
            problems.append(f"apps/money/data/money.json: '{key}' is not the blank template")

# No demo mode and no sample data ship
for f in list((root / "apps").rglob("*.js")) + list((root / "apps").rglob("*.html")) + list((root / "apps").rglob("menu.json")):
    txt = f.read_text(errors="ignore")
    if re.search(r"makeDemoData|setDemo|isDemo|demo-data\.js|demo-mode|data-action=\"demo|data-change=\"demo|Demo mode", txt):
        problems.append(f"{f.relative_to(root)} still has demo mode in it")
if (root / "apps/money/app/demo-data.js").exists():
    problems.append("apps/money/app/demo-data.js is back: no tool ships a demo")

# Notes: every context file blank, money.md included
for f in sorted((root / "context").glob("*.md")):
    if f.name != "README.md" and "Status: not filled in yet" not in f.read_text():
        problems.append(f"{f.relative_to(root)} has been filled in")
if not (root / "context/money.md").exists():
    problems.append("context/money.md is missing")

# No zip of a person's own file
for z in sorted((root / "skills-to-upload").glob("*.zip")):
    problems.append(f"{z.relative_to(root)} is a person's own file and must not ship")

# Money View reads only through a live connection: no exports, spreadsheets or statements anywhere in files/, and the
# old statement route (the import-a-statement skill, the Starling guide) stays gone
for f in sorted((root / "files").rglob("*")):
    if f.is_file() and f.suffix.lower() in (".csv", ".pdf", ".xlsx"):
        problems.append(f"{f.relative_to(root)} is a CSV, PDF or spreadsheet and must not ship: Money View reads no exports")
for gone in (".claude/skills/import-a-statement", "setup/connections/starling.md", "files/05-finance/statements"):
    if (root / gone).exists():
        problems.append(f"{gone} is back: Money View has no statement route")

# Money View OS is its own tool (George, 21 October 2026): parts that only belong to Task List OS or the other tools
# came out of this kit and must not come back. The originals live in the other toolkit repositories.
REMOVED = [
    ".claude/skills/file-it", ".claude/skills/open-task-list",
    "context/priorities.md", "context/routines.md",
    "setup/scripts/start-task-list.sh", "setup/scripts/start-task-list.ps1",
    "files/01-admin", "files/02-clients", "files/03-sales", "files/04-marketing", "files/06-operations", "files/07-team", "files/08-projects",
] + ["setup/connections/" + n + ".md" for n in (
    "calendly", "fathom", "fireflies", "gmail-and-google-calendar", "google-drive", "granola", "hubspot", "microsoft-365",
    "notion", "otter", "pipedrive", "read-ai", "slack", "stripe", "tldv", "zoom")]
for gone in REMOVED:
    if (root / gone).exists():
        problems.append(f"{gone} is back: it belongs to another tool and was taken out of Money View OS")
# Only the 6 connection guides this tool uses, plus the README
KEEP_CONNECTIONS = {"README.md", "xero.md", "xero-drafts.md", "quickbooks.md", "freeagent.md", "sage.md", "bank-feeds.md"}
for f in sorted((root / "setup/connections").glob("*")):
    if f.name not in KEEP_CONNECTIONS:
        problems.append(f"setup/connections/{f.name} is not one of Money View's connection guides")
# Only the skills Money View uses
KEEP_SKILLS = {"update-my-money-view", "raise-an-invoice", "put-invoices-in-my-accounts", "who-owes-me-money", "whats-coming-in",
               "can-i-afford-this", "set-aside-for-tax", "sort-money-brain-dump", "open-the-app", "get-updates", "setup", "match-my-brand",
               "sort-brain-dump", "polite-chaser", "human-email", "write-like-me", "keep-context-fresh", "connect-a-tool"}
for d in sorted((root / ".claude/skills").iterdir()):
    if d.is_dir() and d.name not in KEEP_SKILLS:
        problems.append(f".claude/skills/{d.name} is not a skill Money View uses")

if "Setup status: not started" not in (root / "setup/progress.md").read_text():
    problems.append("setup/progress.md is not blank")
if re.search(r"^- \[[xX]\]", (root / "setup/progress.md").read_text(), re.M):
    problems.append("setup/progress.md has a ticked step")

# This tool has no photos or videos: no media setting in either place that tracks it, and nothing in a media folder
for f in ("apps/installed.json", "toolkit.json"):
    d = json.loads((root / f).read_text())
    for t in (d["tools"] if "tools" in d else [d]):
        if t.get("id") == "money" and "media" in t:
            problems.append(f"{f} has a media setting on the money tool: Money View OS keeps no photos or videos")
for f in sorted((root / "apps").glob("*/data/media/**/*")):
    if f.is_file() and f.name != ".gitkeep":
        problems.append(f"{f.relative_to(root)} is a person's own file and must not ship")

# The shipped permissions never include a tool that sends, pays, creates or deletes, and never name Xero
perms = json.loads((root / ".claude/settings.json").read_text()).get("permissions", {}).get("allow", [])
if any(re.search(r"send|delete|trash|post|forward|reply|publish|schedule|create|update|pay|approve|void|email|transfer|move", p, re.I) and p.startswith("mcp__") for p in perms):
    problems.append(".claude/settings.json pre-approves a tool that sends, pays, creates or deletes")
if any(re.search(r"xero", p, re.I) for p in perms):
    problems.append(".claude/settings.json pre-approves a Xero tool: the drafts tools must always ask")
if any(re.search(r"\b(curl|wget|ssh|scp|rm|sendmail)\b", p) for p in perms):
    problems.append(".claude/settings.json pre-approves a command that sends or deletes")
if "Setup: not done yet" not in (root / "CLAUDE.md").read_text():
    problems.append("CLAUDE.md says setup is done")

# A customer's saved downloads never ship: setup/as-installed/ holds only its README
for f in sorted((root / "setup/as-installed").rglob("*")):
    if f.is_file() and f.name not in ("README.md", ".DS_Store"):
        problems.append(f"{f.relative_to(root)} is a customer's saved download and must not ship")

# The shared version in toolkit.json must be the one in apps/shared/VERSION
shared_version = (root / "apps/shared/VERSION").read_text().split()[0]
if str(json.loads((root / "toolkit.json").read_text()).get("sharedVersion")) != shared_version:
    problems.append(f"toolkit.json sharedVersion is {json.loads((root / 'toolkit.json').read_text()).get('sharedVersion')!r} but apps/shared/VERSION says {shared_version}: change them together")

# Shared parts are identical in every tool, so they must not name this one, and no file may use the old
# start-up names (they are now open-the-app / start-app, the same in every tool)
for f in sorted(root.rglob("*")):
    if not f.is_file() or {".git", "dist", "maintainers", "node_modules"} & set(f.relative_to(root).parts) or f.suffix in (".png", ".jpg", ".woff2", ".zip", ".gz", ".ico"):
        continue
    txt = f.read_text(errors="ignore")
    rel = str(f.relative_to(root))
    if "raw.githubusercontent.com" in txt:
        problems.append(f"{rel} uses raw.githubusercontent.com: read files from the downloaded copy instead")
    # Shared version 13: setup never gives up on a connection, never asks what's on screen, and never uses keys or GitHub sign-in
    v13_scope = rel == "START-HERE.md" or rel == "README.md" or rel.startswith("setup/") or rel.startswith(".claude/skills/connect-a-tool/") or rel.startswith(".claude/skills/get-updates/")
    # The give-up checks apply only to the files that connect apps (elsewhere "move on" or "skip it" is harmless)
    connect_scope = (re.fullmatch(r"setup/0[2-4][^/]*\.md", rel) or re.fullmatch(r"setup/[^/]*(connect|check-ins|make-it-automatic)[^/]*\.md", rel)
                     or re.fullmatch(r"setup/connections/[^/]+\.md", rel) or rel.startswith(".claude/skills/connect-a-tool/")
                     # Money View OS connects its accounts app and bank feed in its own steps, and offers the regular refresh in step 6
                     or rel in ("setup/money-01-your-accounts.md", "setup/money-02-your-bank.md", "setup/09-check-and-hand-over.md"))
    if v13_scope and f.suffix == ".md" and rel != "setup/connections/xero-drafts.md":
        give_up = (
            (r"and (move|carry) on\b(?! (from|setting up))", "lets Claude give up on a step"),
            (r"\bthen move on\b", "lets Claude give up on a step"),
            (r"\bskip it\b", "lets Claude give up on a step"),
            (r"try once more", "lets Claude give up on a connection"),
            (r"ask (the person |them )?what they (actually |can )?see", "asks the person what's on screen: Claude checks the connection status itself"),
        ) if connect_scope else ()
        for pattern, why in give_up + (
            (r"Route 2: API key", "offers an API key route"),
            (r"claude mcp add", "adds a server outside Claude's Connectors screen"),
            (r"save-key", "asks for a key"),
            (r"\bgh (auth|api|repo)\b", "needs a GitHub sign-in while the tools are public"),
        ):
            if re.search(pattern, txt, re.I):
                problems.append(f"{rel} {why} (shared version 13): matched {pattern!r}")
    for old in ("open-task-list", "start-task-list"):
        if old in txt:
            problems.append(f"{rel} uses the old name {old} (it is now open-the-app / start-app, the same in every tool)")
    if re.match(r"setup/scripts/|apps/server/|apps/shared/js/", rel) and re.search(r"Money View OS", txt):
        problems.append(f"{rel} names this tool (Money View OS): shared parts read the name from toolkit.json")
for p in problems:
    print("  - " + p, file=sys.stderr)
sys.exit(1 if problems else 0)
PYEOF

# ---------- 2. Copy, leaving out what customers don't need ----------
mkdir -p "$OUT" "$DIST"
rsync -a \
  --include 'setup/as-installed/README.md' --exclude 'setup/as-installed/*' \
  --exclude '.git' --exclude '.gitignore' --exclude 'dist' --exclude 'maintainers' \
  --exclude '.claude/launch.json' --exclude '.claude/settings.local.json' --exclude '.claude/.cc-writes' \
  --exclude '*.backup.json' --exclude '*.tmp-*' --exclude 'apps/home/data' --exclude '.DS_Store' --exclude '._*' --exclude 'Thumbs.db' --exclude 'desktop.ini' \
  --exclude '__pycache__' --exclude '*.pyc' \
  "$ROOT/" "$OUT/"
# Claude Code can leave empty .claude folders around the kit while it works; only the top one ships
find "$OUT" -mindepth 2 -type d -name .claude -empty -prune -exec rm -rf {} +

# ---------- 3. Checks ----------
for f in "START-HERE.md" "CLAUDE.md" "LICENSE" "README.md" "Open Money View.html" "apps/money/index.html" "apps/money/data/money.json" "apps/money/menu.json" "apps/money/home-boxes.js" "apps/money/claude-jobs.json" "apps/money/CLAUDE.md" "apps/money/ATTACH-CLAUDE.md" "apps/money/app/app.js" "apps/money/app/app.css" "apps/money/app/model.js" "apps/money/app/components.js" "apps/money/app/chart.js" "apps/money/app/drawer.js" "apps/money/app/settings.js" "apps/money/app/view-overview.js" "apps/money/app/view-months.js" "apps/money/app/view-invoices.js" "apps/money/app/view-inout.js" "apps/money/app/view-whatif.js"  "context/money.md" "setup/progress.md" "setup/05-get-to-know-the-business.md" "setup/money-01-your-accounts.md" "setup/money-02-your-bank.md" "setup/money-03-money-out.md" "setup/money-04-first-view.md" "setup/09-check-and-hand-over.md" "setup/connections/README.md" "setup/connections/xero.md" "setup/connections/xero-drafts.md" "setup/connections/quickbooks.md" "setup/connections/freeagent.md" "setup/connections/sage.md" "setup/connections/bank-feeds.md" "skills-to-upload/README.md" ".claude/skills/README.md" ".claude/settings.json" "setup/scripts/save-key.sh" "setup/scripts/save-key.ps1" "setup/scripts/start-app.sh" "setup/scripts/start-app.ps1" "setup/scripts/autostart-mac.sh" "setup/scripts/autostart-windows.ps1" ".claude/skills/open-the-app/SKILL.md" ".claude/skills/get-updates/SKILL.md" "setup/as-installed/README.md" "context/business.md" "context/people.md" "context/voice.md" "context/tools.md" "context/README.md" "files/README.md" "files/05-finance/README.md" "files/99-archive/README.md" "apps/server/server.js" "apps/server/server.py" "toolkit.json" "ATTACHING.md" "apps/installed.json" "apps/shared/catalogue.json" "apps/shared/VERSION" "apps/shared/sidebar.css" "apps/shared/js/sidebar.js" "apps/shared/js/theme.js" "apps/shared/js/braindump.js" "apps/shared/js/connections.js" "apps/shared/js/connections-box.js" ".claude/skills/sort-brain-dump/SKILL.md" "apps/shared/images/claude-icon.png" "apps/home/index.html" "apps/home/home.js" "apps/home/home.css" "apps/shared/fonts/Figtree-Variable.woff2" "docs/PRIVACY-AND-SAFETY.md"; do
  [ -e "$OUT/$f" ] || fail "missing $f"
done
for f in apps/money/data/money.json apps/money/menu.json apps/money/claude-jobs.json toolkit.json apps/installed.json apps/shared/catalogue.json .claude/settings.json; do
  python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$OUT/$f" || fail "$f is not valid"
done
# A fresh download lists only Money View OS, and no test tool ever ships
python3 -c 'import json,sys; t=json.load(open(sys.argv[1]))["tools"]; sys.exit(0 if [x["id"] for x in t]==["money"] else 1)' "$OUT/apps/installed.json" || fail "apps/installed.json must list only Money View OS"
python3 -c 'import json,sys; t=json.load(open(sys.argv[1])); sys.exit(0 if t.get("id")=="money" else 1)' "$OUT/toolkit.json" || fail "toolkit.json must have id money"
[ ! -e "$OUT/apps/test-tool" ] || fail "the test tool is in the release"
# The data file must be listed, in both places that track it
for f in apps/installed.json toolkit.json; do
  python3 -c '
import json, sys
d = json.load(open(sys.argv[1]))
entries = d["tools"] if "tools" in d else [d]
for t in entries:
    if t.get("id") == "money":
        sys.exit(0 if "apps/money/data/money.json" in (t.get("dataFiles") or []) else 1)
sys.exit(1)
' "$OUT/$f" || fail "$f must list apps/money/data/money.json"
done
# Every skill toolkit.json lists exists, with a name that matches its folder and a description
python3 - "$OUT" <<'PYEOF' || fail "a skill listed in toolkit.json is missing or has a bad header"
import json, sys, pathlib, re
out = pathlib.Path(sys.argv[1])
bad = []
for s in json.load(open(out / "toolkit.json"))["skills"]:
    f = out / ".claude/skills" / s / "SKILL.md"
    if not f.exists():
        bad.append(f"{s}: no SKILL.md"); continue
    head = f.read_text().split("---")[1] if f.read_text().startswith("---") else ""
    if not re.search(r"^name: " + re.escape(s) + r"$", head, re.M):
        bad.append(f"{s}: name in the header doesn't match the folder")
    if not re.search(r"^description: .{20,}", head, re.M):
        bad.append(f"{s}: no description")
for s in json.load(open(out / "toolkit.json"))["setupSteps"] + json.load(open(out / "toolkit.json"))["contextFiles"]:
    if not (out / s).exists():
        bad.append(f"{s}: listed in toolkit.json but missing")
for b in bad:
    print("  - " + b, file=sys.stderr)
sys.exit(1 if bad else 0)
PYEOF
# The 4 jobs the app can ask for must each point at a skill that exists, and end with the 3 sentences
python3 - "$OUT" <<'PYEOF' || fail "apps/money/claude-jobs.json must have exactly refresh-money, put-invoices-in-accounts, chase-invoices and can-i-afford-this, each with its skill and ending Move no money. Send nothing. Change nothing else."
import json, sys, pathlib
out = pathlib.Path(sys.argv[1])
jobs = json.load(open(out / "apps/money/claude-jobs.json"))["jobs"]
SKILL = {"refresh-money": "update-my-money-view", "put-invoices-in-accounts": "put-invoices-in-my-accounts", "chase-invoices": "who-owes-me-money", "can-i-afford-this": "can-i-afford-this"}
ok = sorted(jobs) == sorted(SKILL)
for name, j in jobs.items():
    skill = SKILL.get(name, "")
    ok = ok and (out / ".claude/skills" / skill / "SKILL.md").exists() and (".claude/skills/" + skill) in j["prompt"] and j["prompt"].rstrip().endswith("Move no money. Send nothing. Change nothing else.") and bool(j.get("label"))
sys.exit(0 if ok else 1)
PYEOF

# Syntax-check the app's scripts
for f in "$OUT"/apps/money/app/*.js "$OUT/apps/money/home-boxes.js"; do
  node --check "$f" || fail "$f has a syntax error"
done
# The old statement route must not be in the copy either, and nothing in files/ may be a CSV, PDF or spreadsheet
[ ! -e "$OUT/.claude/skills/import-a-statement" ] || fail "the import-a-statement skill is in the release: Money View has no statement route"
for gone in .claude/skills/file-it .claude/skills/open-task-list context/priorities.md context/routines.md setup/scripts/start-task-list.sh setup/scripts/start-task-list.ps1 setup/connections/gmail-and-google-calendar.md setup/connections/slack.md setup/connections/zoom.md files/01-admin files/08-projects; do
  [ ! -e "$OUT/$gone" ] || fail "$gone is in the release: it belongs to another tool and was taken out of Money View OS"
done
[ ! -e "$OUT/setup/connections/starling.md" ] || fail "setup/connections/starling.md is in the release: Money View has no direct bank route"
HITS=$(find "$OUT/files" -type f \( -iname '*.csv' -o -iname '*.pdf' -o -iname '*.xlsx' \))
[ -z "$HITS" ] || fail "a CSV, PDF or spreadsheet is in files/: $(printf '%s\n' "$HITS" | head -3)"
# No stray backup or in-progress save files
if find "$OUT" -name '*.backup.json' -o -name '*.tmp-*' -o -name '__pycache__' | grep -q .; then
  fail "a backup, in-progress save file or __pycache__ was left in the kit: $(find "$OUT" -name '*.backup.json' -o -name '*.tmp-*' -o -name '__pycache__' | head -3)"
fi

# No em dash and no en dash anywhere shipped, except the vendored shared fonts licence
HITS=$(found -rIl $'\xe2\x80\x94' "$OUT" --exclude='OFL.txt')
[ -z "$HITS" ] || fail "an em dash slipped in: $(printf '%s\n' "$HITS" | head -3)"
HITS=$(found -rIl $'\xe2\x80\x93' "$OUT" --exclude='OFL.txt')
[ -z "$HITS" ] || fail "an en dash slipped in: $(printf '%s\n' "$HITS" | head -3)"
# No customer-banned words in README.md and START-HERE.md
BANNED='leverage|synergy|game-changer|seamless|cutting-edge|streamline|empower|unlock|robust|holistic|transformative|AI-powered|going forward|touch base|circle back|to be fair|at the end of the day|GAIP'
# The full list, over everything that ships and is this tool's own: the page, the app's scripts and styles, menu.json,
# claude-jobs.json (its labels and prompts), the skills this tool owns, the setup steps, the guides, the notes and every top-level
# document. (apps/shared, apps/home, apps/server and the shared connection guides are copied from the other tools.)
BANNED_PATHS=("$OUT/README.md" "$OUT/START-HERE.md" "$OUT/CLAUDE.md" "$OUT/toolkit.json" "$OUT/docs" "$OUT/context" "$OUT"/setup/*.md "$OUT/setup/connections/xero.md" "$OUT/setup/connections/xero-drafts.md" "$OUT/setup/connections/quickbooks.md" "$OUT/setup/connections/freeagent.md" "$OUT/setup/connections/sage.md" "$OUT/setup/connections/bank-feeds.md" "$OUT/apps/money" "$OUT/.claude/skills/README.md" "$OUT/skills-to-upload" "$OUT/files")
# The skills this tool owns. (The shared skills, such as human-email and open-the-app, list banned words on purpose, as examples to avoid.)
for skill in update-my-money-view raise-an-invoice put-invoices-in-my-accounts who-owes-me-money whats-coming-in can-i-afford-this set-aside-for-tax sort-money-brain-dump; do
  BANNED_PATHS+=("$OUT/.claude/skills/$skill")
done
for path in "${BANNED_PATHS[@]}"; do
  [ -e "$path" ] || fail "the banned-word check expects $path and it isn't there"
done
HITS=$(found -rEiIn "\b($BANNED)\b" "${BANNED_PATHS[@]}")
[ -z "$HITS" ] || fail "a banned word is in something that ships: $(printf '%s\n' "$HITS" | head -3)"
# Nothing shipped may look like a sort code (12-34-56) or a card number: this kit never holds bank details
HITS=$(found -rIEn '\b[0-9]{2}-[0-9]{2}-[0-9]{2}\b|\b[0-9]{4} ?[0-9]{4} ?[0-9]{4} ?[0-9]{4}\b' "$OUT" --exclude='OFL.txt' --exclude='*.woff2')
[ -z "$HITS" ] || fail "something that looks like a sort code or a card number is in the kit: $(printf '%s\n' "$HITS" | head -3)"
# The old tool's name must not linger in anything this tool owns. (ATTACHING.md and apps/shared,
# apps/home and apps/server are shared and may name other tools.) Every path is checked to exist first.
OLD='content machine|content-machine|content os|megaphone|what-works|apps/content|research-my-market|skill-map|skill map|skillmap|skill and folder map|skill-and-folder|Pipeline OS Licence'
OLD_PATHS=("$OUT/README.md" "$OUT/START-HERE.md" "$OUT/CLAUDE.md" "$OUT/LICENSE" "$OUT/toolkit.json" "$OUT/Open Money View.html" "$OUT/docs" "$OUT"/setup/*.md "$OUT/setup/connections/sage.md" "$OUT/setup/connections/freeagent.md" "$OUT/setup/connections/xero.md" "$OUT/setup/connections/quickbooks.md" "$OUT/setup/connections/xero-drafts.md" "$OUT/setup/connections/bank-feeds.md" "$OUT/skills-to-upload" "$OUT/context" "$OUT/apps/money" "$OUT/apps/installed.json" "$OUT/.claude/settings.json" "$OUT/.claude/skills/README.md")
for skill in setup update-my-money-view raise-an-invoice put-invoices-in-my-accounts who-owes-me-money whats-coming-in can-i-afford-this set-aside-for-tax sort-money-brain-dump; do
  OLD_PATHS+=("$OUT/.claude/skills/$skill")
done
for path in "${OLD_PATHS[@]}"; do
  [ -e "$path" ] || fail "the old-name check expects $path and it isn't there"
done
HITS=$(found -rEiIl "$OLD" "${OLD_PATHS[@]}")
[ -z "$HITS" ] || fail "an old tool name is still in a file this tool owns: $(printf '%s\n' "$HITS" | head -3)"
# Task List OS's own start script, skill and helper names must not linger in what this tool owns either. (The attach rules
# in apps/money/CLAUDE.md, ATTACH-CLAUDE.md and the skills that hand work to Task List OS may name "Task List OS" itself, so
# only its script, skill and helper names are checked here. The shared helper's TLOS_ settings stay, as they are shared.
# setup/scripts/ is shared version 11's own, and save-key.sh keeps the Mac Keychain service and the Linux config folder
# named task-list-os on purpose in every tool, so a key saved before the rename is still found: left out of this check.)
TASK_OLD='start-task-list|open-task-list|task list helper|file-it|your task list'
TASK_PATHS=("$OUT/README.md" "$OUT/START-HERE.md" "$OUT/CLAUDE.md" "$OUT/toolkit.json" "$OUT/Open Money View.html" "$OUT/docs" "$OUT"/setup/*.md "$OUT/setup/connections" "$OUT/setup/as-installed" "$OUT/context" "$OUT/files" "$OUT/skills-to-upload" "$OUT/apps/money" "$OUT/.claude")
for path in "${TASK_PATHS[@]}"; do
  [ -e "$path" ] || fail "the task-list-name check expects $path and it isn't there"
done
HITS=$(found -rEiIl "$TASK_OLD" "${TASK_PATHS[@]}")
[ -z "$HITS" ] || fail "a Task List OS script, skill or helper name is still in a file this tool owns: $(printf '%s\n' "$HITS" | head -3)"
# Customer-facing words: the README, START-HERE, docs and setup steps never say these
HITS=$(found -rEinH "\b(delve|game-changer|elevate)\b" "$OUT/README.md" "$OUT/START-HERE.md" "$OUT/docs" "$OUT"/setup/*.md)
[ -z "$HITS" ] || fail "a banned word is in the README, START-HERE, docs or setup steps: $(printf '%s\n' "$HITS" | head -3)"
# Words that belong to builders, not customers, in what the app shows on screen: the text in the page and
# every quoted piece of text with a space in it (a quoted name with no space is code, not wording)
python3 - "$OUT" <<'SCREENEOF' || fail "a word customers shouldn't see is in what the app shows (listed above)"
import pathlib, re, sys
out = pathlib.Path(sys.argv[1])
WORDS = re.compile(r"\b(agent|repo|repository|artifact|JSON|schema|API|MCP)\b", re.I)
STRING = re.compile(r'"(?:[^"\\\n]|\\.)*"|\'(?:[^\'\\\n]|\\.)*\'')
problems = []

def strip_comments(text):
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return re.sub(r"(^|\s)//[^\n]*", r"\1", text)

for f in sorted((out / "apps/money/app").glob("*.js")) + [out / "apps/money/home-boxes.js"]:
    for lit in STRING.findall(strip_comments(f.read_text())):
        m = WORDS.search(lit)
        if " " in lit and m:
            problems.append(f"{f.relative_to(out)}: '{m.group(0)}' in {lit[:70]}")

for name in ("index.html",):
    page = (out / "apps/money" / name).read_text()
    page = re.sub(r"<!--.*?-->|<script.*?</script>|<style.*?</style>", "", page, flags=re.S)
    shown = re.findall(r">([^<>]+)<", page) + re.findall(r'(?:title|aria-label|placeholder|alt|content)="([^"]*)"', page)
    for text in shown:
        m = WORDS.search(text)
        if m:
            problems.append(f"apps/money/{name}: '{m.group(0)}' in {text.strip()[:70]}")

# The labels the app shows for its jobs, and the words in the menu file (names and descriptions)
import json
for name, job in json.load(open(out / "apps/money/claude-jobs.json"))["jobs"].items():
    m = WORDS.search(job.get("label", ""))
    if m:
        problems.append(f"apps/money/claude-jobs.json: '{m.group(0)}' in the label of {name}")
def strings(node):
    if isinstance(node, str):
        yield node
    elif isinstance(node, dict):
        for v in node.values():
            yield from strings(v)
    elif isinstance(node, list):
        for v in node:
            yield from strings(v)
for text in strings(json.load(open(out / "apps/money/menu.json"))):
    m = WORDS.search(text) if " " in text else None
    if m:
        problems.append(f"apps/money/menu.json: '{m.group(0)}' in {text[:70]}")

for line in problems:
    print("  - " + line, file=sys.stderr)
sys.exit(1 if problems else 0)
SCREENEOF

SKILLS=$(find "$OUT/.claude/skills" -name SKILL.md | wc -l | tr -d ' ')

# ---------- 4. Zip (COPYFILE_DISABLE stops macOS adding hidden ._ files) ----------
rm -f "$DIST/money-view-os.zip"
(cd "$STAGE" && COPYFILE_DISABLE=1 zip -rqX "$DIST/money-view-os.zip" "$NAME")
echo "Built dist/money-view-os.zip ($(du -h "$DIST/money-view-os.zip" | cut -f1 | tr -d ' '), $SKILLS skills)"
