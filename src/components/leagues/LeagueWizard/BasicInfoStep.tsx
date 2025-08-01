import React from 'react';
import { Calendar } from 'lucide-react';
import Input from '../../ui/Input';
import { LeagueFormData } from './types';

interface BasicInfoStepProps {
  data: LeagueFormData;
  onChange: (field: keyof LeagueFormData | 'errors', value: any) => void;
  errors: Record<string, string>;
}

const playDays = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

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

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ data, onChange, errors }) => {
  const handleInputChange = (field: keyof LeagueFormData, value: any) => {
    // Handle empty time values
    if ((field === 'start_time' || field === 'end_time') && !value) {
      onChange(field, null);
      return;
    }
    onChange(field, value);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input
        label="League Name *"
        value={data.name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
        error={errors.name}
        required
      />
      
      <div className="flex flex-col">
        <label className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Gender Type <span className="text-error-600">*</span>
        </label>
        <select
          value={data.gender_type || ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('gender_type', e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          required
        >
          <option value="">Select Gender Type</option>
          <option value="Men">Men</option>
          <option value="Women">Women</option>
          <option value="Mixed">Mixed</option>
        </select>
        {errors.gender_type && (
          <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.gender_type}</p>
        )}
      </div>
      <Input
        label="Description"
        placeholder="e.g., A friendly league for intermediate players"
        value={data.description}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('description', e.target.value)}
        error={errors.description}
        maxLength={500}
      />
      <Input
        id="location"
        label="Location"
        placeholder="e.g., Epic Pickleball Club, 123 Main St"
        value={data.location}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('location', e.target.value)}
        error={errors.location}
        maxLength={200}
      />
      <div className="flex flex-col">
        <label className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Play Day <span className="text-error-600">*</span>
        </label>
        <select
          value={data.play_day}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('play_day', e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          required
        >
          <option value="">Select Day</option>
          {playDays.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
        {errors.play_day && (
          <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.play_day}</p>
        )}
      </div>
      <div className="flex flex-col">
        <label className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Access Mode <span className="text-error-600">*</span>
        </label>
        <select
          value={data.access_mode || 'open'}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('access_mode', e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          required
        >
          <option value="open">Open</option>
          <option value="invite">Invitation-Only</option>
          <option value="paid">Paid</option>
        </select>
      </div>
      <Input
        label="Start Date *"
        type="date"
        value={data.start_date}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('start_date', e.target.value)}
        error={errors.start_date}
        required
        leftIcon={<Calendar size={16} color="#fff" />}
      />
      <Input
        label="End Date *"
        type="date"
        value={data.end_date}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('end_date', e.target.value)}
        error={errors.end_date}
        required
        leftIcon={<Calendar size={16} color="#fff" />}
      />
      <div className="flex flex-col">
        <label className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Start Time <span className="text-error-600">*</span>
        </label>
        <select
          value={data.start_time || ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('start_time', e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          required
          style={{ maxHeight: '200px', overflowY: 'auto' }}
        >
          <option value="">Select Start Time</option>
          {timeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.display}</option>
          ))}
        </select>
        {errors?.start_time && (
          <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.start_time}</p>
        )}
      </div>
      <div className="flex flex-col">
        <label className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
          End Time <span className="text-error-600">*</span>
        </label>
        <select
          value={data.end_time || ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('end_time', e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          required
          style={{ maxHeight: '200px', overflowY: 'auto' }}
        >
          <option value="">Select End Time</option>
          {timeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.display}</option>
          ))}
        </select>
        {errors?.end_time && (
          <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.end_time}</p>
        )}
      </div>
    </div>
  );
};

export default BasicInfoStep;