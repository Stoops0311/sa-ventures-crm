export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
]
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

function inWords(n: number): string {
  if (n === 0) return "Zero"
  if (n < 20) return ONES[n]
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? " " + inWords(n % 100) : ""}`
  if (n < 100000) return `${inWords(Math.floor(n / 1000))} Thousand${n % 1000 ? " " + inWords(n % 1000) : ""}`
  if (n < 10000000) return `${inWords(Math.floor(n / 100000))} Lakh${n % 100000 ? " " + inWords(n % 100000) : ""}`
  return `${inWords(Math.floor(n / 10000000))} Crore${n % 10000000 ? " " + inWords(n % 10000000) : ""}`
}

export function amountToWords(amount: number): string {
  const rounded = Math.round(amount)
  if (rounded === 0) return "Rupees Zero Only"
  return `Rupees ${inWords(rounded)} Only`
}
