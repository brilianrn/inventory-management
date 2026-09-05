import { buildDocumentHistory } from './documents.js';
import {
  BRANDS,
  CREW_ACCOUNTS,
  HUB_LOCATIONS,
  OUTLETS,
  PRODUCTS,
  PRODUCT_CATEGORIES,
  RETURN_WASTE_CONFIG,
  SCHEDULES,
  SUPPLIERS,
  UOM_LIMITS,
  WASTE_CATEGORIES,
  WASTE_PRODUCT_CONFIG,
} from './master.js';
import { buildStockLevels } from './stock.js';
import { USERS } from './users.js';

let cachedSeed = null;

export const getSeed = () => {
  if (!cachedSeed) {
    const history = buildDocumentHistory();

    cachedSeed = {
      brands: BRANDS,
      crewAccounts: CREW_ACCOUNTS,
      outlets: OUTLETS,
      suppliers: SUPPLIERS,
      hubs: HUB_LOCATIONS,
      productCategories: PRODUCT_CATEGORIES,
      products: PRODUCTS,
      uomLimits: UOM_LIMITS,
      wasteCategories: WASTE_CATEGORIES,
      wasteProductConfig: WASTE_PRODUCT_CONFIG,
      returnWasteConfig: RETURN_WASTE_CONFIG,
      schedules: SCHEDULES,
      stockLevels: buildStockLevels(),
      users: USERS.map((user) => ({ ...user, permissions: [...user.permissions] })),
      ...history,
    };
  }

  return cachedSeed;
};

export const getSeedSummary = () => {
  const seed = getSeed();
  return {
    brands: seed.brands.length,
    outlets: seed.outlets.length,
    suppliers: seed.suppliers.length,
    products: seed.products.length,
    users: seed.users.length,
    stockTakeDocuments: seed.stockTakeDocuments.length,
    wasteDocuments: seed.wasteDocuments.length,
    returnWasteDocuments: seed.returnWasteDocuments.length,
    deliveryOrders: seed.deliveryOrders.length,
  };
};
