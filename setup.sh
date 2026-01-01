#!/bin/bash

# Create directory structure
mkdir -p src/components/common
mkdir -p src/components/transactions
mkdir -p src/components/budget
mkdir -p src/components/savings
mkdir -p src/components/ui

mkdir -p src/screens/Home
mkdir -p src/screens/Transactions
mkdir -p src/screens/Budget
mkdir -p src/screens/Savings
mkdir -p src/screens/AddTransaction
mkdir -p src/screens/AddBudget
mkdir -p src/screens/AddSavings

mkdir -p src/navigation
mkdir -p src/utils
mkdir -p src/context
mkdir -p src/services
mkdir -p src/types
mkdir -p src/hooks

# Create placeholder files
touch src/components/common/Button.tsx
touch src/components/common/Card.tsx
touch src/components/common/Input.tsx
touch src/components/common/Modal.tsx

touch src/components/transactions/TransactionItem.tsx
touch src/components/transactions/TransactionList.tsx

touch src/components/budget/BudgetItem.tsx
touch src/components/budget/BudgetProgress.tsx

touch src/components/savings/SavingsItem.tsx
touch src/components/savings/SavingsProgress.tsx

touch src/components/ui/Header.tsx
touch src/components/ui/Loading.tsx

touch src/screens/Home/HomeScreen.tsx
touch src/screens/Transactions/TransactionsScreen.tsx
touch src/screens/Budget/BudgetScreen.tsx
touch src/screens/Savings/SavingsScreen.tsx
touch src/screens/AddTransaction/AddTransactionScreen.tsx
touch src/screens/AddBudget/AddBudgetScreen.tsx
touch src/screens/AddSavings/AddSavingsScreen.tsx

touch src/navigation/AppNavigator.tsx
touch src/navigation/types.ts

touch src/utils/storage.ts
touch src/utils/calculations.ts
touch src/utils/formatters.ts

touch src/context/AppContext.tsx

touch src/services/transactionService.ts
touch src/services/budgetService.ts
touch src/services/savingsService.ts

touch src/types/index.ts

touch src/hooks/useStorage.ts

echo "✅ Folder structure created successfully!"