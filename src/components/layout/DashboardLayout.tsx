import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SLOTS } from '../../lib/constants';
import {
  Home,
  Briefcase,
  Settings,
  Globe,
  BarChart3,
  Calendar,
  CheckSquare,
  LogOut,
  Menu,
  X,
  Bell,
  User,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navigation = [
  { id: 'home', label: 'Dashboard', icon: Home },
  { id: 'jobs', label: 'Job Feed', icon: Briefcase },
  { id: 'applications', label: 'Applications', icon: CheckSquare },
  { id: 'portals', label: 'Portals', icon: Globe },
  { id: 'preferences', label: 'Preferences', icon: Settings },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
];

export function DashboardLayout({ children, currentPage, onNavigate }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on mobile after navigation
  const handleNavigation = (page: string) => {
    onNavigate(page);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  if (!profile) return null;

  const slot = SLOTS[profile.assigned_slot];

  return (
    <div className="min-h-screen h-screen bg-[#0d1117] flex overflow-hidden">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isMobile 
            ? `fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900/95 backdrop-blur-xl border-r border-gray-800 flex flex-col flex-shrink-0 h-screen overflow-y-auto`}
      >
        <div className="p-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            {(sidebarOpen || isMobile) && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center">
                  <Briefcase className="text-white" size={18} />
                </div>
                <span className="font-bold text-white">Job Hunter</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                {(sidebarOpen || isMobile) && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 flex-shrink-0">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-gray-800 transition-all"
          >
            <LogOut size={20} />
            {(sidebarOpen || isMobile) && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-gray-900/30 backdrop-blur-xl border-b border-gray-800 px-4 md:px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
                >
                  <Menu size={20} />
                </button>
              )}
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white">
                  {navigation.find((n) => n.id === currentPage)?.label || 'Dashboard'}
                </h2>
                <p className="text-xs md:text-sm text-gray-400 mt-0.5 hidden sm:block">
                  Your next scraping run: {slot.label} at {slot.time}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700">
                <span className="text-2xl">{slot.icon}</span>
                <div className="text-left">
                  <p className="text-xs text-gray-400">Your Slot</p>
                  <p className="text-sm font-medium text-white">{slot.time}</p>
                </div>
              </div>

              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
              </button>

              <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-gray-700">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{profile?.name || 'User'}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                    {slot.label}
                  </p>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <User size={18} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
