import { apiClient } from "@/modules/core/lib/api-client"
import { apiConfig } from "@/config/api"
import {
  ExpenseCategory,
  Expense,
  CreateExpenseCategoryPayload,
  UpdateExpenseCategoryPayload,
  CreateExpensePayload,
  UpdateExpensePayload,
  PayExpensePayload,
  ExpenseQueryParams,
  ExpenseCategoryQueryParams,
} from "../types/expense"
import { ApiResponse } from "@/modules/core/types/api"

export class ExpensesApiService {
  /**
   * GET /api/expense-categories
   * Option: with_expenses=1 or include_expenses=1
   */
  async getExpenseCategories(
    params: ExpenseCategoryQueryParams = {}
  ): Promise<ApiResponse<ExpenseCategory[]>> {
    const searchParams = new URLSearchParams()
    if (params.name) searchParams.append("name", params.name)
    if (params.with_expenses) searchParams.append("with_expenses", "1")
    if (params.include_expenses) searchParams.append("include_expenses", "1")

    const queryString = searchParams.toString()
    const endpoint = `${apiConfig.endpoints.expenseCategories.list}${queryString ? `?${queryString}` : ""}`

    const response = await apiClient.get<any>(endpoint)
    const rawData = response.data !== undefined ? response.data : response
    let catList: ExpenseCategory[] = []

    if (Array.isArray(rawData)) {
      catList = rawData
    } else if (rawData && Array.isArray(rawData.data)) {
      catList = rawData.data
    } else if (Array.isArray(response)) {
      catList = response
    }

    return {
      success: true,
      data: catList,
    }
  }

  /**
   * GET /api/expense-categories/{id}
   */
  async getExpenseCategoryById(id: string | number): Promise<ApiResponse<ExpenseCategory>> {
    const res = await apiClient.get<any>(apiConfig.endpoints.expenseCategories.detail(id))
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
    }
  }

  /**
   * POST /api/expense-categories
   */
  async createExpenseCategory(payload: CreateExpenseCategoryPayload): Promise<ApiResponse<ExpenseCategory>> {
    const res = await apiClient.post<any>(apiConfig.endpoints.expenseCategories.create, payload)
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message || "Expense category created successfully.",
    }
  }

  /**
   * PUT /api/expense-categories/{id}
   */
  async updateExpenseCategory(
    id: string | number,
    payload: UpdateExpenseCategoryPayload
  ): Promise<ApiResponse<ExpenseCategory>> {
    const res = await apiClient.put<any>(apiConfig.endpoints.expenseCategories.update(id), payload)
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message || "Expense category updated successfully.",
    }
  }

  /**
   * DELETE /api/expense-categories/{id}
   */
  async deleteExpenseCategory(id: string | number): Promise<ApiResponse<{ id: string | number }>> {
    const res = await apiClient.delete<any>(apiConfig.endpoints.expenseCategories.delete(id))
    return {
      success: true,
      data: { id },
      message: res?.message || `Expense category ${id} deleted successfully.`,
    }
  }

  /**
   * GET /api/expenses
   * Query params: category (string/id), status, search
   */
  async getExpenses(params: ExpenseQueryParams = {}): Promise<ApiResponse<Expense[]>> {
    const searchParams = new URLSearchParams()
    if (params.category) searchParams.append("category", params.category)
    if (params.status) searchParams.append("status", params.status)
    if (params.search) searchParams.append("search", params.search)

    const queryString = searchParams.toString()
    const endpoint = `${apiConfig.endpoints.expenses.list}${queryString ? `?${queryString}` : ""}`

    const response = await apiClient.get<any>(endpoint)
    const rawData = response.data !== undefined ? response.data : response
    let expList: Expense[] = []

    if (Array.isArray(rawData)) {
      expList = rawData
    } else if (rawData && Array.isArray(rawData.data)) {
      expList = rawData.data
    } else if (Array.isArray(response)) {
      expList = response
    }

    return {
      success: true,
      data: expList,
    }
  }

  /**
   * GET /api/expenses/{id}
   */
  async getExpenseById(id: string | number): Promise<ApiResponse<Expense>> {
    const res = await apiClient.get<any>(apiConfig.endpoints.expenses.detail(id))
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
    }
  }

  /**
   * POST /api/expenses
   */
  async createExpense(payload: CreateExpensePayload): Promise<ApiResponse<Expense>> {
    const res = await apiClient.post<any>(apiConfig.endpoints.expenses.create, payload)
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message || "Expense record created successfully.",
    }
  }

  /**
   * PUT /api/expenses/{id}
   */
  async updateExpense(id: string | number, payload: UpdateExpensePayload): Promise<ApiResponse<Expense>> {
    const res = await apiClient.put<any>(apiConfig.endpoints.expenses.update(id), payload)
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message || "Expense record updated successfully.",
    }
  }

  /**
   * DELETE /api/expenses/{id}
   */
  async deleteExpense(id: string | number): Promise<ApiResponse<{ id: string | number }>> {
    const res = await apiClient.delete<any>(apiConfig.endpoints.expenses.delete(id))
    return {
      success: true,
      data: { id },
      message: res?.message || `Expense record ${id} deleted successfully.`,
    }
  }

  /**
   * POST /api/expenses/{id}/pay
   * Recorded with payment details & receipt file upload (multipart/form-data)
   */
  async payExpense(id: string | number, payload: PayExpensePayload): Promise<ApiResponse<Expense>> {
    // Client-side file validation (jpg, jpeg, png, pdf, max 2MB)
    if (payload.receipt instanceof File) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
      const maxSizeBytes = 2 * 1024 * 1024 // 2MB

      if (!allowedTypes.includes(payload.receipt.type)) {
        throw new Error("Invalid receipt file type. Only JPG, PNG, and PDF formats are allowed.")
      }
      if (payload.receipt.size > maxSizeBytes) {
        throw new Error("Receipt file size exceeds maximum limit of 2MB.")
      }
    }

    const formData = new FormData()
    formData.append("paymentDate", payload.paymentDate)
    formData.append("paymentMethod", payload.paymentMethod)
    if (payload.receipt instanceof File) {
      formData.append("receipt", payload.receipt)
    }

    const res = await apiClient.post<any>(apiConfig.endpoints.expenses.pay(id), formData)
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message || "Expense payment recorded successfully.",
    }
  }
}

export const expensesApi = new ExpensesApiService()
