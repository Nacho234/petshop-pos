# Caja · Punto de venta (PWA)

Punto de venta para **un negocio**. Esta copia está configurada para un **pet shop**.

Es una **plantilla reutilizable**: para usarla con otro negocio se **copia el repo**
(un deploy = un negocio) y se cambian los datos del negocio y el catálogo. No hay
multi-negocio en runtime; cada negocio tiene su propia copia y su propia base.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (tokens propios, light/dark)
- Zustand con persistencia en `localStorage`
- PWA (manifest + service worker, instalable, offline básico)

## Features

- **Vender** (`/pos`): búsqueda + categorías, carrito, descuento, cobro en efectivo
  (con vuelto), tarjeta o transferencia, descuento de stock y numeración de tickets.
- **Ticket** (`/ticket/[id]`): comprobante imprimible con los datos del negocio.
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

## Cómo reusarla para otro negocio

1. Copiá el repo (o usalo como *template* en GitHub → "Use this template").
2. Editá los datos del negocio y el catálogo inicial en
   [`lib/mock-data.ts`](lib/mock-data.ts). Los datos del negocio también se
   pueden editar en la app (Ajustes, ícono de engranaje).
3. Deploy independiente.

## Datos y persistencia

Hoy todo se guarda en el navegador (`localStorage`). No hay backend: los datos
son por dispositivo.

Para uso real (persistencia + varios dispositivos) el siguiente paso es conectar
**Supabase**. El punto de enganche y el esquema sugerido están documentados en
[`lib/repository.ts`](lib/repository.ts).

## Estructura

```
app/(app)/        páginas con el shell (pos, productos, caja, reportes)
app/ticket/       comprobante imprimible (sin shell)
components/       UI kit, shell, badge/ajustes del negocio, tema
lib/              tipos, store (Zustand), selectores, datos semilla, repositorio
```
