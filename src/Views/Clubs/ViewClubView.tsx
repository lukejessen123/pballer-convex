import React from 'react';
import { MapPin, Users, ArrowLeft, Edit } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { useAuth } from '../../components/Contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface ViewClubViewProps {
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

const ViewClubView: React.FC<ViewClubViewProps> = ({ clubId, onNavigate }) => {
  const { user } = useAuth();

  // Convex query to fetch club
  const club = useQuery(api.clubFunctions.getClubById, 
    clubId ? { clubId: clubId as Id<"clubs"> } : 'skip'
  );

  const isLoading = club === undefined;
  const isAdmin = club && (club.created_by === user?._id || club.admins.includes(user?._id || ''));

  if (isLoading) {
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
            The club you're looking for doesn't exist or you don't have permission to view it.
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
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => onNavigate?.('/clubs')}
            >
              Back to Clubs
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
              {club.name}
            </h1>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View club details and manage settings
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => onNavigate?.(`/clubs/${clubId}/edit`)}
            leftIcon={<Edit size={16} />}
          >
            Edit Club
          </Button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Club Information</CardTitle>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Location</h3>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <MapPin size={16} className="mr-2" />
                  <span>{club.location}</span>
                </div>
              </div>

              {club.description && (
                <div>
                  <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Description</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {club.description}
                  </p>
                </div>
              )}

              <div>
                <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Administrators</h3>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Users size={16} className="mr-2" />
                  <span>{club.admins.length} admin{club.admins.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onNavigate?.('/leagues/create')}
                >
                  Create League
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onNavigate?.('/players')}
                >
                  Manage Players
                </Button>
                {isAdmin && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onNavigate?.(`/clubs/${clubId}/edit`)}
                  >
                    Club Settings
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewClubView;