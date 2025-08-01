import React, { useState } from 'react';
import { Plus, Trophy, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';

interface League {
  _id: string;
  name: string;
  total_players: number;
  matches_count: number;
  role: 'admin' | 'player';
  end_date: string | null;
  location?: string;
  created_by?: string;
  creator_first_name?: string;
  creator_last_name?: string;
  play_day?: string | number;
  start_time?: string;
  end_time?: string;
}

interface MyLeaguesViewProps {
  leagues: League[];
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  onNavigate?: (path: string) => void;
  onDeleteLeague?: (leagueId: string) => Promise<void>;
}

const MyLeaguesView: React.FC<MyLeaguesViewProps> = ({ 
  leagues, 
  isLoading, 
  isAdmin, 
  isSuperAdmin, 
  onNavigate,
  onDeleteLeague 
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeLeagues = leagues.filter(league => {
    if (!league.end_date) return true;
    return new Date(league.end_date.replace(/-/g, '/')) >= today;
  });

  const archivedLeagues = leagues.filter(league => {
    if (!league.end_date) return false;
    return new Date(league.end_date.replace(/-/g, '/')) < today;
  });

  const leaguesToDisplay = activeTab === 'active' ? activeLeagues : archivedLeagues;

  const handleDelete = async (leagueId: string) => {
    if (!window.confirm('Are you sure? Deleting a league is permanent and cannot be undone.')) {
      return;
    }
    if (onDeleteLeague) {
      try {
        await onDeleteLeague(leagueId);
      } catch (error) {
        console.error('Error deleting league:', error);
      }
    }
  };

  // Add helper functions for formatting
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function extractAndFormatTime(utcString: string | undefined): string {
    if (!utcString) return '';
    // Extract the time part (HH:mm) from the ISO string
    const match = utcString.match(/T(\d{2}):(\d{2})/);
    if (!match) return '';
    let hour = parseInt(match[1], 10);
    const minute = match[2];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  }

  const handleCreateLeague = () => {
    if (onNavigate) {
      onNavigate('/leagues/create');
    }
  };

  const handleViewLeague = (leagueId: string) => {
    if (onNavigate) {
      onNavigate(`/leagues/${leagueId}/game-days`);
    }
  };

  const handleViewLeagueDetails = (leagueId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onNavigate) {
      onNavigate(`/leagues/${leagueId}`);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">My Leagues</h1>
        </div>
        {(isSuperAdmin || isAdmin) && (
          <Button onClick={handleCreateLeague} leftIcon={<Plus size={16} />}>
            Create New League
          </Button>
        )}
      </div>

      <div className="mb-6 flex border-b border-gray-700">
        <button
          className={`px-4 py-2 text-lg font-medium ${activeTab === 'active' ? 'border-b-2 border-primary-400 text-white' : 'text-gray-400'}`}
          onClick={() => setActiveTab('active')}
        >
          Active ({activeLeagues.length})
        </button>
        <button
          className={`px-4 py-2 text-lg font-medium ${activeTab === 'archived' ? 'border-b-2 border-primary-400 text-white' : 'text-gray-400'}`}
          onClick={() => setActiveTab('archived')}
        >
          Archived ({archivedLeagues.length})
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          </div>
        ) : leaguesToDisplay.length === 0 ? (
          <Card className="col-span-full flex min-h-[200px] items-center justify-center border-2 border-dashed border-gray-300 bg-transparent p-6 dark:border-gray-700">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                <Trophy size={24} className="text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                No {activeTab} leagues found
              </h3>
            </div>
          </Card>
        ) : leaguesToDisplay.map((league) => (
          <div
            key={league._id}
            className="transition-transform hover:scale-105 cursor-pointer outline-none"
            tabIndex={0}
            role="button"
            onClick={() => handleViewLeague(league._id)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') handleViewLeague(league._id); }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{league.name}</CardTitle>
                  {league.creator_first_name && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Created by: {league.creator_first_name} {league.creator_last_name}
                    </div>
                  )}
                </div>
                <div className="rounded-full bg-primary-100 p-2 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
                  <Trophy size={20} />
                </div>
              </CardHeader>
              <CardBody>
                <div className="mb-4 space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Players: </span>
                    <span className="font-medium text-gray-900 dark:text-white">{league.total_players}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Location: <span className="font-medium text-white">{league.location || 'TBD'}</span></span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Time: <span className="font-medium text-white">
                      {typeof league.play_day !== 'undefined' && league.start_time && league.end_time
                        ? `${dayNames[Number(league.play_day)]}, ${extractAndFormatTime(league.start_time)} - ${extractAndFormatTime(league.end_time)}`
                        : 'TBD'}
                    </span></span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e: React.MouseEvent) => handleViewLeagueDetails(league._id, e)}
                  >
                    View
                  </Button>
                  {((league.created_by === league.created_by) || isSuperAdmin) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e: React.MouseEvent) => { 
                        e.stopPropagation(); 
                        handleDelete(league._id); 
                      }}
                    >
                      <Trash2 size={16} className="text-error-600 dark:text-error-400" />
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyLeaguesView;