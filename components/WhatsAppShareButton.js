import React from 'react';

export default function WhatsAppShareButton({ url, message }) {
  const shareLink = `https://wa.me/?text=${encodeURIComponent(message + '\n' + url)}`;

  return (
    <a
      href={shareLink}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-600"
    >
      Share via WhatsApp
    </a>
  );
}
