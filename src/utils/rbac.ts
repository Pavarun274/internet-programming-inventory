import { AuthUser } from "@/services/api";

/**
 * Determines whether a user has permission to view or access financial data
 * (pricing, revenue, profits, inventory asset values, financial charts).
 * Only accounts with non-"user" roles (e.g. "admin") have access.
 */
export function hasFinancialAccess(user: AuthUser | null | undefined): boolean {
  if (!user || !user.role) return false;
  return user.role !== "user";
}

/**
 * Determines whether a user has permission to manage (add, edit, delete) products.
 */
export function canManageInventory(user: AuthUser | null | undefined): boolean {
  if (!user || !user.role) return false;
  return user.role !== "user";
}
