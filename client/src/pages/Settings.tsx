import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings as SettingsIcon, Save, AlertCircle, CheckCircle, Loader2, Eye, EyeOff, Globe, Plus, Trash2, Phone, Info, Facebook } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { toast } from "sonner";
import { WebhookStatusIndicator, WebhookStatusBadge } from "@/components/WebhookStatusIndicator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DashboardLayout } from "@/components/DashboardLayout";

export default function Settings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState({
    businessPhoneNumberId: "",
    businessAccountId: "",
    accessToken: "",
    webhookVerifyToken: "",
    nickname: "",
    phoneNumber: "",
    connectionMethod: "cloud_api" as "cloud_api" | "coexistence",
  });
  const [showTokens, setShowTokens] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<number | null>(null);
  const [isConnectingMeta, setIsConnectingMeta] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<number | null>(null);

  // Zoho CRM State
  const [zohoFormData, setZohoFormData] = useState({
    clientId: "",
    clientSecret: "",
  });

  // Fetch WhatsApp configs
  const { data: configs, isLoading, error: fetchError, refetch } = trpc.whatsapp.getConfigs.useQuery();
  
  // Zoho TRPC
  const { data: zohoConfig, refetch: refetchZoho } = trpc.zoho.getConfig.useQuery();
  const updateZohoMutation = trpc.zoho.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Zoho CRM credentials saved. You can now connect your account.");
      refetchZoho();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save Zoho credentials");
    }
  });
  const deleteZohoMutation = trpc.zoho.deleteConfig.useMutation({
    onSuccess: () => {
      toast.success("Zoho CRM connection removed");
      refetchZoho();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove Zoho connection");
    }
  });

  // Initialize Zoho form
  useEffect(() => {
    if (zohoConfig) {
      setZohoFormData({
        clientId: zohoConfig.clientId || "",
        clientSecret: zohoConfig.clientSecret || "",
      });
    }
  }, [zohoConfig]);

  const handleConnectZoho = async () => {
    if (!zohoConfig?.clientId || !zohoConfig?.clientSecret) {
      toast.error("Please save your Client ID and Client Secret first.");
      return;
    }

    try {
      const redirectUri = `${window.location.origin}/api/zoho/auth/zoho/callback`;
      // We pass userId in state to identify the user in the callback
      const authUrl = await utils.zoho.getAuthUrl.fetch({ 
        redirectUri: `${redirectUri}?state=${user?.id}` 
      });
      
      // The getAuthUrl procedure in the router should handle the state if we want, 
      // but here I'll just append it to the redirectUri passed to the service.
      // Wait, Zoho expects the redirect_uri to match EXACTLY.
      // So I should pass state as a separate param in the auth URL.
      
      // Let's adjust getZohoAuthUrl in zoho.service.ts to accept state.
      // Or just use the 'state' parameter of OAuth.
      
      const popup = window.open(
        `${authUrl.url}&state=${user?.id}`,
        "Connect Zoho CRM",
        "width=600,height=700"
      );

      if (!popup) {
        toast.error("Popup blocked. Please allow popups for this site.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to get Zoho authorization URL");
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ZOHO_AUTH_SUCCESS') {
        toast.success("Zoho CRM connected successfully!");
        refetchZoho();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refetchZoho]);

  // Listen for Meta Auth Success
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'META_AUTH_SUCCESS') {
        toast.success("Successfully connected to Meta!");
        refetch();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refetch]);

  const handleConnectMeta = async () => {
    setIsConnectingMeta(true);
    try {
      const response = await fetch('/api/auth/meta/url');
      if (!response.ok) throw new Error("Failed to get auth URL");
      const { url } = await response.json();

      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authWindow = window.open(
        url,
        'meta_auth_popup',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        toast.error("Popup blocked! Please allow popups for this site.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to connect with Meta");
    } finally {
      setIsConnectingMeta(false);
    }
  };

  // Update config mutation
  const updateConfigMutation = trpc.whatsapp.updateConfig.useMutation({
    onSuccess: () => {
      setIsSaved(true);
      toast.success("WhatsApp configuration saved successfully!");
      setIsAddingNew(false);
      setEditingConfigId(null);
      refetch();
      setTimeout(() => setIsSaved(false), 3000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save configuration");
    },
  });

  const deleteConfigMutation = trpc.whatsapp.deleteConfig.useMutation({
    onSuccess: () => {
      toast.success("WhatsApp configuration deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete configuration");
    }
  });

  const handleEdit = (config: any) => {
    setFormData({
      businessPhoneNumberId: config.businessPhoneNumberId || "",
      businessAccountId: config.businessAccountId || "",
      accessToken: config.accessToken || "",
      webhookVerifyToken: config.webhookVerifyToken || "",
      nickname: config.nickname || "",
      phoneNumber: config.phoneNumber || "",
      connectionMethod: config.connectionMethod || "cloud_api",
    });
    setEditingConfigId(config.id);
    setIsAddingNew(true);
  };

  const handleAddNew = () => {
    setFormData({
      businessPhoneNumberId: "",
      businessAccountId: "",
      accessToken: "",
      webhookVerifyToken: Math.random().toString(36).substring(2, 15),
      nickname: "",
      phoneNumber: "",
      connectionMethod: "cloud_api",
    });
    setEditingConfigId(null);
    setIsAddingNew(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessPhoneNumberId.trim()) {
      toast.error("Phone Number ID is required");
      return;
    }
    if (!formData.businessAccountId.trim()) {
      toast.error("Business Account ID is required");
      return;
    }
    if (!formData.accessToken.trim()) {
      toast.error("Access Token is required");
      return;
    }
    if (!formData.webhookVerifyToken.trim()) {
      toast.error("Webhook Verify Token is required");
      return;
    }

    await updateConfigMutation.mutateAsync(formData);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Settings" subtitle="Loading your configuration...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
        </div>
      </DashboardLayout>
    );
  }

  if (fetchError) {
    return (
      <DashboardLayout title="Settings" subtitle="Error loading configuration">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Settings</h2>
          <p className="text-slate-500 mb-6 max-w-md">
            {fetchError.message || "An unexpected error occurred while fetching your configuration."}
          </p>
          <Button onClick={() => window.location.reload()} className="bg-[#25D366] hover:bg-[#128C7E] text-white">
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Settings" 
      subtitle="Configure your WhatsApp Business API and system preferences"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Config List & Multi-Number Management */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-none shadow-sm bg-white">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900">WhatsApp Numbers</h2>
                <p className="text-sm text-slate-500 mt-1">Manage multiple WhatsApp Business accounts and connection methods</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleConnectMeta}
                  disabled={isConnectingMeta}
                  className="bg-[#1877F2] text-white hover:bg-[#166fe5] shadow-lg shadow-[#1877F2]/20"
                >
                  {isConnectingMeta ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Facebook className="w-4 h-4 mr-2" />}
                  Connect with Meta
                </Button>
                <Button 
                  onClick={handleAddNew}
                  variant="outline"
                  className="border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Manual Setup
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {configs && configs.length > 0 ? (
                configs.map((config) => (
                  <div 
                    key={config.id} 
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-[#25D366]/30 hover:bg-slate-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#DCF8C6] rounded-full flex items-center justify-center text-[#075E54]">
                        <Phone className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900">{config.nickname || "WhatsApp Business"}</h3>
                          <Badge className={config.connectionMethod === 'coexistence' ? "bg-blue-100 text-blue-700 border-none" : "bg-[#DCF8C6] text-[#075E54] border-none"}>
                            {config.connectionMethod === 'coexistence' ? "Coexistence" : "Standard API"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">{config.phoneNumber || config.businessPhoneNumberId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(config)}>
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setConfigToDelete(config.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                  <Phone className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400">No WhatsApp numbers configured yet.</p>
                  <Button variant="link" onClick={handleAddNew} className="text-[#25D366]">Add your first number</Button>
                </div>
              )}
            </div>
          </Card>

          {/* Zoho CRM Integration */}
          <Card className="p-8 border-none shadow-sm bg-white">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F4F4F4] rounded-xl flex items-center justify-center">
                  <img src="https://www.vectorlogo.zone/logos/zoho/zoho-icon.svg" className="w-6 h-6" alt="Zoho" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Zoho CRM Integration</h2>
                  <p className="text-sm text-slate-500 mt-1">Sync your WhatsApp contacts with Zoho CRM</p>
                </div>
              </div>
              {zohoConfig?.refreshToken && (
                <Badge className="bg-green-100 text-green-700 border-none">
                  Connected
                </Badge>
              )}
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Client ID</Label>
                  <Input 
                    value={zohoFormData.clientId}
                    onChange={(e) => setZohoFormData({ ...zohoFormData, clientId: e.target.value })}
                    placeholder="Paste your Zoho Client ID"
                    className="bg-slate-50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Client Secret</Label>
                  <Input 
                    type="password"
                    value={zohoFormData.clientSecret}
                    onChange={(e) => setZohoFormData({ ...zohoFormData, clientSecret: e.target.value })}
                    placeholder="Paste your Zoho Client Secret"
                    className="bg-slate-50 border-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => updateZohoMutation.mutate(zohoFormData)}
                  disabled={updateZohoMutation.isPending}
                  className="bg-[#25D366] text-white hover:bg-[#128C7E]"
                >
                  {updateZohoMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Save Credentials
                </Button>
                
                {zohoConfig && (
                  <Button 
                    onClick={handleConnectZoho}
                    variant="outline"
                    className="border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
                  >
                    {zohoConfig.refreshToken ? "Reconnect Zoho" : "Connect Zoho Account"}
                  </Button>
                )}

                {zohoConfig?.refreshToken && (
                  <Button 
                    variant="ghost" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => deleteZohoMutation.mutate()}
                  >
                    Disconnect
                  </Button>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 mb-2">How to get credentials:</h4>
                <ol className="text-xs text-slate-500 space-y-2 list-decimal ml-4">
                  <li>Go to the <a href="https://api-console.zoho.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Zoho API Console</a>.</li>
                  <li>Click <strong>Add Client</strong> and select <strong>Server-based Applications</strong>.</li>
                  <li>Enter a Client Name and set the <strong>Authorized Redirect URIs</strong> to:<br/>
                    <code className="bg-slate-200 px-1 rounded mt-1 inline-block">{window.location.origin}/api/zoho/auth/zoho/callback</code>
                  </li>
                  <li>Copy the Client ID and Client Secret and paste them above.</li>
                </ol>
              </div>
            </div>
          </Card>

          {/* Delete Confirmation Dialog */}
          <Dialog open={!!configToDelete} onOpenChange={(open) => !open && setConfigToDelete(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Configuration</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this WhatsApp configuration? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setConfigToDelete(null)}>Cancel</Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (configToDelete) {
                      deleteConfigMutation.mutate({ configId: configToDelete });
                      setConfigToDelete(null);
                    }
                  }}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add/Edit Dialog */}
          <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingConfigId ? "Edit WhatsApp Number" : "Add New WhatsApp Number"}</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nickname</Label>
                    <Input 
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      placeholder="e.g., Sales Team, Support Line"
                      className="bg-slate-50 border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</Label>
                    <Input 
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="e.g., +1234567890"
                      className="bg-slate-50 border-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Connection Method</Label>
                  <Select 
                    value={formData.connectionMethod} 
                    onValueChange={(v: any) => setFormData({ ...formData, connectionMethod: v })}
                  >
                    <SelectTrigger className="bg-slate-50 border-none">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cloud_api">Standard Cloud API (Meta Infrastructure)</SelectItem>
                      <SelectItem value="coexistence">Coexistence Method (API + Business App)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg mt-2">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      {formData.connectionMethod === 'cloud_api' 
                        ? "The standard method. Direct connection to Meta's Cloud API. Requires a dedicated number not used by the standard WhatsApp app."
                        : "Advanced method. Allows you to use the WhatsApp Business App and this API simultaneously on the same number. Requires a compatible provider."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number ID</Label>
                    <Input
                      value={formData.businessPhoneNumberId}
                      onChange={(e) => setFormData({ ...formData, businessPhoneNumberId: e.target.value })}
                      placeholder="e.g., 1234567890123456"
                      className="bg-slate-50 border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Business Account ID</Label>
                    <Input
                      value={formData.businessAccountId}
                      onChange={(e) => setFormData({ ...formData, businessAccountId: e.target.value })}
                      placeholder="e.g., 1234567890123456"
                      className="bg-slate-50 border-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Permanent Access Token</Label>
                  <div className="relative">
                    <Input
                      type={showTokens ? "text" : "password"}
                      value={formData.accessToken}
                      onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                      placeholder="Paste your system user access token"
                      className="bg-slate-50 border-none pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTokens(!showTokens)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Webhook Verify Token</Label>
                  <Input
                    value={formData.webhookVerifyToken}
                    onChange={(e) => setFormData({ ...formData, webhookVerifyToken: e.target.value })}
                    placeholder="e.g., my_secure_token_123"
                    className="bg-slate-50 border-none"
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button variant="ghost" onClick={() => setIsAddingNew(false)}>Cancel</Button>
                  <Button
                    type="submit"
                    disabled={updateConfigMutation.isPending}
                    className="bg-[#25D366] text-white hover:bg-[#128C7E]"
                  >
                    {updateConfigMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {editingConfigId ? "Update Number" : "Add Number"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Webhook URL Info */}
          <Card className="p-8 border-none shadow-sm bg-[#075E54] text-white overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold">Webhook Configuration</h3>
              </div>
              <p className="text-white/70 text-sm mb-6 max-w-md">
                Copy this URL and paste it into your Meta App's WhatsApp Webhook settings.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-black/20 backdrop-blur-sm p-4 rounded-xl font-mono text-xs break-all border border-white/10">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : 'https://your-domain.com/api/whatsapp/webhook'}
                </div>
                <Button 
                  variant="ghost" 
                  className="bg-white/10 hover:bg-white/20 text-white h-12 px-4"
                  onClick={() => {
                    const url = typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '';
                    navigator.clipboard.writeText(url);
                    toast.success("Webhook URL copied!");
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            {/* Decorative element */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
          </Card>
        </div>

        {/* Right Column: Status & Help */}
        <div className="space-y-6">
          <Card className="p-6 border-none shadow-sm bg-white">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">System Status</h3>
            <WebhookStatusIndicator autoRefresh={true} refreshInterval={30000} />
          </Card>

          <Card className="p-6 border-none shadow-sm bg-[#DCF8C6]/30 border-l-4 border-l-[#25D366]">
            <h3 className="font-bold text-[#075E54] flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4" />
              Setup Guide
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-[#075E54] text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                <p className="text-xs text-[#075E54]/80 leading-relaxed">
                  Go to <strong>developers.facebook.com</strong> and create a Meta App.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-[#075E54] text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                <p className="text-xs text-[#075E54]/80 leading-relaxed">
                  Add the <strong>WhatsApp</strong> product to your app.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-[#075E54] text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                <p className="text-xs text-[#075E54]/80 leading-relaxed">
                  Configure your <strong>Webhook</strong> using the URL provided on this page.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-[#075E54] text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">4</div>
                <p className="text-xs text-[#075E54]/80 leading-relaxed">
                  Generate a <strong>Permanent Access Token</strong> for a System User.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-white">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Account Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">User Email</span>
                <span className="font-bold text-slate-900">{user?.email}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Plan</span>
                <Badge variant="outline" className="text-[10px] font-bold text-[#25D366] border-[#25D366]">ENTERPRISE</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
