import { Budget, Savings } from "../../types";

export const NotificationMessages = {
  // DAILY MESSAGES
  dailyMorning: (balance: number) => ({
    title: "🌅 Pagi yang produktif!",
    body: `Jangan lupa catat semua transaksi hari ini.\nSaldo saat ini: Rp ${balance.toLocaleString(
      "id-ID"
    )}`,
    data: { type: "DAILY_MORNING" },
  }),

  // BUDGET ALERTS
  budgetWarning: (budget: Budget) => {
    const percentage = Math.round((budget.spent / budget.limit) * 100);
    return {
      title: "⚠️ Budget Hampir Habis",
      body: `Budget ${
        budget.category
      } sudah ${percentage}% terpakai!\nRp ${budget.spent.toLocaleString(
        "id-ID"
      )} / Rp ${budget.limit.toLocaleString("id-ID")}`,
      data: { type: "BUDGET_WARNING", budgetId: budget.id },
    };
  },

  budgetExceeded: (budget: Budget) => ({
    title: "🚨 Budget Melebihi Limit!",
    body: `Budget ${budget.category} sudah melebihi limit!\nKelebihan: Rp ${(
      budget.spent - budget.limit
    ).toLocaleString("id-ID")}`,
    data: { type: "BUDGET_EXCEEDED", budgetId: budget.id },
  }),

  // SAVINGS PROGRESS
  savingsMilestone: (savings: Savings, milestone: number) => ({
    title: "🎉 Pencapaian Tabungan!",
    body: `Tabungan "${
      savings.name
    }" mencapai ${milestone}%!\nRp ${savings.current.toLocaleString(
      "id-ID"
    )} / Rp ${savings.target.toLocaleString("id-ID")}`,
    data: { type: "SAVINGS_MILESTONE", savingsId: savings.id },
  }),

  savingsComplete: (savings: Savings) => ({
    title: "🏆 Target Tercapai!",
    body: `Selamat! Tabungan "${
      savings.name
    }" sudah mencapai target!\nTotal: Rp ${savings.current.toLocaleString(
      "id-ID"
    )}`,
    data: { type: "SAVINGS_COMPLETE", savingsId: savings.id },
  }),

  // WEEKLY REPORTS
  weeklyReport: (income: number, expense: number, savings: number) => ({
    title: "📊 Laporan Mingguan",
    body: `💰 Pemasukan: Rp ${income.toLocaleString(
      "id-ID"
    )}\n💸 Pengeluaran: Rp ${expense.toLocaleString(
      "id-ID"
    )}\n🏦 Tabungan: Rp ${savings.toLocaleString("id-ID")}`,
    data: { type: "WEEKLY_REPORT" },
  }),

  // FINANCIAL TIPS (Rotating tips)
  financialTips: [
    {
      title: "💡 Tips Finansial",
      body: "Coba alokasikan 20% penghasilan untuk tabungan darurat",
      data: { type: "FINANCIAL_TIP" },
    },
    {
      title: "💡 Tips Finansial",
      body: "Review budget mingguan bisa bantu hemat hingga 30%",
      data: { type: "FINANCIAL_TIP" },
    },
    {
      title: "💡 Tips Finansial",
      body: "Catat semua pengeluaran kecil, bisa terkumpul besar loh!",
      data: { type: "FINANCIAL_TIP" },
    },
    {
      title: "💡 Tips Finansial",
      body: "Buat prioritas pengeluaran: Needs > Wants > Savings",
      data: { type: "FINANCIAL_TIP" },
    },
    {
      title: "💡 Tips Finansial",
      body: "Otomatiskan tabungan agar konsisten menabung",
      data: { type: "FINANCIAL_TIP" },
    },
  ],

  // DAY-SPECIFIC MESSAGES
  mondayMessage: () => ({
    title: "📅 Awal Minggu Baru",
    body: "Yuk atur budget minggu ini dan tetapkan target tabungan!",
    data: { type: "MONDAY_MESSAGE" },
  }),

  fridayMessage: () => ({
    title: "🎉 Weekend Alert",
    body: "Jangan lupa alokasikan budget untuk hiburan weekend!",
    data: { type: "FRIDAY_MESSAGE" },
  }),

  sundayMessage: (weeklySavings: number) => ({
    title: "📈 Weekly Review",
    body: `Tabungan minggu ini: Rp ${weeklySavings.toLocaleString(
      "id-ID"
    )}\nBesok awal minggu baru, siapkan planning!`,
    data: { type: "SUNDAY_MESSAGE" },
  }),

  // NOTES REMINDERS
  notesReminder: () => ({
    title: "📔 Refleksi Keuangan",
    body: "Luangkan 5 menit untuk catat refleksi finansial hari ini",
    data: { type: "NOTES_REMINDER" },
  }),

  // TRANSACTION REMINDERS
  noTransactionToday: () => ({
    title: "📝 Belum Ada Transaksi Hari Ini",
    body: "Apakah hari ini tidak ada transaksi? Jangan lupa catat jika ada!",
    data: { type: "NO_TRANSACTION_TODAY" },
  }),
};
