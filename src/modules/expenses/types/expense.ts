export interface ExpenseCategory {
  id: string | number
  name: string
  expenses?: Expense[]
  createdAt?: string
  updatedAt?: string
}

export interface Expense {
  id: string | number
  title: string
  category: string
  type: number // Numeric expense amount
  expenseDate: string
  dueDate?: string | null
  recurringFrequency?: string | null
  reminderDays?: number | null
  paymentMethod?: string | null
  status: string
  vendorName?: string | null
  notes?: string | null
  rawData?: string | null
  receiptUrl?: string | null
  receiptFileName?: string | null
  paidOn?: string | null
  createdBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface CreateExpenseCategoryPayload {
  name: string
}

export interface UpdateExpenseCategoryPayload {
  name: string
}

export interface CreateExpensePayload {
  title: string
  category: string
  type?: number
  expenseDate: string
  dueDate?: string
  recurringFrequency?: string
  reminderDays?: number
  paymentMethod?: string
  status: string
  vendorName?: string
  notes?: string
  rawData?: string
}

export interface UpdateExpensePayload extends Partial<CreateExpensePayload> {
  paidOn?: string
}

export interface PayExpensePayload {
  paymentDate: string
  paymentMethod: string
  receipt?: File | null
}

export interface ExpenseQueryParams {
  category?: string
  status?: string
  search?: string
}

export interface ExpenseCategoryQueryParams {
  name?: string
  with_expenses?: boolean | number
  include_expenses?: boolean | number
}
