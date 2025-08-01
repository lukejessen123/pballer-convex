import React, { useState, useEffect } from 'react';
import { MapPin, Building2, FileText, ArrowLeft, Save } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { useAuth } from '../../components/Contexts/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface EditClubViewProps {
  clubId?: string;
  onNavigate?: (path: string) => void;
}

interface Club {
  _id: string;
  name: string;
  description: string | null;
  location: string;
  created_by: string;
  admins: string[];
}

const EditClubView: React.FC<EditClubViewProps> = ({ clubId, onNavigate }) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Omit<Club, '_id' | 'created_by'>>({
    name: '',
    description: '',
    location: '',
    admins: [],
  });

  // Convex queries and mutations
  const club = useQuery(api.clubFunctions.getClubById, 
    clubId ? { clubId: clubId as Id<"clubs"> } : 'skip'
  );
  
  const updateClub = useMutation(api.clubFunctions.updateClub);

  useEffect(() => {
    if (club) {
      // Check if user has permission to edit
      if (club.created_by !== user?._id && !club.admins.includes(user?._id || '')) {
        console.error('You do not have permission to edit this club');
        if (onNavigate) {
          onNavigate(`/clubs/${clubId}`);
        }
        return;
      }

      setFormData({
        name: club.name,
        description: club.description || '',
        location: club.location,
        admins: club.admins,
      });
    }
  }, [club, user?._id, clubId, onNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!clubId) throw new Error('No club ID provided');

      await updateClub({
        clubId: clubId as Id<"clubs">,
        name: formData.name,
        description: formData.description || null,
        location: formData.location,
        admins: formData.admins,
      });

      console.log('Club updated successfully!');
      if (onNavigate) {
        onNavigate(`/clubs/${clubId}`);
      }
    } catch (error) {
      console.error('Error updating club:', error);
      // In a real app, you'd show a toast notification here
    } finally {
      setIsSaving(false);
    }
  };

  if (club === undefined) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            Club not found
          </h3>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            The club you're looking for doesn't exist or you don't have permission to edit it.
          </p>
          <Button onClick={() => onNavigate?.('/clubs')}>
            Back to Clubs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => onNavigate?.(`/clubs/${clubId}`)}
            leftIcon={<ArrowLeft size={16} />}
          >
            Back to Club
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
            Edit Club
          </h1>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Update your club's information
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
                  value={formData.description || ''}
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
                onClick={() => onNavigate?.(`/clubs/${clubId}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSaving}
                leftIcon={<Save size={16} />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default EditClubView;