
export const StockTakeStatus = {
  PROCESSED: 'processed',
  VALIDATED: 'validated',
  UNVALIDATED: 'unvalidated',
  NOTIFIED: 'notified',
};

export const STOCK_TAKE_STATUS_LABEL = {
  [StockTakeStatus.PROCESSED]: 'Diproses',
  [StockTakeStatus.VALIDATED]: 'Tervalidasi',
  [StockTakeStatus.UNVALIDATED]: 'Belum Validasi',
  [StockTakeStatus.NOTIFIED]: 'Ternotifikasi',
};

export const DeliveryOrderStatus = {
  DRAFT: 'draft',
  SENT: 'sent',
  RECEIVED: 'received',
  NOT_RECEIVED: 'not_received',
  CANCELED: 'canceled',
};

export const DELIVERY_ORDER_STATUS_LABEL = {
  [DeliveryOrderStatus.DRAFT]: 'Draf',
  [DeliveryOrderStatus.SENT]: 'Dikirim',
  [DeliveryOrderStatus.RECEIVED]: 'Diterima',
  [DeliveryOrderStatus.NOT_RECEIVED]: 'Tidak Diterima',
  [DeliveryOrderStatus.CANCELED]: 'Dibatalkan',
};

export const doesOrderAffectStock = (status) => status === DeliveryOrderStatus.RECEIVED;

export const RECEIVING_CUTOFF = { hour: 22, minute: 30 };
