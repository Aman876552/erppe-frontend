"use client"

import React, { useEffect, useState } from "react"
import { clientsApi } from "@/modules/clients/lib/clients-api"
import { usersApi } from "@/modules/core/lib/users-api"
import { NewOrderClient, Client, Product, User as OrderUser } from "@/modules/orders/components/new-order-client"
import { apiClient } from "@/modules/core/lib/api-client"
import { Loader2 } from "lucide-react"

export default function NewOrderPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<OrderUser[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [initialOrderNo, setInitialOrderNo] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let live = true

    async function loadData() {
      try {
        const [clientsRes, usersRes] = await Promise.all([
          clientsApi.getClients().catch(() => ({ data: [] })),
          usersApi.getUsers().catch(() => ({ data: [] })),
        ])

        // Fetch products or fallback to products endpoint
        let fetchedProducts: Product[] = []
        try {
          const prodRes = await apiClient.get<any>("/products").catch(() => null) ||
                          await apiClient.get<any>("/items").catch(() => null)
          const raw = prodRes?.data !== undefined ? prodRes.data : prodRes
          if (Array.isArray(raw)) {
            fetchedProducts = raw
          } else if (raw && Array.isArray(raw.data)) {
            fetchedProducts = raw.data
          }
        } catch {
          fetchedProducts = []
        }

        // If no products returned, provide standard product options
        if (fetchedProducts.length === 0) {
          fetchedProducts = [
            {
              id: "prod-1",
              name: "Standard Control Panel Enclosure 600x800",
              sku: "CP-6080-STD",
              unit: "Pcs",
              sellingCost: 18500,
              isOrderable: true,
              itemLevel: "FINISH",
              bomCost: 12400,
              laborCost: 2100,
              totalUnitCost: 14500,
            },
            {
              id: "prod-2",
              name: "Heavy Duty Distribution Board 12-Way",
              sku: "DB-12W-HD",
              unit: "Pcs",
              sellingCost: 32000,
              isOrderable: true,
              itemLevel: "FINISH",
              bomCost: 21000,
              laborCost: 3500,
              totalUnitCost: 24500,
            },
            {
              id: "prod-3",
              name: "Custom Stainless Steel Junction Box 300x300",
              sku: "JB-3030-SS",
              unit: "Pcs",
              sellingCost: 8900,
              isOrderable: true,
              itemLevel: "FINISH",
              bomCost: 5400,
              laborCost: 1200,
              totalUnitCost: 6600,
            },
          ]
        }

        // Map clients to required shape
        const mappedClients: Client[] = (clientsRes.data || []).map((c: any) => ({
          id: String(c.id),
          name: c.name || c.tradeName || c.legalEntity || "Client",
          phone: c.phone,
          email: c.email,
          address: c.registeredAddress || c.address,
          contact: c.authSignatory || c.contactPerson,
          city: c.city || c.district,
          state: c.state,
          pincode: c.pincode,
          locations: Array.isArray(c.locations)
            ? c.locations.map((l: any) => ({
                id: String(l.id),
                locationName: l.locationName,
                contactPerson: l.contactPerson,
                deliveryAddress: l.deliveryAddress,
                dispatchInstructions: l.dispatchInstruction || l.dispatchInstructions,
                transportTerms: l.transportTerms,
                taxShippingInfo:
                  l.taxShippingInfo ||
                  (l.city || l.billingGst
                    ? JSON.stringify({ city: l.city, level: l.level, gst: l.billingGst })
                    : null),
              }))
            : undefined,
        }))

        const mappedUsers = (usersRes.data || []).map((u) => ({
          id: String(u.id),
          name: u.name || u.email || "User",
          email: u.email || "",
        }))

        if (!live) return
        setClients(mappedClients)
        setUsers(mappedUsers)
        setProducts(fetchedProducts)

        // Generate clean default order number e.g. ORD-26-0001
        const randomNum = Math.floor(1000 + Math.random() * 9000)
        setInitialOrderNo(`ORD-26-${randomNum}`)
      } catch (err) {
        console.error("Error loading new order form options:", err)
      } finally {
        if (live) setIsLoading(false)
      }
    }

    loadData()

    return () => {
      live = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">Preparing order entry form...</p>
      </div>
    )
  }

  return (
    <NewOrderClient
      clients={clients}
      products={products}
      users={users}
      initialOrderNo={initialOrderNo}
    />
  )
}
