import { Sidebar } from "./Sidebar";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function DashboardLayout({ children, title, subtitle, actions }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between shrink-0">
          <div>
            {title && <h1 className="text-xl font-bold text-slate-900">{title}</h1>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {actions}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
