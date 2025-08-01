import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import BasicInfoStep from './BasicInfoStep';
import MatchSettingsStep from './MatchSettingsStep';
import CourtMovementRules from './CourtMovementRulesStep';
import SectionHeader from '../../ui/SectionHeader';
import Spinner from '../../ui/Spinner';
import Button from '../../ui/Button';
import { LeagueFormData, CourtMovementRule } from './types';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  useLeague, 
  useCourtConfigurations, 
  useCreateLeague, 
  useUpdateLeague,
  normalizeLeagueFromDB, 
  normalizeLeagueFormForDB 
} from '../../../services/leagueService';
import { Id } from '../../../../convex/_generated/dataModel';

const LeagueWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profileId } = useAuth();

  const [formData, setFormData] = useState<LeagueFormData>({
    name: '',
    description: '',
    location: '',
    access_mode: 'open',
    match_type: null,
    play_day: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    gender_type: null,
    total_players: 0,
    courts: 1,
    cost: 0,
    allow_substitutes: false,
    win_type: 'points',
    points_to_win: 16,
    win_by_margin: 1,
    games_per_match: 6,
    games_per_rotation: 2,
    players_per_court: 4,
    court_movement_rules: [],
    club_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Convex hooks
  const league = useLeague(id as Id<"leagues">);
  const courtConfigurations = useCourtConfigurations(id as Id<"leagues">);
  const createLeague = useCreateLeague();
  const updateLeague = useUpdateLeague();

  const logDebug = (msg: string, data?: any) => console.log(`[LeagueWizard] ${msg}`, data || '');
  const logError = (msg: string, error: any) => {
    console.error(`[LeagueWizard] ${msg}:`, error);
    if (error?.message) console.error('Error message:', error.message);
    if (error?.details) console.error('Error details:', error.details);
    if (error?.hint) console.error('Error hint:', error.hint);
    if (error?.code) console.error('Error code:', error.code);
  };

  const onChange = (field: keyof LeagueFormData | 'errors', value: any) => {
    if (field === 'errors') setErrors(value);
    else {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };
        // Centralized start_date validation
        if (field === 'start_date') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const selectedDate = new Date(value + 'T00:00:00');
          setErrors((prevErrors) => {
            if (!value) return { ...prevErrors, start_date: 'Start date required' };
            if (selectedDate < today) return { ...prevErrors, start_date: 'Start Date cannot be in the past.' };
            const { start_date, ...rest } = prevErrors;
            return rest;
          });
        }
        return updated;
      });
    }
  };

  // Load league data when editing
  useEffect(() => {
    if (id && league && courtConfigurations) {
      logDebug(`Loading league data for ID: ${id}`);
      
      // Use normalization utility to convert DB data to local for the form
      const formatted = normalizeLeagueFromDB(league);
      
      // Map court configurations to court_movement_rules
      let court_movement_rules: CourtMovementRule[] = [];
      if (courtConfigurations && courtConfigurations.length > 0) {
        court_movement_rules = courtConfigurations.map((c) => ({
          courtNumber: c.court_number,
          displayName: c.display_name || `Court ${c.court_number}`,
          moveUp: c.players_moving_up ?? (c.court_number === 1 ? 0 : 1),
          moveDown: c.players_moving_down ?? (courtConfigurations.length > 1 && c.court_number === courtConfigurations.length ? 0 : 1),
        }));
      }
      
      setFormData((prev) => ({ ...prev, ...formatted, court_movement_rules }));
      logDebug('Loaded league data:', formatted);
    }
  }, [id, league, courtConfigurations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logDebug('Submitting form:', formData);

    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name required';
    if (!formData.match_type) newErrors.match_type = 'Match type required';
    if (!formData.gender_type) newErrors.gender_type = 'Gender type required';
    if (!formData.win_type) newErrors.win_type = 'Win type required';
    if (!formData.play_day && formData.play_day !== '0') newErrors.play_day = 'Play day required';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    if (!formData.start_date) newErrors.start_date = 'Start date required';
    else if (start < today) newErrors.start_date = 'Start cannot be past';
    if (!formData.end_date) newErrors.end_date = 'End date required';
    else if (end < start) newErrors.end_date = 'End after start required';
    if (formData.total_players < 1) newErrors.total_players = 'Total players ≥ 1';
    if (formData.courts < 1) newErrors.courts = 'Courts ≥ 1';

    if (Object.keys(newErrors).length > 0) {
      logDebug('Validation failed:', newErrors);
      setErrors(newErrors);
      toast.error('Fix validation errors');
      return;
    }

    try {
      setLoading(true);
      
      // Remove frontend-only fields before sending to DB
      const { court_movement_rules, ...formDataForDB } = formData;
      const payload = normalizeLeagueFormForDB({ 
        ...formDataForDB,
        club_id: formDataForDB.club_id || '' 
      });

      logDebug('Saving league payload:', payload);
      
      if (id) {
        // Update existing league
        await updateLeague({
          leagueId: id as Id<"leagues">,
          ...payload,
          courtMovementRules: court_movement_rules,
        });
        toast.success('League updated');
      } else {
        // Create new league
        if (!profileId) {
          throw new Error('User profile not found');
        }
        
        await createLeague({
          ...payload,
          created_by: profileId as Id<"profiles">,
          players: [],
          substitutes: [],
          courtMovementRules: court_movement_rules,
        });
        toast.success('League created!');
      }
      
      navigate('/leagues');
    } catch (err) {
      logError('Save error', err);
      toast.error((err as any)?.message || 'Error saving league');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Current access_mode:', formData.access_mode);
  }, [formData.access_mode]);

  const setCourts = (value: number) => setFormData((prev) => ({ ...prev, courts: value }));

  // Show loading spinner while fetching data
  if (id && (league === undefined || courtConfigurations === undefined)) {
    return <Spinner />;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-10 p-6">
      <SectionHeader title="Basic Information" />
      <BasicInfoStep data={formData} onChange={onChange} errors={errors} />
      <SectionHeader title="Match Settings" />
      <MatchSettingsStep data={formData} onChange={onChange} errors={errors} courts={formData.courts} setCourts={setCourts} />
      <SectionHeader title="Court Movement Rules" />
      <CourtMovementRules data={formData} onChange={onChange} errors={errors} courts={formData.courts} />
      <div className="flex justify-center">
        <Button type="submit" isLoading={loading} size="lg">
          {id ? 'Update League' : 'Create League'}
        </Button>
      </div>
    </form>
  );
};

export default LeagueWizard; 