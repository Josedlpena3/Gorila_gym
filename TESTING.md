# Tests

Tres capas, de más rápida a más lenta. Cada una cubre algo que la anterior no
puede.

| Capa | Comando | Necesita | Qué cubre |
|---|---|---|---|
| Unitarios | `npm test` | nada | Lógica pura: precios, descuentos, teléfonos, carrito de invitado, agrupación de pedidos, URLs de imagen |
| Integración | `npm run test:integration` | Postgres | Servicios contra la base real: stock, totales, crear pedidos, editar productos |
| End to end | `npm run test:e2e` | Postgres + build | La aplicación entera en un navegador: catálogo, compra, panel |

## Unitarios

```bash
npm test
```

Corren en milisegundos y no necesitan nada. Son los que conviene dejar
corriendo en watch mientras se programa:

```bash
npm run test:watch
```

## Integración

Ejercitan los servicios tal como los llaman las rutas de API, sin pasar por
HTTP. Es la única forma de verificar que un precio o un stock manipulado desde
el cliente no se cobre.

```bash
docker compose up -d postgres

createdb() { docker exec gorila-strong-postgres psql -U postgres -c "CREATE DATABASE $1" 2>/dev/null; }
createdb gorila_strong_test

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gorila_strong_test" \
  npx prisma db push --skip-generate

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gorila_strong_test" \
  npm run test:integration
```

Usan una base aparte (`gorila_strong_test`) y limpian lo que crean.

## End to end

Levantan un **build de producción**, no `next dev`: la home y las fichas de
producto usan ISR, y ese comportamiento no existe en desarrollo. Probar sobre
`dev` verificaría una aplicación distinta de la que se despliega.

```bash
docker compose up -d postgres
docker exec gorila-strong-postgres psql -U postgres -c "CREATE DATABASE gorila_strong_e2e"

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gorila_strong_e2e" \
  npx prisma db push --skip-generate

npx playwright install chromium
npm run test:e2e
```

Playwright levanta el servidor solo (`next build && next start` en el puerto
3210) y `e2e/global-setup.ts` siembra la base antes de empezar.

Para verlos correr o depurar uno:

```bash
npm run test:e2e:ui
npx playwright test --project=chromium admin-producto
npx playwright show-report
```

### Datos

`e2e/seed.ts` deja siempre el mismo catálogo chico, así los tests pueden
afirmar sobre nombres y precios concretos en vez de sobre "lo que haya".

Los productos `editable` y `editableDos` existen solo para los tests del panel,
que editan precio, stock y categoría. Si esos tests tocaran los productos del
catálogo, los tests de compra —que verifican precios exactos— empezarían a
fallar según el orden de ejecución.

Dos detalles del seed que no son arbitrarios y conviene no "simplificar":

- **Los slugs siguen la regla de la aplicación**, `slugify(\`${name} ${brand}\`)`
  (ver `buildProductSlug`). Con un slug inventado, el primer guardado desde el
  panel lo regenera y la URL sembrada deja de existir a mitad de la suite.
- **Las categorías se upsertean por slug, no se borran y recrean.** Recrearlas
  les da un id nuevo en cada corrida, y la aplicación cachea la lista de
  categorías una hora: el formulario del panel renderiza opciones con ids
  viejos y guardar falla con "La categoría seleccionada no existe".

### Base de datos

El E2E usa `E2E_DATABASE_URL` y nunca `DATABASE_URL`, a propósito: el seed
**borra** antes de sembrar, y no debería poder hacerlo sobre la base de
desarrollo por una variable mal puesta.

## Limitaciones conocidas

- **Los E2E corren en serie** (`workers: 1`). Los tests del panel mutan la base
  y en paralelo se pisarían.
- **El 404 de producto responde 200.** Bajo ISR en ruta dinámica, Next sirve
  `notFound()` con status 200. Forzar el 404 exigiría `dynamicParams: false`,
  que dejaría inaccesible todo producto creado después del deploy. El daño real
  —que el buscador indexe fichas inexistentes— se corta con `noindex`, y eso es
  lo que verifica el test.
- **El envío del pedido por WhatsApp no se automatiza.** Abre una ventana a
  `wa.me`; los E2E llegan hasta el checkout armado y verifican el total y las
  formas de pago.
