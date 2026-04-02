import { redirect } from "next/navigation"

// Debug pages are disabled. Redirect to home.
export default function DebugPage() {
  redirect("/")
}
