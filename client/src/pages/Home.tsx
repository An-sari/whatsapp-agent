import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

const data = [
  { name: "Mon", messages: 400, leads: 24 },
  { name: "Tue", messages: 300, leads: 13 },
  { name: "Wed", messages: 200, leads: 98 },
  { name: "Thu", messages: 278, leads: 39 },
  { name: "Fri", messages: 189, leads: 48 },
  { name: "Sat", messages: 239, leads: 38 },
  { name: "Sun", messages: 349, leads: 43 },
];

export default function Home() {
  const { user } = useAuth();
  const { data: contacts } = trpc.whatsapp.getContacts.useQuery();
  const { data: conversations } = trpc.whatsapp.getConversations.useQuery();

  const stats = [
    { 
      title: "Total Contacts", 
      value: contacts?.length || 0, 
      icon: Users, 
      trend: "+12%", 
      trendUp: true,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    { 
      title: "Active Chats", 
      value: conversations?.length || 0, 
      icon: MessageSquare, 
      trend: "+5%", 
      trendUp: true,
      color: "text-green-600",
      bg: "bg-green-50"
    },
    { 
      title: "AI Response Rate", 
      value: "98.4%", 
      icon: Zap, 
      trend: "+0.2%", 
      trendUp: true,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    { 
      title: "Avg. Response Time", 
      value: "4.2s", 
      icon: Clock, 
      trend: "-1.1s", 
      trendUp: true,
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
  ];

  return (
    <DashboardLayout 
      title={`Welcome back, ${user?.name?.split(' ')[0]}`} 
      subtitle="Here's what's happening with your WhatsApp assistant today."
    >
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={cn("p-2 rounded-lg", stat.bg)}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <div className={cn(
                    "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                    stat.trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {stat.trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {stat.trend}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#25D366]" />
                Engagement Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#25D366" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#25D366" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b', fontSize: 12}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b', fontSize: 12}}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="messages" 
                      stroke="#25D366" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorMessages)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity / Notifications */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { user: "John Doe", action: "qualified as a lead", time: "2m ago", icon: CheckCircle2, color: "text-green-500" },
                  { user: "Sarah Smith", action: "sent a new message", time: "15m ago", icon: MessageSquare, color: "text-blue-500" },
                  { user: "Mike Ross", action: "reached escalation", time: "1h ago", icon: TrendingUp, color: "text-amber-500" },
                  { user: "Broadcast", action: "Summer Sale completed", time: "3h ago", icon: CheckCircle2, color: "text-green-500" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={cn("mt-1 p-1.5 rounded-full bg-slate-50", item.color)}>
                      <item.icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        <span className="font-bold">{item.user}</span> {item.action}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-6 text-slate-500 text-xs hover:bg-slate-50">
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
