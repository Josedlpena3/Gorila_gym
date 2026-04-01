# Gorila Strong

Tienda virtual full stack de suplementos construida con Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, Prisma ORM, JWT y bcrypt.

## Stack

- Next.js + React
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Autenticación con JWT
- bcrypt para contraseñas

## Módulos incluidos

- Registro, login, logout y recuperación de contraseña
- Catálogo, filtros, detalle de producto y stock
- Carrito persistente por usuario
- Checkout con envío o retiro
- Pagos con Mercado Pago, transferencia y efectivo en Córdoba
- Gestión de pedidos y reservas temporales de stock
- Panel admin con dashboard, productos, pedidos, usuarios, stock y promociones
- Datos semilla para arrancar rápido

## Puesta en marcha

1. Copiar `.env.example` a `.env`.
2. Levantar PostgreSQL con `docker compose up -d`.
3. Instalar dependencias con `npm install`.
4. Ejecutar `npm run db:migrate`.
5. Cargar datos de ejemplo con `npm run db:seed`.
6. Iniciar la app con `npm run dev`.

## Usuarios semilla

- Admin: `admin@gorilastrong.com` / `Admin123!`
- Cliente: `cliente@gorilastrong.com` / `Cliente123!`

## Producción

- Configurar `JWT_SECRET`, credenciales de PostgreSQL, `NEXT_PUBLIC_APP_URL`, Mercado Pago, transferencia, delivery y SMTP.
- Programar `npm run jobs:release-expired-orders` o `POST /api/cron/release-expired-orders` con `CRON_SECRET` para liberar reservas vencidas.
- Integrar backups con `pg_dump` o snapshots gestionados por tu proveedor.
