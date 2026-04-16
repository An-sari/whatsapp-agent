import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, Send, Search, X, Sparkles, Loader2, Check, 
  CheckCheck, Info, User, Tag, TrendingUp, Heart, AlertCircle, 
  Mic, Webhook, ArrowLeft, Beaker, Smile, Paperclip, Image as ImageIcon,
  FileText, Music, Video, MessageSquare, Calendar, List, MousePointer2,
  Clock, Trash2, Plus
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { ConversationSummary } from "@/components/ConversationSummary";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Sidebar } from "@/components/Sidebar";

export default function Conversations() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1]);
  const initialId = queryParams.get('id');

  const [selectedConversation, setSelectedConversation] = useState<number | null>(
    initialId ? parseInt(initialId) : null
  );
  const [isMobileView, setIsMobileView] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Handle responsive view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (initialId) {
      const id = parseInt(initialId);
      if (!isNaN(id)) {
        setSelectedConversation(id);
      }
    }
  }, [initialId]);

  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMetadata, setShowMetadata] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isInteractiveOpen, setIsInteractiveOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [interactiveType, setInteractiveType] = useState<"button" | "list">("button");
  const [interactiveData, setInteractiveData] = useState<any>({
    type: "button",
    header: { type: "text", text: "" },
    body: { text: "" },
    footer: { text: "" },
    action: {
      buttons: [
        { type: "reply", reply: { id: "btn1", title: "Yes" } },
        { type: "reply", reply: { id: "btn2", title: "No" } }
      ]
    }
  });

  useEffect(() => {
    if (interactiveType === "button") {
      if (!interactiveData.action.buttons) {
        setInteractiveData(prev => ({
          ...prev,
          action: {
            buttons: [
              { type: "reply", reply: { id: "btn1", title: "Yes" } },
              { type: "reply", reply: { id: "btn2", title: "No" } }
            ]
          }
        }));
      }
    } else {
      if (!interactiveData.action.sections) {
        setInteractiveData(prev => ({
          ...prev,
          action: {
            button: "View Options",
            sections: [
              {
                title: "Options",
                rows: [
                  { id: "row1", title: "Option 1", description: "" }
                ]
              }
            ]
          }
        }));
      }
    }
  }, [interactiveType]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const emojis = ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😻", "😼", "😽", "🙀", "😿", "😾"];

  const [simulateData, setSimulateData] = useState({
    from: "1234567890",
    message: "Hello, I have a question about your services.",
  });

  const utils = trpc.useContext();
  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = trpc.whatsapp.getConversations.useQuery(
    undefined,
    { refetchInterval: 5000 }
  );

  // ... existing code ...

  const simulateMutation = trpc.whatsapp.simulateIncomingMessage.useMutation({
    onSuccess: () => {
      toast.success("Incoming message simulated!");
      setIsSimulateOpen(false);
      utils.whatsapp.getConversations.invalidate();
      if (selectedConversation) utils.whatsapp.getConversationDetail.invalidate({ conversationId: selectedConversation });
    },
    onError: (error) => {
      toast.error(error.message || "Simulation failed");
    },
  });

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    simulateMutation.mutate(simulateData);
  };

  const markAsReadMutation = trpc.whatsapp.markConversationAsRead.useMutation();

  const toggleHumanAgentMutation = trpc.whatsapp.toggleHumanAgent.useMutation({
    onSuccess: () => {
      utils.whatsapp.getConversationDetail.invalidate({ conversationId: selectedConversation! });
      utils.whatsapp.getConversations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to toggle agent");
    }
  });

  // Fetch conversation detail
  const { data: conversationDetail, refetch: refetchDetail } = trpc.whatsapp.getConversationDetail.useQuery(
    { conversationId: selectedConversation! },
    { 
      enabled: !!selectedConversation,
      refetchInterval: 3000
    }
  );

  useEffect(() => {
    if (selectedConversation && conversationDetail?.messages) {
      const hasUnread = conversationDetail.messages.some(
        m => m.sender === "customer" && m.status !== "read"
      );
      if (hasUnread) {
        markAsReadMutation.mutate({ conversationId: selectedConversation });
      }
    }
  }, [selectedConversation, conversationDetail?.messages]);

  // Fetch smart suggestion
  const { data: smartSuggestion, isLoading: suggestionLoading, refetch: refetchSuggestion } = trpc.whatsapp.getSmartSuggestion.useQuery(
    { conversationId: selectedConversation! },
    { enabled: !!selectedConversation && !showMetadata }
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationDetail?.messages]);

  const addEmoji = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // In a real app, we would upload to S3 or a server
      // For now, we'll simulate it with a data URL or just a toast
      toast.info(`Uploading ${file.name}...`);
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("File uploaded successfully! (Simulated)");
      // In a real implementation, we would get a URL back and set it in the message
      setMessageText(prev => prev + ` [Attached: ${file.name}]`);
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Send message mutation
  const sendMessageMutation = trpc.whatsapp.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetchDetail();
    },
  });

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !conversationDetail) return;

    await sendMessageMutation.mutateAsync({
      conversationId: selectedConversation,
      phoneNumber: conversationDetail.conversation.whatsappContactId,
      message: messageText,
      configId: conversationDetail.conversation.configId || undefined,
    });
  };

  const handleSendInteractive = async () => {
    if (!selectedConversation || !conversationDetail) return;

    const data = interactiveType === "button" ? {
      type: "button",
      header: interactiveData.header.text ? interactiveData.header : undefined,
      body: interactiveData.body,
      footer: interactiveData.footer.text ? interactiveData.footer : undefined,
      action: interactiveData.action
    } : {
      type: "list",
      header: interactiveData.header.text ? interactiveData.header : undefined,
      body: interactiveData.body,
      footer: interactiveData.footer.text ? interactiveData.footer : undefined,
      action: interactiveData.action
    };

    await sendMessageMutation.mutateAsync({
      conversationId: selectedConversation,
      phoneNumber: conversationDetail.conversation.whatsappContactId,
      message: interactiveData.body.text,
      type: "interactive",
      interactiveData: data,
      configId: conversationDetail.conversation.configId || undefined,
    });

    setIsInteractiveOpen(false);
  };

  const scheduleMutation = trpc.whatsapp.scheduleMessage.useMutation({
    onSuccess: () => {
      toast.success("Message scheduled successfully!");
      setIsScheduleOpen(false);
      setMessageText("");
    },
    onError: (error) => {
      toast.error(error.message || "Scheduling failed");
    }
  });

  const handleScheduleMessage = () => {
    if (!messageText.trim() || !selectedConversation || !conversationDetail || !scheduledDate || !scheduledTime) {
      toast.error("Please fill in all fields");
      return;
    }

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    scheduleMutation.mutate({
      contactId: conversationDetail.conversation.contactId,
      content: messageText,
      scheduledAt,
      type: "text"
    });
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      toast.info("Voice message recorded and transcribed (Simulated)");
      setMessageText("I'm interested in your services, can you tell me more?");
    } else {
      setIsRecording(true);
      toast.info("Recording voice message...");
    }
  };

  // Interactive Message Builder Helpers
  const addButton = () => {
    if (interactiveData.action.buttons.length >= 3) return;
    const newButtons = [
      ...interactiveData.action.buttons,
      { type: "reply", reply: { id: `btn${interactiveData.action.buttons.length + 1}`, title: "New Button" } }
    ];
    setInteractiveData({
      ...interactiveData,
      action: { ...interactiveData.action, buttons: newButtons }
    });
  };

  const removeButton = (index: number) => {
    const newButtons = interactiveData.action.buttons.filter((_: any, i: number) => i !== index);
    setInteractiveData({
      ...interactiveData,
      action: { ...interactiveData.action, buttons: newButtons }
    });
  };

  const updateButton = (index: number, title: string) => {
    const newButtons = [...interactiveData.action.buttons];
    newButtons[index] = { ...newButtons[index], reply: { ...newButtons[index].reply, title } };
    setInteractiveData({
      ...interactiveData,
      action: { ...interactiveData.action, buttons: newButtons }
    });
  };

  const addListSection = () => {
    const newSections = [
      ...(interactiveData.action.sections || []),
      { title: "New Section", rows: [{ id: `row${Date.now()}`, title: "New Option", description: "" }] }
    ];
    setInteractiveData({
      ...interactiveData,
      action: { ...interactiveData.action, sections: newSections }
    });
  };

  const removeSection = (index: number) => {
    const newSections = interactiveData.action.sections.filter((_: any, i: number) => i !== index);
    setInteractiveData({
      ...interactiveData,
      action: { ...interactiveData.action, sections: newSections }
    });
  };

  const updateSectionTitle = (index: number, title: string) => {
    const newSections = [...interactiveData.action.sections];
    newSections[index] = { ...newSections[index], title };
    setInteractiveData({
      ...interactiveData,
      action: { ...interactiveData.action, sections: newSections }
    });
  };

  const addRow = (sectionIndex: number) => {
    const newSections = [...interactiveData.action.sections];
    newSections[sectionIndex].rows.push({
      id: `row${Date.now()}`,
      title: "New Option",
      description: ""
    });
    setInteractiveData({
      ...interactiveData,
      action: { ...interactiveData.action, sections: newSections }
    });
  };

  const removeRow = (sectionIndex: number, rowIndex: number) => {
    const newSections = [...interactiveData.action.sections];
    newSections[sectionIndex].rows = newSections[sectionIndex].rows.filter((_: any, i: number) => i !== rowIndex);
    setInteractiveData({
      ...interactiveData,
      action: { ...interactiveData.action, sections: newSections }
    });
  };

  const updateRow = (sectionIndex: number, rowIndex: number, field: string, value: string) => {
    const newSections = [...interactiveData.action.sections];
    newSections[sectionIndex].rows[rowIndex] = {
      ...newSections[sectionIndex].rows[rowIndex],
      [field]: value
    };
    setInteractiveData({
      ...interactiveData,
      action: { ...interactiveData.action, sections: newSections }
    });
  };

  const applySuggestion = () => {
    if (smartSuggestion) {
      setMessageText(smartSuggestion);
    }
  };

  const interactiveTemplates = [
    {
      name: "Lead Qualification",
      type: "button",
      data: {
        header: { type: "text", text: "☀️ Solar Inquiry" },
        body: { text: "Hi! I'm your AI assistant. Are you interested in getting a free solar quote today?" },
        footer: { text: "Get started in seconds" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "yes", title: "Yes, please!" } },
            { type: "reply", reply: { id: "no", title: "Not right now" } }
          ]
        }
      }
    },
    {
      name: "Service Menu",
      type: "list",
      data: {
        header: { type: "text", text: "Our Services" },
        body: { text: "Please select a service from the list below to learn more." },
        footer: { text: "Select one option" },
        action: {
          button: "View Services",
          sections: [
            {
              title: "Solar Solutions",
              rows: [
                { id: "residential", title: "Residential Solar", description: "Solar panels for your home" },
                { id: "commercial", title: "Commercial Solar", description: "Solar for businesses" }
              ]
            },
            {
              title: "Support",
              rows: [
                { id: "maintenance", title: "Maintenance", description: "Schedule a repair or cleaning" },
                { id: "billing", title: "Billing", description: "Questions about your invoice" }
              ]
            }
          ]
        }
      }
    }
  ];

  const applyTemplate = (template: any) => {
    setInteractiveType(template.type);
    setInteractiveData({
      ...template.data,
      type: template.type
    });
    toast.success(`Applied ${template.name} template`);
  };

  const { data: configs } = trpc.whatsapp.getConfigs.useQuery();

  const filteredConversations =
    conversations?.filter((conv) => conv.whatsappContactId.includes(searchQuery)) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="w-3.5 h-3.5 text-slate-400" />;
      case "delivered":
        return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />;
      case "read":
        return <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />;
      case "failed":
        return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <Check className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive": return "text-green-600 bg-green-50";
      case "negative": return "text-red-600 bg-red-50";
      default: return "text-slate-600 bg-slate-50";
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Header */}
      <header className="whatsapp-header">
        <div className="container py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <MessageCircle className="text-[#075E54] w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">{t('conversations.title')}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={isSimulateOpen} onOpenChange={setIsSimulateOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                    <Beaker className="w-4 h-4 mr-2" />
                    Test Simulation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Simulate Incoming Message</DialogTitle>
                    <DialogDescription>
                      This will simulate a message arriving from WhatsApp. Use it to test your AI agent and nurture sequences.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSimulate} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="sim-from">From (Phone Number)</Label>
                      <Input 
                        id="sim-from" 
                        placeholder="e.g. 1234567890" 
                        value={simulateData.from}
                        onChange={(e) => setSimulateData({...simulateData, from: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sim-message">Message Content</Label>
                      <Textarea 
                        id="sim-message" 
                        placeholder="Type a message to simulate..." 
                        value={simulateData.message}
                        onChange={(e) => setSimulateData({...simulateData, message: e.target.value})}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsSimulateOpen(false)}>Cancel</Button>
                      <Button type="submit" className="bg-[#25D366] hover:bg-[#128C7E]" disabled={simulateMutation.isPending}>
                        {simulateMutation.isPending ? "Simulating..." : "Simulate Message"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <Link href="/">
                <Button variant="ghost" className="text-white hover:bg-white/10 flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {t('common.back')}
                </Button>
              </Link>
              <Link href="/integrations">
                <Button variant="ghost" className="text-white hover:bg-white/10 flex items-center gap-2">
                  <Webhook className="w-4 h-4" />
                  {t('nav.integrations')}
                </Button>
              </Link>
              <Link href="/contacts">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Contacts
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full h-[calc(100vh-80px)] px-0">
        <div className="flex h-full bg-white overflow-hidden relative">
          {/* Conversations List */}
          <div className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out ${
            (isMobileView && selectedConversation) || (isFocusMode && selectedConversation) ? 'hidden' : 'w-full lg:w-1/4'
          }`}>
            <div className="p-4 bg-[#F0F2F5]">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-none bg-white rounded-lg shadow-sm focus-visible:ring-[#25D366]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversationsLoading ? (
                <div className="p-8 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">{t('common.loading')}</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-sm">{t('conversations.noConversations')}</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`w-full p-4 border-b border-slate-100 text-left hover:bg-[#F0F2F5] transition flex items-center gap-3 ${
                      selectedConversation === conv.id ? "bg-[#F0F2F5] border-l-4 border-l-[#25D366]" : ""
                    }`}
                  >
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {conv.contactDisplayName ? (
                        <div className="w-full h-full bg-[#25D366]/10 flex items-center justify-center text-[#075E54] font-bold">
                          {conv.contactDisplayName.substring(0, 2).toUpperCase()}
                        </div>
                      ) : (
                        <span className="text-slate-500 font-bold">{conv.whatsappContactId.slice(-2)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <div className="font-bold text-sm truncate">
                          {conv.contactDisplayName || conv.whatsappContactId}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ""}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs text-slate-500 truncate">
                          {conv.messageCount} messages
                        </div>
                        <div className="flex items-center gap-1">
                          {conv.humanAgentActive && (
                            <Badge className="text-[8px] px-1 py-0 bg-orange-100 text-orange-600 border-orange-200">
                              Human
                            </Badge>
                          )}
                          {(conv as any).configNickname && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 border-slate-200 text-slate-400">
                              {(conv as any).configNickname}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Conversation Detail */}
          <div className={`flex-1 bg-[#E5DDD5] flex flex-col relative transition-all duration-300 ease-in-out ${
            isMobileView && !selectedConversation ? 'hidden' : ''
          } ${showMetadata ? 'lg:w-2/4' : 'lg:w-3/4'}`}>
            {/* WhatsApp Background Pattern Overlay */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>
            
            {selectedConversation && conversationDetail ? (
              <>
                {/* Conversation Header */}
                <div className="p-3 bg-[#F0F2F5] border-b border-slate-200 flex items-center justify-between z-10 shadow-sm">
                  <div className="flex items-center gap-3">
                    {isMobileView && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedConversation(null)}
                        className="mr-1 text-slate-500 hover:bg-slate-200 rounded-full"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                    )}
                    <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center shadow-inner overflow-hidden">
                      {conversationDetail.contact?.displayName ? (
                        <div className="w-full h-full bg-[#25D366]/20 flex items-center justify-center text-[#075E54] font-bold">
                          {conversationDetail.contact.displayName.substring(0, 2).toUpperCase()}
                        </div>
                      ) : (
                        <span className="text-slate-600 font-bold text-xs">{conversationDetail.conversation.whatsappContactId.slice(-2)}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold leading-tight text-slate-800">
                        {conversationDetail.contact?.displayName || conversationDetail.conversation.whatsappContactId}
                      </h2>
                      <div className="flex items-center gap-2">
                        {conversationDetail.contact?.isOnline && (
                          <p className="text-[10px] text-[#25D366] font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-pulse"></span>
                            online
                          </p>
                        )}
                        {conversationDetail.conversation.humanAgentActive ? (
                          <Badge className="text-[9px] px-1 py-0 bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
                            Human Active
                          </Badge>
                        ) : (
                          <Badge className="text-[9px] px-1 py-0 bg-[#25D366]/10 text-[#075E54] border-[#25D366]/20 hover:bg-[#25D366]/10">
                            AI Active
                          </Badge>
                        )}
                        {conversationDetail.config && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-slate-300 text-slate-500">
                            via {conversationDetail.config.nickname || conversationDetail.config.phoneNumber}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conversationDetail.conversation.humanAgentActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[10px] gap-1.5 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                        onClick={() => toggleHumanAgentMutation.mutate({ 
                          conversationId: selectedConversation!, 
                          active: false 
                        })}
                        disabled={toggleHumanAgentMutation.isPending}
                      >
                        <Beaker className="w-3.5 h-3.5" />
                        Hand back to AI
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[10px] gap-1.5 border-[#25D366]/30 bg-[#25D366]/5 text-[#075E54] hover:bg-[#25D366]/10"
                        onClick={() => toggleHumanAgentMutation.mutate({ 
                          conversationId: selectedConversation!, 
                          active: true 
                        })}
                        disabled={toggleHumanAgentMutation.isPending}
                      >
                        <User className="w-3.5 h-3.5" />
                        Take Over
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsFocusMode(!isFocusMode)}
                      className={`rounded-full hidden lg:flex ${isFocusMode ? 'bg-slate-200 text-[#075E54]' : 'text-slate-500'}`}
                      title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
                    >
                      <TrendingUp className={`w-5 h-5 ${isFocusMode ? 'rotate-180' : ''} transition-transform`} />
                    </Button>
                    <ConversationSummary
                      messages={conversationDetail.messages.map((m) => ({
                        role: m.sender === "customer" ? "Customer" : "Agent",
                        content: m.content,
                      }))}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowMetadata(!showMetadata)}
                      className={`rounded-full ${showMetadata ? 'bg-slate-200 text-[#075E54]' : 'text-slate-500'}`}
                    >
                      <Info className="w-5 h-5" />
                    </Button>
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="p-2 hover:bg-slate-200 rounded-full text-slate-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-2 z-10 scrollbar-hide">
                  {conversationDetail.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === "customer" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-1.5 rounded-lg shadow-sm relative animate-in fade-in slide-in-from-bottom-1 duration-300 ${
                          msg.sender === "customer"
                            ? "bg-white text-black rounded-tl-none"
                            : "bg-[#DCF8C6] text-black rounded-tr-none"
                        }`}
                      >
                        <div className="flex flex-col">
                          {msg.messageType === "image" && msg.mediaUrl && (
                            <img
                              src={msg.mediaUrl}
                              alt="WhatsApp Image"
                              className="max-w-full rounded-md mb-2 cursor-pointer hover:opacity-90 transition"
                              referrerPolicy="no-referrer"
                              onClick={() => window.open(msg.mediaUrl!, "_blank")}
                            />
                          )}
                          {msg.messageType === "video" && msg.mediaUrl && (
                            <video
                              src={msg.mediaUrl}
                              controls
                              className="max-w-full rounded-md mb-2"
                            />
                          )}
                          {msg.messageType === "audio" && msg.mediaUrl && (
                            <audio
                              src={msg.mediaUrl}
                              controls
                              className="max-w-full mb-2 h-8"
                            />
                          )}
                          {msg.messageType === "document" && msg.mediaUrl && (
                            <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-md mb-2">
                              <AlertCircle className="w-5 h-5 text-slate-500" />
                              <a
                                href={msg.mediaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:underline truncate max-w-[150px]"
                              >
                                View Document
                              </a>
                            </div>
                          )}
                          {msg.messageType === "interactive" && msg.interactiveData && (
                            <div className="space-y-2 mb-2">
                              {msg.interactiveData.header && (
                                <p className="text-xs font-bold text-slate-600">{msg.interactiveData.header.text}</p>
                              )}
                              <p className="text-sm">{msg.interactiveData.body.text}</p>
                              {msg.interactiveData.footer && (
                                <p className="text-[10px] text-slate-400">{msg.interactiveData.footer.text}</p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {msg.interactiveData.action?.buttons?.map((btn: any) => (
                                  <Badge key={btn.reply.id} variant="outline" className="bg-white text-[#25D366] border-[#25D366] text-[10px] py-1">
                                    {btn.reply.title}
                                  </Badge>
                                ))}
                                {msg.interactiveData.action?.sections?.map((section: any) => (
                                  <div key={section.title} className="w-full">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{section.title}</p>
                                    <div className="flex flex-wrap gap-1">
                                      {section.rows?.map((row: any) => (
                                        <Badge key={row.id} variant="outline" className="bg-white text-blue-500 border-blue-500 text-[10px] py-1">
                                          {row.title}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {msg.isFromTemplate && (
                            <div className="flex items-center gap-1 mb-1">
                              <Badge variant="outline" className="text-[8px] px-1 py-0 border-slate-300 text-slate-500">
                                Template: {msg.templateName}
                              </Badge>
                            </div>
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <div className="flex justify-end items-center gap-1 mt-1">
                          <p className="text-[9px] text-slate-500 font-medium">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {msg.sender !== "customer" && (
                            <div className="flex items-center">
                              {getStatusIcon(msg.status)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-3 bg-[#F0F2F5] z-10 space-y-3 border-t border-slate-200">
                  {/* Smart Suggestion */}
                  {smartSuggestion && !messageText && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="bg-white/80 backdrop-blur-sm border border-[#25D366]/30 rounded-xl p-3 shadow-sm flex items-start gap-3">
                        <div className="w-8 h-8 bg-[#25D366]/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-[#25D366]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-[#075E54] uppercase tracking-wider mb-1">{t('conversations.aiSuggestion')}</p>
                          <p className="text-xs text-slate-700 italic">"{smartSuggestion}"</p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={applySuggestion}
                            className="text-[#25D366] p-0 h-auto text-xs font-bold mt-1"
                          >
                            {t('conversations.useReply')}
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => refetchSuggestion()} className="rounded-full h-6 w-6">
                          <Loader2 className={`w-3 h-3 ${suggestionLoading ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <div className="flex items-center gap-1">
                      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-[#075E54] hover:bg-slate-200 rounded-full">
                            <Smile className="w-6 h-6" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent side="top" align="start" className="w-72 p-2">
                          <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                            {emojis.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => addEmoji(emoji)}
                                className="text-xl hover:bg-slate-100 p-1 rounded transition"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-500 hover:text-[#075E54] hover:bg-slate-200 rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Paperclip className="w-6 h-6" />}
                      </Button>

                      <Dialog open={isInteractiveOpen} onOpenChange={setIsInteractiveOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-[#075E54] hover:bg-slate-200 rounded-full">
                            <List className="w-6 h-6" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <DialogTitle>Interactive Message Builder</DialogTitle>
                                <DialogDescription>
                                  Create buttons or list messages to increase customer engagement.
                                </DialogDescription>
                              </div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className="border-[#25D366] text-[#075E54] hover:bg-[#DCF8C6]">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Templates
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-2">
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest p-2">Choose a template</p>
                                    {interactiveTemplates.map(template => (
                                      <button
                                        key={template.name}
                                        onClick={() => applyTemplate(template)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 rounded-md transition flex items-center justify-between"
                                      >
                                        {template.name}
                                        <Badge variant="outline" className="text-[8px] px-1 py-0">{template.type}</Badge>
                                      </button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-6 py-4">
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                              <div className="space-y-2">
                                <Label>Message Type</Label>
                                <div className="flex gap-2">
                                  <Button 
                                    variant={interactiveType === "button" ? "default" : "outline"}
                                    onClick={() => setInteractiveType("button")}
                                    className="flex-1"
                                  >
                                    <MousePointer2 className="w-4 h-4 mr-2" />
                                    Buttons
                                  </Button>
                                  <Button 
                                    variant={interactiveType === "list" ? "default" : "outline"}
                                    onClick={() => setInteractiveType("list")}
                                    className="flex-1"
                                  >
                                    <List className="w-4 h-4 mr-2" />
                                    List
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Header Text (Optional)</Label>
                                <Input 
                                  value={interactiveData.header.text}
                                  onChange={(e) => setInteractiveData({
                                    ...interactiveData,
                                    header: { ...interactiveData.header, text: e.target.value }
                                  })}
                                  placeholder="e.g. Welcome!"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Body Text</Label>
                                <Textarea 
                                  value={interactiveData.body.text}
                                  onChange={(e) => setInteractiveData({
                                    ...interactiveData,
                                    body: { ...interactiveData.body, text: e.target.value }
                                  })}
                                  placeholder="e.g. How can we help you today?"
                                  className="min-h-[80px]"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Footer Text (Optional)</Label>
                                <Input 
                                  value={interactiveData.footer.text}
                                  onChange={(e) => setInteractiveData({
                                    ...interactiveData,
                                    footer: { ...interactiveData.footer, text: e.target.value }
                                  })}
                                  placeholder="e.g. Reply to this message"
                                />
                              </div>

                              <div className="pt-4 border-t border-slate-100">
                                {interactiveType === "button" ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-[#075E54] font-bold">Buttons (Max 3)</Label>
                                      {interactiveData.action.buttons?.length < 3 && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          onClick={addButton}
                                          className="h-7 text-[10px] border-[#25D366] text-[#075E54] hover:bg-[#DCF8C6]"
                                        >
                                          <Plus className="w-3 h-3 mr-1" /> Add Button
                                        </Button>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      {interactiveData.action.buttons?.map((btn: any, i: number) => (
                                        <div key={i} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-200">
                                          <Input 
                                            placeholder="Button Title" 
                                            value={btn.reply.title}
                                            onChange={(e) => updateButton(i, e.target.value)}
                                            className="flex-1 h-9 text-xs"
                                            maxLength={20}
                                          />
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => removeButton(i)}
                                            className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50"
                                            disabled={interactiveData.action.buttons.length <= 1}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label className="text-[#075E54] font-bold">List Button Text</Label>
                                      <Input 
                                        value={interactiveData.action.button}
                                        onChange={(e) => setInteractiveData({
                                          ...interactiveData,
                                          action: { ...interactiveData.action, button: e.target.value }
                                        })}
                                        placeholder="e.g. View Options"
                                        className="h-9 text-xs"
                                      />
                                    </div>
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-[#075E54] font-bold">Sections & Rows</Label>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          onClick={addListSection}
                                          className="h-7 text-[10px] border-[#25D366] text-[#075E54] hover:bg-[#DCF8C6]"
                                        >
                                          <Plus className="w-3 h-3 mr-1" /> Add Section
                                        </Button>
                                      </div>
                                      {interactiveData.action.sections?.map((section: any, sIdx: number) => (
                                        <div key={sIdx} className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50/50 animate-in slide-in-from-left-2 duration-200">
                                          <div className="flex gap-2 items-center">
                                            <Input 
                                              placeholder="Section Title" 
                                              value={section.title}
                                              onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                                              className="flex-1 h-8 text-xs font-bold bg-white"
                                            />
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              onClick={() => removeSection(sIdx)}
                                              className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                              disabled={interactiveData.action.sections.length <= 1}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                          <div className="space-y-2 pl-3 border-l-2 border-[#25D366]/30">
                                            {section.rows.map((row: any, rIdx: number) => (
                                              <div key={rIdx} className="space-y-1 bg-white p-2 rounded border border-slate-100 shadow-sm">
                                                <div className="flex gap-2 items-center">
                                                  <Input 
                                                    placeholder="Row Title" 
                                                    value={row.title}
                                                    onChange={(e) => updateRow(sIdx, rIdx, 'title', e.target.value)}
                                                    className="flex-1 h-7 text-xs border-none focus-visible:ring-0 p-0"
                                                  />
                                                  <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => removeRow(sIdx, rIdx)}
                                                    className="h-6 w-6 text-red-400 hover:text-red-600"
                                                    disabled={section.rows.length <= 1}
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                  </Button>
                                                </div>
                                                <Input 
                                                  placeholder="Description (Optional)" 
                                                  value={row.description}
                                                  onChange={(e) => updateRow(sIdx, rIdx, 'description', e.target.value)}
                                                  className="h-5 text-[9px] border-none focus-visible:ring-0 p-0 text-slate-400"
                                                />
                                              </div>
                                            ))}
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              onClick={() => addRow(sIdx)}
                                              className="h-7 text-[10px] w-full border-dashed border border-slate-300 hover:bg-white hover:border-[#25D366] hover:text-[#25D366]"
                                            >
                                              <Plus className="w-3 h-3 mr-1" /> Add Row
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="space-y-4 sticky top-0">
                              <Label className="text-[#075E54] font-bold flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Live Preview
                              </Label>
                              <div className="relative">
                                {/* WhatsApp Background Pattern Overlay */}
                                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat rounded-xl"></div>
                                <Card className="p-4 bg-[#DCF8C6] border-none shadow-md rounded-xl rounded-tr-none relative z-10">
                                  {interactiveData.header.text && (
                                    <p className="text-xs font-bold text-slate-600 mb-1">{interactiveData.header.text}</p>
                                  )}
                                  <p className="text-sm mb-1">{interactiveData.body.text || "Message body goes here..."}</p>
                                  {interactiveData.footer.text && (
                                    <p className="text-[10px] text-slate-400 mb-2">{interactiveData.footer.text}</p>
                                  )}
                                  <div className="space-y-1 mt-3">
                                    {interactiveType === "button" ? (
                                      interactiveData.action.buttons?.map((btn: any, i: number) => (
                                        <div key={i} className="bg-white text-[#25D366] text-center py-2.5 rounded-lg text-xs font-bold border border-slate-100 shadow-sm">
                                          {btn.reply.title || "Button Text"}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="bg-white text-[#34B7F1] text-center py-2.5 rounded-lg text-xs font-bold border border-slate-100 shadow-sm flex items-center justify-center gap-2">
                                        <List className="w-4 h-4" />
                                        {interactiveData.action.button || "View Options"}
                                      </div>
                                    )}
                                  </div>
                                </Card>
                                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Technical Info</h5>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                      <span className="text-slate-500">Type:</span>
                                      <span className="font-mono text-[#075E54]">{interactiveType}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                      <span className="text-slate-500">Items:</span>
                                      <span className="font-mono text-[#075E54]">
                                        {interactiveType === "button" 
                                          ? `${interactiveData.action.buttons?.length || 0}/3 buttons`
                                          : `${interactiveData.action.sections?.reduce((acc: number, s: any) => acc + s.rows.length, 0) || 0}/10 rows`
                                        }
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="pt-4">
                                <Button 
                                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-6 rounded-xl font-bold shadow-lg shadow-green-100 transition-all active:scale-[0.98]"
                                  onClick={handleSendInteractive}
                                  disabled={!interactiveData.body.text || sendMessageMutation.isPending}
                                >
                                  {sendMessageMutation.isPending ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                                  ) : (
                                    <><Send className="w-4 h-4 mr-2" /> Send Interactive Message</>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-[#075E54] hover:bg-slate-200 rounded-full">
                            <Calendar className="w-6 h-6" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Schedule Follow-up</DialogTitle>
                            <DialogDescription>
                              Set a date and time to automatically send this message.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Date</Label>
                                <Input 
                                  type="date" 
                                  value={scheduledDate}
                                  onChange={(e) => setScheduledDate(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Time</Label>
                                <Input 
                                  type="time" 
                                  value={scheduledTime}
                                  onChange={(e) => setScheduledTime(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Message Content</Label>
                              <Textarea 
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Type the follow-up message..."
                                className="min-h-[100px]"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
                            <Button 
                              className="bg-[#25D366] hover:bg-[#128C7E]"
                              onClick={handleScheduleMessage}
                              disabled={scheduleMutation.isPending || !messageText.trim()}
                            >
                              {scheduleMutation.isPending ? "Scheduling..." : "Schedule Message"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="flex-1 bg-white rounded-xl px-4 py-2 shadow-sm min-h-[44px] flex items-center">
                      <Textarea
                        placeholder={t('conversations.typeMessage')}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="border-none bg-transparent focus-visible:ring-0 min-h-[24px] max-h-32 p-0 resize-none text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleVoiceRecord}
                        className={`rounded-full h-11 w-11 ${isRecording ? 'bg-red-100 text-red-500 animate-pulse' : 'text-slate-500 hover:bg-slate-200'}`}
                      >
                        <Mic className="w-6 h-6" />
                      </Button>

                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                        className="bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full h-11 w-11 p-0 flex items-center justify-center shadow-md"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5 ml-0.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 z-10 bg-[#F8F9FA]">
                <div className="text-center max-w-md p-8">
                  <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <MessageCircle className="w-16 h-16 text-[#25D366] opacity-50" />
                  </div>
                  <h3 className="text-2xl font-light text-slate-600 mb-4 tracking-tight">WhatsApp for Business</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-8">
                    Send and receive messages without keeping your phone online.<br/>
                    Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
                  </p>
                  {configs?.length === 0 && (
                    <Link href="/settings">
                      <Button className="bg-[#25D366] hover:bg-[#128C7E] text-white px-8 py-6 rounded-xl text-lg font-bold shadow-lg shadow-green-200">
                        Connect WhatsApp Account
                      </Button>
                    </Link>
                  )}
                  <div className="mt-12 flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest">
                    <CheckCheck className="w-3 h-3" />
                    End-to-end encrypted
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Metadata Panel */}
          {showMetadata && selectedConversation && conversationDetail && (
            <div className="bg-white border-l border-slate-200 overflow-y-auto animate-in slide-in-from-right duration-300">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#F0F2F5]">
                <h3 className="font-bold text-sm text-[#075E54]">Contact Info</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowMetadata(false)} className="rounded-full">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Profile */}
                <div className="text-center">
                  <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <User className="w-12 h-12 text-slate-400" />
                  </div>
                  <h4 className="font-bold text-lg">{conversationDetail.conversation.whatsappContactId}</h4>
                  <p className="text-sm text-slate-500">Customer</p>
                </div>

                {/* Lead Score & Sentiment */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3 bg-slate-50 border-none">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Lead Score</span>
                    </div>
                    <div className="text-xl font-bold text-[#075E54]">85</div>
                  </Card>
                  <Card className={`p-3 border-none ${getSentimentColor("positive")}`}>
                    <div className="flex items-center gap-2 mb-1 opacity-70">
                      <Heart className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Sentiment</span>
                    </div>
                    <div className="text-sm font-bold capitalize">Positive</div>
                  </Card>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Tag className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="bg-[#DCF8C6] text-[#075E54] border-none">New Lead</Badge>
                    <Badge variant="secondary" className="bg-[#DCF8C6] text-[#075E54] border-none">Interested</Badge>
                    <Badge variant="secondary" className="bg-[#DCF8C6] text-[#075E54] border-none">Tech</Badge>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Notes</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">
                    Customer is interested in the enterprise plan. Needs a demo scheduled for next Tuesday.
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-4">
                  <Link href={`/contacts/${conversationDetail.conversation.contactId}`}>
                    <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg">
                      View Full Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
