'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Task, Group, Personnel } from '@/lib/types';
import Button from '@/components/ui/Button';

interface TaskFormProps {
  personnelId?: string;
  groupId?: string;
  isStoreLevel?: boolean;
  editingTask?: Task | null;
  initialDescription?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const getTodayLocalDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TaskForm({
  personnelId,
  groupId,
  isStoreLevel,
  editingTask,
  initialDescription,
  onSuccess,
  onCancel,
}: TaskFormProps) {
  const supabase = createClient();
  const [description, setDescription] = useState(initialDescription || editingTask?.description || '');
  const [deadline, setDeadline] = useState(
    editingTask?.deadline || getTodayLocalDate()
  );
  const [targetType, setTargetType] = useState<'personnel' | 'group' | 'store'>(
    editingTask?.is_store_level || isStoreLevel
      ? 'store'
      : editingTask?.group_id || groupId
      ? 'group'
      : 'personnel'
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    editingTask?.group_id || groupId || ''
  );
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>(
    editingTask?.personnel_id || personnelId || ''
  );
  const [groups, setGroups] = useState<Group[]>([]);
  const [allPersonnel, setAllPersonnel] = useState<Personnel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);

  const isEditMode = !!editingTask;

  // Load groups and personnel
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
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

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
          setDescription((prev) => prev + finalTranscript);
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
          setError(
            'Mikrofon erişimi reddedildi. Lütfen tarayıcı ayarlarından mikrofon iznini verin.'
          );
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
      setError(
        'Tarayıcınız ses tanımayı desteklemiyor. Lütfen güncel bir tarayıcı kullanın.'
      );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setError('Görev açıklaması boş olamaz');
      return;
    }

    if (targetType === 'group' && !selectedGroupId) {
      setError('Lütfen bir grup seçin veya grup oluşturun.');
      return;
    }

    if (targetType === 'personnel' && !selectedPersonnelId && !personnelId) {
      setError('Lütfen görevi atamak için bir personel seçin.');
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      const finalPersonnelId = targetType === 'personnel' ? selectedPersonnelId || personnelId || null : null;
      const finalGroupId = targetType === 'group' ? selectedGroupId || null : null;
      const finalIsStoreLevel = targetType === 'store';

      if (isEditMode && editingTask) {
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            description: description.trim(),
            deadline,
            personnel_id: finalPersonnelId,
            group_id: finalGroupId,
            is_store_level: finalIsStoreLevel,
          })
          .eq('id', editingTask.id);

        if (updateError) throw updateError;
      } else {
        const insertData: any = {
          author_id: user?.id,
          description: description.trim(),
          deadline,
          status: 'open',
          personnel_id: finalPersonnelId,
          group_id: finalGroupId,
          is_store_level: finalIsStoreLevel,
          organization_id: profile?.organization_id || null,
        };

        const { error: insertError } = await supabase
          .from('tasks')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      onSuccess?.();
    } catch (err: any) {
      console.error('Error saving task:', err);
      setError(err.message || 'Görev kaydedilirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Target Selector: Personnel vs Group vs Store */}
      <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 space-y-2">
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setTargetType('personnel')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
              targetType === 'personnel'
                ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👤 Bireysel Görev
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
                ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👥 Ekip Görevi
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
            🏬 Mağaza Genel (Yapılacak)
          </button>
        </div>

        {targetType === 'personnel' && !personnelId && allPersonnel.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Atanacak Personeli Seçin:</label>
            <select
              value={selectedPersonnelId}
              onChange={(e) => setSelectedPersonnelId(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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

      {/* Description input with speech recognition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Görev Açıklaması *
        </label>
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              targetType === 'store'
                ? "Mağaza için genel görev / yapılacaklar detayı (Örn: Depo sayımı yapılacak, yeni sezon reyonları kontrol edilecek...)"
                : targetType === 'group'
                ? "Ekip için verilecek görevi açıklayın..."
                : "Görev detaylarını buraya yazın..."
            }
            disabled={isLoading}
            rows={4}
            className="w-full px-4 py-3 pr-14 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            title={
              isRecording
                ? 'Kaydı durdur (3 sn sessizlik sonrası otomatik kapanır)'
                : 'Sesli dikte başlat'
            }
          >
            {isRecording ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
              </svg>
            )}
          </button>
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Dinleniyor... Konuşmaya başlayın (3 sn sessizlik sonrası otomatik kapanır)
          </div>
        )}
      </div>

      {/* Deadline picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Termin Tarihi (Opsiyonel)
        </label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          disabled={isLoading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[44px]"
        />
        <p className="text-xs text-gray-500 mt-1">
          Varsayılan: Bugün ({new Date().toLocaleDateString('tr-TR')})
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2 sticky bottom-0 bg-white pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4 border-t border-gray-100 mt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (isRecording && recognition) {
              recognition.stop();
              setIsRecording(false);
              if (silenceTimer) {
                clearTimeout(silenceTimer);
              }
            }
            onCancel?.();
          }}
          disabled={isLoading}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          İptal
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !description.trim()}
          className="w-full sm:w-auto order-1 sm:order-2"
        >
          {isLoading ? 'Kaydediliyor...' : isEditMode ? 'Güncelle / Atamayı Değiştir' : 'Görev / Yapılacak Ekle'}
        </Button>
      </div>
    </form>
  );
}
