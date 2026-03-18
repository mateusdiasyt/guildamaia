import { countCategories } from "@/infrastructure/db/repositories/category-repository";
import { countProducts, listLowStockProducts } from "@/infrastructure/db/repositories/product-repository";
import { countStockMovements } from "@/infrastructure/db/repositories/stock-repository";
import { countSuppliers } from "@/infrastructure/db/repositories/supplier-repository";
import { countUsers } from "@/infrastructure/db/repositories/user-repository";

export async function getDashboardSummary() {
  const [users, categories, suppliers, products, stockMovements, lowStockProducts] =
    await Promise.all([
      countUsers(),
      countCategories(),
      countSuppliers(),
      countProducts(),
      countStockMovements(),
      listLowStockProducts(),
    ]);

  return {
    users,
    categories,
    suppliers,
    products,
    stockMovements,
    lowStockProducts,
  };
}
