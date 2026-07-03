import React from "react";
import { 
  LayoutDashboard, 
  Building2, 
  Layers, 
  Grid, 
  Users, 
  FileText, 
  FolderOpen, 
  TrendingUp, 
  Cpu, 
  ArrowLeftRight, 
  ShieldCheck, 
  History, 
  CheckSquare, 
  Bell, 
  ChevronRight, 
  Compass
} from "lucide-react";
import { motion } from "motion/react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  unreadCount: number;
  pendingApprovalsCount: number;
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  unreadCount, 
  pendingApprovalsCount 
}: SidebarProps) {
  const menuGroups = [
    {
      title: "Core",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      ]
    },
    {
      title: "Master Data",
      items: [
        { id: "buildings", label: "Building Master", icon: Building2 },
        { id: "floors", label: "Floor Management", icon: Layers },
        { id: "units", label: "Unit Management", icon: Grid },
        { id: "tenants", label: "Tenant Management", icon: Users },
      ]
    },
    {
      title: "Operations",
      items: [
        { id: "leases", label: "Lease & Contract", icon: FileText },
        { id: "documents", label: "Document Center", icon: FolderOpen },
        { id: "approval_workflow", label: "Approval Queue", icon: CheckSquare, badge: pendingApprovalsCount },
        { id: "reports", label: "Reports & Analytics", icon: TrendingUp },
      ]
    },
    {
      title: "AI Intelligent Hub",
      items: [
        { id: "contract_intelligence", label: "AI Contract OCR", icon: Cpu },
        { id: "contract_comparison", label: "AI Contract Compare", icon: ArrowLeftRight },
      ]
    },
    {
      title: "Administration",
      items: [
        { id: "users", label: "User & Role Mgmt", icon: ShieldCheck },
        { id: "audit_log", label: "Audit Trails", icon: History },
        { id: "notifications", label: "Notification Center", icon: Bell, badge: unreadCount },
      ]
    }
  ];

  return (
    <aside className="w-68 bg-slate-950 border-r border-slate-800 flex flex-col h-screen text-slate-300 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/10">
          <Compass className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-sans font-bold text-lg text-white leading-tight tracking-tight">
            TPMS <span className="text-cyan-400">AI</span>
          </h1>
          <p className="font-sans text-[10px] text-slate-500 font-medium tracking-widest uppercase">
            Enterprise v1.5
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
              {group.title}
            </h3>
            <div className="space-y-0.5 mt-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-tab-${item.id}`}
                    onClick={() => setCurrentTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-sans text-sm transition-all duration-150 group text-left ${
                      isActive 
                        ? "bg-cyan-950/40 text-cyan-400 font-medium border-l-2 border-cyan-500 pl-2.5" 
                        : "hover:bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 transition-colors ${
                        isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                      }`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 ? (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? "bg-cyan-500 text-slate-950" : "bg-cyan-950 text-cyan-400 border border-cyan-800"
                      }`}>
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Session Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-sm text-cyan-400 font-bold font-sans text-xs uppercase">
          IU
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-xs font-semibold text-white truncate">
            info@tifahub.space
          </p>
          <p className="font-sans text-[10px] text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse"></span>
            Super Administrator
          </p>
        </div>
      </div>
    </aside>
  );
}
