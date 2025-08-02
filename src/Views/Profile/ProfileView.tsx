import React, { useState } from 'react';
import { Save, Mail, User, Phone, MapPin, Award, Calendar, Trophy, Users, Bell, ExternalLink } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import StripeConnectButton from '../../components/Stripe/StripeConnectButton';

interface Profile {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  dup_rating?: number;
  stripe_account_id?: string | null;
}

interface League {
  _id: string;
  name: string;
  status: 'active' | 'completed';
}

interface Club {
  _id: string;
  name: string;
  role: 'player' | 'club_admin';
}

interface ProfileViewProps {
  profile: Profile | null;
  leagues: League[];
  clubs: Club[];
  isLoading: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (profileData: Partial<Profile>) => Promise<void>;
  onStripeConnect?: () => Promise<void>;
  onRefreshProfile?: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  leagues,
  clubs,
  isLoading,
  isEditing,
  onEdit,
  onSave,
  onStripeConnect,
  onRefreshProfile
}) => {
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when profile changes
  React.useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        dup_rating: profile.dup_rating || undefined,
      });
    }
  }, [profile]);

  const handleInputChange = (
    field: keyof Profile,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value ?? '',
    }));
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">Profile Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400">Unable to load profile data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your profile and preferences</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Profile Info */}
        <div className="md:col-span-2">
          {onStripeConnect && (
            <div className="mb-6">
              <StripeConnectButton
                stripeAccountId={profile.stripe_account_id}
                onConnect={onStripeConnect}
                onOpenDashboard={onRefreshProfile}
                disabled={false}
              />
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              {isEditing ? (
                <Button
                  onClick={handleSave}
                  isLoading={isSaving}
                  leftIcon={<Save size={16} />}
                >
                  Save
                </Button>
              ) : (
                <Button
                  onClick={onEdit}
                  isLoading={false}
                  leftIcon={<User size={16} />}
                >
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Input
                    label="First Name"
                    value={isEditing ? (formData.first_name || '') : (profile.first_name || '')}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    leftIcon={<User size={16} />}
                    required
                    disabled={!isEditing}
                  />
                  <Input
                    label="Last Name"
                    value={isEditing ? (formData.last_name || '') : (profile.last_name || '')}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    leftIcon={<User size={16} />}
                    required
                    disabled={!isEditing}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={profile.email}
                    disabled
                    leftIcon={<Mail size={16} />}
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={isEditing ? (formData.phone || '') : (profile.phone || '')}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    formatPhone={true}
                    leftIcon={<Phone size={16} />}
                    required={false}
                    disabled={!isEditing}
                  />
                  <Input
                    label="DUPR Rating"
                    type="number"
                    min="2.0"
                    max="5.0"
                    step="0.1"
                    value={isEditing ? (formData.dup_rating || '') : (profile.dup_rating || '')}
                    onChange={(e) => handleInputChange('dup_rating', e.target.value === '' ? undefined : Number(e.target.value))}
                    leftIcon={<Award size={16} />}
                    required={false}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leagues */}
          {leagues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy size={16} />
                  My Leagues
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {leagues.map((league) => (
                    <div key={league._id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{league.name}</span>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        league.status === 'active'
                          ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {league.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Clubs */}
          {clubs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={16} />
                  My Clubs
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {clubs.map((club) => (
                    <div key={club._id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{club.name}</span>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        club.role === 'club_admin'
                          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {club.role}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Notification Settings - Placeholder for future implementation */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={profile.notification_preferences.email}
                    onChange={(e) => handleInputChange('notification_email', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Receive Email Updates
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={profile.notification_preferences.sms}
                    onChange={(e) => handleInputChange('notification_sms', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Receive Text Notifications
                  </span>
                </label>
              </div>
            </CardBody>
          </Card> */}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;