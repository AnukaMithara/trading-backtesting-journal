import { SettingsManagement } from "@/components/settings/settings-management"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your trading environment configuration and customize your experience
        </p>
      </div>

      <SettingsManagement />
    </div>
  )
}
