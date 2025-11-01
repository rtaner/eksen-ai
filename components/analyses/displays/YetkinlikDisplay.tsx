'use client';

import { YetkinlikAnalysis } from '@/lib/types/analyses';
import Card from '@/components/ui/Card';

interface YetkinlikDisplayProps {
  result: YetkinlikAnalysis;
}

export default function YetkinlikDisplay({ result }: YetkinlikDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Genel Yönetici Özeti */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          📊 Genel Yönetici Özeti
        </h2>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {result.genel_yonetici_ozeti}
        </p>
      </Card>

      {/* Kategori Analizleri */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📈 Kategori Analizleri
        </h2>
        <div className="space-y-4">
          {result.kategori_analizleri.map((kategori, index) => {
            const { olumlu, olumsuz, notr, puan_ortalamasi } =
              kategori.veri_ozeti;
            const total = olumlu + olumsuz + notr;

            // Calculate score for visual representation
            let score = 3.0;
            if (total > 0) {
              const sentimentScore = (olumlu * 5 + notr * 3 + olumsuz * 1) / total;
              if (puan_ortalamasi !== null) {
                score = (sentimentScore + puan_ortalamasi) / 2;
              } else {
                score = sentimentScore;
              }
            } else if (puan_ortalamasi !== null) {
              score = puan_ortalamasi;
            }

            // Color based on score
            const getScoreColor = (s: number) => {
              if (s >= 4) return 'text-green-600';
              if (s >= 3) return 'text-yellow-600';
              return 'text-red-600';
            };

            const getScoreBg = (s: number) => {
              if (s >= 4) return 'bg-green-50 border-green-200';
              if (s >= 3) return 'bg-yellow-50 border-yellow-200';
              return 'bg-red-50 border-red-200';
            };

            return (
              <Card key={index} className={`border-2 ${getScoreBg(score)}`}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Score Badge */}
                  <div className="flex-shrink-0">
                    <div
                      className={`text-4xl font-bold ${getScoreColor(score)}`}
                    >
                      {score.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      / 5.0
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {kategori.kategori_adi}
                    </h3>

                    {/* Veri Özeti */}
                    <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        📊 Veri Özeti:
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-green-600">✅</span>
                          <span className="text-gray-600">
                            Olumlu: {olumlu}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-red-600">⚠️</span>
                          <span className="text-gray-600">
                            Olumsuz: {olumsuz}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">📝</span>
                          <span className="text-gray-600">Nötr: {notr}</span>
                        </div>
                        {puan_ortalamasi !== null && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-600">⭐</span>
                            <span className="text-gray-600">
                              Görev Ort: {puan_ortalamasi.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Değerlendirme Notu */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        💬 Değerlendirme:
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {kategori.degerlendirme_notu}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Aksiyon Planı */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          🎯 Aksiyon Planı
        </h2>

        <div className="space-y-4">
          {/* Takdir Edilecekler */}
          <div>
            <h3 className="text-lg font-semibold text-green-700 mb-2 flex items-center gap-2">
              ✅ Takdir Edilecekler
            </h3>
            <ul className="space-y-2">
              {result.aksiyon_plani.takdir_edilecekler.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Geliştirilmesi Gerekenler */}
          <div>
            <h3 className="text-lg font-semibold text-orange-700 mb-2 flex items-center gap-2">
              📈 Geliştirilmesi Gerekenler
            </h3>
            <ul className="space-y-2">
              {result.aksiyon_plani.gelistirilmesi_gerekenler.map(
                (item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Önerilen Eylemler */}
          <div>
            <h3 className="text-lg font-semibold text-blue-700 mb-2 flex items-center gap-2">
              🔧 Önerilen Eylemler
            </h3>
            <ul className="space-y-2">
              {result.aksiyon_plani.onerilen_eylemler.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
