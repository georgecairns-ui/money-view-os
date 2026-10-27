/*
  Checks the rules in apps/money/app/model.js with plain Node assertions.
  Run: node maintainers/test-model.js   (prints how many checks passed, exits 1 if any failed)

  Every expected figure below was worked out by hand, and the working is in the comment above the check.
  "Today" in the sample is Wednesday 21 October 2026, so the first forecast week starts on Monday 19 October.
*/
"use strict";

process.env.TZ = "Europe/London";

const assert = require("assert");
const path = require("path");
const M = require(path.join(__dirname, "..", "apps", "money", "app", "model.js"));

let passed = 0;
function check(name, fn) {
  try { fn(); passed += 1; } catch (e) { console.error("FAILED: " + name + "\n  " + e.message); process.exit(1); }
}

const TODAY = "2026-10-21";
const line = function (text, qty, price, vatRate) { return { id: "l-" + text, text: text, qty: qty, price: price, vatRate: vatRate }; };

// The sample business: 3 accounts, 4 invoices, rent on the 31st, software with VAT in it, 2 expected items
function sample(extra) {
  const d = {
    settings: {
      businessName: "Fern & Finch", ownerName: "Sam", businessType: "sole-trader", yearStart: "04-06", weekStarts: 1, nervousBalance: 5000,
      vat: { registered: true, scheme: "standard", rate: 20, flatRate: 0, quarterEnds: [3, 6, 9, 12], cashAccounting: false },
      tax: { setAsidePercent: 20, potAccountId: "a-pot" }
    },
    accounts: [
      { id: "a-cur", name: "Current", kind: "current", balance: 5000, asAt: "2026-10-20", source: "xero" },
      { id: "a-pot", name: "Tax pot", kind: "pot", balance: 1000, asAt: "2026-10-21", source: "xero", isTaxPot: true },
      { id: "a-card", name: "Card", kind: "card", balance: 200, asAt: "2026-10-19", source: "xero" }
    ],
    invoices: [
      // 850 + 170 VAT = 1,020, due 10 Oct: 11 days overdue, nothing paid
      { id: "i-1", number: "INV-0001", customer: "Greenway Café", issueDate: "2026-09-20", dueDate: "2026-10-10", status: "sent", lines: [line("Menu", 1, 850, 20)], payments: [] },
      // 2 x 300 at 20% + 100 at 0% = 700 net, 120 VAT, 820 gross; 320 paid on 15 Oct, so 500 still owed, due 5 Nov
      { id: "i-2", number: "INV-0002", customer: "Marlow Dental", issueDate: "2026-10-01", dueDate: "2026-11-05", status: "in-accounts", lines: [line("Logo", 2, 300, 20), line("Fonts", 1, 100, 0)], payments: [{ id: "y-1", date: "2026-10-15", amount: 320, source: "xero" }] },
      // A draft: counts for nothing until it is sent
      { id: "i-3", number: "INV-0003", customer: "Hollins", issueDate: "2026-10-20", dueDate: "2026-11-19", status: "draft", lines: [line("Brochure", 1, 400, 20)], payments: [] },
      // 1,000 + 200 VAT, paid in full on 10 June
      { id: "i-0", number: "INV-0000", customer: "Old Client", issueDate: "2026-05-20", dueDate: "2026-06-19", status: "sent", lines: [line("Website", 1, 1000, 20)], payments: [{ id: "y-0", date: "2026-06-10", amount: 1200, source: "you" }] }
    ],
    outgoings: [
      { id: "o-rent", name: "Rent", amount: 1200, category: "rent", repeat: "monthly", date: "2026-01-31", vatIncluded: false, status: "confirmed" },
      { id: "o-soft", name: "Software", amount: 120, category: "software", repeat: "monthly", date: "2026-07-15", vatIncluded: true, status: "confirmed" },
      { id: "o-skip", name: "Maybe a van", amount: 9999, category: "other", repeat: "monthly", date: "2026-11-01", vatIncluded: true, status: "suggested" }
    ],
    expected: [
      { id: "e-1", who: "Fern & Finch", what: "New client", amount: 1000, date: "2026-11-12", chance: "likely", status: "confirmed" },
      { id: "e-2", who: "Maybe Ltd", what: "Big job", amount: 2000, date: "2026-12-01", chance: "maybe", status: "confirmed" },
      { id: "e-3", who: "Nobody", what: "Waiting for a click", amount: 777, date: "2026-11-02", chance: "likely", status: "suggested" }
    ],
    transactions: [], potMoves: [], scenarios: [], flags: []
  };
  return M.normalise(Object.assign(d, extra || {}));
}
function weekOf(weeks, iso) { return weeks.filter(function (w) { return w.weekStart === iso; })[0]; }

// ---------- Pence and money ----------
check("money: pounds, commas, minus before the pound sign, round", function () {
  assert.strictEqual(M.money(1234.56), "£1,234.56");
  assert.strictEqual(M.money(850), "£850.00");
  assert.strictEqual(M.money(-1234.5), "-£1,234.50");
  assert.strictEqual(M.money(1234.56, { round: true }), "£1,235");
  assert.strictEqual(M.money(-0.001), "£0.00");
  assert.strictEqual(M.money(1234567.8), "£1,234,567.80");
});

// ---------- invoiceTotals ----------
check("invoiceTotals: mixed VAT rates", function () {
  const t = M.invoiceTotals(sample().invoices[1]);
  assert.deepStrictEqual(t, { net: 700, vat: 120, gross: 820 });
});
check("invoiceTotals: rounds half up to the penny at each line", function () {
  // 3 x 1.115 = 3.345 net -> 335p (half up); VAT 5% of 335p = 16.75p -> 17p; second line the same again
  const inv = { lines: [line("a", 3, 1.115, 5), line("b", 3, 1.115, 5)] };
  assert.deepStrictEqual(M.invoiceTotals(inv), { net: 6.7, vat: 0.34, gross: 7.04 });
  // 0.1 + 0.2 style sums do not drift
  assert.strictEqual(M.invoiceTotals({ lines: [line("a", 1, 0.1, 0), line("b", 1, 0.2, 0)] }).gross, 0.3);
  assert.deepStrictEqual(M.invoiceTotals({ lines: [] }), { net: 0, vat: 0, gross: 0 });
});
check("invoicePaid adds payments", function () {
  assert.strictEqual(M.invoicePaid({ payments: [{ amount: 100.1 }, { amount: 0.2 }] }), 100.3);
});

// ---------- invoiceState, daysOverdue ----------
check("invoiceState: every state", function () {
  const d = sample(), s = function (i) { return M.invoiceState(i, TODAY); };
  assert.strictEqual(s(d.invoices[0]), "overdue");
  assert.strictEqual(s(d.invoices[1]), "part-paid");
  assert.strictEqual(s(d.invoices[2]), "draft");
  assert.strictEqual(s(d.invoices[3]), "paid");
  assert.strictEqual(s({ status: "waiting", lines: [] }), "waiting");
  assert.strictEqual(s({ status: "void", dueDate: "2020-01-01", lines: [line("a", 1, 5, 0)] }), "void");
  const clean = { status: "in-accounts", dueDate: "2026-11-30", lines: [line("a", 1, 100, 0)], payments: [] };
  assert.strictEqual(s(clean), "in-accounts");
  assert.strictEqual(s(Object.assign({}, clean, { status: "sent" })), "sent");
  assert.strictEqual(s(Object.assign({}, clean, { dueDate: "2026-10-21" })), "in-accounts");   // due today is not late
  assert.strictEqual(s(Object.assign({}, clean, { dueDate: "2026-10-20" })), "overdue");        // due yesterday is
  const partLate = Object.assign({}, clean, { dueDate: "2026-10-01", payments: [{ amount: 40 }] });
  assert.strictEqual(s(partLate), "overdue");                                                    // part paid and late is still overdue
  assert.strictEqual(s(Object.assign({}, partLate, { payments: [{ amount: 100 }] })), "paid");
  assert.strictEqual(s(Object.assign({}, partLate, { payments: [{ amount: 150 }] })), "paid");   // overpaid
});
check("daysOverdue: whole days, 0 when not overdue", function () {
  const d = sample();
  assert.strictEqual(M.daysOverdue(d.invoices[0], TODAY), 11);   // 10 Oct to 21 Oct
  assert.strictEqual(M.daysOverdue(d.invoices[1], TODAY), 0);
  assert.strictEqual(M.daysOverdue(d.invoices[3], TODAY), 0);
});

// ---------- nextInvoiceNumber, newInvoice ----------
check("nextInvoiceNumber: prefix, padded to 4, never reuses", function () {
  const s = function (n) { return { invoice: { prefix: "INV-", nextNumber: n } }; };
  assert.strictEqual(M.nextInvoiceNumber(s(1), []), "INV-0001");
  assert.strictEqual(M.nextInvoiceNumber(s(5), [{ number: "INV-0005" }]), "INV-0006");
  assert.strictEqual(M.nextInvoiceNumber(s(5), [{ number: "INV-0005" }, { number: "INV-0006" }, { number: "INV-0008" }]), "INV-0007");
  assert.strictEqual(M.nextInvoiceNumber(s(12345), []), "INV-12345");
  assert.strictEqual(M.nextInvoiceNumber({ invoice: { prefix: "FF/", nextNumber: 42 } }, []), "FF/0042");
  assert.strictEqual(M.numberOf("INV-0042"), 42);
});
check("newInvoice: a blank draft, issued today, due after the terms", function () {
  const settings = sample().settings;
  settings.invoice.termsDays = 14;
  const inv = M.newInvoice(settings, "2026-10-21", sample().invoices);
  assert.strictEqual(inv.status, "draft");
  assert.strictEqual(inv.number, "INV-0004");        // 0001 to 0003 are taken, the settings say next is 1
  assert.strictEqual(inv.issueDate, "2026-10-21");
  assert.strictEqual(inv.dueDate, "2026-11-04");
  assert.strictEqual(inv.lines.length, 1);
  assert.strictEqual(inv.lines[0].vatRate, 20);      // registered: the usual rate is ready
  assert.deepStrictEqual(inv.payments, []);
  settings.vat.registered = false;
  assert.strictEqual(M.newInvoice(settings, "2026-10-21").lines[0].vatRate, 0);
  // 31 Dec + 30 days crosses the year
  assert.strictEqual(M.newInvoice({ invoice: { termsDays: 30 } }, "2026-12-31").dueDate, "2027-01-30");
});

check("newInvoiceFor: the number is suggested only when Claude can put drafts in the accounts app", function () {
  const d = sample();
  d.sources.accounts.mode = "drafts";
  assert.strictEqual(M.newInvoiceFor(d, TODAY).number, "INV-0004");
  d.sources.accounts.mode = "read";
  assert.strictEqual(M.newInvoiceFor(d, TODAY).number, "");
  d.sources.accounts.mode = "none";
  assert.strictEqual(M.newInvoiceFor(d, TODAY).number, "");
});
check("output VAT counts only invoices that are in the accounts app", function () {
  // The sample's current quarter has INV-0002 (in-accounts, 120 VAT) and a draft (INV-0003, 80 VAT)
  const d = sample();
  assert.strictEqual(M.vatQuarter(d, TODAY).outputVat, 120);
  const add = function (status, where) { d.invoices.push({ id: "i-" + status + where, number: "X", customer: "X", issueDate: "2026-10-10", dueDate: "2026-11-10", status: status, where: where, lines: [line("a", 1, 100, 20)], payments: [] }); };
  add("waiting", "here");                 // asked Claude, not in the accounts app yet: nothing
  assert.strictEqual(M.vatQuarter(d, TODAY).outputVat, 120);
  add("sent", "here");                    // +20
  add("in-accounts", "here");             // +20
  add("draft", "accounts");               // read from the accounts app: +20
  add("void", "accounts"); add("linked", "here");   // closed: nothing
  assert.strictEqual(M.vatQuarter(d, TODAY).outputVat, 180);
});
check("linked: a draft note closed by an arriving invoice is hidden from every count", function () {
  const d = sample();
  const before = { owed: M.owed(d, TODAY).total, months: JSON.stringify(M.months(d, TODAY, 3, 6)), vat: M.vatQuarter(d, TODAY).outputVat };
  d.invoices.push({ id: "i-l", number: "", customer: "Hollins", issueDate: "2026-10-01", dueDate: "2026-10-05", status: "linked", lines: [line("a", 1, 100, 20)], payments: [{ id: "y-l", date: "2026-10-03", amount: 120 }] });
  assert.strictEqual(M.invoiceState(d.invoices[d.invoices.length - 1], TODAY), "linked");
  assert.strictEqual(M.normalise(JSON.parse(JSON.stringify(d))).invoices.pop().status, "linked");
  assert.strictEqual(M.owed(d, TODAY).total, before.owed);
  assert.strictEqual(JSON.stringify(M.months(d, TODAY, 3, 6)), before.months);
  assert.strictEqual(M.vatQuarter(d, TODAY).outputVat, before.vat);
  assert.deepStrictEqual(M.taxPot(d, TODAY), M.taxPot(sample(), TODAY));
  assert.ok(!M.derivedFlags(d, TODAY).some(function (f) { return f.invoiceId === "i-l"; }));
});
check("derivedFlags: Chase only for a sent invoice, an unsent one in the accounts app says send it", function () {
  const d = sample();
  const f = M.derivedFlags(d, TODAY).filter(function (x) { return x.kind === "overdue"; });
  assert.deepStrictEqual(f.map(function (x) { return x.action; }), ["chase"]);   // INV-0001, sent, 11 days late
  d.invoices[1].dueDate = "2026-10-20"; d.invoices[1].payments = [];            // INV-0002 is still a draft in the accounts app
  const g = M.derivedFlags(d, TODAY).filter(function (x) { return x.kind === "overdue" && x.invoiceId === "i-2"; })[0];
  assert.strictEqual(g.action, "open"); assert.ok(/waiting for you to send it/.test(g.text));
  assert.ok(/1 day ago/.test(g.text));
});
check("normalise: older source words become accounts", function () {
  const d = M.normalise({
    accounts: [{ id: "a1", source: "xero" }, { id: "a2", source: "Statement" }, { id: "a3", source: "bank" }, { id: "a4", source: "you" }, { id: "a5" }],
    invoices: [{ id: "i1", source: "xero", payments: [{ id: "y1", source: "bank" }, { id: "y2", source: "statement" }] }],
    transactions: [{ id: "t1", source: "statement" }, { id: "t2" }],
    outgoings: [{ id: "o1", source: "statement" }, { id: "o2", source: "ads" }],
    expected: [{ id: "e1", source: "pipeline" }]
  });
  assert.deepStrictEqual(d.accounts.map(function (a) { return a.source; }), ["accounts", "accounts", "accounts", "you", "you"]);
  assert.strictEqual(d.invoices[0].source, "accounts");
  assert.deepStrictEqual(d.invoices[0].payments.map(function (p) { return p.source; }), ["accounts", "accounts"]);
  assert.deepStrictEqual(d.transactions.map(function (t) { return t.source; }), ["accounts", "you"]);
  assert.deepStrictEqual(d.outgoings.map(function (o) { return o.source; }), ["accounts", "ads"]);
  assert.strictEqual(d.expected[0].source, "pipeline");
  assert.strictEqual(M.sourceLabel("accounts", { sources: { accounts: { app: "Xero" } } }, "2026-10-21"), "From Xero, 21 Oct");
});

// ---------- cashToday, owed ----------
check("cashToday: pots included, cards subtracted, oldest as-at", function () {
  const c = M.cashToday(sample());
  assert.strictEqual(c.total, 5800);          // 5000 + 1000 - 200
  assert.strictEqual(c.asAt, "2026-10-19");
  assert.strictEqual(c.accounts.length, 3);
  assert.strictEqual(M.cashToday({ accounts: [] }).asAt, null);
});
check("owed: unpaid invoices only, overdue first", function () {
  const o = M.owed(sample(), TODAY);
  assert.strictEqual(o.total, 1520);          // 1,020 + 500; the draft and the paid one are out
  assert.strictEqual(o.overdue, 1020);
  assert.strictEqual(o.count, 2);
  assert.strictEqual(o.overdueCount, 1);
  assert.deepStrictEqual(o.list.map(function (r) { return r.invoice.id; }), ["i-1", "i-2"]);
});

// ---------- occurrences ----------
check("occurrences: monthly from the 31st keeps the day, clamped to month end", function () {
  assert.deepStrictEqual(M.occurrences({ repeat: "monthly", date: "2026-01-31" }, "2026-01-01", "2026-06-30"),
    ["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30", "2026-05-31", "2026-06-30"]);
});
check("occurrences: February in a leap year, and yearly from 29 February", function () {
  assert.deepStrictEqual(M.occurrences({ repeat: "monthly", date: "2028-01-31" }, "2028-02-01", "2028-03-31"), ["2028-02-29", "2028-03-31"]);
  assert.deepStrictEqual(M.occurrences({ repeat: "yearly", date: "2028-02-29" }, "2028-01-01", "2032-12-31"),
    ["2028-02-29", "2029-02-28", "2030-02-28", "2031-02-28", "2032-02-29"]);
});
check("occurrences: weekly, quarterly, once, endDate, range edges and late ranges", function () {
  assert.deepStrictEqual(M.occurrences({ repeat: "weekly", date: "2026-10-05" }, "2026-10-19", "2026-11-02"), ["2026-10-19", "2026-10-26", "2026-11-02"]);
  assert.deepStrictEqual(M.occurrences({ repeat: "quarterly", date: "2026-01-15" }, "2026-01-01", "2026-12-31"), ["2026-01-15", "2026-04-15", "2026-07-15", "2026-10-15"]);
  assert.deepStrictEqual(M.occurrences({ repeat: "none", date: "2026-11-05" }, "2026-11-05", "2026-11-05"), ["2026-11-05"]);
  assert.deepStrictEqual(M.occurrences({ repeat: "none", date: "2026-11-05" }, "2026-11-06", "2026-12-31"), []);
  assert.deepStrictEqual(M.occurrences({ repeat: "monthly", date: "2026-01-10", endDate: "2026-03-10" }, "2026-01-01", "2026-12-31"), ["2026-01-10", "2026-02-10", "2026-03-10"]);
  assert.deepStrictEqual(M.occurrences({ repeat: "monthly", from: "2026-12-01", to: "2027-02-15" }, "2026-12-01", "2027-12-31"), ["2026-12-01", "2027-01-01", "2027-02-01"]);   // a what-if change uses from and to
  assert.deepStrictEqual(M.occurrences({ repeat: "monthly", date: "2020-01-31" }, "2026-02-01", "2026-03-31"), ["2026-02-28", "2026-03-31"]);   // started years ago
});

// ---------- forecast, lowPoint ----------
// Start 5,800. Week by week (Monday starts):
//  19 Oct  +1,020 overdue invoice counts today                       = 6,820
//  26 Oct  -1,200 rent on 31 Oct                                     = 5,620
//   2 Nov  +500 INV-0002 on 5 Nov, -110 VAT return on 7 Nov          = 6,010
//   9 Nov  +1,000 expected 12 Nov, -120 software 15 Nov (a Sunday)   = 6,890
//  16, 23 Nov nothing                                                = 6,890
//  30 Nov  -1,200 rent on 30 Nov                                     = 5,690
//   7 Dec  nothing                                                   = 5,690
//  14 Dec  -120 software 15 Dec                                      = 5,570
//  21 Dec  nothing                                                   = 5,570
//  28 Dec  -1,200 rent on 31 Dec                                     = 4,370
//   4 Jan  nothing                                                   = 4,370
// The VAT return is 170 output (INV-0001 issued 20 Sep) less 60 input (3 x software at 1/6 of 120).
check("forecast: 12 weeks from the Monday of this week", function () {
  const f = M.forecast(sample(), TODAY, 12);
  assert.strictEqual(f.length, 12);
  assert.strictEqual(f[0].weekStart, "2026-10-19");
  assert.strictEqual(f[11].weekStart, "2027-01-04");
  assert.deepStrictEqual(f.map(function (w) { return w.balance; }), [6820, 5620, 6010, 6890, 6890, 6890, 5690, 5690, 5570, 5570, 4370, 4370]);
  assert.strictEqual(weekOf(f, "2026-11-02").in, 500);
  assert.strictEqual(weekOf(f, "2026-11-02").out, 110);
  assert.strictEqual(weekOf(f, "2026-11-09").items.length, 2);
  assert.strictEqual(weekOf(f, "2026-10-19").items[0].kind, "invoice");
});
check("forecast: drafts, suggested items, maybes and dropped bills stay out", function () {
  const f = M.forecast(sample(), TODAY, 12);
  assert.ok(!f.some(function (w) { return w.items.some(function (i) { return /Hollins|van|Waiting for a click|Big job/.test(i.name); }); }));
});
check("forecast: the maybes switch counts a maybe in the week of 30 Nov", function () {
  const f = M.forecast(sample(), TODAY, 12, { maybes: true });
  assert.strictEqual(weekOf(f, "2026-11-30").balance, 7690);   // 5,690 + 2,000
  assert.strictEqual(f[11].balance, 6370);
});
check("lowPoint: lowest week, earliest on a tie", function () {
  assert.deepStrictEqual(M.lowPoint(M.forecast(sample(), TODAY, 12)), { balance: 4370, weekStart: "2026-12-28" });
  assert.deepStrictEqual(M.lowPoint([{ balance: 5, weekStart: "a" }, { balance: 5, weekStart: "b" }]), { balance: 5, weekStart: "a" });
  assert.strictEqual(M.lowPoint([]), null);
});
check("forecast: weeks can start on Sunday", function () {
  const d = sample(); d.settings.weekStarts = 0;
  assert.strictEqual(M.forecast(d, TODAY, 2)[0].weekStart, "2026-10-18");
});
check("forecast: an expected item whose date has passed counts today", function () {
  const d = sample(); d.expected[0].date = "2026-10-01";
  const f = M.forecast(d, TODAY, 12);
  assert.strictEqual(weekOf(f, "2026-10-19").in, 2020);   // 1,020 + 1,000
});
check("tightestLine: says the week, the balance and what came before", function () {
  const d = sample(), f = M.forecast(d, TODAY, 12);
  assert.strictEqual(M.tightestLine(d, f), "Your tightest week is w/c 28 Dec at £4,370.00, after paying Rent.");
  assert.strictEqual(M.tightestLine({ accounts: [], invoices: [] }, M.forecast({ settings: {}, accounts: [] }, TODAY, 12)), M.NO_DATA_LINE);
});

// ---------- vatQuarter ----------
check("vatQuarter: standard, the current quarter", function () {
  // 1 Oct to 31 Dec 2026, return due 7 Feb 2027. Output: INV-0002 VAT 120 (INV-0003 is a draft). Input: software on
  // 15 Oct, 15 Nov, 15 Dec at 20 each = 60. Owed 60.
  const q = M.vatQuarter(sample(), TODAY);
  assert.deepStrictEqual(q, { start: "2026-10-01", end: "2026-12-31", dueDate: "2027-02-07", registered: true, scheme: "standard", estimate: true, outputVat: 120, inputVat: 60, owed: 60 });
});
check("vatQuarter: due date is the end + 1 month + 7 days", function () {
  const at = function (iso) { return M.vatQuarter(sample(), iso).dueDate; };
  assert.strictEqual(at("2026-08-15"), "2026-11-07");   // quarter to 30 Sep
  assert.strictEqual(at("2026-02-10"), "2026-05-07");   // quarter to 31 Mar
  assert.strictEqual(at("2026-05-10"), "2026-08-07");   // quarter to 30 Jun
  assert.strictEqual(at("2026-12-31"), "2027-02-07");   // the last day of a quarter is still in it
  assert.strictEqual(M.vatQuarter(sample(), "2027-01-01").start, "2027-01-01");
  const d = sample(); d.settings.vat.quarterEnds = [2, 5, 8, 11];
  const q = M.vatQuarter(d, TODAY);
  assert.strictEqual(q.start, "2026-09-01"); assert.strictEqual(q.end, "2026-11-30"); assert.strictEqual(q.dueDate, "2027-01-07");
});
check("vatQuarter: cash accounting counts VAT when paid", function () {
  // 320 paid on 15 Oct of an 820 invoice with 120 VAT: 320 x 120 / 820 = 46.83 (46.829 rounded)
  const d = sample(); d.settings.vat.cashAccounting = true;
  const q = M.vatQuarter(d, TODAY);
  assert.strictEqual(q.outputVat, 46.83);
  assert.strictEqual(q.owed, -13.17);   // 46.83 less 60 input: a refund this far
});
check("vatQuarter: flat rate is a percent of gross received", function () {
  const d = sample(); d.settings.vat.scheme = "flat"; d.settings.vat.flatRate = 10;
  const q = M.vatQuarter(d, TODAY);   // 320 received x 10% = 32, no input VAT
  assert.strictEqual(q.outputVat, 32); assert.strictEqual(q.inputVat, 0); assert.strictEqual(q.owed, 32);
});
check("vatQuarter: not registered means nothing owed", function () {
  const d = sample(); d.settings.vat.registered = false;
  const q = M.vatQuarter(d, TODAY);
  assert.strictEqual(q.owed, 0); assert.strictEqual(q.registered, false);
});

// ---------- taxDates ----------
check("taxDates: VAT return, sole trader dates, corporation tax", function () {
  const d = sample();
  const vat = M.taxDates(d, TODAY, 12);
  assert.deepStrictEqual(vat.map(function (t) { return t.date + " " + t.name + " " + t.amount; }), ["2026-11-07 VAT return 110"]);   // 170 - 60
  const long = M.taxDates(d, TODAY, 16);   // runs to 8 Feb 2027
  assert.deepStrictEqual(long.map(function (t) { return t.date; }), ["2026-11-07", "2027-01-31", "2027-02-07"]);
  assert.strictEqual(long[1].amount, 0); assert.strictEqual(long[1].askAccountant, true);
  const ltd = sample(); ltd.settings.businessType = "limited"; ltd.settings.yearStart = "04-01";   // year end 31 March: due 1 Jan 2027
  assert.deepStrictEqual(M.taxDates(ltd, TODAY, 12).map(function (t) { return t.date + " " + t.name; }), ["2026-11-07 VAT return", "2027-01-01 Corporation tax"]);
  const dec = sample(); dec.settings.businessType = "limited"; dec.settings.yearStart = "01-01";   // year end 31 Dec: due 1 Oct
  assert.deepStrictEqual(M.taxDates(dec, "2026-09-20", 3).map(function (t) { return t.date; }), ["2026-10-01"]);
  const none = sample(); none.settings.vat.registered = false; none.settings.businessType = "";
  assert.deepStrictEqual(M.taxDates(none, TODAY, 16), []);
});
check("taxDates: a tax payment the owner typed replaces the estimate", function () {
  const d = sample();
  d.outgoings.push({ id: "o-sa", name: "Self assessment", amount: 2500, category: "tax", repeat: "none", date: "2027-01-29", status: "confirmed", vatIncluded: false });
  assert.deepStrictEqual(M.taxDates(d, TODAY, 16).map(function (t) { return t.date; }), ["2026-11-07", "2027-02-07"]);
  const f = M.forecast(d, TODAY, 16);
  assert.strictEqual(weekOf(f, "2027-01-25").out, 3700);   // 2,500 typed, plus the rent on Sunday 31 Jan
});

// ---------- taxPot ----------
// Money received since 6 April 2026, after VAT: INV-0000 1,200 less 200 VAT = 1,000; INV-0002 320 less
// 46.83 VAT (320 x 120 / 820) = 273.17. Together 1,273.17, and 20% of that is 254.63.
// VAT on money received: quarter to 30 Sep (return due 7 Nov, so still held) none; this quarter 46.83.
// Should have 46.83 + 254.63 = 301.46.
check("taxPot: VAT held plus the percent set aside, against the pot", function () {
  const t = M.taxPot(sample(), TODAY);
  assert.strictEqual(t.shouldHave, 301.46);
  assert.strictEqual(t.inPot, 1000);      // the pot account's balance
  assert.strictEqual(t.toMove, 0);
  assert.strictEqual(t.vatPart, 46.83); assert.strictEqual(t.incomePart, 254.63);
});
check("taxPot: without a pot account it counts the moves the owner logged", function () {
  const d = sample();
  d.settings.tax.potAccountId = null; d.accounts[1].isTaxPot = false;
  d.potMoves = [{ id: "m1", date: "2026-09-01", amount: 300 }, { id: "m2", date: "2026-10-01", amount: -100 }, { id: "m0", date: "2026-02-01", amount: 5000 }];   // the last is last tax year
  const t = M.taxPot(d, TODAY);
  assert.strictEqual(t.inPot, 200); assert.strictEqual(t.moved, 200);
  assert.strictEqual(t.toMove, 101.46);   // 301.46 - 200
});
check("taxPot: tax already paid this year comes off, VAT payments do not", function () {
  const d = sample();
  d.settings.tax.potAccountId = null; d.accounts[1].isTaxPot = false;
  d.transactions = [
    { id: "t1", date: "2026-07-31", text: "HMRC self assessment", amount: 100, dir: "out", category: "tax" },
    { id: "t2", date: "2026-08-07", text: "HMRC VAT", amount: 999, dir: "out", category: "tax" }
  ];
  const t = M.taxPot(d, TODAY);
  assert.strictEqual(t.taxPaid, 100);
  assert.strictEqual(t.shouldHave, 201.46);
  assert.strictEqual(t.toMove, 201.46);
});
// An earlier quarter whose return is not due yet stays in the pot, less the VAT already paid for it.
// The sample plus INV-0009: 1,000 + 200 VAT, paid in full (1,200) on 10 Sep, in the quarter to 30 Sep (return due 7 Nov).
// VAT held: 200 (that quarter) + 46.83 (this quarter) = 246.83.
function withEarlierQuarter(extra) {
  const d = sample(extra);
  d.invoices.push({ id: "i-9", number: "INV-0009", customer: "September Client", issueDate: "2026-08-20", dueDate: "2026-09-19", status: "sent", lines: [line("Site", 1, 1000, 20)], payments: [{ id: "y-9", date: "2026-09-10", amount: 1200, source: "accounts" }] });
  return d;
}
check("taxPot: an earlier quarter not yet due stays in, VAT already paid for it comes off", function () {
  assert.strictEqual(M.taxPot(withEarlierQuarter(), TODAY).vatPart, 246.83);
  // a VAT payment from the bank, dated after that quarter ended (30 Sep): 150 comes off
  const bank = withEarlierQuarter({ transactions: [{ id: "t1", date: "2026-10-05", text: "HMRC VAT", amount: 150, dir: "out", category: "tax" }] });
  const a = M.taxPot(bank, TODAY);
  assert.strictEqual(a.vatPart, 96.83); assert.strictEqual(a.vatPaid, 150); assert.strictEqual(a.taxPaid, 0);
  // the same payment as a confirmed outgoing
  const out = withEarlierQuarter({ outgoings: [{ id: "o-vat", name: "VAT payment", amount: 150, category: "tax", repeat: "none", date: "2026-10-05", vatIncluded: false, status: "confirmed" }] });
  assert.strictEqual(M.taxPot(out, TODAY).vatPart, 96.83);
  // more than was held never takes the quarter below nothing, and never touches this quarter's VAT
  const over = withEarlierQuarter({ transactions: [{ id: "t1", date: "2026-10-05", text: "HMRC VAT", amount: 999, dir: "out", category: "tax" }] });
  assert.strictEqual(M.taxPot(over, TODAY).vatPart, 46.83); assert.strictEqual(M.taxPot(over, TODAY).vatPaid, 200);
  // a VAT payment dated on or before the quarter end is not for it; one that does not say VAT is income tax, not VAT
  const early = withEarlierQuarter({ transactions: [
    { id: "t1", date: "2026-09-30", text: "HMRC VAT", amount: 150, dir: "out", category: "tax" },
    { id: "t2", date: "2026-10-05", text: "HMRC self assessment", amount: 100, dir: "out", category: "tax" }
  ] });
  assert.strictEqual(M.taxPot(early, TODAY).vatPart, 246.83); assert.strictEqual(M.taxPot(early, TODAY).taxPaid, 100);
  // once the return is due (7 Nov) the earlier quarter is out of the pot; only this quarter's 46.83 is left
  assert.strictEqual(M.taxPot(withEarlierQuarter(), "2026-11-08").vatPart, 46.83);
});
check("taxPot: not registered, no percent, nothing to move; flat rate; a draft payment of nothing", function () {
  const d = sample(); d.settings.vat.registered = false; d.settings.tax.setAsidePercent = 0;
  assert.strictEqual(M.taxPot(d, TODAY).shouldHave, 0);
  const f = sample(); f.settings.vat.scheme = "flat"; f.settings.vat.flatRate = 10;
  // flat: VAT part 10% of 320 = 32; received after flat VAT: 1,200 x 90% = 1,080 + 288 = 1,368 -> 20% = 273.60
  const t = M.taxPot(f, TODAY);
  assert.strictEqual(t.vatPart, 32); assert.strictEqual(t.incomePart, 273.6);
});

// ---------- months ----------
// Rows run Jul 2026 to Apr 2027 (3 back, this month, 6 ahead).
//  Sep: invoiced 1,020 (INV-0001), paid 0, due 0, out 1,320 (rent 30 Sep, software 15 Sep: no bank lines, so from the bills), net -1,320.
//  Oct: invoiced 820, paid 320, due 1,020 (the overdue one counts this month), out 1,320 (software 15 Oct, rent 31 Oct), net 20.
//  Nov: due 500, expected 1,000, out 1,430 (rent 1,200 + software 120 + VAT 110), net 70.
//  Dec: out 1,320, net -1,320; with maybes expected 2,000, net 680.
check("months: past, this month and ahead", function () {
  const m = M.months(sample(), TODAY, 3, 6);
  assert.strictEqual(m.length, 10);
  assert.strictEqual(m[0].month, "2026-07"); assert.strictEqual(m[9].month, "2027-04");
  const by = function (k) { return m.filter(function (r) { return r.month === k; })[0]; };
  const sep = by("2026-09"), oct = by("2026-10"), nov = by("2026-11"), dec = by("2026-12");
  assert.strictEqual(sep.kind, "actual"); assert.strictEqual(oct.kind, "now"); assert.strictEqual(nov.kind, "estimate");
  assert.deepStrictEqual([sep.invoiced, sep.paid, sep.due, sep.expected, sep.out, sep.net], [1020, 0, 0, 0, 1320, -1320]);
  assert.deepStrictEqual([oct.invoiced, oct.paid, oct.due, oct.expected, oct.out, oct.net], [820, 320, 1020, 0, 1320, 20]);
  assert.deepStrictEqual([nov.invoiced, nov.paid, nov.due, nov.expected, nov.out, nov.net], [0, 0, 500, 1000, 1430, 70]);
  assert.deepStrictEqual([dec.due, dec.expected, dec.out, dec.net], [0, 0, 1320, -1320]);
  assert.strictEqual(sep.outBasis, "estimate");
  const withMaybes = M.months(sample(), TODAY, 3, 6, { maybes: true });
  assert.deepStrictEqual([withMaybes[5].expected, withMaybes[5].net], [2000, 680]);
});
// A VAT return due in a month 4 to 6 ahead (past the 12 week forecast) still lands in that month's money out.
//  The Q4 return (Oct to Dec) is due 7 Feb 2027, 4 months ahead. In the sample it is 120 output VAT (INV-0002, issued
//  1 Oct) less 3 x 20 of software VAT = 60, so Feb out is rent 1,200 + software 120 + VAT 60 = 1,380, against Jan 1,320.
//  Adding INV-0004 (issued 10 Dec, 100 VAT) makes the return 220 - 60 = 160 and Feb out 1,200 + 120 + 160 = 1,480.
check("months: tax dates beyond the 12 week forecast land in their month", function () {
  const find = function (rows, k) { return rows.filter(function (r) { return r.month === k; })[0]; };
  const base = M.months(sample(), TODAY, 3, 6);
  const feb = find(base, "2027-02"), jan = find(base, "2027-01");
  assert.ok(feb.items.some(function (i) { return i.kind === "tax" && i.what === "vat" && i.date === "2027-02-07"; }));
  assert.strictEqual(feb.out, 1380); assert.strictEqual(jan.out, 1320);
  const d = sample();
  d.invoices.push({ id: "i-4", number: "INV-0004", customer: "Fernhill", issueDate: "2026-12-10", dueDate: "2027-01-09", status: "in-accounts", lines: [line("Brand", 1, 500, 20)], payments: [] });
  const rows = M.months(M.normalise(d), TODAY, 3, 6);
  const vat = find(rows, "2027-02").items.filter(function (i) { return i.what === "vat"; })[0];
  assert.strictEqual(vat.amount, 160);
  assert.strictEqual(find(rows, "2027-02").out, 1480);
  assert.strictEqual(find(rows, "2027-01").out, 1320);
  // Doing the same sum for the forecast gives the same return, so months and forecast agree
  assert.strictEqual(M.taxDates(M.normalise(d), TODAY, 16).filter(function (t) { return t.what === "vat" && t.date === "2027-02-07"; })[0].amount, 160);
});
check("months: a past month uses the bank lines when there are some", function () {
  const d = sample();
  d.transactions = [
    { id: "t1", date: "2026-09-03", text: "Rent", amount: 1200, dir: "out" },
    { id: "t2", date: "2026-09-10", text: "Move to savings", amount: 500, dir: "out", category: "transfer" },
    { id: "t3", date: "2026-09-12", text: "Mystery payment in", amount: 75, dir: "in" },
    { id: "t4", date: "2026-09-13", text: "Greenway part", amount: 300, dir: "in", invoiceId: "i-1" }
  ];
  const sep = M.months(d, TODAY, 3, 6).filter(function (r) { return r.month === "2026-09"; })[0];
  assert.strictEqual(sep.out, 1200); assert.strictEqual(sep.outBasis, "bank");
  // Money received counts only from invoice payments: an unmatched line in (a loan, a refund) and a matched one
  // (its invoice already holds the payment) add nothing on their own, and the transfer is nobody's income
  assert.strictEqual(sep.paid, 0);
  assert.strictEqual(sep.net, -1200);
});
check("income: bank lines never add income, only invoice payments do (months and taxPot)", function () {
  const base = sample();
  const withLines = sample({ transactions: [
    { id: "t1", date: "2026-09-12", text: "Loan from the bank", amount: 5000, dir: "in" },
    { id: "t2", date: "2026-10-12", text: "Refund from a supplier", amount: 800, dir: "in" },
    { id: "t3", date: "2026-10-14", text: "Marlow Dental INV-0002", amount: 320, dir: "in", invoiceId: "i-2" }
  ] });
  assert.deepStrictEqual(M.taxPot(withLines, TODAY), M.taxPot(base, TODAY));
  const paidOf = function (d) { return M.months(d, TODAY, 3, 6).map(function (r) { return r.paid; }); };
  assert.deepStrictEqual(paidOf(withLines), paidOf(base));
  // a payment on an invoice does count
  const paid = sample();
  paid.invoices[0].payments = [{ id: "y-9", date: "2026-10-20", amount: 500, source: "accounts" }];
  assert.strictEqual(M.months(paid, TODAY, 3, 6).filter(function (r) { return r.month === "2026-10"; })[0].paid, 820);   // 320 + 500
  assert.ok(M.taxPot(paid, TODAY).incomePart > M.taxPot(base, TODAY).incomePart);
});

// ---------- scenarioCompare ----------
check("scenarioCompare: as things are, a hire, a lost client", function () {
  const d = sample();
  d.scenarios = [
    // 2,400 a month from 1 Dec: 1 Dec (week of 30 Nov) and 1 Jan (week of 28 Dec) fall in the 12 weeks
    { id: "s-hire", name: "Hire", on: true, changes: [{ id: "c1", kind: "out", name: "Hire someone", amount: 2400, repeat: "monthly", from: "2026-12-01", to: null, customer: "" }] },
    // Marlow's 500 on 5 Nov goes: every week from 2 Nov is 500 lower, so the end is 3,870
    { id: "s-lose", name: "Lose Marlow", on: true, changes: [{ id: "c2", kind: "lose", name: "", amount: 0, repeat: "none", from: "2026-11-01", to: null, customer: "Marlow Dental" }] },
    // Greenway's overdue 1,020 goes (it counts today): every week 1,020 lower, so the end is 3,350
    { id: "s-lose2", name: "Lose Greenway", on: false, changes: [{ id: "c3", kind: "lose", name: "", amount: 0, repeat: "none", from: "2026-10-01", to: null, customer: "greenway café" }] }
  ];
  const r = M.scenarioCompare(d, TODAY, ["s-hire", "s-lose", "s-lose2"]);
  assert.deepStrictEqual(r.map(function (x) { return x.id; }), ["base", "s-hire", "s-lose", "s-lose2"]);
  assert.strictEqual(r[0].name, "As things are");
  assert.deepStrictEqual([r[0].lowPoint.balance, r[0].endBalance, r[0].weeks.length], [4370, 4370, 12]);
  // Hire: 5,690 - 2,400 = 3,290 (30 Nov), 3,170 (14 Dec), then 3,170 - 1,200 - 2,400 = -430 (28 Dec) and -430
  assert.deepStrictEqual([r[1].lowPoint.balance, r[1].lowPoint.weekStart, r[1].endBalance], [-430, "2026-12-28", -430]);
  assert.deepStrictEqual([r[2].lowPoint.balance, r[2].endBalance], [3870, 3870]);
  assert.deepStrictEqual([r[3].lowPoint.balance, r[3].endBalance], [3350, 3350]);
});
check("scenarioCompare: losing a client also stops what they pay by the month", function () {
  const d = sample();
  d.scenarios = [
    { id: "s-ret", name: "Retainer", on: true, changes: [{ id: "c1", kind: "in", name: "Marlow retainer", amount: 400, repeat: "monthly", from: "2026-11-01", to: null, customer: "Marlow Dental" }] },
    { id: "s-gone", name: "Gone from December", on: true, changes: [{ id: "c2", kind: "lose", name: "", amount: 0, repeat: "none", from: "2026-12-01", to: null, customer: "Marlow Dental" }] }
  ];
  // Retainer alone: 1 Nov, 1 Dec, 1 Jan = 1,200 more by the end. Both together: the retainer stops from 1 Dec, so only 1 Nov counts.
  const f = M.forecast(d, TODAY, 12, { scenarioIds: ["s-ret", "s-gone"] });
  assert.strictEqual(f[11].balance, 4770);   // 4,370 + 400
  assert.strictEqual(M.forecast(d, TODAY, 12, { scenarioIds: ["s-ret"] })[11].balance, 5570);   // 4,370 + 3 x 400
  assert.strictEqual(M.changeText(d.scenarios[0].changes[0]), "Marlow retainer at £400 a month from 1 Nov");
});

// ---------- flags, comingUp, normalise ----------
check("derivedFlags: overdue, low point, short tax pot, old numbers, suggestions", function () {
  const d = sample();
  const kinds = M.derivedFlags(d, TODAY).map(function (f) { return f.kind + ":" + (f.invoiceId || ""); });
  assert.ok(kinds.indexOf("overdue:i-1") !== -1);
  assert.ok(kinds.some(function (k) { return /^low/.test(k); }));         // 4,370 is under the 5,000 comfort level
  assert.ok(!kinds.some(function (k) { return /^tax/.test(k); }));        // 1,000 in the pot is plenty
  assert.ok(kinds.some(function (k) { return /^other/.test(k); }));       // 2 suggested items are waiting
  const stale = M.derivedFlags(sample(), "2026-11-05").filter(function (f) { return /days old/.test(f.text); });
  assert.strictEqual(stale.length, 1);                                    // oldest account is 19 Oct: 17 days
  assert.ok(/17 days old/.test(stale[0].text));
  const short = sample(); short.accounts[1].balance = 100;
  assert.ok(M.derivedFlags(short, TODAY).some(function (f) { return f.kind === "tax"; }));   // 201.46 short
});
check("flags: Claude's open flags follow, without repeating the app's own", function () {
  const d = sample();
  d.flags = [
    { id: "f1", kind: "overdue", text: "dup", status: "open", invoiceId: "i-1" },
    { id: "f2", kind: "unusual", text: "A payment you don't normally make", status: "open" },
    { id: "f3", kind: "unusual", text: "closed", status: "dismissed" }
  ];
  const all = M.flags(d, TODAY);
  assert.ok(!all.some(function (f) { return f.id === "f1" || f.id === "f3"; }));
  assert.strictEqual(all[all.length - 1].id, "f2");
});
check("comingUp: the next 14 days", function () {
  const items = M.comingUp(sample(), TODAY, 14);   // 21 Oct to 3 Nov
  assert.deepStrictEqual(items.map(function (i) { return i.date + " " + i.amount; }), ["2026-10-21 1020", "2026-10-31 1200"]);
});
check("normalise: fills settings, fixes odd values, drops records with no id, trims", function () {
  const d = M.normalise({ settings: { businessName: "X" }, invoices: [{ id: "i", status: "nonsense", issueDate: "2026-02-31", lines: "oops" }, { number: "no id" }, 7], outgoings: [{ id: "o", repeat: "sometimes", status: "huh" }], transactions: [] });
  assert.strictEqual(d.settings.invoice.prefix, "INV-");
  assert.strictEqual(d.settings.vat.rate, 20);
  assert.strictEqual(d.invoices.length, 1);
  assert.strictEqual(d.invoices[0].status, "draft"); assert.strictEqual(d.invoices[0].issueDate=== "", true);
  assert.deepStrictEqual(d.invoices[0].lines, []);
  assert.strictEqual(d.outgoings[0].repeat, "none"); assert.strictEqual(d.outgoings[0].status, "suggested");
  ["accounts", "expected", "potMoves", "scenarios", "flags", "imports", "activity"].forEach(function (k) { assert.ok(Array.isArray(d[k]), k); });
  const big = M.normalise({ transactions: Array.from({ length: 3100 }, function (_, i) { return { id: "t" + i, dir: "out", amount: 1 }; }) });
  assert.strictEqual(big.transactions.length, 3000);
});
check("validate: a list that is not a list is a plain message", function () {
  assert.throws(function () { M.validate({ invoices: {} }); }, /invoices should be a list/);
  assert.throws(function () { M.validate(null); }, /empty/);
  M.validate({});   // an empty file is fine: normalise fills it
});
check("the shipped data file is the empty file", function () {
  const shipped = JSON.parse(require("fs").readFileSync(path.join(__dirname, "..", "apps", "money", "data", "money.json"), "utf8"));
  assert.strictEqual(shipped.settings.businessName, "");
  ["accounts", "invoices", "expected", "outgoings", "transactions", "potMoves", "scenarios", "flags", "imports", "activity"].forEach(function (k) { assert.deepStrictEqual(shipped[k], [], k); });
  assert.strictEqual(M.isSetUp(M.normalise(shipped)), false);
  assert.strictEqual(M.forecast(M.normalise(shipped), TODAY, 12).length, 12);
});

// Review probes (27 Oct 2026)
// Received 5,000 at 20% = 1,000 to set aside. A 2,000 payment on account went out on 31 July, but the pot's real balance
// is 0, so the pot is 1,000 short: tax paid is not taken off again when the pot balance is known.
function probeData() {
  return M.normalise({
    settings: { vat: { registered: false }, tax: { setAsidePercent: 20, potAccountId: "a-pot" }, yearStart: "04-06" },
    accounts: [{ id: "a-pot", name: "Tax pot", balance: 0, isTaxPot: true }],
    invoices: [{ id: "i-p", number: "INV-1", customer: "Probe", issueDate: "2026-06-01", dueDate: "2026-07-01", status: "sent", lines: [line("Work", 1, 5000, 0)], payments: [{ id: "y-p", date: "2026-07-10", amount: 5000, source: "accounts" }] }],
    transactions: [{ id: "t-p", date: "2026-07-31", text: "Self assessment", amount: 2000, dir: "out", category: "tax" }]
  });
}
check("taxPot probe: a known pot balance is not reduced by tax already paid", function () {
  const t = M.taxPot(probeData(), TODAY);
  assert.strictEqual(t.shouldHave, 1000); assert.strictEqual(t.toMove, 1000); assert.strictEqual(t.taxPaid, 2000);
});
check("taxPot probe: with no pot balance the tax paid still comes off", function () {
  const d = probeData(); d.settings.tax.potAccountId = null; d.accounts[0].isTaxPot = false;
  const t = M.taxPot(d, TODAY);
  assert.strictEqual(t.shouldHave, 0); assert.strictEqual(t.toMove, 0);
});
check("vatQuarter probe: a wage marked as including VAT reclaims none; a bill still does", function () {
  const d = M.normalise({
    settings: { vat: { registered: true, scheme: "standard", rate: 20, quarterEnds: [3, 6, 9, 12] } },
    outgoings: ["staff", "loan", "tax", "bills"].map(function (c) { return { id: "o-" + c, name: c, amount: 1200, category: c, repeat: "none", date: "2026-10-25", vatIncluded: true, status: "confirmed" }; })
  });
  assert.strictEqual(M.vatQuarter(d, TODAY).inputVat, 200);   // only the bill: 1,200 x 20 / 120
});
check("vat word match probe: Private and Renovation are not VAT, HMRC VAT is", function () {
  const d = probeData(); d.settings.tax.potAccountId = null; d.accounts[0].isTaxPot = false;
  d.transactions = [{ id: "t1", date: "2026-08-01", text: "Private tuition", amount: 100, dir: "out", category: "tax" }, { id: "t2", date: "2026-08-02", text: "Renovation tax", amount: 50, dir: "out", category: "tax" }, { id: "t3", date: "2026-08-03", text: "HMRC VAT", amount: 999, dir: "out", category: "tax" }];
  assert.strictEqual(M.taxPot(d, TODAY).taxPaid, 150);
});
check("months probe: a lose-a-customer what-if removes their due invoice", function () {
  const d = M.normalise({
    accounts: [{ id: "a1", name: "Current", balance: 0 }],
    invoices: [{ id: "i-l", number: "INV-2", customer: "Marlow Dental", issueDate: "2026-10-01", dueDate: "2026-11-10", status: "sent", lines: [line("Work", 1, 500, 0)], payments: [] }],
    scenarios: [{ id: "s-l", name: "Lose Marlow", on: true, changes: [{ id: "c1", kind: "lose", amount: 0, repeat: "none", from: "2026-11-01", customer: "marlow dental" }] }]
  });
  const nov = function (o) { return M.months(d, TODAY, 0, 2, o).filter(function (r) { return r.month === "2026-11"; })[0]; };
  assert.strictEqual(nov().due, 500);
  assert.strictEqual(nov({ scenarioIds: ["s-l"] }).due, 0);
});

console.log("All " + passed + " checks passed.");
