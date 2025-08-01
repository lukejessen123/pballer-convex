import React from 'react';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

interface LeagueSettingsModalProps {
  league: any;
  courtConfigs: CourtConfig[];
  open: boolean;
  onClose: () => void;
  isLoading: boolean;
}

interface CourtConfig {
  _id: string;
  court_number: number;
  display_name: string;
  players_moving_up: number;
  players_moving_down: number;
  players_count: number;
}

// Helper to format a date string (YYYY-MM-DD) as local date
function formatLocalDateFromYMD(dateString: string) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  return localDate.toLocaleDateString();
}

// Helper to extract and format time from ISO string as 12-hour (e.g., 3:00 AM)
function formatTimeFromISOString(isoString: string) {
  if (!isoString) return '';
  // Extract HH:mm from ISO string
  const match = isoString.match(/T(\d{2}):(\d{2})/);
  if (!match) return '';
  let [_, hourStr, minuteStr] = match;
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

// Helper to format start/end as in GameDayList
function formatStartEndDateTime(startDate: string, startTime: string, endDate: string, endTime: string) {
  if (!startDate || !startTime || !endDate || !endTime) return '';
  // Combine date and time into ISO string
  const start = new Date(`${startDate}T${startTime}:00Z`);
  const end = new Date(`${endDate}T${endTime}:00Z`);
  return (
    start.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) +
    ' - ' +
    end.toLocaleTimeString([], { timeStyle: 'short' })
  );
}

const LeagueSettingsModal: React.FC<LeagueSettingsModalProps> = ({ 
  league, 
  courtConfigs, 
  open, 
  onClose, 
  isLoading 
}) => {
  // Helper for boolean display
  const yesNo = (val: boolean) => (val ? 'Yes' : 'No');

  return (
    <Modal isOpen={open} onClose={onClose} title="League Settings">
      {isLoading ? (
        <div className="flex justify-center items-center py-8"><Spinner /></div>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto space-y-6 pr-2">
          <div>
            <h2 className="font-semibold mb-2 text-gray-900 dark:text-white">Basic Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Name:</span> {league.name}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Description:</span> {league.description}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Location:</span> {league.location}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Access Mode:</span> {league.access_mode}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Match Type:</span> {league.match_type}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Gender:</span> {league.gender_type}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Play Day:</span> {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][parseInt(league.play_day, 10) || 0]}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Season Dates:</span> {formatLocalDateFromYMD(league.start_date)} → {formatLocalDateFromYMD(league.end_date)}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Start Time:</span> {formatTimeFromISOString(league.start_time)}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">End Time:</span> {formatTimeFromISOString(league.end_time)}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">DUPR Range:</span> {league.dupr_min} - {league.dupr_max}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Win Type:</span> {league.win_type === 'points' ? 'Ranked by Points' : 'Ranked by Wins'}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Points to Win:</span> {league.points_to_win}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Win by Margin:</span> {league.win_by_margin}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Games per Match:</span> {league.games_per_match}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Games per Rotation:</span> {league.games_per_rotation}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Players per Court:</span> {league.players_per_court}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Courts:</span> {league.courts}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Total Players:</span> {league.total_players}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Allow Substitutes:</span> {yesNo(league.allow_substitutes)}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Cost:</span> {league.cost}</div>
              <div className="text-gray-900 dark:text-white"><span className="font-medium">Club:</span> {league.club_id}</div>
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-2 mt-4 text-gray-900 dark:text-white">Court Movement Rules</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 text-gray-900 dark:text-white">Court</th>
                    <th className="border px-2 py-1 text-gray-900 dark:text-white">Players Up</th>
                    <th className="border px-2 py-1 text-gray-900 dark:text-white">Players Down</th>
                    <th className="border px-2 py-1 text-gray-900 dark:text-white">Players Per Court</th>
                  </tr>
                </thead>
                <tbody>
                  {courtConfigs.map(court => (
                    <tr key={court._id}>
                      <td className="border px-2 py-1 text-gray-900 dark:text-white">{court.display_name}</td>
                      <td className="border px-2 py-1 text-gray-900 dark:text-white">{court.players_moving_up}</td>
                      <td className="border px-2 py-1 text-gray-900 dark:text-white">{court.players_moving_down}</td>
                      <td className="border px-2 py-1 text-gray-900 dark:text-white">{court.players_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default LeagueSettingsModal; 