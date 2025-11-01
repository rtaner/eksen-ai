// AI Analysis Types

export type AnalysisType = 'yetkinlik' | 'egilim' | 'butunlesik';

// Base AI Analysis interface
export interface AIAnalysis {
  id: string;
  personnel_id: string;
  analysis_type: AnalysisType;
  date_range_start: string;
  date_range_end: string;
  result: YetkinlikAnalysis | EgilimAnalysis | ButunlesikAnalysis;
  raw_response: string | null;
  created_by: string;
  created_at: string;
}

// ============================================
// YETKINLIK ANALIZI (Competency Analysis)
// ============================================

export interface YetkinlikAnalysis {
  genel_yonetici_ozeti: string;
  kategori_analizleri: KategoriAnaliz[];
  aksiyon_plani: AksiyonPlani;
}

export interface KategoriAnaliz {
  kategori_adi: string;
  veri_ozeti: {
    olumlu: number;
    olumsuz: number;
    notr: number;
    puan_ortalamasi: number | null;
  };
  degerlendirme_notu: string;
}

export interface AksiyonPlani {
  takdir_edilecekler: string[];
  gelistirilmesi_gerekenler: string[];
  onerilen_eylemler: string[];
}

// ============================================
// EGILIM ANALIZI (Trend Analysis)
// ============================================

export interface EgilimAnalysis {
  performans_egilimi: PerformansEgilimi;
  duygu_egilimi: DuyguEgilimi;
  tekrarlayan_desenler: TekrarlayanDesenler;
  korelasyon_analizi: string;
  ozet_icgoru: string;
}

export interface PerformansEgilimi {
  aciklama: string;
  grafik_verisi: { tarih: string; puan: number }[];
  genel_trend: 'artan' | 'azalan' | 'istikrarli';
}

export interface DuyguEgilimi {
  aciklama: string;
  grafik_verisi: {
    tarih: string;
    olumlu: number;
    olumsuz: number;
    notr: number;
  }[];
}

export interface TekrarlayanDesenler {
  olumsuz_temalar: { tema: string; siklik: number }[];
  dusuk_puan_temalar: { tema: string; siklik: number }[];
}

// ============================================
// BUTUNLESIK ANALIZ (Integrated Analysis)
// ============================================

export interface ButunlesikAnalysis {
  yonetici_analizi: YoneticiAnalizi;
  ik_analizi: IKAnalizi;
  kritik_olaylar: KritikOlaylar;
}

export interface YoneticiAnalizi {
  baslik: string;
  yorum: string;
  tavsiyeler: string[];
}

export interface IKAnalizi {
  baslik: string;
  yorum: string;
  tavsiyeler: string[];
}

export interface KritikOlaylar {
  baslik: string;
  basarilar: string[];
  gelisim_alanlari: string[];
}

// ============================================
// HELPER TYPES
// ============================================

// Analysis creation request
export interface CreateAnalysisRequest {
  personnelId: string;
  analysisType: AnalysisType;
  dateRangeStart: string;
  dateRangeEnd: string;
}

// Analysis with personnel info
export interface AIAnalysisWithPersonnel extends AIAnalysis {
  personnel: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    name: string;
    surname: string;
  };
}

// Analysis filters
export interface AnalysisFilters {
  personnelId?: string;
  analysisType?: AnalysisType;
  dateFrom?: string;
  dateTo?: string;
}

// Export formats
export type ExportFormat = 'pdf' | 'json';
