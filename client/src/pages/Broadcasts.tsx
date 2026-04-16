import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  Megaphone, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Users,
  MoreVertical,
  Filter,
  Smartphone
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function Broadcasts() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ 
    name: "", 
    content: "", 
    configId: "",
    isTemplate: false,
    templateName: "",
    languageCode: "en_US"
  });
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [retargetingCampaign, setRetargetingCampaign] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: broadcasts, isLoading } = trpc.whatsapp.getBroadcasts.useQuery();
  const { data: contacts } = trpc.whatsapp.getContacts.useQuery();
  const { data: configs } = trpc.whatsapp.getConfigs.useQuery();
  
  const createMutation = trpc.whatsapp.createBroadcast.useMutation({
    onSuccess: () => {
      toast.success("Campaign created successfully");
      setIsCreateOpen(false);
      setNewCampaign({ 
        name: "", 
        content: "", 
        configId: "",
        isTemplate: false,
        templateName: "",
        languageCode: "en_US"
      });
      setSelectedContacts([]);
      setRetargetingCampaign(null);
      utils.whatsapp.getBroadcasts.invalidate();
    }
  });

  const sendMutation = trpc.whatsapp.sendBroadcast.useMutation({
    onSuccess: (data) => {
      toast.success(`Broadcast sent to ${data.sentCount} contacts`);
      utils.whatsapp.getBroadcasts.invalidate();
    }
  });

  const handleCreate = () => {
    if (!newCampaign.name || (!newCampaign.isTemplate && !newCampaign.content) || (newCampaign.isTemplate && !newCampaign.templateName) || selectedContacts.length === 0) {
      toast.error("Please fill in all required fields and select at least one contact");
      return;
    }
    createMutation.mutate({
      name: newCampaign.name,
      content: newCampaign.content,
      contactIds: selectedContacts,
      configId: newCampaign.configId ? parseInt(newCampaign.configId) : undefined,
      isTemplate: newCampaign.isTemplate,
      templateName: newCampaign.templateName,
      languageCode: newCampaign.languageCode,
      retargetFromId: retargetingCampaign?.id,
    });
  };

  const handleRetarget = async (campaignId: number) => {
    const detail = await utils.whatsapp.getBroadcastDetail.fetch({ campaignId });
    if (!detail) return;

    // Filter contacts who read but didn't reply
    // For now, we'll just filter those who read the message
    const readContactIds = detail.recipients
      .filter(r => r.status === "read")
      .map(r => r.contactId);

    if (readContactIds.length === 0) {
      toast.error("No contacts found who have read the message yet.");
      return;
    }

    setRetargetingCampaign(detail.campaign);
    setNewCampaign({
      name: `Retarget: ${detail.campaign.name}`,
      content: "",
      configId: detail.campaign.configId?.toString() || "",
      isTemplate: true,
      templateName: "",
      languageCode: "en_US"
    });
    setSelectedContacts(readContactIds);
    setIsCreateOpen(true);
  };

  const filteredContacts = contacts?.filter(c => 
    c.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phoneNumber.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Completed</Badge>;
      case "sending": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none animate-pulse">Sending...</Badge>;
      case "failed": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Failed</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none">Draft</Badge>;
    }
  };

  return (
    <DashboardLayout 
      title="Broadcast Campaigns" 
      subtitle="Send bulk messages to your contacts"
      actions={
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#25D366] hover:bg-[#128C7E] text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{retargetingCampaign ? "Create Retargeting Campaign" : "Create New Broadcast"}</DialogTitle>
              <DialogDescription>
                {retargetingCampaign 
                  ? `Retargeting users from "${retargetingCampaign.name}" who read the message.`
                  : "Compose your message and select recipients."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campaign Name</Label>
                  <Input 
                    placeholder="e.g. Summer Sale 2024" 
                    value={newCampaign.name}
                    onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Send From Number</Label>
                  <Select 
                    value={newCampaign.configId} 
                    onValueChange={val => setNewCampaign({...newCampaign, configId: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select WhatsApp Number" />
                    </SelectTrigger>
                    <SelectContent>
                      {configs?.map(config => (
                        <SelectItem key={config.id} value={config.id.toString()}>
                          {config.nickname || config.phoneNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-4 bg-slate-50 rounded-lg">
                <Checkbox 
                  id="is-template" 
                  checked={newCampaign.isTemplate}
                  onCheckedChange={(checked) => setNewCampaign({...newCampaign, isTemplate: !!checked})}
                />
                <Label htmlFor="is-template" className="cursor-pointer">Use Meta-Approved Template</Label>
              </div>

              {newCampaign.isTemplate ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input 
                      placeholder="e.g. summer_sale_alert" 
                      value={newCampaign.templateName}
                      onChange={e => setNewCampaign({...newCampaign, templateName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Language Code</Label>
                    <Input 
                      placeholder="e.g. en_US" 
                      value={newCampaign.languageCode}
                      onChange={e => setNewCampaign({...newCampaign, languageCode: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Message Content</Label>
                  <Textarea 
                    placeholder="Write your message here..." 
                    className="min-h-[120px]"
                    value={newCampaign.content}
                    onChange={e => setNewCampaign({...newCampaign, content: e.target.value})}
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Select Recipients ({selectedContacts.length})</label>
                  <div className="relative w-48">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search..." 
                      className="pl-8 h-9" 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="h-[200px] border rounded-md p-4">
                  <div className="space-y-3">
                    {filteredContacts?.map(contact => (
                      <div key={contact.id} className="flex items-center space-x-3">
                        <Checkbox 
                          id={`contact-${contact.id}`} 
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedContacts([...selectedContacts, contact.id]);
                            else setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                          }}
                        />
                        <label htmlFor={`contact-${contact.id}`} className="text-sm flex flex-col cursor-pointer">
                          <span className="font-medium">{contact.displayName}</span>
                          <span className="text-xs text-slate-500">{contact.phoneNumber}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateOpen(false);
                setRetargetingCampaign(null);
              }}>Cancel</Button>
              <Button 
                className="bg-[#25D366] hover:bg-[#128C7E] text-white"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Campaign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#25D366]"></div>
          </div>
        ) : broadcasts?.length === 0 ? (
          <Card className="border-dashed border-2 flex flex-col items-center justify-center py-20 bg-slate-50/50">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Megaphone className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No campaigns yet</h3>
            <p className="text-slate-500 text-sm max-w-xs text-center mt-1">
              Create your first broadcast campaign to reach multiple contacts at once.
            </p>
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {broadcasts?.map((campaign) => (
              <Card key={campaign.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        {campaign.retargetFromId && <Badge variant="outline" className="text-[10px] uppercase">Retarget</Badge>}
                      </div>
                      <CardDescription className="text-xs">
                        Created {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                      </CardDescription>
                    </div>
                    {getStatusBadge(campaign.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-slate-600 line-clamp-2 bg-slate-50 p-3 rounded-lg italic">
                    {campaign.isTemplate ? (
                      <span className="flex items-center gap-2">
                        <Smartphone className="w-3 h-3" />
                        Template: {campaign.templateName}
                      </span>
                    ) : (
                      `"${campaign.content}"`
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 mb-0.5">Sent</div>
                      <div className="text-sm font-bold text-slate-900">{campaign.sentCount}</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 mb-0.5">Delivered</div>
                      <div className="text-sm font-bold text-slate-900">{campaign.deliveredCount || 0}</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 mb-0.5">Read</div>
                      <div className="text-sm font-bold text-slate-900">{campaign.readCount || 0}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {campaign.status === "draft" && (
                      <Button 
                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                        onClick={() => sendMutation.mutate({ campaignId: campaign.id })}
                        disabled={sendMutation.isPending}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Now
                      </Button>
                    )}
                    {campaign.status === "sending" && (
                      <Button disabled className="w-full">
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </Button>
                    )}
                    {campaign.status === "completed" && (
                      <>
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium py-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Campaign Completed
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
                          onClick={() => handleRetarget(campaign.id)}
                        >
                          <Megaphone className="w-4 h-4 mr-2" />
                          Retarget Readers
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
