import React, { useState } from 'react';
import { Card, CardBody } from '../ui/Card';
import Button from '../ui/Button';
import { format } from 'date-fns';

interface Event {
  _id: string;
  name: string;
  start_date: string;
  location?: string;
  courts: number;
  game_type?: string;
  players_per_court: number;
  points_to_win: number;
  win_by_margin: number;
  games_per_match: number;
  max_players?: number;
  total_players?: number;
  access_mode?: string;
  event_type?: string;
  court_meta?: Record<string, string>;
  court_details?: Record<string, string>;
  created_by: string;
}

interface EventDetailsSectionProps {
  event: Event;
  isOwner: boolean;
  onSave?: (updated: Event) => Promise<void>;
}

const getCourtNames = (event: Event) => {
  // Try court_meta, then court_details, then fallback
  if (event.court_meta && typeof event.court_meta === 'object') {
    return event.court_meta;
  }
  if (event.court_details && typeof event.court_details === 'object') {
    return event.court_details;
  }
  return null;
};

const eventTypeLabels: Record<string, string> = {
  round_robin_set: 'Round Robin Set Partners',
  round_robin: 'Round Robin',
  single_elimination: 'Single Elimination',
  double_elimination: 'Double Elimination',
  // Add more mappings as needed
};

function formatEventType(type: string) {
  if (!type) return '';
  if (eventTypeLabels[type]) return eventTypeLabels[type];
  // Fallback: convert snake_case to Title Case
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return format(d, 'MMMM do, yyyy');
}

const eventTypeOptions: { value: string; label: string }[] = [
  { value: 'round_robin_set', label: 'Round Robin Set Partners' },
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'single_elimination', label: 'Single Elimination' },
  { value: 'double_elimination', label: 'Double Elimination' },
  // Add more as needed
];

const EventDetailsSection: React.FC<EventDetailsSectionProps> = ({ event, isOwner, onSave }) => {
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<Event>({ ...event });
  const [saving, setSaving] = useState(false);

  // For editing court names
  const courtNames = getCourtNames(form) || {};
  const handleCourtNameChange = (courtNum: string, value: string) => {
    setForm((prev: Event) => ({
      ...prev,
      court_meta: {
        ...(prev.court_meta || {}),
        [courtNum]: value,
      },
    }));
  };

  const handleEdit = () => {
    setForm({ ...event });
    setEditOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setSaving(true);
    try {
      await onSave(form);
      setEditOpen(false);
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('Failed to save event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // For displaying court names
  const displayCourtNames = getCourtNames(event) || {};

  return (
    <Card className="mb-4">
      <CardBody>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Event Details</h2>
          {isOwner && (
            <Button onClick={handleEdit} className="bg-teal-500 text-white px-3 py-1 rounded">
              Edit Settings
            </Button>
          )}
        </div>
        {!editOpen && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-white">
            <div><strong>Name:</strong> {event.name}</div>
            <div><strong>Date:</strong> {formatDate(event.start_date)}</div>
            <div><strong>Location:</strong> {event.location}</div>
            <div><strong>Courts:</strong> {event.courts}</div>
            <div><strong>Game Type:</strong> {event.game_type || (event.players_per_court === 2 ? 'Singles' : 'Doubles')}</div>
            <div><strong>Points to Win:</strong> {event.points_to_win}</div>
            <div><strong>Win By Margin:</strong> {event.win_by_margin}</div>
            <div><strong>Games per Match:</strong> {event.games_per_match}</div>
            <div><strong>Players per Court:</strong> {event.players_per_court}</div>
            <div><strong>Max Players:</strong> {event.max_players || event.total_players}</div>
            <div><strong>Access Mode:</strong> {event.access_mode ? event.access_mode.charAt(0).toUpperCase() + event.access_mode.slice(1) : ''}</div>
            <div><strong>Event Type:</strong> {formatEventType(event.event_type || '')}</div>
            {/* Court Display Names as list */}
            <div className="md:col-span-2 mt-2">
              <strong>Custom Court Names:</strong>
              {Object.keys(displayCourtNames).length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {(Object.entries(displayCourtNames) as [string, string][]).map(([num, name]) => (
                    <li key={num} className="flex gap-2"><span className="font-semibold">Court {num}:</span> <span>{name}</span></li>
                  ))}
                </ul>
              ) : (
                <span className="ml-2 text-gray-400">None</span>
              )}
            </div>
          </div>
        )}
        {/* Edit Modal */}
        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Edit Event Settings</h2>
              <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    value={form.name || ''}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="start_date"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    value={form.start_date || ''}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    value={form.location || ''}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1">Courts</label>
                  <input
                    type="number"
                    name="courts"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    value={form.courts || ''}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1">Points to Win</label>
                  <input
                    type="number"
                    name="points_to_win"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    value={form.points_to_win || ''}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1">Win By Margin</label>
                  <input
                    type="number"
                    name="win_by_margin"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    value={form.win_by_margin || ''}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1">Games per Match</label>
                  <input
                    type="number"
                    name="games_per_match"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    value={form.games_per_match || ''}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1">Players per Court</label>
                  <input
                    type="number"
                    name="players_per_court"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    value={form.players_per_court || ''}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1">Max Players</label>
                  <input
                    type="number"
                    name="max_players"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    value={form.max_players || form.total_players || ''}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1">Access Mode</label>
                  <select
                    name="access_mode"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    value={form.access_mode || ''}
                    onChange={handleFormChange}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1">Event Type</label>
                  <div className="w-full rounded border border-gray-200 px-3 py-2 bg-gray-100 text-gray-700 cursor-not-allowed">
                    {formatEventType(form.event_type || '')}
                  </div>
                </div>
                {/* Court Display Names Edit */}
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1">Custom Court Names</label>
                  <div className="space-y-1">
                    {Array.from({ length: Number(form.courts) || 0 }, (_, i) => {
                      const courtNum = (i + 1).toString();
                      return (
                        <div key={courtNum} className="flex items-center gap-2">
                          <span className="w-16">Court {courtNum}:</span>
                          <input
                            type="text"
                            className="flex-1 rounded border border-gray-300 px-2 py-1"
                            value={form.court_meta?.[courtNum] || ''}
                            onChange={e => handleCourtNameChange(courtNum, e.target.value)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    type="button"
                    className="bg-gray-300 text-gray-800"
                    onClick={() => setEditOpen(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-teal-500 text-white"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default EventDetailsSection; 