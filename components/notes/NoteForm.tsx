'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { NoteSentiment, Group, Personnel, Note } from '@/lib/types';

interface NoteFormProps {
  personnelId?: string;
  groupId?: string;
  isStoreLevel?: boolean;
  editingNote?: Note | null;
  onSuccess?: () => void;
}

export default function NoteForm({ personnelId, groupId, isStoreLevel, editingNote, onSuccess }: NoteFormProps) {
  const supabase = createClient();
  const [content, setContent] = useState(editingNote?.content || '');
  const [sentiment, setSentiment] = useState<NoteSentiment>(editingNote?.sentiment || 'neutral');
  const [targetType, setTargetType] = useState<'personnel' | 'group' | 'store'>(
    editingNote?.is_store_level || isStoreLevel
      ? 'store'
      : editingNote?.group_id || groupId
      ? 'group'
      : 'personnel'
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    editingNote?.group_id || groupId || ''
  );
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>(
    editingNote?.personnel_id || personnelId || ''
  );
  const [groups, setGroups] = useState<Group[]>([]);
  const [allPersonnel, setAllPersonnel] = useState<Personnel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);

  const isEditMode = !!editingNote;

  // Fetch groups and personnel
  useEffect(() => {
    async function loadOptions() {
      const [{ data: groupsData }, { data: personnelData }] = await Promise.all([
        supabase.from('groups').select('*').order('name', { ascending: true }),
        supabase.from('personnel').select('*').order('name', { ascending: true }),
      ]);

      if (groupsData && groupsData.length > 0) {
        setGroups(groupsData);
        if (!selectedGroupId && targetType === 'group') {
          setSelectedGroupId(groupsData[0].id);
        }
      }

      if (personnelData && personnelData.length > 0) {
        setAllPersonnel(personnelData);
        if (!selectedPersonnelId && targetType === 'personnel') {
          setSelectedPersonnelId(personnelData[0].id);
        }
      }
    }
    loadOptions();
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        return;
      }

      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'tr-TR';

      recognitionInstance.onresult = (event: any) => {
        if (silenceTimer) {
          clearTimeout(silenceTimer);
        }

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
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
        if (silenceTimer) {
          clearTimeout(silenceTimer);
        }
        if (event.error === 'not-allowed') {
          setError('Mikrofon erişimi reddedildi. Lütfen tarayıcı ayarlarından mikrofon iznini verin.');
        } else if (event.error === 'no-speech') {
          setError(null);
        } else {
          setError('Ses tanıma hatası: ' + event.error);
        }
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
        if (silenceTimer) {
          clearTimeout(silenceTimer);
        }
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      setError('Tarayıcınız ses tanımayı desteklemiyor. Lütfen güncel bir tarayıcı kullanın.');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
    } else {
      setError(null);
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleSave = async (selectedSentiment: NoteSentiment) => {
    if (!content.trim()) {
      setError('Not içeriği boş olamaz');
      return;
    }

    if (targetType === 'group' && !selectedGroupId) {
      setError('Lütfen bir grup seçin veya grup oluşturun.');
      return;
    }

    if (targetType === 'personnel' && !selectedPersonnelId && !personnelId) {
      setError('Lütfen bir personel seçin.');
      return;
    }

    if (isRecording && recognition) {
      recognition.stop();
      setIsRecording(false);
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      const finalPersonnelId = targetType === 'personnel' ? selectedPersonnelId || personnelId || null : null;
      const finalGroupId = targetType === 'group' ? selectedGroupId || null : null;
      const finalIsStoreLevel = targetType === 'store';

      if (isEditMode && editingNote) {
        const { error: updateError } = await supabase
          .from('notes')
          .update({
            content: content.trim(),
            sentiment: selectedSentiment,
            personnel_id: finalPersonnelId,
            group_id: finalGroupId,
            is_store_level: finalIsStoreLevel,
          })
          .eq('id', editingNote.id);

        if (updateError) throw updateError;
      } else {
        const insertData: any = {
          author_id: user.id,
          content: content.trim(),
          sentiment: selectedSentiment,
          personnel_id: finalPersonnelId,
          group_id: finalGroupId,
          is_store_level: finalIsStoreLevel,
          organization_id: profile?.organization_id || null,
        };

        const { error: insertError } = await supabase
          .from('notes')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      setContent('');
      setSentiment('neutral');
      onSuccess?.();
    } catch (err: any) {
      console.error('Error saving note:', err);
      setError(err.message || 'Not kaydedilirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Target Selector: Personnel vs Group vs Store */}
      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-2">
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setTargetType('personnel');
              if (!selectedPersonnelId && allPersonnel.length > 0) {
                setSelectedPersonnelId(allPersonnel[0].id);
              }
            }}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
              targetType === 'personnel'
                ? 'bg-white text-blue-700 shadow-sm border border-blue-200 font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👤 Bireysel Not
          </button>
          <button
            type="button"
            onClick={() => {
              setTargetType('group');
              if (!selectedGroupId && groups.length > 0) {
                setSelectedGroupId(groups[0].id);
              }
            }}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
              targetType === 'group'
                ? 'bg-white text-blue-700 shadow-sm border border-blue-200 font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👥 Ekip Notu
          </button>
          <button
            type="button"
            onClick={() => setTargetType('store')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
              targetType === 'store'
                ? 'bg-white text-purple-700 shadow-sm border border-purple-200 font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🏬 Mağaza Genel
          </button>
        </div>

        {targetType === 'personnel' && allPersonnel.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hedef Personeli Seçin:</label>
            <select
              value={selectedPersonnelId}
              onChange={(e) => setSelectedPersonnelId(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
            >
              {allPersonnel.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {targetType === 'group' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hedef Grup Seçin:</label>
            {groups.length === 0 ? (
              <p className="text-xs text-amber-600">Henüz grup oluşturulmamış.</p>
            ) : (
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            targetType === 'store'
              ? "Mağaza genel notunu yazın..."
              : targetType === 'group'
              ? "Gruba özel not içeriğini yazın..."
              : "Not içeriğini buraya yazın veya mikrofon ile dikte edin..."
          }
          disabled={isLoading}
          rows={4}
          className="w-full px-4 py-3 pr-14 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
        />
        
        {/* Microphone button */}
        <button
          type="button"
          onClick={toggleRecording}
          disabled={isLoading}
          className={`absolute right-3 top-3 p-2 rounded-lg transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isRecording ? 'Kaydı durdur' : 'Sesli dikte başlat'}
        >
          {isRecording ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
          )}
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-700">Duygu Durumu ve Kaydet:</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleSave('positive')}
            disabled={isLoading}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              sentiment === 'positive'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span>😊</span> Olumlu
          </button>

          <button
            type="button"
            onClick={() => handleSave('neutral')}
            disabled={isLoading}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              sentiment === 'neutral'
                ? 'bg-gray-700 text-white border-gray-800 shadow-sm'
                : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <span>😐</span> Nötr
          </button>

          <button
            type="button"
            onClick={() => handleSave('negative')}
            disabled={isLoading}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              sentiment === 'negative'
                ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span>🙁</span> Olumsuz
          </button>
        </div>
      </div>
    </div>
  );
}
