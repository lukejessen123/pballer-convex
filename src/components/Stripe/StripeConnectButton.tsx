import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import Button from '../ui/Button';

interface StripeConnectButtonProps {
  stripeAccountId?: string | null;
  onConnect?: () => Promise<void>;
  onOpenDashboard?: () => void;
  disabled?: boolean;
}

const StripeConnectButton: React.FC<StripeConnectButtonProps> = ({
  stripeAccountId,
  onConnect,
  onOpenDashboard,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    if (disabled || !onConnect) return;
    
    setIsLoading(true);
    try {
      await onConnect();
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDashboard = () => {
    if (onOpenDashboard) {
      onOpenDashboard();
    } else {
      window.open('https://dashboard.stripe.com', '_blank');
    }
  };

  if (stripeAccountId) {
    return (
      <div className="rounded-lg border border-success-200 bg-success-50 p-4 dark:border-success-900 dark:bg-success-900/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-success-900 dark:text-success-200">
              Stripe Account Connected
            </h3>
            <p className="mt-1 text-sm text-success-700 dark:text-success-300">
              Your Stripe account is ready to accept payments
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenDashboard}
            leftIcon={<ExternalLink size={16} />}
          >
            Stripe Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Connect Stripe Account
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Connect your Stripe account to receive payments for your clubs and leagues
          </p>
        </div>
        <Button
          onClick={handleConnect}
          isLoading={isLoading}
          disabled={disabled}
          leftIcon={<ExternalLink size={16} />}
        >
          Connect Stripe
        </Button>
      </div>
    </div>
  );
};

export default StripeConnectButton;