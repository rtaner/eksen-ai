# Zamanlanmış Görevler - Requirements

## Introduction

Zamanlanmış Görevler sistemi, kullanıcıların tekrarlayan görevleri kolayca oluşturmasını, yönetmesini ve otomatik olarak atanmasını sağlar. Sistem mobil-first, hızlı ve pratik bir kullanıcı deneyimi sunar.

## Glossary

- **Scheduled Task (Zamanlanmış Görev)**: Belirli bir periyotta tekrarlayan görev şablonu
- **Task Instance (Görev Örneği)**: Zamanlanmış görevden oluşturulan gerçek görev
- **Recurrence (Tekrarlama)**: Görevin ne sıklıkla tekrarlanacağı
- **Delegation (Delegasyon)**: İzin günlerinde görevin başkasına atanması
- **Skip (Atlama)**: Belirli bir tarihte görevin oluşturulmaması
- **System**: Vector PWA uygulaması
- **User**: Owner veya Manager rolündeki kullanıcı
- **Personnel**: Görev atanabilecek personel

## Requirements

### Requirement 1: Zamanlanmış Görev Yönetimi

**User Story:** Owner veya Manager olarak, tekrarlayan görevleri merkezi bir yerden yönetebilmek istiyorum, böylece her seferinde manuel görev oluşturmak zorunda kalmayayım.

#### Acceptance Criteria

1. WHEN User navigates to Settings, THE System SHALL display "Zamanlanmış Görevler" menu item
2. WHEN User clicks "Zamanlanmış Görevler", THE System SHALL display list of all scheduled tasks for the organization
3. WHEN User has "scheduled_tasks" create permission, THE System SHALL display "Yeni Görev" button
4. WHEN User clicks "Yeni Görev", THE System SHALL open scheduled task creation modal
5. WHEN User views scheduled task list, THE System SHALL display task name, recurrence pattern, assigned personnel count, and active status

### Requirement 2: Zamanlanmış Görev Oluşturma

**User Story:** Owner veya Manager olarak, hızlı ve kolay bir şekilde zamanlanmış görev oluşturabilmek istiyorum, böylece mobil cihazdan bile rahatlıkla işlem yapabileyim.

#### Acceptance Criteria

1. WHEN User creates scheduled task, THE System SHALL require task name (max 200 characters)
2. WHEN User creates scheduled task, THE System SHALL require task description (max 1000 characters)
3. WHEN User creates scheduled task, THE System SHALL require recurrence type selection (daily, weekly, monthly)
4. WHEN recurrence type is "weekly", THE System SHALL require day of week selection (multiple selection allowed)
5. WHEN recurrence type is "monthly", THE System SHALL require day of month selection (1-31)
6. WHEN User creates scheduled task, THE System SHALL allow optional time selection (default: 09:00)
7. WHEN User creates scheduled task, THE System SHALL require assignment type selection (specific personnel or role-based)
8. WHEN assignment type is "specific", THE System SHALL allow multiple personnel selection
9. WHEN assignment type is "role", THE System SHALL allow role selection (owner, manager, personnel)
10. WHEN User saves scheduled task, THE System SHALL validate all required fields and display error messages for invalid inputs

### Requirement 3: Detaylı Ayarlar

**User Story:** Owner veya Manager olarak, zamanlanmış görevler için izin günü ve delegasyon ayarları yapabilmek istiyorum, böylece personel izinliyken görevler aksamamış olsun.

#### Acceptance Criteria

1. WHEN User creates or edits scheduled task, THE System SHALL display "Detaylı Ayarlar" expandable section
2. WHEN User opens "Detaylı Ayarlar", THE System SHALL display "İzin Günü Ekle" button
3. WHEN User clicks "İzin Günü Ekle", THE System SHALL allow date selection and delegate personnel selection
4. WHEN User adds leave date, THE System SHALL display leave date and delegate personnel in a list
5. WHEN User adds leave date without delegate, THE System SHALL skip task creation for that date
6. WHEN User adds leave date with delegate, THE System SHALL create task for delegate personnel on that date
7. WHEN User views leave dates, THE System SHALL allow deletion of leave date entries

### Requirement 4: Görev Atlama

**User Story:** Owner veya Manager olarak, belirli tarihlerde zamanlanmış görevin oluşturulmamasını sağlayabilmek istiyorum, böylece tatil günlerinde veya özel durumlarda görev atanmasın.

#### Acceptance Criteria

1. WHEN User views scheduled task details, THE System SHALL display "Bu Haftayı Atla" button for weekly tasks
2. WHEN User views scheduled task details, THE System SHALL display "Bu Ayı Atla" button for monthly tasks
3. WHEN User clicks skip button, THE System SHALL mark next occurrence as skipped
4. WHEN User views skipped occurrences, THE System SHALL display list of skipped dates
5. WHEN User views skipped dates, THE System SHALL allow removal of skip entry

### Requirement 5: Toplu Yönetim

**User Story:** Owner veya Manager olarak, zamanlanmış görevleri toplu olarak yönetebilmek istiyorum, böylece hızlı değişiklikler yapabileyim.

#### Acceptance Criteria

1. WHEN User views scheduled task list, THE System SHALL display "Tümünü Duraklat" button
2. WHEN User clicks "Tümünü Duraklat", THE System SHALL deactivate all scheduled tasks
3. WHEN User views scheduled task list, THE System SHALL display "Tümünü Aktifleştir" button when tasks are paused
4. WHEN User selects specific personnel, THE System SHALL display "Görevleri Aktar" button
5. WHEN User clicks "Görevleri Aktar", THE System SHALL allow selection of target personnel
6. WHEN User confirms transfer, THE System SHALL update all scheduled tasks assigned to source personnel to target personnel

### Requirement 6: Otomatik Görev Oluşturma

**User Story:** Sistem olarak, zamanlanmış görevlerden otomatik olarak gerçek görevler oluşturabilmek istiyorum, böylece kullanıcılar manuel işlem yapmak zorunda kalmasın.

#### Acceptance Criteria

1. WHEN System runs daily cron job at 00:00, THE System SHALL fetch all active scheduled tasks
2. WHEN System processes scheduled task, THE System SHALL check if task should be created for current date based on recurrence pattern
3. WHEN date matches recurrence pattern, THE System SHALL check for leave dates
4. WHEN leave date exists with delegate, THE System SHALL create task for delegate personnel
5. WHEN leave date exists without delegate, THE System SHALL skip task creation
6. WHEN skip entry exists for date, THE System SHALL skip task creation
7. WHEN no exceptions exist, THE System SHALL create task instance in tasks table
8. WHEN task instance is created, THE System SHALL set scheduled_task_id reference
9. WHEN task instance is created, THE System SHALL send notification to assigned personnel
10. WHEN System completes cron job, THE System SHALL log success count and error count

### Requirement 7: Mobil-First UI

**User Story:** Owner veya Manager olarak, mobil cihazdan zamanlanmış görevleri kolayca yönetebilmek istiyorum, böylece her yerden işlem yapabileyim.

#### Acceptance Criteria

1. WHEN User views scheduled tasks on mobile, THE System SHALL display touch-friendly buttons (min 44x44px)
2. WHEN User creates scheduled task on mobile, THE System SHALL use bottom sheet modal
3. WHEN User selects multiple items on mobile, THE System SHALL use native-like selection UI
4. WHEN User views scheduled task list on mobile, THE System SHALL display compact card layout
5. WHEN User swipes scheduled task card on mobile, THE System SHALL reveal quick actions (edit, delete, pause)

### Requirement 8: Düzenleme ve Silme

**User Story:** Owner veya Manager olarak, zamanlanmış görevleri düzenleyebilmek ve silebilmek istiyorum, böylece değişen ihtiyaçlara göre güncelleyebileyim.

#### Acceptance Criteria

1. WHEN User clicks edit on scheduled task, THE System SHALL open edit modal with pre-filled data
2. WHEN User updates scheduled task, THE System SHALL validate all fields
3. WHEN User saves changes, THE System SHALL update scheduled task and display success message
4. WHEN User clicks delete on scheduled task, THE System SHALL display confirmation dialog
5. WHEN User confirms deletion, THE System SHALL delete scheduled task and all future task instances
6. WHEN User cancels deletion, THE System SHALL close dialog without changes

### Requirement 9: Aktif/Pasif Durum

**User Story:** Owner veya Manager olarak, zamanlanmış görevleri geçici olarak durdurup tekrar başlatabilmek istiyorum, böylece silmeden devre dışı bırakabileyim.

#### Acceptance Criteria

1. WHEN User views scheduled task, THE System SHALL display active/inactive toggle
2. WHEN User toggles to inactive, THE System SHALL stop creating new task instances
3. WHEN User toggles to active, THE System SHALL resume creating task instances
4. WHEN scheduled task is inactive, THE System SHALL display visual indicator (grayed out)
5. WHEN User filters scheduled tasks, THE System SHALL allow filtering by active/inactive status

### Requirement 10: İzinler

**User Story:** Sistem olarak, zamanlanmış görev yönetimini izinlere göre kısıtlayabilmek istiyorum, böylece sadece yetkili kullanıcılar işlem yapabilsin.

#### Acceptance Criteria

1. WHEN User has "scheduled_tasks" view permission, THE System SHALL display scheduled tasks list
2. WHEN User has "scheduled_tasks" create permission, THE System SHALL display create button
3. WHEN User has "scheduled_tasks" edit permission, THE System SHALL display edit button
4. WHEN User has "scheduled_tasks" delete permission, THE System SHALL display delete button
5. WHEN User lacks required permission, THE System SHALL hide corresponding action buttons
