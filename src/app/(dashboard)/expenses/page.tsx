"use client"

import React, { useEffect, useState } from "react"
import { expensesApi } from "@/modules/expenses/lib/expenses-api"
import { Expense } from "@/modules/expenses/types/expense"
import { ExpensesManager, ExpenseRow } from "@/modules/expenses/components/expenses-manager"
import { PageHeader } from "@/modules/core/components/page-header"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, FolderPlus, Plus, AlertTriangle, Edit, Trash2, Tag } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

function mapExpenseToRow(e: Expense): ExpenseRow {
  const amountVal =
    typeof e.amount === "number"
      ? e.amount
      : typeof e.type === "number"
      ? e.type
      : parseFloat(String(e.type || 0)) || 0

  const typeStr =
    typeof e.type === "string"
      ? e.type
      : e.recurringFrequency
      ? "RECURRING"
      : e.dueDate
      ? "PLANNED"
      : "IMMEDIATE"

  return {
    id: String(e.id),
    title: e.title || "Untitled Expense",
    category: e.category || "General",
    amount: amountVal,
    type: typeStr,
    expenseDate: e.expenseDate || new Date().toISOString().split("T")[0],
    recurringFrequency: e.recurringFrequency || null,
    reminderDays: e.reminderDays != null ? Number(e.reminderDays) : null,
    paymentMethod: e.paymentMethod || null,
    status: (e.status || "pending").toUpperCase(),
    notes: e.notes || null,
    receiptUrl: e.receiptUrl || null,
    receiptFileName: e.receiptFileName || null,
    paidOn: e.paidOn || null,
  }
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Manage Categories Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [categoryNameInput, setCategoryNameInput] = useState("")
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null)
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [expRes, catRes] = await Promise.all([
        expensesApi.getExpenses(),
        expensesApi.getExpenseCategories(),
      ])

      const mappedExp = (expRes.data || []).map(mapExpenseToRow)
      setExpenses(mappedExp)

      const mappedCat = (catRes.data || []).map((c) => ({
        id: String(c.id),
        name: c.name,
      }))
      setCategories(mappedCat)
    } catch (err: any) {
      setError(err.message || "Failed to load expenses data.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryNameInput.trim()) return

    setIsSubmittingCategory(true)
    try {
      if (editingCategory) {
        await expensesApi.updateExpenseCategory(editingCategory.id, { name: categoryNameInput.trim() })
        setEditingCategory(null)
      } else {
        await expensesApi.createExpenseCategory({ name: categoryNameInput.trim() })
      }
      setCategoryNameInput("")
      loadData()
    } catch (err: any) {
      alert(err.message || "Failed to save category")
    } finally {
      setIsSubmittingCategory(false)
    }
  }

  const handleDeleteCategory = async (cat: { id: string; name: string }) => {
    if (!confirm(`Delete category "${cat.name}"? This action cannot be undone.`)) return
    setIsSubmittingCategory(true)
    try {
      await expensesApi.deleteExpenseCategory(cat.id)
      loadData()
    } catch (err: any) {
      alert(err.message || "Failed to delete category")
    } finally {
      setIsSubmittingCategory(false)
    }
  }

  const handleOpenCategoryModal = () => {
    setEditingCategory(null)
    setCategoryNameInput("")
    setIsCategoryModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">Loading Expenses Manager...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Management"
        description="Track operational expenses, payment receipts, due dates, and recurring payouts."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={loadData} variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button onClick={handleOpenCategoryModal} variant="outline" size="sm" className="gap-1.5">
              <FolderPlus className="h-3.5 w-3.5" /> Categories ({categories.length})
            </Button>
          </div>
        }
      />

      {error && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <ExpensesManager
        expenses={expenses}
        categories={categories}
        onRefresh={loadData}
      />

      {/* Manage Categories Dialog */}
      <Dialog
        open={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false)
          setEditingCategory(null)
          setCategoryNameInput("")
        }}
        title="Expense Categories Lookup"
        maxWidth="md"
      >
        <div className="space-y-4 mt-2">
          <form onSubmit={handleSaveCategory} className="flex gap-2">
            <Input
              placeholder={editingCategory ? `Rename "${editingCategory.name}"...` : "Enter new category name..."}
              value={categoryNameInput}
              onChange={(e) => setCategoryNameInput(e.target.value)}
              className="text-xs"
              required
            />
            <Button type="submit" size="sm" disabled={isSubmittingCategory} className="shrink-0 gap-1 text-xs">
              {isSubmittingCategory ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {editingCategory ? "Update" : "Add"}
            </Button>
            {editingCategory && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryNameInput("")
                }}
                className="shrink-0 text-xs"
              >
                Cancel
              </Button>
            )}
          </form>

          <div className="divide-y divide-border/60 max-h-[300px] overflow-y-auto border rounded-xl p-2 bg-muted/10">
            {categories.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No expense categories created yet. Type a name above to create one.
              </div>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-2.5 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                    <span>{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCategory(cat)
                        setCategoryNameInput(cat.name)
                      }}
                      className="h-7 w-7 p-0"
                      title="Edit Category"
                    >
                      <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(cat)}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      title="Delete Category"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setIsCategoryModalOpen(false)
                setEditingCategory(null)
                setCategoryNameInput("")
              }}
              size="sm"
            >
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
