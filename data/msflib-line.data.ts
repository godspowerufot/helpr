// Supply line of MSFLib in Helpr. Copy follows docs/DIAGRAMS.md.

export const LINE_VIEW = { w: 1280, h: 820 };

export type LineStation = {
  id: string;
  label: string;
  title: string;
  packageName: string;
  body: string;
  where: string;
  surface: string[];
  x: number;
  y: number;
};

export type LineLane = {
  id: string;
  from: string;
  to: string;
  d: string;
  dur: string;
};

export const LINE_STATIONS: LineStation[] = [
  {
    id: 'pages',
    label: 'Pages',
    title: 'Helpr Screens',
    packageName: 'Helpr',
    x: 160,
    y: 380,
    body: 'You start here. Browsing, sign-in, a booking and the provider desk all begin on a Helpr screen. The screen never talks to the database itself.',
    where: 'Home, services, login, your bookings, and the provider desk.',
    surface: ['useAuth', 'FormBuilder', 'configuredApiClient'],
  },
  {
    id: 'auth',
    label: 'Sign-In',
    title: 'Sign-In',
    packageName: '@msflib/react-auth · msflib.auth',
    x: 390,
    y: 160,
    body: 'Sign-up, login and logout are MSFLib on both sides. Helpr only chooses the fields on the form.',
    where: 'Login and register. AuthProvider wraps the app, and auth calls stay outside any workspace.',
    surface: [
      'useAuth login, register, logout, me',
      'POST /open, POST /login, GET /me, DELETE /logout',
      'GoogleAuthButton and GET /google/login',
    ],
  },
  {
    id: 'forms',
    label: 'Forms',
    title: 'Forms and Tables',
    packageName: '@msflib/react-components',
    x: 390,
    y: 600,
    body: 'Forms, tables and loading skeletons come from the React template. Helpr passes the fields and the layout.',
    where: 'Login, register, a booking request, provider setup, provider lists, and photo upload.',
    surface: ['FormBuilder', 'TableWidget', 'AppSkeleton', 'GoogleAuthButton'],
  },
  {
    id: 'client',
    label: 'Client',
    title: 'API Client',
    packageName: '@msflib/core',
    x: 610,
    y: 380,
    body: 'One client sends every call. It attaches your token, and it adds the provider slug only when that call is marked workspace-scoped.',
    where: 'Application startup, and every file under frontend/api.',
    surface: [
      'configureApplication',
      'configuredApiClient',
      'storage',
      'setActiveWorkspace',
    ],
  },
  {
    id: 'api',
    label: 'API',
    title: 'API',
    packageName: 'MSFLib FastAPI template',
    x: 830,
    y: 380,
    body: 'Helpr routes sit beside the routers MSFLib already mounts. Listeners attach to the emitter on this app, after the change is saved.',
    where: 'Backend startup and /api/v1.',
    surface: [
      'auth, account, payments and notification routers',
      'bind_app_emitter',
      'Helpr listings, bookings, providers, reviews',
    ],
  },
  {
    id: 'workspaces',
    label: 'Workspaces',
    title: 'Provider Workspaces',
    packageName: '@msflib/react-workspace · msflib.workspaces',
    x: 1080,
    y: 110,
    body: 'A provider is a workspace plus a Helpr profile. The client inserts the slug. The API allows only an owner or an admin of that workspace.',
    where: 'Become a provider, then every provider-desk call.',
    surface: [
      "workspaceHookDecorator('path')",
      'useActiveWorkspace',
      'workspace_action.create_with_owner',
      'WorkspaceRoleCheck',
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    title: 'Payments',
    packageName: 'msflib-payments',
    x: 1080,
    y: 290,
    body: 'You pay only after the provider accepts. Helpr sends the price in naira, which is the kobo amount divided by 100. Paystack stays in test mode.',
    where: 'Pay on an accepted booking. Paystack sends you back to the payment page.',
    surface: [
      'process_payment',
      'GET /payments/verify',
      'on_payment_verified moves the booking to paid',
    ],
  },
  {
    id: 'notices',
    label: 'Notices',
    title: 'Notices',
    packageName: 'msflib-notifications',
    x: 1080,
    y: 480,
    body: 'The other side hears about a booking change inside the app, and only after that change is saved.',
    where: 'The bell while you are signed in.',
    surface: [
      'dispatch_account_notifications',
      'GET /notifications',
      'In-app channel only',
    ],
  },
  {
    id: 'photos',
    label: 'Photos',
    title: 'Provider Photos',
    packageName: 'msflib uploads',
    x: 1080,
    y: 660,
    body: 'A provider photo is checked for size and type, then stored. Helpr keeps the profile and stops the gallery at 8 photos.',
    where: 'Photo upload on the provider desk. The call is workspace-scoped.',
    surface: ['validate_upload', 'save_file_blob', 'GET /uploads on the API origin'],
  },
];

export const LINE_LANES: LineLane[] = [
  {
    id: 'pages-auth',
    from: 'pages',
    to: 'auth',
    d: 'M 160 380 Q 230 230 390 160',
    dur: '4.2s',
  },
  {
    id: 'pages-forms',
    from: 'pages',
    to: 'forms',
    d: 'M 160 380 Q 230 530 390 600',
    dur: '4.2s',
  },
  {
    id: 'pages-client',
    from: 'pages',
    to: 'client',
    d: 'M 160 380 Q 385 330 610 380',
    dur: '5.6s',
  },
  {
    id: 'auth-client',
    from: 'auth',
    to: 'client',
    d: 'M 390 160 Q 520 200 610 380',
    dur: '4.8s',
  },
  {
    id: 'forms-client',
    from: 'forms',
    to: 'client',
    d: 'M 390 600 Q 520 560 610 380',
    dur: '4.8s',
  },
  {
    id: 'client-api',
    from: 'client',
    to: 'api',
    d: 'M 610 380 Q 720 340 830 380',
    dur: '3.6s',
  },
  {
    id: 'api-workspaces',
    from: 'api',
    to: 'workspaces',
    d: 'M 830 380 Q 980 180 1080 110',
    dur: '4.4s',
  },
  {
    id: 'api-payments',
    from: 'api',
    to: 'payments',
    d: 'M 830 380 Q 980 300 1080 290',
    dur: '3.8s',
  },
  {
    id: 'api-notices',
    from: 'api',
    to: 'notices',
    d: 'M 830 380 Q 980 460 1080 480',
    dur: '3.8s',
  },
  {
    id: 'api-photos',
    from: 'api',
    to: 'photos',
    d: 'M 830 380 Q 980 560 1080 660',
    dur: '4.6s',
  },
];
