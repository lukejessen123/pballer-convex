import React, { useEffect } from 'react';
import { LeagueFormData, CourtMovementRule } from './types';
import { Card, CardHeader, CardTitle, CardBody } from '../../ui/Card';
import Input from '../../ui/Input';

interface CourtMovementRulesStepProps {
  data: LeagueFormData;
  onChange: (field: keyof LeagueFormData, value: any) => void;
  errors?: Record<string, string>;
  courts: number;
}

const CourtMovementRulesStep: React.FC<CourtMovementRulesStepProps> = ({
  data,
  onChange,
  errors = {},
  courts,
}) => {
  useEffect(() => {
    // Initialize court movement rules based on number of courts
    if (courts > 0 && (!data.court_movement_rules || data.court_movement_rules.length !== courts)) {
      const newRules = Array.from({ length: courts }, (_, index) => ({
        courtNumber: index + 1,
        moveUp: index === 0 ? 0 : 1, // Top court can't move up
        moveDown: index === courts - 1 ? 0 : 1, // Bottom court can't move down
        displayName: `Court ${index + 1}`,
      }));
      onChange('court_movement_rules', newRules);
    }
  }, [courts]);

  const handleRuleChange = (courtNumber: number, field: 'moveUp' | 'moveDown' | 'displayName', value: string) => {
    const newValue = field === 'displayName' ? value : Math.max(0, parseInt(value) || 0);
    const newRules = data.court_movement_rules.map((rule: CourtMovementRule) => {
      if (rule.courtNumber === courtNumber) {
        return { ...rule, [field]: newValue };
      }
      return rule;
    });
    
    // Validate and update the rules
    onChange('court_movement_rules', newRules);
  };

  if (!courts || courts < 1) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        Please set the number of courts first
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.court_movement_rules.map((rule: CourtMovementRule, index: number) => (
          <Card key={rule.courtNumber}>
            <CardHeader>
              <Input
                label="Display Name"
                value={rule.displayName}
                onChange={(e) => handleRuleChange(rule.courtNumber, 'displayName', e.target.value)}
                placeholder={`Court ${rule.courtNumber}`}
              />
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Players Moving Up"
                type="number"
                min="0"
                max={data.players_per_court}
                value={rule.moveUp}
                onChange={(e) => handleRuleChange(rule.courtNumber, 'moveUp', e.target.value)}
                disabled={index === 0} // Disable for top court
                error={errors[`court_${rule.courtNumber}_moveUp`]}
              />
              <Input
                label="Players Moving Down"
                type="number"
                min="0"
                max={data.players_per_court}
                value={rule.moveDown}
                onChange={(e) => handleRuleChange(rule.courtNumber, 'moveDown', e.target.value)}
                disabled={index === courts - 1} // Disable for bottom court
                error={errors[`court_${rule.courtNumber}_moveDown`]}
              />
              {index === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Top court - players can only move down
                </p>
              )}
              {index === courts - 1 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bottom court - players can only move up
                </p>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CourtMovementRulesStep;