import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, Download } from 'lucide-react';
import Button from '../components/ui/Button';
import PlayerAttendanceList from '../components/admin/PlayerAttendanceList';
import CourtConfigurationCard from '../components/admin/CourtConfigurationsCard';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '../components/Contexts/AuthContext';
import type { Player, CourtConfig } from '../services/gameDayService';

const GameDayControlView: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeagueId, setSelectedLeagueId] = useState<Id<"leagues"> | null>(null);
  const [gameDayId, setGameDayId] = useState<Id<"game_days"> | null>(null);

  // Convex queries - using existing functions
  const leagues = useQuery(api.adminFunctions.getLeaguesForAdmin, 
    user ? { userId: user._id } : 'skip'
  );
  
  const gameDays = useQuery(api.gameDayFunctions.getGameDays,
    selectedLeagueId ? { leagueId: selectedLeagueId } : 'skip'
  );

  const players = useQuery(api.gameDayFunctions.getPlayers,
    selectedLeagueId ? { leagueId: selectedLeagueId } : 'skip'
  );

  const courtConfigs = useQuery(api.gameDayFunctions.getCourtConfigurations,
    selectedLeagueId ? { leagueId: selectedLeagueId } : 'skip'
  );

  // Convex mutations - using existing functions
  const markAttendance = useMutation(api.gameDayFunctions.markAttendance);
  const updateCourtSize = useMutation(api.gameDayFunctions.updateCourtSize);
  const finalizeGameDay = useMutation(api.gameDayFunctions.finalizeGameDay);

  // Set default league if user has only one
  useEffect(() => {
    if (leagues && leagues.length === 1 && !selectedLeagueId) {
      setSelectedLeagueId(leagues[0]._id);
    }
  }, [leagues, selectedLeagueId]);

  // Set default game day if there's only one for the selected league
  useEffect(() => {
    if (gameDays && gameDays.length === 1 && !gameDayId) {
      setGameDayId(gameDays[0]._id);
    }
  }, [gameDays, gameDayId]);

  const handleAttendanceChange = async (playerId: string, isPresent: boolean) => {
    if (!selectedLeagueId) return;

    try {
      await markAttendance({ 
        leagueId: selectedLeagueId, 
        playerId: playerId as Id<"profiles">, 
        isPresent 
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const handleCourtSizeChange = async (courtNumber: number, playersCount: number) => {
    if (!selectedLeagueId) return;

    try {
      await updateCourtSize({ 
        leagueId: selectedLeagueId, 
        courtNumber, 
        playersCount 
      });
    } catch (error) {
      console.error('Error updating court size:', error);
    }
  };

  const handleRefresh = async () => {
    // Convex automatically refreshes data, so we just need to trigger a re-render
    console.log('Data refreshed');
  };

  const handleFinalize = async () => {
    if (!window.confirm('Are you sure you want to finalize the game day? This action cannot be undone.')) {
      return;
    }

    if (!selectedLeagueId || !gameDayId) {
      console.error('Missing league ID or game day ID');
      return;
    }

    try {
      await finalizeGameDay({ 
        leagueId: selectedLeagueId, 
        gameDayId 
      });
      console.log('Game day finalized successfully');
    } catch (error) {
      console.error('Error finalizing game day:', error);
    }
  };

  const handleExport = () => {
    console.log('Export feature coming soon!');
  };

  // Transform data for components
  const transformedPlayers: Player[] = players?.map((p: any) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    dup_rating: p.dup_rating,
    is_present: p.is_present || false,
  })) || [];

  const transformedCourts: CourtConfig[] = courtConfigs?.map((c: any) => ({
    court_number: c.court_number,
    display_name: c.display_name,
    players_count: c.players_count,
    players: [], // Empty array as required by interface
  })) || [];

  const isLoading = !leagues || !players || !courtConfigs;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
            Game Day Control Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage attendance and court assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            leftIcon={<RefreshCw size={16} />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            leftIcon={<Download size={16} />}
          >
            Export
          </Button>
          <Button
            onClick={handleFinalize}
            leftIcon={<Check size={16} />}
          >
            Finalize
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PlayerAttendanceList
            players={transformedPlayers}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAttendanceChange={handleAttendanceChange}
            isLoading={isLoading}
          />
        </div>
        <div className="space-y-6 lg:col-span-2">
          {transformedCourts.map((court) => (
            <CourtConfigurationCard
              key={court.court_number}
              court={court}
              onSizeChange={handleCourtSizeChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameDayControlView;