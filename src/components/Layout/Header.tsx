import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Menu, X, LogOut, User, Sun, Moon, Laptop, Bell } from 'lucide-react';

// Define Announcement type
export interface Announcement {
  _id: string;
  title: string;
  message: string;
  date?: string;
  created_at?: string;
  pinned?: boolean;
  expires_at?: string;
  league_id?: string | null;
  target_role?: string | null;
  is_global?: boolean;
  read?: boolean;
  status?: string;
}

interface AnnouncementContextType {
  announcements: Announcement[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  loading: boolean;
  refreshAnnouncements?: () => void;
}

export const AnnouncementContext = createContext<AnnouncementContextType>({
  announcements: [],
  unreadCount: 0,
  markAsRead: () => {},
  deleteNotification: () => {},
  loading: false,
  refreshAnnouncements: () => {},
});

interface HeaderProps {
  user?: any;
  signOut?: () => Promise<void>;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  isLeagueCreator?: boolean;
  profileId?: string;
  onMarkAllAsRead?: () => Promise<void>;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  signOut, 
  isAdmin, 
  isSuperAdmin, 
  isLeagueCreator, 
  profileId,
  onMarkAllAsRead
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [themeMenuTimeout, setThemeMenuTimeout] = useState<NodeJS.Timeout>();
  const [hideHeaderTitle, setHideHeaderTitle] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const { announcements, unreadCount, markAsRead, deleteNotification } = useContext(AnnouncementContext);

  // Defensive: Always close account menu when user changes
  useEffect(() => {
    setAccountMenuOpen(false);
  }, [user]);

  // Set header title visibility based on user role
  useEffect(() => {
    if (!user || !profileId) {
      setHideHeaderTitle(false);
      return;
    }
    // For now, assume players and league creators hide the title
    // This logic can be refined based on actual user roles
    setHideHeaderTitle(true);
  }, [user, profileId]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, []);

  // Detect scrolling for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mark a single announcement as read
  const handleMarkAsRead = async (announcementId: string) => {
    if (!user) return;
    await markAsRead(announcementId);
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!user || !onMarkAllAsRead) return;
    try {
      await onMarkAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Delete (dismiss) a notification for this user
  const handleDeleteNotification = async (announcementId: string) => {
    if (!user) return;
    await deleteNotification(announcementId);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleMobileSignOut = async () => {
    if (signOut) {
      await signOut();
    }
  };

  // Add a handler for desktop sign out that also redirects
  const handleDesktopSignOut = async () => {
    if (signOut) {
      await signOut();
    }
  };

  // Only show announcements in the bell that are not deleted
  const bellAnnouncements = announcements.filter(a => a.status !== 'deleted');

  // Click-away and Escape key logic for account menu
  useEffect(() => {
    if (!accountMenuOpen) return;
    function handleClick(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [accountMenuOpen]);

  // Click-away and Escape key logic for notification dropdown
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(event: MouseEvent) {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [dropdownOpen]);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-10 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-md dark:bg-gray-800'
          : 'bg-transparent dark:bg-transparent'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 w-full max-w-full">
        {/* Left: Title or placeholder */}
        {hideHeaderTitle ? (
          <div className="flex-shrink-0" />
        ) : (
          <div className="flex items-center gap-2 text-xl font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white dark:bg-primary-500">
              P
            </div>
            <span className="hidden md:inline">Pickleball League Manager</span>
            <span className="md:hidden">PLM</span>
          </div>
        )}

        {/* Desktop navigation */}
        <nav className="hidden md:block">
          <ul className="flex space-x-8 items-center">
            {user ? (
              <>
                <li>
                  <a href="/" className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
                    Home
                  </a>
                </li>
                <li>
                  <a href="/leagues" className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
                    My Leagues
                  </a>
                </li>
                {isSuperAdmin && (
                  <li>
                    <a href="/leagues/find" className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
                      Find a League
                    </a>
                  </li>
                )}
                <li>
                  <a href="/play" className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
                    Create a Match
                  </a>
                </li>
                {isSuperAdmin && (
                  <li>
                    <a href="/clubs" className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
                      Clubs
                    </a>
                  </li>
                )}
                {isSuperAdmin && (
                  <li>
                    <a href="/players" className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
                      Players
                    </a>
                  </li>
                )}
                {(isSuperAdmin || isLeagueCreator) && (
                  <a href="/admin" className="text-teal-400">
                    Admin Panel
                  </a>
                )}
                <li className="relative">
                  <div ref={accountMenuRef}>
                    <button
                      className="flex items-center text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                      onClick={() => setAccountMenuOpen((open) => !open)}
                      aria-haspopup="true"
                      aria-expanded={accountMenuOpen}
                      aria-controls="account-menu-dropdown"
                      type="button"
                    >
                      <User size={18} className="mr-1" />
                      Account
                    </button>
                    {accountMenuOpen && (
                      <div
                        id="account-menu-dropdown"
                        className="absolute right-0 mt-2 w-48 rounded-md bg-white py-2 shadow-lg dark:bg-gray-800"
                        tabIndex={-1}
                      >
                        <a href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                          Profile
                        </a>
                        <div className="mx-4 my-2 border-t border-gray-200 dark:border-gray-700"></div>
                        <button
                          onClick={handleDesktopSignOut}
                          className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <LogOut size={18} className="mr-2 inline" />
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </li>
                <li className="relative">
                  <div ref={notificationDropdownRef}>
                    <button
                      className="relative focus:outline-none"
                      onClick={() => setDropdownOpen((open) => !open)}
                      aria-label="Notifications"
                      aria-haspopup="true"
                      aria-expanded={dropdownOpen}
                      aria-controls="notification-dropdown"
                      type="button"
                    >
                      <Bell size={22} className="text-gray-700 dark:text-gray-300" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold shadow">{unreadCount}</span>
                      )}
                    </button>
                    {dropdownOpen && (
                      <div
                        id="notification-dropdown"
                        className="absolute right-0 mt-2 w-96 max-w-xs rounded-md bg-white py-2 shadow-lg dark:bg-gray-900 z-50"
                        tabIndex={-1}
                      >
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="font-semibold text-gray-900 dark:text-white">Notifications</span>
                          <button
                            className="text-xs text-primary-600 hover:underline dark:text-primary-400"
                            onClick={handleMarkAllAsRead}
                            disabled={unreadCount === 0}
                          >
                            Mark all as read
                          </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {bellAnnouncements.length === 0 ? (
                            <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                              No notifications
                            </div>
                          ) : (
                            bellAnnouncements.map((a) => (
                              <div
                                key={a._id}
                                className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer ${a.read ? 'bg-white dark:bg-gray-900' : 'bg-primary-50 dark:bg-primary-900/30 font-semibold'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-900 dark:text-white">{a.title}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{a.message}</div>
                                <div className="flex gap-2 mt-2">
                                  {a.status !== 'read' && (
                                    <button
                                      className="text-xs text-primary-600 hover:underline dark:text-primary-400"
                                      onClick={() => handleMarkAsRead(a._id)}
                                    >
                                      Mark Read
                                    </button>
                                  )}
                                  <button
                                    className="text-xs text-red-600 hover:underline dark:text-red-400"
                                    onClick={() => handleDeleteNotification(a._id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              </>
            ) : (
              <>
                <li>
                  <a
                    href="/signin"
                    className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                  >
                    Sign In
                  </a>
                </li>
                <li>
                  <a
                    href="/signup"
                    className="block rounded-md bg-primary-600 px-4 py-2 text-center text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                  >
                    Sign Up
                  </a>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Mobile menu button */}
        <button
          className="text-gray-700 hover:text-primary-600 md:hidden dark:text-gray-300 dark:hover:text-primary-400"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="absolute left-0 right-0 top-16 z-20 bg-white p-4 shadow-lg md:hidden dark:bg-gray-800 w-full">
            <nav>
              <ul className="space-y-4">
                {user ? (
                  <>
                    <li>
                      <a href="/" className="block text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
                        Home
                      </a>
                    </li>
                    <li>
                      <a href="/leagues" className="block text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
                        My Leagues
                      </a>
                    </li>
                    <li>
                      <a href="/play" className="block text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
                        Create a Match
                      </a>
                    </li>
                    {isSuperAdmin && (
                      <li>
                        <a href="/clubs" className="block text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
                          Clubs
                        </a>
                      </li>
                    )}
                    {isSuperAdmin && (
                      <li>
                        <a href="/players" className="block text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
                          Players
                        </a>
                      </li>
                    )}
                    <li>
                      <a href="/profile" className="block text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
                        Profile
                      </a>
                    </li>
                    {isLeagueCreator && !isSuperAdmin && (
                      <li>
                        <a href="/admin" className="block text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
                          Admin Panel
                        </a>
                      </li>
                    )}
                    <li>
                      <button
                        onClick={handleMobileSignOut}
                        className="flex w-full items-center text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                      >
                        <LogOut size={18} className="mr-2" />
                        Sign out
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <a href="/signin" className="block text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">
                        Sign In
                      </a>
                    </li>
                    <li>
                      <a
                        href="/signup"
                        className="block rounded-md bg-primary-600 px-4 py-2 text-center text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                      >
                        Sign Up
                      </a>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;