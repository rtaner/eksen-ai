# Supabase Auth Yapılandırması

Vector PWA'nın çalışması için Supabase Auth ayarlarını yapılandırmanız gerekiyor.

## Adımlar

### 1. Supabase Dashboard'a Git
- https://supabase.com/dashboard adresine git
- Projenizi seçin (fnkaythbzngszjfymtgm)

### 2. Authentication Ayarlarını Aç
- Sol menüden **Authentication** → **Providers** seçin
- **Email** provider'ı bulun

### 3. Email Confirmation'ı Kapat
- Email provider ayarlarında:
  - **"Confirm email"** seçeneğini **KAPATIN** (disable)
  - **"Enable email provider"** seçeneğini **AÇIK** tutun
- **Save** butonuna tıklayın

### 4. Email Template'lerini Kontrol Et (Opsiyonel)
- **Authentication** → **Email Templates** bölümüne gidin
- Confirmation email template'ini devre dışı bırakabilirsiniz

## Neden Bu Gerekli?

Vector PWA'da gerçek email adresleri kullanmıyoruz. Kullanıcı adlarını `username@vector.app` formatına çeviriyoruz. Bu nedenle:
- Email confirmation çalışmaz (gerçek email yok)
- Kullanıcılar hemen giriş yapabilmeli
- Email confirmation kapalı olmalı

## Test

Ayarları yaptıktan sonra:
1. http://localhost:3000/register adresine git
2. Yeni bir kullanıcı kaydet
3. Hemen giriş yapabilmelisin

## Alternatif Çözüm

Eğer email confirmation'ı kapatmak istemiyorsanız:
- Gerçek email adresleri kullanın
- Veya Supabase'de custom SMTP ayarları yapın
- Ancak bu Vector PWA'nın tasarımına uygun değil
