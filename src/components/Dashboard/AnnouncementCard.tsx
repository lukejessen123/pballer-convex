import React from 'react';
import { Bell } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';

interface Announcement {
  _id: string;
  title: string;
  message: string;
  date?: string;
  status?: string; // Allow any string status
}

interface AnnouncementCardProps {
  announcements?: Announcement[];
  isLoading?: boolean;
  markAsRead?: (id: string) => void;
  deleteNotification?: (id: string) => void;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ 
  announcements, 
  isLoading, 
  markAsRead, 
  deleteNotification 
}) => {
  // Only show announcements that are not read or deleted (use status field from announcement)
  const visibleAnnouncements = (announcements || []).filter(a => 
    !a.status || (a.status !== 'read' && a.status !== 'deleted')
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!visibleAnnouncements?.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Announcements</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {visibleAnnouncements.map((announcement) => {
            const status = announcement.status;
            return (
              <div key={announcement._id} className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {announcement.title}
                    </h3>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {announcement.date}
                  </span>
                </div>
                <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-300 dark:prose-invert">
                  <ReactMarkdown>{announcement.message}</ReactMarkdown>
                </div>
                <div className="mt-2 flex gap-2 justify-end">
                  {status !== 'read' && (
                    <button
                      className="px-2 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
                      onClick={() => markAsRead?.(announcement._id)}
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    className="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
                    onClick={() => deleteNotification?.(announcement._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};

export default AnnouncementCard;