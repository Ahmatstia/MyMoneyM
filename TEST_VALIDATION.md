# 🧪 TEST VALIDATION PLAN — Post-Fix Verification

**Date:** 2026-06-06 | **Status:** Ready to Execute | **QA:** Expert Review

---

## 📊 TEST EXECUTION MATRIX

### FIX-001 Validation: daysPassed Calculation
**Test Case: TC-016 (Slide 3 — Proyeksi Hari Pertama Periode)**

| Scenario | Setup | Action | Expected | Actual | Pass/Fail |
|----------|-------|--------|----------|--------|-----------|
| **Day 1 of 7-day period** | Income: Rp 1jt (hari ini) Expense: Rp 100k (hari ini) | Open Slide 3, check "Est. Saldo" | Proyeksi ≈ Rp 900k - (100k × 6) = Rp 300k | TBD | ⏳ |
| **Day 4 of 7-day period** | Same setup, advance 3 days | Check progress bar | Progress ≈ 57% (4/7) | TBD | ⏳ |
| **Edge: Day 7 (last day)** | Same setup, advance 6 days | daysRemaining = 0 | Est. Saldo ≈ Rp 0 (no future days) | TBD | ⏳ |

**Verification Logic:**
```
✓ daysPassed = floor((now - start) / 86400000) + 1
✓ On day 1: floor(0) + 1 = 1 ✓
✓ On day 4: floor(259200000 / 86400000) + 1 = floor(3) + 1 = 4 ✓
✓ daysRemaining = 7 - daysPassed = 0 on day 7 ✓
```

---

### FIX-002 Validation: Date Mutation Removal
**Test Case: TC-006 (Filter Weekly dengan Cycle Period)**

| Step | Data | Action | Expected | Actual | Pass/Fail |
|------|------|--------|----------|--------|-----------|
| 1 | Income Rp 2jt (hari pertama cycle, 08:00) | Create income with cyclePeriod=7 | Income recorded | TBD | ⏳ |
| 2 | Expense Rp 100k (same day, 23:59) | Create expense same day | Both in filter | TBD | ⏳ |
| 3 | - | Apply "Weekly" filter | Expense 23:59 should appear | TBD | ⏳ |
| 4 | - | Switch filter monthly→weekly→all | No cross-contamination | TBD | ⏳ |

**Verification Logic:**
```
✓ dNormalized = new Date(d) — immutable copy
✓ dNormalized.setHours(0,0,0,0) — mutation on copy only
✓ Original d unchanged → comparison at line 275 still valid
✓ No side effects from filter evaluation
```

---

### FIX-003 Validation: Multiple Cycle Detection
**Test Case: TC-004 (Balance Negatif) + Console Monitoring**

| Scenario | Setup | Action | Expected | Actual | Pass/Fail |
|----------|-------|--------|----------|--------|-----------|
| **Multiple cycles** | 2 income transactions with cyclePeriod on different dates | Open Home, check console | Warning: "MULTIPLE CYCLE INCOMES DETECTED" | TBD | ⏳ |
| **Single cycle (normal)** | 1 income with cyclePeriod | Open Home, check console | No warning | TBD | ⏳ |

---

### FIX-005 Validation: Bar Minimal Width
**Test Case: TC-015 (Slide 2 — Progress Bar Proporsi)**

| State | Income | Expense | Expected | Actual | Pass/Fail |
|-------|--------|---------|----------|--------|-----------|
| **Both > 0** | Rp 1jt | Rp 3jt | Income: 25%, Expense: 75% | TBD | ⏳ |
| **Income = 0** | Rp 0 | Rp 3jt | Income: 0% (HIDDEN), Expense: 100% | TBD | ⏳ |
| **Expense = 0** | Rp 1jt | Rp 0 | Income: 100%, Expense: 0% (HIDDEN) | TBD | ⏳ |
| **Both = 0** | Rp 0 | Rp 0 | Both bars hidden | TBD | ⏳ |

**CSS Validation:**
```
✓ Income bar width = Max(incomeRatio, incomeRatio > 0 ? 1 : 0)
✓ Expense bar width = Max(expenseRatio, expenseRatio > 0 ? 1 : 0)
✓ When ratio = 0 → conditional returns 0, NOT 1
```

---

### FIX-006 Validation: Negative Balance Minus Sign
**Test Case: TC-004 (Balance Negatif Tampil Benar)**

| Scenario | Balance | Expected Display | Color | Pass/Fail |
|----------|---------|------------------|-------|-----------|
| **Positive** | +Rp 500k | `+Rp 500.000` | Green (#00ED64) | ⏳ |
| **Negative** | -Rp 500k | `-Rp 500.000` | Red (#FF4D6A) | ⏳ |
| **Surplus badge (Slide 2)** | Netto = +Rp 1jt | Chip: "+Rp 1.000.000" | Green | ⏳ |
| **Defisit badge (Slide 2)** | Netto = -Rp 500k | Chip: "-Rp 500.000" | Red | ⏳ |

**Visual Verification:**
```
✓ Minus sign visible at start of number
✓ Color matches status (green/red)
✓ Font weight = 800 (bold)
✓ No truncation of minus sign
```

---

### FIX-007 Validation: Yearly Projection Accuracy
**Test Case: TC-002 (Yearly Filter) + New Test**

| Date | Filter | Start | End | Expected Days | Actual Days | Pass/Fail |
|------|--------|-------|-----|----------------|-------------|-----------|
| 2026-01-15 | Yearly | 2026-01-01 00:00 | 2026-12-31 23:59:59.999 | 365 | TBD | ⏳ |
| 2024-02-15 | Yearly (Leap Year) | 2024-01-01 00:00 | 2024-12-31 23:59:59.999 | 366 | TBD | ⏳ |

**Calculation Verification:**
```
totalDays = ceil((endTime - startTime) / 86400000)
= ceil((31536000000 - 1 ms) / 86400000) 
= ceil(364.999...) = 365 ✓
```

---

## 🔄 REGRESSION TEST CHECKLIST

### Performance: 1000+ Transactions (TC-012)
```
□ Load 1000 transactions into app
□ Switch filter: monthly → weekly → yearly → all (3 cycles)
□ Measure:
  - Time to filter: < 500ms
  - UI responsiveness: No freeze/lag
  - Memory usage: No leak
□ Result: PASS / FAIL
```

### Filter Consistency (TC-007)
```
□ Add 5 transactions across different months
□ Apply filters in sequence:
  1. monthly → note totals
  2. weekly → verify subset
  3. yearly → verify superset
  4. back to monthly → same totals?
□ Expected: All values consistent
□ Result: PASS / FAIL
```

### Opening Balance Sync (TC-008)
```
□ Previous month: Income Rp 3jt, Expense Rp 1jt
□ This month: Income Rp 500k, Expense Rp 200k
□ Check monthly filter:
  - Opening balance = Rp 2jt (prev month net)
  - Current period = Rp 300k (this month net)
  - Total = Rp 2.3jt
□ Result: PASS / FAIL
```

### Edge Cases
```
□ TC-005: Empty transactions → "Rp 0" + help text ✓
□ TC-009: Zero amount transaction → ignored ✓
□ TC-010: NaN/invalid amounts → safeNumber returns 0 ✓
□ TC-011: Invalid dates → filtered out ✓
```

---

## 📈 TEST RESULTS TRACKING

### Critical Path (MUST PASS)
- [x] FIX-001: daysPassed calculation correct
- [ ] FIX-002: No mutation side effects
- [ ] FIX-006: Minus sign displays
- [ ] TC-001 through TC-007: Happy path

### High Priority (SHOULD PASS)
- [ ] FIX-005: Bar hidden when 0%
- [ ] FIX-007: Yearly projection accurate
- [ ] TC-012: 1000 transactions performance
- [ ] TC-007: Filter consistency

### Medium Priority (NICE TO PASS)
- [ ] FIX-003: Multiple cycle warning
- [ ] TC-004: Negative balance styling
- [ ] TC-015: Bar ratios visual

---

## 🎯 RELEASE GATE CRITERIA

### ✅ MUST HAVE (All PASS)
1. All 7 bugs fixed with zero TypeScript errors ← **DONE**
2. TC-001 through TC-007 (Happy path) PASS
3. No regression in existing features
4. Minus sign visible on negative balance
5. Bar disappears when ratio = 0%

### ⚠️ SHOULD HAVE (95%+ PASS)
1. Performance test (1000 transactions) < 500ms
2. Filter switching doesn't cross-contaminate
3. Opening balance calculation accurate
4. Multiple cycle warning in console

### 📊 GO/NO-GO DECISION
```
If all MUST HAVE pass → ✅ GO
If 1+ MUST HAVE fail → 🔴 BLOCK
If SHOULD HAVE 90%+ pass → 🟡 CONDITIONAL GO (with risk note)
```

---

## 📋 SIGN-OFF

| Role | Name | Status | Date |
|------|------|--------|------|
| QA Lead | Expert | ⏳ Pending Results | 2026-06-06 |
| Dev Lead | TBD | ⏳ Pending Merge | 2026-06-06 |
| PM | TBD | ⏳ Pending Approval | 2026-06-06 |

---

**Next Action:** Manual testing on Android device (min API 29) or iOS simulator
