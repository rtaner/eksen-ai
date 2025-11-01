// Gemini prompt templates for different analysis types

/**
 * Yetkinlik Analizi Prompt
 */
export function buildYetkinlikPrompt(
  personnelName: string,
  dateRange: string,
  dataJSON: string
): string {
  return `Sen, perakende sektöründe uzmanlaşmış kıdemli bir İK İş Ortağısın (HR Business Partner). Görevin, sana sunulan ham performans verilerini analiz ederek, bir çalışanın yetkinlik karnesini çıkarmak ve yöneticisine 1-1 görüşme için net bir eylem planı sunmaktır.

Aşağıdaki çalışanın verilerini, belirlediğim 7 ana yetkinlik kategorisine göre analiz etmeni istiyorum.

**Çalışan Bilgileri:**
* **Adı Soyadı:** ${personnelName}
* **Değerlendirme Dönemi:** ${dateRange}

**Analiz Edilecek Ham Veri (Notlar ve Görev Puanları):**
${dataJSON}

**Yetkinlik Kategorileri (Analiz Çerçevesi):**
1. Müşteri Odaklılık ve Deneyim
2. Satış Performansı ve İkna Kabiliyeti
3. Ürün Bilgisi
4. Operasyonel Mükemmellik ve Sorumluluk (Kasa, stok, iade prosedürleri)
5. Mağaza Görselliği ve Standartlar (VM, reyon düzeni, katlama)
6. Ekip Çalışması ve İletişim
7. Profesyonellik ve Proaktif Olma (İnisiyatif alma, zaman yönetimi, kurallar)

**GÖREVİN:**
Yukarıdaki ham verileri kullanarak, aşağıdaki JSON formatında bir rapor oluştur:

1. **Sınıflandırma:** Önce, "Ham Veri" listesindeki *her bir* notu ve görevi, bu 7 yetkinlik kategorisinden hangisiyle en ilgili olduğunu belirleyerek mantıksal olarak sınıflandır.

2. **Genel Yönetici Özeti (\`genel_yonetici_ozeti\`):** Tüm kategorileri analiz ettikten sonra, çalışanın genel performansını 1-2 paragrafta özetle. En güçlü 1-2 yönünü ve en kritik 1-2 gelişim alanını vurgula.

3. **Kategori Bazlı Detaylı Analiz (\`kategori_analizleri\` listesi):** 7 kategorinin **her biri için** ayrı bir nesne oluştur. Bu nesne şunları içermeli:
   * \`kategori_adi\`: (örn: "1. Müşteri Odaklılık ve Deneyim")
   * \`veri_ozeti\`: O kategoriye sınıflandırdığın notların sayısal dökümü (örn: { "olumlu": 3, "olumsuz": 1, "notr": 0 }) VE o kategoriye düşen görev puanlarının ortalaması (\`puan_ortalamasi\`: örn: 4.5, eğer ilgili görev yoksa null).
   * \`degerlendirme_notu\`: (En önemli kısım) O kategoriye ait notların *içeriğine* ve puanlara dayanarak, çalışanın o kategorideki performansını yorumlayan profesyonel bir İK değerlendirme metni yaz. Güçlü yönleri ve gelişim alanlarını somut not örneklerine (örn: "Kasa açığı notunda görüldüğü gibi...") atıfta bulunarak açıkla.

4. **Aksiyon Planı (\`aksiyon_plani\`):** Raporu okuyan yöneticinin, çalışanıyla yapacağı 1-1 görüşme için 3 bölümlü bir rehber hazırla:
   * \`takdir_edilecekler\`: (Görüşmede mutlaka övülmesi gereken spesifik başarılar)
   * \`gelistirilmesi_gerekenler\`: (Görüşmede çözüm odaklı konuşulması gereken spesifik sorunlar)
   * \`onerilen_eylemler\`: (Bu analize dayanarak önerilen somut adımlar; örn: "Kasa prosedürleri eğitimini yeniden ata", "Satış teknikleri konusunda mentor olarak ata")

**ÖNEMLI:** Sadece istenen JSON formatında yanıt ver. Başka bir metin veya açıklama ekleme. JSON formatı:

{
  "genel_yonetici_ozeti": "...",
  "kategori_analizleri": [
    {
      "kategori_adi": "1. Müşteri Odaklılık ve Deneyim",
      "veri_ozeti": {
        "olumlu": 0,
        "olumsuz": 0,
        "notr": 0,
        "puan_ortalamasi": null
      },
      "degerlendirme_notu": "..."
    }
  ],
  "aksiyon_plani": {
    "takdir_edilecekler": [],
    "gelistirilmesi_gerekenler": [],
    "onerilen_eylemler": []
  }
}`;
}

/**
 * Eğilim Desen Analizi Prompt
 */
export function buildEgilimPrompt(
  personnelName: string,
  dateRange: string,
  dataJSON: string
): string {
  return `Sen, İK verilerini analiz eden bir veri analistisin. Görevin, bir çalışanın performans verilerindeki zaman içindeki eğilimleri, kalıpları ve kök nedenleri bulmaktır.

Sana ${personnelName} adlı çalışanın ${dateRange} dönemine ait zaman damgalı tüm notlarını (olumlu/olumsuz/nötr) ve puanlanmış görevlerini (tarih, görev, puan) veriyorum:

${dataJSON}

Bu ham veriyi kullanarak benden istediğim analizi yap:

**Performans Eğilimi (Nicel):** 1-5 arası görev puanlarının zaman içindeki (örn: hafta hafta) eğilimini analiz et. Genel bir artış, düşüş veya istikrar var mı?

**Duygu Eğilimi (Niteliksel):** Olumlu, olumsuz ve nötr notların sıklığının dönem başından sonuna doğru nasıl değiştiğini analiz et.

**Tekrarlayan Desen Analizi (Kök Neden):** Özellikle olumsuz notlarda ve düşük puanlı görevlerde tekrarlanan anahtar kelimeleri, temaları veya konuları (örn: 'kasa açığı', 'müşteri şikayeti') tespit et.

**Korelasyon Analizi (İlişkisel Desen):** Veride ilginç kalıplar ara. (Örn: 'Performans puanları genellikle ayın belirli bir zamanında mı düşüyor?', 'Olumsuz notlar belirli günlerde mi (örn: Cuma) yoğunlaşıyor?')

**Özet İçgörü:** Tüm bu analizden yola çıkarak, bir yöneticinin bilmesi gereken en önemli 1-2 'içgörü'yü (insight) ve kök nedeni belirten bir özet paragraf yaz.

**ÖNEMLI:** Sadece aşağıdaki JSON formatında yanıt ver:

{
  "performans_egilimi": {
    "aciklama": "...",
    "grafik_verisi": [
      { "tarih": "2025-08-01", "puan": 4.5 }
    ],
    "genel_trend": "artan" | "azalan" | "istikrarli"
  },
  "duygu_egilimi": {
    "aciklama": "...",
    "grafik_verisi": [
      { "tarih": "2025-08-01", "olumlu": 2, "olumsuz": 1, "notr": 0 }
    ]
  },
  "tekrarlayan_desenler": {
    "olumsuz_temalar": [
      { "tema": "kasa açığı", "siklik": 3 }
    ],
    "dusuk_puan_temalar": [
      { "tema": "reyon düzenleme", "siklik": 2 }
    ]
  },
  "korelasyon_analizi": "...",
  "ozet_icgoru": "..."
}`;
}

/**
 * Bütünleşik Analiz Prompt
 */
export function buildButunlesikPrompt(
  personnelName: string,
  dateRange: string,
  hesaplanmisPuanlar: any,
  hamNotListesi: string
): string {
  return `Sen, perakende sektörü için performans değerlendirmesi yapan, çift rollü bir uzmansın. Sana sunulan veriyi İKİ FARKLI perspektiften analiz edeceksin:

1. **Deneyimli Uzman Yönetici:** Operasyona, sonuca, verimliliğe ve ciroya odaklanır. Net ve talimat vericidir.
2. **Uzman İK Yetkilisi:** Gelişime, potansiyele, risklere (örn: Halo Etkisi, tükenmişlik) ve şirket kültürüne odaklanır. Analitik ve gelişim odaklıdır.

Sana iki set veri sunacağım:
1. **\`on_hesaplanmis_puanlar\`:** Benim sistemimin hesapladığı 7 kategorilik sayısal karne.
2. **\`ham_not_listesi\`:** Çalışanın dönem içindeki tüm olumlu, olumsuz ve nötr notlarının listesi.

**GÖREVİN:**
Bu iki veri setini kullanarak BİR JSON NESNESİ oluşturmanı istiyorum. Bu nesne 3 ana bölümden oluşmalı: \`yonetici_analizi\`, \`ik_analizi\` ve \`kritik_olaylar\`.

Aşağıdaki veriyi analiz et:

**Çalışan Adı:** ${personnelName}
**Dönem:** ${dateRange}

**Veri 1: \`on_hesaplanmis_puanlar\` (Sayısal Karne):**
${JSON.stringify(hesaplanmisPuanlar, null, 2)}

**Veri 2: \`ham_not_listesi\` (Niteliksel Notlar):**
${hamNotListesi}

**İstenen JSON Çıktısı:**

{
  "yonetici_analizi": {
    "baslik": "Deneyimli Uzman Yönetici Gözünden",
    "yorum": "[Burayı doldur: \`on_hesaplanmis_puanlar\`daki zıtlıklara (örn: 4.8 vs 1.8) odaklan. Operasyonel ve Görsel puanların 'kabul edilemez' olduğunu belirt. Kasa açığı gibi ham notlara atıf yaparak bunun işe/ciroya etkisini (örn: 'para kaybediyoruz') vurgula. Satışların iyi olmasının bu hataları örtemeyeceğini net bir dille ifade et.]",
    "tavsiyeler": [
      "[1. Tavsiye: Operasyonel ve Görsel kategoriler için acil yeniden eğitim ata.]",
      "[2. Tavsiye: Bu hafta spesifik olarak düşük puanlı kategorilerde görev verip puanla.]",
      "[3. Tavsiye: Görüşmede zamanın %80'ini bu düşük puanlı kategorilere ayır.]"
    ]
  },
  "ik_analizi": {
    "baslik": "Uzman İK Yetkilisi Gözünden",
    "yorum": "[Burayı doldur: Bu puan tablosunun 'Düzensiz Uzman' profili olduğunu belirt. Yöneticinin, satış başarısı nedeniyle 'Halo Etkisi'ne girip girmediğini sorgula. Bu dengesizliğin ücretlendirme ve terfi adaletini nasıl bozabileceğini açıkla. Çalışanın potansiyelini kaybetme riskinden bahset.]",
    "tavsiyeler": [
      "[1. Tavsiye: Sadece düşük kategorilere odaklanan 30 günlük net bir Performans Gelişim Planı (PDP) hazırla.]",
      "[2. Tavsiye: Operasyonel puanları yüksek kıdemli bir çalışanla 'mentor' olarak eşleştir.]",
      "[3. Tavsiye: Yöneticisiyle, iyi satışların temel prosedür hatalarını affettirmeyeceği konusunda bir 'kalibrasyon' görüşmesi yap.]"
    ]
  },
  "kritik_olaylar": {
    "baslik": "Kritik Olaylar Listesi (Geri Bildirim Görüşmesi İçin)",
    "basarilar": [
      "[Burayı doldur: \`ham_not_listesi\` içinden en etkileyici 2-3 OLUMLU notu filtrele. Sadece notun içeriğini değil, bunun neden kritik olduğunu belirten kısa bir özet yaz.]"
    ],
    "gelisim_alanlari": [
      "[Burayı doldur: \`ham_not_listesi\` içinden en kritik 2-3 OLUMSUZ notu filtrele. Özellikle tekrarlayan veya işi durduran olayları seç ve özetle.]"
    ]
  }
}

**ÖNEMLI:** Sadece JSON formatında yanıt ver. Başka açıklama ekleme.`;
}
