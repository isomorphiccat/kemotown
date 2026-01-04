# Kemotown UI Component Library

Complete component library for Kemotown v1 built with React 19, Tailwind CSS 4, and Radix UI.

## 📦 Component Categories

### UI Primitives (`/ui`)
Foundational components following shadcn/ui patterns:
- **Button** - Multiple variants and sizes
- **Card** - Content containers with header/footer
- **Input** - Text input fields
- **Textarea** - Multi-line text with character count
- **Select** - Dropdown selects with Radix UI
- **Dialog** - Modal dialogs
- **Dropdown Menu** - Context menus
- **Tabs** - Tab navigation
- **Tooltip** - Hover tooltips

### Shared Components (`/shared`)
Reusable components for common patterns:
- **Avatar** - User avatars with fallback
- **ErrorBoundary** - React error boundaries
- **LoadingState** - Loading indicators and skeletons
- **EmptyState** - Empty content displays
- **Badge** - Status badges
- **Pagination** - Page navigation
- **ConfirmDialog** - Confirmation modals
- **Toast** - Notification system

### Layout Components (`/layout`)
Page structure and navigation:
- **Header** - Main navigation bar
- **Sidebar** - Mobile sidebar menu
- **Footer** - Site footer
- **Container** - Responsive page containers
- **PageHeader** - Page titles with breadcrumbs

### Form Components (`/forms`)
Advanced form inputs:
- **FormField** - Form field wrapper with labels/errors
- **MarkdownEditor** - Markdown editor with preview
- **TagInput** - Tag input with autocomplete
- **ImageUpload** - Image upload with drag-and-drop
- **DateTimePicker** - Korean-friendly date/time picker

## 🚀 Usage

### Import Components

```typescript
// UI primitives
import { Button, Card, Input } from '@/components/ui';

// Shared components
import { Avatar, Badge, LoadingState } from '@/components/shared';

// Layout components
import { Header, Container, PageHeader } from '@/components/layout';

// Form components
import { FormField, MarkdownEditor } from '@/components/forms';
```

### Example: Button

```tsx
import { Button } from '@/components/ui/button';

export function MyComponent() {
  return (
    <div className="flex gap-2">
      <Button variant="default">기본 버튼</Button>
      <Button variant="outline">외곽선 버튼</Button>
      <Button variant="destructive">삭제 버튼</Button>
      <Button size="sm">작은 버튼</Button>
      <Button size="lg">큰 버튼</Button>
    </div>
  );
}
```

### Example: Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function MyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>카드 제목</CardTitle>
      </CardHeader>
      <CardContent>
        <p>카드 내용입니다.</p>
      </CardContent>
    </Card>
  );
}
```

### Example: Form with Validation

```tsx
import { FormField } from '@/components/forms/FormField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function ProfileForm() {
  return (
    <form>
      <FormField
        label="사용자명"
        htmlFor="username"
        required
        error={errors.username}
      >
        <Input id="username" {...register('username')} />
      </FormField>

      <FormField
        label="자기소개"
        htmlFor="bio"
        description="간단히 자신을 소개해주세요"
      >
        <Textarea
          id="bio"
          maxLength={500}
          showCount
          {...register('bio')}
        />
      </FormField>
    </form>
  );
}
```

### Example: Markdown Editor

```tsx
import { MarkdownEditor } from '@/components/forms/MarkdownEditor';

export function EventForm() {
  const [description, setDescription] = useState('');

  return (
    <MarkdownEditor
      value={description}
      onChange={setDescription}
      placeholder="이벤트 설명을 작성하세요"
      maxLength={10000}
    />
  );
}
```

### Example: Toast Notifications

```tsx
'use client';

import { ToastProvider, useToast } from '@/components/shared/Toast';

function MyApp({ children }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}

function MyComponent() {
  const { addToast } = useToast();

  const handleSave = () => {
    addToast({
      type: 'success',
      title: '저장 완료',
      description: '프로필이 성공적으로 저장되었습니다.',
    });
  };

  return <button onClick={handleSave}>저장</button>;
}
```

## 🎨 Styling

### Using the cn() Utility

All components accept a `className` prop that is merged with default styles using the `cn()` utility:

```tsx
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

<Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
  커스텀 스타일 버튼
</Button>
```

### Korean Text Support

Use the `font-korean` class for proper Korean text rendering:

```tsx
<p className="font-korean">
  한글 텍스트는 자동으로 줄바꿈이 최적화됩니다.
</p>
```

### Dark Mode

All components support dark mode automatically through CSS variables:

```css
/* Defined in globals.css */
.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

## ♿ Accessibility

All components follow accessibility best practices:
- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Focus visible states
- Screen reader friendly
- Color contrast compliance

## 🌍 Internationalization

Translation files are located in `/src/i18n/messages/`:
- `ko.json` - Korean translations
- `en.json` - English translations

```typescript
import { getTranslation } from '@/i18n/config';

const t = await getTranslation('ko');
console.log(t.common.loading); // "로딩 중..."
```

## 📚 Component API Reference

### Button

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `default \| destructive \| outline \| secondary \| ghost \| link` | `default` | Button style variant |
| size | `default \| sm \| lg \| icon` | `default` | Button size |
| className | `string` | - | Additional CSS classes |

### Avatar

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| src | `string \| null` | - | Image URL |
| alt | `string` | - | Alt text for image |
| fallback | `string` | - | Fallback text (first letter of alt if not provided) |
| size | `xs \| sm \| md \| lg \| xl` | `md` | Avatar size |

### Badge

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `default \| secondary \| destructive \| outline \| success \| warning \| info` | `default` | Badge variant |

### Pagination

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| currentPage | `number` | - | Current page number |
| totalPages | `number` | - | Total number of pages |
| onPageChange | `(page: number) => void` | - | Page change handler |
| showFirstLast | `boolean` | `true` | Show first/last buttons |

## 🔧 Customization

### Adding New Variants

Use `class-variance-authority` to add new variants:

```typescript
import { cva } from 'class-variance-authority';

const myComponentVariants = cva(
  'base-classes',
  {
    variants: {
      variant: {
        default: 'variant-classes',
        custom: 'custom-classes',
      },
    },
  }
);
```

### Extending Components

All components use `forwardRef` and can be extended:

```tsx
import { Button } from '@/components/ui/button';

const IconButton = forwardRef<HTMLButtonElement, ButtonProps & { icon: ReactNode }>(
  ({ icon, children, ...props }, ref) => (
    <Button ref={ref} {...props}>
      {icon}
      {children}
    </Button>
  )
);
```

## 📝 Best Practices

1. **Always use the cn() utility** for className merging
2. **Add font-korean class** for Korean text content
3. **Use semantic HTML** elements where possible
4. **Provide ARIA labels** for interactive elements
5. **Test keyboard navigation** in all components
6. **Support dark mode** through CSS variables
7. **Keep components client-side only when necessary** - use 'use client' directive sparingly

## 🐛 Troubleshooting

### Component not rendering
- Check if you've imported from the correct path
- Verify all required props are provided
- Check console for TypeScript errors

### Styles not applying
- Ensure Tailwind CSS is properly configured
- Check if custom classes are in the Tailwind safelist
- Verify CSS variables are defined in globals.css

### TypeScript errors
- Update to latest @types packages
- Ensure strict mode is enabled in tsconfig.json
- Check component prop types match usage

## 📄 License

MIT License - Part of the Kemotown project
