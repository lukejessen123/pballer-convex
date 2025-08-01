import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../../components/ui/Card';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface ForgotPasswordViewProps {
  onNavigate?: (path: string) => void;
}

const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Convex mutation for password reset
  const resetPassword = useMutation(api.authFunctions.resetPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      await resetPassword({ 
        email,
        redirectUrl: `${window.location.origin}/reset-password`
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Reset Password</CardTitle>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </CardHeader>
          <CardBody>
            {error && (
              <div className="mb-4 rounded-md bg-error-50 p-4 text-sm text-error-600 dark:bg-error-900/30 dark:text-error-400">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-md bg-success-50 p-4 text-sm text-success-600 dark:bg-success-900/30 dark:text-success-400">
                Check your email for a link to reset your password
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  id="email"
                  type="email"
                  label="Email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  leftIcon={<Mail size={16} />}
                />
              </div>
              <Button
                type="submit"
                className="mt-6 w-full"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>
            </form>
          </CardBody>
          <CardFooter className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Remember your password?{' '}
              <button
                onClick={() => onNavigate?.('/signin')}
                className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Sign in
              </button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordView;