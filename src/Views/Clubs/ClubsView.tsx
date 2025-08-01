import React from 'react';
import { Plus, MapPin, Users, Building2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { useAuth } from '../../components/Contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface ClubsViewProps {
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

const ClubsView: React.FC<ClubsViewProps> = ({ onNavigate }) => {
  const { user, profileId } = useAuth();

  // Convex query to fetch clubs
  const clubs = useQuery(api.clubFunctions.getUserClubs, 
    profileId ? { profileId } : 'skip'
  );

  const isLoading = clubs === undefined;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
            My Clubs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your pickleball clubs
          </p>
        </div>
        <Button 
          leftIcon={<Plus size={16} />}
          onClick={() => onNavigate?.('/clubs/create')}
        >
          Create Club
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : !clubs || clubs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
            <Building2 size={24} className="text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            No clubs yet
          </h3>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Get started by creating your first club
          </p>
          <Button onClick={() => onNavigate?.('/clubs/create')}>
            Create Your First Club
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <Card
              key={club._id}
              className="group transition-transform hover:scale-105"
            >
              <CardHeader>
                <CardTitle>{club.name}</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <MapPin size={16} className="mr-2" />
                  <span>{club.location}</span>
                </div>
                {club.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {club.description}
                  </p>
                )}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Users size={16} className="mr-2" />
                  <span>{club.admins.length} admin{club.admins.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onNavigate?.(`/clubs/${club._id}`)}
                  >
                    View
                  </Button>
                  {(club.created_by === profileId || club.admins.includes(profileId || '')) && (
                    <Button 
                      size="sm"
                      onClick={() => onNavigate?.(`/clubs/${club._id}/edit`)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubsView;