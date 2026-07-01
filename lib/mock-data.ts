import type { Business, Category, Product } from "./types";

// Seed data used on first run (no DB yet). Two independent tenants so the
// multi-business behaviour is visible from the start.

export interface SeedData {
  businesses: Business[];
  categories: Category[];
  products: Product[];
}

const now = "2026-06-01T12:00:00.000Z";

function p(
  businessId: string,
  id: string,
  name: string,
  price: number,
  stock: number,
  categoryId: string,
  sku?: string
): Product {
  return {
    id,
    businessId,
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
  const b1 = "biz-trebol";
  const b2 = "biz-nogal";

  const businesses: Business[] = [
    {
      id: b1,
      name: "Kiosco El Trébol",
      slug: "el-trebol",
      legalName: "El Trébol de Marcela Ávila",
      taxId: "27-28461937-4",
      address: "Bv. Oroño 1243, Rosario",
      phone: "341 555 8842",
      currency: "ARS",
      createdAt: now,
    },
    {
      id: b2,
      name: "Bazar Nogal",
      slug: "bazar-nogal",
      legalName: "Nogal Hogar SRL",
      taxId: "30-71544098-2",
      address: "San Martín 987, Córdoba",
      phone: "351 421 9075",
      currency: "ARS",
      createdAt: now,
    },
  ];

  const categories: Category[] = [
    { id: "cat-bebidas", businessId: b1, name: "Bebidas" },
    { id: "cat-golosinas", businessId: b1, name: "Golosinas" },
    { id: "cat-cigarrillos", businessId: b1, name: "Cigarrillos" },
    { id: "cat-almacen", businessId: b1, name: "Almacén" },
    { id: "cat-cocina", businessId: b2, name: "Cocina" },
    { id: "cat-mesa", businessId: b2, name: "Mesa" },
    { id: "cat-organizacion", businessId: b2, name: "Organización" },
  ];

  const products: Product[] = [
    // Kiosco El Trébol
    p(b1, "p-cocacola", "Coca-Cola 500ml", 1350, 42, "cat-bebidas", "779000011"),
    p(b1, "p-aguamai", "Agua Mai sin gas 500ml", 900, 30, "cat-bebidas", "779000028"),
    p(b1, "p-quilmes", "Cerveza Quilmes 1L", 2400, 18, "cat-bebidas"),
    p(b1, "p-speed", "Speed XL energizante", 1800, 24, "cat-bebidas"),
    p(b1, "p-alfajor", "Alfajor Guaymallén", 550, 60, "cat-golosinas"),
    p(b1, "p-oreo", "Galletitas Oreo", 1200, 27, "cat-golosinas"),
    p(b1, "p-chicle", "Chicle Beldent menta", 400, 80, "cat-golosinas"),
    p(b1, "p-marlboro", "Marlboro box 20", 3200, 15, "cat-cigarrillos"),
    p(b1, "p-philip", "Philip Morris 20", 2950, 12, "cat-cigarrillos"),
    p(b1, "p-yerba", "Yerba Playadito 1kg", 4100, 9, "cat-almacen"),
    p(b1, "p-azucar", "Azúcar Ledesma 1kg", 1550, 14, "cat-almacen"),
    p(b1, "p-fideos", "Fideos Matarazzo 500g", 1300, 22, "cat-almacen"),

    // Bazar Nogal
    p(b2, "p-sarten", "Sartén antiadherente 24cm", 18900, 8, "cat-cocina"),
    p(b2, "p-olla", "Olla acero 20cm", 24500, 5, "cat-cocina"),
    p(b2, "p-tabla", "Tabla de madera algarrobo", 9800, 11, "cat-cocina"),
    p(b2, "p-cuchillo", "Set 3 cuchillos Tramontina", 12400, 7, "cat-cocina"),
    p(b2, "p-vasos", "Set 6 vasos vidrio", 8600, 16, "cat-mesa"),
    p(b2, "p-plato", "Plato playo cerámica", 3200, 40, "cat-mesa"),
    p(b2, "p-mantel", "Mantel algodón 1,40m", 11200, 9, "cat-mesa"),
    p(b2, "p-frascos", "Frascos herméticos x3", 7400, 13, "cat-organizacion"),
    p(b2, "p-canasto", "Canasto plástico apilable", 5600, 20, "cat-organizacion"),
  ];

  return { businesses, categories, products };
}
