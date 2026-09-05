import { ALL_PERMISSION_CODES, PERMISSIONS } from './permission.catalog.js';

const adminViewCodes = PERMISSIONS.filter(
  (permission) => !permission.isMobile && permission.code.endsWith('.view'),
).map((permission) => permission.code);

const mobileCodes = PERMISSIONS.filter((permission) => permission.isMobile).map(
  (permission) => permission.code,
);

const configurationCodes = PERMISSIONS.filter(
  (permission) => permission.section === 'configuration',
).map((permission) => permission.code);

export const PERSONAS = [
  {
    id: 'admin-penuh',
    name: 'Admin Penuh',
    summary: 'Seluruh izin menyala, validasi tanpa batas waktu.',
    profile: {
      name: 'Renata Wijoyo',
      email: 'renata.wijoyo@amb.demo',
      jobTitle: 'Inventory Manager',
      outlet: null,
    },
    permissions: [...ALL_PERMISSION_CODES],
    attributes: { 'stocktake.validate': { restricted: false } },
  },
  {
    id: 'validator-restricted',
    name: 'Validator Restricted',
    summary: 'Boleh edit dan validasi stock take, tapi hanya sampai pukul 12:00.',
    profile: {
      name: 'Bagas Prayoga',
      email: 'bagas.prayoga@amb.demo',
      jobTitle: 'Stock Controller',
      outlet: null,
    },
    permissions: [
      'stocktake.view',
      'stocktake.edit',
      'stocktake.validate',
      'stocktake.export',
      'stockwaste.view',
    ],
    attributes: { 'stocktake.validate': { restricted: true } },
  },
  {
    id: 'staff-konfigurasi',
    name: 'Staff Konfigurasi',
    summary: 'Pegang seluruh menu Configuration, tanpa hak validasi dokumen.',
    profile: {
      name: 'Laras Nuraini',
      email: 'laras.nuraini@amb.demo',
      jobTitle: 'Master Data Officer',
      outlet: null,
    },
    permissions: [...configurationCodes, 'stocktake.view', 'stockwaste.view'],
    attributes: {},
  },
  {
    id: 'viewer',
    name: 'Viewer Saja',
    summary: 'Hanya izin lihat. Semua tombol aksi menghilang.',
    profile: {
      name: 'Hendra Saputra',
      email: 'hendra.saputra@amb.demo',
      jobTitle: 'Finance Analyst',
      outlet: null,
    },
    permissions: [...adminViewCodes],
    attributes: {},
  },
  {
    id: 'outlet-crew',
    name: 'Outlet Crew',
    summary: 'Hanya aplikasi mobile: hitung stok, isi waste, terima DO.',
    profile: {
      name: 'Dwi Anggara',
      email: 'dwi.anggara@amb.demo',
      jobTitle: 'Outlet Crew',
      outlet: 'Dapur Menteng (SO01)',
    },
    permissions: [...mobileCodes],
    attributes: {},
  },
];

export const DEFAULT_PERSONA_ID = 'admin-penuh';

export const PERSONA_BY_ID = Object.freeze(
  PERSONAS.reduce((acc, persona) => {
    acc[persona.id] = persona;
    return acc;
  }, {}),
);

export const getPersona = (id) => PERSONA_BY_ID[id] ?? PERSONA_BY_ID[DEFAULT_PERSONA_ID];
