# Dashboard Geliştirme - Requirements

## Introduction

Eksen AI uygulamasının ana dashboard sayfasını geliştirerek kullanıcılara kritik bilgileri hızlı ve etkili bir şekilde sunmak. Dashboard, tamamlanmamış görevler, performans özeti ve son aktiviteleri içerecek şekilde tasarlanacaktır.

## Glossary

- **Dashboard**: Kullanıcının giriş yaptıktan sonra gördüğü ana sayfa
- **Tamamlanmamış Görevler**: Henüz tamamlanmamış (status != 'closed') görevler
- **Gecikmiş Görev**: Deadline'ı bugünden önce olan ve tamamlanmamış görev
- **Bugün Biten Görev**: Deadline'ı bugün olan ve tamamlanmamış görev
- **Performans Özeti**: Son 7 günlük not ve görev istatistikleri
- **Zaman Çizelgesi**: Son aktivitelerin kronolojik listesi (notlar, görevler, analizler)
- **Sentiment**: Notun duygu durumu (positive, negative, neutral)
- **Owner**: Organizasyon sahibi, tüm verilere erişimi olan kullanıcı
- **Manager**: Yönetici, izinlerine göre verilere erişen kullanıcı
- **Employee**: Çalışan, sadece kendi verilerine erişen kullanıcı

## Requirements

### Requirement 1: Tamamlanmamış Görevler Bölümü

**User Story:** Owner veya Manager olarak, tamamlanmamış görevleri görmek istiyorum, böylece hangi görevlerin acil olduğunu anlayabilirim.

#### Acceptance Criteria

1. WHEN kullanıcı dashboard'a eriştiğinde, THE sistem SHALL "Tamamlanmamış Görevler" başlıklı bir kart gösterecek
2. THE kart SHALL iki sekme içerecek: "Bugün Biten" ve "Gecikmiş"
3. WHEN kullanıcı "Bugün Biten" sekmesine tıkladığında, THE sistem SHALL deadline'ı bugün olan ve tamamlanmamış görevleri listeleyecek
4. WHEN kullanıcı "Gecikmiş" sekmesine tıkladığında, THE sistem SHALL deadline'ı bugünden önce olan ve tamamlanmamış görevleri listeleyecek
5. THE her görev kartı SHALL görev açıklaması, personel adı, deadline tarihi ve yıldız puanı (varsa) bilgilerini gösterecek
6. WHEN kullanıcı bir görev kartına tıkladığında, THE sistem SHALL görev detay sayfasına yönlendirecek
7. IF hiç tamamlanmamış görev yoksa, THEN THE sistem SHALL "Tüm görevler tamamlandı! 🎉" mesajı gösterecek
8. THE sistem SHALL sadece kullanıcının izinleri dahilindeki görevleri gösterecek

### Requirement 2: Performans Özeti Bölümü

**User Story:** Owner veya Manager olarak, son 7 günlük performans istatistiklerini görmek istiyorum, böylece ekip performansını takip edebilirim.

#### Acceptance Criteria

1. WHEN kullanıcı dashboard'a eriştiğinde, THE sistem SHALL "Performans Özeti (Son 7 Gün)" başlıklı bir kart gösterecek
2. THE kart SHALL dört istatistik kartı içerecek: "Eklenen Notlar", "Tamamlanan Görevler", "Olumlu/Olumsuz Oran", "Ortalama Görev Puanı"
3. THE "Eklenen Notlar" kartı SHALL son 7 günde eklenen toplam not sayısını gösterecek
4. THE "Tamamlanan Görevler" kartı SHALL son 7 günde tamamlanan toplam görev sayısını gösterecek
5. THE "Olumlu/Olumsuz Oran" kartı SHALL olumlu notların toplam notlara oranını yüzde olarak gösterecek
6. THE "Ortalama Görev Puanı" kartı SHALL tamamlanan görevlerin ortalama yıldız puanını gösterecek
7. THE her istatistik kartı SHALL bir emoji ikonu ve sayısal değer içerecek
8. THE sistem SHALL sadece kullanıcının izinleri dahilindeki verileri hesaplayacak
9. IF bir istatistik için veri yoksa, THEN THE sistem SHALL "0" veya "Veri yok" gösterecek

### Requirement 3: Zaman Çizelgesi Bölümü

**User Story:** Owner veya Manager olarak, son aktiviteleri görmek istiyorum, böylece sistemde neler olduğunu takip edebilirim.

#### Acceptance Criteria

1. WHEN kullanıcı dashboard'a eriştiğinde, THE sistem SHALL "Son Hareketler" başlıklı bir kart gösterecek
2. THE kart SHALL son 10 aktiviteyi kronolojik sırada (en yeni üstte) listeleyecek
3. THE her aktivite SHALL aktivite tipi (not, görev, analiz), personel adı, tarih ve kısa açıklama içerecek
4. THE not aktiviteleri SHALL "📝 [Personel Adı]'na not eklendi" formatında gösterilecek
5. THE görev aktiviteleri SHALL "✅ [Personel Adı] için görev tamamlandı" formatında gösterilecek
6. THE analiz aktiviteleri SHALL "🤖 [Personel Adı] için [Analiz Tipi] analizi oluşturuldu" formatında gösterilecek
7. WHEN kullanıcı bir aktiviteye tıkladığında, THE sistem SHALL ilgili detay sayfasına yönlendirecek
8. THE tarih bilgisi SHALL göreceli zaman formatında gösterilecek (örn: "5 dakika önce", "2 saat önce", "dün")
9. THE sistem SHALL sadece kullanıcının izinleri dahilindeki aktiviteleri gösterecek
10. IF hiç aktivite yoksa, THEN THE sistem SHALL "Henüz aktivite yok" mesajı gösterecek

### Requirement 4: Responsive Tasarım

**User Story:** Kullanıcı olarak, dashboard'u mobil cihazımda da rahatça görmek istiyorum.

#### Acceptance Criteria

1. THE dashboard SHALL mobil, tablet ve desktop cihazlarda düzgün görünecek
2. WHEN ekran genişliği 768px'den küçük olduğunda, THE kartlar SHALL tek sütunda dikey olarak sıralanacak
3. WHEN ekran genişliği 768px'den büyük olduğunda, THE kartlar SHALL grid layout ile düzenlenecek
4. THE tüm kartlar SHALL touch-friendly olacak (minimum 44x44px dokunma alanı)
5. THE metin boyutları SHALL mobilde okunabilir olacak

### Requirement 5: Yükleme ve Hata Durumları

**User Story:** Kullanıcı olarak, veriler yüklenirken ve hata oluştuğunda bilgilendirilmek istiyorum.

#### Acceptance Criteria

1. WHEN dashboard verileri yüklenirken, THE sistem SHALL her kart için loading skeleton gösterecek
2. IF bir veri yükleme hatası oluşursa, THEN THE sistem SHALL kullanıcıya anlaşılır bir hata mesajı gösterecek
3. THE hata mesajı SHALL "Tekrar Dene" butonu içerecek
4. WHEN kullanıcı "Tekrar Dene" butonuna tıkladığında, THE sistem SHALL veriyi yeniden yüklemeyi deneyecek
5. THE sistem SHALL ağ hatalarını ve sunucu hatalarını farklı mesajlarla gösterecek

### Requirement 6: Real-time Güncellemeler

**User Story:** Kullanıcı olarak, yeni bir aktivite eklendiğinde dashboard'un otomatik güncellenmesini istiyorum.

#### Acceptance Criteria

1. WHEN yeni bir not eklendiğinde, THE sistem SHALL zaman çizelgesini otomatik güncelleyecek
2. WHEN yeni bir görev tamamlandığında, THE sistem SHALL performans özetini ve zaman çizelgesini otomatik güncelleyecek
3. WHEN yeni bir analiz oluşturulduğunda, THE sistem SHALL zaman çizelgesini otomatik güncelleyecek
4. THE güncellemeler SHALL Supabase real-time subscriptions kullanarak yapılacak
5. THE sistem SHALL component unmount olduğunda subscription'ları temizleyecek

### Requirement 7: İzin Kontrolü

**User Story:** Sistem yöneticisi olarak, kullanıcıların sadece yetkili oldukları verileri görmelerini istiyorum.

#### Acceptance Criteria

1. THE Owner SHALL organizasyondaki tüm verileri görecek
2. THE Manager SHALL sadece izinleri dahilindeki verileri görecek
3. THE Employee SHALL sadece kendi verilerini görecek
4. THE sistem SHALL her veri çekme işleminde RLS (Row Level Security) policy'lerini uygulayacak
5. IF kullanıcının dashboard'a erişim izni yoksa, THEN THE sistem SHALL 403 hatası ile yönlendirecek
