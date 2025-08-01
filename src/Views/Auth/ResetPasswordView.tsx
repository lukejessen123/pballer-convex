import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface ResetPasswordViewProps {
  onNavigate?: (path: string, state?: any) => void;
}

const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ onNavigate }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Convex mutation for password update
  const updatePassword = useMutation(api.authFunctions.updatePassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      await updatePassword({ password });
      
      // Success! Redirect to sign in
      if (onNavigate) {
        onNavigate('/signin', { 
          message: 'Password updated successfully. Please sign in with your new password.' 
        });
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error('Password update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Set New Password</CardTitle>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your new password below
            </p>
          </CardHeader>
          <CardBody>
            {error && (
              <div className="mb-4 rounded-md bg-error-50 p-4 text-sm text-error-600 dark:bg-error-900/30 dark:text-error-400">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  id="password"
                  type="password"
                  label="New Password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  leftIcon={<Lock size={16} />}
                  helperText="Must be at least 8 characters long"
                />
                <Input
                  id="confirmPassword"
                  type="password"
                  label="Confirm New Password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  leftIcon={<Lock size={16} />}
                />
              </div>
              <Button
                type="submit"
                className="mt-6 w-full"
                isLoading={isLoading}
              >
                Update Password
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordView;