import React from 'react';
import { Calendar, MapPin, Trash2 } from 'lucide-react';

interface CommunityEvent {
  _id: string;
  _creationTime: number;
  name: string;
  start_date: string;
  location?: string;
  created_by: string;
  creator?: {
    first_name?: string;
    last_name?: string;
  };
}

interface MyEventsListProps {
  events?: CommunityEvent[];
  isLoading?: boolean;
  onDeleteEvent?: (eventId: string) => void;
  onViewEvent?: (eventId: string) => void;
  canDelete?: (eventId: string) => boolean;
}

const MyEventsList: React.FC<MyEventsListProps> = ({ 
  events = [], 
  isLoading = false, 
  onDeleteEvent,
  onViewEvent,
  canDelete = () => false
}) => {
  if (isLoading) {
    return (
      <div className="rounded-lg bg-gray-900 p-4">
        <p className="text-gray-400">Loading your events...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-700 bg-gray-900 p-8 text-center">
        <h3 className="text-lg font-semibold text-white">No Community Events Yet</h3>
        <p className="mt-1 text-gray-400">You haven't joined or created any community games.</p>
        <button
          className="mt-4 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Create Your First Game
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => {
        const creatorName = event.creator 
          ? `${event.creator.first_name || ''} ${event.creator.last_name || ''}`.trim() 
          : 'Unknown Creator';
        const eventDate = event.start_date 
          ? new Date(event.start_date).toLocaleDateString() 
          : 'Date TBD';
        
        return (
          <div key={event._id} className="rounded-lg bg-gray-800 p-4 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-white break-words">{event.name}</h3>
              <p className="text-sm text-gray-400 mb-3">Created by {creatorName}</p>
              <div className="flex items-center gap-2 text-gray-300 text-sm mb-2">
                <Calendar size={16} />
                <span>{eventDate}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <MapPin size={16} />
                <span>{event.location || 'Location TBD'}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => onViewEvent?.(event._id)}
                className="text-center rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
              >
                View Event
              </button>
              {canDelete(event._id) && (
                <button
                  className="flex items-center justify-center px-3 py-2 rounded-md bg-red-700 text-white hover:bg-red-800 disabled:opacity-60"
                  onClick={() => onDeleteEvent?.(event._id)}
                  title="Delete Event"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MyEventsList; 