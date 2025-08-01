import React, { useRef, useEffect } from 'react';
import QRCode from 'react-qr-code';

interface EventQRCodeProps {
  eventId: string;
  accessMode: 'public' | 'private';
  ownerId: string;
  userId: string | null;
  invitedPlayerIds?: string[];
  joinUrl?: string;
}

const EventQRCode: React.FC<EventQRCodeProps> = ({ eventId, accessMode, ownerId, userId, invitedPlayerIds = [], joinUrl }) => {
  const url = joinUrl || `${window.location.origin}/play/event/${eventId}`;
  const qrRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (wrapperRef.current) {
      const svg = wrapperRef.current.querySelector('svg');
      qrRef.current = svg as SVGSVGElement | null;
    }
  });

  // Determine if the user can share the link
  const canShare =
    accessMode === 'public' ||
    (accessMode === 'private' && (userId === ownerId || invitedPlayerIds.includes(userId || '')));

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Pickleball Event',
          text: `Join my event: ${url}`,
          url: url,
        });
      } catch (e) {
        // User cancelled or error
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch (e) {
        alert('Could not copy link.');
      }
    } else {
      // Fallback: prompt
      window.prompt('Copy this link:', url);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={wrapperRef}>
        <QRCode value={url} size={128} />
      </div>
      {canShare && (
        <button
          className="mt-2 px-3 py-1 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-700"
          onClick={handleShareLink}
        >
          Share Link
        </button>
      )}
    </div>
  );
};

export default EventQRCode; 