# Frontend Implementation Guide

> **For AI agents and developers.** Read this whole file before writing any code in this project.
> If something you are about to do contradicts this guide, the guide wins. If the guide does not cover it, ask the developer instead of guessing.
>
> Agents load this guide through `AGENTS.md` / `CLAUDE.md` at the project root, which hold the per-task checklist.

---

## 1. Stack

| Concern            | Library                                                             |
| ------------------ | ------------------------------------------------------------------- |
| Framework          | Next.js (App Router) with `output: 'export'` (static SPA)           |
| Language           | TypeScript (strict)                                                 |
| UI primitives      | MUI (`@mui/material`, `@mui/icons-material`)                        |
| Layout & utilities | Tailwind CSS v4                                                     |
| Server state       | TanStack Query v5                                                   |
| Forms & tables     | `@msflib/react-components` (`FormBuilder`, `TableWidget`)           |
| Auth, API client   | `@msflib/react-auth`, `@msflib/core`                                |
| Toasts             | `react-toastify`                                                    |
| Icons              | `@mui/icons-material` first, `react-icons` as fallback              |
| E2E tests          | Playwright                                                          |
| Package manager    | **pnpm only**. Never use npm or yarn; never commit other lockfiles. |

Do not add a new dependency when one of the above already solves the problem. Ask before adding any new package.

---

## 2. Golden Rules

1. **msflib first.** Use an `@msflib/*` package whenever one covers the need. Build locally only when none does.
2. **MUI second.** Project components are built on top of MUI. Build from scratch only when MUI has no suitable primitive.
3. **`snake_case` for all data** that crosses the API boundary: payloads, response types, form field names, mock data, table column `field`s.
4. **One `manage` page** handles create and update. `?id=` switches it to update mode.
5. **No dynamic route segments.** Use query params (`?id=`), because the app is statically exported.
6. **Files live where they belong.** Root folders for shared concerns; nearest common parent for route-specific components.
7. **Follow the naming pattern**: `<entity>.<kind>.ts` for non-component files, `PascalCase.tsx` for components.
8. **Tokens, not values.** Colours, radii, fonts and typography come from `theme/theme.css`.
9. **Clean, typed code.** No `any` unless unavoidable, no dead code, no commented-out code, no comments that restate the code.
10. **Pages are thin.** `page.tsx` renders one feature component; logic lives in components and hooks.
11. **Never invent** endpoints, fields, props or package APIs. Read the source/types or ask.

---

## 3. Folder Structure

```text
.
├── AGENTS.md / CLAUDE.md        # Agent entry points (load this guide)
├── app/                        # Routes only (see below)
├── api/                        # API functions: <entity>.api.ts
├── assets/                     # Imported images/svgs + index.ts barrel
├── columns/                    # ALL TableWidget column definitions: <entity>.column.ts(x)
├── components/                 # Global reusable components: App*.tsx
├── constant/                   # App-wide constants: <name>.constant.ts
├── context/                    # React context providers: <Name>Provider.tsx
├── data/                       # Shared static/mock data: <entity>.data.ts
├── docs/                       # Project docs, including this guide
├── dynamics/                   # next/dynamic (ssr: false) wrappers for client-only libs
├── hooks/                      # TanStack Query + custom hooks: <entity>.hooks.ts
├── lib/                        # App bootstrapping (application.config.ts)
├── public/                     # Static files served as-is
├── styles/                     # Shared sx/style objects: <name>.styles.ts
├── tests/                      # Playwright specs: <feature>.spec.ts
├── theme/                      # theme.css (tokens), theme.config.ts (MUI), ThemeProvider.tsx
├── types/                      # ALL shared types: <entity>.types.ts
└── utils/                      # Pure helper functions: <name>.utils.ts
```

Do **not** create new top-level folders. If nothing fits, ask.

### `app/` route groups

```text
app/
├── layout.tsx                  # Root layout (html/body, global css)
├── Provider.tsx                # All client providers (QueryClient, Theme, Auth, msflib modules)
├── (public)/                   # Unauthenticated marketing/landing pages
│   ├── components/
│   ├── data/
│   ├── layout.tsx
│   └── page.tsx
├── (auth)/                     # Login, register, forgot password, verification
│   ├── components/             # Shared by all auth screens (AuthWrapper, ...)
│   ├── layout.tsx
│   └── login/
│       ├── components/Login.tsx
│       ├── data/
│       │   ├── form/
│       │   │   ├── login.form.ts
│       │   │   └── login.layout.tsx
│       │   └── data.ts
│       └── page.tsx
└── (protected)/                # Authenticated app (dashboard shell)
    ├── components/             # DashboardLayout, Sidebar, Header, Breadcrumbs
    ├── data/navigation.ts      # Sidebar links
    ├── layout.tsx
    └── admin/
        └── lesson/
            ├── page.tsx        # list
            ├── manage/page.tsx # create + update
            └── view/page.tsx   # detail
```

Route groups `(public)`, `(auth)`, `(protected)` **do not appear in the URL**. `app/(protected)/admin/lesson/page.tsx` is served at `/admin/lesson`, not `/protected/admin/lesson`.

---

## 4. Placement Rules (Colocation)

| What                         | Where                                                             |
| ---------------------------- | ----------------------------------------------------------------- |
| Global reusable component    | `components/App<Name>.tsx`                                        |
| Route-specific component     | `components/` of the **nearest common parent route** that uses it |
| Form elements + form layout  | `<route>/data/form/` of the route that renders the form           |
| Route-local static/mock data | `<route>/data/data.ts`                                            |
| Shared static/mock data      | `data/<entity>.data.ts`                                           |
| Table columns                | `columns/<entity>.column.ts` (always root, never inside a route)  |
| Types                        | `types/<entity>.types.ts` (always root)                           |
| API calls                    | `api/<entity>.api.ts`                                             |
| Data-fetching hooks          | `hooks/<entity>.hooks.ts`                                         |
| Client-only dynamic imports  | `dynamics/<Name>.tsx`                                             |
| Shared sx / style objects    | `styles/<name>.styles.ts`                                         |
| Constants, enums, route map  | `constant/<name>.constant.ts`                                     |

### Nearest common parent

```text
app/(protected)/admin/
├── components/          # used by BOTH user/ and tenant/  → goes here
├── user/
│   └── components/      # used only by user/              → goes here
└── tenant/
    └── components/      # used only by tenant/            → goes here
```

- Used by one route → that route's `components/`.
- Used by siblings → their parent's `components/`.
- Used across route groups or unrelated areas → promote to root `components/` with an `App` prefix.
- When a component gains a second consumer, **move** it up; never duplicate it.

---

## 5. File Naming

### Non-component files: `<entity>.<kind>.ts`

Entity is lowercase, singular, kebab-case for multiple words (`lesson-plan.types.ts`).

| Kind        | Example              | Contains                                  |
| ----------- | -------------------- | ----------------------------------------- |
| `.column`   | `user.column.ts`     | `TableColumn<Entity>[]` for `TableWidget` |
| `.data`     | `user.data.ts`       | Static or mock data                       |
| `.form`     | `user.form.ts`       | `FormElement[]` for `FormBuilder`         |
| `.layout`   | `user.layout.tsx`    | `FormBuilder` layout component            |
| `.styles`   | `user.styles.ts`     | `sx` / style objects                      |
| `.types`    | `user.types.ts`      | Interfaces and types                      |
| `.hooks`    | `user.hooks.ts`      | TanStack Query hooks                      |
| `.api`      | `user.api.ts`        | API functions                             |
| `.constant` | `routes.constant.ts` | Constants                                 |
| `.utils`    | `date.utils.ts`      | Pure helpers                              |
| `.spec`     | `user.spec.ts`       | Playwright tests                          |

Use `.ts` by default. Use `.tsx` **only** if the file contains JSX (e.g. `user.layout.tsx`, or `user.column.tsx` when a column uses `renderCell`). The base name stays the same.

The route-local data file is always named `data.ts`.

### Components: `PascalCase.tsx`

| Scope                       | Pattern          | Examples                                                                                |
| --------------------------- | ---------------- | --------------------------------------------------------------------------------------- |
| Global (root `components/`) | `App` prefix     | `AppButton.tsx`, `AppModal.tsx`, `AppStatusChip.tsx`                                    |
| Feature / route             | Domain name      | `User.tsx`, `UserBoard.tsx`, `UserStories.tsx`, `ManageLesson.tsx`, `LessonDetails.tsx` |
| Context providers           | `<Name>Provider` | `CartProvider.tsx`                                                                      |
| Dynamic wrappers            | Wrapped name     | `dynamics/FormBuilder.tsx`, `dynamics/TableWidget.tsx`                                  |

- One component per file; default export named the same as the file.
- Route files keep Next.js names: `page.tsx`, `layout.tsx`, `loading.tsx`, `not-found.tsx`.

### Identifiers

| Thing                         | Convention            | Example                                    |
| ----------------------------- | --------------------- | ------------------------------------------ |
| Components, types, interfaces | `PascalCase`          | `LessonDetails`, `Lesson`, `LessonPayload` |
| Variables, functions, hooks   | `camelCase`           | `lessonColumns`, `useLessons`              |
| Constants                     | `UPPER_SNAKE_CASE`    | `DEFAULT_PAGE_SIZE`, `ROUTES`              |
| Data keys (API, forms, mocks) | `snake_case`          | `first_name`, `created_at`                 |
| Folders                       | lowercase, kebab-case | `lesson-plan/`                             |

---

## 6. Routing

The app is built with `output: 'export'`, so it is a static site. This means:

- **No dynamic segments** (`[id]`, `[...slug]`). Pass identifiers as query params.
- No server-only features: no Server Actions, no `app/api` route handlers, no `cookies()`/`headers()`, no middleware, no ISR/revalidation. All data fetching is client-side via TanStack Query.
- `next/image` requires `unoptimized` (set globally in `next.config.ts`).

### CRUD route pattern

| Screen | Route                                 | Folder                         |
| ------ | ------------------------------------- | ------------------------------ |
| List   | `/admin/lesson`                       | `admin/lesson/page.tsx`        |
| Create | `/admin/lesson/manage`                | `admin/lesson/manage/page.tsx` |
| Update | `/admin/lesson/manage?id={lesson_id}` | same page                      |
| View   | `/admin/lesson/view?id={lesson_id}`   | `admin/lesson/view/page.tsx`   |

- Use the short action names `manage` and `view`. Never `create-lesson`, `edit-lesson`, `view-lesson`, `lesson-details`.
- Never create separate `create` and `edit` pages.
- Other actions follow the same idea: `/admin/lesson/assign?id=...`, not `/admin/lesson/[id]/assign`.

### Reading `?id=`

`useSearchParams()` must be inside a `<Suspense>` boundary for static export. The page provides it:

```tsx
// app/(protected)/admin/lesson/manage/page.tsx
import { Suspense } from 'react';
import ManageLesson from './components/ManageLesson';

export default function Page() {
  return (
    <Suspense>
      <ManageLesson />
    </Suspense>
  );
}
```

```tsx
// inside ManageLesson.tsx
const id = useSearchParams().get('id');
const isEdit = Boolean(id);
```

### Route constants

Never hardcode paths in components. Keep them in `constant/routes.constant.ts`:

```ts
export const ROUTES = {
  login: '/login',
  admin: {
    lesson: {
      list: '/admin/lesson',
      manage: (id?: string | number) =>
        id ? `/admin/lesson/manage?id=${id}` : '/admin/lesson/manage',
      view: (id: string | number) => `/admin/lesson/view?id=${id}`,
    },
  },
} as const;
```

Sidebar entries in `app/(protected)/data/navigation.ts` use these constants too.

---

## 7. msflib First

Before building any feature, check msflib in this order:

1. **Installed?** Look for `@msflib/*` in `package.json`. If the relevant package is installed, read its types in `node_modules/@msflib/<pkg>/dist/index.d.ts` (and its README) and use its hooks/components. Do not reimplement what it provides.
2. **Available but not installed?** Check the catalog below (and the `react-modules` repo if you have access). If a module covers the feature, **stop and tell the developer**:

   > "`@msflib/react-<x>` covers this (<what it provides>). Install it with `pnpm add @msflib/react-<x>`, or continue with a local implementation?"

   Wait for their answer. Never install without confirmation.

3. **Not available** → build locally following this guide.

When a module is installed, register its Provider in `app/Provider.tsx` inside `QueryClientProvider`, and add any endpoint overrides in `lib/application.config.ts` (`endpoints`), not in components.

### Module catalog

| Package                      | Covers                                                                                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@msflib/core`               | App config, API client (`configuredApiClient`), storage, workspace scoping                                                                                                         |
| `@msflib/react-components`   | `FormBuilder`, `TableWidget`, `AppSkeleton`, `SkeletonLoaderWrapper`, `SkeletonCardLayout`, `DraggableList`, `ResizablePane`, `CustomSvg`, `GoogleAuthButton`, `GoogleAuthHandler` |
| `@msflib/react-auth`         | `AuthProvider`, `useAuth` (login, register, me, password recovery, verification)                                                                                                   |
| `@msflib/react-shared`       | Shared query utilities, `useActiveWorkspace`                                                                                                                                       |
| `@msflib/react-workspace`    | Multi-tenant workspaces (`WorkspaceProvider`, `useWorkspace`)                                                                                                                      |
| `@msflib/react-users`        | Users                                                                                                                                                                              |
| `@msflib/react-profile`      | Profile                                                                                                                                                                            |
| `@msflib/react-notification` | Notifications                                                                                                                                                                      |
| `@msflib/react-support`      | Support tickets                                                                                                                                                                    |
| `@msflib/react-certificate`  | Certificates                                                                                                                                                                       |
| `@msflib/react-courses`      | Courses                                                                                                                                                                            |
| `@msflib/react-curriculum`   | Curriculum                                                                                                                                                                         |
| `@msflib/react-lesson`       | Lessons (incl. admin lesson access)                                                                                                                                                |
| `@msflib/react-students`     | Students                                                                                                                                                                           |
| `@msflib/react-trainers`     | Trainers                                                                                                                                                                           |
| `@msflib/react-tasks`        | Tasks                                                                                                                                                                              |
| `@msflib/react-categories`   | Categories                                                                                                                                                                         |
| `@msflib/react-documents`    | Documents                                                                                                                                                                          |
| `@msflib/react-drivelink`    | Drive links                                                                                                                                                                        |
| `@msflib/react-ai`           | LLM and agent features                                                                                                                                                             |
| `@msflib/react-lottery`      | Lottery                                                                                                                                                                            |
| `@msflib/react-ux`           | UX utilities (tree view, file explorer, interactions)                                                                                                                              |

The catalog grows. When in doubt, check the `react-modules` repo or ask.

Packages are published to GitHub Packages; `.npmrc` must have a valid auth token for installs to work.

---

## 8. Components

### Global components (`components/App*.tsx`)

- Built **on top of MUI** (wrap `Button`, `Dialog`, `Chip`, `TextField`, ...). Build from scratch only when MUI has nothing suitable.
- Check `@msflib/react-components` and existing `components/App*` first. Extend an existing component with a prop before creating a near-duplicate.
- Expose a small, typed props interface (`App<Name>Props`), with sensible defaults. Pass through MUI props where useful.
- Styled with theme tokens only (see [§12](#12-theming--styling)).
- No data fetching or business logic inside global components. They receive data via props.

Existing: `AppButton`, `AppConfirmDialog`, `AppContainer`, `AppLogo`. Use `AppButton` for buttons, not raw `<button>` or MUI `Button` directly. For a button that navigates, pass `href` (it renders a Next.js `Link`) instead of `onClick={() => router.push(...)}`.

### Feature components

- Live in the route's `components/` (see [§4](#4-placement-rules-colocation)).
- Named after the domain: `LessonList.tsx`, `ManageLesson.tsx`, `LessonDetails.tsx`.
- Get data from hooks in `hooks/`, never by calling `fetch` directly.
- Keep them small. If a file passes ~200 lines or has clearly separate sections, split it into sub-components in the same `components/` folder.

### `'use client'`

Add `'use client'` only to components that use state, effects, browser APIs, event handlers or client-only libraries. `page.tsx` and `layout.tsx` files should stay server components that render a client component.

### Client-only libraries (`dynamics/`)

msflib UI components that touch the browser are imported through `next/dynamic` with `ssr: false`, once, in `dynamics/`:

```tsx
// dynamics/TableWidget.tsx
import dynamic from 'next/dynamic';

const TableWidget = dynamic(
  () => import('@msflib/react-components').then((mod) => mod.TableWidget),
  { ssr: false }
);

export default TableWidget;
```

Always import `FormBuilder`, `TableWidget` and `GoogleAuthButton` from `@/dynamics/...`, not directly from the package. Types (`FormElement`, `LayoutProps`, ...) are still imported from `@msflib/react-components`.

---

## 9. Forms (`FormBuilder`)

All forms use `FormBuilder`. Do not hand-build forms with raw inputs.

### Files

```text
<route>/
├── components/Manage<Entity>.tsx
└── data/
    ├── form/
    │   ├── <entity>.form.ts        # FormElement[]
    │   └── <entity>.layout.tsx     # layout component
    └── data.ts                     # route-local static data (options, defaults)
```

### Form elements

```ts
// data/form/lesson.form.ts
import { FormElement } from '@msflib/react-components';
import { baseMData, buttonStyle } from '@/styles/form.styles';

export const lessonFormElements: FormElement[] = [
  {
    id: 'title',
    name: 'title',
    label: 'Title',
    eType: 'text',
    dType: 'string',
    placeholder: 'Enter lesson title',
    mData: baseMData,
    validation: { required: { value: true, message: 'Title is required' } },
  },
  {
    id: 'start_date',
    name: 'start_date',
    label: 'Start date',
    eType: 'date',
    dType: 'string',
    mData: baseMData,
  },
  {
    id: 'submit',
    name: 'submit',
    label: 'Save',
    eType: 'button',
    dType: 'submit',
    mData: { variant: 'contained', sx: buttonStyle() },
  },
];
```

- `id` and `name` are identical and **snake_case**, matching the backend field.
- Type the array as `FormElement[]`. Don't cast at the call site.
- Reuse `baseMData` / `buttonStyle` from `styles/form.styles.ts`.
- Validation messages are short and human: `"Title is required"`.

### Layout

```tsx
// data/form/lesson.layout.tsx
import { LayoutProps } from '@msflib/react-components';

export const LessonLayout: React.FC<LayoutProps> = ({ FormField }) => (
  <section className="grid gap-4 md:grid-cols-2">
    <FormField elementName="title" />
    <FormField elementName="start_date" />
    <div className="md:col-span-2">
      <FormField elementName="submit" />
    </div>
  </section>
);
```

`elementName` must match the element `name`.

### Manage page (create + update)

Split it in two: `Manage<Entity>` reads `?id=` and loads the record; `<Entity>Form` owns the form state and is mounted only once the record is ready. Keying it by id prefills the form without a `useEffect` (which React's lint rules reject).

```tsx
// manage/components/ManageLesson.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { AppSkeleton } from '@msflib/react-components';
import { useLesson } from '@/hooks/lesson.hooks';
import LessonForm from './LessonForm';

export default function ManageLesson() {
  const id = useSearchParams().get('id');
  const isEdit = Boolean(id);
  const { data: lesson, isLoading, isError } = useLesson(id);

  if (isEdit && isLoading) return <AppSkeleton.Text lines={6} />;
  if (isEdit && (isError || !lesson)) {
    return <p className="b2-r text-error">Lesson not found.</p>;
  }

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <h1 className="h4-b text-text">
        {isEdit ? 'Update lesson' : 'Create lesson'}
      </h1>
      <LessonForm key={lesson?.id ?? 'new'} lesson={lesson} />
    </section>
  );
}
```

```tsx
// manage/components/LessonForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import FormBuilder from '@/dynamics/FormBuilder';
import { ROUTES } from '@/constant/routes.constant';
import { useSaveLesson } from '@/hooks/lesson.hooks';
import { Lesson, LessonPayload } from '@/types/lesson.types';
import { lessonFormElements } from '../data/form/lesson.form';
import { LessonLayout } from '../data/form/lesson.layout';

export default function LessonForm({ lesson }: { lesson?: Lesson }) {
  const router = useRouter();
  const { mutate: saveLesson, isPending } = useSaveLesson(lesson?.id);
  const [formData, setFormData] = useState<Partial<LessonPayload>>(
    lesson ?? {}
  );

  const handleSubmit = (data: LessonPayload) => {
    saveLesson(data, {
      onSuccess: () => {
        toast.success(lesson ? 'Lesson updated' : 'Lesson created');
        router.push(ROUTES.admin.lesson.list);
      },
      onError: () => toast.error('Could not save lesson. Please try again.'),
    });
  };

  return (
    <FormBuilder
      elements={lessonFormElements}
      layout={LessonLayout}
      formData={formData}
      setFormData={setFormData}
      loadingState={isPending}
      onSubmit={handleSubmit}
    />
  );
}
```

Rules:

- Heading, button label and toast text switch between create and update wording.
- In edit mode: skeleton while loading, a not-found state if the id returns nothing.
- Pass `loadingState` so the submit button is disabled while saving.
- On success: toast, then navigate back to the list (or to `view`). Query invalidation happens in the hook.
- Select options and other static form data go in the route's `data/data.ts`.

## 10. Tables (`TableWidget`)

All data tables use `TableWidget` (built on MUI X DataGrid), imported from `@/dynamics/TableWidget`. Columns always live in root `columns/` and are typed with `TableColumn<Entity>` from `types/table.types.ts`, so a `field` that isn't a real key of the entity fails the type check.

```ts
// columns/lesson.column.ts
import { Lesson } from '@/types/lesson.types';
import { TableColumn } from '@/types/table.types';

export const lessonColumns: TableColumn<Lesson>[] = [
  { field: 'title', headerName: 'Title', flex: 1 },
  { field: 'start_date', headerName: 'Start date', width: 160 },
  { field: 'status', headerName: 'Status', width: 120 },
];
```

- `field` is the **snake_case** backend key.
- Export `<entity>Columns`. If columns need handlers (e.g. action buttons), export a function: `getLessonColumns({ onDelete })`.
- If a column renders JSX, rename to `lesson.column.tsx`.
- Row actions use `menuItems` + `handleMenuClick`, with keys like `view`, `edit`, `delete` that route via `ROUTES`:

```tsx
const menuItems = [
  { key: 'view', label: 'View' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
];

const handleMenuClick = (item: MenuActionItem, row: Lesson) => {
  if (item.key === 'view') router.push(ROUTES.admin.lesson.view(row.id));
  if (item.key === 'edit') router.push(ROUTES.admin.lesson.manage(row.id));
  if (item.key === 'delete') setLessonToDelete(row);
};
```

- Always pass `loading` from the query. Destructive actions always confirm first with `AppConfirmDialog`.
- Handle error and empty states around the table (see `LessonList.tsx`).

---

## 11. API, Data Fetching & Types

### Flow

```text
Component → hooks/<entity>.hooks.ts (TanStack Query) → api/<entity>.api.ts (@msflib/core client) → backend
```

Components never call `fetch`/`axios` or the API client directly. If an msflib module provides the hooks, use them and skip this layer.

### API file

```ts
// api/lesson.api.ts
import { configuredApiClient } from '@msflib/core';
import { Lesson, LessonPayload } from '@/types/lesson.types';

const ENDPOINT = '/lesson';
const client = () => configuredApiClient().apiClient;

export const lessonApi = {
  list: () => client()<Lesson[]>('GET', ENDPOINT),
  get: (id: string) => client()<Lesson>('GET', `${ENDPOINT}/${id}`),
  create: (payload: LessonPayload) =>
    client()<Lesson>('POST', ENDPOINT, payload),
  update: (id: string, payload: LessonPayload) =>
    client()<Lesson>('PUT', `${ENDPOINT}/${id}`, payload),
  remove: (id: string) => client()<void>('DELETE', `${ENDPOINT}/${id}`),
};
```

- Always go through `configuredApiClient` so base URL, token and workspace scoping are applied. Resolve it lazily (inside a function) so it runs after `initMsflib()`.
- Use `apiFormDataClient` for file uploads.
- Payloads are sent in snake_case. **Do not** convert keys between camelCase and snake_case.

### Hooks file

```ts
// hooks/lesson.hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lessonApi } from '@/api/lesson.api';
import { LessonPayload } from '@/types/lesson.types';

export const lessonKeys = {
  all: ['lesson'] as const,
  list: () => [...lessonKeys.all, 'list'] as const,
  detail: (id: string) => [...lessonKeys.all, 'detail', id] as const,
};

export const useLessons = () =>
  useQuery({ queryKey: lessonKeys.list(), queryFn: lessonApi.list });

export const useLesson = (id?: string | null) =>
  useQuery({
    queryKey: lessonKeys.detail(id ?? ''),
    queryFn: () => lessonApi.get(id as string),
    enabled: Boolean(id),
  });

export const useSaveLesson = (id?: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LessonPayload) =>
      id ? lessonApi.update(id, payload) : lessonApi.create(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: lessonKeys.all }),
  });
};
```

- One query-key factory per entity, exported from its hooks file.
- Mutations invalidate affected keys in the hook, not in the component.
- Toasts and navigation happen in the component (via `mutate` callbacks), not in the hook.

### Types

```ts
// types/lesson.types.ts
export interface Lesson {
  id: string;
  title: string;
  start_date: string;
  status: LessonStatus;
  created_at: string;
  updated_at: string;
}

export type LessonStatus = 'draft' | 'published';

export type LessonPayload = Omit<Lesson, 'id' | 'created_at' | 'updated_at'>;
```

- Interface/type names are `PascalCase` (`Lesson`, `AuthResponse`, not `AUTHRESPONSE`). Property names are `snake_case`, mirroring the backend.
- Derive payload types from the entity (`Omit`, `Pick`, `Partial`) instead of redefining fields.
- If an msflib package exports the type, import it; don't redeclare it.
- Avoid `any`. Use `unknown` and narrow, or a proper type.

### Mock data

When the backend isn't ready, put typed mock data in `data/<entity>.data.ts` (shared) or `<route>/data/data.ts` (route-only). It must use the real snake_case field names and the real type, so swapping to the API is a one-line change.

---

## 12. Theming & Styling

### Source of truth

`theme/theme.css` defines every design token (colours, fonts, typography scale, radii). `theme/theme.config.ts` configures MUI and **must use the same values** as `theme.css`. When a brand colour changes, update both.

### Priority

1. **MUI component props** (`variant`, `color="primary"`, `size`) for MUI components.
2. **Tailwind utility classes** using token names for layout and styling.
3. **`sx`** for MUI-specific overrides, referencing CSS variables.
4. **`*.styles.ts`** for sx objects reused across files.

No inline `style={{}}` except for truly dynamic values. No CSS modules. No global CSS outside `theme/theme.css`. Never add an unlayered reset such as `* { margin: 0; padding: 0 }`: Tailwind v4 utilities live in a cascade layer, so unlayered rules override every spacing class. Tailwind's preflight already resets margins and padding.

### Colour tokens (Tailwind classes)

| Token              | Classes                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| primary            | `bg-primary`, `text-primary`, `border-primary`, `-light`, `-dark` variants |
| secondary          | `bg-secondary`, `text-secondary`, ...                                      |
| tertiary           | `bg-tertiary`, ...                                                         |
| background/surface | `bg-background`, `bg-background-light`, `bg-surface`                       |
| text               | `text-text`, `text-text-light`                                             |
| borders            | `border-stroke`                                                            |
| states             | `text-success`, `text-error`, `text-disabled`                              |
| neutral            | `bg-neutral`, `text-neutral`                                               |
| radius             | `rounded-app-radius`, `rounded-btn-radius`, `rounded-input-radius`         |

- **Never** hardcode hex/rgb values in components.
- **Never** use Tailwind's default palette (`bg-slate-900`, `text-blue-600`, `bg-amber-100`) for brand or UI colours. If a colour is missing, add a token to `theme.css` (and `@theme inline`) and ask the developer to confirm the value.
- In `sx` or style objects, reference the raw variables: `'var(--primary)'`, `'var(--stroke)'`, `'var(--input-radius)'`.
- Prefer MUI's `color="primary"` etc. on MUI components so they pick up the palette.

### Typography

Use the typography classes from `theme.css` instead of ad-hoc `text-xl font-bold`:

| Class pattern   | Use for                          | Weights                      |
| --------------- | -------------------------------- | ---------------------------- |
| `h1-*` … `h6-*` | Headings                         | `-b` 700, `-m` 500, `-r` 400 |
| `b1-*`          | Body 16px                        | same                         |
| `b2-*`          | Body 14px                        | same                         |
| `f1-*`, `f2-*`  | Captions / small text 12px, 10px | same                         |

```tsx
<h2 className="h4-b text-text">Lessons</h2>
<p className="b2-r text-text-light">Manage all lessons in your workspace.</p>
```

Font family comes from `--font-app-font`. Don't set `fontFamily` anywhere else.

### Responsiveness

- Mobile-first. Every screen must work from 360px wide upward.
- Use Tailwind breakpoints (`sm`, `md`, `lg`, `xl`) for layout; MUI `useMediaQuery(theme.breakpoints...)` only when logic depends on it.
- Wrap page-level content in `AppContainer` for public pages. Dashboard pages already get padding from `DashboardLayout`.

### Icons

`@mui/icons-material` first. Use `react-icons` only for icons MUI doesn't have (e.g. brand logos). Don't inline raw `<svg>` paths for common icons.

---

## 13. State Management

| State kind                    | Tool                                                                |
| ----------------------------- | ------------------------------------------------------------------- |
| Server data                   | TanStack Query (never copy into `useState` except for form prefill) |
| Auth / current user           | `useAuth()` from `@msflib/react-auth`                               |
| Active workspace / tenant     | `@msflib/react-workspace` / `react-shared`                          |
| URL state (id, filters, tabs) | Query params (`useSearchParams`)                                    |
| Local UI (open modal, input)  | `useState` in the component                                         |
| Cross-cutting client state    | React context in `context/`, only if really needed                  |

Do not add Redux, Zustand or similar without team approval. Do not create a context that duplicates an msflib provider (e.g. a local `AuthProvider`).

---

## 14. UX Requirements

Every data-driven screen handles four states:

1. **Loading** – `AppSkeleton` / `SkeletonLoaderWrapper` from `@msflib/react-components`, or `loading` on `TableWidget`.
2. **Empty** – a clear message and, where relevant, a primary action ("Create lesson").
3. **Error** – a friendly message plus retry where possible; `toast.error` for failed actions.
4. **Success** – the data; `toast.success` after mutations.

Also:

- Disable submit buttons while a mutation is pending (`loadingState` / `loading`).
- Confirm destructive actions (delete, remove, revoke) with a dialog.
- Buttons and links have visible labels or `aria-label`s; images have meaningful `alt` text.
- User-facing copy is sentence case and concise.

---

## 15. Code Style

- Prettier + ESLint config in the repo are law: single quotes, semicolons, 2 spaces, trailing commas (es5), 80 columns. Run `pnpm lint` before finishing.
- Imports use the `@/` alias for anything outside the current route folder. Relative imports only within the same route (`../data/form/...`).
- Import order: React/Next → third-party → `@msflib/*` → `@/` aliases → relative.
- Functional components only. Prefer named functions or `const` arrow components, consistently within a file.
- Keep functions small and single-purpose. Extract repeated logic into `hooks/` or `utils/`.
- **Comments:** only for non-obvious _why_ (a workaround, a backend quirk). No comments that describe what the next line does, no JSDoc on obvious props, no banner comments, no commented-out code.
- No `console.log` in committed code.
- No magic strings/numbers repeated across files: move them to `constant/`.
- Don't leave unused imports, variables, files or placeholder components behind.

---

## 16. Environment & Config

- Public env vars are prefixed `NEXT_PUBLIC_` and documented in `.env.example`. Add new ones there with a safe placeholder.
- Never commit `.env.local` or real secrets. Remember this is a static client app: **every** env var ends up in the browser bundle.
- API base URL, token key, workspace mode and endpoint overrides live in `lib/application.config.ts`, not in components.
- Providers (Query, Theme, Auth, msflib modules, `ToastContainer`) are registered once in `app/Provider.tsx`.

---

## 17. Testing

- E2E tests use Playwright in `tests/`, named `<feature>.spec.ts`.
- For each new CRUD feature, cover at least: list renders, create via `manage`, update via `manage?id=`, view via `view?id=`.
- Select elements by role/label (`getByRole`, `getByLabel`), not by CSS classes.

---

## 18. Definition of Done

Before reporting a task as complete, confirm:

- [ ] msflib packages were used wherever one fits; any suggested install was confirmed by the developer.
- [ ] Every new file is in the correct folder and follows the naming pattern.
- [ ] Types are in `types/`, columns in `columns/`, API in `api/`, hooks in `hooks/`, form files in `<route>/data/form/`.
- [ ] All data keys (types, payloads, form `name`s, column `field`s, mocks) are snake_case.
- [ ] Create/update is one `manage` page using `?id=`; detail is `view?id=`; no `[id]` folders; `useSearchParams` is inside `<Suspense>`.
- [ ] No hardcoded colours, fonts or Tailwind default-palette colours; typography classes used.
- [ ] Global components are `App*`, built on MUI; feature components sit in the nearest common parent.
- [ ] Loading, empty, error and success states are handled.
- [ ] No `any`, no `console.log`, no dead or commented-out code, no redundant comments.
- [ ] `pnpm lint` passes and `pnpm build` succeeds (static export).
- [ ] New env vars are in `.env.example`; new routes are in `ROUTES` and, if needed, the sidebar.

---

## Appendix: Complete Feature Example

The template ships this exact feature as the reference implementation. Copy its patterns. (In a real project, check `@msflib/react-lesson` first; the local version exists to demonstrate the structure.)

```text
api/lesson.api.ts
hooks/lesson.hooks.ts
types/lesson.types.ts
types/table.types.ts                            # shared TableColumn<T>
columns/lesson.column.ts
constant/routes.constant.ts                     # add ROUTES.admin.lesson
app/(protected)/data/navigation.ts              # add sidebar link
app/(protected)/admin/lesson/
├── page.tsx                                    # <LessonList />
├── components/
│   └── LessonList.tsx                          # TableWidget + useLessons
├── manage/
│   ├── page.tsx                                # <Suspense><ManageLesson /></Suspense>
│   ├── components/
│   │   ├── ManageLesson.tsx                    # reads ?id=, loads record
│   │   └── LessonForm.tsx                      # FormBuilder, create + update
│   └── data/
│       ├── form/
│       │   ├── lesson.form.ts
│       │   └── lesson.layout.tsx
│       └── data.ts                             # status select options
└── view/
    ├── page.tsx                                # <Suspense><LessonDetails /></Suspense>
    └── components/
        └── LessonDetails.tsx                   # useLesson(id)
tests/lesson.spec.ts
```

If a component is later needed by both `lesson/` and another admin area (e.g. `course/`), move it to `app/(protected)/admin/components/`. If it's needed outside `admin/`, promote it to root `components/` with an `App` prefix.
