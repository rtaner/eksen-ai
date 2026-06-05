import Card from '@/components/ui/Card';

export default function KapsamliDisplay({ result }: { result: any }) {
  if (!result) return null;

  return (
    <div className="space-y-6">
      {/* 1. Veri Güveni ve Yönetici Önyargı Kontrolü */}
      {result.veri_guveni_ve_onyargi && (
        <Card className="border-l-4 border-gray-400">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
            <span>🛡️</span> Veri Güveni ve Önyargı Kontrolü
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-sm text-gray-500 block mb-1">Veri Güveni Skoru</span>
              <span className="font-semibold text-gray-800">
                {result.veri_guveni_ve_onyargi.skor}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-sm text-gray-500 block mb-1">Önyargı Filtresi</span>
              <p className="text-sm text-gray-800">
                {result.veri_guveni_ve_onyargi.onyargi_uyarisi}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 3. Eğilim ve Erken Uyarı Sistemi */}
      {result.zaman_ve_trend && (
        <Card className="border-l-4 border-indigo-400">
          <h3 className="text-lg font-bold text-indigo-800 flex items-center gap-2 mb-3">
            <span>📈</span> Eğilim ve Erken Uyarı Sistemi
          </h3>
          
          <div className="flex flex-col gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg flex items-center gap-4">
              <div className="text-3xl">
                {result.zaman_ve_trend.performans_ivmesi === 'Yükseliş' ? '🚀' :
                 result.zaman_ve_trend.performans_ivmesi === 'Düşüş' ? '📉' :
                 result.zaman_ve_trend.performans_ivmesi === 'İstikrarlı' ? '➡️' : '〰️'}
              </div>
              <div>
                <span className="text-sm font-semibold text-indigo-900 block">Performans İvmesi: {result.zaman_ve_trend.performans_ivmesi}</span>
                <p className="text-sm text-indigo-800 mt-1">{result.zaman_ve_trend.trend_aciklamasi}</p>
              </div>
            </div>

            {result.zaman_ve_trend.erken_uyari_bayraklari && result.zaman_ve_trend.erken_uyari_bayraklari.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <span className="text-sm font-semibold text-red-800 flex items-center gap-2 mb-2">
                  <span>⚠️</span> Erken Uyarı (Risk) Bayrakları
                </span>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {result.zaman_ve_trend.erken_uyari_bayraklari.map((uyari: string, i: number) => (
                    <li key={i}>{uyari}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 2. Şiddet Ağırlıklı Yetkinlik ve Alt Tema Analizi */}
      {result.yetkinlik_karnesi && result.yetkinlik_karnesi.kategoriler && (
        <Card className="border-l-4 border-emerald-400">
          <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2 mb-4">
            <span>📊</span> Şiddet Ağırlıklı Yetkinlik Karnesi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.yetkinlik_karnesi.kategoriler.map((kat: any, idx: number) => {
              if (kat.puan_1_5 === null) return null;
              
              const isHigh = kat.puan_1_5 >= 4;
              const isLow = kat.puan_1_5 < 3;
              const colorClass = isHigh ? 'text-green-600 bg-green-50' : isLow ? 'text-red-600 bg-red-50' : 'text-yellow-600 bg-yellow-50';

              return (
                <div key={idx} className={`p-4 rounded-lg border ${isHigh ? 'border-green-200' : isLow ? 'border-red-200' : 'border-yellow-200'} flex flex-col h-full`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-800 text-sm">{kat.adi}</h4>
                    <span className={`font-bold text-lg px-2 py-1 rounded ${colorClass}`}>
                      {kat.puan_1_5.toFixed(1)}
                    </span>
                  </div>
                  
                  {kat.alt_temalar && kat.alt_temalar.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {kat.alt_temalar.map((tema: string, tIdx: number) => (
                        <span key={tIdx} className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">
                          {tema}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-600 mt-auto leading-relaxed italic">"{kat.kisa_degerlendirme}"</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 4. Davranışsal Desenler ve Kritik Olaylar */}
      {result.davranissal_ve_kritik_analiz && (
        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            🔍 Davranışsal Desenler ve Kritik Olaylar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kritik Olaylar */}
            <div>
              <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                ⭐ Kritik Olaylar
              </h3>
              <div className="space-y-3">
                {result.davranissal_ve_kritik_analiz.kritik_olaylar?.length > 0 ? (
                  result.davranissal_ve_kritik_analiz.kritik_olaylar.map((olay: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                      <p className="font-medium text-gray-900">{olay.olay}</p>
                      <p className="text-sm text-indigo-600 mt-2 font-semibold">Etki: {olay.etki}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">Kayıtlarda belirgin bir kritik kriz veya majör başarı tespit edilmedi.</p>
                )}
              </div>
            </div>

            {/* Tekrarlayan Desenler */}
            <div>
              <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                🔄 Tekrarlama Frekansı (Paternler)
              </h3>
              <div className="space-y-3">
                {result.davranissal_ve_kritik_analiz.tekrarlayan_desenler?.length > 0 ? (
                  result.davranissal_ve_kritik_analiz.tekrarlayan_desenler.map((desen: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                      <div className="mt-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      </div>
                      <p className="text-gray-700 text-sm">{desen}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">Dikkat çeken kronikleşmiş bir hata veya alışkanlık tespit edilmedi.</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 5. Çift Şapkalı Sentez */}
      {result.cift_sapka_degerlendirmesi && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-l-4 border-blue-400 bg-blue-50/30">
            <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2 mb-3">
              <span>👔</span> Yönetici Gözünden (Saha Gerçekleri)
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {result.cift_sapka_degerlendirmesi.yonetici_gozu}
            </p>
          </Card>
          
          <Card className="border-l-4 border-teal-400 bg-teal-50/30">
            <h3 className="text-lg font-bold text-teal-800 flex items-center gap-2 mb-3">
              <span>🌱</span> İK Gözünden (Gelişim ve Potansiyel)
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {result.cift_sapka_degerlendirmesi.ik_gozu}
            </p>
          </Card>
        </div>
      )}

      {result.cift_sapka_degerlendirmesi?.ortak_karar_ozeti && (
        <Card className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100">
          <h3 className="text-md font-bold text-gray-800 mb-2">Ortak Sentez Kararı</h3>
          <p className="text-sm text-gray-700 font-medium">
            {result.cift_sapka_degerlendirmesi.ortak_karar_ozeti}
          </p>
        </Card>
      )}

      {/* 6. Koçluk Rehberi ve SMART Aksiyon Planı */}
      {result.kocluk_rehberi && (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          🎯 1-1 Görüşme Koçluk Rehberi ve Eylem Planı
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gündem ve Sorular */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                📋 Kritik Gündem Maddeleri
              </h3>
              <ul className="space-y-2">
                {result.kocluk_rehberi.gundem_maddeleri.map((madde: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span className="text-gray-700">{madde}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                💬 Açık Uçlu Koçluk Soruları
              </h3>
              <div className="space-y-3">
                {result.kocluk_rehberi.kocluk_sorulari.map((soru: string, idx: number) => (
                  <div key={idx} className="bg-purple-100/50 p-3 rounded-lg border border-purple-200 text-purple-900 font-medium italic">
                    "{soru}"
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SMART Aksiyon Planı */}
          {result.kocluk_rehberi.smart_aksiyon_plani && (
            <div className="bg-white rounded-xl border-2 border-purple-300 shadow-sm overflow-hidden">
              <div className="bg-purple-600 px-4 py-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  🚀 SMART Aksiyon Planı
                </h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-500 mb-4">
                  Görüşme sonunda personelin üstlenmesi gereken somut ve zaman kısıtlı eylem adımları:
                </p>
                <div className="space-y-3">
                  {result.kocluk_rehberi.smart_aksiyon_plani.map((aksiyon: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                          {idx + 1}
                        </div>
                      </div>
                      <p className="text-gray-800 font-medium text-sm pt-0.5 leading-relaxed">
                        {aksiyon}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
      )}
    </div>
  );
}
