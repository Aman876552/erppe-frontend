"use client"

import React, { useState } from "react"
import { X, Layers, PackageCheck, AlertCircle, CheckCircle, Search } from "lucide-react"

export type GlobalBomModalItem = {
  productId: string
  productName: string
  qty: number
  bomRows?: Array<{
    label: string
    code: string | null
    qtyPerUnit: number
    unitCost: number
    total: number
    availableQty?: number | null
    inStock?: boolean | null
  }>
}

export type GlobalBomModalProps = {
  title?: string
  items: GlobalBomModalItem[]
  emptyText?: string
  onClose: () => void
}

export function GlobalBomModal({
  title = "🧩 Bill of Materials — all locations & products",
  items,
  emptyText = "Add products under a location to see their BOM here.",
  onClose,
}: GlobalBomModalProps) {
  const [search, setSearch] = useState("")

  const totalUnits = items.reduce((acc, item) => acc + item.qty, 0)

  // Aggregate raw materials across all ordered items
  const aggregatedMaterials = React.useMemo(() => {
    const map = new Map<
      string,
      {
        label: string
        code: string | null
        requiredQty: number
        unitCost: number
        totalCost: number
        inStock: boolean
      }
    >()

    items.forEach((item) => {
      if (item.bomRows && item.bomRows.length > 0) {
        item.bomRows.forEach((row) => {
          const key = row.code || row.label
          const existing = map.get(key)
          const needed = row.qtyPerUnit * item.qty
          if (existing) {
            existing.requiredQty += needed
            existing.totalCost += needed * row.unitCost
          } else {
            map.set(key, {
              label: row.label,
              code: row.code,
              requiredQty: needed,
              unitCost: row.unitCost,
              totalCost: needed * row.unitCost,
              inStock: row.inStock ?? true,
            })
          }
        })
      }
    })

    return Array.from(map.values())
  }, [items])

  const filteredItems = items.filter((i) =>
    i.productName.toLowerCase().includes(search.toLowerCase())
  )

  const totalBomCostEstimate = aggregatedMaterials.reduce((acc, m) => acc + m.totalCost, 0)

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--surface, #ffffff)",
          color: "var(--text, #111827)",
          border: "1px solid var(--border, #e5e7eb)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 780,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border, #e5e7eb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface2, #f9fafb)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
                {title}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text3, #6b7280)", marginTop: 2 }}>
                Consolidated Bill of Materials for {items.length} line items ({totalUnits.toLocaleString("en-IN")} total units)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 6,
              borderRadius: 8,
              color: "var(--text2, #4b5563)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 20, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {items.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                background: "var(--surface2, #f9fafb)",
                borderRadius: 12,
                border: "1px dashed var(--border, #e5e7eb)",
                color: "var(--text3, #6b7280)",
              }}
            >
              <PackageCheck size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{emptyText}</p>
            </div>
          ) : (
            <>
              {/* Search Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  background: "var(--surface2, #f9fafb)",
                  border: "1px solid var(--border, #e5e7eb)",
                  borderRadius: 8,
                }}
              >
                <Search size={16} style={{ color: "var(--text3, #6b7280)" }} />
                <input
                  type="text"
                  placeholder="Filter location or product..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    width: "100%",
                    fontSize: 13,
                    color: "var(--text, #111827)",
                  }}
                />
              </div>

              {/* Items List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text3, #6b7280)" }}>
                  Order Products Breakdown
                </div>
                {filteredItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 12,
                      background: "var(--surface2, #f9fafb)",
                      border: "1px solid var(--border, #e5e7eb)",
                      borderRadius: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text, #111827)" }}>
                        {item.productName}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text3, #6b7280)", marginTop: 2 }}>
                        Product ID: {item.productId}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          background: "var(--surface, #ffffff)",
                          border: "1px solid var(--border, #e5e7eb)",
                          color: "var(--accent, #2563eb)",
                        }}
                      >
                        Qty: {item.qty.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Aggregated Raw Material BOM Table */}
              {aggregatedMaterials.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text3, #6b7280)", marginBottom: 8 }}>
                    Aggregated Raw Material Requirements
                  </div>
                  <div
                    style={{
                      border: "1px solid var(--border, #e5e7eb)",
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                      <thead>
                        <tr style={{ background: "var(--surface2, #f9fafb)", textAlign: "left" }}>
                          <th style={{ padding: "8px 12px", borderBottom: "1px solid var(--border, #e5e7eb)" }}>Material / Component</th>
                          <th style={{ padding: "8px 12px", borderBottom: "1px solid var(--border, #e5e7eb)" }}>Code</th>
                          <th style={{ padding: "8px 12px", borderBottom: "1px solid var(--border, #e5e7eb)", textAlign: "right" }}>Required Qty</th>
                          <th style={{ padding: "8px 12px", borderBottom: "1px solid var(--border, #e5e7eb)", textAlign: "right" }}>Est. Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aggregatedMaterials.map((mat, i) => (
                          <tr key={i} style={{ borderBottom: i === aggregatedMaterials.length - 1 ? "none" : "1px solid var(--border, #e5e7eb)" }}>
                            <td style={{ padding: "8px 12px", fontWeight: 500 }}>{mat.label}</td>
                            <td style={{ padding: "8px 12px", color: "var(--text3, #6b7280)" }}>{mat.code || "—"}</td>
                            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>{mat.requiredQty.toLocaleString("en-IN")}</td>
                            <td style={{ padding: "8px 12px", textAlign: "right" }}>₹{mat.totalCost.toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border, #e5e7eb)",
            background: "var(--surface2, #f9fafb)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--text2, #4b5563)", fontWeight: 600 }}>
            {aggregatedMaterials.length > 0
              ? `Est. Material BOM Cost: ₹${totalBomCostEstimate.toLocaleString("en-IN")}`
              : `${items.length} product(s) ready for production planning`}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close BOM
          </button>
        </div>
      </div>
    </div>
  )
}
