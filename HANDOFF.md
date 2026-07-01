# Handoff — Mejoras POS / Caja / Productos / Reportes

Rama: `nacho/reportes-desde-db`

## Regla más importante de esta etapa
**No se puede registrar una venta sin una caja abierta.** Está enforced en dos capas:
- **UI (POS):** si no hay caja abierta, se muestra un aviso ("Para realizar ventas primero tenés que abrir la caja") con botón a `/caja`, y el botón de cobrar queda deshabilitado.
- **Servidor (no salteable):** `SaleRepository.createSale` valida dentro de la transacción que exista una `CashSession` con estado `OPEN` del tenant; si no, tira error y no graba nada.

> ⚠️ **Al deployar esto:** en la base de producción, si no hay una caja abierta, **todas las ventas quedan bloqueadas** hasta que alguien abra la caja desde `/caja`. Es el comportamiento buscado, pero tenelo en cuenta.

## Restricción respetada
- **No se tocó la base de datos.** `prisma/schema.prisma` quedó **idéntico** a `main`, no se crearon migraciones, no se cambiaron modelos ni columnas.
- Las pantallas que ya usaban Prisma/server actions (POS, Ventas, Productos) **no se migraron**: se mejoró UI, validaciones y bloqueos alrededor.
- Caja y Reportes (que estaban en localStorage) ahora **leen/escriben la tabla `CashSession` y las tablas de ventas que YA existen** — sin cambios de schema.

## Archivos modificados
**Caja (nuevo módulo, sobre tablas existentes)**
- `src/commerce/cash/schemas.ts` · `repository.ts` · `service.ts` · `actions.ts` · `hooks.ts` — abrir/cerrar caja + arqueo, usando solo `CashSession`. Guard de acceso `assertAccess("caja")`.
- `app/(app)/caja/page.tsx` — reescrita: usa la DB (antes localStorage). Validación de fondo inicial ≥ 0, estado abierta/cerrada claro, confirmación al cerrar, esperado/contado/diferencia, historial ordenado.

**Ventas / POS**
- `src/commerce/sales/repository.ts` — guard de caja abierta en `createSale` (server-side); `getById` para el ticket.
- `src/commerce/sales/service.ts` — `listSales` (reportes) y `getSaleForTicket` (comprobante + datos del negocio desde `Settings`).
- `src/commerce/sales/actions.ts` — `listSalesAction`, `getSaleForTicketAction`.
- `src/commerce/sales/hooks.ts` — `useSalesReport`, `useSaleTicket`; invalida caché de ventas/caja al vender.
- `src/commerce/sales/components/payment-modal.tsx` — resumen (unidades + total) antes de cobrar; fix de lint (reset en render, no en efecto).
- `app/(app)/pos/page.tsx` — bloqueo por caja cerrada, validaciones de carrito (vacío, stock, cantidad ≤ stock, descuento ≤ subtotal, total > 0), botón "Vaciar carrito", mensajes de error/éxito claros, botón "Ver ticket" post-venta.

**Ticket**
- `app/ticket/[id]/page.tsx` — reescrita: lee la venta de la DB (antes localStorage). Imprimible.

**Productos**
- `src/commerce/products/schemas.ts` — `stock` con `min(0)` (no permite negativo). (Nombre y precio ya validaban.)
- `src/commerce/products/components/product-form-modal.tsx` — fix de lint (reset en render).
- `app/(app)/productos/page.tsx` — archivar/reactivar con confirmación, "Sin stock" y "Bajo · N" más claros. Búsqueda por nombre/SKU/código y filtros ya existían.

**Reportes**
- `app/(app)/reportes/page.tsx` — reescrita: lee ventas de la DB. KPIs (ventas, tickets, unidades, ticket promedio), hoy/7d/30d, ventas por día, medios de pago (5), más vendidos, estado vacío.

## Verificación
- `npm run lint` → **sin errores**.
- `npm run build` → **OK** (los `BetterAuthError`/"Base URL" son warnings por falta de `.env` local; en prod con env seteadas no aparecen).
- `npx tsc --noEmit` → **OK**.

## Pendiente para la etapa de base de datos
1. **Ingresos/egresos de caja (aportes/retiros manuales).** Requieren una tabla nueva (`CashMovement`) → quedó **fuera** para no tocar el schema. Hoy el "efectivo esperado" = fondo inicial + ventas en efectivo del turno. Cuando se agregue la tabla, sumar income − expense al arqueo.
2. **Acceso de EMPLEADO a Caja.** Hoy `src/core/auth/access.ts` deja la sección `caja` solo para ADMIN (EMPLEADO = `pos`, `ventas`). Implica que **un empleado no puede abrir la caja**: si trabaja solo y la caja está cerrada, no puede vender hasta que un ADMIN la abra. Definir si se agrega `caja` a `EMPLEADO_SECTIONS`.
3. **Filtro "archivados"** en Productos (hoy los inactivos aparecen con badge "Inactivo" pero no hay filtro dedicado).

## Notas de auth/infra (contexto)
- El login ya funciona en prod tras cargar en Vercel las 4 env: `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET`, `DEFAULT_ORG_ID`.
- Credenciales seed del admin: `admin@zafari.local` / `admin1234` (cambiar tras el primer login).
