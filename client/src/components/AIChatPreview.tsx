import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";
import { MessageCircle, Send, User, Bot, Loader2, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "model";
  content: string;
}

interface AIChatPreviewProps {
  agentName: string;
  personality: string;
  salesScript: string;
  responseStyle: string;
  aiProvider: "gemini" | "openrouter" | "openai" | "anthropic";
  aiModel: string;
  aiApiKey: string;
}

export function AIChatPreview({
  agentName,
  personality,
  salesScript,
  responseStyle,
  aiProvider,
  aiModel,
  aiApiKey,
}: AIChatPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const previewMutation = trpc.whatsapp.previewAgentResponse.useMutation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const aiResponse = await previewMutation.mutateAsync({
        message: userMessage,
        agentName,
        personality,
        salesScript,
        responseStyle,
        aiProvider,
        aiModel,
        aiApiKey,
        history: messages,
      });

      setMessages((prev) => [...prev, { role: "model", content: aiResponse as string }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Error: Failed to connect to AI. Please check your configuration." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px] card-whatsapp overflow-hidden bg-[#E5DDD5] relative border-none shadow-xl">
      {/* WhatsApp Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>

      <div className="p-4 bg-[#075E54] flex items-center gap-3 z-10">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">{agentName || "AI Sales Agent"}</h3>
          <p className="text-[10px] text-[#25D366] font-medium uppercase tracking-wider">online</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6 z-10" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="inline-block bg-[#FFF9C4] px-4 py-2 rounded-lg shadow-sm text-[11px] text-slate-600 font-medium">
                🔒 Messages are end-to-end encrypted. No one outside of this chat can read them.
              </div>
              <p className="text-slate-400 text-xs mt-6 italic">
                Start a conversation to test your agent's personality.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-3 py-1.5 rounded-lg shadow-sm relative ${
                  msg.role === "user"
                    ? "bg-[#DCF8C6] text-black rounded-tr-none"
                    : "bg-white text-black rounded-tl-none"
                }`}
              >
                <div className="text-sm prose prose-sm max-w-none prose-p:my-0 prose-p:leading-relaxed">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                <div className="flex justify-end items-center gap-1 mt-1">
                  <p className="text-[9px] text-slate-400 uppercase">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {msg.role === "user" && (
                    <div className="flex">
                      <Check className="w-3 h-3 text-blue-400" />
                      <Check className="w-3 h-3 text-blue-400 -ml-2" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white px-3 py-2 rounded-lg rounded-tl-none shadow-sm flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 bg-[#F0F2F5] z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 items-end"
        >
          <div className="flex-1 bg-white rounded-2xl px-4 py-2 shadow-sm border border-slate-100">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message"
              className="border-none focus-visible:ring-0 p-0 h-8 text-sm"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-[#25D366] text-white hover:bg-[#128C7E] rounded-full w-10 h-10 p-0 flex-shrink-0 shadow-md"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
