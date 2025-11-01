'use client';

import { usePushNotifications } from '@/lib/hooks/usePushNotifications';

export default function PushNotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    loading,
    permission,
    subscribe,
    unsubscribe,
    testNotification,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Push Bildirimleri</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Tarayıcınız push bildirimleri desteklemiyor.
          </p>
          <p className="text-xs text-yellow-600 mt-2">
            Chrome, Firefox, Edge veya Safari kullanmanız önerilir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">Push Bildirimleri</h3>
      <p className="text-sm text-gray-600 mb-4">
        Tarayıcı kapalıyken bile bildirim alın
      </p>

      {/* Status */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">Durum:</span>
          {loading ? (
            <span className="text-sm text-gray-500">Kontrol ediliyor...</span>
          ) : isSubscribed ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Aktif
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Pasif
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">İzin:</span>
          {permission === 'granted' ? (
            <span className="text-sm text-green-600">✓ Verildi</span>
          ) : permission === 'denied' ? (
            <span className="text-sm text-red-600">✗ Reddedildi</span>
          ) : (
            <span className="text-sm text-gray-600">? Sorulmadı</span>
          )}
        </div>
      </div>

      {/* Permission denied warning */}
      {permission === 'denied' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800 font-medium mb-1">
            Bildirim izni reddedildi
          </p>
          <p className="text-xs text-red-600">
            Tarayıcı ayarlarından bildirimlere izin vermeniz gerekiyor.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {!isSubscribed ? (
          <button
            onClick={subscribe}
            disabled={loading || permission === 'denied'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {loading ? 'İşleniyor...' : 'Bildirimleri Aç'}
          </button>
        ) : (
          <>
            <button
              onClick={unsubscribe}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {loading ? 'İşleniyor...' : 'Bildirimleri Kapat'}
            </button>
            <button
              onClick={testNotification}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Test Et
            </button>
          </>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 Push bildirimleri sayesinde uygulama kapalıyken bile önemli güncellemelerden haberdar olursunuz.
        </p>
      </div>
    </div>
  );
}
