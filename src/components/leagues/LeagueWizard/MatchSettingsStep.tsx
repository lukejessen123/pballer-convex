import React from 'react';
import { LeagueFormData } from './types';
import Input from '../../ui/Input';

interface MatchSettingsStepProps {
  data: LeagueFormData;
  onChange: (field: keyof LeagueFormData, value: any) => void;
  errors?: Record<string, string>;
  courts: number;
  setCourts: (value: number) => void;
}

const generateTimeOptions = () => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour24 = h.toString().padStart(2, '0');
      const min = m.toString().padStart(2, '0');
      const value = `${hour24}:${min}`;
      // Format for display: 12-hour with AM/PM
      const hour12 = ((h + 11) % 12) + 1;
      const ampm = h < 12 ? 'AM' : 'PM';
      const display = `${hour12}:${min} ${ampm}`;
      options.push({ value, display });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

const MatchSettingsStep: React.FC<MatchSettingsStepProps> = ({ data, onChange, errors = {}, courts, setCourts }) => {
  return (
    <div className="space-y-6">
      {/* Match Type and Win Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Match Type <span className="text-error-600">*</span>
          </label>
          <select
            value={data.match_type || ''}
            onChange={(e) => onChange('match_type', e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            required
          >
            <option value="">Select Match Type</option>
            <option value="singles">Singles</option>
            <option value="doubles">Doubles</option>
          </select>
          {errors?.match_type && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.match_type}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Win Type <span className="text-error-600">*</span>
          </label>
          <select
            value={data.win_type || ''}
            onChange={(e) => onChange('win_type', e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            required
          >
            <option value="">Select Win Type</option>
            <option value="points">Points</option>
            <option value="wins">Wins</option>
          </select>
        </div>
      </div>

      {/* Allow Substitutes Toggle */}
      <div className="space-y-2">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={data.allow_substitutes}
            onChange={(e) => onChange('allow_substitutes', e.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-primary-800"></div>
          <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
            Allow Substitutes
          </span>
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enable this to allow players to sign up as substitutes
        </p>
      </div>

      {/* Win Type Explanation */}
      <div>
        {data.win_type && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {data.win_type === 'points'
              ? 'Players are ranked by total points scored. Ties are broken by wins.'
              : 'Players are ranked by total wins. Ties are broken by points scored.'}
          </p>
        )}
      </div>

      {/* Total Players */}
      <Input
        label="Total Players *"
        type="number"
        min="0"
        value={data.total_players?.toString() || ''}
        onChange={(e) => onChange('total_players', parseInt(e.target.value))}
        required
      />

      {/* Courts */}
      <Input
        label="Number of Courts *"
        type="number"
        min="1"
        value={courts?.toString() || ''}
        onChange={(e) => setCourts(parseInt(e.target.value))}
        required
      />

      {/* Cost Settings */}
      {/* Removed Member Cost and Non-Member Cost fields */}

      {/* DUPR Min/Max */}
      {/* Removed DUPR Minimum and DUPR Maximum fields */}

      {/* Start/End Time */}
      {/* Removed Start/End Time fields */}

      {/* Match Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Games Per Match *"
          type="number"
          min="1"
          value={data.games_per_match?.toString() || ''}
          onChange={(e) => onChange('games_per_match', parseInt(e.target.value))}
          required
        />
        <Input
          label="Games Per Rotation *"
          type="number"
          min="1"
          value={data.games_per_rotation?.toString() || ''}
          onChange={(e) => onChange('games_per_rotation', parseInt(e.target.value))}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Points to Win *"
          type="number"
          min="1"
          value={data.points_to_win?.toString() || ''}
          onChange={(e) => onChange('points_to_win', parseInt(e.target.value))}
          required
        />
        <Input
          label="Win By Margin *"
          type="number"
          min="1"
          value={data.win_by_margin?.toString() || ''}
          onChange={(e) => onChange('win_by_margin', parseInt(e.target.value))}
          required
        />
      </div>
    </div>
  );
};

export default MatchSettingsStep;