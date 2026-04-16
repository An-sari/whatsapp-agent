import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Settings, Save, MessageCircle, Zap, Loader2, BookOpen, BrainCircuit, Key } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { AIChatPreview } from "@/components/AIChatPreview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DashboardLayout } from "@/components/DashboardLayout";

export default function AgentConfig() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    agentName: "",
    personality: "",
    salesScript: "",
    responseStyle: "professional" as const,
    maxResponseLength: 500,
    autoRespond: true,
    aiProvider: "gemini" as "gemini" | "openrouter" | "openai" | "anthropic",
    aiModel: "gemini-2.0-flash",
    aiApiKey: "",
    escalationKeywords: "",
  });

  // Fetch agent config
  const { data: agentConfig, isLoading } = trpc.whatsapp.getAgentConfig.useQuery();

  // Update agent config mutation
  const updateConfigMutation = trpc.whatsapp.updateAgentConfig.useMutation({
    onSuccess: () => {
      toast.success("Agent configuration updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update configuration");
    },
  });

  // Load agent config into form
  useEffect(() => {
    if (agentConfig) {
      setFormData({
        agentName: agentConfig.agentName || "",
        personality: agentConfig.personality || "",
        salesScript: agentConfig.salesScript || "",
        responseStyle: (agentConfig.responseStyle as any) || "professional",
        maxResponseLength: agentConfig.maxResponseLength || 500,
        autoRespond: agentConfig.autoRespond ?? true,
        aiProvider: (agentConfig.aiProvider as any) || "gemini",
        aiModel: agentConfig.aiModel || "gemini-2.0-flash",
        aiApiKey: agentConfig.aiApiKey || "",
        escalationKeywords: Array.isArray(agentConfig.escalationKeywords)
          ? agentConfig.escalationKeywords.join(", ")
          : "",
      });
    }
  }, [agentConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateConfigMutation.mutateAsync({
      agentName: formData.agentName,
      personality: formData.personality,
      salesScript: formData.salesScript,
      responseStyle: formData.responseStyle,
      maxResponseLength: formData.maxResponseLength,
      autoRespond: formData.autoRespond,
      aiProvider: formData.aiProvider,
      aiModel: formData.aiModel,
      aiApiKey: formData.aiApiKey,
      escalationKeywords: formData.escalationKeywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k),
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Agent Personality" subtitle="Configure your AI assistant's behavior">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#075E54]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Agent Personality" 
      subtitle="Configure how your AI assistant interacts with customers"
      actions={
        <Button 
          onClick={handleSubmit} 
          className="bg-[#25D366] hover:bg-[#128C7E] text-white"
          disabled={updateConfigMutation.isPending}
        >
          {updateConfigMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-none shadow-sm bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#25D366]" />
              Core Identity
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="agentName">Agent Name</Label>
                <Input
                  id="agentName"
                  placeholder="e.g. Sarah from RealEstatePro"
                  value={formData.agentName}
                  onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                  className="bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#25D366]"
                />
                <p className="text-[10px] text-slate-400">This is how the agent will introduce itself.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="personality">Personality & Tone</Label>
                <Textarea
                  id="personality"
                  placeholder="e.g. Helpful, professional, and slightly casual. Focus on being empathetic to customer needs."
                  className="min-h-[120px] bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#25D366]"
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                />
              </div>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-[#25D366]" />
              AI Model Configuration
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="aiProvider">AI Provider</Label>
                  <Select 
                    value={formData.aiProvider} 
                    onValueChange={(value: any) => setFormData({ ...formData, aiProvider: value })}
                  >
                    <SelectTrigger className="bg-slate-50 border-none focus:ring-1 focus:ring-[#25D366]">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini">Google Gemini (Default)</SelectItem>
                      <SelectItem value="openrouter">OpenRouter (Open Source)</SelectItem>
                      <SelectItem value="openai">OpenAI (GPT-4/3.5)</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aiModel">Model Name</Label>
                  <Input
                    id="aiModel"
                    placeholder={formData.aiProvider === "gemini" ? "gemini-2.0-flash" : "e.g. gpt-4o, claude-3-opus"}
                    value={formData.aiModel}
                    onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
                    className="bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#25D366]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiApiKey" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  API Key (Optional if using default Gemini)
                </Label>
                <Input
                  id="aiApiKey"
                  type="password"
                  placeholder="Enter your API key"
                  value={formData.aiApiKey}
                  onChange={(e) => setFormData({ ...formData, aiApiKey: e.target.value })}
                  className="bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#25D366]"
                />
                <p className="text-[10px] text-slate-400">
                  Leave blank to use the system's default Gemini API key.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#25D366]" />
              Sales Strategy & Knowledge
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="salesScript">Primary Sales Script / Objective</Label>
                <Textarea
                  id="salesScript"
                  placeholder="e.g. Your main goal is to qualify leads by asking about their budget and timeline, then book a discovery call."
                  className="min-h-[150px] bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#25D366]"
                  value={formData.salesScript}
                  onChange={(e) => setFormData({ ...formData, salesScript: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="escalationKeywords">Escalation Keywords (comma separated)</Label>
                <Input
                  id="escalationKeywords"
                  placeholder="human, manager, help, urgent, complaint"
                  value={formData.escalationKeywords}
                  onChange={(e) => setFormData({ ...formData, escalationKeywords: e.target.value })}
                  className="bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#25D366]"
                />
                <p className="text-[10px] text-slate-400">When these words are detected, the AI will stop responding and notify you.</p>
              </div>
            </div>
          </Card>

          {/* Meta Coexistence & Handoff Info */}
          <Card className="p-8 border-none shadow-sm bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              Meta Coexistence & Handoff
            </h3>
            <div className="space-y-4 text-sm text-slate-600">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <span className="text-lg">🤖</span> AI Active Mode
                </p>
                <p>By default, the AI agent handles all incoming messages. It will qualify leads and answer questions based on your configuration.</p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <span className="text-lg">👤</span> Human Takeover
                </p>
                <p>When you click "Take Over" in the Live Chat, the AI agent is instantly paused for that specific conversation. The AI will not respond until you click "Hand back to AI".</p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <span className="text-lg">🎯</span> Automatic Escalation
                </p>
                <p>If a customer uses any of your <strong>Escalation Keywords</strong>, the system will automatically notify you and pause the AI agent for that conversation.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <Card className="p-6 border-none shadow-sm bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
              Live Preview
            </h3>
            <p className="text-xs text-slate-500 mb-6">Test how your agent responds based on the current configuration.</p>
            <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
              <AIChatPreview 
                agentName={formData.agentName}
                personality={formData.personality}
                salesScript={formData.salesScript}
                responseStyle={formData.responseStyle}
                aiProvider={formData.aiProvider}
                aiModel={formData.aiModel}
                aiApiKey={formData.aiApiKey}
              />
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-[#DCF8C6]/30 border-l-4 border-l-[#25D366]">
            <h4 className="font-bold text-[#075E54] flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" />
              Pro Tip
            </h4>
            <p className="text-xs text-[#075E54]/80 leading-relaxed">
              Be specific about your agent's goals. Instead of "sell products", try "identify the customer's pain point and suggest the most relevant solution from our catalog."
            </p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
