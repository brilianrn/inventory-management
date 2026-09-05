import {
  DELIVERY_ORDER_STATUS_LABEL,
  DeliveryOrderStatus,
  RECEIVING_CUTOFF,
} from './status.js';

export const DO_STATUS_TONE = {
  draft: 'neutral',
  sent: 'processed',
  received: 'validated',
  not_received: 'unvalidated',
  canceled: 'inactive',
};

export const DO_STATUS_OPTIONS = Object.entries(DELIVERY_ORDER_STATUS_LABEL).map(
  ([value, label]) => ({ value, label }),
);

export const MAX_RECEIPT_PHOTOS = 10;

export const RECEIPT_NOTE_PRESETS = [
  { id: 'RN1', text: 'Barang lengkap dan sesuai surat jalan.', isDefault: true },
  { id: 'RN2', text: 'Diterima dengan kondisi kemasan baik.' },
  { id: 'RN3', text: 'Ada selisih minor, sudah dikonfirmasi ke pengirim.' },
  { id: 'RN4', text: 'Barang diterima sebagian, sisanya menyusul.' },
];

export const defaultReceiptNote = () =>
  RECEIPT_NOTE_PRESETS.find((note) => note.isDefault)?.text ?? '';

export const msUntilDailyCutoff = (now = new Date()) => {
  const cutoff = new Date(now);
  cutoff.setHours(RECEIVING_CUTOFF.hour, RECEIVING_CUTOFF.minute, 0, 0);
  return Math.max(0, cutoff.getTime() - now.getTime());
};

export const isPastDailyCutoff = (now = new Date()) => msUntilDailyCutoff(now) === 0;

export const isValidatable = (status) =>
  status !== DeliveryOrderStatus.RECEIVED && status !== DeliveryOrderStatus.CANCELED;

export const canViewPhotos = (order) =>
  order?.status === DeliveryOrderStatus.RECEIVED && (order?.photoCount ?? 0) > 0;

export const isExportAllowed = (isFiltering, rows = []) => Boolean(isFiltering) && rows.length > 0;

export const resendableDrafts = (orders = []) =>
  orders.filter((order) => order.status === DeliveryOrderStatus.DRAFT);

export const visibleToCrew = (orders = [], outletId) =>
  orders.filter(
    (order) =>
      order.destinationOutletId === outletId && order.status !== DeliveryOrderStatus.DRAFT,
  );

export const validateCancelNote = (note = '') =>
  note.trim() ? null : 'Alasan pembatalan tidak boleh kosong';

export const validateReceipt = ({ photos = [], note = '' }) => {
  const errors = {};
  if (!photos.length) errors.photos = 'Minimal satu foto bukti penerimaan';
  if (photos.length > MAX_RECEIPT_PHOTOS) {
    errors.photos = `Maksimal ${MAX_RECEIPT_PHOTOS} foto`;
  }
  if (!note.trim()) errors.note = 'Catatan penerimaan tidak boleh kosong';
  return errors;
};
