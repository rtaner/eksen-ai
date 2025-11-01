'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { createNotification } from '@/lib/notifications/createNotification';

interface TestNotificationsClientProps {
  userId: string;
  organizationId: string;
}

export default function TestNotificationsClient({ 
  userId, 
  organizationId 
}: TestNotificationsClientProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sendTestNotification = async (type: string) => {
    setLoading(true);
    setMessage('');

    try {
      await createNotification({
        userId,
        organizationId,
        type: type as any,
        title: `Test: ${type}`,
        message: `Bu bir ${type} test bildirimidir`,
        link: '/personnel',
      });

      setMessage('✅ Bildirim gönderildi! Header\'daki zil ikonunu kontrol edin.');
    } catch (error) {
      console.error('Error:', error);
      setMessage('❌ Hata oluştu: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bildirim Sistemi Test
        </h1>
        <p className="text-gray-600">
          Farklı bildirim türlerini test edin
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Test Bildirimleri Gönder
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => sendTestNotification('task_assigned')}
                disabled={loading}
                variant="primary"
              >
                📋 Görev Atandı
              </Button>
              <Button
                onClick={() => sendTestNotification('task_due')}
                disabled={loading}
                variant="primary"
              >
                ⏰ Görev Bugün Bitiyor
              </Button>
              <Button
                onClick={() => sendTestNotification('task_overdue')}
                disabled={loading}
                variant="primary"
              >
                🔴 Görev Gecikti
              </Button>
              <Button
                onClick={() => sendTestNotification('note_added')}
                disabled={loading}
                variant="primary"
              >
                📝 Not Eklendi
              </Button>
              <Button
                onClick={() => sendTestNotification('analysis_completed')}
                disabled={loading}
                variant="primary"
              >
                🤖 Analiz Tamamlandı
              </Button>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${
              message.startsWith('✅') 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Nasıl Test Edilir?</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Yukarıdaki butonlardan birini tıklayın</li>
              <li>Header'daki 🔔 zil ikonuna bakın</li>
              <li>Kırmızı badge ile okunmamış sayısını görün</li>
              <li>Zil ikonuna tıklayarak bildirimleri açın</li>
              <li>Bildirime tıklayarak okundu işaretleyin</li>
            </ol>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Real-time Test</h4>
            <p className="text-sm text-gray-600 mb-2">
              Başka bir tarayıcı sekmesinde bu sayfayı açın ve bildirim gönderin. 
              Diğer sekmede anında görünecektir!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
