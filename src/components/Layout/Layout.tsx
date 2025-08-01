import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header, { AnnouncementContext, Announcement } from './Header';
import Footer from './Footer';
import MobileNavigation from './MobileNavigation';

interface LayoutProps {
  announcements?: Announcement[];
  unreadCount?: number;
  onMarkAsRead?: (announcementId: string) => Promise<void>;
  onDeleteNotification?: (announcementId: string) => Promise<void>;
  onRefreshAnnouncements?: () => Promise<void>;
  isLoading?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  announcements = [], 
  unreadCount = 0, 
  onMarkAsRead,
  onDeleteNotification,
  onRefreshAnnouncements,
  isLoading = false
}) => {
  const location = useLocation();
  const isAuthPage = ['/signin', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname);

  const markAsRead = async (announcementId: string) => {
    if (onMarkAsRead) {
      try {
        await onMarkAsRead(announcementId);
      } catch (error) {
        console.error('Failed to mark announcement as read:', error);
      }
    }
  };

  const deleteNotification = async (announcementId: string) => {
    if (onDeleteNotification) {
      try {
        await onDeleteNotification(announcementId);
      } catch (error) {
        console.error('Failed to delete notification:', error);
      }
    }
  };

  const refreshAnnouncements = async () => {
    if (onRefreshAnnouncements) {
      try {
        await onRefreshAnnouncements();
      } catch (error) {
        console.error('Failed to refresh announcements:', error);
      }
    }
  };

  return (
    <AnnouncementContext.Provider value={{
      announcements,
      unreadCount,
      markAsRead,
      deleteNotification,
      loading: isLoading,
      refreshAnnouncements,
    }}>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900 w-full overflow-x-hidden">
        <Header />
        <main className="flex-1 px-4 pb-20 pt-16 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </main>
        {!isAuthPage && <Footer />}
        {!isAuthPage && <MobileNavigation />}
      </div>
    </AnnouncementContext.Provider>
  );
};

export default Layout;