import React, { useState } from 'react';
import { Users, Save, Edit } from 'lucide-react';
import Input from '../../ui/Input';
import { LeagueFormData, CourtMovementRule } from './types';
import Button from '../../ui/Button';

interface CourtSettingsStepProps {
  data: LeagueFormData;
  onChange: (field: keyof LeagueFormData, value: any) => void;
  errors: Record<string, string>;
  courts: number;
  setCourts: (courts: number) => void;
  isSaving: boolean;
  loading: boolean;
  handleSave: () => Promise<void>;
}

const CourtSettingsStep: React.FC<CourtSettingsStepProps> = ({ data, onChange, errors, courts, setCourts, isSaving, loading, handleSave }) => {
  const [isEditingAssignments, setIsEditingAssignments] = useState(true);

  // Ensure court_movement_rules array matches the number of courts
  const court_movement_rules = data.court_movement_rules || [];
  while (court_movement_rules.length < courts) {
    const courtNumber = court_movement_rules.length + 1;
    const isTopCourt = courtNumber === 1;
    const isBottomCourt = courtNumber === courts;

    court_movement_rules.push({
      courtNumber,
      moveUp: isTopCourt ? 0 : 1,
      moveDown: isBottomCourt ? 0 : 1,
      displayName: `Court ${courtNumber}`
    });
  }

  const handleRuleChange = (courtNumber: number, field: string, value: any) => {
    const newRules = [...court_movement_rules];
    const ruleIndex = newRules.findIndex(rule => rule.courtNumber === courtNumber);
    
    if (ruleIndex === -1) {
      newRules.push({
        courtNumber,
        moveUp: field === 'moveUp' ? value : 0,
        moveDown: field === 'moveDown' ? value : 0,
        displayName: field === 'displayName' ? value : `Court ${courtNumber}`
      });
    } else {
      newRules[ruleIndex] = {
        ...newRules[ruleIndex],
        [field]: value
      };
    }
    onChange('court_movement_rules', newRules);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Players Per Court
        </label>
        <select
          value={data.players_per_court}
          onChange={(e) => onChange('players_per_court', parseInt(e.target.value))}
          className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          required
        >
          <option value={4}>4 Players (Standard)</option>
          <option value={2}>2 Players (Singles)</option>
        </select>
        {errors.players_per_court && (
          <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.players_per_court}</p>
        )}
      </div>

      <Input
        label="Number of Courts"
        type="number"
        min="1"
        value={courts}
        onChange={(e) => setCourts(parseInt(e.target.value))}
        error={errors.courts}
        required
        leftIcon={<Users size={16} />}
      />

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

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white">Court Movement Rules</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          {court_movement_rules.map((rule: CourtMovementRule, index: number) => (
            <div key={rule.courtNumber} className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <Input
                label="Display Name"
                value={rule.displayName || `Court ${rule.courtNumber}`}
                onChange={(e) => handleRuleChange(rule.courtNumber, 'displayName', e.target.value)}
                placeholder={`Court ${rule.courtNumber}`}
              />
              <div className="space-y-4">
                <Input
                  label="Players Moving Up"
                  type="number"
                  min="0"
                  value={rule.moveUp}
                  disabled={rule.courtNumber === 1}
                  onChange={(e) => {
                    const newRules = [...court_movement_rules];
                    newRules[index] = {
                      ...rule,
                      moveUp: rule.courtNumber === 1 ? 0 : parseInt(e.target.value) || 0
                    };
                    onChange('court_movement_rules', newRules);
                  }}
                  error={errors[`court_movement_rules.${index}.moveUp`]}
                />
                <Input
                  label="Players Moving Down"
                  type="number"
                  min="0"
                  value={rule.moveDown}
                  disabled={rule.courtNumber === courts}
                  onChange={(e) => {
                    const newRules = [...court_movement_rules];
                    newRules[index] = {
                      ...rule,
                      moveDown: rule.courtNumber === courts ? 0 : parseInt(e.target.value) || 0
                    };
                    onChange('court_movement_rules', newRules);
                  }}
                  error={errors[`court_movement_rules.${index}.moveDown`]}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {isEditingAssignments ? (
        <Button
          onClick={async () => {
            await handleSave();
            setIsEditingAssignments(false);
          }}
          isLoading={isSaving}
          disabled={loading}
          leftIcon={<Save size={16} />}
        >
          Save Assignments
        </Button>
      ) : (
        <Button
          onClick={() => setIsEditingAssignments(true)}
          leftIcon={<Edit size={16} />}
        >
          Edit Assignments
        </Button>
      )}
    </div>
  );
};

export default CourtSettingsStep;