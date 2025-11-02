'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import OneSignal from 'react-onesignal';

export default function NotificationPermissionCard() {
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission as 'default' | 'granted' | 'denied');
    }
  };

  const requestNotificationPermission = async () => {
    setIsLoading(true);
    try {
      // OneSignal üzerinden izin iste
      await OneSignal.Notifications.requestPermission();
      
      // Durumu güncelle
      await checkPermissionStatus();
      
      alert('Bildirim izni verildi! Artık bildirim alabilirsiniz.');
    } catch (error) {
      console.error('Bildirim izni hatası:', error);
      alert('Bildirim izni alınamadı. Lütfen tarayıcı ayarlarınızı kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = () => {
    switch (permissionStatus) {
      case 'granted':
        return {
          icon: '✅',
          title: 'Bildirimler Aktif',
          description: 'Bildirim almaya devam edeceksiniz',
          color: 'bg-green-50 hover:bg-green-100',
          textColor: 'text-green-900',
          buttonText: 'İzin Verildi',
          buttonDisabled: true,
        };
      case 'denied':
        return {
          icon: '🔕',
          title: 'Bildirimler Engellenmiş',
          description: 'Tarayıcı ayarlarından izin vermeniz gerekiyor',
          color: 'bg-red-50 hover:bg-red-100',
          textColor: 'text-red-900',
          buttonText: 'Tarayıcı Ayarlarını Aç',
          buttonDisabled: false,
        };
      default:
        return {
          icon: '🔔',
          title: 'Bildirim İzni',
          description: 'Görev ve not bildirimleri almak için izin verin',
          color: 'bg-yellow-50 hover:bg-yellow-100',
          textColor: 'text-yellow-900',
          buttonText: 'İzin Ver',
          buttonDisabled: false,
        };
    }
  };

  const handleButtonClick = () => {
    if (permissionStatus === 'denied') {
      // Tarayıcı ayarlarına yönlendir
      alert(
        'Bildirim izni engellenmiş. Lütfen tarayıcı ayarlarından bu siteye bildirim izni verin:\n\n' +
        '1. Tarayıcı adres çubuğundaki kilit ikonuna tıklayın\n' +
        '2. "Site ayarları" veya "İzinler"e gidin\n' +
        '3. Bildirimleri "İzin ver" olarak değiştirin'
      );
    } else {
      requestNotificationPermission();
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`${statusInfo.color} rounded-lg shadow-md p-4 transition-all h-full`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-3xl">
          {statusInfo.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-semibold ${statusInfo.textColor} mb-1`}>
            {statusInfo.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {statusInfo.description}
          </p>
          <button
            onClick={handleButtonClick}
            disabled={statusInfo.buttonDisabled || isLoading}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium
              ${statusInfo.buttonDisabled 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              }
              transition-colors min-h-[44px]
              ${isLoading ? 'opacity-50 cursor-wait' : ''}
            `}
          >
            {isLoading ? 'İşleniyor...' : statusInfo.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
