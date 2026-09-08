"use client";

import {
  formatLocationBillingLabel,
  parseLocationBilling,
} from "@/lib/client-locations";
import { ArrowLeft, PencilIcon, Plus, X, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { GlobalBomModal } from "@/components/shared/GlobalBomModal";
import { clientsApi } from "@/modules/clients/lib/clients-api";
import { ordersApi } from "@/modules/orders/lib/orders-api";

export type Client = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contact?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  locations?: Location[];
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  unit?: string | null;
  sellingCost?: number | null;
  isOrderable?: boolean | null;
  itemLevel?: string | null;
  bomCost?: number | null;
  laborCost?: number | null;
  totalUnitCost?: number | null;
  bomRows?: Array<{
    label: string;
    code: string | null;
    qtyPerUnit: number;
    unitCost: number;
    total: number;
    availableQty?: number | null;
    inStock?: boolean | null;
  }>;
};

function unitCost(product: Product | undefined | null) {
  return Number(product?.totalUnitCost ?? product?.bomCost ?? 0);
}

export type User = { id: string; name: string; email: string };

export type Location = {
  id: string;
  locationName: string;
  contactPerson?: string | null;
  deliveryAddress?: string | null;
  dispatchInstructions?: string | null;
  transportTerms?: string | null;
  taxShippingInfo?: string | null;
};

export type Line = {
  key: string;
  productId: string;
  qty: number;
  unit: string;
  unitPrice: number;
  confirmed: boolean;
};

export type LocBlock = {
  key: string;
  seq: number;
  clientLocationId: string;
  orderDeadline: string;
  expectedFirstDeliveryDate: string;
  dispatchInstructions: string;
  products: Line[];
  showAddForm: boolean;
  draftProductId: string;
  draftQty: string;
  draftUnit: string;
  draftUnitPrice: string;
};

function blankLoc(seq: number, defaultLocationId: string = ""): LocBlock {
  return {
    key: crypto.randomUUID(),
    seq,
    clientLocationId: defaultLocationId,
    orderDeadline: "",
    expectedFirstDeliveryDate: "",
    dispatchInstructions: "",
    products: [],
    showAddForm: false,
    draftProductId: "",
    draftQty: "1",
    draftUnit: "Pcs",
    draftUnitPrice: "",
  };
}

export function NewOrderClient({
  clients,
  products,
  users,
  initialOrderNo,
}: {
  clients: Client[];
  products: Product[];
  users: User[];
  initialOrderNo: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientLocations, setClientLocations] = useState<Location[]>([]);
  const [orderNo, setOrderNo] = useState(initialOrderNo);
  const [clientPoRef, setClientPoRef] = useState("");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [overallDeadline, setOverallDeadline] = useState("");
  const [orderManagerId, setOrderManagerId] = useState("");
  const [commercialTerms, setCommercialTerms] = useState("");
  const [taxAndCurrency, setTaxAndCurrency] = useState("INR + GST");
  const [notes, setNotes] = useState("");
  const locSeqRef = useRef(1);
  const [locations, setLocations] = useState<LocBlock[]>([blankLoc(1)]);
  const [editingLine, setEditingLine] = useState<{
    locKey: string;
    lineKey: string;
  } | null>(null);
  const [showBomModal, setShowBomModal] = useState(false);

  const selectedClient = clients.find((c) => c.id === clientId);
  const saleable = products.filter(
    (p) => p.itemLevel === "FINISH" || p.isOrderable !== false,
  );

  useEffect(() => {
    if (!clientId) {
      setClientLocations([]);
      return;
    }
    let live = true;

    // 1. Check if client in memory already has locations attached
    const foundClient = clients.find((c) => String(c.id) === String(clientId));
    if (foundClient?.locations && foundClient.locations.length > 0) {
      const locs = foundClient.locations;
      setClientLocations(locs);
      locSeqRef.current = 1;
      const initialLocId = locs.length === 1 ? String(locs[0].id) : "";
      setLocations([blankLoc(1, initialLocId)]);
      return;
    }

    // 2. Fetch client details via clientsApi
    clientsApi
      .getClientById(clientId)
      .then((res) => {
        if (!live) return;
        const clientObj: any = res.data;
        const locs = Array.isArray(clientObj?.locations) ? clientObj.locations : [];
        if (locs.length > 0) {
          const mappedLocs: Location[] = locs.map((l: any) => ({
            id: String(l.id),
            locationName: l.locationName,
            contactPerson: l.contactPerson,
            deliveryAddress: l.deliveryAddress,
            dispatchInstructions: l.dispatchInstruction || l.dispatchInstructions,
            transportTerms: l.transportTerms,
            taxShippingInfo: l.taxShippingInfo || (l.city || l.billingGst ? JSON.stringify({ city: l.city, level: l.level, gst: l.billingGst }) : null)
          }));
          setClientLocations(mappedLocs);
          locSeqRef.current = 1;
          const initialLocId = mappedLocs.length === 1 ? String(mappedLocs[0].id) : "";
          setLocations([blankLoc(1, initialLocId)]);
        } else {
          return clientsApi.getClientLocations(clientId).then((locRes) => {
            if (!live) return;
            const fetched = (locRes.data || []).map((l: any) => ({
              id: String(l.id),
              locationName: l.locationName,
              contactPerson: l.contactPerson,
              deliveryAddress: l.deliveryAddress,
              dispatchInstructions: l.dispatchInstruction || l.dispatchInstructions,
              transportTerms: l.transportTerms,
              taxShippingInfo: l.taxShippingInfo || (l.city || l.billingGst ? JSON.stringify({ city: l.city, level: l.level, gst: l.billingGst }) : null)
            }));
            setClientLocations(fetched);
            locSeqRef.current = 1;
            const initialLocId = fetched.length === 1 ? String(fetched[0].id) : "";
            setLocations([blankLoc(1, initialLocId)]);
          });
        }
      })
      .catch(() => {
        if (!live) return;
        clientsApi
          .getClientLocations(clientId)
          .then((locRes) => {
            if (!live) return;
            const fetched = (locRes.data || []).map((l: any) => ({
              id: String(l.id),
              locationName: l.locationName,
              contactPerson: l.contactPerson,
              deliveryAddress: l.deliveryAddress,
              dispatchInstructions: l.dispatchInstruction || l.dispatchInstructions,
              transportTerms: l.transportTerms,
              taxShippingInfo: l.taxShippingInfo || (l.city || l.billingGst ? JSON.stringify({ city: l.city, level: l.level, gst: l.billingGst }) : null)
            }));
            setClientLocations(fetched);
            locSeqRef.current = 1;
            const initialLocId = fetched.length === 1 ? String(fetched[0].id) : "";
            setLocations([blankLoc(1, initialLocId)]);
          })
          .catch(() => {
            if (!live) return;
            setClientLocations([]);
            locSeqRef.current = 1;
            setLocations([blankLoc(1)]);
          });
      });

    return () => {
      live = false;
    };
  }, [clientId, clients]);

  const primaryBillingLabel = useMemo(() => {
    const first = locations.find((l) => l.clientLocationId);
    if (!first) return "";
    const master = clientLocations.find((l) => l.id === first.clientLocationId);
    if (!master) return "";
    return formatLocationBillingLabel(
      parseLocationBilling(master.taxShippingInfo),
    );
  }, [locations, clientLocations]);

  function updateLoc(key: string, patch: Partial<LocBlock>) {
    setLocations((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function confirmDraftProduct(loc: LocBlock) {
    if (!loc.draftProductId) {
      setError("Select a product for this location.");
      return;
    }
    const qty = Number(loc.draftQty);
    if (!(qty > 0)) {
      setError("Enter a quantity greater than zero.");
      return;
    }
    const product = saleable.find((p) => p.id === loc.draftProductId);
    setError("");
    updateLoc(loc.key, {
      products: [
        ...loc.products,
        {
          key: crypto.randomUUID(),
          productId: loc.draftProductId,
          qty,
          unit: loc.draftUnit || product?.unit || "Pcs",
          unitPrice:
            Number(loc.draftUnitPrice || 0) ||
            Number(product?.sellingCost || 0),
          confirmed: true,
        },
      ],
      showAddForm: false,
      draftProductId: "",
      draftQty: "1",
      draftUnit: "Pcs",
      draftUnitPrice: "",
    });
  }

  async function submit() {
    setError("");
    if (!clientId) {
      setError("Select a client.");
      return;
    }
    if (!orderNo.trim()) {
      setError("Order number is required.");
      return;
    }
    if (locations.some((l) => !l.clientLocationId)) {
      setError("Select a dispatch location for every location block.");
      return;
    }

    const billingFromLocations = locations
      .map((loc) => {
        const master = clientLocations.find(
          (l) => l.id === loc.clientLocationId,
        );
        if (!master) return null;
        const billing = parseLocationBilling(master.taxShippingInfo);
        return `${master.locationName}: ${formatLocationBillingLabel(billing)}`;
      })
      .filter(Boolean)
      .join(" | ");

    setBusy(true);
    try {
      const payload = {
        orderNo: orderNo.trim(),
        clientId,
        clientLocationId: locations[0]?.clientLocationId ? String(locations[0].clientLocationId) : null,
        clientPoRef,
        orderDate,
        overallDeadline,
        orderManagerId: orderManagerId || null,
        commercialTerms,
        taxAndCurrency,
        billingLocation: billingFromLocations || primaryBillingLabel || null,
        notes,
        locations: locations.map((loc) => {
          const master = clientLocations.find(
            (l) => l.id === loc.clientLocationId,
          );
          return {
            clientLocationId: loc.clientLocationId,
            snapshotAddress: master?.deliveryAddress || "",
            contactPerson: master?.contactPerson || "",
            dispatchInstructions:
              loc.dispatchInstructions || master?.dispatchInstructions || "",
            orderDeadline: loc.orderDeadline,
            expectedFirstDeliveryDate: loc.expectedFirstDeliveryDate,
            transportTerms: master?.transportTerms || "",
            taxShippingInfo: master?.taxShippingInfo || null,
            products: loc.products.map((p) => ({
              productId: p.productId,
              orderedQty: Number(p.qty),
              unitPrice: Number(p.unitPrice),
              tax: 0,
              unit:
                p.unit ||
                saleable.find((s) => s.id === p.productId)?.unit ||
                "Pcs",
            })),
          };
        }),
      };

      const res = await ordersApi.createOrder(payload as any);
      const data: any = res.data;
      const createdId = data?.id || data?.data?.id;

      if (!createdId) {
        setError("Order created but response ID was missing. Please check order list.");
        return;
      }

      router.push(`/orders/${createdId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not create order. Please check input parameters.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div
        className="flex-row mb18 flex items-center gap-3"
        style={{ justifyContent: "space-between" }}
      >
        <div className="flex-row flex items-center gap-3">
          <Link href="/orders" className="btn btn-icon inline-flex items-center justify-center p-2 rounded-lg border border-border hover:bg-accent/10">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="page-title text-xl font-bold" style={{ margin: 0 }}>
              New Order
            </div>
            <div className="card-sub text-xs text-muted-foreground">
              One client · multiple dispatch locations · products under each site
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div className="form-section-title text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">Order header</div>
        <div className="fgrid grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="fcol flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Order number</label>
            <input
              className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-primary"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="ORD-26-0001"
            />
            <div className="card-sub text-[11px] text-muted-foreground" style={{ marginTop: 4 }}>
              Auto-generated · editable · must stay unique
            </div>
          </div>
          <div className="fcol flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Client PO / reference</label>
            <input
              className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-primary"
              value={clientPoRef}
              onChange={(e) => setClientPoRef(e.target.value)}
              placeholder="e.g. PO-88213"
            />
          </div>
          <div className="fcol flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Order date</label>
            <input
              type="date"
              className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-primary"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
            />
          </div>
          <div className="fcol flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Overall deadline</label>
            <input
              type="date"
              className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-primary"
              value={overallDeadline}
              onChange={(e) => setOverallDeadline(e.target.value)}
            />
          </div>
          <div className="fcol flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Order manager</label>
            <select
              className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-primary"
              value={orderManagerId}
              onChange={(e) => setOrderManagerId(e.target.value)}
            >
              <option value="">— Select user —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div className="fcol flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Tax and currency</label>
            <input
              className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-primary"
              value={taxAndCurrency}
              onChange={(e) => setTaxAndCurrency(e.target.value)}
            />
          </div>
          <div className="fcol md:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Commercial terms</label>
            <textarea
              className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-primary min-h-[70px]"
              value={commercialTerms}
              onChange={(e) => setCommercialTerms(e.target.value)}
              placeholder="Payment, freight, Incoterms"
            />
          </div>
        </div>

        <div className="form-section-title text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border" style={{ marginTop: 22 }}>
          🏢 Client details
        </div>
        <div className="fcol flex flex-col gap-1.5" style={{ marginBottom: 12 }}>
          <label className="text-xs font-semibold">Select client</label>
          <select
            className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-primary"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">— Select a client —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {selectedClient && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 12px",
              background: "var(--surface2, #f9fafb)",
              border: "1px solid var(--border, #e5e7eb)",
              borderRadius: 10,
              fontSize: 12,
              color: "var(--text2, #4b5563)",
              lineHeight: 1.55,
            }}
          >
            <div
              style={{ fontWeight: 800, color: "var(--text, #111827)", marginBottom: 4 }}
            >
              {selectedClient.name}
            </div>
            <div>
              {[
                selectedClient.address,
                selectedClient.city,
                selectedClient.state,
                selectedClient.pincode,
              ]
                .filter(Boolean)
                .join(", ") || "Address not set on client master"}
            </div>
            <div
              style={{ marginTop: 4, color: "var(--text3, #6b7280)", fontSize: 11.5 }}
            >
              {[
                selectedClient.contact
                  ? `Contact ${selectedClient.contact}`
                  : null,
                selectedClient.phone || null,
                selectedClient.email || null,
              ]
                .filter(Boolean)
                .join(" · ") || "No contact details"}
            </div>
          </div>
        )}

        {/* Dispatch locations — only visible after client is selected */}
        {clientId && (
          <>
            <div
              className="flex-row flex items-center justify-between"
              style={{ marginTop: 8 }}
            >
              <div
                className="form-section-title text-sm font-bold"
                style={{ margin: 0, border: 0, padding: 0 }}
              >
                📍 Dispatch locations
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-secondary hover:bg-secondary/80 flex items-center gap-1.5"
                  onClick={() => setShowBomModal(true)}
                >
                  🧩 Show BOM
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-secondary hover:bg-secondary/80 flex items-center gap-1.5"
                  onClick={() => {
                    locSeqRef.current += 1;
                    setLocations((rows) => [blankLoc(locSeqRef.current), ...rows]);
                  }}
                >
                  <Plus size={14} /> Add Location
                </button>
              </div>
            </div>
            <p className="card-sub text-xs text-muted-foreground" style={{ marginBottom: 12 }}>
              Add one or more locations now. You can add another location or
              more items under the same location later from the order.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {locations.map((loc) => {
                const master = clientLocations.find(
                  (l) => l.id === loc.clientLocationId,
                );
                const billing = parseLocationBilling(master?.taxShippingInfo);
                const level = billing.level || "";
                const datesComplete = Boolean(
                  loc.orderDeadline && loc.expectedFirstDeliveryDate,
                );
                return (
                  <div
                    key={loc.key}
                    style={{
                      background: "var(--surface2, #f9fafb)",
                      border: "1px solid var(--border, #e5e7eb)",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    {/* Location header */}
                    <div
                      className="flex-row flex items-center justify-between"
                      style={{
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <strong style={{ fontSize: 12.5 }}>
                          Location {loc.seq}
                        </strong>
                        {loc.clientLocationId ? (
                          datesComplete ? (
                            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Selected</span>
                          ) : (
                            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20" title="Set order & dispatch dates to confirm this location">
                              Incomplete — set order &amp; dispatch dates
                            </span>
                          )
                        ) : null}
                      </div>
                      {locations.length > 1 && (
                        <button
                          type="button"
                          className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-500/10 rounded-md border border-rose-200"
                          onClick={() =>
                            setLocations((rows) =>
                              rows.filter((r) => r.key !== loc.key),
                            )
                          }
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>

                    {/* Single row: Dispatch location (wide) + Order deadline + Dispatch deadline */}
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-end",
                        marginBottom: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <div className="fcol flex flex-col gap-1" style={{ flex: 3, minWidth: 200 }}>
                        <label className="text-xs font-semibold">Dispatch location</label>
                        <select
                          className="px-3 py-1.5 text-xs rounded-md border border-input bg-background"
                          value={loc.clientLocationId}
                          onChange={(e) =>
                            updateLoc(loc.key, {
                              clientLocationId: e.target.value,
                            })
                          }
                        >
                          <option value="">
                            {clientLocations.length === 0
                              ? "— No locations found for this client —"
                              : "— Select location —"}
                          </option>
                          {clientLocations
                            .filter(
                              (l) =>
                                l.id === loc.clientLocationId ||
                                !locations.some(
                                  (other) =>
                                    other.key !== loc.key &&
                                    other.clientLocationId === l.id,
                                ),
                            )
                            .map((l) => {
                              const b = parseLocationBilling(l.taxShippingInfo);
                              return (
                                <option key={l.id} value={l.id}>
                                  {l.locationName}
                                  {b.city ? ` · ${b.city}` : ""}
                                  {b.level ? ` (${b.level})` : ""}
                                </option>
                              );
                            })}
                        </select>
                      </div>
                      <div className="fcol flex flex-col gap-1" style={{ flex: 1, minWidth: 130 }}>
                        <label className="text-xs font-semibold">Order deadline</label>
                        <input
                          type="date"
                          className="px-3 py-1.5 text-xs rounded-md border border-input bg-background"
                          value={loc.orderDeadline}
                          onChange={(e) =>
                            updateLoc(loc.key, {
                              orderDeadline: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="fcol flex flex-col gap-1" style={{ flex: 1, minWidth: 130 }}>
                        <label className="text-xs font-semibold">Dispatch deadline</label>
                        <input
                          type="date"
                          className="px-3 py-1.5 text-xs rounded-md border border-input bg-background"
                          value={loc.expectedFirstDeliveryDate}
                          onChange={(e) =>
                            updateLoc(loc.key, {
                              expectedFirstDeliveryDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Location address snapshot */}
                    {master && (
                      <div
                        style={{
                          marginBottom: 12,
                          padding: "8px 10px",
                          background: "var(--surface, #ffffff)",
                          border: "1px solid var(--border, #e5e7eb)",
                          borderRadius: 8,
                          fontSize: 11.5,
                          color: "var(--text2, #4b5563)",
                          lineHeight: 1.5,
                        }}
                      >
                        <strong style={{ color: "var(--text, #111827)" }}>
                          {master.locationName}
                          {level ? ` · ${level}` : ""}
                        </strong>
                        <br />
                        {master.deliveryAddress || "No address on file"}
                        <br />
                        <span style={{ color: "var(--text3, #6b7280)" }}>
                          🧾 {formatLocationBillingLabel(billing)}
                        </span>
                      </div>
                    )}

                    {/* Products section */}
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--text3, #6b7280)",
                        marginBottom: 10,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      📦 Products for this location
                    </div>

                    {/* Product cards — 3-column grid */}
                    {loc.products.length > 0 && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(240px, 1fr))",
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        {loc.products.map((line) => {
                          const product = saleable.find(
                            (p) => p.id === line.productId,
                          );
                          const isEditing =
                            editingLine?.locKey === loc.key &&
                            editingLine?.lineKey === line.key;
                          return (
                            <div
                              key={line.key}
                              style={{
                                padding: "10px 10px",
                                background: "var(--surface, #ffffff)",
                                border: "1px solid var(--border, #e5e7eb)",
                                borderRadius: 8,
                                minHeight: 58,
                              }}
                            >
                              {isEditing ? (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                  }}
                                >
                                  <select
                                    className="px-2 py-1 text-xs rounded border border-input"
                                    value={line.productId}
                                    onChange={(e) => {
                                      const next = saleable.find(
                                        (p) => p.id === e.target.value,
                                      );
                                      updateLoc(loc.key, {
                                        products: loc.products.map((p) =>
                                          p.key === line.key
                                            ? {
                                                ...p,
                                                productId: e.target.value,
                                                unit:
                                                  next?.unit || p.unit || "Pcs",
                                                unitPrice: Number(
                                                  next?.sellingCost || 0,
                                                ),
                                              }
                                            : p,
                                        ),
                                      });
                                    }}
                                  >
                                    {saleable.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 6,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <input
                                      type="number"
                                      min={1}
                                      style={{ width: 70 }}
                                      className="px-2 py-1 text-xs rounded border border-input"
                                      value={line.qty}
                                      placeholder="Qty"
                                      onChange={(e) =>
                                        updateLoc(loc.key, {
                                          products: loc.products.map((p) =>
                                            p.key === line.key
                                              ? {
                                                  ...p,
                                                  qty: Number(e.target.value),
                                                }
                                              : p,
                                          ),
                                        })
                                      }
                                    />
                                    <select
                                      style={{ width: 80 }}
                                      className="px-2 py-1 text-xs rounded border border-input"
                                      value={line.unit || "Pcs"}
                                      onChange={(e) =>
                                        updateLoc(loc.key, {
                                          products: loc.products.map((p) =>
                                            p.key === line.key
                                              ? { ...p, unit: e.target.value }
                                              : p,
                                          ),
                                        })
                                      }
                                    >
                                      {[
                                        "Pcs",
                                        "Kg",
                                        "Ltr",
                                        "Mtr",
                                        "Box",
                                        "Set",
                                      ].map((unit) => (
                                        <option key={unit} value={unit}>
                                          {unit}
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      style={{ width: 90 }}
                                      className="px-2 py-1 text-xs rounded border border-input"
                                      value={line.unitPrice}
                                      placeholder="Sale ₹"
                                      onChange={(e) =>
                                        updateLoc(loc.key, {
                                          products: loc.products.map((p) =>
                                            p.key === line.key
                                              ? {
                                                  ...p,
                                                  unitPrice: Number(
                                                    e.target.value,
                                                  ),
                                                }
                                              : p,
                                          ),
                                        })
                                      }
                                      title="Sale price"
                                    />
                                  </div>
                                  <div
                                    className="card-sub text-[11px]"
                                    style={{ color: "var(--text2, #4b5563)", display: "flex", gap: 10, flexWrap: "wrap" }}
                                  >
                                    <span>Unit cost (BOM+Labour): ₹{unitCost(product).toLocaleString("en-IN")}</span>
                                    <span>Total unit cost: ₹{(line.qty * unitCost(product)).toLocaleString("en-IN")}</span>
                                    <span>Total sale price: ₹{(line.qty * Number(line.unitPrice || 0)).toLocaleString("en-IN")}</span>
                                    <span
                                      style={{
                                        color:
                                          line.qty * (Number(line.unitPrice || 0) - unitCost(product)) >= 0
                                            ? "#10b981"
                                            : "#ef4444",
                                      }}
                                    >
                                      Margin: ₹
                                      {(
                                        line.qty *
                                        (Number(line.unitPrice || 0) - unitCost(product))
                                      ).toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    className="px-2.5 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-1"
                                    style={{ alignSelf: "flex-start" }}
                                    onClick={() => setEditingLine(null)}
                                  >
                                    <Check size={13} /> Done
                                  </button>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontWeight: 700,
                                        color: "var(--text, #111827)",
                                        fontSize: 12.5,
                                        lineHeight: 1.25,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {product?.name || "Product"}
                                    </div>
                                    <div
                                      className="card-sub text-[11px] text-muted-foreground"
                                      style={{
                                        marginTop: 4,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {product?.sku || "—"} · Qty {line.qty}{" "}
                                      {line.unit || product?.unit || "Pcs"}
                                    </div>
                                    <div
                                      className="card-sub text-[11.5px]"
                                      style={{
                                        color: "#2563eb",
                                        fontWeight: 600,
                                      }}
                                    >
                                      ₹{Number(line.unitPrice || 0).toLocaleString("en-IN")}/unit
                                      {" · Total: ₹"}
                                      {(line.qty * Number(line.unitPrice || 0)).toLocaleString("en-IN")}
                                    </div>
                                    <div
                                      className="card-sub text-[11px]"
                                      style={{ color: "var(--text3, #6b7280)" }}
                                    >
                                      Unit cost ₹{unitCost(product).toLocaleString("en-IN")}
                                      {" · Total: ₹"}
                                      {(line.qty * unitCost(product)).toLocaleString("en-IN")}
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 4,
                                      alignItems: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className="p-1 rounded hover:bg-muted"
                                      onClick={() =>
                                        setEditingLine({
                                          locKey: loc.key,
                                          lineKey: line.key,
                                        })
                                      }
                                    >
                                      <PencilIcon
                                        size={13}
                                        className="text-gray-500"
                                      />
                                    </button>
                                    <button
                                      type="button"
                                      className="p-1 rounded hover:bg-rose-500/10 text-rose-600"
                                      onClick={() =>
                                        updateLoc(loc.key, {
                                          products: loc.products.filter(
                                            (p) => p.key !== line.key,
                                          ),
                                        })
                                      }
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {loc.products.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          background: "var(--surface, #ffffff)",
                          border: "1px solid var(--border, #e5e7eb)",
                          borderRadius: 8,
                          fontSize: 12,
                          marginTop: 4,
                          marginBottom: 4,
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <span style={{ color: "var(--text3, #6b7280)" }}>
                          {loc.products.length} product{loc.products.length !== 1 ? "s" : ""}
                          {" · "}
                          {loc.products.reduce((s, p) => s + p.qty, 0).toLocaleString("en-IN")} units
                        </span>
                        <span
                          style={{
                            display: "flex",
                            gap: 12,
                            fontWeight: 700,
                            flexWrap: "wrap",
                          }}
                        >
                          {(() => {
                            const saleValue = loc.products.reduce(
                              (s, p) => s + p.qty * Number(p.unitPrice || 0),
                              0,
                            );
                            const unitCostValue = loc.products.reduce((s, p) => {
                              const prod = saleable.find((sp) => sp.id === p.productId);
                              return s + p.qty * unitCost(prod);
                            }, 0);
                            return (
                              <>
                                <span style={{ color: "var(--text2, #4b5563)" }}>
                                  Total Unit Cost: ₹{unitCostValue.toLocaleString("en-IN")}
                                </span>
                                <span style={{ color: "#2563eb" }}>
                                  Total Sale Price: ₹{saleValue.toLocaleString("en-IN")}
                                </span>
                                <span
                                  style={{
                                    color: saleValue - unitCostValue >= 0 ? "#10b981" : "#ef4444",
                                  }}
                                >
                                  Margin: ₹{(saleValue - unitCostValue).toLocaleString("en-IN")}
                                </span>
                              </>
                            );
                          })()}
                        </span>
                      </div>
                    )}

                    {/* Add product form — shown only when toggled */}
                    {loc.showAddForm ? (
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "flex-end",
                          flexWrap: "wrap",
                          marginBottom: 4,
                          padding: "10px 10px",
                          background: "var(--surface, #ffffff)",
                          border: "1px dashed var(--border, #e5e7eb)",
                          borderRadius: 8,
                        }}
                      >
                        <div
                          className="fcol flex flex-col gap-1"
                          style={{ flex: 2, minWidth: 160 }}
                        >
                          <label className="text-xs font-semibold">Product</label>
                          <select
                            className="px-2.5 py-1.5 text-xs rounded border border-input bg-background"
                            value={loc.draftProductId}
                            onChange={(e) => {
                              const product = saleable.find(
                                (p) => p.id === e.target.value,
                              );
                              updateLoc(loc.key, {
                                draftProductId: e.target.value,
                                draftUnit: product?.unit || "Pcs",
                                draftUnitPrice: product?.sellingCost
                                  ? String(product.sellingCost)
                                  : "",
                              });
                            }}
                          >
                            <option value="">— Select product —</option>
                            {saleable.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                                {p.sku ? ` (${p.sku})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="fcol flex flex-col gap-1" style={{ width: 80 }}>
                          <label className="text-xs font-semibold">Qty</label>
                          <input
                            type="number"
                            min={1}
                            className="px-2.5 py-1.5 text-xs rounded border border-input bg-background"
                            value={loc.draftQty}
                            onChange={(e) =>
                              updateLoc(loc.key, { draftQty: e.target.value })
                            }
                          />
                        </div>
                        <div className="fcol flex flex-col gap-1" style={{ width: 100 }}>
                          <label className="text-xs font-semibold">Unit</label>
                          <select
                            className="px-2.5 py-1.5 text-xs rounded border border-input bg-background"
                            value={loc.draftUnit}
                            onChange={(e) =>
                              updateLoc(loc.key, { draftUnit: e.target.value })
                            }
                          >
                            {["Pcs", "Kg", "Ltr", "Mtr", "Box", "Set"].map(
                              (unit) => (
                                <option key={unit} value={unit}>
                                  {unit}
                                </option>
                              ),
                            )}
                          </select>
                        </div>
                        <div className="fcol flex flex-col gap-1" style={{ width: 120 }}>
                          <label className="text-xs font-semibold">Sale price (₹)</label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className="px-2.5 py-1.5 text-xs rounded border border-input bg-background"
                            value={loc.draftUnitPrice}
                            onChange={(e) =>
                              updateLoc(loc.key, {
                                draftUnitPrice: e.target.value,
                              })
                            }
                            placeholder="₹ per unit"
                          />
                        </div>
                        {loc.draftProductId ? (
                          <div className="fcol flex flex-col gap-1" style={{ minWidth: 220 }}>
                            <label className="text-xs font-semibold">Unit cost preview (BOM+Labour)</label>
                            {(() => {
                              const draftProduct = saleable.find(
                                (p) => p.id === loc.draftProductId,
                              );
                              const cost = unitCost(draftProduct);
                              const qty = Number(loc.draftQty || 0);
                              const salePrice = Number(loc.draftUnitPrice || 0);
                              const margin = qty * (salePrice - cost);
                              return (
                                <div className="card-sub text-xs" style={{ lineHeight: 1.6 }}>
                                  ₹{cost.toLocaleString("en-IN")}/unit · Total ₹
                                  {(qty * cost).toLocaleString("en-IN")}
                                  <br />
                                  <span style={{ color: margin >= 0 ? "#10b981" : "#ef4444" }}>
                                    Margin: ₹{margin.toLocaleString("en-IN")}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        ) : null}
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                          }}
                        >
                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-1"
                            onClick={() => confirmDraftProduct(loc)}
                          >
                            <Check size={13} /> Add
                          </button>
                          <button
                            type="button"
                            className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted rounded"
                            onClick={() =>
                              updateLoc(loc.key, {
                                showAddForm: false,
                                draftProductId: "",
                                draftQty: "1",
                                draftUnit: "Pcs",
                                draftUnitPrice: "",
                              })
                            }
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ) : datesComplete ? (
                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded flex items-center gap-1"
                        style={{ marginTop: 2 }}
                        onClick={() =>
                          updateLoc(loc.key, { showAddForm: true })
                        }
                      >
                        <Plus size={13} /> Add Product
                      </button>
                    ) : (
                      <div className="card-sub text-xs text-muted-foreground" style={{ marginTop: 2 }}>
                        Set order &amp; dispatch dates above before adding products.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="fcol flex flex-col gap-1.5" style={{ marginTop: 16 }}>
          <label className="text-xs font-semibold">Order notes</label>
          <textarea
            className="px-3 py-2 text-sm rounded-md border border-input bg-background min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <div style={{ color: "#ef4444", fontSize: 12, marginTop: 10, fontWeight: 500 }}>
            {error}
          </div>
        )}

        <div
          className="flex-row flex items-center justify-end gap-3"
          style={{ marginTop: 18 }}
        >
          <Link href="/orders" className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent/10">
            Cancel
          </Link>
          <button
            type="button"
            className="px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? "Creating…" : "Create Order"}
          </button>
        </div>
      </div>

      {showBomModal && (
        <GlobalBomModal
          title="🧩 Bill of Materials — all locations & products"
          items={locations.flatMap((loc) => {
            const master = clientLocations.find((l) => l.id === loc.clientLocationId);
            const locLabel = master?.locationName || `Location ${loc.seq}`;
            return loc.products.map((line) => {
              const product = saleable.find((p) => p.id === line.productId);
              return {
                productId: line.productId,
                productName: `${locLabel} — ${product?.name || "Product"}`,
                qty: line.qty,
                bomRows: product?.bomRows,
              };
            });
          })}
          emptyText="Add products under a location to see their BOM here."
          onClose={() => setShowBomModal(false)}
        />
      )}
    </div>
  );
}
