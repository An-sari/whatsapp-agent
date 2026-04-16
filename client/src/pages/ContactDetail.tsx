import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, MessageCircle, Tag, TrendingUp, Heart, Clock, ArrowLeft, 
  Save, Loader2, Plus, X, History, Zap, Play, Square, MessageSquare, Globe, Send,
  Calendar, Trash2
} from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { DashboardLayout } from "@/components/DashboardLayout";

export default function ContactDetail() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute<{ id: string }>("/contacts/:id");
  const contactId = params ? parseInt(params.id) : 0;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    firstName: "",
    lastName: "",
    email: "",
    segment: "",
    leadScore: 0,
    notes: "",
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");

  const { data: contact, isLoading, refetch } = trpc.whatsapp.getContactDetail.useQuery(
    { contactId },
    { enabled: !!contactId }
  );

  const getOrCreateConversationMutation = trpc.whatsapp.getOrCreateConversation.useMutation({
    onSuccess: (conversation) => {
      setLocation(`/conversations?id=${conversation.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start conversation");
    },
  });

  const handleStartConversation = () => {
    if (!contact) return;
    getOrCreateConversationMutation.mutate({
      contactId: contact.id,
      phoneNumber: contact.phoneNumber,
    });
  };

  const { data: history } = trpc.whatsapp.getContactHistory.useQuery(
    { contactId },
    { enabled: !!contactId }
  );

  const { data: sequences } = trpc.nurture.getSequences.useQuery();
  const { data: nurtureState, refetch: refetchNurture } = trpc.nurture.getContactState.useQuery(
    { contactId },
    { enabled: !!contactId }
  );

  const { data: scheduledMessages, refetch: refetchScheduled } = trpc.whatsapp.getScheduledMessages.useQuery(
    { contactId },
    { enabled: !!contactId }
  );

  const cancelScheduledMutation = trpc.whatsapp.cancelScheduledMessage.useMutation({
    onSuccess: () => {
      toast.success("Scheduled message cancelled");
      refetchScheduled();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel message");
    }
  });

  const enrollMutation = trpc.nurture.enrollContact.useMutation({
    onSuccess: () => {
      toast.success("Contact enrolled in sequence");
      refetchNurture();
    }
  });

  const stopNurtureMutation = trpc.nurture.stopNurture.useMutation({
    onSuccess: () => {
      toast.success("Nurture sequence stopped");
      refetchNurture();
    }
  });

  const updateContactMutation = trpc.whatsapp.updateContact.useMutation({
    onSuccess: () => {
      toast.success("Contact updated successfully");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update contact: ${error.message}`);
    },
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        displayName: contact.displayName || "",
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        email: contact.email || "",
        segment: contact.segment || "",
        leadScore: contact.leadScore || 0,
        notes: contact.notes || "",
        tags: contact.tags || [],
      });
    }
  }, [contact]);

  const handleSave = async () => {
    await updateContactMutation.mutateAsync({
      contactId,
      ...formData,
    });
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Contact Details" subtitle="Loading profile...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!contact) {
    return (
      <DashboardLayout title="Contact Details" subtitle="Contact not found">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <User className="w-12 h-12 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold mb-2">Contact Not Found</h2>
          <p className="text-slate-500 mb-6">The contact you are looking for does not exist or has been deleted.</p>
          <Link href="/contacts">
            <Button className="bg-[#25D366] hover:bg-[#128C7E] text-white">Back to Contacts</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={contact.displayName || contact.phoneNumber} 
      subtitle={`Manage profile and CRM data for ${contact.phoneNumber}`}
      actions={
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleStartConversation} 
            disabled={getOrCreateConversationMutation.isPending}
            className="bg-[#25D366] hover:bg-[#128C7E] text-white shadow-lg shadow-[#25D366]/20"
          >
            {getOrCreateConversationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
            Message
          </Button>
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-slate-500 hover:bg-slate-100">
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={updateContactMutation.isPending}
                className="bg-[#075E54] text-white hover:bg-[#054d44]"
              >
                {updateContactMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="border-slate-200">
              Edit Profile
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile & History */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-none shadow-sm bg-white overflow-hidden relative">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
              <div className="w-32 h-32 bg-slate-50 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-inner border border-slate-100">
                <User className="w-16 h-16 text-slate-200" />
              </div>
              <div className="flex-1 space-y-6 w-full">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Display Name</Label>
                      <Input 
                        value={formData.displayName} 
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        className="bg-slate-50 border-none focus-visible:ring-[#25D366]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</Label>
                      <Input 
                        value={formData.email} 
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-slate-50 border-none focus-visible:ring-[#25D366]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">First Name</Label>
                      <Input 
                        value={formData.firstName} 
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="bg-slate-50 border-none focus-visible:ring-[#25D366]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Name</Label>
                      <Input 
                        value={formData.lastName} 
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="bg-slate-50 border-none focus-visible:ring-[#25D366]"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl font-bold text-slate-900">{contact.displayName || contact.phoneNumber}</h2>
                      <Badge className="bg-[#DCF8C6] text-[#075E54] border-none text-[10px] font-bold uppercase tracking-wider">
                        {contact.segment || "New Lead"}
                      </Badge>
                    </div>
                    <p className="text-slate-500 font-medium flex items-center gap-2 text-sm">
                      <MessageCircle className="w-4 h-4 text-[#25D366]" />
                      {contact.phoneNumber}
                      {contact.email && <span className="text-slate-200 mx-1">•</span>}
                      {contact.email && <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-blue-400" />{contact.email}</span>}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-6">
                      {contact.tags?.map(tag => (
                        <Badge key={tag} className="bg-slate-50 text-slate-500 border border-slate-100 px-3 py-1 rounded-full text-[10px] font-bold">
                          {tag}
                        </Badge>
                      ))}
                      {(!contact.tags || contact.tags.length === 0) && (
                        <span className="text-xs text-slate-300 italic">No tags assigned</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Decorative element */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-slate-50 rounded-full blur-3xl"></div>
          </Card>

          {/* Contact History */}
          <Card className="p-8 border-none shadow-sm bg-white">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Activity Timeline</h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-slate-400 border-slate-200">
                {history?.length || 0} Events
              </Badge>
            </div>
            
            <div className="space-y-8">
              {history && history.length > 0 ? (
                history.map((event, idx) => (
                  <div key={event.id} className="relative pl-10 pb-8 last:pb-0">
                    {idx !== history.length - 1 && (
                      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-100"></div>
                    )}
                    <div className="absolute left-0 top-1 w-8 h-8 bg-white border border-slate-100 rounded-xl flex items-center justify-center z-10 shadow-sm">
                      {event.eventType === 'message_received' ? <MessageCircle className="w-4 h-4 text-[#25D366]" /> : 
                       event.eventType === 'message_sent' ? <Send className="w-4 h-4 text-blue-500" /> :
                       <Zap className="w-4 h-4 text-orange-500" />}
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <h4 className="font-bold text-slate-800 capitalize text-sm">{event.eventType.replace(/_/g, " ")}</h4>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs text-slate-500 leading-relaxed font-mono">
                        {typeof event.metadata === 'string' ? event.metadata : JSON.stringify(event.metadata, null, 2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                  <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No activity recorded yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: CRM Data */}
        <div className="space-y-6">
          {/* Sales Intelligence */}
          <Card className="p-6 border-none shadow-sm bg-white">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Sales Intelligence</h3>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-[#25D366]" />
                    Lead Score
                  </span>
                  <span className="text-xl font-black text-[#075E54]">{isEditing ? formData.leadScore : contact.leadScore}</span>
                </div>
                {isEditing ? (
                  <Input 
                    type="number" 
                    value={formData.leadScore} 
                    onChange={(e) => setFormData({ ...formData, leadScore: parseInt(e.target.value) })}
                    className="bg-slate-50 border-none h-8 text-xs"
                  />
                ) : (
                  <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#25D366] h-full transition-all duration-1000" style={{ width: `${Math.min(contact.leadScore || 0, 100)}%` }}></div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-red-500" />
                  Sentiment
                </span>
                <div className="flex gap-2">
                  <Badge className={`px-4 py-1.5 border-none capitalize text-[10px] font-bold ${
                    contact.sentiment === "positive" ? "bg-green-100 text-green-700" : 
                    contact.sentiment === "negative" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                  }`}>
                    {contact.sentiment || "Neutral"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-blue-500" />
                  Segment
                </span>
                {isEditing ? (
                  <Input 
                    value={formData.segment} 
                    onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                    placeholder="e.g. VIP, Enterprise"
                    className="bg-slate-50 border-none h-8 text-xs"
                  />
                ) : (
                  <Badge className="bg-blue-50 text-blue-600 border border-blue-100 px-4 py-1.5 text-[10px] font-bold">
                    {contact.segment || "Unassigned"}
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          {/* Tag Manager */}
          {isEditing && (
            <Card className="p-6 border-none shadow-sm bg-white">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Tag Manager</h3>
              <div className="flex gap-2 mb-4">
                <Input 
                  placeholder="Add tag..." 
                  value={newTag} 
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  className="bg-slate-50 border-none h-9 text-xs"
                />
                <Button onClick={addTag} size="icon" className="bg-[#25D366] hover:bg-[#128C7E] rounded-xl shrink-0 h-9 w-9">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} className="bg-slate-50 text-slate-500 border border-slate-100 pl-3 pr-1 py-1 flex items-center gap-1 text-[10px] font-bold">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-500 p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Internal Notes */}
          <Card className="p-6 border-none shadow-sm bg-white">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Internal Notes</h3>
            {isEditing ? (
              <Textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add private notes..."
                className="bg-slate-50 border-none min-h-[120px] text-xs resize-none"
              />
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed italic">
                {contact.notes || "No internal notes for this contact."}
              </p>
            )}
          </Card>

          {/* Nurture Engine */}
          <Card className="p-6 border-none shadow-sm bg-white">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#25D366]" />
              Nurture Engine
            </h3>
            
            {nurtureState && nurtureState.status === 'active' ? (
              <div className="space-y-4">
                <div className="bg-[#DCF8C6]/30 p-5 rounded-2xl border border-[#DCF8C6]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#075E54]">Sequence Active</span>
                    <div className="w-2 h-2 bg-[#25D366] rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-1 mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Follow-up</p>
                    <p className="text-xs text-slate-700 font-medium">
                      {nurtureState.nextRunAt ? new Date(nurtureState.nextRunAt).toLocaleString() : 'Pending'}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full h-9 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 font-bold"
                    onClick={() => stopNurtureMutation.mutate({ contactId })}
                    disabled={stopNurtureMutation.isPending}
                  >
                    <Square className="w-3 h-3 mr-2 fill-current" />
                    Stop Sequence
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                  Enroll this contact in an automated follow-up sequence to keep the conversation warm.
                </p>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Sequence</Label>
                  <Select onValueChange={(val) => enrollMutation.mutate({ contactId, sequenceId: parseInt(val) })}>
                    <SelectTrigger className="bg-slate-50 border-none h-9 text-xs">
                      <SelectValue placeholder="Choose sequence..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sequences?.map(seq => (
                        <SelectItem key={seq.id} value={seq.id.toString()}>{seq.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {sequences?.length === 0 && (
                  <p className="text-[10px] text-orange-400 italic">
                    No sequences found. Create one in the <Link href="/nurture" className="underline">Nurture Engine</Link>.
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Scheduled Messages */}
          <Card className="p-6 border-none shadow-sm bg-white">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Scheduled Follow-ups
            </h3>
            
            <div className="space-y-4">
              {scheduledMessages && scheduledMessages.length > 0 ? (
                scheduledMessages.filter(m => m.status === 'pending').map(msg => (
                  <div key={msg.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(msg.scheduledAt).toLocaleString()}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => cancelScheduledMutation.mutate({ messageId: msg.id })}
                        disabled={cancelScheduledMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{msg.content}</p>
                    {msg.messageType === 'interactive' && (
                      <Badge variant="outline" className="mt-2 text-[8px] border-blue-200 text-blue-500">Interactive</Badge>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-400 italic">No messages scheduled.</p>
              )}
              <Link href={`/conversations?id=${contactId}`}>
                <Button variant="outline" className="w-full h-9 text-xs border-slate-200 text-slate-500 hover:bg-slate-50 font-bold mt-2">
                  <Plus className="w-3 h-3 mr-2" />
                  Schedule New
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
