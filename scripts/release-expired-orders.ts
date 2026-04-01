import { prisma } from "../src/lib/prisma";
import { releaseExpiredOrders } from "../src/modules/orders/order.service";

async function main() {
  const released = await releaseExpiredOrders();
  console.log(`Pedidos liberados: ${released}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
