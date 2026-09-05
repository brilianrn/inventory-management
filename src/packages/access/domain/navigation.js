
export const ROUTE_PERMISSIONS = [
  { prefix: '/dashboard', permission: null },
  { prefix: '/stocktake', permission: 'stocktake.view' },
  { prefix: '/stockwaste', permission: 'stockwaste.view' },
  { prefix: '/stconfiguration', permission: 'scheduler.view' },
  { prefix: '/swconfiguration', permission: 'wasteapp.view' },
  { prefix: '/returnwaste', permission: 'returnwaste.view' },
  { prefix: '/usersetting', permission: 'usermgmt.view' },
  { prefix: '/ops/stocktake/crew', permission: 'mobile.stocktake.count' },
  { prefix: '/ops/stocktake/control', permission: 'scheduler.view' },
  { prefix: '/ops/stocktake/support', permission: 'usermgmt.view' },
  { prefix: '/ops/stockwaste/crew', permission: 'mobile.stockwaste.input' },
  { prefix: '/ops/receiving/desk', permission: 'receiving.view' },
  { prefix: '/ops/receiving/crew', permission: 'mobile.receiving.confirm' },
];

export const FALLBACK_ROUTE = '/dashboard';

export const PANEL_ROUTE = '/';

export const resolveRoutePermission = (pathname = '') => {
  const match = ROUTE_PERMISSIONS.filter((route) => pathname.startsWith(route.prefix)).sort(
    (a, b) => b.prefix.length - a.prefix.length,
  )[0];
  return match ? match.permission : null;
};

export const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/stocktake': 'Stock Take',
  '/stockwaste': 'Waste',
  '/stconfiguration': 'Stock Take Scheduler',
  '/swconfiguration': 'Stock Waste App',
  '/returnwaste': 'Return Waste Products',
  '/usersetting': 'User Access',
  '/ops/stocktake/crew': 'Perhitungan Stok',
  '/ops/stocktake/control': 'Konfigurasi Brand dan Outlet',
  '/ops/stocktake/support': 'Akun Outlet Crew',
  '/ops/stockwaste/crew': 'Form Waste',
  '/ops/receiving/desk': 'Daftar Delivery Order',
  '/ops/receiving/crew': 'Penerimaan DO',
};

export const resolvePageTitle = (pathname = '') => {
  const key = Object.keys(PAGE_TITLES)
    .filter((route) => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)[0];
  return key ? PAGE_TITLES[key] : 'amb';
};

export const ModuleId = {
  STOCK_MANAGEMENT: 'stock-management',
  USER_MANAGEMENT: 'user-management',
  STOCKTAKE_OPS: 'stocktake-ops',
  STOCKWASTE_OPS: 'stockwaste-ops',
  RECEIVING_OPS: 'receiving-ops',
};

export const MODULES = [
  {
    id: ModuleId.STOCK_MANAGEMENT,
    name: 'Stock Management',
    description: 'Pantau dan validasi dokumen stock take, waste, dan konfigurasinya.',
    path: '/dashboard',
    accent: 'emerald',
    requiresAny: ['stocktake.view', 'stockwaste.view', 'scheduler.view', 'wasteapp.view', 'returnwaste.view'],
  },
  {
    id: ModuleId.USER_MANAGEMENT,
    name: 'User Management Access',
    description: 'Kelola pengguna beserta kombinasi hak aksesnya.',
    path: '/usersetting',
    accent: 'violet',
    requiresAny: ['usermgmt.view'],
  },
  {
    id: ModuleId.STOCKTAKE_OPS,
    name: 'Stock Take Ops',
    description: 'Perhitungan stok outlet crew, penjadwalan, dan akun crew.',
    path: '/ops/stocktake/control',
    accent: 'sky',
    requiresAny: ['scheduler.view', 'usermgmt.view', 'mobile.stocktake.count'],
  },
  {
    id: ModuleId.STOCKWASTE_OPS,
    name: 'Stock Waste Ops',
    description: 'Pencatatan produk terbuang dan return oleh outlet crew.',
    path: '/ops/stockwaste/crew',
    accent: 'amber',
    requiresAny: ['mobile.stockwaste.input'],
  },
  {
    id: ModuleId.RECEIVING_OPS,
    name: 'Receiving Ops',
    description: 'Penerimaan surat jalan di outlet dan pemantauannya di back office.',
    path: '/ops/receiving/desk',
    accent: 'rose',
    requiresAny: ['receiving.view', 'mobile.receiving.confirm'],
  },
];

export const STOCK_MANAGEMENT_MENU = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'grid', permission: null },
  {
    id: 'admin-portal',
    label: 'Admin Portal',
    icon: 'shield',
    children: [
      { id: 'stocktake', label: 'Stock Take', path: '/stocktake', permission: 'stocktake.view' },
      { id: 'stockwaste', label: 'Stock Waste', path: '/stockwaste', permission: 'stockwaste.view' },
    ],
  },
  {
    id: 'configuration',
    label: 'Configuration',
    icon: 'sliders',
    children: [
      { id: 'scheduler', label: 'Stock Take Scheduler', path: '/stconfiguration', permission: 'scheduler.view' },
      { id: 'waste-app', label: 'Stock Waste App', path: '/swconfiguration', permission: 'wasteapp.view' },
      { id: 'return-waste', label: 'Return Waste Products', path: '/returnwaste', permission: 'returnwaste.view' },
    ],
  },
];

export const USER_MANAGEMENT_MENU = [
  { id: 'user-access', label: 'User Access', path: '/usersetting', icon: 'key', permission: 'usermgmt.view' },
];

export const STOCKTAKE_OPS_MENU = [
  {
    id: 'control',
    label: 'Inventory Control',
    path: '/ops/stocktake/control',
    icon: 'calendar',
    permission: 'scheduler.view',
  },
  {
    id: 'support',
    label: 'Technical Support',
    path: '/ops/stocktake/support',
    icon: 'users',
    permission: 'usermgmt.view',
  },
  {
    id: 'crew',
    label: 'Outlet Crew (mobile)',
    path: '/ops/stocktake/crew',
    icon: 'phone',
    permission: 'mobile.stocktake.count',
  },
];

export const RECEIVING_OPS_MENU = [
  { id: 'desk', label: 'Daftar Delivery Order', path: '/ops/receiving/desk', icon: 'truck', permission: 'receiving.view' },
  {
    id: 'crew',
    label: 'Outlet Crew (mobile)',
    path: '/ops/receiving/crew',
    icon: 'phone',
    permission: 'mobile.receiving.confirm',
  },
];

export const STOCKWASTE_OPS_MENU = [
  {
    id: 'crew',
    label: 'Outlet Crew (mobile)',
    path: '/ops/stockwaste/crew',
    icon: 'phone',
    permission: 'mobile.stockwaste.input',
  },
];

export const MENU_BY_MODULE = {
  [ModuleId.STOCK_MANAGEMENT]: STOCK_MANAGEMENT_MENU,
  [ModuleId.USER_MANAGEMENT]: USER_MANAGEMENT_MENU,
  [ModuleId.STOCKTAKE_OPS]: STOCKTAKE_OPS_MENU,
  [ModuleId.RECEIVING_OPS]: RECEIVING_OPS_MENU,
  [ModuleId.STOCKWASTE_OPS]: STOCKWASTE_OPS_MENU,
};

export const resolveModuleId = (pathname = '') => {
  if (pathname.startsWith('/usersetting')) return ModuleId.USER_MANAGEMENT;
  if (pathname.startsWith('/ops/stocktake')) return ModuleId.STOCKTAKE_OPS;
  if (pathname.startsWith('/ops/stockwaste')) return ModuleId.STOCKWASTE_OPS;
  if (pathname.startsWith('/ops/receiving')) return ModuleId.RECEIVING_OPS;
  return ModuleId.STOCK_MANAGEMENT;
};
