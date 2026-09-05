
export const PermissionSection = {
  ADMIN_PORTAL: 'admin-portal',
  CONFIGURATION: 'configuration',
  USER_MANAGEMENT: 'user-management',
};

export const SECTION_LABEL = {
  [PermissionSection.ADMIN_PORTAL]: 'Admin Portal',
  [PermissionSection.CONFIGURATION]: 'Configuration',
  [PermissionSection.USER_MANAGEMENT]: 'User Management',
};

export const PermissionTab = {
  STOCK_MANAGEMENT: 'stock-management',
  MOBILE_APP: 'mobile-app',
};

export const TAB_LABEL = {
  [PermissionTab.STOCK_MANAGEMENT]: 'Stock Management',
  [PermissionTab.MOBILE_APP]: 'Mobile App',
};

export const RESTRICTED_CUTOFF_HOUR = 12;

export const PERMISSIONS = [
  {
    code: 'stocktake.view',
    label: 'Lihat Stock Take',
    isMobile: false,
    section: PermissionSection.ADMIN_PORTAL,
    group: 'stock-take',
    groupLabel: 'Stock Take',
  },
  {
    code: 'stocktake.edit',
    label: 'Edit Hasil Hitung',
    isMobile: false,
    section: PermissionSection.ADMIN_PORTAL,
    group: 'stock-take',
    groupLabel: 'Stock Take',
  },
  {
    code: 'stocktake.validate',
    label: 'Validasi Stock Take',
    isMobile: false,
    section: PermissionSection.ADMIN_PORTAL,
    group: 'stock-take',
    groupLabel: 'Stock Take',
    restrictable: true,
  },
  {
    code: 'stocktake.export',
    label: 'Export Stock Take',
    isMobile: false,
    section: PermissionSection.ADMIN_PORTAL,
    group: 'stock-take',
    groupLabel: 'Stock Take',
  },

  {
    code: 'receiving.view',
    label: 'Lihat Delivery Order',
    isMobile: false,
    section: PermissionSection.ADMIN_PORTAL,
    group: 'receiving',
    groupLabel: 'Receiving',
  },
  {
    code: 'receiving.sync',
    label: 'Refresh Data DO',
    isMobile: false,
    section: PermissionSection.ADMIN_PORTAL,
    group: 'receiving',
    groupLabel: 'Receiving',
  },
  {
    code: 'receiving.import',
    label: 'Import DO',
    isMobile: false,
    section: PermissionSection.ADMIN_PORTAL,
    group: 'receiving',
    groupLabel: 'Receiving',
  },
  {
    code: 'receiving.export',
    label: 'Export DO',
    isMobile: false,
    section: PermissionSection.ADMIN_PORTAL,
    group: 'receiving',
    groupLabel: 'Receiving',
  },
  {
    code: 'receiving.validate',
    label: 'Validasi DO',
    isMobile: false,
    section: PermissionSection.ADMIN_PORTAL,
    group: 'receiving',
    groupLabel: 'Receiving',
  },

  {
    code: 'stockwaste.view',
    label: 'Lihat Stock Waste',
    isMobile: false,
    section: PermissionSection.ADMIN_PORTAL,
    group: 'stock-waste',
    groupLabel: 'Stock Waste',
  },
  {
    code: 'stockwaste.export',
    label: 'Export Stock Waste',
    isMobile: false,
    section: PermissionSection.ADMIN_PORTAL,
    group: 'stock-waste',
    groupLabel: 'Stock Waste',
  },

  {
    code: 'scheduler.view',
    label: 'Lihat Stock Take Scheduler',
    isMobile: false,
    section: PermissionSection.CONFIGURATION,
    group: 'scheduler',
    groupLabel: 'Stock Take Scheduler',
  },
  {
    code: 'scheduler.create',
    label: 'Tambah Jadwal',
    isMobile: false,
    section: PermissionSection.CONFIGURATION,
    group: 'scheduler',
    groupLabel: 'Stock Take Scheduler',
  },

  {
    code: 'wasteapp.view',
    label: 'Lihat Stock Waste App',
    isMobile: false,
    section: PermissionSection.CONFIGURATION,
    group: 'waste-app',
    groupLabel: 'Stock Waste App',
  },
  {
    code: 'wasteapp.productAdd',
    label: 'Tambah Produk Kategori',
    isMobile: false,
    section: PermissionSection.CONFIGURATION,
    group: 'waste-app',
    groupLabel: 'Stock Waste App',
  },
  {
    code: 'wasteapp.productRemove',
    label: 'Hapus Produk Kategori',
    isMobile: false,
    section: PermissionSection.CONFIGURATION,
    group: 'waste-app',
    groupLabel: 'Stock Waste App',
  },
  {
    code: 'wasteapp.export',
    label: 'Export Konfigurasi Waste',
    isMobile: false,
    section: PermissionSection.CONFIGURATION,
    group: 'waste-app',
    groupLabel: 'Stock Waste App',
  },
  {
    code: 'wasteapp.uomEdit',
    label: 'Edit Batas Kuantitas UoM',
    isMobile: false,
    section: PermissionSection.CONFIGURATION,
    group: 'waste-app',
    groupLabel: 'Stock Waste App',
  },

  {
    code: 'returnwaste.view',
    label: 'Lihat Return Waste Product',
    isMobile: false,
    section: PermissionSection.CONFIGURATION,
    group: 'return-waste',
    groupLabel: 'Return Waste Product',
  },
  {
    code: 'returnwaste.configure',
    label: 'Konfigurasi Return Waste',
    isMobile: false,
    section: PermissionSection.CONFIGURATION,
    group: 'return-waste',
    groupLabel: 'Return Waste Product',
  },

  {
    code: 'usermgmt.view',
    label: 'Lihat User Access',
    isMobile: false,
    section: PermissionSection.USER_MANAGEMENT,
    group: 'user-access',
    groupLabel: 'User Access',
  },
  {
    code: 'usermgmt.assign',
    label: 'Atur Hak Akses Pengguna',
    isMobile: false,
    section: PermissionSection.USER_MANAGEMENT,
    group: 'user-access',
    groupLabel: 'User Access',
  },

  {
    code: 'mobile.stocktake.count',
    label: 'Isi Perhitungan Stok',
    isMobile: true,
    section: null,
    group: 'stock-take',
    groupLabel: 'Stock Take',
  },
  {
    code: 'mobile.stocktake.submit',
    label: 'Submit Perhitungan Stok',
    isMobile: true,
    section: null,
    group: 'stock-take',
    groupLabel: 'Stock Take',
  },
  {
    code: 'mobile.stockwaste.input',
    label: 'Isi Form Waste',
    isMobile: true,
    section: null,
    group: 'stock-waste',
    groupLabel: 'Stock Waste',
  },
  {
    code: 'mobile.receiving.confirm',
    label: 'Konfirmasi Penerimaan DO',
    isMobile: true,
    section: null,
    group: 'receiving',
    groupLabel: 'Receiving',
  },
];

export const PERMISSION_BY_CODE = Object.freeze(
  PERMISSIONS.reduce((acc, permission) => {
    acc[permission.code] = permission;
    return acc;
  }, {}),
);

export const ALL_PERMISSION_CODES = PERMISSIONS.map((permission) => permission.code);

export const VIEW_PERMISSION_CODES = PERMISSIONS.filter((permission) =>
  permission.code.endsWith('.view'),
).map((permission) => permission.code);

export const buildPermissionTree = () => {
  const tabs = [
    { id: PermissionTab.STOCK_MANAGEMENT, label: TAB_LABEL[PermissionTab.STOCK_MANAGEMENT], sections: [] },
    { id: PermissionTab.MOBILE_APP, label: TAB_LABEL[PermissionTab.MOBILE_APP], sections: [] },
  ];

  for (const permission of PERMISSIONS) {
    const tab = permission.isMobile ? tabs[1] : tabs[0];
    const sectionId = permission.section ?? 'mobile';
    let section = tab.sections.find((item) => item.id === sectionId);

    if (!section) {
      section = { id: sectionId, label: SECTION_LABEL[sectionId] ?? '', groups: [] };
      tab.sections.push(section);
    }

    let group = section.groups.find((item) => item.id === permission.group);
    if (!group) {
      group = { id: permission.group, label: permission.groupLabel, permissions: [] };
      section.groups.push(group);
    }

    group.permissions.push(permission);
  }

  return tabs;
};
