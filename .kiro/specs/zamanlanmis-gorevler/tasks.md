# Zamanlanmış Görevler - Implementation Plan

- [x] 1. Database schema ve migrations


- [x] 1.1 Create scheduled_tasks table migration


  - scheduled_tasks tablosunu oluştur
  - Gerekli indexleri ekle
  - _Requirements: 1.1, 2.1-2.10, 9.1-9.5_

- [x] 1.2 Create scheduled_task_leave_dates table migration


  - scheduled_task_leave_dates tablosunu oluştur
  - Foreign key constraints ekle
  - Unique constraint ekle
  - _Requirements: 3.1-3.7_

- [x] 1.3 Create scheduled_task_skip_dates table migration


  - scheduled_task_skip_dates tablosunu oluştur
  - Foreign key constraints ekle
  - Unique constraint ekle
  - _Requirements: 4.1-4.5_

- [x] 1.4 Add scheduled_task_id column to tasks table


  - tasks tablosuna scheduled_task_id kolonu ekle
  - Index oluştur
  - _Requirements: 6.8_

- [x] 1.5 Create RLS policies for scheduled_tasks


  - SELECT, INSERT, UPDATE, DELETE policy'leri oluştur
  - Permission kontrollerini ekle
  - _Requirements: 10.1-10.5_

- [x] 1.6 Create RLS policies for leave_dates and skip_dates


  - İlgili tablolar için RLS policy'leri oluştur
  - _Requirements: 10.1-10.5_

- [x] 2. TypeScript types ve interfaces

- [x] 2.1 Create scheduled tasks types


  - ScheduledTask, RecurrenceConfig, AssignmentConfig tiplerini oluştur
  - LeaveDate ve SkipDate tiplerini oluştur
  - lib/types/scheduled-tasks.ts dosyası oluştur
  - _Requirements: 2.1-2.10_

- [x] 3. Custom hooks


- [x] 3.1 Implement useScheduledTasks hook


  - CRUD operasyonları implement et
  - Real-time subscriptions ekle
  - Error handling ekle
  - lib/hooks/useScheduledTasks.ts dosyası oluştur
  - _Requirements: 1.1-1.5, 8.1-8.6, 9.1-9.5_

- [x] 3.2 Implement useLeaveDates hook


  - Leave date ekleme/silme fonksiyonları
  - lib/hooks/useLeaveDates.ts dosyası oluştur
  - _Requirements: 3.1-3.7_

- [x] 3.3 Implement useSkipDates hook


  - Skip date ekleme/silme fonksiyonları
  - lib/hooks/useSkipDates.ts dosyası oluştur
  - _Requirements: 4.1-4.5_

- [x] 4. UI Components - Temel yapı
- [x] 4.1 Create ScheduledTasksPage


  - Ana sayfa component'i oluştur
  - Permission kontrolü ekle
  - Mobile-responsive layout
  - app/(dashboard)/settings/scheduled-tasks/page.tsx
  - _Requirements: 1.1-1.5, 7.1-7.5, 10.1-10.5_


- [x] 4.2 Create ScheduledTasksList component

  - Liste component'i oluştur
  - Card-based layout
  - Loading ve empty states
  - components/scheduled-tasks/ScheduledTasksList.tsx
  - _Requirements: 1.5, 7.1-7.5_


- [x] 4.3 Create ScheduledTaskCard component



  - Kart component'i oluştur
  - Touch-friendly (min 44x44px)
  - Quick actions (edit, delete, toggle)
  - Swipe actions for mobile
  - components/scheduled-tasks/ScheduledTaskCard.tsx
  - _Requirements: 7.1-7.5, 8.1-8.6, 9.1-9.5_

- [x] 5. UI Components - Modal ve formlar

- [x] 5.1 Create ScheduledTaskModal component
  - Create/Edit modal oluştur
  - Bottom sheet on mobile
  - Form validation
  - components/scheduled-tasks/ScheduledTaskModal.tsx
  - _Requirements: 2.1-2.10, 7.2-7.5, 8.1-8.6_

- [x] 5.2 Create RecurrenceSelector component

  - Recurrence type selector
  - Day/date pickers
  - Time picker
  - Visual preview
  - components/scheduled-tasks/RecurrenceSelector.tsx
  - _Requirements: 2.3-2.6_


- [x] 5.3 Create AssignmentSelector component
  - Assignment type toggle
  - Personnel multi-select
  - Role dropdown
  - Visual chips
  - components/scheduled-tasks/AssignmentSelector.tsx
  - _Requirements: 2.7-2.9_


- [x] 5.4 Create AdvancedSettings component
  - Expandable section
  - Leave date management
  - Skip date management
  - components/scheduled-tasks/AdvancedSettings.tsx
  - _Requirements: 3.1-3.7, 4.1-4.5_


- [x] 5.5 Create LeaveDateManager component
  - Add/remove leave dates
  - Date picker
  - Delegate selector
  - List view
  - components/scheduled-tasks/LeaveDateManager.tsx
  - _Requirements: 3.1-3.7_

- [x] 6. UI Components - Toplu işlemler


- [x] 6.1 Create BulkActionsBar component

  - Pause all / Activate all buttons
  - Transfer tasks functionality
  - Confirmation dialogs
  - components/scheduled-tasks/BulkActionsBar.tsx
  - _Requirements: 5.1-5.6_

- [x] 7. Edge Function - Otomatik görev oluşturma
- [x] 7.1 Create create-scheduled-task-instances Edge Function


  - Temel yapı oluştur
  - Active scheduled tasks fetch et
  - supabase/functions/create-scheduled-task-instances/index.ts
  - _Requirements: 6.1-6.2_


- [x] 7.2 Implement recurrence logic
  - shouldRunToday fonksiyonu
  - Daily, weekly, monthly kontrolü
  - _Requirements: 6.2_


- [x] 7.3 Implement exception handling
  - Skip date kontrolü
  - Leave date kontrolü
  - Delegate assignment
  - _Requirements: 6.3-6.6_


- [x] 7.4 Implement task instance creation
  - Task oluşturma
  - Notification gönderme
  - Error handling ve logging
  - _Requirements: 6.7-6.10_

- [x] 8. Cron job kurulumu
- [x] 8.1 Add cron job to cron-setup.sql


  - Daily 00:00 UTC cron job ekle
  - Edge Function'ı çağır
  - supabase/cron-setup.sql güncelle
  - _Requirements: 6.1_

- [x] 8.2 Deploy Edge Function

  - Edge Function'ı deploy et
  - Test et
  - _Requirements: 6.1-6.10_



- [x] 8.3 Configure and test cron job
  - Cron job'ı Supabase Dashboard'dan kur
  - Manuel test yap
  - Log'ları kontrol et
  - _Requirements: 6.1-6.10_

- [x] 9. Permissions ekleme

- [x] 9.1 Add scheduled_tasks permissions to default_permissions


  - scheduled_tasks view, create, edit, delete permissions ekle
  - Migration oluştur veya manuel ekle
  - _Requirements: 10.1-10.5_

- [x] 10. Settings sayfasına menü ekleme



- [x] 10.1 Add "Zamanlanmış Görevler" to settings navigation

  - Settings sayfasına link ekle
  - Icon ekle
  - Permission kontrolü
  - _Requirements: 1.1-1.2_

- [x] 11. Mobile optimizations

- [x] 11.1 Implement swipe actions for mobile

  - Swipe-to-reveal actions
  - Visual feedback
  - _Requirements: 7.5_


- [x] 11.2 Implement bottom sheet modal for mobile



  - Bottom sheet behavior
  - Swipe-to-dismiss
  - _Requirements: 7.2_


- [x] 11.3 Optimize touch targets
  - Ensure min 44x44px
  - Adequate spacing
  - _Requirements: 7.1_

- [x] 12. Testing ve polish

- [ ]* 12.1 Test scheduled task CRUD operations
  - Create, read, update, delete test et
  - Validation test et
  - _Requirements: 2.1-2.10, 8.1-8.6_


- [ ]* 12.2 Test leave date and skip date functionality
  - Leave date ekleme/silme
  - Skip date ekleme/silme
  - Delegate assignment
  - _Requirements: 3.1-3.7, 4.1-4.5_


- [ ]* 12.3 Test bulk operations
  - Pause all / Activate all
  - Transfer tasks
  - _Requirements: 5.1-5.6_


- [ ]* 12.4 Test automatic task creation
  - Edge Function'ı manuel çalıştır
  - Farklı recurrence pattern'leri test et
  - Exception handling test et
  - _Requirements: 6.1-6.10_


- [ ]* 12.5 Test mobile experience
  - Swipe actions
  - Bottom sheet
  - Touch targets
  - Responsive layout
  - _Requirements: 7.1-7.5_


- [x] 12.6 Test permissions

  - Farklı roller ile test et
  - Permission kontrollerini doğrula
  - _Requirements: 10.1-10.5_
