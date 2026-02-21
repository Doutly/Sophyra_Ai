import { LayoutDashboard, Users, UserCheck, Ticket, BookOpen, Briefcase, Mail, LogOut, ChevronRight } from 'lucide-react';

export type AdminSection =
  | 'overview'
  | 'candidates'
  | 'hr'
  | 'requests'
  | 'blog'
  | 'careers'
  | 'contact';

interface Props {
  active: AdminSection;
  onSelect: (s: AdminSection) => void;
  onSignOut: () => void;
  badges: Partial<Record<AdminSection, number>>;
}

const navItems: { id: AdminSection; icon: React.FC<{ className?: string }>; label: string }[] = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'candidates', icon: Users, label: 'Candidates' },
  { id: 'hr', icon: UserCheck, label: 'HR Professionals' },
  { id: 'requests', icon: Ticket, label: 'Interview Requests' },
  { id: 'blog', icon: BookOpen, label: 'Blog' },
  { id: 'careers', icon: Briefcase, label: 'Careers' },
  { id: 'contact', icon: Mail, label: 'Contact Inbox' },
];

export default function AdminSidebar({ active, onSelect, onSignOut, badges }: Props) {
  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-30">
      <div className="px-5 py-5 border-b border-slate-100 flex items-center gap-3">
        <img src="/lo.png" alt="Sophyra AI" className="w-8 h-8 object-contain" />
        <div>
          <p className="text-sm font-bold text-slate-900">Sophyra AI</p>
          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wide">Admin</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = active === id;
          const badge = badges[id];
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span>{label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {badge != null && badge > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[18px] text-center">
                    {badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-500 transition-colors" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
