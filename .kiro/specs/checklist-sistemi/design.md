# Design Document

## Overview

Checklist sistemi, Vector PWA projesine standart değerlendirme ve performans takibi yetenekleri ekler. Sistem üç ana bileşenden oluşur:

1. **Checklist Template Management**: Owner'ların yeniden kullanılabilir şablonlar oluşturması
2. **Checklist Execution**: Kullanıcıların şablonları doldurması ve otomatik puanlama
3. **Result Tracking**: Sonuçların personellere atanması ve görüntülenmesi

**Temel Prensipler:**
- Mobile-first tasarım
- Real-time güncellemeler
- Serverless architecture (Supabase)
- Minimal ve kullanışlı UI
- AI analiz entegrasyonu hazırlığı

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Settings   │  │  Checklists  │  │   Personnel  │      │
│  │   /settings  │  │ /checklists  │  │ /personnel   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
├────────────────────────────┼─────────────────────────────────┤
│                    Supabase Client                           │
├────────────────────────────┼─────────────────────────────────┤
│                        Supabase                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  checklists  │  │   checklist  │  │   checklist  │      │
│  │   (tables)   │  │   _results   │  │ _assignments │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    RLS Policies                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow


**1. Checklist Template Creation (Owner)**
```
Owner → Settings Page → Create Template → Save to DB
                                        ↓
                                  checklists table
```

**2. Checklist Execution**
```
User → Checklists Page → Select Template → Fill Items → Complete
                                                        ↓
                                              Calculate Score (0-5)
                                                        ↓
                                              checklist_results table
```

**3. Personnel Assignment**
```
Completed Checklist → Select Personnel → Assign
                                        ↓
                          checklist_assignments table
                                        ↓
                          Real-time update → Personnel Detail Page
```

## Components and Interfaces

### 1. Database Schema

#### checklists Table
```sql
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]', -- Array of {id, text, order}
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checklists_org ON checklists(organization_id);
CREATE INDEX idx_checklists_active ON checklists(is_active) WHERE deleted_at IS NULL;
```


#### checklist_results Table
```sql
CREATE TABLE checklist_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  completed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checklist_snapshot JSONB NOT NULL, -- Snapshot of checklist at completion time
  completed_items JSONB NOT NULL DEFAULT '[]', -- Array of completed item IDs
  total_items INTEGER NOT NULL,
  score DECIMAL(3,2) NOT NULL, -- 0.00 to 5.00
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checklist_results_org ON checklist_results(organization_id);
CREATE INDEX idx_checklist_results_completed_by ON checklist_results(completed_by);
CREATE INDEX idx_checklist_results_completed_at ON checklist_results(completed_at DESC);
```

#### checklist_assignments Table
```sql
CREATE TABLE checklist_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_result_id UUID NOT NULL REFERENCES checklist_results(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(checklist_result_id, personnel_id)
);

CREATE INDEX idx_checklist_assignments_personnel ON checklist_assignments(personnel_id);
CREATE INDEX idx_checklist_assignments_result ON checklist_assignments(checklist_result_id);
```

### 2. TypeScript Types

```typescript
// lib/types/checklists.ts

export interface ChecklistItem {
  id: string;
  text: string;
  order: number;
}

export interface Checklist {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  items: ChecklistItem[];
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistResult {
  id: string;
  checklist_id: string;
  organization_id: string;
  completed_by: string;
  checklist_snapshot: Checklist;
  completed_items: string[]; // Array of item IDs
  total_items: number;
  score: number; // 0.00 to 5.00
  completed_at: string;
  created_at: string;
}

export interface ChecklistAssignment {
  id: string;
  checklist_result_id: string;
  personnel_id: string;
  assigned_by: string;
  assigned_at: string;
  created_at: string;
}

// Extended types with relations
export interface ChecklistResultWithDetails extends ChecklistResult {
  completed_by_name: string;
  assigned_to: Array<{
    personnel_id: string;
    personnel_name: string;
  }>;
}
```


### 3. React Components

#### Component Hierarchy

```
Settings Page
└── ChecklistManagement
    ├── ChecklistList
    │   └── ChecklistCard
    └── ChecklistForm (Modal)

Checklists Page
└── ChecklistsClient
    ├── ChecklistTemplateList
    │   └── ChecklistTemplateCard
    └── ChecklistExecutionModal
        ├── ChecklistItemsList
        └── PersonnelAssignmentForm

Personnel Detail Page
└── PersonnelDetailClient
    └── TabNavigation
        ├── NotesTab (default)
        ├── TasksTab
        └── ChecklistsTab
            └── ChecklistResultsList
                └── ChecklistResultCard
```

#### Key Components

**ChecklistManagement** (`components/checklists/ChecklistManagement.tsx`)
- Owner-only component
- CRUD operations for checklist templates
- List view with edit/delete actions

**ChecklistsClient** (`app/(dashboard)/checklists/page.tsx`)
- Main checklist execution page
- Lists all active templates
- Opens execution modal on template selection

**ChecklistExecutionModal** (`components/checklists/ChecklistExecutionModal.tsx`)
- Displays checklist items with checkboxes
- Real-time progress tracking
- Complete button with auto-scoring
- Personnel assignment interface

**TabNavigation** (`components/personnel/TabNavigation.tsx`)
- Minimal tab bar: Notlar | Görevler | Checklistler
- Active tab highlighting
- Mobile-friendly touch targets (44x44px)

**ChecklistsTab** (`components/personnel/ChecklistsTab.tsx`)
- Displays assigned checklist results
- Sorted by date (newest first)
- Pagination (10 results/page)
- Expandable detail view


### 4. Custom Hooks

**useChecklists** (`lib/hooks/useChecklists.ts`)
```typescript
export function useChecklists() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch checklists
  // Real-time subscription
  // CRUD operations
  
  return {
    checklists,
    isLoading,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    refreshChecklists
  };
}
```

**useChecklistExecution** (`lib/hooks/useChecklistExecution.ts`)
```typescript
export function useChecklistExecution(checklistId: string) {
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  
  // Toggle item completion
  // Calculate score in real-time
  // Submit result
  // Assign to personnel
  
  return {
    completedItems,
    score,
    toggleItem,
    calculateScore,
    submitResult,
    assignToPersonnel
  };
}
```

**useChecklistResults** (`lib/hooks/useChecklistResults.ts`)
```typescript
export function useChecklistResults(personnelId: string) {
  const [results, setResults] = useState<ChecklistResultWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch results for personnel
  // Real-time subscription
  // Pagination
  
  return {
    results,
    isLoading,
    hasMore,
    loadMore
  };
}
```

## Data Models

### Checklist Item Structure (JSONB)

```json
{
  "id": "uuid-v4",
  "text": "Hijyen kurallarına uyuluyor mu?",
  "order": 1
}
```

### Completed Items Structure (JSONB)

```json
["item-id-1", "item-id-3", "item-id-5"]
```

### Checklist Snapshot Structure (JSONB)

```json
{
  "id": "checklist-uuid",
  "title": "Hijyen Kontrolü",
  "description": "Günlük hijyen standartları kontrolü",
  "items": [
    {"id": "item-1", "text": "El yıkama", "order": 1},
    {"id": "item-2", "text": "Maske kullanımı", "order": 2}
  ]
}
```


## Error Handling

### Frontend Error Handling

**Toast Notifications:**
- Başarılı işlemler: Yeşil toast (3 saniye)
- Hata durumları: Kırmızı toast (manuel kapatma)
- Uyarılar: Sarı toast (5 saniye)

**Error Scenarios:**

1. **Checklist Template Creation Fails**
   - Toast: "Checklist oluşturulamadı. Lütfen tekrar deneyin."
   - Log error to console
   - Keep form data intact

2. **Checklist Execution Fails**
   - Toast: "Checklist tamamlanamadı. Lütfen tekrar deneyin."
   - Save progress locally (localStorage)
   - Retry mechanism

3. **Personnel Assignment Fails**
   - Toast: "Atama yapılamadı. Lütfen tekrar deneyin."
   - Allow retry without re-completing checklist

4. **Real-time Subscription Fails**
   - Fallback to polling (every 30 seconds)
   - Toast: "Canlı güncellemeler devre dışı"
   - Reconnect attempt on network recovery

### Backend Error Handling

**RLS Policy Violations:**
- Return 403 Forbidden
- Frontend shows: "Bu işlem için yetkiniz yok"

**Database Constraints:**
- Unique constraint violation → "Bu kayıt zaten mevcut"
- Foreign key violation → "İlişkili kayıt bulunamadı"
- Not null violation → "Zorunlu alanlar eksik"

**Validation Errors:**
- Empty checklist items → "En az 1 madde girmelisiniz"
- Invalid score range → "Puan 0-5 arasında olmalıdır"
- Missing personnel selection → "En az 1 personel seçmelisiniz"


## Testing Strategy

### Unit Tests

**Utility Functions:**
- `calculateChecklistScore(completed, total)` → Score calculation
- `formatChecklistDate(date)` → Date formatting
- `validateChecklistItems(items)` → Item validation

**Custom Hooks:**
- `useChecklists` → CRUD operations
- `useChecklistExecution` → Item toggling, scoring
- `useChecklistResults` → Data fetching, pagination

### Integration Tests

**Checklist Template Management:**
1. Owner creates checklist template
2. Template appears in list
3. Owner edits template
4. Changes are saved
5. Owner deletes template
6. Template is soft-deleted

**Checklist Execution:**
1. User selects template
2. Modal opens with items
3. User checks items
4. Score updates in real-time
5. User completes checklist
6. Result is saved
7. Personnel assignment interface opens

**Personnel Assignment:**
1. User selects personnel
2. Assignment is created
3. Result appears in personnel detail page
4. Real-time update works

### E2E Tests

**Critical User Journey:**
1. Owner logs in
2. Creates "Hijyen Kontrolü" checklist (5 items)
3. Navigates to /checklists
4. Selects "Hijyen Kontrolü"
5. Completes 4/5 items
6. Sees score: 4.00/5.00
7. Assigns to "Ahmet Yılmaz"
8. Navigates to Ahmet's detail page
9. Clicks "Checklistler" tab
10. Sees the result with 4.00 score

**Mobile Responsiveness:**
- Test on iPhone SE (375px)
- Test on iPad (768px)
- Verify touch targets (44x44px)
- Verify tab navigation
- Verify modal scrolling


## UI/UX Design

### Mobile Navigation Update

**Current:**
```
┌─────────────────────────────────┐
│  [Personel]      [Ayarlar]      │
└─────────────────────────────────┘
```

**New:**
```
┌─────────────────────────────────┐
│ [Personel] [Checklistler] [Ayarlar] │
└─────────────────────────────────┘
```

**Specifications:**
- Fixed bottom position
- 44x44px minimum touch target
- Active state: Blue background + icon color
- Smooth transitions (200ms)
- Icons: Users, Clipboard, Settings

### Tab Navigation (Personnel Detail)

**Design:**
```
┌─────────────────────────────────────┐
│  Notlar  │  Görevler  │  Checklistler │
│  ━━━━━━                              │ ← Active indicator
└─────────────────────────────────────┘
```

**Specifications:**
- Horizontal scroll on mobile (if needed)
- Active tab: Blue underline (2px) + blue text
- Inactive tabs: Gray text
- Smooth underline animation (300ms)
- Default: "Notlar" tab active

### Checklist Execution Modal

**Layout:**
```
┌─────────────────────────────────────┐
│  Hijyen Kontrolü              [X]   │
│  ─────────────────────────────────  │
│                                     │
│  Tamamlanan: 3/5  |  Puan: 3.00/5.00│
│                                     │
│  ☑ El yıkama                        │
│  ☑ Maske kullanımı                  │
│  ☐ Eldiven kullanımı                │
│  ☑ Temizlik malzemeleri             │
│  ☐ Çöp ayrıştırma                   │
│                                     │
│  [İptal]              [Tamamla]     │
└─────────────────────────────────────┘
```

**Specifications:**
- Modal max-width: 600px
- Checkbox size: 24x24px (mobile: 32x32px)
- Item padding: 16px
- Progress bar at top
- Real-time score update
- Disabled "Tamamla" if 0 items checked


### Checklist Result Card

**Layout:**
```
┌─────────────────────────────────────┐
│  Hijyen Kontrolü          4.00/5.00 │
│  ─────────────────────────────────  │
│  📅 15 Kasım 2025, 14:30            │
│  👤 Mehmet Demir tarafından         │
│  ✓ 8/10 madde tamamlandı            │
│                                     │
│  [Detayları Gör]                    │
└─────────────────────────────────────┘
```

**Specifications:**
- Card padding: 16px
- Score: Large, bold, right-aligned
- Date: Relative format (2 saat önce)
- Expandable detail view
- Color-coded score:
  - 4.5-5.0: Green
  - 3.5-4.4: Yellow
  - 0-3.4: Red

### Personnel Assignment Interface

**Layout:**
```
┌─────────────────────────────────────┐
│  Personel Seç                       │
│  ─────────────────────────────────  │
│  🔍 [Ara...]                        │
│                                     │
│  ☑ Ahmet Yılmaz                     │
│  ☐ Mehmet Demir                     │
│  ☑ Ayşe Kaya                        │
│  ☐ Fatma Öz                         │
│                                     │
│  2 personel seçildi                 │
│                                     │
│  [İptal]              [Ata]         │
└─────────────────────────────────────┘
```

**Specifications:**
- Search box with debounce (300ms)
- Multi-select checkboxes
- Selected count indicator
- Disabled "Ata" if no selection
- Success toast after assignment


## RLS Policies

### checklists Table

**SELECT Policy:**
```sql
CREATE POLICY "Users can view checklists in their organization"
ON checklists FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
  AND deleted_at IS NULL
);
```

**INSERT Policy:**
```sql
CREATE POLICY "Only owners can create checklists"
ON checklists FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = 'owner'
  )
);
```

**UPDATE Policy:**
```sql
CREATE POLICY "Only owners can update checklists"
ON checklists FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = 'owner'
  )
);
```

**DELETE Policy:**
```sql
CREATE POLICY "Only owners can delete checklists"
ON checklists FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = 'owner'
  )
);
```

### checklist_results Table

**SELECT Policy:**
```sql
CREATE POLICY "Users can view results in their organization"
ON checklist_results FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);
```

**INSERT Policy:**
```sql
CREATE POLICY "Users can create results in their organization"
ON checklist_results FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
  AND completed_by = auth.uid()
);
```

### checklist_assignments Table

**SELECT Policy:**
```sql
CREATE POLICY "Users can view assignments in their organization"
ON checklist_assignments FOR SELECT
USING (
  personnel_id IN (
    SELECT id FROM personnel 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);
```

**INSERT Policy:**
```sql
CREATE POLICY "Users can create assignments in their organization"
ON checklist_assignments FOR INSERT
WITH CHECK (
  personnel_id IN (
    SELECT id FROM personnel 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
  AND assigned_by = auth.uid()
);
```


## Real-time Subscriptions

### Checklist Templates (Settings Page)

```typescript
// Subscribe to checklist changes
const subscription = supabase
  .channel('checklists-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'checklists',
      filter: `organization_id=eq.${organizationId}`
    },
    (payload) => {
      if (payload.eventType === 'INSERT') {
        setChecklists(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setChecklists(prev => 
          prev.map(c => c.id === payload.new.id ? payload.new : c)
        );
      } else if (payload.eventType === 'DELETE') {
        setChecklists(prev => prev.filter(c => c.id !== payload.old.id));
      }
    }
  )
  .subscribe();

// Cleanup
return () => {
  subscription.unsubscribe();
};
```

### Checklist Results (Personnel Detail Page)

```typescript
// Subscribe to new assignments for this personnel
const subscription = supabase
  .channel('checklist-assignments-changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'checklist_assignments',
      filter: `personnel_id=eq.${personnelId}`
    },
    async (payload) => {
      // Fetch the full result with details
      const { data } = await supabase
        .from('checklist_results')
        .select('*, profiles(name, surname)')
        .eq('id', payload.new.checklist_result_id)
        .single();
      
      if (data) {
        setResults(prev => [data, ...prev]);
      }
    }
  )
  .subscribe();

// Cleanup
return () => {
  subscription.unsubscribe();
};
```


## Performance Considerations

### Database Optimization

**Indexes:**
- `checklists(organization_id)` - Fast org filtering
- `checklists(is_active)` - Active templates only
- `checklist_results(organization_id)` - Fast org filtering
- `checklist_results(completed_at DESC)` - Sorted queries
- `checklist_assignments(personnel_id)` - Fast personnel lookup

**Query Optimization:**
- Use `select('*')` sparingly, specify needed columns
- Implement pagination (10 results/page)
- Use JSONB indexes for item searches (if needed)
- Cache checklist templates in memory (rarely change)

### Frontend Optimization

**Code Splitting:**
```typescript
// Lazy load checklist components
const ChecklistManagement = dynamic(
  () => import('@/components/checklists/ChecklistManagement'),
  { loading: () => <LoadingSpinner /> }
);
```

**Memoization:**
```typescript
// Memoize expensive calculations
const score = useMemo(() => {
  return (completedItems.length / totalItems) * 5;
}, [completedItems, totalItems]);
```

**Debouncing:**
```typescript
// Debounce search input
const debouncedSearch = useDebouncedCallback(
  (value: string) => {
    setSearchQuery(value);
  },
  300
);
```

### Bundle Size

**Target:**
- Initial load: < 200KB
- Checklist page: < 50KB additional
- Images: WebP format, lazy loaded

**Strategies:**
- Tree shaking (remove unused code)
- Dynamic imports for heavy components
- Minimize dependencies
- Use Next.js Image component


## AI Analysis Integration (Future)

### Data Structure for AI

**Checklist Results Query:**
```typescript
const checklistData = await supabase
  .from('checklist_assignments')
  .select(`
    checklist_result:checklist_results(
      checklist_snapshot,
      score,
      completed_items,
      total_items,
      completed_at
    )
  `)
  .eq('personnel_id', personnelId)
  .order('assigned_at', { ascending: false })
  .limit(10);
```

**AI Prompt Format:**
```typescript
const prompt = `
Personel: ${personnel.name}

Son Checklist Sonuçları:
${checklistData.map(c => `
  - ${c.checklist_snapshot.title}: ${c.score}/5.0
  - Tamamlanan: ${c.completed_items.length}/${c.total_items}
  - Tarih: ${formatDate(c.completed_at)}
  - Eksik maddeler: ${getMissingItems(c)}
`).join('\n')}

Notlar:
${notes.map(n => `- ${n.content}`).join('\n')}

Görevler:
${tasks.map(t => `- ${t.description} (${t.status})`).join('\n')}

Bu personel hakkında:
1. Checklist performans trendi nedir?
2. Hangi alanlarda sürekli başarılı?
3. Hangi alanlarda gelişim gerekiyor?
4. Öneriler nelerdir?
`;
```

### Analysis Features

**Trend Analysis:**
- Score changes over time
- Improvement/decline detection
- Seasonal patterns

**Category Analysis:**
- Group checklists by type (Hijyen, Güvenlik, vb.)
- Compare performance across categories
- Identify weak areas

**Comparative Analysis:**
- Compare with team average
- Identify top performers
- Benchmark against standards

**Predictive Insights:**
- Predict future performance
- Risk assessment
- Training recommendations


## Migration Strategy

### Database Migration Order

1. **Create checklists table** (001_create_checklists.sql)
2. **Create checklist_results table** (002_create_checklist_results.sql)
3. **Create checklist_assignments table** (003_create_checklist_assignments.sql)
4. **Add RLS policies** (004_add_checklist_policies.sql)
5. **Add indexes** (005_add_checklist_indexes.sql)

### Rollback Plan

Each migration includes DOWN migration:
```sql
-- UP
CREATE TABLE checklists (...);

-- DOWN
DROP TABLE IF EXISTS checklists CASCADE;
```

### Data Seeding (Development)

```sql
-- Sample checklist template
INSERT INTO checklists (organization_id, title, description, items)
VALUES (
  'org-uuid',
  'Hijyen Kontrolü',
  'Günlük hijyen standartları kontrolü',
  '[
    {"id": "1", "text": "El yıkama", "order": 1},
    {"id": "2", "text": "Maske kullanımı", "order": 2},
    {"id": "3", "text": "Eldiven kullanımı", "order": 3},
    {"id": "4", "text": "Temizlik malzemeleri", "order": 4},
    {"id": "5", "text": "Çöp ayrıştırma", "order": 5}
  ]'::jsonb
);
```

## Security Considerations

### Input Validation

**Checklist Title:**
- Max length: 200 characters
- No HTML tags
- Required field

**Checklist Items:**
- Max 50 items per checklist
- Each item max 500 characters
- No script injection

**Score Calculation:**
- Server-side validation
- Range check: 0.00 - 5.00
- Decimal precision: 2 places

### XSS Prevention

- Sanitize all user inputs
- Use React's built-in escaping
- No `dangerouslySetInnerHTML`
- Content Security Policy headers

### CSRF Protection

- Supabase handles CSRF tokens
- Use POST for mutations
- Verify origin headers

### Rate Limiting

- Max 10 checklist creations/hour (Owner)
- Max 50 checklist completions/day (User)
- Implement on Edge Functions if needed

## Deployment Checklist

- [ ] Run database migrations
- [ ] Test RLS policies
- [ ] Verify real-time subscriptions
- [ ] Test mobile navigation
- [ ] Test tab navigation
- [ ] Test checklist execution
- [ ] Test personnel assignment
- [ ] Verify toast notifications
- [ ] Test on mobile devices
- [ ] Performance audit (Lighthouse)
- [ ] Accessibility audit (WAVE)
- [ ] Security scan
- [ ] Backup database
- [ ] Deploy to Railway
- [ ] Monitor error logs
- [ ] User acceptance testing

