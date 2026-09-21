import { Note, Budget, Savings, Transaction, SavingsTransaction, SubTransaction } from "../types";
import { safeNumber, formatToDateKey } from "./calculations";
import { getJakartaDateKey } from "./dailyCheckIn";
import { generateId, generateSavingsId, generateTransactionId, generateBudgetId } from "./idGenerator";

export const isValidDateString = (dateString: any): boolean => {
  if (!dateString || typeof dateString !== "string") return false;
  const regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.\d{3}Z)?$/;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const validateNote = (note: any): Note => {
  try {
    const validTypes = ["financial_decision", "expense_reflection", "goal_progress", "investment_idea", "budget_analysis", "general"];
    const validMoods = ["positive", "neutral", "negative", "reflective"];
    const validImpacts = ["positive", "neutral", "negative"];

    return {
      id: note.id || generateId(),
      title: note.title?.trim() || "Catatan tanpa judul",
      content: note.content?.trim() || "",
      type: validTypes.includes(note.type) ? note.type : "general",
      mood: validMoods.includes(note.mood) ? note.mood : undefined,
      financialImpact: validImpacts.includes(note.financialImpact)
        ? note.financialImpact
        : undefined,
      amount:
        typeof note.amount === "number"
          ? Math.max(0, note.amount)
          : undefined,
      category: note.category?.trim() || undefined,
      tags: Array.isArray(note.tags)
        ? note.tags
            .filter((tag: any) => typeof tag === "string")
            .map((tag: string) => tag.trim())
        : [],
      relatedTransactionIds: Array.isArray(note.relatedTransactionIds)
        ? note.relatedTransactionIds
        : [],
      relatedSavingsIds: Array.isArray(note.relatedSavingsIds)
        ? note.relatedSavingsIds
        : [],
      relatedBudgetIds: Array.isArray(note.relatedBudgetIds)
        ? note.relatedBudgetIds
        : [],
      date: isValidDateString(note.date)
        ? note.date
        : getJakartaDateKey(),
      createdAt: note.createdAt || new Date().toISOString(),
      updatedAt: note.updatedAt || new Date().toISOString(),
    };
  } catch (error) {

    const now = new Date().toISOString();
    return {
      id: generateId(),
      title: "Catatan tanpa judul",
      content: "",
      type: "general",
      tags: [],
      date: getJakartaDateKey(),
      createdAt: now,
      updatedAt: now,
    };
  }
};

export const validateAndSetupBudget = (budget: any): Budget => {
  try {
    let startDate = budget.startDate;
    let endDate = budget.endDate;
    const createdAt = budget.createdAt || new Date().toISOString();
    const createdDate = createdAt.split("T")[0];

    if (!isValidDateString(startDate)) {
      startDate = createdDate;
    }

    if (!isValidDateString(endDate)) {
      const start = new Date(startDate);
      let end = new Date(start);

      const period = budget.period || "monthly";

      switch (period) {
        case "weekly":
          end.setDate(end.getDate() + 6);
          break;
        case "monthly":
          if (start.getDate() === 1) {
            end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
          } else {
            const targetMonth = start.getMonth() + 1;
            const targetYear = start.getFullYear() + Math.floor(targetMonth / 12);
            const normMonth = targetMonth % 12;
            const daysInTargetMonth = new Date(targetYear, normMonth + 1, 0).getDate();
            const targetDay = Math.min(start.getDate() - 1, daysInTargetMonth);
            end = new Date(targetYear, normMonth, Math.max(1, targetDay));
          }
          break;
        case "yearly":
          end.setFullYear(end.getFullYear() + 1);
          end.setDate(end.getDate() - 1);
          break;
        case "custom":
          end.setDate(end.getDate() + 29);
          break;
        default:
          end.setDate(end.getDate() + 29);
      }

      endDate = end.toISOString().split("T")[0];
    }

    return {
      id: budget.id || generateBudgetId(),
      category: budget.category || "Lainnya",
      limit: Math.max(0, budget.limit || 0),
      spent: Math.max(0, budget.spent || 0),
      period: budget.period || "monthly",
      startDate,
      endDate,
      lastResetDate: budget.lastResetDate,
      createdAt: budget.createdAt || new Date().toISOString(),
    };
  } catch (error) {

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    return {
      id: budget.id || generateBudgetId(),
      category: budget.category || "Lainnya",
      limit: Math.max(0, budget.limit || 0),
      spent: Math.max(0, budget.spent || 0),
      period: budget.period || "monthly",
      startDate: today,
      endDate: today,
      createdAt: new Date().toISOString(),
    };
  }
};

export const validateSavings = (savings: any): Savings => {
  try {
    return {
      id: savings.id || generateSavingsId(),
      name: savings.name || "Tabungan Baru",
      target: Math.max(0, savings.target || 0),
      current: Math.max(0, savings.current || 0),
      deadline: savings.deadline,
      category: savings.category || "Lainnya",
      priority: savings.priority || "medium",
      description: savings.description || "",
      icon: savings.icon || "wallet",
      imageCover: savings.imageCover || undefined,
      createdAt: savings.createdAt || new Date().toISOString(),
    };
  } catch (error) {

    return {
      id: generateSavingsId(),
      name: "Tabungan Baru",
      target: 0,
      current: 0,
      deadline: undefined,
      category: "Lainnya",
      priority: "medium",
      description: "",
      icon: "wallet",
      imageCover: undefined,
      createdAt: new Date().toISOString(),
    };
  }
};

export const validateTransaction = (transaction: any): Transaction => {
  try {
    // Validate and preserve subTransactions
    const subTransactions: SubTransaction[] | undefined = Array.isArray(transaction.subTransactions)
      ? (transaction.subTransactions
          .filter((s: any) => s && typeof s === "object" && typeof s.id === "string" && typeof s.name === "string" && typeof s.amount === "number")
          .map((s: any): SubTransaction => ({
            id: s.id,
            name: s.name.trim() || "Item",
            amount: Math.max(0, s.amount),
            qty: typeof s.qty === "number" && s.qty > 0 ? s.qty : 1,
            note: s.note || undefined,
          })) as SubTransaction[])
      : undefined;

    return {
      id: transaction.id || generateTransactionId(),
      amount: Math.max(0, transaction.amount || 0),
      type: transaction.type === "income" ? "income" : "expense",
      category: transaction.category || "Lainnya",
      description: transaction.description || "",
      date: isValidDateString(transaction.date)
        ? transaction.date
        : getJakartaDateKey(),
      createdAt: transaction.createdAt || new Date().toISOString(),
      cyclePeriod: typeof transaction.cyclePeriod === "number" ? transaction.cyclePeriod : undefined,
      subTransactions: subTransactions && subTransactions.length > 0 ? subTransactions : undefined,
    };
  } catch (error) {

    return {
      id: generateTransactionId(),
      amount: 0,
      type: "expense",
      category: "Lainnya",
      description: "",
      date: getJakartaDateKey(),
      createdAt: new Date().toISOString(),
    };
  }
};

export const validateSavingsTransaction = (transaction: any): SavingsTransaction => {
  try {
    return {
      id: transaction.id || generateId(),
      savingsId: transaction.savingsId || "",
      type: transaction.type || "deposit",
      amount: Math.max(0, transaction.amount || 0),
      date: isValidDateString(transaction.date)
        ? transaction.date
        : getJakartaDateKey(),
      note: transaction.note || "",
      previousBalance: Math.max(0, transaction.previousBalance || 0),
      newBalance: Math.max(0, transaction.newBalance || 0),
      createdAt: transaction.createdAt || new Date().toISOString(),
    };
  } catch (error) {

    return {
      id: generateId(),
      savingsId: "",
      type: "deposit",
      amount: 0,
      date: getJakartaDateKey(),
      note: "",
      previousBalance: 0,
      newBalance: 0,
      createdAt: new Date().toISOString(),
    };
  }
};

export const updateBudgetsFromTransactions = (
  transactions: Transaction[],
  budgets: Budget[]
): Budget[] => {
  if (!budgets.length) return budgets;

  const today = getJakartaDateKey();

  return budgets.map((budget) => {
    try {
      let startDate = budget.startDate;
      let endDate = budget.endDate;
      let lastResetDate = budget.lastResetDate;

      // Auto rollover logic ONLY if budget is recurring (default true)
      const isRecurring = budget.isRecurring !== false;
      if (isRecurring && today > endDate) {
        let start = new Date(startDate);
        let end = new Date(endDate);
        let safetyCounter = 0;
        
        // Loop to advance the period until it covers today
        while (today > formatToDateKey(end) && safetyCounter < 120) {
          safetyCounter++;
          switch (budget.period) {
            case "weekly":
              start.setDate(start.getDate() + 7);
              end.setDate(end.getDate() + 7);
              break;
            case "monthly": {
              if (start.getDate() === 1) {
                start = new Date(start.getFullYear(), start.getMonth() + 1, 1);
                end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
              } else {
                const curDay = start.getDate();
                const nextM = start.getMonth() + 1;
                const nextY = start.getFullYear() + Math.floor(nextM / 12);
                const normM = nextM % 12;
                const maxD = new Date(nextY, normM + 1, 0).getDate();
                start = new Date(nextY, normM, Math.min(curDay, maxD));
                const endM = start.getMonth() + 1;
                const endY = start.getFullYear() + Math.floor(endM / 12);
                const normEndM = endM % 12;
                const maxEndD = new Date(endY, normEndM + 1, 0).getDate();
                end = new Date(endY, normEndM, Math.min(curDay - 1, maxEndD));
              }
              break;
            }
            case "yearly":
              start.setFullYear(start.getFullYear() + 1);
              end.setFullYear(end.getFullYear() + 1);
              break;
            case "custom": {
              const cycleDays = budget.cycleDays && budget.cycleDays > 0
                ? budget.cycleDays
                : (() => {
                    const origStart = new Date(budget.startDate);
                    const origEnd = new Date(budget.endDate);
                    const diffDays = Math.round((origEnd.getTime() - origStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    return diffDays > 0 ? diffDays : 30;
                  })();
              start.setDate(start.getDate() + cycleDays);
              end.setDate(end.getDate() + cycleDays);
              break;
            }
            default:
              start.setMonth(start.getMonth() + 1);
              end.setMonth(end.getMonth() + 1);
          }
        }
        startDate = formatToDateKey(start);
        endDate = formatToDateKey(end);
        lastResetDate = new Date().toISOString();
      }

      const budgetCategoryLower = (budget.category || "").trim().toLowerCase();
      const spent = transactions
        .filter((t) => {
          if (t.type !== "expense") return false;
          if ((t.category || "").trim().toLowerCase() !== budgetCategoryLower) return false;
          const transDate = (t.date || "").slice(0, 10);
          return transDate >= startDate && transDate <= endDate;
        })
        .reduce((sum, t) => sum + safeNumber(t.amount), 0);

      return {
        ...budget,
        startDate,
        endDate,
        lastResetDate,
        spent: Math.max(0, spent),
      };
    } catch (error) {
      return budget;
    }
  });
};
