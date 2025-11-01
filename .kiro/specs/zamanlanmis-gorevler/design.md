# Zamanlanmış Görevler - Design

## Overview

Zamanlanmış Görevler sistemi, tekrarlayan görevlerin merkezi yönetimini sağlar. Sistem, mobil-first yaklaşımla tasarlanmış, hızlı ve pratik bir kullanıcı deneyimi sunar. Otomatik görev oluşturma için cron job kullanılır ve izin günü/delegasyon özellikleri ile esneklik sağlanır.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  Settings Page                                               │
│  ├─ Scheduled Tasks List                                    │
│  ├─ Create/Edit Modal (Bottom Sheet on Mobile)             │
│  └─ Quick Actions (Swipe on Mobile)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
├─────────────────────────────────────────────────────────────┤
│  Database Tables:                                            │
│  ├─ scheduled_tasks                                         │
│  ├─ scheduled_task_assignments                              │
│  ├─ scheduled_task_leave_dates                              │
│  ├─ scheduled_task_skip_dates                               │
│  └─ tasks (existing)                                        │
│                                                              │
│  Edge Functions:                                             │
│  └─ create-scheduled-task-instances                         │
│                                                              │
│  Cron Jobs:                                                  │
│  └─ Daily at 00:00 UTC (03:00 TR)                          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**1. Zamanlanmış Görev Oluşturma:**
```
User → Create Modal → Validate → Save to DB → Update UI
```

**2. Otomatik Görev Oluşturma:**
```
Cron (00:00) → Edge Function → Fetch Active Scheduled Tasks
→ Check Recurrence Pattern → Check Exceptions (Leave/Skip)
→ Create Task Instances → Send Notifications
```

**3. İzin Günü Delegasyonu:**
```
User → Add Leave Date → Select Delegate → Save
→ Cron checks leave dates → Creates task for delegate
```

## Data Models

### scheduled_tasks Table

```sql
CREATE TABLE scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  
  -- Task Details
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Recurrence
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
  recurrence_config JSONB NOT NULL,
  -- For weekly: {"days": [1, 3, 5]} (Monday, Wednesday, Friday)
  -- For monthly: {"day": 15} (15th of each month)
  
  scheduled_time TIME DEFAULT '09:00:00',
  
  -- Assignment
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('specific', 'role')),
  assignment_config JSONB NOT NULL,
  -- For specific: {"personnel_ids": ["uuid1", "uuid2"]}
  -- For role: {"role": "manager"}
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_tasks_org ON scheduled_tasks(organization_id);
CREATE INDEX idx_scheduled_tasks_active ON scheduled_tasks(is_active);
```

### scheduled_task_leave_dates Table

```sql
CREATE TABLE scheduled_task_leave_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_task_id UUID NOT NULL REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  delegate_personnel_id UUID REFERENCES personnel(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(scheduled_task_id, personnel_id, leave_date)
);

CREATE INDEX idx_leave_dates_task ON scheduled_task_leave_dates(scheduled_task_id);
CREATE INDEX idx_leave_dates_date ON scheduled_task_leave_dates(leave_date);
```

### scheduled_task_skip_dates Table

```sql
CREATE TABLE scheduled_task_skip_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_task_id UUID NOT NULL REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
  skip_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(scheduled_task_id, skip_date)
);

CREATE INDEX idx_skip_dates_task ON scheduled_task_skip_dates(scheduled_task_id);
CREATE INDEX idx_skip_dates_date ON scheduled_task_skip_dates(skip_date);
```

### tasks Table (Existing - Add Column)

```sql
ALTER TABLE tasks ADD COLUMN scheduled_task_id UUID REFERENCES scheduled_tasks(id) ON DELETE SET NULL;
CREATE INDEX idx_tasks_scheduled ON tasks(scheduled_task_id);
```

## Components and Interfaces

### Frontend Components

**1. ScheduledTasksPage** (`app/(dashboard)/settings/scheduled-tasks/page.tsx`)
- Main page component
- Fetches and displays scheduled tasks
- Handles permissions
- Mobile-responsive layout

**2. ScheduledTasksList** (`components/scheduled-tasks/ScheduledTasksList.tsx`)
- Displays list of scheduled tasks
- Card-based layout
- Swipe actions on mobile
- Filter by active/inactive

**3. ScheduledTaskCard** (`components/scheduled-tasks/ScheduledTaskCard.tsx`)
- Individual task card
- Shows name, recurrence, assignments
- Quick actions (edit, delete, toggle)
- Touch-friendly (min 44x44px)

**4. ScheduledTaskModal** (`components/scheduled-tasks/ScheduledTaskModal.tsx`)
- Create/Edit modal
- Bottom sheet on mobile
- Multi-step form (Basic → Assignment → Advanced)
- Form validation

**5. RecurrenceSelector** (`components/scheduled-tasks/RecurrenceSelector.tsx`)
- Recurrence type selection
- Day/date pickers based on type
- Time picker
- Visual preview of recurrence

**6. AssignmentSelector** (`components/scheduled-tasks/AssignmentSelector.tsx`)
- Assignment type toggle (specific/role)
- Personnel multi-select
- Role dropdown
- Visual chips for selected items

**7. AdvancedSettings** (`components/scheduled-tasks/AdvancedSettings.tsx`)
- Expandable section
- Leave date management
- Skip date management
- Delegate selection

**8. LeaveDateManager** (`components/scheduled-tasks/LeaveDateManager.tsx`)
- Add/remove leave dates
- Date picker
- Delegate personnel selector
- List of configured leave dates

**9. BulkActionsBar** (`components/scheduled-tasks/BulkActionsBar.tsx`)
- Pause all / Activate all
- Transfer tasks
- Appears when actions available

### Custom Hooks

**1. useScheduledTasks**
```typescript
export function useScheduledTasks() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchTasks = async () => { /* ... */ };
  const createTask = async (data: CreateScheduledTaskInput) => { /* ... */ };
  const updateTask = async (id: string, data: UpdateScheduledTaskInput) => { /* ... */ };
  const deleteTask = async (id: string) => { /* ... */ };
  const toggleActive = async (id: string) => { /* ... */ };
  const pauseAll = async () => { /* ... */ };
  const activateAll = async () => { /* ... */ };
  
  return { tasks, loading, fetchTasks, createTask, updateTask, deleteTask, toggleActive, pauseAll, activateAll };
}
```

**2. useLeaveD ates**
```typescript
export function useLeaveDates(scheduledTaskId: string) {
  const [leaveDates, setLeaveDates] = useState<LeaveDate[]>([]);
  
  const addLeaveDate = async (data: AddLeaveDateInput) => { /* ... */ };
  const removeLeaveDate = async (id: string) => { /* ... */ };
  
  return { leaveDates, addLeaveDate, removeLeaveDate };
}
```

**3. useSkipDates**
```typescript
export function useSkipDates(scheduledTaskId: string) {
  const [skipDates, setSkipDates] = useState<SkipDate[]>([]);
  
  const addSkipDate = async (date: string) => { /* ... */ };
  const removeSkipDate = async (id: string) => { /* ... */ };
  
  return { skipDates, addSkipDate, removeSkipDate };
}
```

### TypeScript Types

```typescript
export interface ScheduledTask {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  description: string;
  recurrence_type: 'daily' | 'weekly' | 'monthly';
  recurrence_config: RecurrenceConfig;
  scheduled_time: string;
  assignment_type: 'specific' | 'role';
  assignment_config: AssignmentConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type RecurrenceConfig = 
  | { type: 'daily' }
  | { type: 'weekly'; days: number[] } // 0=Sunday, 1=Monday, etc.
  | { type: 'monthly'; day: number }; // 1-31

export type AssignmentConfig =
  | { type: 'specific'; personnel_ids: string[] }
  | { type: 'role'; role: 'owner' | 'manager' | 'personnel' };

export interface LeaveDate {
  id: string;
  scheduled_task_id: string;
  personnel_id: string;
  leave_date: string;
  delegate_personnel_id: string | null;
  created_at: string;
}

export interface SkipDate {
  id: string;
  scheduled_task_id: string;
  skip_date: string;
  created_at: string;
}
```

## Edge Function: create-scheduled-task-instances

### Purpose
Runs daily at 00:00 UTC (03:00 TR) to create task instances from scheduled tasks.

### Algorithm

```typescript
async function createScheduledTaskInstances() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay(); // 0=Sunday, 6=Saturday
  const dayOfMonth = today.getDate();
  
  // 1. Fetch all active scheduled tasks
  const scheduledTasks = await fetchActiveScheduledTasks();
  
  for (const task of scheduledTasks) {
    // 2. Check if task should run today
    if (!shouldRunToday(task, dayOfWeek, dayOfMonth)) {
      continue;
    }
    
    // 3. Check for skip dates
    if (await hasSkipDate(task.id, todayStr)) {
      console.log(`Skipping task ${task.id} for ${todayStr}`);
      continue;
    }
    
    // 4. Get assigned personnel
    const assignedPersonnel = await getAssignedPersonnel(task);
    
    for (const personnel of assignedPersonnel) {
      // 5. Check for leave dates
      const leaveDate = await getLeaveDate(task.id, personnel.id, todayStr);
      
      let finalPersonnelId = personnel.id;
      
      if (leaveDate) {
        if (leaveDate.delegate_personnel_id) {
          // Use delegate
          finalPersonnelId = leaveDate.delegate_personnel_id;
        } else {
          // Skip this personnel
          console.log(`Skipping task for ${personnel.id} - on leave without delegate`);
          continue;
        }
      }
      
      // 6. Create task instance
      await createTaskInstance({
        scheduled_task_id: task.id,
        personnel_id: finalPersonnelId,
        description: task.description,
        deadline: todayStr,
        status: 'open',
      });
      
      // 7. Send notification
      await sendNotification(finalPersonnelId, task);
    }
  }
}

function shouldRunToday(task: ScheduledTask, dayOfWeek: number, dayOfMonth: number): boolean {
  switch (task.recurrence_type) {
    case 'daily':
      return true;
    case 'weekly':
      return task.recurrence_config.days.includes(dayOfWeek);
    case 'monthly':
      return task.recurrence_config.day === dayOfMonth;
    default:
      return false;
  }
}
```

## Mobile-First Design Principles

### Touch Targets
- All interactive elements minimum 44x44px
- Adequate spacing between touch targets (8px minimum)
- Large, easy-to-tap buttons

### Bottom Sheet Modals
- Create/Edit modal slides up from bottom on mobile
- Swipe down to dismiss
- Full-screen on small devices

### Swipe Actions
- Swipe left on task card reveals actions
- Edit, Delete, Pause/Resume
- Visual feedback during swipe

### Responsive Layout
```
Mobile (< 640px):
- Single column
- Bottom sheet modals
- Swipe actions
- Compact cards

Tablet (640px - 1024px):
- Two columns
- Side modal
- Hover actions
- Medium cards

Desktop (> 1024px):
- Three columns
- Center modal
- Hover actions
- Large cards
```

### Form Design
- One field per screen on mobile
- Progress indicator for multi-step
- Large input fields
- Native date/time pickers

## Error Handling

### Frontend Validation
- Required field validation
- Format validation (time, date)
- Duplicate name check
- Assignment validation (at least one personnel/role)

### Backend Validation
- RLS policies enforce organization isolation
- Permission checks before mutations
- Unique constraints on skip/leave dates
- Foreign key constraints

### Error Messages
- User-friendly Turkish messages
- Specific error details
- Actionable suggestions
- Toast notifications

## Testing Strategy

### Unit Tests
- Recurrence logic (shouldRunToday)
- Date calculations
- Assignment resolution
- Validation functions

### Integration Tests
- Scheduled task CRUD operations
- Leave date management
- Skip date management
- Task instance creation

### E2E Tests
- Create scheduled task flow
- Edit scheduled task flow
- Add leave date with delegate
- Skip task occurrence
- Bulk operations

## Performance Considerations

### Database Optimization
- Indexes on frequently queried columns
- Efficient joins for task creation
- Batch inserts for multiple task instances
- Query result caching where appropriate

### Frontend Optimization
- Lazy load scheduled task list
- Virtualized list for large datasets
- Debounced search/filter
- Optimistic UI updates

### Cron Job Optimization
- Process tasks in batches
- Parallel processing where safe
- Error recovery and retry logic
- Logging for monitoring

## Security

### RLS Policies
```sql
-- Users can only view scheduled tasks in their organization
CREATE POLICY "Users can view org scheduled tasks"
  ON scheduled_tasks FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Only users with permission can create
CREATE POLICY "Authorized users can create scheduled tasks"
  ON scheduled_tasks FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND has_permission('scheduled_tasks', 'create')
  );

-- Only users with permission can update
CREATE POLICY "Authorized users can update scheduled tasks"
  ON scheduled_tasks FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND has_permission('scheduled_tasks', 'edit')
  );

-- Only users with permission can delete
CREATE POLICY "Authorized users can delete scheduled tasks"
  ON scheduled_tasks FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND has_permission('scheduled_tasks', 'delete')
  );
```

### Edge Function Security
- Service role key for cron job
- Validate all inputs
- Log all operations
- Rate limiting if needed

## Monitoring and Logging

### Cron Job Logs
- Start time
- Tasks processed
- Instances created
- Errors encountered
- End time and duration

### Application Logs
- User actions (create, edit, delete)
- Permission denials
- Validation errors
- API errors

### Metrics
- Scheduled tasks count
- Active vs inactive ratio
- Task instances created per day
- Average processing time
- Error rate

## Future Enhancements

### Phase 2 (Optional)
- Task templates library
- Recurring task analytics
- Email notifications
- Calendar integration
- Task dependencies
- Custom recurrence patterns (every 2 weeks, etc.)
- Bulk import/export
- Task completion tracking
- Performance reports
