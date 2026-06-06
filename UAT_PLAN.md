# 📋 USER ACCEPTANCE TESTING (UAT) PLAN

**Date:** 2026-06-06 | **Phase:** UAT & Sign-off | **Duration:** 2-3 hours

---

## 🎯 UAT OBJECTIVE

Validate all 7 bug fixes with **2 real pilot users** to ensure:
1. ✅ Fixes work as intended in real scenarios
2. ✅ No unexpected side effects on actual data
3. ✅ User experience improved (minus sign, bar visibility, etc.)
4. ✅ Ready for full production release

---

## 👥 PILOT USER PROFILE

### User 1: "Active Spender"
- **Persona:** Frequent transaction maker (10+ daily)
- **Focus:** Daily/monthly filter usage, balance accuracy
- **Key Test:** Filter switching reliability, opening balance sync

### User 2: "Budget Planner"
- **Persona:** Period-based planner (weekly cycle income)
- **Focus:** Cycle period features, projections, weekly filter
- **Key Test:** Cycle accuracy, projection day-1, period end label

---

## 📝 UAT SCENARIOS

### SCENARIO 1: Fresh Start (Setup Data)

**Duration:** 15 minutes

**Steps:**
```
1. Clear app data (fresh install simulation)
2. Create opening balance: Rp 5.000.000
3. Add 5 transactions (income + expense mixed)
4. Set 1 income with cyclePeriod=7 days (today)
5. Verify all data loaded correctly
```

**Validation Points:**
```
□ Opening balance displays correctly
□ All 5 transactions visible
□ Balance calculation accurate
□ No crashes or errors
```

**Expected Result:** ✅ Ready for testing

---

### SCENARIO 2: Daily Filter Testing (TC-001, TC-003)

**Duration:** 10 minutes

**Steps:**
```
1. Apply "Daily" filter (today)
2. Check: Total Income, Total Expense, Net Kas
3. Verify "Masuk" and "Keluar" cards on Slide 1
4. Check Net Kas display on Slide 2 (footer)
5. Swipe to Slide 3 → Check "Arus Kas" (same net)
```

**Validation Points:**
```
□ Income total: Correct
□ Expense total: Correct
□ Net Kas: Income - Expense (accurate)
□ Color: Green (surplus) or Red (defisit)
□ "Periode berakhir dalam X hari" text appears ✓
□ No calculation errors
```

**Critical Check:** 
- If any expense < 0 or NaN → should be 0
- Negative balance should show `-Rp X` with red color (TC-004) ✓

---

### SCENARIO 3: Weekly Cycle Filter (TC-006, TC-016)

**Duration:** 15 minutes

**Steps:**
```
1. Apply "Weekly" filter
2. Check filtered transactions (only 7-day cycle range)
3. Look at Slide 1 "Periode 7 Hari"
4. Check Slide 2 income/expense breakdown
5. Review Slide 3:
   - "Periode berjalan" progress bar
   - "Tersisa X hari" pill
   - "Est. Saldo" projection
6. Check footer: "Periode berakhir dalam X hari" ✓
```

**Validation Points:**
```
□ Only transactions within 7-day window shown
□ Progress bar shows correct % (e.g., day 2 = 28%)
□ Days remaining accurate
□ Projection not too aggressive (FIX-001) ✓
□ Minus sign on negative balance (FIX-006) ✓
□ Income bar hidden if 0% (FIX-005) ✓
□ No data loss from filter (FIX-002) ✓
```

**Critical Bug Validation:**
- **FIX-001:** Projection on day 1 should be reasonable
- **FIX-002:** All transactions from same day included
- **FIX-006:** If negative, minus sign visible
- **FIX-005:** If no income, bar hidden (not forced 1%)

---

### SCENARIO 4: Monthly Filter (TC-002, TC-008)

**Duration:** 15 minutes

**Steps:**
```
1. Add transactions from previous months
2. Apply "Monthly" filter (this month)
3. Check:
   - Opening balance includes previous month surplus
   - Current month transactions filtered
   - Total = Opening + Current month net
4. Verify Slide 1 text:
   - "Termasuk saldo awal Rp X.XXX.000" ✓
5. Switch to previous month → verify opening balance changes
```

**Validation Points:**
```
□ Opening balance calculated (FIX-003) ✓
□ Shows "Termasuk saldo awal Rp X" text
□ Opening balance value accurate
□ Current month filtered correctly
□ Total balance = Opening + Current month
□ Switching months updates opening balance
```

**Edge Case:** Empty month should show 0 + opening balance clearly

---

### SCENARIO 5: Negative Balance Clarity (TC-004, TC-006)

**Duration:** 10 minutes

**Steps:**
```
1. Create expense > income
2. Balance becomes negative (e.g., -Rp 500.000)
3. Check Slide 1 display
4. Check Slide 2 "Defisit" badge
5. Check Slide 3 status color (should be red "Waspada")
```

**Validation Points:**
```
□ Slide 1: Shows "-Rp 500.000" (minus sign visible) ✓
□ Color: Red (#FF4D6A) ✓
□ Slide 2: Badge shows "Defisit" (red) ✓
□ Slide 3: Status "Waspada" (red) ✓
□ All indicators align (FIX-006) ✓
```

**Critical Check:** MINUS SIGN MUST BE VISIBLE (FIX-006)

---

### SCENARIO 6: Filter Switching (TC-007)

**Duration:** 10 minutes

**Steps:**
```
1. Start with Monthly filter → Record total balance
2. Switch to Weekly → Note subset
3. Switch to Yearly → Note superset
4. Switch back to Monthly → Record balance again
5. Compare: Same as initial? ✓
6. Repeat switch sequence 3 times
```

**Validation Points:**
```
□ Monthly total same after switching back
□ No data accumulation (no cross-contamination)
□ Filter switches smoothly (no lag)
□ Calculations consistent
□ Hierarchy correct: Yearly ≥ Monthly ≥ Weekly
```

---

### SCENARIO 7: Bar Ratio Visibility (TC-015)

**Duration:** 5 minutes

**Steps:**
```
1. Create: Income=0, Expense=Rp 1.000.000
2. Go to Slide 2
3. Check progress bars:
   - Income bar should be INVISIBLE (0%)
   - Expense bar should show 100%
```

**Before FIX-005:** Income bar shows 1% (misleading!)
**After FIX-005:** Income bar hidden (correct!) ✓

**Validation Points:**
```
□ Income bar: HIDDEN (not visible)
□ Expense bar: 100% (full width)
□ No forced 1% minimum (FIX-005) ✓
```

---

### SCENARIO 8: Empty State (TC-005)

**Duration:** 5 minutes

**Steps:**
```
1. Create new app profile (if possible)
2. Or: Delete all transactions
3. Check all slides
```

**Validation Points:**
```
□ Slide 1: Shows "Rp 0" + help text
□ Slide 2: Shows 0 bars
□ Slide 3: No projection data
□ All 3 slides show placeholders
□ No crashes
```

---

### SCENARIO 9: "Periode Berakhir" Label (New Feature) ✅

**Duration:** 5 minutes

**Steps:**
```
1. Check bottom of each slide
2. Look for small text: "Periode berakhir dalam X hari"
3. For each filter:
   - Weekly: "Periode berakhir dalam X hari"
   - Monthly: "Bulan berakhir dalam X hari"
   - Yearly: "Tahun berakhir dalam X hari"
   - All: Should NOT show
4. On last day: "Periode berakhir hari ini"
5. On second-to-last: "Periode berakhir besok"
```

**Validation Points:**
```
□ Label appears on Slide 1 footer
□ Label appears on Slide 2 footer
□ Label appears on Slide 3 footer
□ Text matches filter type
□ Days count accurate
□ Color changes if urgent (≤3 days)
□ Hidden on "all" filter
```

---

## 📊 UAT SIGN-OFF FORM

### User 1 Feedback (Active Spender)
```
Date Tested: ___________
Pilot User Name: ___________
Time: ___________

OVERALL EXPERIENCE
□ Excellent  □ Good  □ Fair  □ Poor

SPECIFIC FINDINGS:

1. Balance Calculation:
   □ Accurate  □ Has Issues  □ Notes: _____________

2. Filter Switching:
   □ Smooth  □ Lag  □ Notes: _____________

3. Negative Balance Display (Minus Sign):
   □ Clear  □ Confusing  □ Notes: _____________

4. Bar Visibility (Income/Expense):
   □ Correct  □ Wrong  □ Notes: _____________

5. Period Label ("Periode berakhir dalam..."):
   □ Helpful  □ Not useful  □ Notes: _____________

ISSUES ENCOUNTERED:
□ None
□ Minor (aesthetic): _____________
□ Major (functional): _____________

READINESS FOR PRODUCTION:
□ YES - Go ahead
□ NO - Hold for fixes
□ CONDITIONAL - Minor issues acceptable

Sign-off: ________________  Date: __________
```

### User 2 Feedback (Budget Planner)
```
[Same form as User 1]

ADDITIONAL FOCUS:

6. Cycle Period Accuracy:
   □ Correct  □ Wrong  □ Notes: _____________

7. Weekly Filter Reliability:
   □ All data included  □ Data missing  □ Notes: _____________

8. Projection Day 1 (Not Too Aggressive):
   □ Reasonable  □ Too extreme  □ Notes: _____________

9. Opening Balance Sync:
   □ Accurate  □ Wrong  □ Notes: _____________

Sign-off: ________________  Date: __________
```

---

## 📈 UAT ACCEPTANCE CRITERIA

### ✅ MUST PASS (All)
- [ ] All 7 bugs fixed and working
- [ ] No new bugs introduced
- [ ] Minus sign displays on negative balance (FIX-006)
- [ ] Income bar hidden when 0% (FIX-005)
- [ ] Filter switching no data loss (FIX-002)
- [ ] Day 1 projection reasonable (FIX-001)
- [ ] Both users approve: GO

### ⚠️ SHOULD PASS (95%+)
- [ ] "Periode berakhir" label correct
- [ ] Opening balance syncs properly
- [ ] Cycle period accuracy
- [ ] Performance acceptable

### 🟡 NICE TO HAVE
- [ ] UI/UX improvements noticed
- [ ] User confident with new features
- [ ] No support tickets expected

---

## 🎯 UAT TIMELINE

| Time | Activity | Duration | Owner |
|------|----------|----------|-------|
| 10:00 | Setup test data | 15 min | QA |
| 10:15 | User 1 - Daily filter | 10 min | User 1 |
| 10:25 | User 1 - Weekly cycle | 15 min | User 1 |
| 10:40 | User 1 - Negative balance | 10 min | User 1 |
| 10:50 | User 2 - Monthly filter | 15 min | User 2 |
| 11:05 | User 2 - Cycle accuracy | 10 min | User 2 |
| 11:15 | Both - Filter switching | 10 min | Both |
| 11:25 | Debrief & sign-off | 10 min | All |
| **11:35** | **UAT Complete** | | |

**Total Time:** ~1.5 hours per user × 2 = **3 hours total**

---

## 📋 SIGN-OFF REQUIREMENT

**UAT Pass Criteria:**
```
✅ User 1 Sign-off: GO
✅ User 2 Sign-off: GO
✅ No Critical Issues
✅ All 7 Fixes Verified
```

**Result:** **APPROVED FOR PRODUCTION** 🚀

---

## 🚀 IF ISSUES FOUND

### Minor Issues (Cosmetic)
- Document in KNOWN_ISSUES.md
- Proceed with release
- Schedule fix for next sprint

### Major Issues (Functional)
- Roll back to previous version
- Fix in development
- Restart UAT
- Do not release

---

**UAT Coordinator:** QA Expert
**Status:** Ready to Execute
**Next:** Proceed to Phase 5 (Production Release)
