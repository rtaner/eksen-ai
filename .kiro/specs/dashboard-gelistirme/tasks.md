# Dashboard Geliştirme - Implementation Tasks

## Task List

- [x] 1. Ayarlar sayfasını güncelle ve dashboard bölümlerini ekle





  - Mevcut `/settings/page.tsx` dosyasını güncelle
  - 3 yeni dashboard kartını mevcut ayar kartlarının üstüne ekle
  - Responsive grid layout oluştur
  - _Requirements: 1, 4_

- [x] 1.1 Tamamlanmamış Görevler componentini oluştur


  - `components/dashboard/UncompletedTasksCard.tsx` oluştur
  - İki sekme ekle: "Bugün Biten" ve "Gecikmiş"
  - Görev listesi ve görev kartları oluştur
  - Boş durum (empty state) ekle
  - Loading skeleton ekle
  - _Requirements: 1_

- [x] 1.2 Performans Özeti componentini oluştur


  - `components/dashboard/PerformanceStatsCard.tsx` oluştur
  - 4 istatistik kartı oluştur (Notlar, Görevler, Oran, Puan)
  - Grid layout ile düzenle
  - Loading skeleton ekle
  - _Requirements: 2_

- [x] 1.3 Zaman Çizelgesi componentini oluştur


  - `components/dashboard/TimelineCard.tsx` oluştur
  - Aktivite listesi oluştur (not, görev, analiz)
  - Göreceli zaman formatı ekle (5 dakika önce, dün, vb.)
  - Boş durum ekle
  - Loading skeleton ekle
  - _Requirements: 3_

- [x] 2. Veri çekme fonksiyonlarını oluştur


  - Tamamlanmamış görevleri çek (bugün biten + gecikmiş)
  - Son 7 günlük performans istatistiklerini hesapla
  - Son 10 aktiviteyi çek ve birleştir
  - Error handling ekle
  - _Requirements: 1, 2, 3, 5_

- [x] 2.1 Görev verilerini çek

  - Supabase query ile tamamlanmamış görevleri al
  - Deadline'a göre filtrele (bugün / gecikmiş)
  - Personel bilgilerini join et
  - _Requirements: 1_


- [x] 2.2 Performans istatistiklerini hesapla

  - Son 7 günlük notları say
  - Son 7 günlük tamamlanan görevleri say
  - Olumlu/olumsuz not oranını hesapla
  - Ortalama görev puanını hesapla
  - _Requirements: 2_

- [x] 2.3 Aktivite verilerini çek ve birleştir


  - Son 10 notu çek
  - Son 10 tamamlanan görevi çek
  - Son 10 analizi çek
  - Tarihe göre sırala ve ilk 10'u al
  - Aktivite tipine göre formatla
  - _Requirements: 3_

- [x] 3. Utility fonksiyonları oluştur



  - Göreceli zaman formatı (timeAgo)
  - Tarih filtreleme (isToday, isPast)
  - İstatistik hesaplama yardımcıları
  - _Requirements: 1, 2, 3_

- [x] 4. Responsive tasarım ve stil düzenlemeleri



  - Mobil layout (tek sütun)
  - Tablet layout (2 sütun)
  - Desktop layout (grid)
  - Touch-friendly butonlar
  - _Requirements: 4_

- [x] 5. Error handling ve loading states


  - Try-catch blokları ekle
  - Error mesajları göster
  - Loading skeleton'ları ekle
  - "Tekrar Dene" butonu ekle
  - _Requirements: 5_

- [x] 6. Test ve doğrulama


  - Farklı rol türleriyle test et (Owner, Manager, Employee)
  - Boş veri durumlarını test et
  - Mobil cihazlarda test et
  - Error durumlarını test et
  - _Requirements: 1, 2, 3, 4, 5, 7_
