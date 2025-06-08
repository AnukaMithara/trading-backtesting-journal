"use client"

import type React from "react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Settings, Building2, TrendingUp, Layers, Eye, EyeOff } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/hooks/use-toast"
import { brokerSchema, assetSchema, strategySchema, customFieldSchema } from "@/lib/validations/settings"
import type { BrokerFormData, AssetFormData, StrategyFormData, CustomFieldFormData } from "@/lib/validations/settings"

interface EntityDialogProps<T> {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  entity?: T
  onSubmit: (data: T) => void
  isLoading: boolean
  title: string
  children: React.ReactNode
}

function EntityDialog<T>({ isOpen, onOpenChange, entity, onSubmit, isLoading, title, children }: EntityDialogProps<T>) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entity ? `Edit ${title}` : `Add New ${title}`}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export function SettingsManagement() {
  const [activeTab, setActiveTab] = useState("brokers")
  const [brokerDialogOpen, setBrokerDialogOpen] = useState(false)
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)
  const [strategyDialogOpen, setStrategyDialogOpen] = useState(false)
  const [customFieldDialogOpen, setCustomFieldDialogOpen] = useState(false)
  const [editingEntity, setEditingEntity] = useState<any>(null)
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})

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

  const { data: strategies = [], isLoading: strategiesLoading } = useQuery({
    queryKey: ["strategies"],
    queryFn: async () => {
      const response = await fetch("/api/strategies")
      if (!response.ok) throw new Error("Failed to fetch strategies")
      return response.json()
    },
  })

  const { data: customFields = [], isLoading: customFieldsLoading } = useQuery({
    queryKey: ["customFields"],
    queryFn: async () => {
      const response = await fetch("/api/custom-fields")
      if (!response.ok) throw new Error("Failed to fetch custom fields")
      return response.json()
    },
  })

  // Forms
  const brokerForm = useForm<BrokerFormData>({
    resolver: zodResolver(brokerSchema),
    defaultValues: {
      type: "multi",
      isActive: true,
      supportedAssets: [],
    },
  })

  const assetForm = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      assetClass: "stock",
      isActive: true,
    },
  })

  const strategyForm = useForm<StrategyFormData>({
    resolver: zodResolver(strategySchema),
    defaultValues: {
      category: "trend",
      riskLevel: "medium",
      timeframes: [],
      parameters: {},
      isActive: true,
    },
  })

  const customFieldForm = useForm<CustomFieldFormData>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: {
      type: "select",
      options: [],
      required: false,
      isActive: true,
    },
  })

  // Generic CRUD mutations
  const createMutation = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
      const response = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create")
      }
      return response.json()
    },
    onSuccess: (_, { endpoint }) => {
      queryClient.invalidateQueries({ queryKey: [endpoint] })
      toast({ title: "Success", description: "Created successfully" })
      closeAllDialogs()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create",
        variant: "destructive",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ endpoint, id, data }: { endpoint: string; id: string; data: any }) => {
      const response = await fetch(`/api/${endpoint}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update")
      }
      return response.json()
    },
    onSuccess: (_, { endpoint }) => {
      queryClient.invalidateQueries({ queryKey: [endpoint] })
      toast({ title: "Success", description: "Updated successfully" })
      closeAllDialogs()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update",
        variant: "destructive",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async ({ endpoint, id }: { endpoint: string; id: string }) => {
      const response = await fetch(`/api/${endpoint}/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete")
      }
      return response.json()
    },
    onSuccess: (_, { endpoint }) => {
      queryClient.invalidateQueries({ queryKey: [endpoint] })
      toast({ title: "Success", description: "Deleted successfully" })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete",
        variant: "destructive",
      })
    },
  })

  const closeAllDialogs = () => {
    setBrokerDialogOpen(false)
    setAssetDialogOpen(false)
    setStrategyDialogOpen(false)
    setCustomFieldDialogOpen(false)
    setEditingEntity(null)
    brokerForm.reset()
    assetForm.reset()
    strategyForm.reset()
    customFieldForm.reset()
  }

  const handleEdit = (entity: any, type: string) => {
    setEditingEntity(entity)
    switch (type) {
      case "broker":
        brokerForm.reset(entity)
        setBrokerDialogOpen(true)
        break
      case "asset":
        assetForm.reset(entity)
        setAssetDialogOpen(true)
        break
      case "strategy":
        strategyForm.reset(entity)
        setStrategyDialogOpen(true)
        break
      case "customField":
        customFieldForm.reset(entity)
        setCustomFieldDialogOpen(true)
        break
    }
  }

  const handleSubmit = (data: any, endpoint: string) => {
    if (editingEntity) {
      updateMutation.mutate({ endpoint, id: editingEntity._id, data })
    } else {
      createMutation.mutate({ endpoint, data })
    }
  }

  const handleDelete = (id: string, endpoint: string) => {
    deleteMutation.mutate({ endpoint, id })
  }

  const toggleApiKeyVisibility = (brokerId: string) => {
    setShowApiKeys((prev) => ({ ...prev, [brokerId]: !prev[brokerId] }))
  }

  const LoadingState = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )

  return (
    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
          <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Trading Environment Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your brokers, assets, strategies, and custom fields for a personalized trading experience
        </p>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 sm:px-0">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="brokers" className="text-xs sm:text-sm">
                <Building2 className="h-4 w-4 mr-1 sm:mr-2" />
                Brokers ({brokers.length})
              </TabsTrigger>
              <TabsTrigger value="assets" className="text-xs sm:text-sm">
                <TrendingUp className="h-4 w-4 mr-1 sm:mr-2" />
                Assets ({assets.length})
              </TabsTrigger>
              <TabsTrigger value="strategies" className="text-xs sm:text-sm">
                <Layers className="h-4 w-4 mr-1 sm:mr-2" />
                Strategies ({strategies.length})
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs sm:text-sm">
                <Settings className="h-4 w-4 mr-1 sm:mr-2" />
                Custom ({customFields.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Brokers Tab */}
          <TabsContent value="brokers" className="space-y-6 px-6 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Broker Management</h3>
                <p className="text-sm text-muted-foreground">Configure your trading brokers with API credentials</p>
              </div>
              <Button
                onClick={() => setBrokerDialogOpen(true)}
                className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Broker
              </Button>
            </div>

            {brokersLoading ? (
              <LoadingState message="Loading brokers..." />
            ) : (
              <div className="rounded-lg border bg-background/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold hidden sm:table-cell">API Status</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">Commission</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
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
                            <Badge variant={broker.apiKey ? "default" : "secondary"}>
                              {broker.apiKey ? "Configured" : "Not Set"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {broker.commission ? `${broker.commission}%` : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(broker, "broker")}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Broker</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this broker? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(broker._id, "brokers")}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Broker Dialog */}
            <EntityDialog
              isOpen={brokerDialogOpen}
              onOpenChange={setBrokerDialogOpen}
              entity={editingEntity}
              onSubmit={(data) => handleSubmit(data, "brokers")}
              isLoading={createMutation.isPending || updateMutation.isPending}
              title="Broker"
            >
              <form onSubmit={brokerForm.handleSubmit((data) => handleSubmit(data, "brokers"))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brokerName">Broker Name *</Label>
                    <Input id="brokerName" {...brokerForm.register("name")} placeholder="e.g., Interactive Brokers" />
                    {brokerForm.formState.errors.name && (
                      <p className="text-sm text-red-500">{brokerForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="brokerType">Broker Type *</Label>
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
                    <Label htmlFor="brokerWebsite">Website</Label>
                    <Input
                      id="brokerWebsite"
                      {...brokerForm.register("website")}
                      placeholder="https://www.broker.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="commission">Commission (%)</Label>
                    <Input
                      id="commission"
                      type="number"
                      step="0.01"
                      {...brokerForm.register("commission", { valueAsNumber: true })}
                      placeholder="0.1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <div className="relative">
                      <Input
                        id="apiKey"
                        type={showApiKeys[editingEntity?._id] ? "text" : "password"}
                        {...brokerForm.register("apiKey")}
                        placeholder="Your API key"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => toggleApiKeyVisibility(editingEntity?._id || "new")}
                      >
                        {showApiKeys[editingEntity?._id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="apiSecret">API Secret</Label>
                    <div className="relative">
                      <Input
                        id="apiSecret"
                        type={showApiKeys[editingEntity?._id] ? "text" : "password"}
                        {...brokerForm.register("apiSecret")}
                        placeholder="Your API secret"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => toggleApiKeyVisibility(editingEntity?._id || "new")}
                      >
                        {showApiKeys[editingEntity?._id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="brokerDescription">Description</Label>
                  <Textarea
                    id="brokerDescription"
                    {...brokerForm.register("description")}
                    placeholder="Brief description of the broker"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={closeAllDialogs}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Broker"}
                  </Button>
                </div>
              </form>
            </EntityDialog>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-6 px-6 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Asset Management</h3>
                <p className="text-sm text-muted-foreground">Configure tradable instruments and their properties</p>
              </div>
              <Button
                onClick={() => setAssetDialogOpen(true)}
                className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </div>

            {assetsLoading ? (
              <LoadingState message="Loading assets..." />
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
                        <TableHead className="font-semibold hidden md:table-cell">Tick Size</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
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
                          <TableCell className="hidden md:table-cell">
                            {asset.tickSize || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(asset, "asset")}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this asset? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(asset._id, "assets")}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Asset Dialog */}
            <EntityDialog
              isOpen={assetDialogOpen}
              onOpenChange={setAssetDialogOpen}
              entity={editingEntity}
              onSubmit={(data) => handleSubmit(data, "assets")}
              isLoading={createMutation.isPending || updateMutation.isPending}
              title="Asset"
            >
              <form onSubmit={assetForm.handleSubmit((data) => handleSubmit(data, "assets"))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assetSymbol">Symbol *</Label>
                    <Input id="assetSymbol" {...assetForm.register("symbol")} placeholder="e.g., AAPL, BTC/USD" />
                    {assetForm.formState.errors.symbol && (
                      <p className="text-sm text-red-500">{assetForm.formState.errors.symbol.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="assetName">Name *</Label>
                    <Input id="assetName" {...assetForm.register("name")} placeholder="e.g., Apple Inc." />
                    {assetForm.formState.errors.name && (
                      <p className="text-sm text-red-500">{assetForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="assetClass">Asset Class *</Label>
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
                        <SelectItem value="index">Index</SelectItem>
                        <SelectItem value="bond">Bond</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="assetExchange">Exchange</Label>
                    <Input id="assetExchange" {...assetForm.register("exchange")} placeholder="e.g., NYSE, NASDAQ" />
                  </div>

                  <div>
                    <Label htmlFor="tickSize">Tick Size</Label>
                    <Input
                      id="tickSize"
                      type="number"
                      step="0.00001"
                      {...assetForm.register("tickSize", { valueAsNumber: true })}
                      placeholder="0.01"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contractSize">Contract Size</Label>
                    <Input
                      id="contractSize"
                      type="number"
                      {...assetForm.register("contractSize", { valueAsNumber: true })}
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" {...assetForm.register("currency")} placeholder="USD" />
                  </div>

                  <div>
                    <Label htmlFor="sector">Sector</Label>
                    <Input id="sector" {...assetForm.register("sector")} placeholder="Technology" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="assetDescription">Description</Label>
                  <Textarea
                    id="assetDescription"
                    {...assetForm.register("description")}
                    placeholder="Brief description of the asset"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={closeAllDialogs}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Asset"}
                  </Button>
                </div>
              </form>
            </EntityDialog>
          </TabsContent>

          {/* Strategies Tab */}
          <TabsContent value="strategies" className="space-y-6 px-6 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Strategy Management</h3>
                <p className="text-sm text-muted-foreground">Define and manage your trading strategies</p>
              </div>
              <Button
                onClick={() => setStrategyDialogOpen(true)}
                className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Strategy
              </Button>
            </div>

            {strategiesLoading ? (
              <LoadingState message="Loading strategies..." />
            ) : (
              <div className="rounded-lg border bg-background/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Category</TableHead>
                        <TableHead className="font-semibold">Risk Level</TableHead>
                        <TableHead className="font-semibold hidden sm:table-cell">Win Rate</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">Timeframes</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {strategies.map((strategy: any) => (
                        <TableRow key={strategy._id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">{strategy.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {strategy.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                strategy.riskLevel === "very-high" || strategy.riskLevel === "high"
                                  ? "destructive"
                                  : strategy.riskLevel === "medium"
                                    ? "default"
                                    : "secondary"
                              }
                              className="capitalize"
                            >
                              {strategy.riskLevel.replace("-", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {strategy.winRate ? `${strategy.winRate}%` : "-"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {strategy.timeframes?.slice(0, 2).map((tf: string) => (
                                <Badge key={tf} variant="outline" className="text-xs">
                                  {tf}
                                </Badge>
                              ))}
                              {strategy.timeframes?.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{strategy.timeframes.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(strategy, "strategy")}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Strategy</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this strategy? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(strategy._id, "strategies")}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Strategy Dialog */}
            <EntityDialog
              isOpen={strategyDialogOpen}
              onOpenChange={setStrategyDialogOpen}
              entity={editingEntity}
              onSubmit={(data) => handleSubmit(data, "strategies")}
              isLoading={createMutation.isPending || updateMutation.isPending}
              title="Strategy"
            >
              <form
                onSubmit={strategyForm.handleSubmit((data) => handleSubmit(data, "strategies"))}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="strategyName">Strategy Name *</Label>
                    <Input
                      id="strategyName"
                      {...strategyForm.register("name")}
                      placeholder="e.g., Moving Average Crossover"
                    />
                    {strategyForm.formState.errors.name && (
                      <p className="text-sm text-red-500">{strategyForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="strategyCategory">Category *</Label>
                    <Select onValueChange={(value) => strategyForm.setValue("category", value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trend">Trend Following</SelectItem>
                        <SelectItem value="momentum">Momentum</SelectItem>
                        <SelectItem value="reversal">Mean Reversion</SelectItem>
                        <SelectItem value="breakout">Breakout</SelectItem>
                        <SelectItem value="scalping">Scalping</SelectItem>
                        <SelectItem value="swing">Swing Trading</SelectItem>
                        <SelectItem value="position">Position Trading</SelectItem>
                        <SelectItem value="arbitrage">Arbitrage</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="riskLevel">Risk Level *</Label>
                    <Select onValueChange={(value) => strategyForm.setValue("riskLevel", value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="very-low">Very Low</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="very-high">Very High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="winRate">Win Rate (%)</Label>
                    <Input
                      id="winRate"
                      type="number"
                      min="0"
                      max="100"
                      {...strategyForm.register("winRate", { valueAsNumber: true })}
                      placeholder="65"
                    />
                  </div>

                  <div>
                    <Label htmlFor="profitFactor">Profit Factor</Label>
                    <Input
                      id="profitFactor"
                      type="number"
                      step="0.01"
                      {...strategyForm.register("profitFactor", { valueAsNumber: true })}
                      placeholder="1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxDrawdown">Max Drawdown (%)</Label>
                    <Input
                      id="maxDrawdown"
                      type="number"
                      min="0"
                      max="100"
                      {...strategyForm.register("maxDrawdown", { valueAsNumber: true })}
                      placeholder="15"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="strategyDescription">Description</Label>
                  <Textarea
                    id="strategyDescription"
                    {...strategyForm.register("description")}
                    placeholder="Detailed description of the strategy..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={closeAllDialogs}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Strategy"}
                  </Button>
                </div>
              </form>
            </EntityDialog>
          </TabsContent>

          {/* Custom Fields Tab */}
          <TabsContent value="custom" className="space-y-6 px-6 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Custom Fields</h3>
                <p className="text-sm text-muted-foreground">Create custom selection fields for your trade forms</p>
              </div>
              <Button
                onClick={() => setCustomFieldDialogOpen(true)}
                className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Field
              </Button>
            </div>

            {customFieldsLoading ? (
              <LoadingState message="Loading custom fields..." />
            ) : (
              <div className="rounded-lg border bg-background/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Label</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold hidden sm:table-cell">Required</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">Options</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customFields.map((field: any) => (
                        <TableRow key={field._id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium font-mono">{field.name}</TableCell>
                          <TableCell>{field.label}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {field.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant={field.required ? "default" : "secondary"}>
                              {field.required ? "Required" : "Optional"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {field.options?.length > 0 ? `${field.options.length} options` : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(field, "customField")}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Custom Field</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this custom field? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(field._id, "custom-fields")}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Custom Field Dialog */}
            <EntityDialog
              isOpen={customFieldDialogOpen}
              onOpenChange={setCustomFieldDialogOpen}
              entity={editingEntity}
              onSubmit={(data) => handleSubmit(data, "custom-fields")}
              isLoading={createMutation.isPending || updateMutation.isPending}
              title="Custom Field"
            >
              <form
                onSubmit={customFieldForm.handleSubmit((data) => handleSubmit(data, "custom-fields"))}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fieldName">Field Name *</Label>
                    <Input id="fieldName" {...customFieldForm.register("name")} placeholder="e.g., market_session" />
                    {customFieldForm.formState.errors.name && (
                      <p className="text-sm text-red-500">{customFieldForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="fieldLabel">Field Label *</Label>
                    <Input id="fieldLabel" {...customFieldForm.register("label")} placeholder="e.g., Market Session" />
                    {customFieldForm.formState.errors.label && (
                      <p className="text-sm text-red-500">{customFieldForm.formState.errors.label.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="fieldType">Field Type *</Label>
                    <Select onValueChange={(value) => customFieldForm.setValue("type", value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select">Select (Single)</SelectItem>
                        <SelectItem value="multiselect">Multi-Select</SelectItem>
                        <SelectItem value="text">Text Input</SelectItem>
                        <SelectItem value="number">Number Input</SelectItem>
                        <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" {...customFieldForm.register("category")} placeholder="e.g., Trading" />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="required"
                    checked={customFieldForm.watch("required")}
                    onCheckedChange={(checked) => customFieldForm.setValue("required", checked)}
                  />
                  <Label htmlFor="required">Required field</Label>
                </div>

                <div>
                  <Label htmlFor="fieldDescription">Description</Label>
                  <Textarea
                    id="fieldDescription"
                    {...customFieldForm.register("description")}
                    placeholder="Description of what this field is for..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={closeAllDialogs}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Custom Field"}
                  </Button>
                </div>
              </form>
            </EntityDialog>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
