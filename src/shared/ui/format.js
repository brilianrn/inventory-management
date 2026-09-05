
const pad = (value) => String(value).padStart(2, '0');

export const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

export const formatTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatDateTime = (value) => {
  if (!value) return '-';
  return `${formatDate(value)} - ${formatTime(value)}`;
};

export const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const numberFormatter = new Intl.NumberFormat('id-ID');
const decimalFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatNumber = (value) => numberFormatter.format(value ?? 0);

export const formatDecimal = (value) => decimalFormatter.format(Number(value ?? 0));

export const formatCurrency = (value) => `Rp ${numberFormatter.format(Math.round(value ?? 0))}`;

export const formatPercent = (value) => `${decimalFormatter.format((value ?? 0) * 100)}%`;
