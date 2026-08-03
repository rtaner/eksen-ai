'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { StoreGlossaryItem } from '@/lib/types';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function GlossarySettingsCard() {
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();
  const [glossary, setGlossary] = useState<StoreGlossaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchGlossary = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_glossary')
        .select('*')
        .order('term', { ascending: true });

      if (error) throw error;
      setGlossary(data || []);
    } catch (err: any) {
      console.error('Error fetching glossary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGlossary();
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) {
      setError('Lütfen hem terim adını hem de tanımını doldurun.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Oturum bulunamadı.');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (editingId) {
        // Update
        const { error: updateErr } = await supabase
          .from('store_glossary')
          .update({
            term: term.trim(),
            definition: definition.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (updateErr) throw updateErr;
        setSuccessMessage('Terim başarıyla güncellendi.');
      } else {
        // Create
        const { error: insertErr } = await supabase
          .from('store_glossary')
          .insert({
            organization_id: profile?.organization_id || null,
            term: term.trim(),
            definition: definition.trim(),
          });

        if (insertErr) throw insertErr;
        setSuccessMessage('Yeni terim mağaza sözlüğüne eklendi.');
      }

      setTerm('');
      setDefinition('');
      setEditingId(null);
      fetchGlossary();
    } catch (err: any) {
      console.error('Error saving glossary item:', err);
      setError(err.message || 'Terim kaydedilirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: StoreGlossaryItem) => {
    setEditingId(item.id);
    setTerm(item.term);
    setDefinition(item.definition);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTerm('');
    setDefinition('');
    setError(null);
    setSuccessMessage(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu terimi sözlükten silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase.from('store_glossary').delete().eq('id', id);
      if (error) throw error;
      setSuccessMessage('Terim silindi.');
      fetchGlossary();
    } catch (err: any) {
      console.error('Error deleting glossary item:', err);
      setError(err.message || 'Terim silinirken hata oluştu.');
    }
  };

  return (
    <>
      {/* Settings Grid Card Item */}
      <button onClick={() => setIsOpen(true)} className="text-left w-full min-h-[44px]">
        <Card hover className="h-full">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Terimler Sözlüğü
              </h3>
              <p className="text-sm text-gray-600">
                Mağazanıza özel jargon ve terimleri tanımlayın
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </Card>
      </button>

      {/* Modal Popup */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="📖 Mağaza Terimler Sözlüğü (Özel Jargon)"
        size="lg"
      >
        <div className="space-y-6 pt-1">
          <p className="text-xs text-gray-500">
            Mağazanızda kullandığınız özel terimleri ve jargonları tanımlayın (Örn: Pas Satış, Görsel vb.).
          </p>

          {/* AI Notice Banner */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium flex items-start gap-2.5">
            <span className="text-base flex-shrink-0">🤖</span>
            <div>
              <span className="font-bold">Yapay Zeka (Gemini AI) Entegrasyonu:</span> Buraya eklediğiniz tüm terimler ve anlamları, AI Mağaza Analizlerinde ve Personel Değerlendirme Raporlarında otomatik olarak dikkate alınacaktır.
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="text-xs font-bold text-gray-700">
              {editingId ? '✏️ Terimi Düzenle' : '➕ Yeni Terim Ekle'}
            </h3>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                ⚠️ {error}
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 font-medium">
                ✅ {successMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Terim / Jargon:
                </label>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Örn: Pas Satış"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Anlamı / Açıklaması:
                </label>
                <input
                  type="text"
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                  placeholder="Örn: Mağazada ödemesini alıp ürünü kargo ile müşterinin adresine gönderme işlemi"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              {editingId && (
                <Button type="button" variant="secondary" size="sm" onClick={handleCancelEdit}>
                  Vazgeç
                </Button>
              )}
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Kaydediliyor...' : editingId ? 'Güncelle' : '➕ Terimi Ekle'}
              </Button>
            </div>
          </form>

          {/* Existing Terms List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700">
              Kayıtlı Mağaza Terimleri ({glossary.length})
            </h3>

            {isLoading ? (
              <div className="text-xs text-gray-500 py-4 text-center">Sözlük yükleniyor...</div>
            ) : glossary.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Henüz bir terim eklenmemiş. Mağazanızın jargonunu ekleyerek AI analizlerinin kalitesini artırın.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {glossary.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-2xs hover:border-blue-300 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          📌 {item.term}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 font-medium leading-relaxed">
                        {item.definition}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors text-xs"
                        title="Düzenle"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs"
                        title="Sil"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
