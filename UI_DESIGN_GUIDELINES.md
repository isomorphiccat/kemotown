# Kemotown UI Design Guidelines

**Version:** 1.2  
**Date:** May 22, 2025  
**For:** UI Generation Agent

## Overview

Design guidelines for generating UI elements for Kemotown, a Korean furry community platform. Emphasizes a "cute but modern" aesthetic inspired by Naver Band and Google Material Design.

## 1. Design Philosophy

- **Simple, cute, and modern** - Welcoming to Korean furry community
- **Non-green color palette** - Purple/amber theme
- **Community-focused** - Social connection emphasis
- **Korean cultural sensitivity** - Respectful language and UX patterns

## 2. Color Palette

### Primary Colors
```css
/* Light Theme */
--primary: #8b5cf6        /* Purple */
--primary-hover: #7c3aed
--accent: #fbbf24         /* Amber */
--accent-hover: #f59e0b

/* Dark Theme */
--primary: #a855f7
--primary-hover: #9333ea
--accent: #f59e0b
--accent-hover: #d97706
```

### Semantic Colors
```css
--destructive: #ef4444    /* Red - errors/deletion */
--success: #10b981        /* Green - success states */
--warning: #f59e0b        /* Amber - warnings */
--muted: #6b7280          /* Gray - secondary text */
```

### Usage Guidelines
- **Purple**: Primary actions, branding, focus states
- **Amber**: Secondary accents, highlights  
- **Green**: "Attending" status, success states
- **Yellow**: "Considering" status, warnings
- **Red**: "Not attending" status, destructive actions

## 3. Typography

### Font System
```css
/* Korean Text */
.font-korean {
  font-family: var(--font-noto-sans-kr, ui-sans-serif, system-ui, sans-serif);
}
```

### Typography Scale
```css
h1: text-3xl font-bold     /* Page titles */
h2: text-2xl font-bold     /* Section headers */
h3: text-xl font-semibold  /* Card titles */
h4: text-lg font-semibold  /* Subsections */
body: text-base            /* Main content */
small: text-sm             /* Secondary text */
```

### Korean Guidelines
- Always use `font-korean` class for Korean content
- Line-height: 1.6 for readability
- Korean date/time formatting (`ko-KR` locale)
- Currency: `₩12,000` or `12,000원`

## 4. Layout Patterns

### Container & Spacing
```css
.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
/* Standard spacings: space-y-4 (16px), space-y-6 (24px), space-y-8 (32px) */
/* Card padding: p-6 (24px) */
```

### Grid Systems
```css
/* Dashboard: lg:grid-cols-3 (2fr main + 1fr sidebar) */
/* Content Grid: grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 */
```

## 5. Core Components

### Cards
```jsx
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle className="font-korean">제목</CardTitle>
    <CardDescription className="font-korean">설명</CardDescription>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
</Card>
```

### Buttons
```jsx
<Button variant="default">      <!-- Purple primary -->
<Button variant="outline">      <!-- Outlined -->
<Button variant="ghost">        <!-- Minimal -->
<Button variant="destructive">  <!-- Red destructive -->
```

### Avatars
```jsx
<div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
  <span className="text-primary text-sm font-bold">
    {(furryName || username).charAt(0).toUpperCase()}
  </span>
</div>
```

### Form Inputs
```jsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
    레이블 *
  </label>
  <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors" />
</div>
```

## 6. Visual Elements

### Border Radius
- `rounded-lg` (8px) - Most common
- `rounded-full` - Avatars, tags, pills

### Shadows & Transitions
- `shadow-sm` - Subtle depth
- `hover:shadow-lg` - Interactive cards
- `transition-colors` - Color changes
- `duration-200` - Standard timing

## 7. Page Structure

### Header Template
```jsx
<header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b sticky top-0 z-10">
  <div className="container mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-lg">K</span>
        </div>
        <h1 className="text-2xl font-bold text-primary font-korean">Kemotown</h1>
      </div>
      <nav>{/* Navigation */}</nav>
    </div>
  </div>
</header>
```

### Page Wrapper
```jsx
<div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
  <Header />
  <main className="container mx-auto px-4 py-8">
    {/* Page content */}
  </main>
</div>
```

## 8. Interactive States

### Loading States
```jsx
<p className="text-gray-700 dark:text-gray-300 font-korean">로딩 중...</p>
<Button disabled className="opacity-50">저장 중...</Button>
```

### Status Indicators
```jsx
// RSVP Status
<span className="px-2 py-1 text-xs rounded-full font-korean bg-green-100 text-green-800">참가 확정</span>
<span className="px-2 py-1 text-xs rounded-full font-korean bg-yellow-100 text-yellow-800">참가 고려</span>
<span className="px-2 py-1 text-xs rounded-full font-korean bg-red-100 text-red-800">불참</span>
```

### Error/Success Messages
```jsx
<div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-4">
  <p className="text-sm text-red-600 font-korean">{error}</p>
</div>
<div role="status" className="bg-green-50 border border-green-200 rounded-lg p-4">
  <p className="text-sm text-green-600 font-korean">{success}</p>
</div>

## 9. Responsive Design

### Breakpoints
```css
sm: 640px    /* Small tablets */
md: 768px    /* Tablets */
lg: 1024px   /* Desktops */
xl: 1280px   /* Large desktops */
```

### Mobile Patterns
- Mobile-first approach
- Touch targets minimum 44px
- Bottom navigation for mobile
- Stacked forms on small screens

## 10. Community-Specific Patterns

### Event Cards
```jsx
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle className="font-korean">{eventTitle}</CardTitle>
    <CardDescription className="font-korean">
      {formatDate(startDate)} • {location}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600 font-korean">
        {attendeeCount}/{attendeeCap} 참가
      </span>
      <RSVPStatusBadge status={rsvpStatus} />
    </div>
  </CardContent>
</Card>
```

### Timeline/Activity Feed
```jsx
<div className="space-y-4">
  {timeline.map(item => (
    <div key={item.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
      <Avatar />
      <div className="flex-1">
        <p className="font-korean">
          <span className="font-semibold">{username}</span>
          {actionDescription}
        </p>
        <p className="text-xs text-gray-500 font-korean">{timeAgo}</p>
      </div>
    </div>
  ))}
</div>

### User Discovery Cards
```jsx
<Card className="hover:shadow-lg transition-shadow">
  <CardContent className="text-center p-6">
    <Avatar size="large" />
    <h3 className="font-semibold text-gray-900 dark:text-white font-korean mt-4">
      {furryName || username}
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-300 font-korean">@{username}</p>
    <div className="flex flex-wrap justify-center gap-1 mt-3">
      {interestTags.map((tag, idx) => (
        <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-korean">
          {tag}
        </span>
      ))}
    </div>
    <Button className="mt-4 w-full font-korean">프로필 보기</Button>
  </CardContent>
</Card>
```

## 11. Korean UX Patterns

### Community Terminology
```jsx
const terms = {
  fursuit: '퍼슈트',
  fursona: '퍼소나', 
  meetup: '모임',
  bump: '범프' // In-person interaction
};
```

### Date/Time Formatting
```jsx
// Korean locale with proper formatting
{new Date().toLocaleDateString('ko-KR', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
})}
```

## 12. Quality Checklist

### Implementation Requirements
- [ ] Korean text uses `font-korean` class
- [ ] Colors follow defined palette
- [ ] Responsive design (mobile-first)
- [ ] Dark mode compatibility
- [ ] Touch targets minimum 44px
- [ ] Loading states with Korean text
- [ ] Hover/focus states implemented

### Testing Requirements
- [ ] Light and dark mode functionality
- [ ] Korean text rendering
- [ ] Mobile device responsiveness
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Color contrast ratios (4.5:1 minimum)
- [ ] Interactive states and animations