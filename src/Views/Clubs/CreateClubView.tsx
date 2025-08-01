import React, { useState } from 'react';
import { MapPin, Building2, FileText } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { useAuth } from '../../components/Contexts/AuthContext';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface CreateClubViewProps {
  onNavigate?: (path: string) => void;
}

const CreateClubView: React.FC<CreateClubViewProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Convex mutation for creating clubs
  const createClub = useMutation(api.clubFunctions.createClub);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user?._id) {
        throw new Error('User not authenticated');
      }

      await createClub({
        name: formData.name,
        description: formData.description,
        location: formData.location,
        createdBy: user._id,
        admins: [user._id],
      });

      console.log('Club created successfully!');
      if (onNavigate) {
        onNavigate('/clubs');
      }
    } catch (error) {
      console.error('Error creating club:', error);
      // In a real app, you'd show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
          Create New Club
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Set up your pickleball club and start managing leagues
        </p>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Club Details</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Club Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter club name"
              leftIcon={<Building2 size={16} />}
              required
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Club Description
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-3 text-gray-500 dark:text-gray-400">
                  <FileText size={16} />
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your club"
                  className="w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 py-2 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                  rows={4}
                />
              </div>
            </div>

            <Input
              label="Club Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Enter club location"
              leftIcon={<MapPin size={16} />}
              required
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate?.('/clubs')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
              >
                Create Club
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default CreateClubView;