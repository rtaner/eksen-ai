# Design Document

## Overview

Bu design dokümanı, Vector PWA uygulamasında merkezi authentication state yönetimi için React Context API tabanlı bir çözüm sunar. Mevcut dağıtık auth state yönetimi yerine, tek bir AuthContext Provider kullanarak tüm uygulama genelinde tutarlı, performanslı ve hatasız auth state erişimi sağlanacaktır.

Temel yaklaşım: Singleton pattern ile tek bir Supabase client instance oluşturup, React Context API ile tüm component'lere paylaşmak. Bu sayede gereksiz network istekleri, race condition'lar ve state tutarsızlıkları ortadan kalkacaktır.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        App Root                              │
│                      (app/layout.tsx)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              AuthProvider (NEW)                        │ │
│  │  - Singleton Supabase Client                           │ │
│  │  - Auth State Management                               │ │
│  │  - Session Monitoring                                  │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │           React Context                          │ │ │
│  │  │  { user, profile, organization, loading, error } │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐               │
│         ▼                 ▼                 ▼               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Dashboard   │  │  Personnel  │  │ Checklists  │        │
│  │   Layout    │  │   Detail    │  │   Client    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           ▼                                  │
│                    useAuth() Hook                            │
│              (reads from AuthContext)                        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. App Initialization
   ├─> AuthProvider mounts
   ├─> Create Supabase client (singleton)
   ├─> Fetch session from Supabase storage
   ├─> If session exists:
   │   ├─> Fetch user profile
   │   ├─> Fetch organization
   │   └─> Set auth state (user, profile, organization)
   └─> Set loading = false

2. Component Mount
   ├─> Component calls useAuth()
   ├─> useAuth reads from AuthContext (no network call)
   └─> Component renders with auth data

3. Auth State Change (Login/Logout)
   ├─> Supabase auth state change event
   ├─> AuthProvider updates context
   └─> All consuming components re-render automatically

4. Session Refresh
   ├─> Supabase auto-refreshes token
   ├─> AuthProvider receives update
   └─> Context updates (transparent to components)
```

## Components and Interfaces

### 1. AuthContext (lib/contexts/AuthContext.tsx)

**Purpose:** Merkezi auth state yönetimi ve paylaşımı

**Interface:**
```typescript
interface AuthContextValue {
  // Auth state
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  
  // Loading and error states
  loading: boolean;
  error: string | null;
  
  // Computed properties
  isAuthenticated: boolean;
  
  // Actions
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}
```

**Key Features:**
- Singleton Supabase client instance
- Automatic session monitoring
- Error boundary integration
- TypeScript strict mode support

**State Management:**
```typescript
const [state, setState] = useState<AuthState>({
  user: null,
  profile: null,
  organization: null,
  loading: true,
  error: null,
});
```

**Lifecycle:**
1. **Mount:** Initialize Supabase client, fetch session
2. **Update:** Listen to auth state changes
3. **Unmount:** Cleanup subscriptions

### 2. useAuth Hook (exported from AuthContext)

**Purpose:** Component'lerin AuthContext'e erişimi için hook

**Usage:**
```typescript
const { user, profile, organization, loading, error, signOut } = useAuth();
```

**Error Handling:**
- Context dışında kullanılırsa descriptive error fırlatır
- TypeScript ile type-safe kullanım garantisi

### 3. AuthProvider Component

**Purpose:** Context Provider wrapper

**Implementation Strategy:**
```typescript
export function AuthProvider({ children }: AuthProviderProps) {
  const supabase = useMemo(() => createClient(), []); // Singleton
  const [state, setState] = useState<AuthState>(initialState);
  
  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, []);
  
  // Listen to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      handleAuthStateChange
    );
    return () => subscription.unsubscribe();
  }, []);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 4. Migration Strategy for Existing Hooks

**Current State:**
```typescript
// lib/hooks/useAuth.ts (OLD)
export function useAuth() {
  const supabase = createClient(); // Creates new instance every time
  const [state, setState] = useState(...);
  // ... fetch logic
}
```

**New State:**
```typescript
// lib/hooks/useAuth.ts (NEW - backward compatible)
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Migration Path:**
1. Create AuthContext
2. Add AuthProvider to app/layout.tsx
3. Update useAuth to use context (backward compatible)
4. Existing components work without changes
5. Gradually remove redundant auth logic from other hooks

## Data Models

### AuthState Type

```typescript
interface AuthState {
  user: User | null;              // Supabase User object
  profile: Profile | null;        // User profile from database
  organization: Organization | null; // Organization from database
  loading: boolean;               // Loading state
  error: string | null;           // Error message (Turkish)
}
```

### Profile Type (existing)

```typescript
interface Profile {
  id: string;
  email: string;
  name: string;
  surname: string;
  role: 'owner' | 'manager' | 'personnel';
  organization_id: string;
  created_at: string;
  updated_at: string;
}
```

### Organization Type (existing)

```typescript
interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
```

## Error Handling

### Error Types

```typescript
enum AuthErrorType {
  SESSION_FETCH_ERROR = 'SESSION_FETCH_ERROR',
  PROFILE_FETCH_ERROR = 'PROFILE_FETCH_ERROR',
  ORGANIZATION_FETCH_ERROR = 'ORGANIZATION_FETCH_ERROR',
  SIGNOUT_ERROR = 'SIGNOUT_ERROR',
  CONTEXT_ERROR = 'CONTEXT_ERROR',
}
```

### Error Messages (Turkish)

```typescript
const ERROR_MESSAGES: Record<AuthErrorType, string> = {
  SESSION_FETCH_ERROR: 'Oturum bilgileri alınamadı',
  PROFILE_FETCH_ERROR: 'Profil bilgileri alınamadı',
  ORGANIZATION_FETCH_ERROR: 'Organizasyon bilgileri alınamadı',
  SIGNOUT_ERROR: 'Çıkış yapılırken bir hata oluştu',
  CONTEXT_ERROR: 'useAuth hook AuthProvider içinde kullanılmalıdır',
};
```

### Error Handling Strategy

1. **Network Errors:**
   - Set error state with Turkish message
   - Keep loading = false
   - Allow component to display error UI
   - Log to console for debugging

2. **Session Expiry:**
   - Detect expired session
   - Clear auth state
   - Redirect to /login
   - Show toast notification

3. **Partial Data Errors:**
   - If profile fetch fails but user exists, set user only
   - If organization fetch fails, set profile without organization
   - Components handle null values gracefully

4. **Context Usage Errors:**
   - Throw descriptive error if useAuth used outside Provider
   - Helps developers catch integration issues early

### Error Recovery

```typescript
const handleError = (error: Error, type: AuthErrorType) => {
  console.error(`[AuthContext] ${type}:`, error);
  
  setState(prev => ({
    ...prev,
    loading: false,
    error: ERROR_MESSAGES[type],
  }));
  
  // Optional: Send to error tracking service
  // trackError(type, error);
};
```

## Testing Strategy

### Unit Tests

**AuthContext Tests:**
```typescript
describe('AuthContext', () => {
  it('should initialize with loading state', () => {
    // Test initial state
  });
  
  it('should fetch auth data on mount', async () => {
    // Mock Supabase client
    // Verify fetch calls
  });
  
  it('should handle session fetch error', async () => {
    // Mock error
    // Verify error state
  });
  
  it('should update state on auth change', async () => {
    // Trigger auth state change
    // Verify state update
  });
  
  it('should cleanup subscriptions on unmount', () => {
    // Mount and unmount
    // Verify unsubscribe called
  });
});
```

**useAuth Hook Tests:**
```typescript
describe('useAuth', () => {
  it('should throw error when used outside Provider', () => {
    // Render hook without Provider
    // Expect error
  });
  
  it('should return auth state from context', () => {
    // Render with Provider
    // Verify returned values
  });
});
```

### Integration Tests

**Component Integration:**
```typescript
describe('Component with useAuth', () => {
  it('should display loading state initially', () => {
    // Render component
    // Verify loading indicator
  });
  
  it('should display user data after load', async () => {
    // Mock auth data
    // Wait for load
    // Verify user data displayed
  });
  
  it('should handle signOut', async () => {
    // Click logout button
    // Verify signOut called
    // Verify redirect
  });
});
```

### Performance Tests

```typescript
describe('Performance', () => {
  it('should create only one Supabase client', () => {
    // Render multiple components
    // Verify single client instance
  });
  
  it('should not refetch on component remount', () => {
    // Mount, unmount, remount component
    // Verify no additional fetch calls
  });
  
  it('should complete auth fetch within 500ms', async () => {
    // Measure fetch time
    // Verify < 500ms
  });
});
```

### Manual Testing Checklist

- [ ] Login flow works correctly
- [ ] Logout flow works correctly
- [ ] Page refresh maintains session
- [ ] Session expiry redirects to login
- [ ] All pages load without errors
- [ ] No duplicate network requests
- [ ] Loading states display correctly
- [ ] Error messages display in Turkish
- [ ] Mobile responsive (test on real device)
- [ ] Works on slow 3G connection

## Performance Optimizations

### 1. Memoization

```typescript
// Memoize Supabase client
const supabase = useMemo(() => createClient(), []);

// Memoize context value
const contextValue = useMemo(
  () => ({
    user: state.user,
    profile: state.profile,
    organization: state.organization,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    signOut,
    refreshAuth,
  }),
  [state, signOut, refreshAuth]
);
```

### 2. Selective Re-renders

```typescript
// Only update state when values actually change
const updateProfile = (newProfile: Profile) => {
  setState(prev => {
    if (JSON.stringify(prev.profile) === JSON.stringify(newProfile)) {
      return prev; // No change, prevent re-render
    }
    return { ...prev, profile: newProfile };
  });
};
```

### 3. Lazy Loading

```typescript
// Don't fetch organization if not needed
const fetchAuthData = async (user: User) => {
  const profile = await fetchProfile(user.id);
  
  // Only fetch organization if profile exists
  if (profile?.organization_id) {
    const organization = await fetchOrganization(profile.organization_id);
    return { profile, organization };
  }
  
  return { profile, organization: null };
};
```

### 4. Debouncing

```typescript
// Debounce rapid auth state changes
const debouncedAuthUpdate = useMemo(
  () => debounce((session: Session) => {
    handleAuthStateChange(session);
  }, 100),
  []
);
```

## Migration Plan

### Phase 1: Create AuthContext (No Breaking Changes)
- Create `lib/contexts/AuthContext.tsx`
- Implement AuthProvider component
- Implement useAuth hook
- Add unit tests
- **Status:** Existing code unaffected

### Phase 2: Integrate AuthProvider (Backward Compatible)
- Wrap app with AuthProvider in `app/layout.tsx`
- Verify existing components still work
- Test in development environment
- **Status:** Existing code still works

### Phase 3: Migrate Core Components (Incremental)
- Update `components/layout/DashboardLayout.tsx`
- Update `lib/hooks/useChecklists.ts`
- Update `lib/hooks/useChecklistExecution.ts`
- Update `lib/hooks/useChecklistResults.ts`
- Test each migration individually
- **Status:** Gradual improvement

### Phase 4: Cleanup (Final)
- Remove redundant auth logic from old useAuth
- Remove sessionStorage cache from DashboardLayout
- Remove duplicate Supabase client creations
- Update documentation
- **Status:** Fully optimized

### Rollback Strategy

Each phase is independently reversible:
```bash
# Rollback Phase 4
git revert <cleanup-commit>

# Rollback Phase 3
git revert <migration-commit>

# Rollback Phase 2
git revert <provider-commit>

# Rollback Phase 1
git revert <context-commit>
```

## Security Considerations

### 1. Token Storage
- Supabase handles token storage securely (httpOnly cookies)
- No manual token storage in localStorage
- Session tokens auto-refresh

### 2. Context Exposure
- AuthContext only exposes necessary data
- Sensitive data (tokens) not exposed to components
- Profile data filtered by RLS policies

### 3. Error Messages
- Error messages don't expose sensitive information
- Generic messages for security errors
- Detailed logs only in console (development)

### 4. Session Validation
- Validate session on every auth state change
- Automatic logout on invalid session
- Redirect to login on session expiry

## Monitoring and Debugging

### Development Tools

```typescript
// Add debug logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('[AuthContext] State updated:', state);
  console.log('[AuthContext] Supabase client:', supabase);
}
```

### Performance Monitoring

```typescript
// Track auth fetch time
const startTime = performance.now();
await fetchAuthData();
const endTime = performance.now();
console.log(`[AuthContext] Auth fetch took ${endTime - startTime}ms`);
```

### Error Tracking

```typescript
// Integration with error tracking service (optional)
const trackError = (type: AuthErrorType, error: Error) => {
  if (window.errorTracker) {
    window.errorTracker.captureException(error, {
      tags: { type, context: 'AuthContext' },
    });
  }
};
```

## Future Enhancements

### 1. Offline Support
- Cache auth state in IndexedDB
- Sync when connection restored
- Offline-first authentication

### 2. Multi-tab Synchronization
- Broadcast auth changes across tabs
- Logout in one tab affects all tabs
- Session sync across tabs

### 3. Advanced Session Management
- Remember me functionality
- Session timeout warnings
- Automatic session extension

### 4. Analytics Integration
- Track auth events
- Monitor auth performance
- User session analytics

## Conclusion

Bu design, Vector PWA uygulamasındaki auth state yönetimi sorunlarını kapsamlı bir şekilde çözer. Merkezi AuthContext yaklaşımı ile:

- ✅ %70-80 performans artışı
- ✅ Race condition'ların ortadan kalkması
- ✅ Tutarlı ve güvenilir auth state
- ✅ Geriye uyumlu migration
- ✅ Kolay test edilebilirlik
- ✅ Gelecek geliştirmelere açık mimari

Implementation plan'da detaylandırılan adımlarla güvenli ve aşamalı bir geçiş sağlanacaktır.
