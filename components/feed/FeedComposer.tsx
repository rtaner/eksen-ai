'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Group, Personnel, NoteSentiment } from '@/lib/types';
import Button from '@/components/ui/Button';

interface FeedComposerProps {
  personnelList: Personnel[];
  onPostSuccess: () => void;
}

const getTodayLocalDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function FeedComposer({ personnelList, onPostSuccess }: FeedComposerProps) {
  const supabase = createClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [wizardStep, setWizardStep] = useState<number>(0); // 0: initial, 1: type, 2: target, 3: detail, 4: final
  const [postType, setPostType] = useState<'note' | 'task' | null>(null);
  const [targetType, setTargetType] = useState<'store' | 'group' | 'personnel' | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');
  const [deadline, setDeadline] = useState(getTodayLocalDate());
  const [groups, setGroups] = useState<Group[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadGroups() {
      const { data } = await supabase.from('groups').select('*').order('name', { ascending: true });
      if (data && data.length > 0) {
        setGroups(data);
      }
    }
    loadGroups();
  }, []);

  // Speech recognition initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) return;

      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'tr-TR';

      recognitionInstance.onresult = (event: any) => {
        if (silenceTimer) clearTimeout(silenceTimer);

        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }

        if (finalTranscript) {
          setContent((prev) => prev + finalTranscript);
        }

        const timer = setTimeout(() => {
          if (recognitionInstance && isRecording) {
            recognitionInstance.stop();
            setIsRecording(false);
          }
        }, 3000);
        setSilenceTimer(timer);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (silenceTimer) clearTimeout(silenceTimer);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
        if (silenceTimer) clearTimeout(silenceTimer);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) recognition.stop();
      if (silenceTimer) clearTimeout(silenceTimer);
    };
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      setError('Tarayıcınız ses tanımayı desteklemiyor.');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      if (silenceTimer) clearTimeout(silenceTimer);
    } else {
      setError(null);
      recognition.start();
      setIsRecording(true);
      if (wizardStep === 0) setWizardStep(1);
    }
  };

  const handleReset = () => {
    setContent('');
    setWizardStep(0);
    setPostType(null);
    setTargetType(null);
    setSelectedGroupId('');
    setSelectedPersonnelId('');
    setError(null);
  };

  const handleSelectType = (type: 'note' | 'task') => {
    setPostType(type);
    setWizardStep(2);
  };

  const handleSelectTarget = (target: 'store' | 'group' | 'personnel') => {
    setTargetType(target);
    if (target === 'store') {
      setWizardStep(4);
    } else {
      setWizardStep(3);
    }
  };

  const handleOpenDatePicker = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch (err) {
        // Fallback for browsers that don't support showPicker
        dateInputRef.current.focus();
      }
    }
  };

  // One-click Note Save with direct Sentiment
  const handleSaveNoteWithSentiment = async (selectedSentiment: NoteSentiment) => {
    if (!content.trim()) {
      setError('Lütfen içeriği doldurun.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Oturum bulunamadı');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      const finalPersonnelId = targetType === 'personnel' ? selectedPersonnelId || null : null;
      const finalGroupId = targetType === 'group' ? selectedGroupId || null : null;
      const finalIsStoreLevel = targetType === 'store';

      const insertPayload: any = {
        author_id: user.id,
        content: content.trim(),
        sentiment: selectedSentiment,
        is_voice_note: isRecording,
        personnel_id: finalPersonnelId,
        group_id: finalGroupId,
        is_store_level: finalIsStoreLevel,
        organization_id: profile?.organization_id || null,
      };

      const { error: noteErr } = await supabase.from('notes').insert(insertPayload);

      if (noteErr) {
        if (noteErr.message?.includes('row-level security')) {
          throw new Error('Not kaydedilirken yetki/güvenlik kısıtlamasına takılındı. Lütfen Supabase SQL editöründe 20260803_003_fix_notes_tasks_rls_for_groups_and_store.sql migration dosyasını çalıştırın.');
        }
        throw noteErr;
      }

      handleReset();
      onPostSuccess();
    } catch (err: any) {
      console.error('Error sharing note:', err);
      setError(err.message || 'Not kaydedilirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Task Submit
  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Lütfen içeriği doldurun.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Oturum bulunamadı');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      const finalPersonnelId = targetType === 'personnel' ? selectedPersonnelId || null : null;
      const finalGroupId = targetType === 'group' ? selectedGroupId || null : null;
      const finalIsStoreLevel = targetType === 'store';

      const insertPayload: any = {
        author_id: user.id,
        description: content.trim(),
        deadline: deadline,
        status: 'open',
        personnel_id: finalPersonnelId,
        group_id: finalGroupId,
        is_store_level: finalIsStoreLevel,
        organization_id: profile?.organization_id || null,
      };

      const { error: taskErr } = await supabase.from('tasks').insert(insertPayload);

      if (taskErr) {
        if (taskErr.message?.includes('row-level security')) {
          throw new Error('Görev kaydedilirken yetki/güvenlik kısıtlamasına takılındı. Lütfen Supabase SQL editöründe 20260803_003_fix_notes_tasks_rls_for_groups_and_store.sql migration dosyasını çalıştırın.');
        }
        throw taskErr;
      }

      handleReset();
      onPostSuccess();
    } catch (err: any) {
      console.error('Error sharing task:', err);
      setError(err.message || 'Görev oluşturulurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const getPersonnelName = (id: string) => {
    const p = personnelList.find((item) => item.id === id);
    return p ? p.name : 'Seçilmedi';
  };

  const getGroupName = (id: string) => {
    const g = groups.find((item) => item.id === id);
    return g ? g.name : 'Seçilmedi';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm transition-all duration-200">
      <form onSubmit={handleTaskSubmit} className="space-y-3">
        {/* Top Single Textarea */}
        <div className="relative flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm flex-shrink-0 mt-1">
            ✍️
          </div>
          
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onFocus={() => {
                if (wizardStep === 0) setWizardStep(1);
              }}
              onChange={(e) => {
                setContent(e.target.value);
                if (wizardStep === 0) setWizardStep(1);
              }}
              placeholder="Mağazada ne oluyor? Hızlı Not veya Görev yazın..."
              rows={wizardStep > 0 ? 3 : 1}
              className="w-full pl-4 pr-12 py-2.5 bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 font-medium"
            />

            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`absolute right-2.5 top-2 p-1.5 rounded-full transition-all flex items-center justify-center ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/60'
              }`}
              title="Sesli dikte başlat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 text-xs text-red-600 font-medium animate-pulse pl-13">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Ses dinleniyor... Konuşmaya başlayın (3 sn sessizlik sonrası otomatik kaydedilir)
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Selected Breadcrumbs / Active Choices Bar */}
        {wizardStep > 1 && (
          <div className="flex items-center gap-2 flex-wrap text-xs bg-gray-50 p-2 rounded-xl border border-gray-100">
            {postType && (
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg font-semibold hover:bg-blue-200 transition-colors flex items-center gap-1"
              >
                {postType === 'note' ? '📝 Not' : '📋 Görev'} ✏️
              </button>
            )}
            {targetType && wizardStep > 2 && (
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg font-semibold hover:bg-purple-200 transition-colors flex items-center gap-1"
              >
                {targetType === 'store' ? '🏬 Mağaza' : targetType === 'group' ? `👥 ${getGroupName(selectedGroupId)}` : `👤 ${getPersonnelName(selectedPersonnelId)}`} ✏️
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="ml-auto text-gray-400 hover:text-red-600 text-xs underline"
            >
              Vazgeç
            </button>
          </div>
        )}

        {/* ULTRA-FAST ZERO-FRICTION WIZARD STEPS */}

        {/* STEP 1: Not mu Görev mi? */}
        {wizardStep === 1 && (
          <div className="pt-2 border-t border-gray-100 animate-fadeIn">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSelectType('note')}
                className="flex-1 py-3 px-4 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border-2 border-blue-200 hover:border-blue-600 rounded-xl font-bold text-sm transition-all shadow-2xs flex items-center justify-center gap-2"
              >
                📝 Not Ekle
              </button>
              <button
                type="button"
                onClick={() => handleSelectType('task')}
                className="flex-1 py-3 px-4 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border-2 border-indigo-200 hover:border-indigo-600 rounded-xl font-bold text-sm transition-all shadow-2xs flex items-center justify-center gap-2"
              >
                📋 Görev
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Kime / Nereye Atanacak? */}
        {wizardStep === 2 && (
          <div className="pt-2 border-t border-gray-100 animate-fadeIn">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSelectTarget('store')}
                className="flex-1 py-3 px-3 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border-2 border-purple-200 hover:border-purple-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                🏬 Mağaza Genel
              </button>
              <button
                type="button"
                onClick={() => handleSelectTarget('group')}
                className="flex-1 py-3 px-3 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border-2 border-purple-200 hover:border-purple-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                👥 Ekip / Grup
              </button>
              <button
                type="button"
                onClick={() => handleSelectTarget('personnel')}
                className="flex-1 py-3 px-3 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border-2 border-purple-200 hover:border-purple-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                👤 Bireysel Kişi
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Grup veya Personel Seçimi (Custom Select with Default Unselected) */}
        {wizardStep === 3 && (
          <div className="pt-2 border-t border-gray-100 animate-fadeIn">
            {targetType === 'group' && (
              <div>
                {groups.length === 0 ? (
                  <p className="text-xs text-amber-600 font-medium p-2">Henüz bir grup tanımlanmamış.</p>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedGroupId}
                      onChange={(e) => {
                        setSelectedGroupId(e.target.value);
                        setWizardStep(4);
                      }}
                      className="w-full px-4 py-3 text-sm border-2 border-purple-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold text-gray-800 shadow-2xs cursor-pointer transition-all appearance-none pr-10"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239333ea' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        backgroundSize: '1.25em 1.25em',
                      }}
                    >
                      <option value="" disabled>👥 Lütfen Bir Grup Seçin...</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          👥 {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {targetType === 'personnel' && (
              <div className="relative">
                <select
                  value={selectedPersonnelId}
                  onChange={(e) => {
                    setSelectedPersonnelId(e.target.value);
                    setWizardStep(4);
                  }}
                  className="w-full px-4 py-3 text-sm border-2 border-purple-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold text-gray-800 shadow-2xs cursor-pointer transition-all appearance-none pr-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239333ea' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.25em 1.25em',
                  }}
                >
                  <option value="" disabled>👤 Lütfen Bir Personel Seçin...</option>
                  {personnelList.map((p) => (
                    <option key={p.id} value={p.id}>
                      👤 {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Özelleştirme ve Kaydet */}
        {wizardStep === 4 && (
          <div className="pt-2 border-t border-gray-100 animate-fadeIn">
            {postType === 'note' ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSaveNoteWithSentiment('positive')}
                    className="flex-1 py-3 px-3 bg-green-50 hover:bg-green-600 text-green-700 hover:text-white border-2 border-green-200 hover:border-green-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    ✅ Olumlu Not
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSaveNoteWithSentiment('negative')}
                    className="flex-1 py-3 px-3 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border-2 border-red-200 hover:border-red-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    ⚠️ Olumsuz Not
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSaveNoteWithSentiment('neutral')}
                    className="flex-1 py-3 px-3 bg-gray-50 hover:bg-gray-700 text-gray-700 hover:text-white border-2 border-gray-200 hover:border-gray-700 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    📝 Nötr Not
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <button type="button" onClick={handleReset} className="text-xs text-gray-500 hover:text-gray-900 font-medium">
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* Fully clickable custom date input wrapper */}
                <div 
                  onClick={handleOpenDatePicker}
                  className="flex items-center gap-2 px-3 py-2 border-2 border-blue-200 hover:border-blue-400 bg-blue-50/50 rounded-xl shadow-2xs cursor-pointer transition-all"
                >
                  <span className="text-xs font-bold text-blue-900">📅 Termin:</span>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    onClick={(e) => {
                      try {
                        (e.target as HTMLInputElement).showPicker?.();
                      } catch (err) {}
                    }}
                    className="bg-transparent border-none p-0 text-xs font-bold text-blue-900 focus:outline-none cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleReset} className="text-xs text-gray-500 hover:text-gray-900 font-medium px-2 py-1">
                    Vazgeç
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isLoading || !content.trim()}
                  >
                    {isLoading ? 'Oluşturuluyor...' : '📋 Görevi Oluştur'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
