/**
 * Generates a unique trade ID with a prefix and random alphanumeric characters
 * Format: TRD-YYYYMMDD-XXXX where XXXX is a random alphanumeric string
 */
export function generateTradeId(): string {
  const prefix = "TRD"
  const date = new Date()
  const dateStr = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("")

  // Generate a random 4-character alphanumeric string
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let randomStr = ""
  for (let i = 0; i < 4; i++) {
    randomStr += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return `${prefix}-${dateStr}-${randomStr}`
}
