'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface OneOnOneMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnelId: string;
  personnelName: string;
  onSuccess: () => void;
}

export default function OneOnOneMeetingModal({
  isOpen,
  onClose,
  personnelId,
  personnelName,
  onSuccess,
}: OneOnOneMeetingModalProps) {
  const supabase = createClient();

  // 3-Step Workflow: 1 = Sorular, 2 = Analiz İnceleme, 3 = Taahhütler
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isMinimized, setIsMinimized] = useState(false);

  const [selfRating, setSelfRating] = useState<number>(8);
  const [motivation, setMotivation] = useState('');
  const [challenges, setChallenges] = useState('');
  const [teamChanges, setTeamChanges] = useState('');
  const [proudestAccomplishment, setProudestAccomplishment] = useState('');
  const [managerSupport, setManagerSupport] = useState('');
  const [storeImprovements, setStoreImprovements] = useState('');
  const [trainingNeeded, setTrainingNeeded] = useState('');
  const [preferredMentor, setPreferredMentor] = useState('');

  const [personnelCommitment, setPersonnelCommitment] = useState('');
  const [managerCommitment, setManagerCommitment] = useState('');
  const [createTasks, setCreateTasks] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setStep(1);
    setIsMinimized(false);
    setSelfRating(8);
    setMotivation('');
    setChallenges('');
    setTeamChanges('');
    setProudestAccomplishment('');
    setManagerSupport('');
    setStoreImprovements('');
    setTrainingNeeded('');
    setPreferredMentor('');
    setPersonnelCommitment('');
    setManagerCommitment('');
    setCreateTasks(true);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep((prev) => (prev + 1) as 2 | 3);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı.');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('Organizasyon bilgisi bulunamadı.');

      // 1. Save 1-on-1 Meeting Record
      const answersObj = {
        motivation,
        challenges,
        team_changes: teamChanges,
        proudest_accomplishment: proudestAccomplishment,
        manager_support: managerSupport,
        store_improvements: storeImprovements,
        training_needed: trainingNeeded,
        preferred_mentor: preferredMentor,
      };

      const { data: meetingData, error: meetingError } = await supabase
        .from('one_on_one_meetings')
        .insert({
          organization_id: profile.organization_id,
          personnel_id: personnelId,
          manager_id: user.id,
          self_rating: selfRating,
          answers: answersObj,
          personnel_commitment: personnelCommitment || null,
          manager_commitment: managerCommitment || null,
          status: 'completed',
          meeting_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      // 2. Automatically create tasks if option is selected
      if (createTasks) {
        const defaultDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Personnel Task Commitment
        if (personnelCommitment.trim()) {
          await supabase.from('tasks').insert({
            organization_id: profile.organization_id,
            personnel_id: personnelId,
            author_id: user.id,
            description: `🎯 Personel Taahhüdü: ${personnelCommitment.trim()}`,
            deadline: defaultDeadline,
            status: 'open',
          });
        }

        // Manager Task Commitment
        if (managerCommitment.trim()) {
          await supabase.from('tasks').insert({
            organization_id: profile.organization_id,
            author_id: user.id,
            description: `👔 Yönetici Taahhüdü (${personnelName} için): ${managerCommitment.trim()}`,
            deadline: defaultDeadline,
            status: 'open',
          });
        }
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error saving 1-on-1 meeting:', err);
      setError(err.message || 'Görüşme kaydedilirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Minimized Widget view when manager is reading the AI report underneath
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-purple-500/50 flex flex-col md:flex-row items-center gap-4 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          <div>
            <div className="text-xs font-bold text-purple-300">🤝 1-on-1 Görüşme Devam Ediyor</div>
            <div className="text-xs font-semibold text-white">{personnelName} ({step === 2 ? 'Adım 2: Analiz Raporu İnceleme' : `Adım ${step}/3`})</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl transition-all"
          >
            ↗ Genişlet
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMinimized(false);
              setStep(3);
            }}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            Taahhütlere Geç →
          </button>
        </div>
      </div>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`🤝 1-on-1 Görüşme Kaydı - ${personnelName}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* 3-Step Header Bar */}
        <div className="space-y-2 border-b border-gray-200 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className={`px-2.5 py-1 rounded-lg transition-all ${step === 1 ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
                1. Görüşme Soruları
              </span>
              <span className="text-gray-300">→</span>
              <span className={`px-2.5 py-1 rounded-lg transition-all ${step === 2 ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
                2. Analiz İnceleme
              </span>
              <span className="text-gray-300">→</span>
              <span className={`px-2.5 py-1 rounded-lg transition-all ${step === 3 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
                3. Taahhütler
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="text-xs text-purple-700 hover:text-purple-900 font-semibold bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
              title="Modalı küçültüp ekrandaki AI raporunu okuyun"
            >
              <span>🔽</span> Modalı Küçült (Raporu Oku)
            </button>
          </div>
        </div>

        {/* STEP 1: Görüşme Soruları */}
        {step === 1 && (
          <div className="space-y-4 max-h-[58vh] overflow-y-auto pr-1">
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900 font-medium">
              💡 Görüşmenin ilk aşamasında aşağıdaki soruları personelle birlikte yanıtlayınız.
            </div>

            {/* Question 1: Rating */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2">
              <label className="block text-xs font-bold text-blue-900">
                1. ⭐ Kendine (performansına/çabana) kaç puan verirsin? (1-10)
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelfRating(num)}
                    className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                      selfRating === num
                        ? 'bg-blue-600 text-white shadow-sm scale-105'
                        : 'bg-white text-gray-700 hover:bg-blue-100 border border-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2: Motivation */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                2. 🔥 İşte seni en çok motive eden şey nedir?
              </label>
              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                rows={2}
                placeholder="Örn: Takdir edilmek, prim sistemi, yeni şeyler öğrenmek..."
                className="w-[#100%] text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Question 3: Challenges */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                3. 🚧 En çok zorlandığın konu nedir?
              </label>
              <textarea
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                rows={2}
                placeholder="Örn: Yoğun saatlerde kasada yığılma olması, ürün iade prosedürleri..."
                className="w-[#100%] text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Question 4: Team Changes */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                4. 👥 Ekibimizde değiştirmek istediğin şey nedir?
              </label>
              <textarea
                value={teamChanges}
                onChange={(e) => setTeamChanges(e.target.value)}
                rows={2}
                placeholder="Örn: Vardiya teslimlerinde iletişim kopukluğu, haberleşme grubu..."
                className="w-[#100%] text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Question 5: Accomplishment */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                5. 🏆 Son ay en gurur duyduğun başarın nedir?
              </label>
              <textarea
                value={proudestAccomplishment}
                onChange={(e) => setProudestAccomplishment(e.target.value)}
                rows={2}
                placeholder="Örn: X müşterisine zorlu ürünü satmam, reyon düzenlemesini tek başıma bitirmem..."
                className="w-[#100%] text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Question 6: Manager Support */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                6. 🤝 Benden nasıl bir destek bekliyorsun?
              </label>
              <textarea
                value={managerSupport}
                onChange={(e) => setManagerSupport(e.target.value)}
                rows={2}
                placeholder="Örn: İade yetkisi tanımlanması, haftada 1 kez kısa geribildirim almam..."
                className="w-[#100%] text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Question 7: Store Improvements */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                7. 🏬 Daha başarılı olman için mağaza olarak neyi değiştirebiliriz?
              </label>
              <textarea
                value={storeImprovements}
                onChange={(e) => setStoreImprovements(e.target.value)}
                rows={2}
                placeholder="Örn: Depodaki etiketleme sisteminin yenilenmesi, etiket yazıcısının tamiri..."
                className="w-[#100%] text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Question 8: Training */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                8. 🎓 Sana en çok hangi eğitim fayda sağlar?
              </label>
              <textarea
                value={trainingNeeded}
                onChange={(e) => setTrainingNeeded(e.target.value)}
                rows={2}
                placeholder="Örn: İkna ve Satış Teknikleri, Kasa Yazılımı Kullanımı..."
                className="w-[#100%] text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Question 9: Mentor */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                9. 👥 Kiminle birlikte çalışırsan daha hızlı gelişirsin?
              </label>
              <textarea
                value={preferredMentor}
                onChange={(e) => setPreferredMentor(e.target.value)}
                rows={2}
                placeholder="Örn: Ali Bey ile aynı vardiyada çalışmak, Ayşe Hanım'dan mentörlük almak..."
                className="w-[#100%] text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Analiz Raporu İnceleme */}
        {step === 2 && (
          <div className="space-y-6 py-4">
            <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 text-center space-y-3">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto shadow-md">
                📊
              </div>
              <h3 className="text-base font-bold text-purple-900">
                2. Adım: Yapay Zeka Analiz Raporunu İnceleyin
              </h3>
              <p className="text-xs text-purple-700 max-w-md mx-auto leading-relaxed">
                Görüşme sorularını yanıtladınız. Şimdi ekrandaki AI Analiz Raporunu personelinizle birlikte detaylıca inceleyebilirsiniz.
              </p>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md"
              >
                <span>🔽</span> Modalı Küçült ve Raporu Ekranda Okuyun
              </button>
            </div>

            {/* Summary Preview of Step 1 Answers */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-2">
              <div className="font-bold text-gray-800">✅ Girilen Soruların Özeti (Öz-Puan: {selfRating}/10):</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-600">
                {motivation && <div>• Motivasyon: {motivation}</div>}
                {challenges && <div>• Zorluk: {challenges}</div>}
                {managerSupport && <div>• Beklenen Destek: {managerSupport}</div>}
                {trainingNeeded && <div>• İstenen Eğitim: {trainingNeeded}</div>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Taahhütler */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900 font-medium">
              🎯 3. Adım: Sorular ve Analiz İncelemesi Tamamlandı. Şimdi Karşılıklı Taahhütleri Giriniz:
            </div>

            {/* Personnel Commitment */}
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
              <label className="block text-xs font-bold text-emerald-900">
                👤 Personel Taahhüdü ({personnelName})
              </label>
              <p className="text-[11px] text-emerald-700">
                Personelin puanını yükseltmek ve gelişim göstermek için verdiği somut sözler:
              </p>
              <textarea
                value={personnelCommitment}
                onChange={(e) => setPersonnelCommitment(e.target.value)}
                rows={3}
                placeholder="Örn: 30 gün boyunca kapanış kontrol listesini eksiksiz dolduracağım..."
                className="w-[#100%] text-xs p-2.5 border border-emerald-300 bg-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Manager Commitment */}
            <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-2">
              <label className="block text-xs font-bold text-purple-900">
                👔 Yönetici Taahhüdü (Sizin Taahhüdünüz)
              </label>
              <p className="text-[11px] text-purple-700">
                Yöneticinin personeli desteklemek ve kaynak sağlamak için verdiği sözler:
              </p>
              <textarea
                value={managerCommitment}
                onChange={(e) => setManagerCommitment(e.target.value)}
                rows={3}
                placeholder="Örn: Ali Bey ile Salı-Perşembe vardiya eşleşmesi yapacağım, yeni yetki tanımlayacağım..."
                className="w-[#100%] text-xs p-2.5 border border-purple-300 bg-white rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {/* Option to auto-create tasks */}
            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={createTasks}
                onChange={(e) => setCreateTasks(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-xs font-medium text-gray-700">
                Bu taahhütleri görev sistemine otomatik takvimli görev olarak ekle
              </span>
            </label>
          </div>
        )}

        {/* Modal Controls */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          {step === 1 ? (
            <Button type="button" variant="secondary" onClick={handleClose}>
              İptal
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={(e) => {
                e.preventDefault();
                setStep((prev) => (prev - 1) as 1 | 2);
              }}
            >
              ← Önceki Adıma Dön
            </Button>
          )}

          {step === 1 && (
            <Button
              type="button"
              variant="primary"
              onClick={(e) => {
                e.preventDefault();
                setStep(2);
              }}
            >
              Soruları Tamamla & Rapor İncelemesine Geç →
            </Button>
          )}

          {step === 2 && (
            <Button
              type="button"
              variant="primary"
              onClick={(e) => {
                e.preventDefault();
                setStep(3);
              }}
            >
              Rapor İncelemesi Bitti → Taahhütlere Geç →
            </Button>
          )}

          {step === 3 && (
            <Button type="submit" variant="primary" isLoading={isLoading}>
              🤝 Görüşmeyi Kaydet & Taahhütleri Başlat
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
