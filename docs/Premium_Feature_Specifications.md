# Premium Feature Specifications
## Technical Implementation Guide & Design System

**Component Library, Animations & Data Patterns**  
**January 2026**

---

## 1. Animation & Motion Design

### 1.1 Loading States

**Never show blank screens or raw spinners.** Use skeleton loaders that mirror content structure.

#### Skeleton Loader Implementation

| Component | Skeleton Pattern |
|-----------|------------------|
| **Client List** | 3-5 rows: circle (avatar) + 2 lines (name, email) + badge |
| **Session Card** | Rectangle header + 3 lines text + button placeholder |
| **Dashboard Widget** | Title line + chart area (animated gradient) + footer |
| **Analytics Chart** | Axes + 5-7 vertical bars pulsing in sequence |
| **Profile Page** | Large circle (photo) + 4 text lines + 2 section headers |

#### CSS Animation Code

```css
@keyframes shimmer {
  0% { background-position: -1000px; }
  100% { background-position: 1000px; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
  border-radius: 4px;
}
```

---

### 1.2 Button States & Feedback

| State | Visual | Timing | CSS Transform |
|-------|--------|--------|---------------|
| **Default** | Flat, brand color | 0ms | `background: #1F4788` |
| **Hover** | Lift 2px, shadow | 150ms ease | `transform: translateY(-2px)` |
| **Active** | Scale 98%, deeper | 100ms | `transform: scale(0.98)` |
| **Loading** | Spinner + disable | 0ms | `cursor: not-allowed` |
| **Success** | Green + checkmark | 300ms | `background: #10B981` |
| **Error** | Red + shake | 500ms | `animation: shake` |

#### React Implementation Example

```tsx
const Button = ({ loading, success, onClick, children }) => (
  <button
    className={cn(
      "btn transition-all duration-150",
      loading && "loading cursor-not-allowed",
      success && "success bg-green-500"
    )}
    onClick={onClick}
    disabled={loading}
  >
    {loading && <Spinner className="mr-2" />}
    {success && <CheckIcon className="mr-2" />}
    {!loading && !success && children}
  </button>
);
```

---

### 1.3 Toast Notifications

Temporary alerts that don't interrupt workflow.

#### Toast Specifications

- **Position:** Top-right, 24px from edge
- **Animation In:** Slide from right + fade (300ms)
- **Duration:** 4 seconds (success), 6 seconds (error)
- **Animation Out:** Fade + slide right (200ms)
- **Stacking:** Max 3 visible, older ones fade
- **Progress Bar:** Bottom edge shrinks left-to-right

#### Toast Types

| Type | Color | Icon |
|------|-------|------|
| **Success** | Green #10B981 | Checkmark circle |
| **Error** | Red #EF4444 | X circle |
| **Warning** | Orange #F59E0B | Exclamation triangle |
| **Info** | Blue #3B82F6 | Information circle |

#### Implementation with Sonner

```tsx
import { toast } from 'sonner';

// Success
toast.success('Session scheduled successfully', {
  description: 'Client will receive confirmation email',
  duration: 4000,
});

// Error with action
toast.error('Failed to save changes', {
  description: 'Please try again or contact support',
  action: {
    label: 'Retry',
    onClick: () => handleRetry(),
  },
});
```

---

### 1.4 Progress Indicators

#### Circular Progress Rings

Perfect for goal completion, action item progress, client engagement scores.

- **Size:** Small (40px), Medium (80px), Large (120px)
- **Stroke Width:** 8% of radius
- **Animation:** Animate from 0 to target over 1000ms
- **Color Thresholds:** 0-30% red, 31-70% yellow, 71-100% green
- **Center Text:** Bold percentage number

#### SVG Implementation

```tsx
const ProgressRing = ({ progress, size = 80 }) => {
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  const color = progress >= 71 ? '#10B981' : 
                progress >= 31 ? '#F59E0B' : '#EF4444';

  return (
    <svg width={size} height={size}>
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        className="font-bold"
        fontSize={size * 0.25}
      >
        {progress}%
      </text>
    </svg>
  );
};
```

#### Linear Progress Bars

- **Height:** 8px (default), 12px (emphasis)
- **Background:** Light gray #E5E7EB
- **Fill:** Gradient primary color
- **Border Radius:** Full rounded (pill shape)
- **Animation:** Smooth width transition 500ms

```tsx
const ProgressBar = ({ progress }) => (
  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
    <div 
      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
      style={{ width: `${progress}%` }}
    />
  </div>
);
```

---

## 2. Dashboard Component Library

### 2.1 Widget System Architecture

Every widget follows this pattern:

1. **Header:** Title + optional action button
2. **Body:** Main content (chart, list, stats)
3. **Footer:** Optional metadata or link

#### Widget Sizes

| Size | Grid Columns | Use Case |
|------|--------------|----------|
| **Small** | 1 of 4 (25%) | Single metric, icon + number |
| **Medium** | 2 of 4 (50%) | Chart or short list |
| **Large** | 4 of 4 (100%) | Table or detailed chart |
| **Tall** | 2 cols × 2 rows | Calendar or activity feed |

---

### 2.2 Essential Widget Specifications

#### 1. Upcoming Sessions Widget

| Property | Specification |
|----------|---------------|
| **Size** | Large (full width) or Tall (2×2) |
| **Content** | Next 5 sessions with client name, time, countdown |
| **Actions** | Join button (if <15min), Cancel, Reschedule |
| **States** | Today (green), Tomorrow (blue), Future (gray) |
| **Empty** | Illustration + 'Schedule your first session' CTA |
| **Refresh** | Auto-refresh every 60 seconds |

```tsx
const UpcomingSessionsWidget = () => {
  const sessions = useUpcomingSessions(5);
  
  return (
    <Widget title="Upcoming Sessions" size="large">
      <div className="space-y-3">
        {sessions.map(session => (
          <SessionCard 
            key={session.id}
            session={session}
            showCountdown
            actions={['join', 'reschedule', 'cancel']}
          />
        ))}
      </div>
      {sessions.length === 0 && (
        <EmptyState 
          icon={<CalendarIcon />}
          message="No upcoming sessions"
          action={<Button>Schedule Session</Button>}
        />
      )}
    </Widget>
  );
};
```

---

#### 2. Revenue Widget

| Property | Specification |
|----------|---------------|
| **Size** | Medium (2 columns) |
| **Primary** | Large dollar amount (this month) |
| **Sparkline** | 30px mini line chart (last 6 months) |
| **Comparison** | vs last month with % change and arrow |
| **Footer** | 'View details' link to full analytics |
| **Animation** | Count-up animation on load (1 second) |

```tsx
const RevenueWidget = () => {
  const { current, previous, trend } = useMonthlyRevenue();
  const change = ((current - previous) / previous * 100).toFixed(1);
  
  return (
    <Widget title="Revenue This Month" size="medium">
      <div className="space-y-4">
        <div className="flex items-baseline gap-2">
          <CountUp 
            end={current} 
            prefix="$" 
            duration={1}
            className="text-4xl font-bold"
          />
          <Sparkline data={trend} height={30} color="#1F4788" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          {change > 0 ? (
            <TrendingUp className="text-green-500" />
          ) : (
            <TrendingDown className="text-red-500" />
          )}
          <span className={change > 0 ? 'text-green-500' : 'text-red-500'}>
            {change}% vs last month
          </span>
        </div>
      </div>
      <WidgetFooter>
        <Link href="/analytics">View details →</Link>
      </WidgetFooter>
    </Widget>
  );
};
```

---

#### 3. Client Engagement Widget

| Property | Specification |
|----------|---------------|
| **Size** | Medium (2 columns) |
| **Score** | 0-100 calculated from: logins + actions + messages |
| **Visual** | Progress ring (120px) with color threshold |
| **Heat Map** | 7-day grid showing activity intensity |
| **Alert** | Red badge if score <30 (at-risk client) |
| **Action** | 'Contact low-engagement clients' button |

```tsx
const ClientEngagementWidget = () => {
  const { averageScore, weeklyActivity, atRisk } = useEngagement();
  
  return (
    <Widget title="Client Engagement" size="medium">
      <div className="flex items-center justify-between">
        <ProgressRing progress={averageScore} size={120} />
        <div className="flex-1 pl-6">
          <HeatMap data={weeklyActivity} />
          {atRisk > 0 && (
            <Alert variant="warning" className="mt-4">
              {atRisk} client{atRisk > 1 ? 's' : ''} need attention
              <Button size="sm" variant="outline">Contact</Button>
            </Alert>
          )}
        </div>
      </div>
    </Widget>
  );
};
```

---

#### 4. Quick Actions Widget

| Property | Specification |
|----------|---------------|
| **Size** | Medium (2 columns) |
| **Layout** | 2×2 or 3×2 grid of action cards |
| **Actions** | Schedule Session, Add Note, Create Invoice, Upload Resource |
| **Style** | Icon + label, hover lifts card |
| **Modal** | Open in-place modal (not navigate away) |
| **Shortcut** | Show keyboard shortcut on hover |

```tsx
const QuickActionsWidget = () => {
  const actions = [
    { id: 'schedule', icon: <Calendar />, label: 'Schedule Session', shortcut: 'Cmd+S' },
    { id: 'note', icon: <FileText />, label: 'Add Note', shortcut: 'Cmd+N' },
    { id: 'invoice', icon: <DollarSign />, label: 'Create Invoice', shortcut: 'Cmd+I' },
    { id: 'resource', icon: <Upload />, label: 'Upload Resource', shortcut: 'Cmd+U' },
  ];
  
  return (
    <Widget title="Quick Actions" size="medium">
      <div className="grid grid-cols-2 gap-3">
        {actions.map(action => (
          <ActionCard
            key={action.id}
            icon={action.icon}
            label={action.label}
            shortcut={action.shortcut}
            onClick={() => handleAction(action.id)}
          />
        ))}
      </div>
    </Widget>
  );
};
```

---

## 3. Data Visualization Library

### 3.1 Chart Design Principles

Modern coaching platforms use minimal, readable charts that prioritize insight over decoration.

#### Universal Chart Rules

- **No 3D effects:** Flat design only
- **Minimal gridlines:** Light gray, only horizontal
- **Limited colors:** Max 5 colors per chart
- **Clear labels:** Direct labeling > legends when possible
- **Responsive:** Adapt to container size
- **Animation:** Smooth transitions, not jarring

---

### 3.2 Chart Type Specifications

#### Line Charts

**Use for:** Revenue over time, client growth, session trends

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const RevenueLineChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <XAxis 
        dataKey="month" 
        stroke="#9CA3AF"
        style={{ fontSize: 12 }}
      />
      <YAxis 
        stroke="#9CA3AF"
        style={{ fontSize: 12 }}
        tickFormatter={(value) => `$${value/1000}k`}
      />
      <Tooltip 
        contentStyle={{
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
        }}
      />
      <Line 
        type="monotone"
        dataKey="revenue"
        stroke="#1F4788"
        strokeWidth={3}
        dot={{ fill: '#1F4788', r: 4 }}
        activeDot={{ r: 6 }}
      />
    </LineChart>
  </ResponsiveContainer>
);
```

---

#### Bar Charts

**Use for:** Sessions per client, theme usage, comparison metrics

```tsx
const SessionsBarChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <XAxis dataKey="client" />
      <YAxis />
      <Tooltip />
      <Bar 
        dataKey="sessions" 
        fill="#1F4788"
        radius={[8, 8, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
);
```

---

#### Sparklines

**Use for:** Tiny trend indicators next to metrics

```tsx
const Sparkline = ({ data, height = 30, color = '#1F4788' }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width="100" height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
};
```

---

#### Heat Maps

**Use for:** Engagement by day of week, activity patterns

```tsx
const HeatMap = ({ data }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxValue = Math.max(...data);
  
  return (
    <div className="flex gap-1">
      {days.map((day, i) => {
        const intensity = data[i] / maxValue;
        const opacity = 0.2 + (intensity * 0.8);
        return (
          <div key={day} className="flex flex-col items-center gap-1">
            <div 
              className="w-8 h-8 rounded"
              style={{ 
                background: `rgba(31, 71, 136, ${opacity})` 
              }}
              title={`${day}: ${data[i]} activities`}
            />
            <span className="text-xs text-gray-500">{day[0]}</span>
          </div>
        );
      })}
    </div>
  );
};
```

---

## 4. Notification System

### 4.1 Notification Priority Levels

| Level | Badge | Channels | Auto-Dismiss | Sound |
|-------|-------|----------|--------------|-------|
| **Critical** | Red, pulsing | Push + Email + In-app | No | Yes |
| **Important** | Orange | In-app only | 10 seconds | No |
| **Info** | Blue | In-app, digest mode | 6 seconds | No |

### 4.2 Notification Components

```tsx
const NotificationBell = () => {
  const { unread, notifications } = useNotifications();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            Mark all read
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.map(notif => (
            <NotificationItem key={notif.id} notification={notif} />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

---

## 5. Form Patterns

### 5.1 Form Validation

```tsx
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const sessionSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  date: z.date(),
  duration: z.number().min(15).max(240),
  meetingLink: z.string().url().optional(),
  notes: z.string().max(5000).optional(),
});

const SessionForm = () => {
  const form = useForm({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      duration: 60,
    },
  });
  
  const onSubmit = async (data) => {
    try {
      await createSession(data);
      toast.success('Session scheduled');
    } catch (error) {
      toast.error('Failed to schedule session');
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField name="clientId" label="Client" required>
          <ClientSelect />
        </FormField>
        <FormField name="date" label="Date & Time" required>
          <DateTimePicker />
        </FormField>
        <FormField name="duration" label="Duration (minutes)">
          <Input type="number" />
        </FormField>
        <FormField name="meetingLink" label="Meeting Link">
          <Input placeholder="https://zoom.us/..." />
        </FormField>
        <Button type="submit" loading={form.formState.isSubmitting}>
          Schedule Session
        </Button>
      </form>
    </Form>
  );
};
```

---

## 6. Mobile Responsiveness

### 6.1 Breakpoint Strategy

```css
/* Tailwind breakpoints */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### 6.2 Responsive Patterns

#### Dashboard Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Widgets automatically reflow */}
</div>
```

#### Navigation

```tsx
{/* Desktop: Sidebar */}
<aside className="hidden lg:block w-64 border-r">
  <Sidebar />
</aside>

{/* Mobile: Bottom tabs or hamburger menu */}
<nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-white">
  <BottomNav />
</nav>
```

---

## 7. Performance Optimization

### 7.1 Code Splitting

```tsx
// Lazy load heavy components
const AnalyticsPage = lazy(() => import('./pages/Analytics'));
const ClientProfile = lazy(() => import('./pages/ClientProfile'));

<Suspense fallback={<PageSkeleton />}>
  <AnalyticsPage />
</Suspense>
```

### 7.2 Image Optimization

```tsx
import Image from 'next/image';

<Image
  src={client.avatar}
  alt={client.name}
  width={40}
  height={40}
  className="rounded-full"
  loading="lazy"
/>
```

### 7.3 Database Query Optimization

```typescript
// Use TanStack Query for caching
const { data: clients } = useQuery({
  queryKey: ['clients'],
  queryFn: fetchClients,
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Optimistic updates
const mutation = useMutation({
  mutationFn: updateClient,
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['client', newData.id]);
    const previous = queryClient.getQueryData(['client', newData.id]);
    queryClient.setQueryData(['client', newData.id], newData);
    return { previous };
  },
});
```

---

## 8. Accessibility (a11y)

### 8.1 Essential Patterns

- **Keyboard Navigation:** All interactive elements accessible via Tab
- **Focus Indicators:** Clear focus rings on all focusable elements
- **ARIA Labels:** Screen reader support for icons and complex widgets
- **Color Contrast:** WCAG AA minimum (4.5:1 for text)
- **Error Announcements:** Screen reader announcements for errors

```tsx
<button
  aria-label="Schedule new session"
  onClick={handleSchedule}
>
  <Calendar aria-hidden="true" />
</button>
```

---

## 9. Implementation Checklist

### Phase 1: Core Animations (Week 1)
- [ ] Skeleton loaders for all async content
- [ ] Button hover/active states
- [ ] Toast notification system
- [ ] Progress indicators (rings + bars)

### Phase 2: Dashboard Widgets (Week 2)
- [ ] Widget container component
- [ ] Upcoming sessions widget
- [ ] Revenue widget with sparkline
- [ ] Client engagement widget
- [ ] Quick actions widget

### Phase 3: Charts (Week 3)
- [ ] Line chart for revenue trends
- [ ] Bar chart for comparisons
- [ ] Sparklines for inline trends
- [ ] Heat maps for engagement

### Phase 4: Polish (Week 4)
- [ ] Notification system
- [ ] Form validation patterns
- [ ] Mobile responsiveness
- [ ] Accessibility audit

---

## 🎯 Result: Premium-feeling platform that delights users
