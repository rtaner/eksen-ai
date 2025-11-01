'use client';

import { useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Settings page error:', error);
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bir Hata Oluştu
          </h2>
          <p className="text-gray-600 mb-6">
            Ayarlar sayfası yüklenirken bir sorun oluştu.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => reset()}>
              Tekrar Dene
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.href = '/personnel'}
            >
              Ana Sayfaya Dön
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
