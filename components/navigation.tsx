"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { BarChart3, Home, Plus, TrendingUp, List, LogOut, Menu, X, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, description: "Overview & metrics" },
  { name: "Add Trade", href: "/add", icon: Plus, description: "Record new trade" },
  { name: "Trade List", href: "/trades", icon: List, description: "View all trades" },
  { name: "Analytics", href: "/analytics", icon: BarChart3, description: "Advanced analytics" },
  { name: "Settings", href: "/settings", icon: Settings, description: "Configure environment" },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" })
      if (response.ok) {
        toast({
          title: "Success",
          description: "Logged out successfully",
        })
        router.push("/login")
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Logout failed",
        variant: "destructive",
      })
    }
  }

  const NavItems = ({ mobile = false, onItemClick }: { mobile?: boolean; onItemClick?: () => void }) => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link key={item.name} href={item.href} onClick={onItemClick}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={cn(
                mobile ? "w-full justify-start h-12 text-base" : "flex items-center space-x-2 h-10",
                isActive && "bg-primary text-primary-foreground shadow-md",
                !isActive && "hover:bg-accent hover:text-accent-foreground",
                "transition-all duration-200",
              )}
            >
              <Icon className={cn("h-4 w-4", mobile && "mr-3")} />
              <span className={mobile ? "block" : "hidden sm:inline"}>{item.name}</span>
              {mobile && <span className="text-sm text-muted-foreground ml-auto">{item.description}</span>}
            </Button>
          </Link>
        )
      })}
    </>
  )

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <TrendingUp className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
                <div className="absolute -inset-1 bg-primary/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Trading Journal
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <NavItems />
          </div>

          {/* Desktop Logout */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="flex items-center space-x-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-6 w-6 text-primary" />
                      <span className="font-bold text-lg">Trading Journal</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)} className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mobile Navigation */}
                  <div className="flex-1 p-6 space-y-2">
                    <NavItems mobile onItemClick={() => setMobileMenuOpen(false)} />
                  </div>

                  {/* Mobile Logout */}
                  <div className="p-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full justify-start h-12 text-destructive border-destructive/20 hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
