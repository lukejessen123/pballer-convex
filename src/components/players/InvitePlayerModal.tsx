import React, { useState } from 'react';
import { Mail, Phone, Star } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../ui/Card';
import toast from 'react-hot-toast';
import { useInvitePlayerToLeague, InviteFormData } from '../../services/playerService';
import { Id } from '../../../convex/_generated/dataModel';

interface InvitePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leagueId: Id<"leagues">;
}

const initialFormData: InviteFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dupRating: undefined,
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0,3)}-${digits.slice(3)}`;
  return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6,10)}`;
};

const InvitePlayerModal: React.FC<InvitePlayerModalProps> = ({ isOpen, onClose, onSuccess, leagueId }) => {
  const [formData, setFormData] = useState<InviteFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convex hook
  const invitePlayerToLeague = useInvitePlayerToLeague();

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'phone') {
      setFormData({ ...formData, phone: formatPhone(e.target.value) });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log('Starting to add player:', formData);
      
      // Use the combined Convex function that handles both profile creation and league addition
      const result = await invitePlayerToLeague({
        leagueId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        dupRating: formData.dupRating,
      });

      console.log('Successfully added player:', result);
      
      const message = result.isNewPlayer 
        ? 'New player created and added to league successfully!' 
        : 'Existing player added to league successfully!';
      
      toast.success(message);
      onSuccess();
      setFormData(initialFormData);
    } catch (err) {
      console.error('Error adding player:', err);
      setError(`Failed to add player: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add Player</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardBody>
            {error && (
              <div className="mb-4 rounded-md bg-error-50 p-4 text-sm text-error-600 dark:bg-error-900/30 dark:text-error-400">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                leftIcon={<Mail size={16} />}
              />
              <Input
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                leftIcon={<Phone size={16} />}
                helperText="Optional"
              />
              <Input
                label="DUPR Rating"
                name="dupRating"
                type="number"
                min="2.0"
                max="8.0"
                step="0.1"
                value={formData.dupRating?.toString() || ''}
                onChange={handleChange}
                leftIcon={<Star size={16} />}
                helperText="Optional. Must be between 2.0 and 8.0"
              />
            </div>
          </CardBody>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
            >
              Add Player
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default InvitePlayerModal; 