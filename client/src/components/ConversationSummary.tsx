import { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Sparkles, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: string;
  content: string;
}

interface ConversationSummaryProps {
  messages: Message[];
}

export function ConversationSummary({ messages }: ConversationSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const generateSummary = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setIsOpen(true);

    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const model = "gemini-3.1-pro-preview";

      const conversationText = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const prompt = `Summarize the following WhatsApp conversation between a customer and a sales agent. 
Identify the customer's main needs, any potential leads, and the current status of the conversation.
Keep it professional and concise.

Conversation:
${conversationText}`;

      const response = await genAI.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      setSummary(response.text || "Could not generate summary.");
    } catch (error) {
      console.error("Summary Error:", error);
      setSummary("Error: Failed to generate summary.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen && !summary) {
    return (
      <Button
        onClick={generateSummary}
        variant="outline"
        size="sm"
        className="border-[#25D366] text-[#075E54] hover:bg-[#DCF8C6] flex items-center gap-2 rounded-full px-4"
      >
        <Sparkles className="w-4 h-4" />
        AI Summary
      </Button>
    );
  }

  return (
    <Card className="p-4 border-[#25D366] bg-[#DCF8C6]/30 relative animate-in fade-in slide-in-from-top-2 rounded-xl shadow-sm">
      <button
        onClick={() => {
          setIsOpen(false);
          setSummary(null);
        }}
        className="absolute top-2 right-2 p-1 hover:bg-[#DCF8C6] rounded-full text-[#075E54]"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-center gap-2 mb-3 text-[#075E54]">
        <Sparkles className="w-4 h-4" />
        <h4 className="font-bold text-xs uppercase tracking-wider">AI Conversation Summary</h4>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-[#25D366]" />
          <span className="text-xs text-slate-600 italic">Analyzing conversation...</span>
        </div>
      ) : (
        <div className="text-xs prose prose-sm max-w-none text-slate-800 leading-relaxed">
          <ReactMarkdown>{summary || ""}</ReactMarkdown>
        </div>
      )}
    </Card>
  );
}
