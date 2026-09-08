export const GST_PLACEHOLDER = "22AAAAA0000A1Z5"
export const PAN_PLACEHOLDER = "ABCDE1234F"
export const TAN_PLACEHOLDER = "ABCD12345E"
export const CIN_PLACEHOLDER = "U12345MH2020PTC123456"

export function formatUpperAlnum(val: string, maxLen?: number): string {
  if (!val) return ""
  let formatted = val.toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (maxLen && formatted.length > maxLen) {
    formatted = formatted.slice(0, maxLen)
  }
  return formatted
}

export function validatePAN(pan: string): boolean {
  if (!pan) return true
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan)
}

export function validateTAN(tan: string): boolean {
  if (!tan) return true
  const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/
  return tanRegex.test(tan)
}

export function validateGST(gst: string): boolean {
  if (!gst) return true
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return gstRegex.test(gst)
}

export function validateCIN(cin: string): boolean {
  if (!cin) return true
  const cinRegex = /^([L|U]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6})$/
  return cinRegex.test(cin)
}
