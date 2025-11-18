# Requirements Document

## Introduction

Bu doküman, Vector PWA uygulamasında yaşanan "yükleniyor ekranları, çalışmayan butonlar, yüklenmeyen içerik" sorunlarını çözmek için gerekli authentication state yönetimi optimizasyonunu tanımlar. Mevcut durumda her component ayrı ayrı auth state yönetimi yaptığı için race condition, gereksiz network istekleri ve tutarsız state sorunları yaşanmaktadır. Bu sorunlar sayfayı yenileyince düzelmektedir, bu da state management problemi olduğunu göstermektedir.

## Glossary

- **AuthContext**: React Context API kullanılarak oluşturulan, tüm uygulama genelinde authentication state'ini paylaşan merkezi state yönetim sistemi
- **Supabase_Client**: Supabase backend servisleri ile iletişim kuran browser client instance
- **Profile**: Kullanıcının veritabanındaki profil bilgileri (role, name, surname, organization_id)
- **Organization**: Kullanıcının bağlı olduğu organizasyon bilgileri
- **Race_Condition**: Birden fazla asenkron işlemin sırasının belirsiz olması nedeniyle oluşan tutarsızlık durumu
- **Session**: Supabase authentication session bilgisi (JWT token, user data)
- **Loading_State**: Component'lerin veri yükleme durumunu gösteren boolean state
- **Re-render**: React component'inin state değişikliği nedeniyle yeniden render edilmesi
- **Singleton**: Bir class'tan sadece tek bir instance oluşturulmasını garanti eden tasarım deseni
- **Hook**: React'te state ve lifecycle özelliklerini kullanmayı sağlayan fonksiyon (use ile başlar)
- **Provider**: React Context API'de context değerini child component'lere sağlayan wrapper component
- **Consumer**: Context Provider'dan değer okuyan component veya hook

## Requirements

### Requirement 1: Merkezi Authentication State Yönetimi

**User Story:** As a developer, I want a centralized authentication state management system, so that all components access the same auth state without redundant queries

#### Acceptance Criteria

1. WHEN the application initializes, THE AuthContext SHALL fetch authentication data exactly once from Supabase
2. WHEN any component needs auth data, THE AuthContext SHALL provide cached user, profile, and organization data without additional network requests
3. WHEN authentication state changes (login/logout), THE AuthContext SHALL update all subscribed components simultaneously
4. WHEN multiple components mount concurrently, THE AuthContext SHALL prevent duplicate authentication queries
5. WHERE a component uses auth data, THE component SHALL subscribe to AuthContext instead of creating separate Supabase client instances for auth queries

### Requirement 2: Singleton Supabase Client Management

**User Story:** As a developer, I want a single Supabase client instance for authentication, so that session state remains consistent across all components

#### Acceptance Criteria

1. THE AuthContext SHALL create and maintain a single Supabase client instance for authentication operations
2. WHEN a component needs to perform authenticated operations, THE component SHALL use the shared Supabase client from AuthContext
3. WHEN session state updates in Supabase, THE AuthContext SHALL propagate the update to all consuming components within 100 milliseconds
4. THE AuthContext SHALL ensure session token consistency across all components by using a single client instance

### Requirement 3: Loading State Coordination

**User Story:** As a user, I want to see a consistent loading experience, so that I know when the application is ready to use

#### Acceptance Criteria

1. WHEN the application starts, THE AuthContext SHALL set loading state to true
2. WHEN authentication data fetch completes successfully, THE AuthContext SHALL set loading state to false
3. WHEN authentication data fetch fails, THE AuthContext SHALL set loading state to false and provide error information
4. WHILE loading state is true, THE application SHALL display a loading indicator to the user
5. WHEN loading state becomes false, THE application SHALL render the appropriate UI based on authentication status

### Requirement 4: Race Condition Prevention

**User Story:** As a user, I want all UI elements to work correctly on first load, so that I don't need to refresh the page

#### Acceptance Criteria

1. THE AuthContext SHALL complete authentication data fetch before any child components attempt to use auth-dependent data
2. WHEN components mount before auth data is ready, THE components SHALL wait for AuthContext loading state to become false
3. THE AuthContext SHALL guarantee that profile and organization data are available together atomically
4. WHEN a component depends on organization_id, THE component SHALL receive a valid organization_id or null, never undefined

### Requirement 5: Performance Optimization

**User Story:** As a user, I want the application to load quickly, so that I can start working without delays

#### Acceptance Criteria

1. THE AuthContext SHALL reduce initial authentication queries from 4-6 to exactly 1
2. WHEN navigating between pages, THE application SHALL complete page transitions within 100 milliseconds using cached auth data
3. THE AuthContext SHALL reduce memory usage by maintaining a single auth state instead of 4-6 duplicate states
4. THE AuthContext SHALL reduce component re-renders by 70-80% through optimized state updates

### Requirement 6: Error Handling and Recovery

**User Story:** As a user, I want clear error messages when authentication fails, so that I know what went wrong

#### Acceptance Criteria

1. WHEN authentication fetch fails, THE AuthContext SHALL provide a descriptive error message in Turkish
2. WHEN session expires, THE AuthContext SHALL detect the expiration and redirect to login page
3. WHEN network errors occur, THE AuthContext SHALL set error state and allow components to display appropriate UI
4. THE AuthContext SHALL log authentication errors to console for debugging purposes

### Requirement 7: Backward Compatibility

**User Story:** As a developer, I want to migrate components gradually, so that the application remains functional during migration

#### Acceptance Criteria

1. THE new AuthContext SHALL provide the same interface as the existing useAuth hook
2. WHEN a component uses the old useAuth hook, THE component SHALL continue to function without modifications
3. THE migration SHALL allow incremental component updates without breaking existing functionality
4. THE AuthContext SHALL support both old and new usage patterns during the transition period

### Requirement 8: Session Persistence and Refresh

**User Story:** As a user, I want to stay logged in across page refreshes, so that I don't need to login repeatedly

#### Acceptance Criteria

1. WHEN the page refreshes, THE AuthContext SHALL restore session from Supabase storage
2. WHEN session token is about to expire, THE AuthContext SHALL refresh the token automatically
3. THE AuthContext SHALL handle session refresh without disrupting user experience
4. WHEN session refresh fails, THE AuthContext SHALL redirect user to login page

### Requirement 9: Real-time Subscription Management

**User Story:** As a developer, I want auth state changes to propagate immediately, so that components stay synchronized

#### Acceptance Criteria

1. THE AuthContext SHALL subscribe to Supabase auth state changes
2. WHEN auth state changes (login/logout), THE AuthContext SHALL update all consuming components within 100 milliseconds
3. WHEN AuthContext unmounts, THE AuthContext SHALL unsubscribe from auth state changes to prevent memory leaks
4. THE AuthContext SHALL handle concurrent auth state changes without race conditions

### Requirement 10: Developer Experience

**User Story:** As a developer, I want a simple API to access auth state, so that I can focus on feature development

#### Acceptance Criteria

1. THE AuthContext SHALL provide a useAuth hook with a clear, typed interface
2. THE useAuth hook SHALL return user, profile, organization, loading, and error states
3. THE useAuth hook SHALL provide a signOut function for logout operations
4. THE AuthContext SHALL include TypeScript types for all exported values
5. THE useAuth hook SHALL be usable in any component without additional setup beyond the Provider
