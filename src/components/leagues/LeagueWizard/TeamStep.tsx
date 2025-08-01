import React, { useState } from 'react';
import { Plus, Users, X } from 'lucide-react';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { Card, CardHeader, CardTitle, CardBody } from '../../ui/Card';
import { LeagueFormData, Team } from './types';

interface TeamsStepProps {
  data: LeagueFormData;
  onChange: (field: keyof LeagueFormData, value: any) => void;
  errors: Record<string, string>;
}

const TeamsStep: React.FC<TeamsStepProps> = ({ data, onChange, errors }) => {
  const handleAddTeam = () => {
    onChange('teams', [
      ...(data.teams || []),
      { name: '', players: [] }
    ]);
  };

  const handleRemoveTeam = (index: number) => {
    const newTeams = [...(data.teams || [])];
    newTeams.splice(index, 1);
    onChange('teams', newTeams);
  };

  const handleTeamChange = (index: number, field: 'name' | 'players', value: any) => {
    const newTeams = [...(data.teams || [])];
    newTeams[index] = {
      ...newTeams[index],
      [field]: value
    };
    onChange('teams', newTeams);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Teams</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Optionally create teams for your league
          </p>
        </div>
        <Button
          onClick={handleAddTeam}
          leftIcon={<Plus size={16} />}
        >
          Add Team
        </Button>
      </div>

      {data.teams?.map((team: Team, index: number) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Team {index + 1}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveTeam(index)}
              className="text-error-600 hover:bg-error-50 hover:text-error-700 dark:text-error-400 dark:hover:bg-error-900/30"
            >
              <X size={16} />
            </Button>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Input
                label="Team Name"
                value={team.name}
                onChange={(e) => handleTeamChange(index, 'name', e.target.value)}
                error={errors[`teams.${index}.name`]}
                required
              />
              
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Players
                </label>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Players can be added to the team after the league is created
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}

      {!data.teams?.length && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
          <Users size={24} className="mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">
            No teams created yet
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={handleAddTeam}
            leftIcon={<Plus size={16} />}
          >
            Add First Team
          </Button>
        </div>
      )}
    </div>
  );
};

export default TeamsStep; 