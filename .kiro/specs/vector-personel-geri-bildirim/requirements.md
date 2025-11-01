# Requirements Document

## Introduction

Vector, yöneticilerin personelleri hakkında notlar almasını ve yapay zeka destekli geri bildirim taslakları oluşturmasını sağlayan mobil öncelikli bir Progresif Web Uygulaması (PWA)'dır. Sistem, Google Gemini AI kullanarak notları analiz eder ve yapılandırılmış geri bildirimler sunar.

## Glossary

- **System**: Vector PWA uygulaması
- **User**: Uygulamayı kullanan kullanıcı (Owner, Manager veya Personnel)
- **Owner**: Organizasyonun sahibi, tüm yetkilere sahip kullanıcı
- **Manager**: Organizasyon içinde personel ekleme, not ve görev oluşturma yetkisine sahip kullanıcı
- **Personnel**: Sisteme eklenen ve kendisine görev atanan çalışan
- **Organization**: Kullanıcıların ait olduğu kuruluş/şirket yapısı
- **Invite Code**: Bir organizasyona katılmak için kullanılan benzersiz davet kodu
- **Note**: Bir personel hakkında yönetici tarafından oluşturulan metin veya sesli kayıt
- **Task**: Bir personele atanan görev, opsiyonel termin tarihi ile
- **My Tasks**: Personelin kendisine atanan açık görevlerin listelendiği bölüm
- **Star Rating**: Görev tamamlandığında verilen 1-5 yıldız performans değerlendirmesi
- **Permission**: Bir rol için tanımlanan yetki (görüntüleme, ekleme, düzenleme, silme)
- **Permission Management**: Owner tarafından rollerin yetkilerinin yapılandırıldığı sistem
- **AI Analysis**: Google Gemini tarafından notlardan üretilen yapılandırılmış geri bildirim taslağı
- **Supabase**: Backend as a Service platformu (Auth, Database, Edge Functions)
- **Edge Function**: Supabase üzerinde çalışan serverless backend fonksiyonu
- **Real-time Subscription**: Veritabanı değişikliklerini anlık olarak dinleyen mekanizma

## Requirements

### Requirement 1: Kullanıcı Kaydı ve Organizasyon Oluşturma

**User Story:** As a new user, I want to register with minimal information and optionally create or join an organization, so that I can start using the system quickly.

#### Acceptance Criteria

1. THE System SHALL provide a registration form requesting name, surname, username, and password only
2. THE System SHALL provide an optional invite code field during registration
3. WHEN a User registers without an invite code, THE System SHALL automatically create a new Organization with that User as the owner
4. WHEN a User registers with a valid invite code, THE System SHALL add that User to the corresponding Organization
5. THE System SHALL validate that usernames are unique across the system

### Requirement 2: Kullanıcı Girişi

**User Story:** As a registered user, I want to securely log in to the system, so that I can access my organization's data.

#### Acceptance Criteria

1. THE System SHALL provide username and password authentication using Supabase Auth
2. WHEN a User successfully authenticates, THE System SHALL issue a JWT token managed by Supabase
3. WHEN an unauthenticated user attempts to access protected routes, THE System SHALL redirect them to the login page
4. THE System SHALL maintain the User's session across browser refreshes using secure token storage
5. THE System SHALL load the User's Organization context after successful authentication

### Requirement 3: Rol Sistemi

**User Story:** As the system, I need to enforce role-based permissions, so that users can only perform actions appropriate to their role.

#### Acceptance Criteria

1. THE System SHALL support three user roles: Owner, Manager, and Personnel
2. WHEN a User creates a new Organization, THE System SHALL assign them the Owner role
3. THE System SHALL enforce permissions based on role and organization-level permission settings
4. THE System SHALL allow the Owner to view all notes within the Organization
5. THE System SHALL prevent Managers and Personnel from viewing each other's notes unless explicitly permitted

### Requirement 4: Yetki Yönetimi

**User Story:** As an organization owner, I want to configure what each role can view, create, edit, and delete, so that I can customize access control for my organization.

#### Acceptance Criteria

1. THE System SHALL provide a permission management page accessible only to the Owner
2. THE System SHALL allow the Owner to configure permissions for Manager and Personnel roles across different resource types (notes, tasks, personnel)
3. THE System SHALL support four permission types: view, create, edit, and delete for each resource type
4. WHEN permissions are updated, THE System SHALL immediately enforce the new permission rules across the application
5. THE System SHALL maintain default permission settings where Owner has all permissions, Manager has limited permissions, and Personnel has minimal permissions
6. THE System SHALL store permission configurations in the database linked to the Organization

### Requirement 5: Organizasyon Yönetimi

**User Story:** As an organization owner, I want to manage my organization settings and invite code, so that I can control who joins my team.

#### Acceptance Criteria

1. WHEN an Organization is created, THE System SHALL generate a unique invite code for that Organization
2. THE System SHALL provide an organization settings page accessible only to the Owner
3. THE System SHALL allow the Owner to edit the Organization name
4. THE System SHALL allow the Owner to customize the invite code to a unique value not used by other Organizations
5. THE System SHALL display the current invite code for the Owner to share with team members
6. THE System SHALL allow the Owner to assign Manager role to other users in the Organization

### Requirement 6: Personel Yönetimi

**User Story:** As a manager, I want to add and manage personnel records, so that I can organize notes and tasks by individual team members.

#### Acceptance Criteria

1. WHEN a Manager or Owner is authenticated, THE System SHALL display a list of all personnel within that Organization
2. THE System SHALL allow Manager and Owner roles to create a new personnel record with name and optional metadata
3. THE System SHALL store each personnel record with a unique identifier linked to the Organization
4. THE System SHALL allow Manager and Owner roles to view detailed information for a selected personnel
5. THE System SHALL allow Manager and Owner roles to edit or delete existing personnel records

### Requirement 7: Not Oluşturma (Metin)

**User Story:** As a manager, I want to create text notes about personnel, so that I can document observations and feedback points.

#### Acceptance Criteria

1. WHEN a User with note creation permission views a personnel detail page, THE System SHALL provide a text input interface for creating notes
2. THE System SHALL save the note to the Supabase database with a timestamp, author_id, and link to the personnel_id
3. THE System SHALL display notes based on the User's view permission (Owner sees all, others see only their own unless configured otherwise)
4. THE System SHALL display all visible notes and completed tasks for the selected personnel in chronological order
5. THE System SHALL allow Users with edit permission to modify their own notes
6. THE System SHALL allow Users with delete permission to remove their own notes with a confirmation prompt
7. THE System SHALL allow Owner to view, edit, and delete all notes regardless of author

### Requirement 8: Not Oluşturma (Sesli Dikte)

**User Story:** As a manager, I want to create notes using voice dictation, so that I can quickly capture observations without typing.

#### Acceptance Criteria

1. WHEN a Manager or Owner is on the note creation interface, THE System SHALL provide a voice recording button
2. WHEN the Manager activates voice recording, THE System SHALL use the browser's Web Speech API or similar to capture audio
3. THE System SHALL convert the voice input to text in real-time or after recording completion
4. THE System SHALL save the transcribed text as a note linked to the personnel_id
5. IF voice recognition fails, THEN THE System SHALL display an error message and allow the Manager to retry or switch to text input

### Requirement 9: Görev Oluşturma ve Yönetimi

**User Story:** As a manager, I want to create and assign tasks to personnel with optional deadlines, so that I can track work assignments.

#### Acceptance Criteria

1. WHEN a User with task creation permission views a personnel detail page, THE System SHALL provide a task creation interface
2. THE System SHALL allow the User to enter a task description and optional deadline date
3. WHEN no deadline is specified, THE System SHALL set the deadline to the current date
4. THE System SHALL save the task to the database linked to the personnel_id with status "open"
5. THE System SHALL allow Users with edit permission to modify task descriptions and deadlines before completion
6. THE System SHALL display all tasks to all users within the Organization (tasks are always visible)

### Requirement 10: Personel Görev Görünümü (İşlerim)

**User Story:** As a personnel member, I want to see my assigned open tasks, so that I know what work I need to complete.

#### Acceptance Criteria

1. WHEN a Personnel user logs in, THE System SHALL display a "My Tasks" (İşlerim) section
2. THE System SHALL list all open tasks assigned to that Personnel with descriptions and deadlines
3. THE System SHALL sort tasks by deadline with overdue tasks highlighted
4. THE System SHALL update the My Tasks list in real-time when new tasks are assigned
5. WHEN a task is closed, THE System SHALL remove it from the My Tasks list

### Requirement 11: Görev Tamamlama ve Değerlendirme

**User Story:** As a manager, I want to close completed tasks with a performance rating, so that I can track personnel performance over time.

#### Acceptance Criteria

1. THE System SHALL allow Users with task close permission to close tasks
2. WHEN closing a task, THE System SHALL require a star rating between 1 and 5 stars
3. THE System SHALL save the completion timestamp and star rating with the task
4. THE System SHALL change the task status from "open" to "closed"
5. THE System SHALL display closed tasks with their ratings in the personnel detail page chronologically with notes

### Requirement 12: Real-time Not ve Görev Güncellemeleri

**User Story:** As a user, I want to see new notes and tasks appear automatically on all my devices, so that I have consistent information across platforms.

#### Acceptance Criteria

1. WHEN a User has a personnel detail page open, THE System SHALL establish Supabase Real-time subscriptions to both notes and tasks tables
2. WHEN a new note or task is added for that personnel from any device, THE System SHALL automatically update the display without page refresh
3. WHEN a note or task is edited, deleted, or closed, THE System SHALL reflect the change in real-time on all subscribed clients
4. WHEN a Personnel user has the My Tasks page open, THE System SHALL update the task list in real-time as tasks are assigned or closed
5. WHEN the User navigates away from the page, THE System SHALL cleanly unsubscribe from the real-time channels

### Requirement 13: AI Analiz Tetikleme

**User Story:** As a manager, I want to request an AI analysis of a personnel's notes and tasks, so that I can receive structured feedback suggestions.

#### Acceptance Criteria

1. WHEN a Manager or Owner views a personnel detail page with at least one note or completed task, THE System SHALL display an "Analyze" button
2. WHEN the Manager clicks the Analyze button, THE System SHALL invoke a Supabase Edge Function with the personnel_id
3. THE System SHALL display a loading indicator while the analysis is in progress
4. THE System SHALL not allow direct API calls to Google Gemini from the frontend
5. WHEN the analysis completes, THE System SHALL display the results to the Manager

### Requirement 14: AI Analiz İşleme (Backend)

**User Story:** As the system, I need to securely process AI analysis requests, so that API keys remain protected and analyses are accurate.

#### Acceptance Criteria

1. WHEN an Edge Function receives an analysis request with personnel_id, THE System SHALL retrieve all notes and completed tasks with ratings for that personnel from the database
2. THE System SHALL format the notes and task performance data into a structured prompt for Google Gemini API
3. THE System SHALL call the Gemini API using an API key stored in Supabase Secrets
4. WHEN Gemini returns an analysis, THE System SHALL save the result to the ai_analyses table linked to personnel_id
5. THE System SHALL return the analysis result as JSON to the frontend

### Requirement 15: AI Analiz Görüntüleme

**User Story:** As a manager, I want to view AI-generated analyses for personnel, so that I can use them to prepare performance feedback.

#### Acceptance Criteria

1. WHEN an AI analysis exists for a personnel, THE System SHALL display it on the personnel detail page
2. THE System SHALL structure the analysis display to show strengths (güçlü yönler) and development areas (gelişim alanları) separately
3. THE System SHALL display the timestamp of when the analysis was generated
4. THE System SHALL allow Manager and Owner roles to request a new analysis to refresh the feedback
5. THE System SHALL maintain a history of previous analyses for reference

### Requirement 16: Mobil Öncelikli Arayüz

**User Story:** As a manager, I want the application to work seamlessly on my mobile device, so that I can take notes and review feedback on the go.

#### Acceptance Criteria

1. THE System SHALL implement a responsive design using Tailwind CSS with mobile-first breakpoints
2. WHEN accessed on a mobile device, THE System SHALL display touch-optimized UI elements with appropriate sizing
3. THE System SHALL ensure all interactive elements have minimum touch target sizes of 44x44 pixels
4. THE System SHALL adapt layouts for tablet and desktop screens while maintaining mobile functionality
5. THE System SHALL load and perform efficiently on mobile networks with optimized asset delivery

### Requirement 17: Progressive Web App (PWA)

**User Story:** As a manager, I want to install the application on my device home screen, so that I can access it like a native app.

#### Acceptance Criteria

1. THE System SHALL include a valid manifest.json file with app metadata, icons, and display settings
2. THE System SHALL implement a Service Worker for offline capability and caching strategies
3. WHEN a Manager visits the app on a compatible browser, THE System SHALL prompt for installation to home screen
4. WHEN installed, THE System SHALL launch in standalone mode without browser UI
5. THE System SHALL cache critical assets for offline access to previously viewed content

### Requirement 18: Veritabanı Yapısı

**User Story:** As the system, I need a well-structured database schema, so that data relationships are maintained and queries are efficient.

#### Acceptance Criteria

1. THE System SHALL maintain an organizations table with name and unique invite_code fields
2. THE System SHALL maintain a profiles table linked to Supabase auth.users with organization_id and role (owner/manager/personnel) fields
3. THE System SHALL maintain a permissions table with organization_id, role, resource_type, and permission flags (can_view, can_create, can_edit, can_delete)
4. THE System SHALL maintain a personnel table with organization_id foreign key
5. THE System SHALL maintain a notes table with personnel_id, author_id foreign keys and timestamp fields
6. THE System SHALL maintain a tasks table with personnel_id, description, deadline, status (open/closed), star_rating, and completion_timestamp fields
7. THE System SHALL maintain an ai_analyses table with personnel_id foreign key and analysis content
8. THE System SHALL enforce Row Level Security (RLS) policies ensuring Users can only access data within their Organization and according to their permissions

### Requirement 19: Dosya Boyutu Yönetimi

**User Story:** As a developer, I want to maintain code files under 600 lines, so that the codebase remains maintainable and readable.

#### Acceptance Criteria

1. THE System SHALL be structured with modular components where no single file exceeds 600 lines of code
2. WHEN a file approaches the 600-line limit, THE System SHALL be refactored into smaller, focused modules
3. THE System SHALL use component composition and utility functions to distribute logic across files
4. THE System SHALL maintain clear separation of concerns between UI, business logic, and data access layers
5. THE System SHALL document any exceptions where file size limits cannot be met with justification

