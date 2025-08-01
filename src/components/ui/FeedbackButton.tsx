import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface FeedbackButtonProps {
  openFromHome?: boolean;
  setOpenFromHome?: (open: boolean) => void;
  subject?: string;
  showDuprField?: boolean;
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({
  openFromHome,
  setOpenFromHome,
  subject,
  showDuprField,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [dupr, setDupr] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Open modal from HomeView
  useEffect(() => {
    if (openFromHome) {
      setShowModal(true);
      setShowTooltip(false);
    }
  }, [openFromHome]);

  // Close modal and notify parent
  const handleCloseModal = () => {
    setShowModal(false);
    setSuccess(false);
    setError(null);
    setName('');
    setEmail('');
    setMessage('');
    setDupr('');
    if (setOpenFromHome) setOpenFromHome(false);
  };

  const handleButtonClick = () => {
    setShowTooltip((prev) => !prev);
  };

  const handleContactUs = () => {
    setShowTooltip(false);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!name || !email || !message) {
      setError('All fields are required.');
      return;
    }
    // Compose mailto link
    const mailSubject = encodeURIComponent(subject || 'Pickleballers Feedback');
    let body = `Name: ${name}\nEmail: ${email}`;
    if (showDuprField && dupr) {
      body += `\nDUPR: ${dupr}`;
    }
    body += `\n\n${message}`;
    const mailBody = encodeURIComponent(body);
    window.location.href = `mailto:pballers303@gmail.com?subject=${mailSubject}&body=${mailBody}`;
    setSuccess(true);
    handleCloseModal();
  };

  // Hide tooltip when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      setShowTooltip(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close tooltip when clicking outside or pressing Escape
  useEffect(() => {
    if (!showTooltip) return;
    function handleClick(e: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('[aria-label="Give Feedback"]')
      ) {
        setShowTooltip(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowTooltip(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showTooltip]);

  return (
    <div
      className="z-50 fixed top-4 left-4 md:top-auto md:left-auto md:bottom-6 md:right-6 transition-all duration-300"
    >
      <div
        tabIndex={0}
        className="relative flex flex-row items-center"
      >
        <button
          className="flex items-center justify-center rounded-full bg-primary-600 text-white shadow-lg w-14 h-14 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
          aria-label="Give Feedback"
          onClick={handleButtonClick}
        >
          <MessageCircle size={28} />
        </button>
        {/* Mobile only: Feedback? text */}
        <span className="ml-2 text-xs text-white font-medium md:hidden select-none">Feedback?</span>
        {/* Tooltip for all devices, shown only on click */}
        {showTooltip && (
          <div
            ref={tooltipRef}
            className="absolute left-0 top-16 md:right-16 md:top-auto md:left-auto md:bottom-0 w-72 p-4 bg-gray-900 text-white rounded-lg shadow-lg border border-gray-700 text-sm z-50"
            tabIndex={-1}
          >
            <div className="mb-2 text-lg">💬 Let’s Chat!</div>
            <ul className="mb-2 list-disc list-inside text-gray-300">
              <li>Want to start your own league?</li>
              <li>Found a bug?</li>
              <li>Have a brilliant feature idea?</li>
            </ul>
            <button
              className="inline-block mt-2 px-4 py-2 bg-primary-600 rounded text-white font-semibold hover:bg-primary-700 transition"
              onClick={handleContactUs}
            >
              📩 Contact Us
            </button>
          </div>
        )}
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white"
              onClick={handleCloseModal}
              aria-label="Close"
            >
              <X size={22} />
            </button>
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              {subject === 'Start My Own League'
                ? 'Start My Own Ladder League'
                : subject === 'Join a League'
                ? 'What League Do You Want To Join?'
                : 'Send Feedback'}
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300 text-sm">
              We'd love to hear from you! Fill out the form below and we'll get back to you soon.
            </p>
            {error && <div className="mb-2 text-red-600 dark:text-red-400 text-sm">{error}</div>}
            {success && <div className="mb-2 text-green-600 dark:text-green-400 text-sm">Thank you for your feedback!</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fb-name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
                <input
                  id="fb-name"
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="fb-email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
                <input
                  id="fb-email"
                  type="email"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              {showDuprField && (
                <div>
                  <label htmlFor="fb-dupr" className="block text-sm font-medium text-gray-700 dark:text-gray-200">DUPR Rating (optional)</label>
                  <input
                    id="fb-dupr"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={dupr}
                    onChange={e => setDupr(e.target.value)}
                    placeholder="e.g. 4.25"
                  />
                </div>
              )}
              <div>
                <label htmlFor="fb-message" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Message</label>
                <textarea
                  id="fb-message"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-md shadow focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                Send Feedback
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackButton; 