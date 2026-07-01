# Caja · Punto de venta (PWA, multinegocio)

Sistema de punto de venta reutilizable. **Es multitenant**: una sola app / un solo
deploy atiende varios negocios (kiosco, bazar, pet shop, etc.). Cada negocio es un
"tenant" con sus propios productos, ventas y caja. Para usarlo con otro negocio
**no se copia el código**: se agrega un negocio nuevo desde el selector.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (tokens propios, light/dark)
- Zustand con persistencia en `localStorage`
- PWA (manifest + service worker, instalable, offline básico)

## Features

- **Vender** (`/pos`): búsqueda + categorías, carrito, descuento, cobro en efectivo
  (con vuelto), tarjeta o transferencia, descuento de stock y numeración de tickets.
- **Ticket** (`/ticket/[id]`): comprobante imprimible.
- **Productos** (`/productos`): alta/edición/archivado, categorías, control de stock.
- **Caja** (`/caja`): apertura/cierre de turno, ingresos/egresos, arqueo (esperado vs contado).
- **Reportes** (`/reportes`): KPIs, ventas por día, medios de pago, más vendidos.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de producción
npm start          # sirve el build (el service worker solo corre en producción)
```

## Datos y persistencia

Hoy todo se guarda en el navegador (`localStorage`), scopeado por `businessId`.
No hay backend: los datos son por dispositivo.

Para uso real (persistencia + varios dispositivos) el siguiente paso es conectar
**Supabase**. El punto de enganche y el esquema sugerido (tablas + RLS por
`business_id`) están documentados en [`lib/repository.ts`](lib/repository.ts).

## Estructura

```
app/(app)/        páginas con el shell (pos, productos, caja, reportes)
app/ticket/       comprobante imprimible (sin shell)
components/       UI kit, shell, selector de negocio, tema
lib/              tipos, store (Zustand), selectores, datos semilla, repositorio
```
