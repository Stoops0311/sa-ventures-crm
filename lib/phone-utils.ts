/**
 * Phone number validation for WhatsApp + SMS messaging.
 *
 * WhatsApp API: strips non-digits, needs country code + 7-15 digits total.
 * SMS API: passes through as-is, expects +{countrycode}{number} format.
 *
 * For Indian numbers (primary market), the expected format is:
 * - 91XXXXXXXXXX (12 digits: country code 91 + 10-digit mobile)
 *
 * Two modes:
 * - Form validation (lenient): accepts 10-digit Indian numbers, auto-normalizes to 91 prefix
 * - Messaging validation (strict): requires the stored number to already have country code
 */

export interface PhoneValidationResult {
  isValid: boolean
  normalized: string // digits-only, with country code
  smsFormat: string // +countrycode format for SMS
  issues: string[]
  suggestion: string // human-readable suggestion
}

/**
 * Validate a phone number for form input. Lenient — accepts 10-digit Indian
 * numbers and normalizes them. Used by add-lead forms.
 */
export function validatePhone(raw: string): PhoneValidationResult {
  const digitsOnly = raw.replace(/\D/g, "")
  const issues: string[] = []

  if (!digitsOnly) {
    return {
      isValid: false,
      normalized: "",
      smsFormat: "",
      issues: ["Phone number is empty"],
      suggestion: "Enter a phone number, e.g. 9876543210 or 919876543210",
    }
  }

  let normalized = digitsOnly

  // 10-digit Indian mobile (starts with 6/7/8/9) — auto-prepend 91
  if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
    normalized = "91" + digitsOnly
  }

  // Starts with 0 — strip it, then try to normalize
  if (digitsOnly.startsWith("0")) {
    const withoutZero = digitsOnly.slice(1)
    if (withoutZero.length === 10 && /^[6-9]/.test(withoutZero)) {
      normalized = "91" + withoutZero
    } else {
      issues.push("Starts with 0 (local format). Remove the leading 0 and add country code")
    }
  }

  // 91 + 0 + 10 digits (common mistake: 910XXXXXXXXXX)
  if (digitsOnly.startsWith("910") && digitsOnly.length === 13) {
    normalized = "91" + digitsOnly.slice(3)
  }

  // Too short after normalization
  if (normalized.length < 7) {
    issues.push(`Too short (${normalized.length} digits, minimum 7)`)
  }

  // Too long
  if (normalized.length > 15) {
    issues.push(`Too long (${normalized.length} digits, maximum 15)`)
  }

  // Indian format sanity check
  if (normalized.startsWith("91") && normalized.length !== 12) {
    if (normalized.length < 12) {
      issues.push(`Starts with 91 but only ${normalized.length} digits (expected 12 for Indian number)`)
    }
    // > 12 and <= 15 could be non-Indian, allow it
  }

  const isValid = issues.length === 0 && normalized.length >= 7 && normalized.length <= 15
  const smsFormat = normalized ? `+${normalized}` : ""

  let suggestion = ""
  if (!isValid) {
    suggestion = "Expected format: 9876543210 (10 digits) or 919876543210 (with country code)"
  }

  return { isValid, normalized, smsFormat, issues, suggestion }
}

/**
 * Validate a phone number that's already stored in the database.
 * Strict — the stored number must already have a country code for messaging to work.
 * Returns issues if it doesn't, with auto-fix suggestions.
 */
export function validateStoredPhone(raw: string): PhoneValidationResult {
  const digitsOnly = raw.replace(/\D/g, "")
  const issues: string[] = []

  if (!digitsOnly) {
    return {
      isValid: false,
      normalized: "",
      smsFormat: "",
      issues: ["Phone number is empty"],
      suggestion: "Enter a phone number with country code, e.g. 919876543210",
    }
  }

  let normalized = digitsOnly

  // 10-digit Indian number without country code — flag it
  if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
    issues.push("Missing country code (looks like an Indian 10-digit number without 91 prefix)")
    normalized = "91" + digitsOnly
  }

  // Starts with 0
  if (digitsOnly.startsWith("0")) {
    const withoutZero = digitsOnly.slice(1)
    if (withoutZero.length === 10 && /^[6-9]/.test(withoutZero)) {
      issues.push("Has a leading 0 instead of country code 91")
      normalized = "91" + withoutZero
    } else {
      issues.push("Starts with 0 (local format). Needs country code")
    }
  }

  // 910XXXXXXXXXX
  if (digitsOnly.startsWith("910") && digitsOnly.length === 13) {
    issues.push("Has country code 91 but includes a leading 0 after it")
    normalized = "91" + digitsOnly.slice(3)
  }

  // Too short
  if (normalized.length < 7) {
    issues.push(`Too short (${normalized.length} digits, minimum 7)`)
  }

  // Too long
  if (normalized.length > 15) {
    issues.push(`Too long (${normalized.length} digits, maximum 15)`)
  }

  // Indian sanity
  if (normalized.startsWith("91") && normalized.length < 12) {
    issues.push(`Starts with 91 but only ${normalized.length} digits (expected 12 for Indian number)`)
  }

  const isValid = issues.length === 0 && normalized.length >= 7 && normalized.length <= 15
  const smsFormat = normalized ? `+${normalized}` : ""

  let suggestion = ""
  if (!isValid && normalized !== digitsOnly) {
    suggestion = `Fix to ${normalized} (for WhatsApp) or +${normalized} (for SMS)`
  } else if (!isValid) {
    suggestion = "Expected format: 91XXXXXXXXXX (country code + 10-digit number)"
  }

  return { isValid, normalized, smsFormat, issues, suggestion }
}

/**
 * Quick check if a stored phone number is valid for messaging.
 */
export function isPhoneValid(raw: string): boolean {
  return validateStoredPhone(raw).isValid
}
