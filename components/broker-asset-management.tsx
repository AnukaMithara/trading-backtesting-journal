"use client"

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
import { Plus, Building2 } from "lucide-react"
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
  const { data: brokers = [] } = useQuery({
    queryKey: ["brokers"],
    queryFn: async () => {
      const response = await fetch("/api/brokers")
      if (!response.ok) throw new Error("Failed to fetch brokers")
      return response.json()
    },
  })

  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const response = await fetch("/api/assets")
      if (!response.ok) throw new Error("Failed to fetch assets")
      return response.json()
    },
  })

  const { data: exchanges = [] } = useQuery({
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Broker & Asset Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="brokers">Brokers ({brokers.length})</TabsTrigger>
            <TabsTrigger value="assets">Assets ({assets.length})</TabsTrigger>
            <TabsTrigger value="exchanges">Exchanges ({exchanges.length})</TabsTrigger>
          </TabsList>

          {/* Brokers Tab */}
          <TabsContent value="brokers" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Manage Brokers</h3>
              <Dialog open={brokerDialogOpen} onOpenChange={setBrokerDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Broker
                  </Button>
                </DialogTrigger>
                <DialogContent>
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

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brokers.map((broker: any) => (
                    <TableRow key={broker._id}>
                      <TableCell className="font-medium">{broker.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {broker.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {broker.website ? (
                          <a
                            href={broker.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Visit
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{broker.description || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {brokers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No brokers added yet. Click "Add Broker" to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Manage Assets</h3>
              <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </Button>
                </DialogTrigger>
                <DialogContent>
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

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Asset Class</TableHead>
                    <TableHead>Exchange</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset: any) => (
                    <TableRow key={asset._id}>
                      <TableCell className="font-medium">{asset.symbol}</TableCell>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {asset.assetClass}
                        </Badge>
                      </TableCell>
                      <TableCell>{asset.exchange || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{asset.description || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {assets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No assets added yet. Click "Add Asset" to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Exchanges Tab */}
          <TabsContent value="exchanges" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Manage Exchanges</h3>
              <Dialog open={exchangeDialogOpen} onOpenChange={setExchangeDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exchange
                  </Button>
                </DialogTrigger>
                <DialogContent>
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

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Timezone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exchanges.map((exchange: any) => (
                    <TableRow key={exchange._id}>
                      <TableCell className="font-medium">{exchange.name}</TableCell>
                      <TableCell>{exchange.code}</TableCell>
                      <TableCell>{exchange.country}</TableCell>
                      <TableCell>{exchange.timezone}</TableCell>
                    </TableRow>
                  ))}
                  {exchanges.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No exchanges added yet. Click "Add Exchange" to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
