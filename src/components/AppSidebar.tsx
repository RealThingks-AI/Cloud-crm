import { 
  Home, 
  Users, 
  UserPlus, 
  BarChart3, 
  Activity, 
  Settings,
  LogOut,
  Pin,
  PinOff
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Leads", url: "/leads", icon: UserPlus },
  { title: "Deals", url: "/deals", icon: BarChart3 },
  { title: "Feeds", url: "/feeds", icon: Activity },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/auth';
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email || 'User';
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
    if (!isPinned) {
      setIsExpanded(true);
    }
  };

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsExpanded(false);
    }
  };

  return (
    <div 
      className="h-screen flex flex-col border-r border-gray-200"
      style={{ 
        width: isExpanded ? '220px' : '60px',
        backgroundColor: '#ffffff',
        transition: 'width 0.3s ease-in-out'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-300 relative" style={{ height: '72px', padding: '0 16px' }}>
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/12bdcc4a-a1c8-4ccf-ba6a-931fd566d3c8.png" 
            alt="Logo" 
            className="w-8 h-8 flex-shrink-0 object-contain"
          />
          {isExpanded && (
            <span className="ml-3 text-gray-800 font-semibold text-lg whitespace-nowrap" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              RealThingks
            </span>
          )}
        </div>
        {isExpanded && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={togglePin}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                  isPinned 
                    ? 'text-blue-700 bg-blue-100 hover:bg-blue-200' 
                    : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{isPinned ? 'Unpin sidebar' : 'Pin sidebar'}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const active = isActive(item.url);
            const menuButton = (
              <NavLink
                to={item.url}
                 className={`
                  flex items-center rounded-lg relative
                  ${active 
                    ? 'text-blue-700 bg-blue-100' 
                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                  }
                `}
                style={{ 
                  paddingLeft: '0px',
                  paddingRight: isExpanded ? '16px' : '0px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  minHeight: '44px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '15px',
                  fontWeight: '500',
                  transition: 'none'
                }}
              >
                <item.icon 
                  className="w-5 h-5" 
                  style={{ 
                    position: 'absolute',
                    left: '17.5px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    minWidth: '20px',
                    minHeight: '20px',
                    transition: 'none'
                  }} 
                />
                {isExpanded && (
                  <span 
                    className="ml-16"
                    style={{ transition: 'none' }}
                  >
                    {item.title}
                  </span>
                )}
              </NavLink>
            );

            if (!isExpanded) {
              return (
                <Tooltip key={item.title}>
                  <TooltipTrigger asChild>
                    {menuButton}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    <p>{item.title}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <div key={item.title}>
                {menuButton}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section - User & Sign Out */}
      <div className="border-t border-gray-300 p-4 relative">
        {!isExpanded ? (
          <div className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                  style={{ minWidth: '40px', minHeight: '40px' }}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                <p>Sign Out</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center relative" style={{ minHeight: '40px' }}>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
              style={{ 
                position: 'absolute',
                left: '6px',
                width: '40px',
                height: '40px',
                minWidth: '40px'
              }}
            >
              <LogOut className="w-5 h-5" />
            </button>
            <p 
              className="text-gray-700 text-sm font-medium truncate ml-16"
              style={{ 
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '15px'
              }}
            >
              {getUserDisplayName()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
