'use client';

import { ButunlesikAnalysis } from '@/lib/types/analyses';
import Card from '@/components/ui/Card';

interface ButunlesikDisplayProps {
  result: ButunlesikAnalysis;
}

export default function ButunlesikDisplay({ result }: ButunlesikDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Yönetici Analizi */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          👔 {result.yonetici_analizi.baslik}
        </h2>

        <div className="space-y-4">
          {/* Yorum */}
          <div>
            <h3 className="text-lg font-semibold text-blue-700 mb-2">
              💬 Değerlendirme
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {result.yonetici_analizi.yorum}
            </p>
          </div>

          {/* Tavsiyeler */}
          <div>
            <h3 className="text-lg font-semibold text-blue-700 mb-2">
              📋 Tavsiyeler
            </h3>
            <ul className="space-y-2">
              {result.yonetici_analizi.tavsiyeler.map((tavsiye, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1 font-bold">
                    {index + 1}.
                  </span>
                  <span className="text-gray-700">{tavsiye}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* İK Analizi */}
      <Card className="border-2 border-green-200 bg-green-50">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          👥 {result.ik_analizi.baslik}
        </h2>

        <div className="space-y-4">
          {/* Yorum */}
          <div>
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              💬 Değerlendirme
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {result.ik_analizi.yorum}
            </p>
          </div>

          {/* Tavsiyeler */}
          <div>
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              📋 Tavsiyeler
            </h3>
            <ul className="space-y-2">
              {result.ik_analizi.tavsiyeler.map((tavsiye, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 font-bold">
                    {index + 1}.
                  </span>
                  <span className="text-gray-700">{tavsiye}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Kritik Olaylar */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          ⭐ {result.kritik_olaylar.baslik}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Başarılar */}
          <div>
            <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
              ✅ Başarılar
            </h3>
            <div className="space-y-3">
              {result.kritik_olaylar.basarilar.map((basari, index) => {
                // Handle both string and object formats
                const text = typeof basari === 'string' 
                  ? basari 
                  : (basari as any).not || JSON.stringify(basari);
                
                return (
                  <div
                    key={index}
                    className="p-3 bg-white rounded-lg border border-green-200"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold flex-shrink-0">
                        {index + 1}.
                      </span>
                      <p className="text-gray-700 text-sm">{text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gelişim Alanları */}
          <div>
            <h3 className="text-lg font-semibold text-orange-700 mb-3 flex items-center gap-2">
              📈 Gelişim Alanları
            </h3>
            <div className="space-y-3">
              {result.kritik_olaylar.gelisim_alanlari.map((alan, index) => {
                // Handle both string and object formats
                const text = typeof alan === 'string' 
                  ? alan 
                  : (alan as any).not || JSON.stringify(alan);
                
                return (
                  <div
                    key={index}
                    className="p-3 bg-white rounded-lg border border-orange-200"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold flex-shrink-0">
                        {index + 1}.
                      </span>
                      <p className="text-gray-700 text-sm">{text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Özet Karşılaştırma */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          🔄 İki Perspektif Karşılaştırması
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-700 mb-2">
              👔 Yönetici Odağı
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Operasyon ve verimlilik</li>
              <li>• Sonuç odaklı</li>
              <li>• Ciro ve performans</li>
              <li>• Net talimatlar</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-700 mb-2">
              👥 İK Odağı
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Gelişim ve potansiyel</li>
              <li>• Risk analizi</li>
              <li>• Şirket kültürü</li>
              <li>• Uzun vadeli planlama</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
