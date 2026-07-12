'use client';

import { useState, useEffect } from 'react';
import { useChecklists } from '@/lib/hooks/useChecklists';
import { useAuth } from '@/lib/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ChecklistTemplateCard from './ChecklistTemplateCard';
import ChecklistExecutionModal from './ChecklistExecutionModal';
import type { Checklist } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export default function ChecklistsClient() {
  const { checklists, isLoading } = useChecklists();
  const { user, profile } = useAuth();
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'execute' | 'analysis'>('execute');

  // Analysis Form State
  const [selectedAnalysisChecklistId, setSelectedAnalysisChecklistId] = useState('');
  const [dateRangeStart, setDateRangeStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateRangeEnd, setDateRangeEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // include today
    return d.toISOString().split('T')[0];
  });

  // Analysis Result State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const [pastAnalyses, setPastAnalyses] = useState<any[]>([]);
  const [isLoadingPast, setIsLoadingPast] = useState(false);

  useEffect(() => {
    if (selectedAnalysisChecklistId) {
      fetchPastAnalyses(selectedAnalysisChecklistId);
    } else {
      setPastAnalyses([]);
    }
  }, [selectedAnalysisChecklistId]);

  const fetchPastAnalyses = async (checklistId: string) => {
    setIsLoadingPast(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('checklist_analyses')
        .select(`
          id,
          checklist_id,
          date_range_start,
          date_range_end,
          stats,
          analysis,
          created_at,
          created_by,
          profiles:created_by (
            name,
            surname
          )
        `)
        .eq('checklist_id', checklistId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPastAnalyses(data || []);
    } catch (err) {
      console.error('Error fetching past analyses:', err);
    } finally {
      setIsLoadingPast(false);
    }
  };

  const handleStart = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setIsExecutionModalOpen(true);
  };

  const handleExecutionComplete = () => {
    setIsExecutionModalOpen(false);
    setSelectedChecklist(null);
  };

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnalysisChecklistId) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke('analyze-reyon', {
        body: {
          checklistId: selectedAnalysisChecklistId,
          dateRangeStart,
          dateRangeEnd,
        },
      });

      if (error) {
        throw error;
      }

      if (data && data.success === false) {
        throw new Error(data.error || 'Analiz oluşturulamadı');
      }

      setAnalysisResult(data);

      // Save analysis to history database table
      if (data && data.success && profile?.organization_id && user?.id) {
        const { error: saveError } = await supabase
          .from('checklist_analyses')
          .insert({
            checklist_id: selectedAnalysisChecklistId,
            organization_id: profile.organization_id,
            created_by: user.id,
            date_range_start: dateRangeStart,
            date_range_end: dateRangeEnd,
            stats: data.stats,
            analysis: data.analysis,
          });

        if (saveError) {
          console.error('Error saving checklist analysis to history:', saveError);
        } else {
          fetchPastAnalyses(selectedAnalysisChecklistId);
        }
      }
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || 'Analiz sırasında beklenmeyen bir hata oluştu');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper to format bold text in custom markdown renderer
  function formatBoldText(text: string) {
    const parts = text.split('**');
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-gray-900">{part}</strong>;
      }
      return part;
    });
  }

  // Custom markdown renderer to display Gemini's text nicely
  function renderMarkdown(text: string) {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const cleanLine = line.trim();
      if (cleanLine.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-base font-semibold text-gray-800 mt-4 mb-2 flex items-center gap-1">
            <span>🔹</span> {cleanLine.substring(4)}
          </h4>
        );
      }
      if (cleanLine.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-lg font-bold text-blue-900 mt-6 mb-3 border-b pb-1.5 flex items-center gap-2">
            <span>⚙️</span> {cleanLine.substring(3)}
          </h3>
        );
      }
      if (cleanLine.startsWith('# ')) {
        return (
          <h2 key={idx} className="text-xl font-extrabold text-blue-950 mt-8 mb-4 border-b-2 pb-2 flex items-center gap-2">
            <span>📊</span> {cleanLine.substring(2)}
          </h2>
        );
      }
      if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
        return (
          <li key={idx} className="ml-5 list-disc text-sm text-gray-700 my-1.5 leading-relaxed">
            {formatBoldText(cleanLine.substring(2))}
          </li>
        );
      }
      if (/^\d+\.\s/.test(cleanLine)) {
        const match = cleanLine.match(/^(\d+)\.\s(.*)/);
        if (match) {
          return (
            <li key={idx} className="ml-5 list-decimal text-sm text-gray-700 my-1.5 leading-relaxed">
              {formatBoldText(match[2])}
            </li>
          );
        }
      }
      if (cleanLine === '') {
        return <div key={idx} className="h-3" />;
      }
      return (
        <p key={idx} className="text-sm text-gray-700 my-2 leading-relaxed">
          {formatBoldText(line)}
        </p>
      );
    });
  }

  const handlePrint = () => {
    window.print();
  };

  const selectedChecklistTitle = checklists.find(c => c.id === selectedAnalysisChecklistId)?.title || 'Reyon';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="print:hidden">
        <h1 className="text-3xl font-bold text-gray-900">Checklistler</h1>
        <p className="text-gray-600 mt-2">
          Reyon değerlendirmelerini yapın veya AI destekli reyon analiz raporları oluşturun
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 print:hidden">
        <button
          onClick={() => setActiveTab('execute')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'execute'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Değerlendirme Yap
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'analysis'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📊 Yapay Zeka Reyon Analizi
        </button>
      </div>

      {/* Tab 1: Execute Checklists */}
      {activeTab === 'execute' && (
        <div className="print:hidden">
          {isLoading ? (
            <Card>
              <div className="p-6 text-center">
                <p className="text-gray-500">Yükleniyor...</p>
              </div>
            </Card>
          ) : checklists.length === 0 ? (
            <Card>
              <div className="p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz checklist yok</h3>
                <p className="mt-1 text-sm text-gray-500">Yöneticiniz henüz checklist oluşturmamış</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {checklists.map((checklist) => (
                <ChecklistTemplateCard
                  key={checklist.id}
                  checklist={checklist}
                  onStart={handleStart}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: AI Checklist/Reyon Analysis */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Form Card */}
          {!analysisResult && !isAnalyzing && (
            <Card className="print:hidden">
              <form onSubmit={handleRunAnalysis} className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-2">📊 Reyon Analiz Parametreleri</h2>
                
                {analysisError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                    {analysisError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Checklist selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reyon (Checklist Şablonu) *</label>
                    <select
                      value={selectedAnalysisChecklistId}
                      onChange={(e) => setSelectedAnalysisChecklistId(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seçiniz...</option>
                      {checklists.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Tarihi *</label>
                    <input
                      type="date"
                      value={dateRangeStart}
                      onChange={(e) => setDateRangeStart(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi *</label>
                    <input
                      type="date"
                      value={dateRangeEnd}
                      onChange={(e) => setDateRangeEnd(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={!selectedAnalysisChecklistId}
                    className="px-6 py-2.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md"
                  >
                    🚀 Analizi Başlat
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Past Analyses List */}
          {!analysisResult && !isAnalyzing && selectedAnalysisChecklistId && (
            <Card className="print:hidden">
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">
                  📜 Geçmiş Analiz Raporları
                </h3>
                
                {isLoadingPast ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">Yükleniyor...</p>
                  </div>
                ) : pastAnalyses.length === 0 ? (
                  <p className="text-gray-500 text-sm py-2">
                    Bu reyon için henüz geçmiş analiz kaydı bulunmuyor. Yukarıdaki formu doldurarak ilk analizi başlatabilirsiniz.
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    {pastAnalyses.map((item) => {
                      const creator = item.profiles ? `${item.profiles.name} ${item.profiles.surname}` : 'Bilinmeyen';
                      return (
                        <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">
                              Dönem: {new Date(item.date_range_start).toLocaleDateString('tr-TR')} - {new Date(item.date_range_end).toLocaleDateString('tr-TR')}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Oluşturan: {creator} | Oluşturulma: {new Date(item.created_at).toLocaleString('tr-TR')}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Puan: {item.stats?.averageScore?.toFixed(2) || '0.00'}
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setAnalysisResult({
                                stats: item.stats,
                                analysis: item.analysis,
                                dateRangeStart: item.date_range_start,
                                dateRangeEnd: item.date_range_end,
                              })}
                            >
                              Raporu Oku
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <Card className="print:hidden">
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <h3 className="text-xl font-bold text-gray-800">Yapay Zeka Analizi Hazırlanıyor...</h3>
                <p className="text-gray-500 max-w-md">
                  Reyon performans verileri, kronikleşen arıza noktaları ve personel verimlilik skorları Gemini 3.5 AI tarafından derleniyor. Lütfen bekleyin (15-30 saniye sürebilir).
                </p>
              </div>
            </Card>
          )}

          {/* Analysis Result Dashboard */}
          {analysisResult && (
            <div className="space-y-6">
              {/* Controls bar */}
              <div className="flex justify-between items-center gap-3 print:hidden">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAnalysisResult(null);
                    setAnalysisError(null);
                  }}
                >
                  ← Yeni Analiz Yap
                </Button>
                <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                  📄 Raporu Yazdır / PDF İndir
                </Button>
              </div>

              {/* Rapor Konteyneri */}
              <div id="print-area" className="space-y-6">
                {/* Rapor Başlığı */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                  <div className="p-6">
                    <h2 className="text-2xl font-extrabold text-blue-950 mb-2">
                      📊 {selectedChecklistTitle} Performans & AI Analiz Raporu
                    </h2>
                    <p className="text-sm text-blue-800 font-medium">
                      📅 Dönem: {new Date(analysisResult?.dateRangeStart || dateRangeStart).toLocaleDateString('tr-TR')} - {new Date(analysisResult?.dateRangeEnd || dateRangeEnd).toLocaleDateString('tr-TR')} &nbsp;|&nbsp; 📝 Toplam Denetim: {analysisResult.stats?.totalCount}
                    </p>
                  </div>
                </Card>

                {/* Özet Metrik Kartları */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ortalama Puan Kartı */}
                  <Card className="border-l-4 border-blue-500 shadow-sm">
                    <div className="p-6 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Reyon Başarı Ortalaması</p>
                        <h3 className="text-3xl font-extrabold text-gray-900">
                          {analysisResult.stats?.averageScore?.toFixed(2)} <span className="text-lg font-medium text-gray-500">/ 5.00</span>
                        </h3>
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-2xl font-black ${
                        analysisResult.stats?.averageScore >= 4
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : analysisResult.stats?.averageScore >= 3
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {analysisResult.stats?.averageScore >= 4 ? 'İYİ ✅' : analysisResult.stats?.averageScore >= 3 ? 'ORTA ⚠️' : 'RİSKLİ 🚨'}
                      </div>
                    </div>
                  </Card>

                  {/* Toplam Kontrol Kartı */}
                  <Card className="border-l-4 border-indigo-500 shadow-sm">
                    <div className="p-6">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Doldurulan Toplam Checklist</p>
                      <h3 className="text-3xl font-extrabold text-gray-900">
                        {analysisResult.stats?.totalCount} <span className="text-lg font-medium text-gray-500">Kez Denetlendi</span>
                      </h3>
                    </div>
                  </Card>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Sol Kolon (Listeler & Karşılaştırmalar) */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Kronikleşen Sorunlar Listesi */}
                    <Card className="shadow-sm">
                      <div className="p-5 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                          <span>🚨</span> Kronik Hatalar (% Hata Oranı)
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">En çok yapılmayan maddelerin oranları</p>
                      </div>
                      <div className="p-5 space-y-4">
                        {(analysisResult.stats?.itemStats || []).slice(0, 5).map((item: any, i: number) => (
                          <div key={item.id || i} className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-gray-700 truncate max-w-[70%]">
                                {item.order}. {item.text}
                              </span>
                              <span className={`font-bold ${item.failRate > 40 ? 'text-red-600' : 'text-yellow-600'}`}>
                                %{item.failRate} Hata
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${item.failRate > 40 ? 'bg-red-500' : 'bg-yellow-500'}`}
                                style={{ width: `${item.failRate}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                        {(analysisResult.stats?.itemStats || []).length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">Madde istatistiği bulunamadı.</p>
                        )}
                      </div>
                    </Card>

                    {/* Personel Performans Listesi */}
                    <Card className="shadow-sm">
                      <div className="p-5 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                          <span>👥</span> Personel Verimlilik Tablosu
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Reyonda görev alan personellerin skorları</p>
                      </div>
                      <div className="p-5 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="text-xs uppercase font-bold text-gray-500 border-b pb-2">
                              <th className="pb-2">Sorumlu</th>
                              <th className="pb-2 text-center">Denetim</th>
                              <th className="pb-2 text-right">Ort. Skor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {(analysisResult.stats?.personnelStats || []).map((p: any, i: number) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="py-2.5 font-medium text-gray-800">{p.name}</td>
                                <td className="py-2.5 text-center text-gray-600">{p.runsCount}</td>
                                <td className="py-2.5 text-right font-bold text-blue-600">{p.averageScore.toFixed(2)}</td>
                              </tr>
                            ))}
                            {(analysisResult.stats?.personnelStats || []).length === 0 && (
                              <tr>
                                <td colSpan={3} className="text-center py-4 text-gray-500">Personel verisi bulunamadı.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>

                  {/* Sağ Kolon (AI Raporu) */}
                  <div className="lg:col-span-2">
                    <Card className="shadow-md bg-white border border-blue-50 relative overflow-hidden">
                      {/* Sub-header background indicator */}
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                      <div className="p-6">
                        <h3 className="font-extrabold text-blue-950 text-xl border-b pb-3 mb-4 flex items-center gap-2">
                          <span>🧠</span> Yapay Zeka Detaylı Analiz & Raporu
                        </h3>
                        <div className="space-y-4 text-gray-800">
                          {renderMarkdown(analysisResult.analysis)}
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Execution Modal */}
      <Modal
        isOpen={isExecutionModalOpen}
        onClose={() => setIsExecutionModalOpen(false)}
        title={selectedChecklist?.title || 'Checklist'}
        size="lg"
      >
        {selectedChecklist && (
          <ChecklistExecutionModal
            checklist={selectedChecklist}
            onComplete={handleExecutionComplete}
            onCancel={() => setIsExecutionModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}
