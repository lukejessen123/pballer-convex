import React from 'react';
import { Home, Trophy, Users, PlayCircle, User } from 'lucide-react';

interface MobileNavigationProps {
  user?: any;
  isSuperAdmin?: boolean;
  isLeagueCreator?: boolean;
  profileId?: string;
  userRole?: string;
  currentPath?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  user, 
  isSuperAdmin, 
  isLeagueCreator, 
  profileId,
  userRole,
  currentPath = '/'
}) => {
  // Determine if mobile nav should be hidden based on user role
  const hideMobileNav = !user || !profileId || userRole === 'player' || userRole === 'league_creator';
  
  const isActive = (path: string) => currentPath === path;
  
  const navItems = [
    { 
      to: '/', 
      icon: <Home size={20} className={isActive('/') ? 'text-primary-600 dark:text-primary-400' : ''} />, 
      label: 'Home', 
      active: isActive('/') 
    },
    { 
      to: '/leagues', 
      icon: <Trophy size={20} className={isActive('/leagues') ? 'text-primary-600 dark:text-primary-400' : ''} />, 
      label: 'Leagues', 
      active: isActive('/leagues') 
    },
    { 
      to: '/play', 
      icon: <PlayCircle size={20} className={isActive('/play') ? 'text-primary-600 dark:text-primary-400' : ''} />, 
      label: 'Create a Match', 
      active: isActive('/play') 
    },
    ...(isSuperAdmin ? [{ 
      to: '/players', 
      icon: <Users size={20} className={isActive('/players') ? 'text-primary-600 dark:text-primary-400' : ''} />, 
      label: 'Players', 
      active: isActive('/players') 
    }, {
      to: '/leagues/find',
      icon: <Trophy size={20} className={isActive('/leagues/find') ? 'text-primary-600 dark:text-primary-400' : ''} />, 
      label: 'Find a League',
      active: isActive('/leagues/find')
    }] : []),
    { 
      to: '/profile', 
      icon: <User size={20} className={isActive('/profile') ? 'text-primary-600 dark:text-primary-400' : ''} />, 
      label: 'Profile', 
      active: isActive('/profile') 
    },
    ...(isSuperAdmin ? [{
      to: '/admin',
      icon: <Users size={20} className={isActive('/admin') ? 'text-primary-600 dark:text-primary-400' : ''} />, 
      label: 'Admin Panel',
      active: isActive('/admin')
    }] : []),
  ];

  if (currentPath === '/players') return null;

  if (!user) return null;

  if (hideMobileNav) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white shadow-lg md:hidden dark:border-gray-700 dark:bg-gray-800 w-full">
      <nav className="container mx-auto px-4 w-full">
        <ul className="flex h-16 items-center justify-between">
          {navItems.map((item) => (
            <li key={item.to}>
              <a
                href={item.to}
                className={`flex flex-col items-center justify-center p-2 transition-colors ${
                  item.active
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {item.icon}
                <span className={`mt-1 text-xs ${
                  item.active ? 'font-medium' : ''
                }`}>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default MobileNavigation;