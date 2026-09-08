export type LocationBilling = {
  city?: string
  level?: string
  billingName?: string
  gst?: string
  address?: string
  state?: string
  pincode?: string
  label?: string
}

export function parseLocationBilling(taxShippingInfo?: string | null): LocationBilling {
  if (!taxShippingInfo) {
    return {}
  }

  // Check if stringified JSON
  if (taxShippingInfo.trim().startsWith("{") && taxShippingInfo.trim().endsWith("}")) {
    try {
      const parsed = JSON.parse(taxShippingInfo)
      return {
        city: parsed.city || parsed.locationCity || "",
        level: parsed.level || parsed.siteLevel || "",
        billingName: parsed.billingName || parsed.legalName || "",
        gst: parsed.gst || parsed.gstin || "",
        address: parsed.address || parsed.billingAddress || "",
        state: parsed.state || "",
        pincode: parsed.pincode || "",
        label: parsed.label || "",
      }
    } catch {
      // Fall through to plain text parsing
    }
  }

  // Parse key-value formatted text if present (e.g. "GST: 27AAAAA0000A1Z5 | Level: State")
  const billing: LocationBilling = {}
  const parts = taxShippingInfo.split(/[|;·\n]/).map((s) => s.trim()).filter(Boolean)

  for (const part of parts) {
    const colonIdx = part.indexOf(":")
    if (colonIdx > -1) {
      const key = part.slice(0, colonIdx).trim().toLowerCase()
      const val = part.slice(colonIdx + 1).trim()
      if (key.includes("city")) billing.city = val
      else if (key.includes("level")) billing.level = val
      else if (key.includes("gst")) billing.gst = val
      else if (key.includes("billing") || key.includes("name")) billing.billingName = val
      else if (key.includes("state")) billing.state = val
      else if (key.includes("pincode")) billing.pincode = val
      else if (key.includes("address")) billing.address = val
    }
  }

  if (!Object.keys(billing).length) {
    billing.label = taxShippingInfo
  }

  return billing
}

export function formatLocationBillingLabel(billing?: LocationBilling | null): string {
  if (!billing) return "Billing Info Not Set"
  if (billing.label) return billing.label

  const tokens: string[] = []
  if (billing.billingName) tokens.push(billing.billingName)
  if (billing.gst) tokens.push(`GST: ${billing.gst}`)
  if (billing.city) tokens.push(`City: ${billing.city}`)
  if (billing.state) tokens.push(`State: ${billing.state}`)
  if (billing.level) tokens.push(`Level: ${billing.level}`)

  return tokens.length > 0 ? tokens.join(" · ") : "Billing Info Standard"
}
