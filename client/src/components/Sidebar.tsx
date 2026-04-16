import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Megaphone, 
  Settings, 
  BarChart3, 
  Zap, 
  BookOpen, 
  Share2,
  LogOut,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { WebhookStatusBadge } from "./WebhookStatusIndicator";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: MessageSquare, label: "Live Chat", href: "/conversations" },
  { icon: Sparkles, label: "Agent Personality", href: "/agent-config" },
  { icon: Users, label: "Contacts", href: "/contacts" },
  { icon: Megaphone, label: "Broadcasts", href: "/broadcasts" },
  { icon: Zap, label: "Nurture Engine", href: "/nurture-sequences" },
  { icon: BookOpen, label: "Knowledge Base", href: "/knowledge-base" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Share2, label: "Integrations", href: "/integrations" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#25D366] rounded-lg flex items-center justify-center shadow-lg shadow-green-200">
          <MessageSquare className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900">WhatsApp AI</span>
      </div>

      <div className="px-4 mb-4">
        <WebhookStatusBadge />
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
              isActive 
                ? "bg-[#DCF8C6] text-[#075E54]" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}>
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-[#075E54]" : "text-slate-400 group-hover:text-slate-600"
              )} />
              {item.label}
              {isActive && <ChevronRight className="ml-auto w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
            {user?.name?.substring(0, 2).toUpperCase() || "US"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
