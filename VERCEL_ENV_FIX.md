# Vercel Environment Variables Düzeltme

## 🔴 Sorun

Supabase anon key'inde satır sonu karakteri (`%0A`) var. Bu WebSocket bağlantısını engelliyor.

## ✅ Çözüm

### 1️⃣ Vercel Dashboard'a Gidin

https://vercel.com/dashboard → **eksen-ai** → **Settings** → **Environment Variables**

### 2️⃣ NEXT_PUBLIC_SUPABASE_ANON_KEY'i Düzeltin

**Mevcut değeri silin ve yeniden ekleyin:**

1. `NEXT_PUBLIC_SUPABASE_ANON_KEY` satırını bulun
2. **Edit** (düzenle) butonuna tıklayın
3. Value'yu **tek satırda** olduğundan emin olun (satır sonu olmamalı)
4. **Save**

**Doğru format:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2F5dGhiem5nc3pqZnltdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDkzMzUsImV4cCI6MjA3NzIyNTMzNX0.DFDIuWmZhj5miXCmMQP1EEOAAoMQ3XKTjaT7MPrDsFA
```

**Yanlış format (satır sonu var):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2F5dGhiem5nc3pqZnltdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDkzMzUsImV4cCI6MjA3NzIyNTMzNX0.DFDIuWmZhj5miXCmMQP1EEOAAoMQ3XKTjaT7MPrDsFA
↵ (satır sonu - bu olmamalı!)
```

### 3️⃣ Redeploy

1. **Deployments** sekmesi
2. En son deployment → **⋯** → **Redeploy**

---

## 🎯 Özet

1. ✅ Supabase anon key'i tek satırda olmalı
2. ✅ Satır sonu karakteri olmamalı
3. ✅ Redeploy yapılmalı
4. ✅ OneSignal için cache temizlenmeli

Deploy tamamlandıktan sonra test edin!
