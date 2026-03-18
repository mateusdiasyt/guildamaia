export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",
  USERS_VIEW: "users:view",
  USERS_MANAGE: "users:manage",
  CATEGORIES_VIEW: "categories:view",
  CATEGORIES_MANAGE: "categories:manage",
  SUPPLIERS_VIEW: "suppliers:view",
  SUPPLIERS_MANAGE: "suppliers:manage",
  CUSTOMERS_VIEW: "customers:view",
  CUSTOMERS_MANAGE: "customers:manage",
  PRODUCTS_VIEW: "products:view",
  PRODUCTS_MANAGE: "products:manage",
  STOCK_VIEW: "stock:view",
  STOCK_MANAGE: "stock:manage",
  CASH_VIEW: "cash:view",
  CASH_MANAGE: "cash:manage",
  PDV_VIEW: "pdv:view",
  PDV_MANAGE: "pdv:manage",
  PDV_CANCEL: "pdv:cancel",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function hasPermission(
  userPermissions: string[] | undefined,
  permission: PermissionKey,
): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  return userPermissions.includes(permission);
}
