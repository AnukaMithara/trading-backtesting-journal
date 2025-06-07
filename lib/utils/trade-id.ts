export function generateTradeId(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")

  // Generate a random 4-digit number
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")

  return `TRD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`
}
