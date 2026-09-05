
export const VARIANCE_TOLERANCE = 0.05;

export const calculateVariance = ({ stockOnHand, counted }) => {
  const variance = Number((counted - stockOnHand).toFixed(2));
  const variancePercent = stockOnHand > 0 ? variance / stockOnHand : 0;
  return { variance, variancePercent };
};

export const isVarianceOutOfTolerance = ({ stockOnHand, counted, variancePercent }) => {
  if (stockOnHand === 0 && counted !== 0) return true;
  return variancePercent > VARIANCE_TOLERANCE || variancePercent < -VARIANCE_TOLERANCE;
};

export const enrichStockTakeLine = (line) => {
  const calculation = calculateVariance(line);
  const value = Number((line.counted * line.cost).toFixed(2));

  return {
    ...line,
    ...calculation,
    value,
    finalSoh: line.counted,
    outOfTolerance: isVarianceOutOfTolerance({ ...line, ...calculation }),
  };
};

export const isDocumentEditable = (document) => document.status === 'unvalidated';

export const resolveAllowValidate = ({ document, restricted, now, cutoffHour = 12 }) => {
  if (!isDocumentEditable(document)) return false;
  if (!restricted) return true;
  return now.getHours() < cutoffHour;
};

export const selectBulkValidatable = ({ documents, now }) => {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return documents.filter((document) => {
    if (document.status !== 'unvalidated') return false;
    const documentDate = new Date(document.date);
    const documentDay = new Date(
      documentDate.getFullYear(),
      documentDate.getMonth(),
      documentDate.getDate(),
    ).getTime();
    return documentDay >= startOfToday;
  });
};

export const summarizeStockTakeLines = (lines = []) => {
  const enriched = lines.map(enrichStockTakeLine);
  const flagged = enriched.filter((line) => line.outOfTolerance);
  const totalValue = enriched.reduce((sum, line) => sum + line.value, 0);

  return {
    lines: enriched,
    itemCount: enriched.length,
    flaggedCount: flagged.length,
    totalValue: Number(totalValue.toFixed(2)),
  };
};
