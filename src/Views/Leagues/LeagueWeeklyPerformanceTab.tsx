import React from 'react';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

interface LeagueWeeklyPerformanceTabProps {
  leagueId: string;
  weeklyData: WeeklyPerformanceData[];
  isLoading: boolean;
  error: string | null;
}

interface WeeklyPerformanceData {
  _id: string;
  week: string;
  player_id: string;
  player_name: string;
  games_played: number;
  games_won: number;
  total_points: number;
  average_points: number;
  win_percentage: number;
}

const LeagueWeeklyPerformanceTab: React.FC<LeagueWeeklyPerformanceTabProps> = ({ 
  leagueId, 
  weeklyData, 
  isLoading, 
  error 
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        Error loading weekly performance data: {error}
      </div>
    );
  }

  if (weeklyData.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No weekly performance data available.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-white">Weekly Performance</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-700 text-sm">
          <thead>
            <tr className="bg-gray-800">
              <th className="border border-gray-700 px-2 py-1 text-white">Week</th>
              <th className="border border-gray-700 px-2 py-1 text-white">Player</th>
              <th className="border border-gray-700 px-2 py-1 text-white">Games Played</th>
              <th className="border border-gray-700 px-2 py-1 text-white">Games Won</th>
              <th className="border border-gray-700 px-2 py-1 text-white">Total Points</th>
              <th className="border border-gray-700 px-2 py-1 text-white">Avg Points</th>
              <th className="border border-gray-700 px-2 py-1 text-white">Win %</th>
            </tr>
          </thead>
          <tbody>
            {weeklyData.map((data) => (
              <tr key={data._id} className="hover:bg-gray-700">
                <td className="border border-gray-700 px-2 py-1 text-white">{data.week}</td>
                <td className="border border-gray-700 px-2 py-1 text-white">{data.player_name}</td>
                <td className="border border-gray-700 px-2 py-1 text-white">{data.games_played}</td>
                <td className="border border-gray-700 px-2 py-1 text-white">{data.games_won}</td>
                <td className="border border-gray-700 px-2 py-1 text-white">{data.total_points}</td>
                <td className="border border-gray-700 px-2 py-1 text-white">{data.average_points.toFixed(1)}</td>
                <td className="border border-gray-700 px-2 py-1 text-white">{(data.win_percentage * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeagueWeeklyPerformanceTab; 