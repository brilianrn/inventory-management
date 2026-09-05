
export const BACK_OFFICE_CATEGORY_LABEL = {
  'produk sisa persiapan': 'Sisa Preparation',
  'produk central kitchen': 'Waste CK Handling',
};

export const RETURN_CATEGORY_NAMES = ['return to brand partner', 'return to hub pusat'];

export const displayedWasteCategoryName = (categoryName = '') =>
  BACK_OFFICE_CATEGORY_LABEL[categoryName.toLowerCase()] ?? categoryName;

export const isReturnCategory = (categoryName = '') =>
  RETURN_CATEGORY_NAMES.includes(categoryName.toLowerCase());

export const shouldShowExpiryColumn = (lines = []) =>
  lines.some((line) => Boolean(line.expiryDate));

export const buildWasteReference = ({ segment, outletName, createdAt, formatDateTime }) => {
  if (!segment || !outletName || !createdAt) return '-';
  return `Inventory/Waste/${segment}/${outletName}${formatDateTime(createdAt)}`;
};
