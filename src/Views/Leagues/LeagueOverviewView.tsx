import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import LeagueSettingsModal from './LeagueSettingsModal';

interface GameDay {
  id: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface League {
  id: string;
  name: string;
  description: string;
  match_type: string;
  play_day: number;
  start_date: string;
  end_date: string;
  dupr_min?: number;
  dupr_max?: number;
  gender_type?: string;
  points_to_win: number;
  win_by_margin: number;
  games_per_match: number;
  games_per_rotation: number;
  players_per_court: number;
  win_type: 'points' | 'wins';
  created_by: string;
}

// Helper to format a date string (YYYY-MM-DD) as local date
function formatLocalDateFromYMD(dateString: string) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  return localDate.toLocaleDateString();
}

const LeagueOverviewView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gameDays, setGameDays] = useState<GameDay[]>([]);
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoadingGameDays, setIsLoadingGameDays] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchLeague = async () => {
      if (!id) return;
      if (!user) return;
      
      // Check super admin status
      const { data: superAdminData } = await supabase
        .from('super_admins')
        .select('id')
        .eq('id', user?.id)
        .single();
      
      setIsSuperAdmin(!!superAdminData);
      
      const { data, error } = await supabase.from('leagues').select('*').eq('id', id).single();
      if (error) {
        toast.error('Failed to load league.');
        navigate('/leagues');
        return;
      }
      
      // Check admin status
      if (data.club_id) {
        const { data: clubData } = await supabase
          .from('clubs')
          .select('created_by, admins')
          .eq('id', data.club_id)
          .single();
        
        setIsAdmin(
          clubData?.created_by === user?.id ||
          (clubData?.admins || []).includes(user?.id)
        );
      }
      
      setLeague(data);
      setLoading(false);
    };
    fetchLeague();
  }, [id, navigate, user]);

  useEffect(() => {
    fetchGameDays();
  }, [id]);

  const fetchGameDays = async () => {
    if (!id) return;

    setIsLoadingGameDays(true);
    try {
      const { data, error } = await supabase
        .from('game_days')
        .select('*')
        .eq('league_id', id)
        .order('date', { ascending: true });

      if (error) throw error;
      setGameDays(data || []);
    } catch (error) {
      console.error('Error fetching game days:', error);
      toast.error('Failed to load game days');
    } finally {
      setIsLoadingGameDays(false);
    }
  };

  // Add delete handler
  const handleDelete = async () => {
    if (!window.confirm('Are you sure? Deleting a league is permanent and cannot be undone.')) {
      return;
    }
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('event_type', 'league');
      if (error) throw error;
      toast.success('League deleted successfully');
      navigate('/leagues');
    } catch (error) {
      console.error('Error deleting league:', error);
      toast.error('Failed to delete league');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-700 dark:text-gray-300">Loading League...</p>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>League not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Back Button and Actions */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
            {league.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">League Overview</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/leagues')}
            className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            ← Back to My Leagues
          </Button>
          {(league.created_by === user?.id || isSuperAdmin) && (
            <Button
              variant="outline"
              onClick={() => setShowSettings(true)}
              className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              View Settings
            </Button>
          )}
          {/* Show delete for league creator or super admin */}
          {(league.created_by === user?.id || isSuperAdmin) && (
            <Button
              variant="outline"
              color="error"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete League'}
            </Button>
          )}
        </div>
      </div>

      {/* League Overview */}
      <Card>
        <CardBody>
          <p className="mb-6 text-gray-600 dark:text-gray-400">{league.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Match Type</h3>
              <p className="text-gray-700 dark:text-gray-300">{league.match_type}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Gender Type</h3>
              <p className="text-gray-700 dark:text-gray-300">{league.gender_type}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Play Day</h3>
              <p className="text-gray-700 dark:text-gray-300">
                {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][league.play_day]}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Season Dates</h3>
              <p className="text-gray-700 dark:text-gray-300">{formatLocalDateFromYMD(league.start_date)} → {formatLocalDateFromYMD(league.end_date)}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">DUPR Range</h3>
              <p className="text-gray-700 dark:text-gray-300">{league.dupr_min} - {league.dupr_max}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Win Type</h3>
              <p className="text-gray-700 dark:text-gray-300">
                {league.win_type === 'points' ? 'Ranked by Points' : 'Ranked by Wins'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
      <LeagueSettingsModal
        league={league}
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

export default LeagueOverviewView;