"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { leadsApi } from "@/modules/leads/lib/leads-api";
import { apiClient } from "@/modules/core/lib/api-client";
import { Trash2, Plus } from "lucide-react";

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chandigarh (UT)","Chhattisgarh",
  "Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha",
  "Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Other",
];

const SOURCES = [
  "Website","Referral","Trade Show / Exhibition","Cold Call","Email Campaign",
  "WhatsApp","Walk-in","Distributor","Other",
];

const PRIORITIES = ["High", "Medium", "Low"];
const TYPES = ["Product", "Service", "Mixed", "Inbound"];

type Line = { productName: string; productCode: string; qty: number; department: string };

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 border border-border bg-card space-y-4">
      <div className="font-bold text-sm text-foreground pb-2 border-b border-border flex items-center gap-2">
        {title}
      </div>
      {children}
    </Card>
  );
}

import { clientsApi } from "@/modules/clients/lib/clients-api";
import { Client } from "@/modules/clients/types/client";

export function LeadForm({
  initial,
  leadId,
}: {
  initial?: Record<string, unknown>;
  leadId?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [saveAsClient, setSaveAsClient] = useState<boolean>(true);
  
  const [form, setForm] = useState({
    leadName: String(initial?.leadName ?? ""),
    company: String(initial?.company ?? ""),
    contactPerson: String(initial?.name ?? initial?.contactPerson ?? ""),
    mobile: String(initial?.phone ?? ""),
    whatsapp: String(initial?.whatsapp ?? ""),
    email: String(initial?.email ?? ""),
    address: String(initial?.address ?? ""),
    state: String(initial?.state ?? ""),
    city: String(initial?.city ?? ""),
    pincode: String(initial?.pincode ?? ""),
    role: String(initial?.role ?? ""),
    leadType: String(initial?.leadType ?? "Product"),
    leadSource: String(initial?.leadSource ?? ""),
    leadPriority: String(initial?.leadPriority ?? "Medium"),
    delivery: String(initial?.delivery ?? ""),
    estPrice: initial?.estPrice != null ? Number(initial.estPrice) : ("" as number | ""),
    assignedTo: String(initial?.assignedTo ?? ""),
    notes: String(initial?.notes ?? ""),
    status: String(initial?.status ?? "New"),
  });

  const [lines, setLines] = useState<Line[]>(
    Array.isArray(initial?.items) && (initial.items as any[]).length > 0
      ? (initial.items as any[]).map((l) => ({
          productName: String(l.productName || ""),
          productCode: String(l.productCode || ""),
          qty: Number(l.qty || 1),
          department: String(l.department || ""),
        }))
      : [{ productName: "", productCode: "", qty: 1, department: "" }]
  );

  useEffect(() => {
    // Load clients for client picker
    clientsApi.getClients()
      .then((res) => setClients(res.data || []))
      .catch(() => setClients([]));

    // Fetch departments or sub-departments fallback
    apiClient
      .get<any>("/departments")
      .catch(() => apiClient.get<any>("/sub-departments"))
      .then((res: any) => {
        const raw = res?.data !== undefined ? res.data : res;
        if (Array.isArray(raw)) {
          setDepartments(raw.map((d) => ({ id: String(d.id), name: String(d.name) })));
        }
      })
      .catch(() => {
        setDepartments([]);
      });
  }, []);

  async function handleClientSelect(cId: string) {
    setSelectedClientId(cId);
    if (!cId) {
      setSaveAsClient(true);
      return;
    }
    setSaveAsClient(false);

    let client = clients.find((c) => String(c.id) === String(cId));

    try {
      const res = await clientsApi.getClientById(cId);
      if (res.data) {
        client = { ...client, ...res.data };
      }
    } catch {
      // Fall back to client object in memory
    }

    if (client) {
      const rawState =
        client.state ||
        (client as any).billingState ||
        client.locations?.[0]?.state ||
        "";
      const matchedState =
        STATES.find((s) => s.toLowerCase() === String(rawState).trim().toLowerCase()) ||
        rawState;

      const rawCity =
        client.city ||
        (client as any).district ||
        client.locations?.[0]?.city ||
        "";

      const rawAddress =
        client.address ||
        (client as any).registeredAddress ||
        (client as any).corporateAddress ||
        client.locations?.[0]?.deliveryAddress ||
        "";

      const rawPincode =
        client.pincode || client.locations?.[0]?.pincode || "";

      setForm((f) => ({
        ...f,
        company: client?.name || (client as any)?.tradeName || f.company,
        contactPerson: client?.contact || (client as any)?.authSignatory || f.contactPerson,
        mobile: client?.phone || f.mobile,
        whatsapp: client?.phone || f.whatsapp,
        email: client?.email || f.email,
        address: rawAddress || f.address,
        state: matchedState || f.state,
        city: rawCity || f.city,
        pincode: rawPincode || f.pincode,
        leadType: "Existing Client",
      }));
    }
  }

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.leadName.trim()) {
      setError("Lead name / enquiry title is required.");
      return;
    }
    if (!form.company.trim() && !form.contactPerson.trim()) {
      setError("Company name or contact person is required.");
      return;
    }

    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        leadName: form.leadName.trim(),
        company: form.company.trim(),
        contactPerson: form.contactPerson.trim(),
        name: form.contactPerson.trim() || form.company.trim(),
        phone: form.mobile.trim() || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        state: form.state || undefined,
        city: form.city.trim() || undefined,
        pincode: form.pincode.trim() || undefined,
        role: form.role.trim() || undefined,
        leadType: form.leadType,
        leadSource: form.leadSource || undefined,
        leadPriority: form.leadPriority,
        delivery: form.delivery.trim() || undefined,
        estPrice: form.estPrice === "" ? undefined : Number(form.estPrice),
        assignedTo: form.assignedTo.trim() || undefined,
        notes: form.notes.trim() || undefined,
        status: form.status,
      };

      if (selectedClientId) {
        const selectedClient = clients.find((c) => String(c.id) === String(selectedClientId));
        body.rawData = JSON.stringify({
          clientId: selectedClientId,
          clientCode: selectedClient?.clientCode || null,
        });
      } else if (!leadId && saveAsClient && (form.company.trim() || form.contactPerson.trim())) {
        // Automatically save new client into Client Master
        try {
          const clientRes = await clientsApi.createClient({
            clientCode: `CLI-${Math.floor(100000 + Math.random() * 900000)}`,
            name: form.company.trim() || form.contactPerson.trim(),
            contact: form.contactPerson.trim() || undefined,
            phone: form.mobile.trim() || undefined,
            email: form.email.trim() || undefined,
            registeredAddress: form.address.trim() || undefined,
            state: form.state || undefined,
            city: form.city.trim() || undefined,
            pincode: form.pincode.trim() || undefined,
            status: "Active",
          });
          const createdClient = clientRes.data;
          if (createdClient?.id) {
            body.rawData = JSON.stringify({
              clientId: String(createdClient.id),
              clientCode: createdClient.clientCode || null,
            });
          }
        } catch (clientErr) {
          console.warn("Could not save new client to master:", clientErr);
        }
      }

      if (!leadId) {
        body.items = lines
          .filter((l) => l.productName.trim())
          .map((l) => ({
            productName: l.productName.trim(),
            productCode: l.productCode.trim() || undefined,
            department: l.department.trim() || undefined,
            qty: l.qty || 0,
          }));
      }

      let res: any
      if (leadId) {
        res = await leadsApi.updateLead(leadId, body as any);
      } else {
        res = await leadsApi.createLead(body as any);
      }

      const createdId = res.data?.id || (res.data as any)?.data?.id;

      if (createdId) {
        router.push(`/leads/${createdId}`);
      } else {
        router.push("/leads");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Save failed. Please check your inputs.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold">
          {error}
        </div>
      )}

      <SectionCard title="🧲 Lead / Enquiry">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              Lead Name / Enquiry Title *
            </label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              placeholder="e.g. Flange Nuts & Bolts — Bulk Order Enquiry"
              value={form.leadName}
              onChange={(e) => set("leadName", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              Lead Type
            </label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              value={form.leadType}
              onChange={(e) => set("leadType", e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              Priority
            </label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              value={form.leadPriority}
              onChange={(e) => set("leadPriority", e.target.value)}
            >
              {PRIORITIES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              Source
            </label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              value={form.leadSource}
              onChange={(e) => set("leadSource", e.target.value)}
            >
              <option value="">— Select —</option>
              {SOURCES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              Assigned To
            </label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              value={form.assignedTo}
              onChange={(e) => set("assignedTo", e.target.value)}
              placeholder="Sales person"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              Est. Price (₹)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              value={form.estPrice}
              onChange={(e) =>
                set("estPrice", e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              Delivery Timeline
            </label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              placeholder="e.g. 3-4 weeks"
              value={form.delivery}
              onChange={(e) => set("delivery", e.target.value)}
            />
          </div>
          {leadId && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
                Status
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {["New", "In Progress", "Qualified", "Converted", "Lost"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Customer Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              Select Existing Client (Optional Prefill)
            </label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary font-medium"
              value={selectedClientId}
              onChange={(e) => handleClientSelect(e.target.value)}
            >
              <option value="">— Select Existing Client to Prefill (Optional) —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.clientCode ? `(${c.clientCode})` : ""}
                </option>
              ))}
            </select>
            {!selectedClientId && !leadId && (
              <div className="mt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                    checked={saveAsClient}
                    onChange={(e) => setSaveAsClient(e.target.checked)}
                  />
                  <span>Also save this new customer into Client Master</span>
                </label>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              Company Name *
            </label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Company / Organization Name"
              required
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              Contact Person
            </label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              value={form.contactPerson}
              onChange={(e) => set("contactPerson", e.target.value)}
              placeholder="Primary contact name"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              Role
            </label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              placeholder="e.g. Purchase Manager"
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              Mobile
            </label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              value={form.mobile}
              onChange={(e) => set("mobile", e.target.value)}
              maxLength={15}
              placeholder="+91..."
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              WhatsApp
            </label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              maxLength={15}
              placeholder="+91..."
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              Address
            </label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Street address..."
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              State
            </label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
            >
              <option value="">— Select State —</option>
              {form.state && !STATES.some((s) => s.toLowerCase() === form.state.toLowerCase()) && (
                <option value={form.state}>{form.state}</option>
              )}
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              City
            </label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
              Pincode
            </label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
              value={form.pincode}
              onChange={(e) => set("pincode", e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      {!leadId && (
        <SectionCard title="Products on this enquiry">
          <div className="flex flex-col gap-2">
            {lines.map((line, i) => (
              <div key={i} className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[160px]">
                  <label className="text-[10px] text-muted-foreground block mb-1 font-semibold">Product name</label>
                  <input
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                    value={line.productName}
                    placeholder="Product title"
                    onChange={(e) => {
                      const next = [...lines];
                      next[i] = { ...next[i], productName: e.target.value };
                      setLines(next);
                    }}
                  />
                </div>
                <div className="w-[120px]">
                  <label className="text-[10px] text-muted-foreground block mb-1 font-semibold">Code</label>
                  <input
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                    value={line.productCode}
                    placeholder="SKU / Code"
                    onChange={(e) => {
                      const next = [...lines];
                      next[i] = { ...next[i], productCode: e.target.value };
                      setLines(next);
                    }}
                  />
                </div>
                <div className="w-[150px]">
                  <label className="text-[10px] text-muted-foreground block mb-1 font-semibold">Department</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                    value={line.department}
                    onChange={(e) => {
                      const next = [...lines];
                      next[i] = { ...next[i], department: e.target.value };
                      setLines(next);
                    }}
                  >
                    <option value="">— Select Dept —</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-[90px]">
                  <label className="text-[10px] text-muted-foreground block mb-1 font-semibold">Qty</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                    value={line.qty}
                    onChange={(e) => {
                      const next = [...lines];
                      next[i] = { ...next[i], qty: Number(e.target.value) };
                      setLines(next);
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                  onClick={() => setLines(lines.filter((_, j) => j !== i))}
                  disabled={lines.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start mt-1 text-xs gap-1.5"
              onClick={() =>
                setLines([
                  ...lines,
                  { productName: "", productCode: "", qty: 1, department: "" },
                ])
              }
            >
              <Plus className="h-3.5 w-3.5" /> Add product line
            </Button>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Notes">
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground min-h-[72px]"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Meeting notes, requirements…"
        />
      </SectionCard>

      <div className="flex gap-2">
        <Button type="submit" disabled={busy} size="sm">
          {busy ? "Saving…" : leadId ? "Save changes" : "Create Lead"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
