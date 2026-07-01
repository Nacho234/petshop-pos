# Arquitectura

Plataforma de gestión comercial modular. El primer cliente es un pet shop, pero
el **núcleo es genérico** y reutilizable para cualquier rubro. Lo específico de
un rubro vive en módulos opcionales.

## Las 4 capas

```
src/
  core/          # CAPA 1 — genérico: auth, organizaciones (tenant), usuarios,
                 #          roles, settings, auditoría.
  commerce/      # CAPA 2 — corazón: productos, categorías, marcas, ventas,
                 #          POS, caja, stock, pagos.
  modules/       # CAPA 3 — específico del rubro (pets, grooming, vet...).
                 #          RESERVADO. Se relaciona con el núcleo, no al revés.
  integrations/  # CAPA 4 — externos: Mercado Pago, WhatsApp, ARCA/AFIP, email.
                 #          RESERVADO.
  shared/        # UI (shadcn), hooks, lib, utils, config, types compartidos.
```

Regla de dependencias: `modules` e `integrations` pueden depender de `core` y
`commerce`, **nunca al revés**. El núcleo no sabe que existe un pet shop.

## Anatomía de un feature

Cada feature (dentro de `core/` y `commerce/`) es autocontenido:

```
commerce/products/
  components/     # UI del feature
  schemas/        # Zod (validación + tipos inferidos con z.infer)
  services/       # lógica de negocio (server)
  repository.ts   # acceso a datos, extiende BaseRepository (filtra por tenant)
  hooks/          # TanStack Query (client)
  actions.ts      # Server Actions
```

## Decisiones clave

- **Multi-tenant desde el día 1**: `organizationId` en toda entidad de negocio.
  El aislamiento se aplica en la capa repository vía `BaseRepository`
  (`src/shared/lib/repository/base-repository.ts`), no con RLS, porque el
  acceso a datos es por Prisma.
- **Dominio genérico**: `Product`, no `PetProduct`. `Customer`, no `PetCustomer`
  (CRM llega después). `Pet` será un módulo de capa 3 relacionado con `Customer`.
- **Plata en `Decimal(12,2)`**, nunca `Float`.
- **Stock nunca se edita a mano**: toda variación es un `InventoryMovement`,
  dentro de la transacción que la origina (p. ej. la venta).
- **Pagos como tabla aparte** (N por venta) → soporta pago Mixto.
- **Snapshots en `SaleItem`** (nombre + precio unitario) → el historial no se
  altera si cambia el producto después.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript estricto · TailwindCSS +
shadcn/ui · TanStack Query · React Hook Form + Zod · Zustand · Framer Motion ·
Prisma + Supabase (Postgres) · Better Auth · PWA.
