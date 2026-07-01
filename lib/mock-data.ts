import type { Business, Category, Product } from "./types";

// Seed data used on first run (no DB yet). This template ships configured for a
// pet shop. To reuse it for another business, edit `business`, `categories`
// and `products` below (and the copy in another repo becomes another store).

export interface SeedData {
  business: Business;
  categories: Category[];
  products: Product[];
}

const now = "2026-06-01T12:00:00.000Z";

function p(
  id: string,
  name: string,
  price: number,
  stock: number,
  categoryId: string,
  sku?: string
): Product {
  return {
    id,
    name,
    price,
    stock,
    trackStock: true,
    categoryId,
    sku,
    active: true,
    createdAt: now,
  };
}

export function seed(): SeedData {
  const business: Business = {
    name: "Zafari",
    legalName: "",
    taxId: "",
    address: "",
    phone: "",
    currency: "ARS",
  };

  const categories: Category[] = [
    { id: "cat-alimento-perro", name: "Alimento perros" },
    { id: "cat-alimento-gato", name: "Alimento gatos" },
    { id: "cat-higiene", name: "Higiene y arena" },
    { id: "cat-accesorios", name: "Accesorios" },
    { id: "cat-farmacia", name: "Farmacia" },
    { id: "cat-snacks", name: "Snacks" },
  ];

  const products: Product[] = [
    // Alimento perros
    p("p-doghouse-15", "Alimento Dog Chow adultos 15kg", 42800, 12, "cat-alimento-perro", "789001"),
    p("p-doghouse-3", "Alimento Dog Chow adultos 3kg", 11500, 20, "cat-alimento-perro", "789002"),
    p("p-cachorro-15", "Alimento Eukanuba cachorro 15kg", 58900, 6, "cat-alimento-perro"),
    p("p-oldprime-8", "Alimento Old Prime adultos 8kg", 21400, 15, "cat-alimento-perro"),

    // Alimento gatos
    p("p-catchow-8", "Cat Chow adultos 8kg", 34600, 10, "cat-alimento-gato", "789010"),
    p("p-catchow-15", "Cat Chow adultos 1,5kg", 8200, 24, "cat-alimento-gato"),
    p("p-whiskas-85", "Whiskas sobre 85g", 950, 90, "cat-alimento-gato"),

    // Higiene y arena
    p("p-arena-10", "Piedras sanitarias 10kg", 9800, 18, "cat-higiene"),
    p("p-arena-aglo", "Arena aglomerante 4kg", 6400, 22, "cat-higiene"),
    p("p-shampoo", "Shampoo antipulgas 250ml", 5200, 16, "cat-higiene"),
    p("p-paños", "Paños higiénicos x30", 7100, 14, "cat-higiene"),

    // Accesorios
    p("p-correa", "Correa de nylon reforzada", 8900, 9, "cat-accesorios"),
    p("p-comedero", "Comedero doble acero", 6800, 12, "cat-accesorios"),
    p("p-juguete", "Pelota de goma mordillo", 3400, 30, "cat-accesorios"),
    p("p-rascador", "Rascador para gato mediano", 24500, 4, "cat-accesorios"),
    p("p-cucha-m", "Cucha plástica mediana", 32900, 3, "cat-accesorios"),

    // Farmacia
    p("p-pipeta-p", "Pipeta antipulgas perro 10-25kg", 7600, 20, "cat-farmacia"),
    p("p-pipeta-g", "Pipeta antipulgas gato", 6900, 18, "cat-farmacia"),
    p("p-desparasita", "Desparasitario comp. x4", 5400, 25, "cat-farmacia"),

    // Snacks
    p("p-hueso", "Hueso prensado x1", 2200, 40, "cat-snacks"),
    p("p-snack-gato", "Snack Dreamies gatos 60g", 2800, 35, "cat-snacks"),
    p("p-galletas", "Galletitas perro 200g", 3100, 28, "cat-snacks"),
  ];

  return { business, categories, products };
}
