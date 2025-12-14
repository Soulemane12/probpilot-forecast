import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Star, 
  Settings,
  Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/markets', label: 'Markets', icon: TrendingUp },
  { to: '/watchlist', label: 'Watchlist', icon: Star },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Compass className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-semibold text-lg tracking-tight">ProbPilot</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 px-3">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || 
              (item.to === '/markets' && location.pathname.startsWith('/markets/'));
            
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                      : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-sidebar-primary" : ""
                  )} />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-muted">
          <p>Forecasting Copilot</p>
          <p className="mt-1">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
