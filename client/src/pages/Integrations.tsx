import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Webhook, Plus, Trash2, ExternalLink, Shield, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

import { DashboardLayout } from "@/components/DashboardLayout";

export default function Integrations() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");

  const { data: webhooks, refetch } = trpc.whatsapp.getExternalWebhooks.useQuery();

  const createMutation = trpc.whatsapp.createExternalWebhook.useMutation({
    onSuccess: () => {
      toast.success("Webhook created successfully");
      setName("");
      setUrl("");
      setSecret("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.whatsapp.deleteExternalWebhook.useMutation({
    onSuccess: () => {
      toast.success("Webhook deleted");
      refetch();
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    createMutation.mutate({ name, url, secret });
  };

  return (
    <DashboardLayout 
      title={t('integrations.title')} 
      subtitle={t('integrations.subtitle')}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Create New Webhook */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#25D366]" />
              {t('integrations.addNew')}
            </CardTitle>
            <CardDescription>
              {t('integrations.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('integrations.friendlyName')}</Label>
                  <Input
                    id="name"
                    placeholder="e.g. My CRM System"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#25D366]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">{t('integrations.webhookUrl')}</Label>
                  <Input
                    id="url"
                    placeholder="https://your-api.com/webhook"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#25D366]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secret">{t('integrations.secret')}</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="secret"
                    type="password"
                    placeholder="••••••••••••••••"
                    className="pl-10 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#25D366]"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {t('integrations.create')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Webhooks */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#25D366]" />
            {t('integrations.active')}
          </h2>
          
          {!webhooks || webhooks.length === 0 ? (
            <Card className="border-none shadow-sm p-8 text-center bg-white">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Webhook className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-slate-500">{t('integrations.noWebhooks')}</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {webhooks.map((webhook) => (
                <Card key={webhook.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
                          <Webhook className="text-[#25D366] w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{webhook.name}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <ExternalLink className="w-3 h-3" />
                            {webhook.url}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => deleteMutation.mutate({ webhookId: webhook.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
