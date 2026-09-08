"use client"

import React, { useEffect, useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  AlertTriangle,
  Loader2,
  Paperclip,
  Eye,
  X,
} from "lucide-react"
import {
  formatUpperAlnum,
  validateGST,
  validatePAN,
  validateTAN,
  validateCIN,
  GST_PLACEHOLDER,
  PAN_PLACEHOLDER,
  TAN_PLACEHOLDER,
  CIN_PLACEHOLDER,
} from "@/lib/validators"
import { clientsApi } from "@/modules/clients/lib/clients-api"
import { openCompanyDocument } from "@/modules/core/lib/media"
import {
  ClientLocation,
  ClientDetails,
  ClientDocumentFiles,
  ClientDocumentItem,
} from "@/modules/clients/types/client"

const docTypes = [
  { key: "panCard", label: "PAN Card" },
  { key: "gstCertificate", label: "GST Certificate" },
  { key: "cinIncorporation", label: "CIN / Incorporation" },
  { key: "msmeUdyam", label: "MSME / Udyam" },
  { key: "iecCertificate", label: "IEC Certificate" },
  { key: "cancelledCheque", label: "Cancelled Cheque" },
  { key: "agreementContract", label: "Agreement / Contract" },
  { key: "otherCompliance", label: "Other Compliance" },
] as const

function newLocation(isPrimary = false): ClientLocation {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
    name: isPrimary ? "Location 1" : "",
    locationName: isPrimary ? "Location 1" : "",
    level: isPrimary ? "Head Office" : "Plant / Branch",
    contact: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    billingMode: "global",
    billingName: "",
    billingGst: "",
    billingAddress: "",
    billingState: "",
    bankName: "",
    bankAccount: "",
    bankIfsc: "",
    bankHolder: "",
    isPrimary,
  }
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="text-[10px] text-muted-foreground uppercase block mb-1 font-bold tracking-wide">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  "w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs outline-none transition-colors focus:border-primary"

export function ClientForm({
  initial,
  id,
  onSuccess,
}: {
  initial?: Record<string, any>
  id?: string | number
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [details, setDetails] = useState<ClientDetails>({
    clientCode: String(initial?.clientCode ?? ""),
    tradeName: String(initial?.tradeName ?? ""),
    legalEntity: String(initial?.legalEntity ?? ""),
    incorporationDate: String(initial?.incorporationDate ?? ""),
    industry: String(initial?.industry ?? ""),
    nature: String(initial?.nature ?? ""),
    pan: String(initial?.pan ?? ""),
    tan: String(initial?.tan ?? ""),
    gst: String(initial?.gst ?? ""),
    cin: String(initial?.cin ?? ""),
    msme: String(initial?.msme ?? ""),
    iec: String(initial?.iec ?? ""),
    authSignatory: String(initial?.authSignatory ?? ""),
    hrManager: String(initial?.hrManager ?? ""),
    accountsContact: String(initial?.accountsContact ?? ""),
    complianceOfficer: String(initial?.complianceOfficer ?? ""),
    emergencyName: String(initial?.emergencyName ?? ""),
    emergencyCode: String(initial?.emergencyCode ?? "+91"),
    emergencyMobile: String(initial?.emergencyMobile ?? ""),
    registeredAddress: String(initial?.registeredAddress ?? ""),
    corporateAddress: String(initial?.corporateAddress ?? ""),
    factoryAddress: String(initial?.factoryAddress ?? ""),
    country: String(initial?.country ?? "India"),
    district: String(initial?.district ?? ""),
    billingName: String(initial?.billingName ?? ""),
    billingGst: String(initial?.billingGst ?? ""),
    billingState: String(initial?.billingState ?? ""),
    billingAddress: String(initial?.billingAddress ?? ""),
    bankName: String(initial?.bankName ?? ""),
    bankAccount: String(initial?.bankAccount ?? ""),
    bankIfsc: String(initial?.bankIfsc ?? ""),
    bankHolder: String(initial?.bankHolder ?? ""),
    documents: {},
  })

  const [form, setForm] = useState({
    name: String(initial?.name ?? ""),
    contact: String(initial?.contact ?? ""),
    email: String(initial?.email ?? ""),
    phone: String(initial?.phone ?? ""),
    address: String(initial?.address ?? ""),
    city: String(initial?.city ?? ""),
    state: String(initial?.state ?? ""),
    pincode: String(initial?.pincode ?? ""),
    pendingPayment: initial?.pendingPayment != null ? Number(initial.pendingPayment) : 0,
    notes: String(initial?.notes ?? ""),
  })

  const [locations, setLocations] = useState<ClientLocation[]>(
    initial?.locations && Array.isArray(initial.locations) && initial.locations.length > 0
      ? initial.locations.map((loc: any, idx: number) => ({
          ...newLocation(idx === 0),
          ...loc,
          name: loc.locationName || loc.name || `Location ${idx + 1}`,
          locationName: loc.locationName || loc.name || `Location ${idx + 1}`,
          isPrimary: idx === 0 ? true : Boolean(loc.isPrimary),
        }))
      : [newLocation(true)]
  )

  const [documentFiles, setDocumentFiles] = useState<ClientDocumentFiles>({
    panCard: null,
    gstCertificate: null,
    cinIncorporation: null,
    msmeUdyam: null,
    iecCertificate: null,
    cancelledCheque: null,
    agreementContract: null,
    otherCompliance: null,
  })

  const tabs = [
    { label: "Basic Info", icon: Building2 },
    { label: "Billing", icon: CreditCard },
    { label: "Dispatch Locations", icon: MapPin },
    { label: "Documents", icon: FileText },
  ]

  function updateDetails(patch: Partial<ClientDetails>) {
    setDetails((current) => ({ ...current, ...patch }))
  }

  function updateLocation(locId: string | number, patch: Partial<ClientLocation>) {
    setLocations((rows) =>
      rows.map((loc) => (loc.id === locId ? { ...loc, ...patch } : loc))
    )
  }

  function removeLocation(locId: string | number) {
    setLocations((rows) => {
      const next = rows.filter((loc) => loc.id !== locId)
      return next.length > 0 ? next : [newLocation(true)]
    })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim()) {
      setError("Client name required")
      return
    }
    if (details.pan && !validatePAN(details.pan)) {
      setError(`Invalid PAN number. Format: ${PAN_PLACEHOLDER}`)
      return
    }
    if (details.tan && !validateTAN(details.tan)) {
      setError(`Invalid TAN number. Format: ${TAN_PLACEHOLDER}`)
      return
    }
    if (details.gst && !validateGST(details.gst)) {
      setError(`Invalid GST number. Format: ${GST_PLACEHOLDER}`)
      return
    }
    if (details.cin && !validateCIN(details.cin)) {
      setError(`Invalid CIN. Format: ${CIN_PLACEHOLDER}`)
      return
    }
    if (details.billingGst && !validateGST(details.billingGst)) {
      setError(`Invalid Billing GSTIN. Format: ${GST_PLACEHOLDER}`)
      return
    }
    for (const loc of locations) {
      if (loc.billingMode === "custom" && loc.billingGst && !validateGST(loc.billingGst)) {
        setError(`Invalid Billing GSTIN for dispatch location "${loc.locationName || loc.name || "Unnamed"}". Format: ${GST_PLACEHOLDER}`)
        return
      }
    }

    const cleanedLocations = locations.map((loc, index) => {
      const locName = (loc.locationName || loc.name || "").trim() || `Location ${index + 1}`
      const isNumericId =
        typeof loc.id === "number" || (typeof loc.id === "string" && /^\d+$/.test(loc.id))

      return {
        ...(isNumericId ? { id: Number(loc.id) } : {}),
        locationName: locName,
        level: loc.level ? String(loc.level).trim() : undefined,
        contactPerson: loc.contactPerson || loc.contact ? String(loc.contactPerson || loc.contact).trim() : undefined,
        phone: loc.phone ? String(loc.phone).trim() : undefined,
        deliveryAddress: loc.deliveryAddress || loc.address ? String(loc.deliveryAddress || loc.address).trim() : undefined,
        city: loc.city ? String(loc.city).trim() : undefined,
        state: loc.state ? String(loc.state).trim() : undefined,
        pincode: loc.pincode ? String(loc.pincode).trim() : undefined,
        country: loc.country ? String(loc.country).trim() : undefined,
        dispatchInstruction: loc.dispatchInstruction ? String(loc.dispatchInstruction).trim() : undefined,
        transportTerms: loc.transportTerms ? String(loc.transportTerms).trim() : undefined,
        taxShippingInfo: loc.taxShippingInfo ? String(loc.taxShippingInfo).trim() : undefined,
        billingMode: loc.billingMode ? String(loc.billingMode).trim() : undefined,
        billingName: loc.billingName ? String(loc.billingName).trim() : undefined,
        billingGst: loc.billingGst ? String(loc.billingGst).trim() : undefined,
        billingAddress: loc.billingAddress ? String(loc.billingAddress).trim() : undefined,
        billingState: loc.billingState ? String(loc.billingState).trim() : undefined,
        bankName: loc.bankName ? String(loc.bankName).trim() : undefined,
        bankAccount: loc.bankAccount ? String(loc.bankAccount).trim() : undefined,
        bankIfsc: loc.bankIfsc ? String(loc.bankIfsc).trim() : undefined,
        bankHolder: loc.bankHolder ? String(loc.bankHolder).trim() : undefined,
        isPrimary: index === 0 ? true : Boolean(loc.isPrimary),
      }
    })

    setBusy(true)
    try {
      const payload: any = {
        clientCode: details.clientCode.trim(),
        name: form.name.trim(),
        tradeName: details.tradeName.trim() || undefined,
        legalEntity: details.legalEntity.trim() || undefined,
        incorporationDate: details.incorporationDate.trim() || undefined,
        industry: details.industry.trim() || undefined,
        nature: details.nature.trim() || undefined,
        pan: details.pan.trim() || undefined,
        tan: details.tan.trim() || undefined,
        gst: details.gst.trim() || undefined,
        cin: details.cin.trim() || undefined,
        msme: details.msme.trim() || undefined,
        iec: details.iec.trim() || undefined,
        authSignatory: details.authSignatory.trim() || undefined,
        hrManager: details.hrManager.trim() || undefined,
        accountsContact: details.accountsContact.trim() || undefined,
        complianceOfficer: details.complianceOfficer.trim() || undefined,
        contact: form.contact.trim() || undefined,
        phone: form.phone ? String(form.phone).trim() : undefined,
        email: form.email.trim() || undefined,
        pendingPayment: form.pendingPayment != null ? Number(form.pendingPayment) : 0,
        emergencyName: details.emergencyName.trim() || undefined,
        emergencyCode: details.emergencyCode ? String(details.emergencyCode).trim() : "+91",
        emergencyMobile: details.emergencyMobile ? String(details.emergencyMobile).trim() : undefined,
        registeredAddress: details.registeredAddress.trim() || undefined,
        corporateAddress: details.corporateAddress.trim() || undefined,
        factoryAddress: details.factoryAddress.trim() || undefined,
        address: form.address.trim() || undefined,
        country: details.country.trim() || "India",
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        district: details.district.trim() || undefined,
        pincode: form.pincode ? String(form.pincode).trim() : undefined,
        billingName: details.billingName.trim() || undefined,
        billingGst: details.billingGst.trim() || undefined,
        billingState: details.billingState.trim() || undefined,
        billingAddress: details.billingAddress.trim() || undefined,
        bankName: details.bankName.trim() || undefined,
        bankAccount: details.bankAccount ? String(details.bankAccount).trim() : undefined,
        bankIfsc: details.bankIfsc.trim() || undefined,
        bankHolder: details.bankHolder.trim() || undefined,
        notes: form.notes.trim() || undefined,
        locations: cleanedLocations,
      }

      if (id) {
        await clientsApi.updateClient(id, payload, documentFiles)
      } else {
        await clientsApi.createClient(payload, documentFiles)
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/clients")
        router.refresh()
      }
    } catch (err: any) {
      if (err?.response?.data?.errors) {
        const errObj = err.response.data.errors
        const messages = Object.entries(errObj)
          .map(([field, errs]) => `${field}: ${(errs as string[]).join(", ")}`)
          .join(" | ")
        setError(messages || err.message || "Validation failed.")
      } else {
        setError(err.message || "Save failed. Please check form inputs.")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border border-border/80 shadow-md">
      <div className="p-4 border-b border-border/60">
        <h3 className="font-bold text-sm text-foreground">
          {id ? "Client Master — Edit Registration" : "Client Master — New Registration"}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          ESI Compliance Management System — Comprehensive Client Registration
        </p>
      </div>

      <form onSubmit={onSubmit} className="p-4 space-y-4">
        {error && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold animate-in fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Navigation Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto border border-border/60 rounded-xl bg-muted/30 p-1">
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const active = activeTab === index
            const complete =
              (index === 0 && Boolean(form.name.trim())) ||
              (index === 1 && Boolean(details.billingName || details.billingGst)) ||
              (index === 2 && locations.some((loc) => loc.name || loc.address)) ||
              (index === 3 && Object.values(documentFiles).some(Boolean))
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveTab(index)}
                className={`flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    active
                      ? "bg-primary-foreground text-primary"
                      : complete
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* TAB 0: BASIC INFO */}
        {activeTab === 0 && (
          <div className="space-y-4">
            {/* Section 1: Company Details */}
            <section className="border border-border/60 rounded-xl p-4 bg-card space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <Building2 className="h-4 w-4 text-primary" />
                <div>
                  <h4 className="font-bold text-xs text-foreground">Company Details</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Primary client record used by sales, production, inventory, and billing.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Client Code *">
                  <input
                    className={`${inputClass} font-mono font-bold`}
                    value={details.clientCode}
                    onChange={(e) => updateDetails({ clientCode: e.target.value })}
                    placeholder="e.g. 333"
                  />
                  <div className="text-[10px] text-muted-foreground mt-1">Used in order IDs: ORD-CODE-26-0001</div>
                </Field>

                <Field label="Trade Name">
                  <input
                    className={inputClass}
                    value={details.tradeName}
                    onChange={(e) => updateDetails({ tradeName: e.target.value })}
                    placeholder="Trading / brand name"
                  />
                </Field>

                <Field label="Legal Entity Type">
                  <select
                    className={inputClass}
                    value={details.legalEntity}
                    onChange={(e) => updateDetails({ legalEntity: e.target.value })}
                  >
                    <option value="">— Select —</option>
                    {[
                      "Proprietorship",
                      "Partnership",
                      "Private Limited Company",
                      "Public Limited Company",
                      "LLP",
                      "Trust",
                      "Society",
                      "Other",
                    ].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Client / Customer Name *" className="md:col-span-2">
                  <input
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Tata Motors Ltd"
                    required
                  />
                </Field>

                <Field label="Date of Incorporation">
                  <input
                    type="date"
                    className={inputClass}
                    value={details.incorporationDate}
                    onChange={(e) => updateDetails({ incorporationDate: e.target.value })}
                  />
                </Field>

                <Field label="Industry Type">
                  <select
                    className={inputClass}
                    value={details.industry}
                    onChange={(e) => updateDetails({ industry: e.target.value })}
                  >
                    <option value="">— Select —</option>
                    {[
                      "Automobile / Auto Components",
                      "Rubber / Tyre Manufacturing",
                      "Textile / Garments",
                      "Manufacturing",
                      "Logistics / Transport",
                      "Information Technology",
                      "Construction",
                      "Food Processing",
                      "Healthcare",
                      "Retail / Trading",
                      "Education",
                      "Finance / Banking",
                      "Hospitality",
                      "Export / Import",
                      "Pharmaceuticals",
                      "Other",
                    ].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Nature of Business" className="md:col-span-3">
                  <textarea
                    className={`${inputClass} min-h-[68px]`}
                    value={details.nature}
                    onChange={(e) => updateDetails({ nature: e.target.value })}
                    placeholder="Describe primary business activities, products / services offered..."
                  />
                </Field>
              </div>
            </section>

            {/* Section 2: Registration & Tax Numbers */}
            <section className="border border-border/60 rounded-xl p-4 bg-card space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <FileText className="h-4 w-4 text-primary" />
                <div>
                  <h4 className="font-bold text-xs text-foreground">Registration & Tax Numbers</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Tax and statutory identifiers used for invoices, exports, and compliance.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="PAN Number">
                  <input
                    className={inputClass}
                    value={details.pan}
                    onChange={(e) => updateDetails({ pan: formatUpperAlnum(e.target.value, 10) })}
                    maxLength={10}
                    placeholder={PAN_PLACEHOLDER}
                  />
                </Field>
                <Field label="TAN Number">
                  <input
                    className={inputClass}
                    value={details.tan}
                    onChange={(e) => updateDetails({ tan: formatUpperAlnum(e.target.value, 10) })}
                    maxLength={10}
                    placeholder={TAN_PLACEHOLDER}
                  />
                </Field>
                <Field label="GST Number">
                  <input
                    className={inputClass}
                    value={details.gst}
                    onChange={(e) => updateDetails({ gst: formatUpperAlnum(e.target.value, 15) })}
                    maxLength={15}
                    placeholder={GST_PLACEHOLDER}
                  />
                </Field>
                <Field label="CIN Number">
                  <input
                    className={inputClass}
                    value={details.cin}
                    onChange={(e) => updateDetails({ cin: formatUpperAlnum(e.target.value, 21) })}
                    maxLength={21}
                    placeholder={CIN_PLACEHOLDER}
                  />
                </Field>
                <Field label="MSME Registration Number">
                  <input
                    className={inputClass}
                    value={details.msme}
                    onChange={(e) => updateDetails({ msme: e.target.value })}
                    placeholder="UDYAM-XX-00-0000000"
                  />
                </Field>
                <Field label="IEC Code">
                  <input
                    className={inputClass}
                    value={details.iec}
                    onChange={(e) => updateDetails({ iec: e.target.value })}
                    maxLength={10}
                    placeholder="10-digit IEC"
                  />
                </Field>
              </div>
            </section>

            {/* Section 3: Contact Information */}
            <section className="border border-border/60 rounded-xl p-4 bg-card space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <UserRound className="h-4 w-4 text-primary" />
                <div>
                  <h4 className="font-bold text-xs text-foreground">Contact Information</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Operational contacts used by production, billing, compliance, and dispatch.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Authorized Signatory Name">
                  <input
                    className={inputClass}
                    value={details.authSignatory}
                    onChange={(e) => updateDetails({ authSignatory: e.target.value })}
                  />
                </Field>
                <Field label="HR Manager Name">
                  <input
                    className={inputClass}
                    value={details.hrManager}
                    onChange={(e) => updateDetails({ hrManager: e.target.value })}
                  />
                </Field>
                <Field label="Accounts Contact">
                  <input
                    className={inputClass}
                    value={details.accountsContact}
                    onChange={(e) => updateDetails({ accountsContact: e.target.value })}
                  />
                </Field>
                <Field label="Compliance Officer">
                  <input
                    className={inputClass}
                    value={details.complianceOfficer}
                    onChange={(e) => updateDetails({ complianceOfficer: e.target.value })}
                  />
                </Field>
                <Field label="Contact Person">
                  <input
                    className={inputClass}
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    placeholder="e.g. Purchase Manager"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    className={inputClass}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. +91 98xxx xxxxx"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. accounts@company.com"
                  />
                </Field>
                <Field label="Opening Pending Payment (₹)">
                  <input
                    type="number"
                    className={inputClass}
                    value={form.pendingPayment}
                    onChange={(e) => setForm({ ...form, pendingPayment: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Emergency Contact Name">
                  <input
                    className={inputClass}
                    value={details.emergencyName}
                    onChange={(e) => updateDetails({ emergencyName: e.target.value })}
                  />
                </Field>
                <Field label="Emergency Mobile">
                  <div className="grid grid-cols-[72px_1fr] gap-2">
                    <input
                      className={inputClass}
                      value={details.emergencyCode}
                      onChange={(e) => updateDetails({ emergencyCode: e.target.value })}
                      maxLength={4}
                    />
                    <input
                      className={inputClass}
                      value={details.emergencyMobile}
                      onChange={(e) => updateDetails({ emergencyMobile: e.target.value })}
                      placeholder="98765 43210"
                    />
                  </div>
                </Field>
              </div>
            </section>
          </div>
        )}

        {/* TAB 1: BILLING & ADDRESSES */}
        {activeTab === 1 && (
          <div className="space-y-4">
            {/* Section 1: Office Addresses */}
            <section className="border border-border/60 rounded-xl p-4 bg-card space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <h4 className="font-bold text-xs text-foreground">Office Addresses</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Registered office, corporate office, and factory or plant addresses.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Registered Office Address" className="md:col-span-2">
                  <textarea
                    className={`${inputClass} min-h-[60px]`}
                    value={details.registeredAddress}
                    onChange={(e) => updateDetails({ registeredAddress: e.target.value })}
                    placeholder="Full address as per ROC records..."
                  />
                </Field>
                <Field label="Corporate / HO Address" className="md:col-span-2">
                  <textarea
                    className={`${inputClass} min-h-[60px]`}
                    value={details.corporateAddress}
                    onChange={(e) => updateDetails({ corporateAddress: e.target.value })}
                    placeholder="Corporate office address if different..."
                  />
                </Field>
                <Field label="Factory / Plant Address" className="md:col-span-2">
                  <textarea
                    className={`${inputClass} min-h-[60px]`}
                    value={details.factoryAddress}
                    onChange={(e) => updateDetails({ factoryAddress: e.target.value })}
                    placeholder="Manufacturing / plant address..."
                  />
                </Field>
                <Field label="Street / Address" className="md:col-span-2">
                  <input
                    className={inputClass}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Street, industrial area, landmark"
                  />
                </Field>
                <Field label="Country">
                  <select
                    className={inputClass}
                    value={details.country}
                    onChange={(e) => updateDetails({ country: e.target.value })}
                  >
                    {[
                      "India",
                      "United States",
                      "United Kingdom",
                      "United Arab Emirates",
                      "Germany",
                      "China",
                      "Bangladesh",
                      "Sri Lanka",
                      "Nepal",
                      "Singapore",
                      "Japan",
                      "South Korea",
                      "Other",
                    ].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="City">
                  <input
                    className={inputClass}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </Field>
                <Field label="State">
                  <input
                    className={inputClass}
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />
                </Field>
                <Field label="District">
                  <input
                    className={inputClass}
                    value={details.district}
                    onChange={(e) => updateDetails({ district: e.target.value })}
                  />
                </Field>
                <Field label="PIN Code">
                  <input
                    className={inputClass}
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  />
                </Field>
              </div>
            </section>

            {/* Section 2: Global Billing Details */}
            <section className="border border-border/60 rounded-xl p-4 bg-card space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <CreditCard className="h-4 w-4 text-primary" />
                <div>
                  <h4 className="font-bold text-xs text-foreground">Global Billing Details</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Default invoicing details. Dispatch locations can reuse these or set their own.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Billing Name">
                  <input
                    className={inputClass}
                    value={details.billingName}
                    onChange={(e) => updateDetails({ billingName: e.target.value })}
                    placeholder="Legal name for invoices"
                  />
                </Field>
                <Field label="Billing GSTIN">
                  <input
                    className={inputClass}
                    value={details.billingGst}
                    onChange={(e) => updateDetails({ billingGst: formatUpperAlnum(e.target.value, 15) })}
                    maxLength={15}
                    placeholder={GST_PLACEHOLDER}
                  />
                </Field>
                <Field label="Billing State">
                  <input
                    className={inputClass}
                    value={details.billingState}
                    onChange={(e) => updateDetails({ billingState: e.target.value })}
                    placeholder="Place of supply"
                  />
                </Field>
                <Field label="Bank Name">
                  <input
                    className={inputClass}
                    value={details.bankName}
                    onChange={(e) => updateDetails({ bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank"
                  />
                </Field>
                <Field label="Account Number">
                  <input
                    className={inputClass}
                    value={details.bankAccount}
                    onChange={(e) => updateDetails({ bankAccount: e.target.value })}
                  />
                </Field>
                <Field label="IFSC / SWIFT">
                  <input
                    className={inputClass}
                    value={details.bankIfsc}
                    onChange={(e) => updateDetails({ bankIfsc: e.target.value.toUpperCase() })}
                    placeholder="HDFC0001234"
                  />
                </Field>
                <Field label="Account Holder Name" className="md:col-span-3">
                  <input
                    className={inputClass}
                    value={details.bankHolder}
                    onChange={(e) => updateDetails({ bankHolder: e.target.value })}
                  />
                </Field>
                <Field label="Billing Address" className="md:col-span-3">
                  <textarea
                    className={`${inputClass} min-h-[60px]`}
                    value={details.billingAddress}
                    onChange={(e) => updateDetails({ billingAddress: e.target.value })}
                    placeholder="Address printed on invoices..."
                  />
                </Field>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: DISPATCH LOCATIONS */}
        {activeTab === 2 && (
          <section className="border border-border/60 rounded-xl p-4 bg-card space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <h4 className="font-bold text-xs text-foreground">Dispatch Locations</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Add one or more locations. Orders can split dispatch inside this client.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLocations([...locations, newLocation(false)])}
                className="gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Location
              </Button>
            </div>

            {/* Hierarchy Preview */}
            <div className="border border-border/60 rounded-lg bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold mb-1.5">
                Hierarchy Preview
              </div>
              {locations.some((loc) => loc.name || loc.locationName) ? (
                locations.map((loc, index) => (
                  <div key={loc.id || index} className="py-0.5" style={{ paddingLeft: `${Math.min(index, 3) * 14}px` }}>
                    <span className="font-bold text-foreground">{loc.name || loc.locationName || `Location ${index + 1}`}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {loc.level || "Location"} · {loc.city || loc.state || "—"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground italic">No locations added yet.</div>
              )}
            </div>

            {/* Repeatable Locations List */}
            <div className="space-y-4">
              {locations.map((loc, index) => (
                <div key={loc.id || index} className="border border-border/80 rounded-xl p-4 bg-card/60 space-y-3">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-foreground">Location #{index + 1}</span>
                      {index === 0 && <Badge variant="info">Primary</Badge>}
                    </div>
                    {locations.length > 1 && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 hover:underline"
                        onClick={() => loc.id && removeLocation(loc.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Field label="Location Level">
                      <select
                        className={inputClass}
                        value={loc.level || "Plant / Branch"}
                        onChange={(e) => loc.id && updateLocation(loc.id, { level: e.target.value })}
                      >
                        {["Head Office", "Region", "Plant / Branch", "Sub-site", "Warehouse"].map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Dispatch Location">
                      <input
                        className={inputClass}
                        value={loc.name || loc.locationName || ""}
                        onChange={(e) =>
                          loc.id && updateLocation(loc.id, { name: e.target.value, locationName: e.target.value })
                        }
                        placeholder="e.g. Pune Plant 1"
                      />
                    </Field>
                    <Field label="Contact Person">
                      <input
                        className={inputClass}
                        value={loc.contact || loc.contactPerson || ""}
                        onChange={(e) =>
                          loc.id && updateLocation(loc.id, { contact: e.target.value, contactPerson: e.target.value })
                        }
                        placeholder="Store / dispatch person"
                      />
                    </Field>
                    <Field label="Phone">
                      <input
                        className={inputClass}
                        value={loc.phone || ""}
                        onChange={(e) => loc.id && updateLocation(loc.id, { phone: e.target.value })}
                      />
                    </Field>
                    <Field label="Address">
                      <input
                        className={inputClass}
                        value={loc.address || loc.deliveryAddress || ""}
                        onChange={(e) =>
                          loc.id && updateLocation(loc.id, { address: e.target.value, deliveryAddress: e.target.value })
                        }
                        placeholder="Street, City, PIN"
                      />
                    </Field>
                    <Field label="City">
                      <input
                        className={inputClass}
                        value={loc.city || ""}
                        onChange={(e) => loc.id && updateLocation(loc.id, { city: e.target.value })}
                      />
                    </Field>
                    <Field label="State">
                      <input
                        className={inputClass}
                        value={loc.state || ""}
                        onChange={(e) => loc.id && updateLocation(loc.id, { state: e.target.value })}
                      />
                    </Field>
                    <Field label="PIN Code">
                      <input
                        className={inputClass}
                        value={loc.pincode || ""}
                        onChange={(e) => loc.id && updateLocation(loc.id, { pincode: e.target.value })}
                      />
                    </Field>
                    <Field label="Country">
                      <input
                        className={inputClass}
                        value={loc.country || "India"}
                        onChange={(e) => loc.id && updateLocation(loc.id, { country: e.target.value })}
                      />
                    </Field>

                    {/* Billing Mode Switcher */}
                    <div className="md:col-span-4 border-t border-border/50 pt-3 mt-1">
                      <Field label="Billing Mode">
                        <select
                          className={inputClass}
                          value={loc.billingMode || "global"}
                          onChange={(e) =>
                            loc.id &&
                            updateLocation(loc.id, {
                              billingMode: e.target.value as "global" | "custom",
                            })
                          }
                        >
                          <option value="global">Use global billing</option>
                          <option value="custom">Custom billing for this location</option>
                        </select>
                      </Field>

                      {/* Mode A: Global Billing (Read-Only) */}
                      {loc.billingMode === "global" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                          <Field label="Billing Name">
                            <input className={`${inputClass} bg-muted/40 cursor-not-allowed`} value={details.billingName || ""} readOnly disabled />
                          </Field>
                          <Field label="Billing GSTIN">
                            <input className={`${inputClass} bg-muted/40 cursor-not-allowed`} value={details.billingGst || ""} readOnly disabled />
                          </Field>
                          <Field label="Billing State">
                            <input className={`${inputClass} bg-muted/40 cursor-not-allowed`} value={details.billingState || ""} readOnly disabled />
                          </Field>
                          <Field label="Bank Name">
                            <input className={`${inputClass} bg-muted/40 cursor-not-allowed`} value={details.bankName || ""} readOnly disabled />
                          </Field>
                          <Field label="Account Number">
                            <input className={`${inputClass} bg-muted/40 cursor-not-allowed`} value={details.bankAccount || ""} readOnly disabled />
                          </Field>
                          <Field label="IFSC / SWIFT">
                            <input className={`${inputClass} bg-muted/40 cursor-not-allowed`} value={details.bankIfsc || ""} readOnly disabled />
                          </Field>
                          <Field label="Account Holder Name" className="md:col-span-3">
                            <input className={`${inputClass} bg-muted/40 cursor-not-allowed`} value={details.bankHolder || ""} readOnly disabled />
                          </Field>
                          <Field label="Billing Address" className="md:col-span-3">
                            <textarea className={`${inputClass} bg-muted/40 cursor-not-allowed min-h-[50px]`} value={details.billingAddress || ""} readOnly disabled />
                          </Field>
                        </div>
                      )}

                      {/* Mode B: Custom Billing (Editable) */}
                      {loc.billingMode === "custom" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                          <Field label="Billing Name">
                            <input
                              className={inputClass}
                              value={loc.billingName || ""}
                              onChange={(e) => loc.id && updateLocation(loc.id, { billingName: e.target.value })}
                              placeholder="Custom billing name"
                            />
                          </Field>
                          <Field label="Billing GSTIN">
                            <input
                              className={inputClass}
                              value={loc.billingGst || ""}
                              onChange={(e) =>
                                loc.id && updateLocation(loc.id, { billingGst: formatUpperAlnum(e.target.value, 15) })
                              }
                              maxLength={15}
                              placeholder={GST_PLACEHOLDER}
                            />
                          </Field>
                          <Field label="Billing State">
                            <input
                              className={inputClass}
                              value={loc.billingState || ""}
                              onChange={(e) => loc.id && updateLocation(loc.id, { billingState: e.target.value })}
                              placeholder="Billing state"
                            />
                          </Field>
                          <Field label="Bank Name">
                            <input
                              className={inputClass}
                              value={loc.bankName || ""}
                              onChange={(e) => loc.id && updateLocation(loc.id, { bankName: e.target.value })}
                              placeholder="Bank name"
                            />
                          </Field>
                          <Field label="Account Number">
                            <input
                              className={inputClass}
                              value={loc.bankAccount || ""}
                              onChange={(e) => loc.id && updateLocation(loc.id, { bankAccount: e.target.value })}
                              placeholder="Account number"
                            />
                          </Field>
                          <Field label="IFSC / SWIFT">
                            <input
                              className={inputClass}
                              value={loc.bankIfsc || ""}
                              onChange={(e) => loc.id && updateLocation(loc.id, { bankIfsc: e.target.value.toUpperCase() })}
                              placeholder="IFSC code"
                            />
                          </Field>
                          <Field label="Account Holder Name" className="md:col-span-3">
                            <input
                              className={inputClass}
                              value={loc.bankHolder || ""}
                              onChange={(e) => loc.id && updateLocation(loc.id, { bankHolder: e.target.value })}
                              placeholder="Account holder name"
                            />
                          </Field>
                          <Field label="Billing Address" className="md:col-span-3">
                            <textarea
                              className={`${inputClass} min-h-[50px]`}
                              value={loc.billingAddress || ""}
                              onChange={(e) => loc.id && updateLocation(loc.id, { billingAddress: e.target.value })}
                              placeholder="Custom billing address"
                            />
                          </Field>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: DOCUMENTS & NOTES */}
        {activeTab === 3 && (
          <div className="space-y-4">
            {/* Section 1: Upload Compliance Documents */}
            <section className="border border-border/60 rounded-xl p-4 bg-card space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <FileText className="h-4 w-4 text-primary" />
                <div>
                  <h4 className="font-bold text-xs text-foreground">Upload Compliance Documents</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Attach PDF/JPG/PNG copies — stored centrally and linked to this client.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docTypes.map((doc) => {
                  const existingDoc = (details.documents?.[doc.key] || initial?.documents?.[doc.key] || initial?.[doc.key]) as ClientDocumentItem | null | undefined
                  const newFile = documentFiles[doc.key]

                  return (
                    <div key={doc.key} className="border border-border/60 rounded-xl bg-card p-3 space-y-2.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs text-foreground">{doc.label}</div>
                        {existingDoc && existingDoc.file_name && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
                            Uploaded
                          </Badge>
                        )}
                      </div>

                      {/* Current file display if uploaded */}
                      {existingDoc && existingDoc.file_name ? (
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
                          <div className="flex items-center gap-2 overflow-hidden pr-1">
                            <FileText className="h-4 w-4 shrink-0 text-primary" />
                            <div className="truncate">
                              <span className="font-bold text-foreground truncate block text-xs">{existingDoc.file_name}</span>
                              {existingDoc.size ? (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {(existingDoc.size / 1024).toFixed(0)} KB
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => openCompanyDocument(String(existingDoc.id || existingDoc.url || ""))}
                            className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground italic px-1">No document uploaded yet.</div>
                      )}

                      {/* New file selected preview */}
                      {newFile && (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-semibold truncate">{newFile.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDocumentFiles((prev) => ({ ...prev, [doc.key]: null }))}
                            className="p-0.5 rounded text-blue-600 hover:bg-blue-500/20"
                            title="Remove selected file"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Browse / replace input */}
                      <div className="relative flex items-center justify-between rounded-lg border border-dashed border-border/80 bg-background px-3 py-2 text-xs">
                        <span className="text-muted-foreground text-[11px]">
                          {existingDoc && existingDoc.file_name ? "Choose file to replace..." : "Choose file..."}
                        </span>
                        <label className="shrink-0 cursor-pointer rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
                          Browse
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null
                              setDocumentFiles((prev) => ({ ...prev, [doc.key]: file }))
                            }}
                          />
                        </label>
                      </div>

                      {existingDoc && existingDoc.file_name && (
                        <div className="text-[10px] text-muted-foreground italic px-1">
                          Uploading a new file will replace the existing document.
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Section 2: Internal Notes */}
            <section className="border border-border/60 rounded-xl p-4 bg-card space-y-3">
              <div className="border-b border-border/50 pb-2">
                <h4 className="font-bold text-xs text-foreground">Internal Notes</h4>
                <p className="text-[11px] text-muted-foreground">
                  Commercial or operational notes that should stay on the client profile.
                </p>
              </div>
              <textarea
                className={`${inputClass} min-h-[72px]`}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Payment terms, preferred dispatch window, packaging requirements..."
              />
            </section>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/60">
          <div className="text-xs text-muted-foreground">
            Step {activeTab + 1} of {tabs.length}
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTab > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab(activeTab - 1)}>
                Prev
              </Button>
            )}
            {activeTab < tabs.length - 1 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab(activeTab + 1)}>
                Next
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => (onSuccess ? onSuccess() : router.back())}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" disabled={busy} className="min-w-[120px]">
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              {busy ? "Saving..." : id ? "Update Client" : "Register Client"}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}
