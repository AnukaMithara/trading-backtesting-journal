import { redirect } from "next/navigation"

// Database test pages are disabled. Redirect to home.
export default function TestDbPage() {
  redirect("/")
}
