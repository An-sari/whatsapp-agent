import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Zap,
  Plus,
  Trash2,
  Clock,
  MessageSquare,
  Bot,
  Loader2,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

import { DashboardLayout } from "@/components/DashboardLayout";

export default function NurtureSequences() {
  const [newSequenceName, setNewSequenceName] = useState("");
  const [selectedSequenceId, setSelectedSequenceId] = useState<number | null>(null);
  
  const [newStep, setNewStep] = useState({
    delayHours: 24,
    content: "",
    type: "text" as "text" | "ai_prompt",
  });

  const { data: sequences, refetch: refetchSequences } = trpc.nurture.getSequences.useQuery();
  const { data: steps, refetch: refetchSteps } = trpc.nurture.getSteps.useQuery(
    { sequenceId: selectedSequenceId || 0 },
    { enabled: !!selectedSequenceId }
  );

  const createSequenceMutation = trpc.nurture.createSequence.useMutation({
    onSuccess: () => {
      toast.success("Sequence created");
      setNewSequenceName("");
      refetchSequences();
    },
  });

  const addStepMutation = trpc.nurture.addStep.useMutation({
    onSuccess: () => {
      toast.success("Step added");
      setNewStep({ delayHours: 24, content: "", type: "text" });
      refetchSteps();
    },
  });

  const handleCreateSequence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSequenceName.trim()) return;
    createSequenceMutation.mutate({ name: newSequenceName });
  };

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSequenceId || !newStep.content.trim()) return;
    
    addStepMutation.mutate({
      sequenceId: selectedSequenceId,
      stepNumber: (steps?.length || 0) + 1,
      delayHours: Number(newStep.delayHours),
      content: newStep.content,
      type: newStep.type,
    });
  };

  return (
    <DashboardLayout 
      title="Nurture Engine" 
      subtitle="Automate your follow-ups and lead nurturing"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sequences List */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 border-none shadow-sm bg-white">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900">
              <Settings2 className="w-5 h-5 text-[#25D366]" />
              Sequences
            </h3>
            
            <form onSubmit={handleCreateSequence} className="flex gap-2 mb-6">
              <Input
                placeholder="New sequence name..."
                value={newSequenceName}
                onChange={(e) => setNewSequenceName(e.target.value)}
                className="bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#25D366]"
              />
              <Button 
                type="submit" 
                size="icon" 
                className="bg-[#25D366] hover:bg-[#128C7E] text-white shrink-0"
                disabled={createSequenceMutation.isPending}
              >
                {createSequenceMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </form>

            <div className="space-y-2">
              {sequences?.map((seq) => (
                <button
                  key={seq.id}
                  onClick={() => setSelectedSequenceId(seq.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                    selectedSequenceId === seq.id
                      ? "bg-[#DCF8C6] text-[#075E54] shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedSequenceId === seq.id ? "bg-white" : "bg-white/50"
                    }`}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">{seq.name}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${
                    selectedSequenceId === seq.id ? "rotate-90" : ""
                  }`} />
                </button>
              ))}
              {sequences?.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">No sequences created yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Steps Editor */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSequenceId ? (
            <div className="space-y-6">
              {/* Add New Step */}
              <Card className="p-8 border-none shadow-sm bg-white">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900">
                  <Plus className="w-5 h-5 text-[#25D366]" />
                  Add New Step
                </h3>
                <form onSubmit={handleAddStep} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Delay (Hours)</Label>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <Input
                          type="number"
                          value={newStep.delayHours}
                          onChange={(e) => setNewStep({ ...newStep, delayHours: Number(e.target.value) })}
                          className="bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#25D366]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Step Type</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={newStep.type === "text" ? "default" : "outline"}
                          onClick={() => setNewStep({ ...newStep, type: "text" })}
                          className={`flex-1 h-10 ${newStep.type === "text" ? "bg-[#075E54] hover:bg-[#075E54]/90" : "border-slate-200"}`}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Static Text
                        </Button>
                        <Button
                          type="button"
                          variant={newStep.type === "ai_prompt" ? "default" : "outline"}
                          onClick={() => setNewStep({ ...newStep, type: "ai_prompt" })}
                          className={`flex-1 h-10 ${newStep.type === "ai_prompt" ? "bg-[#075E54] hover:bg-[#075E54]/90" : "border-slate-200"}`}
                        >
                          <Bot className="w-4 h-4 mr-2" />
                          AI Prompt
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {newStep.type === "text" ? "Message Content" : "AI Instruction"}
                    </Label>
                    <Textarea
                      placeholder={newStep.type === "text" ? "Hello! Just checking in..." : "Write a friendly follow-up message asking if they have any questions about our previous discussion."}
                      value={newStep.content}
                      onChange={(e) => setNewStep({ ...newStep, content: e.target.value })}
                      className="min-h-[120px] bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#25D366]"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white h-12 font-bold"
                    disabled={addStepMutation.isPending}
                  >
                    {addStepMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-5 h-5 mr-2" />
                    )}
                    Add Step to Sequence
                  </Button>
                </form>
              </Card>

              {/* Steps Timeline */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 px-2">Sequence Timeline</h3>
                {steps?.map((step, idx) => (
                  <div key={step.id} className="relative pl-8 pb-4 last:pb-0">
                    {/* Timeline Line */}
                    {idx !== steps.length - 1 && (
                      <div className="absolute left-[15px] top-[30px] bottom-0 w-0.5 bg-slate-200" />
                    )}
                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-1.5 w-8 h-8 rounded-full bg-white border-2 border-[#25D366] flex items-center justify-center z-10">
                      <span className="text-xs font-bold text-[#075E54]">{idx + 1}</span>
                    </div>
                    
                    <Card className="p-6 border-none shadow-sm bg-white">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            Wait {step.delayHours}h
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#075E54] bg-[#DCF8C6] px-2.5 py-1 rounded-full">
                            {step.type === "text" ? <MessageSquare className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                            {step.type === "text" ? "Static Message" : "AI Generated"}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl italic">
                        "{step.content}"
                      </p>
                    </Card>
                  </div>
                ))}
                {steps?.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-medium">No steps added to this sequence yet</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                <Zap className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Sequence</h3>
              <p className="text-slate-500 max-w-xs">Choose a sequence from the left to view and edit its automation steps.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
