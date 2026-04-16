import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, MessageCircle, Clock, PieChart as PieChartIcon } from "lucide-react";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { DashboardLayout } from "@/components/DashboardLayout";

export default function Analytics() {
  const { user } = useAuth();

  // Fetch conversations for analytics
  const { data: conversations } = trpc.whatsapp.getConversations.useQuery();

  // Calculate metrics
  const metrics = {
    totalConversations: conversations?.length || 0,
    totalMessages: conversations?.reduce((sum, conv) => sum + (conv.messageCount || 0), 0) || 0,
    aiMessages: conversations?.reduce((sum, conv) => sum + (conv.aiMessageCount || 0), 0) || 0,
    averageResponseTime:
      conversations && conversations.length > 0
        ? conversations.reduce((sum, conv) => sum + (conv.averageResponseTime || 0), 0) /
          conversations.length
        : 0,
    qualifiedLeads: conversations?.filter((conv) => conv.leadQualified).length || 0,
  };

  // Prepare chart data
  const barData = conversations?.slice(0, 7).map((conv) => ({
    name: conv.whatsappContactId.slice(-4),
    messages: conv.messageCount || 0,
    ai: conv.aiMessageCount || 0,
  })) || [];

  const pieData = [
    { name: "Qualified", value: metrics.qualifiedLeads },
    { name: "Pending", value: metrics.totalConversations - metrics.qualifiedLeads },
  ];

  const COLORS = ["#25D366", "#075E54"];

  return (
    <DashboardLayout 
      title="Analytics & Insights" 
      subtitle="Track your performance and customer engagement"
    >
      <div className="space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 border-none shadow-sm bg-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Conversations</p>
                <p className="text-3xl font-bold mt-2 text-slate-900">{metrics.totalConversations}</p>
              </div>
              <div className="p-3 bg-[#DCF8C6]/50 rounded-xl">
                <MessageCircle className="w-6 h-6 text-[#075E54]" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Messages</p>
                <p className="text-3xl font-bold mt-2 text-slate-900">{metrics.totalMessages}</p>
              </div>
              <div className="p-3 bg-[#DCF8C6]/50 rounded-xl">
                <TrendingUp className="w-6 h-6 text-[#075E54]" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">AI Automation Rate</p>
                <p className="text-3xl font-bold mt-2 text-slate-900">
                  {metrics.totalMessages > 0
                    ? Math.round((metrics.aiMessages / metrics.totalMessages) * 100)
                    : 0}%
                </p>
              </div>
              <div className="p-3 bg-[#DCF8C6]/50 rounded-xl">
                <BarChart3 className="w-6 h-6 text-[#075E54]" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Avg. Response Time</p>
                <p className="text-3xl font-bold mt-2 text-slate-900">
                  {Math.round(metrics.averageResponseTime / 60)}m
                </p>
              </div>
              <div className="p-3 bg-[#DCF8C6]/50 rounded-xl">
                <Clock className="w-6 h-6 text-[#075E54]" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Message Activity */}
          <Card className="p-8 border-none shadow-sm bg-white">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Message Activity</h3>
                <p className="text-sm text-slate-500">Recent conversation volume</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#25D366]" />
                  <span className="text-xs text-slate-500">Total</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#075E54]" />
                  <span className="text-xs text-slate-500">AI</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="messages" fill="#25D366" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="ai" fill="#075E54" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Lead Qualification */}
          <Card className="p-8 border-none shadow-sm bg-white">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Lead Qualification</h3>
                <p className="text-sm text-slate-500">Qualified vs. Pending leads</p>
              </div>
              <PieChartIcon className="w-5 h-5 text-slate-400" />
            </div>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
