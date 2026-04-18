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
2. Configurar `DATABASE_URL` con una instancia PostgreSQL accesible desde red.
3. Instalar dependencias con `npm install`.
4. Ejecutar `npm run db:migrate` o `npm run db:deploy` según el entorno.
5. Cargar datos de ejemplo con `npm run db:seed`.
6. Iniciar la app con `npm run dev`.

## Usuarios semilla

- Admin: `admin@gorilastrong.com` / `Admin123!`
- Cliente: `cliente@gorilastrong.com` / `Cliente123!`

## Producción en Vercel

- `DATABASE_URL` debe apuntar a PostgreSQL remoto con SSL. No uses `localhost`.
- `JWT_SECRET` debe ser una clave larga y aleatoria.
- `NEXT_PUBLIC_APP_URL` debe ser la URL pública final, por ejemplo `https://tu-dominio.vercel.app`.
- `postinstall` ejecuta `prisma generate` automáticamente durante la instalación.
- `vercel.json` usa `npm run vercel-build`, que ejecuta `prisma migrate deploy` antes de `next build`.
- Variables opcionales:
  `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_PUBLIC_KEY`, `MERCADO_PAGO_WEBHOOK_SECRET`, `CRON_SECRET`, `DEFAULT_SHIPPING_COST`, `MERCADO_PAGO_RESERVATION_MINUTES`, `OFFLINE_PAYMENT_RESERVATION_MINUTES`, `STORE_PICKUP_RECIPIENT_NAME`, `STORE_PICKUP_STREET`, `STORE_PICKUP_NUMBER`, `STORE_PICKUP_FLOOR`, `STORE_PICKUP_APARTMENT`, `STORE_PICKUP_CITY`, `STORE_PICKUP_PROVINCE`, `STORE_PICKUP_POSTAL_CODE`, `STORE_PICKUP_COUNTRY`, `BANK_TRANSFER_ALIAS`, `BANK_TRANSFER_CBU`, `BANK_TRANSFER_ACCOUNT_HOLDER`, `BANK_TRANSFER_BANK_NAME`, `BANK_TRANSFER_INSTRUCTIONS`, `ORDER_NOTIFICATION_EMAILS`, `MAIL_FROM_NAME`, `MAIL_FROM_ADDRESS`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS`.
- Programar `npm run jobs:release-expired-orders` o `POST /api/cron/release-expired-orders` con `CRON_SECRET` para liberar reservas vencidas.
- Integrar backups con `pg_dump` o snapshots gestionados por tu proveedor.
