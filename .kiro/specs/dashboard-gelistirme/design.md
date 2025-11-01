# Dashboard Geliştirme - Design Document

## Overview

Ayarlar sayfasına (`/settings`) 3 yeni bölüm ekleyerek kullanıcılara kritik bilgileri hızlı ve etkili bir şekilde sunacağız. Mevcut ayar kartlarının üstünde yer alacak. Mobil-first yaklaşımla tasarlanacak, minimal ama kaliteli olacak.

## Architecture

### Component Hierarchy

```
app/(dashboard)/page.tsx (Server Component)
└── DashboardClient.tsx (Client Component)
    ├── UncompletedTasksCard.tsx
    │   ├── TaskTabs.tsx
    │   └── TaskList.tsx
    │       └── TaskItem.tsx
    ├── PerformanceStatsCard.tsx
    │   └── StatCard.tsx
    ├── TimelineCard.tsx
    │   └── ActivityItem.tsx
    └── LoadingSkeletons.tsx
```

### Data Flow

1. **Server Component** (`page.tsx`):
   - User authentication check
   - Permission validation
   - Initial data fetch (SSR)
   - Pass data to client component

2. **Client Component** (`DashboardClient.tsx`):
   - Receive initial data
   - Setup real-time subscriptions
   - Handle user interactions
   - Manage loading/error states

3. **Real-time Updates**:
   - Supabase real-time subscriptions
   - Auto-refresh on data changes
   - Optimistic updates

## Components and Interfaces

### 1. DashboardClient Component

**Props:**
```typescript
interface DashboardClientProps {
  initialTasks: Task[];
  initialStats: PerformanceStats;
  initialActivities: Activity[];
  userRole: 'owner' | 'manager' | 'employee';
  userId: string;
  organizationId: string;
}
```

**State:**
```typescript
const [tasks, setTasks] = useState<Task[]>(initialTasks);
const [stats, setStats] = useState<PerformanceStats>(initialStats);
const [activities, setActivities] = useState<Activity[]>(initialActivities);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Responsibilities:**
- Render all dashboard cards
- Setup real-time subscriptions
- Handle data refresh
- Error boundary

### 2. UncompletedTasksCard Component

**Props:**
```typescript
interface UncompletedTasksCardProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}
```

**Features:**
- Tab navigation (Bugün Biten / Gecikmiş)
- Task filtering by deadline
- Empty state handling
- Loading skeleton

**UI Structure:**
```
┌─────────────────────────────────────┐
│ 📋 Tamamlanmamış Görevler          │
├─────────────────────────────────────┤
│ [Bugün Biten] [Gecikmiş]           │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 📝 Görev Açıklaması             │ │
│ │ 👤 Personel Adı                 │ │
│ │ 📅 Deadline: 30.10.2025         │ │
│ │ ⭐ Puan: 4.5                    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 3. PerformanceStatsCard Component

**Props:**
```typescript
interface PerformanceStatsCardProps {
  stats: PerformanceStats;
}

interface PerformanceStats {
  notesCount: number;
  completedTasksCount: number;
  positiveRatio: number; // 0-100
  averageRating: number; // 0-5
}
```

**UI Structure:**
```
┌─────────────────────────────────────┐
│ 📊 Performans Özeti (Son 7 Gün)    │
├─────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐  │
│ │ 📝 25  │ │ ✅ 18  │ │ 😊 75% │  │
│ │ Notlar │ │ Görev  │ │ Olumlu │  │
│ └────────┘ └────────┘ └────────┘  │
│ ┌────────┐                         │
│ │ ⭐ 4.2 │                         │
│ │ Puan   │                         │
│ └────────┘                         │
└─────────────────────────────────────┘
```

### 4. TimelineCard Component

**Props:**
```typescript
interface TimelineCardProps {
  activities: Activity[];
  onActivityClick: (activity: Activity) => void;
}

interface Activity {
  id: string;
  type: 'note' | 'task' | 'analysis';
  personnelId: string;
  personnelName: string;
  description: string;
  createdAt: string;
  metadata?: {
    noteId?: string;
    taskId?: string;
    analysisId?: string;
    analysisType?: string;
  };
}
```

**UI Structure:**
```
┌─────────────────────────────────────┐
│ 🕐 Son Hareketler                   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 📝 Ahmet'e not eklendi          │ │
│ │ 5 dakika önce                   │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Ayşe için görev tamamlandı   │ │
│ │ 2 saat önce                     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 Mehmet için Yetkinlik analizi│ │
│ │ dün                             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Data Models

### Task Model (Existing)
```typescript
interface Task {
  id: string;
  personnel_id: string;
  description: string;
  deadline: string;
  status: 'open' | 'in_progress' | 'closed';
  star_rating: number | null;
  completed_at: string | null;
  created_at: string;
  personnel?: {
    id: string;
    name: string;
  };
}
```

### Note Model (Existing)
```typescript
interface Note {
  id: string;
  personnel_id: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  is_voice_note: boolean;
  created_at: string;
  author_id: string;
}
```

### Analysis Model (Existing)
```typescript
interface AIAnalysis {
  id: string;
  personnel_id: string;
  analysis_type: 'yetkinlik' | 'egilim' | 'butunlesik';
  created_at: string;
}
```

## API Endpoints / Database Queries

### 1. Fetch Uncompleted Tasks

```typescript
// Server-side query
const { data: tasks } = await supabase
  .from('tasks')
  .select(`
    id,
    description,
    deadline,
    status,
    star_rating,
    personnel:personnel_id (
      id,
      name
    )
  `)
  .neq('status', 'closed')
  .order('deadline', { ascending: true });
```

### 2. Fetch Performance Stats

```typescript
// Notes count (last 7 days)
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const { count: notesCount } = await supabase
  .from('notes')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', sevenDaysAgo.toISOString());

// Completed tasks count (last 7 days)
const { count: completedTasksCount } = await supabase
  .from('tasks')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'closed')
  .gte('completed_at', sevenDaysAgo.toISOString());

// Positive notes ratio
const { data: notes } = await supabase
  .from('notes')
  .select('sentiment')
  .gte('created_at', sevenDaysAgo.toISOString());

const positiveCount = notes?.filter(n => n.sentiment === 'positive').length || 0;
const totalCount = notes?.length || 0;
const positiveRatio = totalCount > 0 ? (positiveCount / totalCount) * 100 : 0;

// Average task rating
const { data: completedTasks } = await supabase
  .from('tasks')
  .select('star_rating')
  .eq('status', 'closed')
  .gte('completed_at', sevenDaysAgo.toISOString())
  .not('star_rating', 'is', null);

const avgRating = completedTasks?.length > 0
  ? completedTasks.reduce((sum, t) => sum + (t.star_rating || 0), 0) / completedTasks.length
  : 0;
```

### 3. Fetch Recent Activities

```typescript
// Fetch last 10 activities from notes, tasks, and analyses
// Union query approach

// Notes
const { data: recentNotes } = await supabase
  .from('notes')
  .select(`
    id,
    created_at,
    personnel:personnel_id (
      id,
      name
    )
  `)
  .order('created_at', { ascending: false })
  .limit(10);

// Tasks (completed)
const { data: recentTasks } = await supabase
  .from('tasks')
  .select(`
    id,
    completed_at,
    personnel:personnel_id (
      id,
      name
    )
  `)
  .eq('status', 'closed')
  .order('completed_at', { ascending: false })
  .limit(10);

// Analyses
const { data: recentAnalyses } = await supabase
  .from('ai_analyses')
  .select(`
    id,
    analysis_type,
    created_at,
    personnel:personnel_id (
      id,
      name
    )
  `)
  .order('created_at', { ascending: false })
  .limit(10);

// Merge and sort by date, take top 10
const activities = [
  ...recentNotes.map(n => ({ ...n, type: 'note', date: n.created_at })),
  ...recentTasks.map(t => ({ ...t, type: 'task', date: t.completed_at })),
  ...recentAnalyses.map(a => ({ ...a, type: 'analysis', date: a.created_at }))
]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 10);
```

## Data Refresh

Veriler sayfa yenilendiğinde güncellenecek. Real-time subscription şimdilik eklenmeyecek (performans için).

## Error Handling

### Error Types

1. **Network Errors**: Connection issues
2. **Permission Errors**: User doesn't have access
3. **Data Errors**: Invalid or missing data

### Error UI

```typescript
if (error) {
  return (
    <Card>
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={handleRetry}>Tekrar Dene</Button>
      </div>
    </Card>
  );
}
```

## Testing Strategy

### Unit Tests
- Utility functions (date formatting, filtering)
- Data transformation functions
- Permission checks

### Integration Tests
- Data fetching
- Real-time subscriptions
- User interactions

### E2E Tests
- Dashboard load
- Tab navigation
- Activity clicks
- Real-time updates

## Performance Considerations

### Optimization Strategies

1. **Server-Side Rendering**: Initial data fetch on server (Next.js default)
2. **Limit Data**: Max 10 activities, only uncompleted tasks
3. **Simple Queries**: No complex joins or calculations
4. **Minimal Bundle**: Keep components simple and small

Performans optimizasyonları (memoization, caching) şimdilik eklenmeyecek - erken optimizasyon.

## Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Layout

**Mobile:**
```
┌─────────────────┐
│ Tamamlanmamış   │
│ Görevler        │
└─────────────────┘
┌─────────────────┐
│ Performans      │
│ Özeti           │
└─────────────────┘
┌─────────────────┐
│ Son Hareketler  │
└─────────────────┘
```

**Desktop:**
```
┌──────────────┬──────────────┐
│ Tamamlanmamış│ Performans   │
│ Görevler     │ Özeti        │
│              │              │
└──────────────┴──────────────┘
┌──────────────────────────────┐
│ Son Hareketler               │
│                              │
└──────────────────────────────┘
```

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast (WCAG AA)

## Security

- RLS policies enforced
- No sensitive data in client
- Permission checks on every query
- CSRF protection
- XSS prevention

## Future Enhancements

1. Grafik gösterimleri (charts)
2. Filtreleme seçenekleri
3. Export functionality
4. Özelleştirilebilir dashboard
5. Widget ekleme/çıkarma
6. Bildirim tercihleri
