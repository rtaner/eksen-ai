'use client';

import { EgilimAnalysis } from '@/lib/types/analyses';
import Card from '@/components/ui/Card';

interface EgilimDisplayProps {
  result: EgilimAnalysis;
}

export default function EgilimDisplay({ result }: EgilimDisplayProps) {
  const getTrendIcon = (trend: string) => {
    if (trend === 'artan') return '📈';
    if (trend === 'azalan') return '📉';
    return '➡️';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'artan') return 'text-green-600';
    if (trend === 'azalan') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Özet İçgörü */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          💡 Özet İçgörü
        </h2>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {result.ozet_icgoru}
        </p>
      </Card>

      {/* Performans Eğilimi */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          {getTrendIcon(result.performans_egilimi.genel_trend)} Performans
          Eğilimi
        </h2>

        <div className="mb-4">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
              result.performans_egilimi.genel_trend === 'artan'
                ? 'bg-green-100 text-green-700'
                : result.performans_egilimi.genel_trend === 'azalan'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Genel Trend:{' '}
            {result.performans_egilimi.genel_trend === 'artan'
              ? 'Artan'
              : result.performans_egilimi.genel_trend === 'azalan'
              ? 'Azalan'
              : 'İstikrarlı'}
          </div>
        </div>

        <p className="text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed">
          {result.performans_egilimi.aciklama}
        </p>

        {/* Simple data visualization */}
        {result.performans_egilimi.grafik_verisi.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Tarih
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Puan
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Görsel
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.performans_egilimi.grafik_verisi.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-600">{item.tarih}</td>
                    <td className="py-2 px-3 font-semibold text-gray-900">
                      {item.puan.toFixed(1)}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <div
                          className="h-2 bg-blue-500 rounded"
                          style={{ width: `${(item.puan / 5) * 100}%` }}
                        />
                        <span className="text-xs text-gray-500">
                          {((item.puan / 5) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Duygu Eğilimi */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          😊 Duygu Eğilimi
        </h2>

        <p className="text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed">
          {result.duygu_egilimi.aciklama}
        </p>

        {/* Simple data visualization */}
        {result.duygu_egilimi.grafik_verisi.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Tarih
                  </th>
                  <th className="text-center py-2 px-3 font-semibold text-green-700">
                    ✅ Olumlu
                  </th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">
                    📝 Nötr
                  </th>
                  <th className="text-center py-2 px-3 font-semibold text-red-700">
                    ⚠️ Olumsuz
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.duygu_egilimi.grafik_verisi.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-600">{item.tarih}</td>
                    <td className="py-2 px-3 text-center font-semibold text-green-600">
                      {item.olumlu}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold text-gray-600">
                      {item.notr}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold text-red-600">
                      {item.olumsuz}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Tekrarlayan Desenler */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          🔍 Tekrarlayan Desenler
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Olumsuz Temalar */}
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h3 className="text-lg font-semibold text-red-700 mb-3">
              ⚠️ Olumsuz Temalar
            </h3>
            {result.tekrarlayan_desenler.olumsuz_temalar.length > 0 ? (
              <ul className="space-y-2">
                {result.tekrarlayan_desenler.olumsuz_temalar.map(
                  (tema, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-gray-700">{tema.tema}</span>
                      <span className="px-2 py-1 bg-red-200 text-red-800 rounded-full text-xs font-semibold">
                        {tema.siklik}x
                      </span>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">Tekrarlayan tema yok</p>
            )}
          </div>

          {/* Düşük Puan Temalar */}
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-700 mb-3">
              📉 Düşük Puan Temalar
            </h3>
            {result.tekrarlayan_desenler.dusuk_puan_temalar.length > 0 ? (
              <ul className="space-y-2">
                {result.tekrarlayan_desenler.dusuk_puan_temalar.map(
                  (tema, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-gray-700">{tema.tema}</span>
                      <span className="px-2 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-semibold">
                        {tema.siklik}x
                      </span>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">Tekrarlayan tema yok</p>
            )}
          </div>
        </div>
      </Card>

      {/* Korelasyon Analizi */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          🔗 Korelasyon Analizi
        </h2>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {result.korelasyon_analizi}
        </p>
      </Card>
    </div>
  );
}
