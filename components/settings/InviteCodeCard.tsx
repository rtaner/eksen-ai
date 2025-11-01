'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface InviteCodeCardProps {
  inviteCode: string;
}

export default function InviteCodeCard({ inviteCode }: InviteCodeCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    // Get current domain
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const registerUrl = `${baseUrl}/register?invite=${inviteCode}`;
    const shareText = `Ekibimize katılın!\n\nKayıt olmak için: ${registerUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Davet Kodu',
          text: shareText,
          url: registerUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
        // Fallback to copy URL
        try {
          await navigator.clipboard.writeText(registerUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (copyError) {
          console.error('Copy failed:', copyError);
        }
      }
    } else {
      // Fallback to copy URL
      try {
        await navigator.clipboard.writeText(registerUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Copy failed:', error);
      }
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="text-left w-full min-h-[44px]">
        <Card hover className="h-full">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Davet Kodu
              </h3>
              <p className="text-sm text-gray-600">
                Yeni üyeleri ekibinize davet edin
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </Card>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Davet Kodu"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="text-5xl mb-4">🎫</div>
          <p className="text-sm text-gray-600 mb-6">
            Yeni üyeleri ekibinize davet etmek için bu kodu paylaşın
          </p>
          
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6">
            <code className="text-3xl font-mono font-bold text-blue-600">
              {inviteCode}
            </code>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleCopy}
              variant={copied ? 'secondary' : 'primary'}
            >
              {copied ? '✓ Kopyalandı' : '📋 Kopyala'}
            </Button>
            <Button
              onClick={handleShare}
              variant="secondary"
            >
              📤 Paylaş
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
