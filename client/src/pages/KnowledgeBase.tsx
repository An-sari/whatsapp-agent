import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Globe, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

import { DashboardLayout } from "@/components/DashboardLayout";

export default function KnowledgeBase() {
  const [url, setUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: documents, refetch } = trpc.knowledge.getDocuments.useQuery();
  
  const addDocumentMutation = trpc.knowledge.addDocument.useMutation({
    onSuccess: () => {
      toast.success("Document added and processing started");
      setUrl("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add document");
    }
  });

  const deleteDocumentMutation = trpc.knowledge.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success("Document deleted");
      refetch();
    }
  });

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    await addDocumentMutation.mutateAsync({
      name: url.replace(/^https?:\/\//, "").split("/")[0],
      type: "url",
      source: url,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        // For now, we'll just send the text if it's a simple file, 
        // or we can handle PDF parsing on the server if we send base64.
        // Let's try to send as base64 if it's a PDF.
        
        await addDocumentMutation.mutateAsync({
          name: file.name,
          type: "file",
          source: file.name,
          content: content, // This could be base64 or raw text
        });
        setIsUploading(false);
      };
      
      if (file.type === "application/pdf" || file.type === "text/csv") {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    } catch (error) {
      toast.error("Failed to read file");
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout 
      title="Knowledge Base" 
      subtitle="Train your AI agent with your own data and documents"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-8 border-none shadow-sm bg-white">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900">
              <Plus className="w-5 h-5 text-[#25D366]" />
              Add Knowledge
            </h3>
            
            <div className="space-y-8">
              {/* URL Import */}
              <form onSubmit={handleAddUrl} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    Import from URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/pricing"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#25D366]"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="bg-[#25D366] hover:bg-[#128C7E] text-white shrink-0"
                      disabled={addDocumentMutation.isPending}
                    >
                      {addDocumentMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-bold">or</span>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  Upload Document
                </Label>
                <div className="relative">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.txt,.csv"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all group"
                  >
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
                    ) : (
                      <>
                        <FileText className="w-8 h-8 text-slate-300 group-hover:text-[#25D366] mb-2 transition-colors" />
                        <span className="text-xs font-bold text-slate-500">Click to upload PDF or TXT</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-[#DCF8C6]/30 border-l-4 border-l-[#25D366]">
            <h4 className="font-bold text-[#075E54] flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4" />
              RAG Technology
            </h4>
            <p className="text-xs text-[#075E54]/80 leading-relaxed">
              We use Retrieval-Augmented Generation (RAG) to ensure your AI agent only answers based on the facts provided in these documents.
            </p>
          </Card>
        </div>

        {/* Documents List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-none shadow-sm bg-white">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Processed Documents</h3>
                <p className="text-sm text-slate-500">Knowledge available to your AI agent</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-[#25D366]" />
                {documents?.length || 0} Documents
              </div>
            </div>

            <div className="space-y-4">
              {documents?.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-[#25D366]/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      {doc.type === "url" ? (
                        <Globe className="w-6 h-6 text-blue-500" />
                      ) : (
                        <FileText className="w-6 h-6 text-orange-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        {doc.name}
                        {doc.type === "url" && (
                          <a href={doc.source} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-[#25D366]">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {doc.type}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-[#25D366] uppercase tracking-wider">
                          Ready
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50"
                    onClick={() => deleteDocumentMutation.mutate({ id: doc.id })}
                    disabled={deleteDocumentMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {documents?.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <BookOpen className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-medium">No documents uploaded yet</p>
                  <p className="text-xs text-slate-300 mt-1">Add a URL or file to get started</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
