'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { NoteSentiment } from '@/lib/types';

interface NoteFormProps {
  personnelId: string;
  editingNote?: Note | null;
  onSuccess?: () => void;
}

interface Note {
  id: string;
  content: string;
  sentiment: NoteSentiment;
}

export default function NoteForm({ personnelId, editingNote, onSuccess }: NoteFormProps) {
  const supabase = createClient();
  const [content, setContent] = useState(editingNote?.content || '');
  const [sentiment, setSentiment] = useState<NoteSentiment>(editingNote?.sentiment || 'neutral');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);

  const isEditMode = !!editingNote;

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
        // Clear silence timer when speech is detected
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

        // Start new silence timer (3 seconds)
        const timer = setTimeout(() => {
          if (recognitionInstance && isRecording) {
            recognitionInstance.stop();
            setIsRecording(false);
          }
        }, 3000); // 3 seconds of silence

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
          // Silence timeout - not an error
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

    // Stop recording if active
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
      if (isEditMode && editingNote) {
        // Update existing note
        const { error: updateError } = await supabase
          .from('notes')
          .update({
            content: content.trim(),
            sentiment: selectedSentiment,
          })
          .eq('id', editingNote.id);

        if (updateError) throw updateError;
      } else {
        // Create new note
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

        const { error: insertError } = await supabase
          .from('notes')
          .insert({
            personnel_id: personnelId,
            author_id: user.id,
            content: content.trim(),
            sentiment: selectedSentiment,
            is_voice_note: false,
          });

        if (insertError) throw insertError;

        // No notification sent for notes
      }

      // Clear form
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
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Not içeriğini buraya yazın veya mikrofon ile dikte edin..."
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
          title={isRecording ? 'Kaydı durdur (3 sn sessizlik sonrası otomatik kapanır)' : 'Sesli dikte başlat'}
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

      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Dinleniyor... Konuşmaya başlayın (3 sn sessizlik sonrası otomatik kapanır)
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => handleSave('positive')}
          disabled={isLoading || !content.trim()}
          className="flex-1 px-4 py-3 bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          ✅ Olumlu
        </button>
        <button
          onClick={() => handleSave('negative')}
          disabled={isLoading || !content.trim()}
          className="flex-1 px-4 py-3 bg-red-100 text-red-700 hover:bg-red-200 border-2 border-red-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          ⚠️ Olumsuz
        </button>
        <button
          onClick={() => handleSave('neutral')}
          disabled={isLoading || !content.trim()}
          className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          📝 Nötr
        </button>
      </div>
    </div>
  );
}
