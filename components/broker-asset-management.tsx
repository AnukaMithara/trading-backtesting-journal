"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Building2, ExternalLink } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/hooks/use-toast"
import { brokerSchema, assetSchema, exchangeSchema } from "@/lib/validations/broker-asset"
import type { BrokerFormData, AssetFormData, ExchangeFormData } from "@/lib/validations/broker-asset"

export function BrokerAssetManagement() {
  const [activeTab, setActiveTab] = useState("brokers")
  const [brokerDialogOpen, setBrokerDialogOpen] = useState(false)
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch data
  const { data: brokers = [], isLoading: brokersLoading } = useQuery({
    queryKey: ["brokers"],
    queryFn: async () => {
      const response = await fetch("/api/brokers")
      if (!response.ok) throw new Error("Failed to fetch brokers")
      return response.json()
    },
  })

  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const response = await fetch("/api/assets")
      if (!response.ok) throw new Error("Failed to fetch assets")
      return response.json()
    },
  })

  const { data: exchanges = [], isLoading: exchangesLoading } = useQuery({
    queryKey: ["exchanges"],
    queryFn: async () => {
      const response = await fetch("/api/exchanges")
      if (!response.ok) throw new Error("Failed to fetch exchanges")
      return response.json()
    },
  })

  // Forms
  const brokerForm = useForm<BrokerFormData>({
    resolver: zodResolver(brokerSchema),
    defaultValues: {
      type: "multi",
      isActive: true,
    },
  })

  const assetForm = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      assetClass: "stock",
      isActive: true,
    },
  })

  const exchangeForm = useForm<ExchangeFormData>({
    resolver: zodResolver(exchangeSchema),
    defaultValues: {
      assetClasses: [],
      isActive: true,
    },
  })

  // Mutations
  const createBroker = useMutation({
    mutationFn: async (data: BrokerFormData) => {
      const response = await fetch("/api/brokers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create broker")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brokers"] })
      toast({ title: "Success", description: "Broker created successfully" })
      brokerForm.reset()
      setBrokerDialogOpen(false)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create broker",
        variant: "destructive",
      })
    },
  })

  const createAsset = useMutation({
    mutationFn: async (data: AssetFormData) => {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create asset")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      toast({ title: "Success", description: "Asset created successfully" })
      assetForm.reset()
      setAssetDialogOpen(false)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create asset",
        variant: "destructive",
      })
    },
  })

  const createExchange = useMutation({
    mutationFn: async (data: ExchangeFormData) => {
      const response = await fetch("/api/exchanges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create exchange")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchanges"] })
      toast({ title: "Success", description: "Exchange created successfully" })
      exchangeForm.reset()
      setExchangeDialogOpen(false)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create exchange",
        variant: "destructive",
      })
    },
  })

  const LoadingState = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )

  const EmptyState = ({
    title,
    description,
    action,
  }: { title: string; description: string; action: React.ReactNode }) => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
        <Building2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>
      {action}
    </div>
  )

  return (
    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
          <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Broker & Asset Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your trading brokers, assets, and exchanges for better organization
        </p>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 sm:px-0">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="brokers" className="text-xs sm:text-sm">
                Brokers ({brokers.length})
              </TabsTrigger>
              <TabsTrigger value="assets" className="text-xs sm:text-sm">
                Assets ({assets.length})
              </TabsTrigger>
              <TabsTrigger value="exchanges" className="text-xs sm:text-sm">
                Exchanges ({exchanges.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Brokers Tab */}
          <TabsContent value="brokers" className="space-y-6 px-6 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Manage Brokers</h3>
                <p className="text-sm text-muted-foreground">Add and organize your trading brokers</p>
              </div>
              <Dialog open={brokerDialogOpen} onOpenChange={setBrokerDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Broker
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Broker</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={brokerForm.handleSubmit((data) => createBroker.mutate(data))} className="space-y-4">
                    <div>
                      <Label htmlFor="brokerName">Broker Name</Label>
                      <Input id="brokerName" {...brokerForm.register("name")} placeholder="e.g., Interactive Brokers" />
                      {brokerForm.formState.errors.name && (
                        <p className="text-sm text-red-500">{brokerForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="brokerType">Broker Type</Label>
                      <Select onValueChange={(value) => brokerForm.setValue("type", value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select broker type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stock">Stock Broker</SelectItem>
                          <SelectItem value="forex">Forex Broker</SelectItem>
                          <SelectItem value="crypto">Crypto Exchange</SelectItem>
                          <SelectItem value="commodity">Commodity Broker</SelectItem>
                          <SelectItem value="options">Options Broker</SelectItem>
                          <SelectItem value="futures">Futures Broker</SelectItem>
                          <SelectItem value="multi">Multi-Asset Broker</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="brokerWebsite">Website (Optional)</Label>
                      <Input
                        id="brokerWebsite"
                        {...brokerForm.register("website")}
                        placeholder="https://www.broker.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="brokerDescription">Description (Optional)</Label>
                      <Textarea
                        id="brokerDescription"
                        {...brokerForm.register("description")}
                        placeholder="Brief description of the broker"
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={createBroker.isPending}>
                      {createBroker.isPending ? "Creating..." : "Create Broker"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {brokersLoading ? (
              <LoadingState message="Loading brokers..." />
            ) : brokers.length === 0 ? (
              <EmptyState
                title="No brokers yet"
                description="Add your first broker to start organizing your trading accounts"
                action={
                  <Dialog open={brokerDialogOpen} onOpenChange={setBrokerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Broker
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                }
              />
            ) : (
              <div className="rounded-lg border bg-background/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold hidden sm:table-cell">Website</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brokers.map((broker: any) => (
                        <TableRow key={broker._id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">{broker.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {broker.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {broker.website ? (
                              <a
                                href={broker.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm"
                              >
                                Visit
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs truncate hidden md:table-cell">
                            {broker.description || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-6 px-6 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Manage Assets</h3>
                <p className="text-sm text-muted-foreground">Add and organize your trading instruments</p>
              </div>
              <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Asset</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={assetForm.handleSubmit((data) => createAsset.mutate(data))} className="space-y-4">
                    <div>
                      <Label htmlFor="assetSymbol">Symbol</Label>
                      <Input id="assetSymbol" {...assetForm.register("symbol")} placeholder="e.g., AAPL, BTC/USD" />
                      {assetForm.formState.errors.symbol && (
                        <p className="text-sm text-red-500">{assetForm.formState.errors.symbol.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="assetName">Name</Label>
                      <Input id="assetName" {...assetForm.register("name")} placeholder="e.g., Apple Inc." />
                      {assetForm.formState.errors.name && (
                        <p className="text-sm text-red-500">{assetForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="assetClass">Asset Class</Label>
                      <Select onValueChange={(value) => assetForm.setValue("assetClass", value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stock">Stock</SelectItem>
                          <SelectItem value="forex">Forex</SelectItem>
                          <SelectItem value="crypto">Cryptocurrency</SelectItem>
                          <SelectItem value="commodity">Commodity</SelectItem>
                          <SelectItem value="options">Options</SelectItem>
                          <SelectItem value="futures">Futures</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="assetExchange">Exchange (Optional)</Label>
                      <Select onValueChange={(value) => assetForm.setValue("exchange", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exchange" />
                        </SelectTrigger>
                        <SelectContent>
                          {exchanges.map((exchange: any) => (
                            <SelectItem key={exchange._id} value={exchange.name}>
                              {exchange.name} ({exchange.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="assetDescription">Description (Optional)</Label>
                      <Textarea
                        id="assetDescription"
                        {...assetForm.register("description")}
                        placeholder="Brief description of the asset"
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={createAsset.isPending}>
                      {createAsset.isPending ? "Creating..." : "Create Asset"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {assetsLoading ? (
              <LoadingState message="Loading assets..." />
            ) : assets.length === 0 ? (
              <EmptyState
                title="No assets yet"
                description="Add your first trading asset to start building your portfolio"
                action={
                  <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Asset
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                }
              />
            ) : (
              <div className="rounded-lg border bg-background/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Symbol</TableHead>
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Class</TableHead>
                        <TableHead className="font-semibold hidden sm:table-cell">Exchange</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets.map((asset: any) => (
                        <TableRow key={asset._id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium font-mono">{asset.symbol}</TableCell>
                          <TableCell>{asset.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {asset.assetClass}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {asset.exchange || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell className="max-w-xs truncate hidden md:table-cell">
                            {asset.description || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Exchanges Tab */}
          <TabsContent value="exchanges" className="space-y-6 px-6 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Manage Exchanges</h3>
                <p className="text-sm text-muted-foreground">Add and organize trading exchanges</p>
              </div>
              <Dialog open={exchangeDialogOpen} onOpenChange={setExchangeDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exchange
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Exchange</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={exchangeForm.handleSubmit((data) => createExchange.mutate(data))}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="exchangeName">Exchange Name</Label>
                      <Input id="exchangeName" {...exchangeForm.register("name")} placeholder="e.g., NASDAQ" />
                    </div>

                    <div>
                      <Label htmlFor="exchangeCode">Exchange Code</Label>
                      <Input id="exchangeCode" {...exchangeForm.register("code")} placeholder="e.g., NASDAQ" />
                    </div>

                    <div>
                      <Label htmlFor="exchangeCountry">Country</Label>
                      <Input
                        id="exchangeCountry"
                        {...exchangeForm.register("country")}
                        placeholder="e.g., United States"
                      />
                    </div>

                    <div>
                      <Label htmlFor="exchangeTimezone">Timezone</Label>
                      <Input
                        id="exchangeTimezone"
                        {...exchangeForm.register("timezone")}
                        placeholder="e.g., America/New_York"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={createExchange.isPending}>
                      {createExchange.isPending ? "Creating..." : "Create Exchange"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {exchangesLoading ? (
              <LoadingState message="Loading exchanges..." />
            ) : exchanges.length === 0 ? (
              <EmptyState
                title="No exchanges yet"
                description="Add your first exchange to organize your trading venues"
                action={
                  <Dialog open={exchangeDialogOpen} onOpenChange={setExchangeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Exchange
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                }
              />
            ) : (
              <div className="rounded-lg border bg-background/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Code</TableHead>
                        <TableHead className="font-semibold hidden sm:table-cell">Country</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">Timezone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exchanges.map((exchange: any) => (
                        <TableRow key={exchange._id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">{exchange.name}</TableCell>
                          <TableCell className="font-mono">{exchange.code}</TableCell>
                          <TableCell className="hidden sm:table-cell">{exchange.country}</TableCell>
                          <TableCell className="hidden md:table-cell font-mono text-sm">{exchange.timezone}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
