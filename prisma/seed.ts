import bcrypt from "bcrypt";
import {
  DeliveryMethod,
  DiscountType,
  Objective,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  ProductType,
  RoleKey
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  const [customerRole, adminRole] = await Promise.all([
    prisma.role.create({
      data: {
        key: RoleKey.CUSTOMER,
        label: "Cliente"
      }
    }),
    prisma.role.create({
      data: {
        key: RoleKey.ADMIN,
        label: "Administrador"
      }
    })
  ]);

  const [proteins, performance, wellness] = await Promise.all([
    prisma.category.create({
      data: {
        name: "Proteínas",
        slug: "proteinas",
        description: "Aislados, concentrados y blends premium."
      }
    }),
    prisma.category.create({
      data: {
        name: "Performance",
        slug: "performance",
        description: "Energía, fuerza y enfoque para rendir más."
      }
    }),
    prisma.category.create({
      data: {
        name: "Wellness",
        slug: "wellness",
        description: "Vitaminas, recuperación y salud integral."
      }
    })
  ]);

  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: "GS-WHEY-001",
        name: "Titan Whey Isolate",
        slug: "titan-whey-isolate",
        brand: "Gorila Strong",
        type: ProductType.PROTEIN,
        objective: Objective.MUSCLE_GAIN,
        categoryId: proteins.id,
        description:
          "Proteína aislada ultrafiltrada de rápida absorción con perfil alto de leucina y textura cremosa.",
        benefits: [
          "27 g de proteína por scoop",
          "Baja en lactosa",
          "Ideal para post-entreno"
        ],
        price: 48990,
        stock: 18,
        active: true,
        featured: true,
        weight: "2 lb",
        flavor: "Chocolate intenso",
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1579722821273-0f6c0f1cf5d9?auto=format&fit=crop&w=1200&q=80",
              alt: "Whey isolate premium",
              position: 0,
              isPrimary: true
            }
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        sku: "GS-CREA-002",
        name: "Creatina Monohidrato Pro",
        slug: "creatina-monohidrato-pro",
        brand: "Gorila Strong",
        type: ProductType.CREATINE,
        objective: Objective.PERFORMANCE,
        categoryId: performance.id,
        description:
          "Creatina micronizada de alta pureza para maximizar fuerza, potencia y recuperación entre sesiones.",
        benefits: [
          "5 g por porción",
          "Micronizada para mejor mezcla",
          "Apoya la fuerza explosiva"
        ],
        price: 22990,
        stock: 26,
        active: true,
        featured: true,
        weight: "300 g",
        flavor: "Sin sabor",
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=1200&q=80",
              alt: "Creatina micronizada",
              position: 0,
              isPrimary: true
            }
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        sku: "GS-PRE-003",
        name: "Rage Pre Workout",
        slug: "rage-pre-workout",
        brand: "Gorila Strong",
        type: ProductType.PRE_WORKOUT,
        objective: Objective.PERFORMANCE,
        categoryId: performance.id,
        description:
          "Pre entreno de alta intensidad con cafeína, citrulina y beta alanina para sesiones de máxima exigencia.",
        benefits: [
          "Energía sostenida",
          "Mejora el enfoque",
          "Mayor congestión muscular"
        ],
        price: 28990,
        stock: 11,
        active: true,
        featured: false,
        weight: "420 g",
        flavor: "Frutos rojos",
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1200&q=80",
              alt: "Pre workout para alto rendimiento",
              position: 0,
              isPrimary: true
            }
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        sku: "GS-VITA-004",
        name: "Daily Multi Pack",
        slug: "daily-multi-pack",
        brand: "Gorila Strong",
        type: ProductType.VITAMINS,
        objective: Objective.WELLNESS,
        categoryId: wellness.id,
        description:
          "Complejo multivitamínico para sostener energía, sistema inmune y recuperación diaria.",
        benefits: [
          "12 vitaminas esenciales",
          "Minerales quelados",
          "Uso diario simple"
        ],
        price: 15990,
        stock: 32,
        active: true,
        featured: false,
        weight: "60 cápsulas",
        flavor: "Sin sabor",
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80",
              alt: "Complejo multivitamínico",
              position: 0,
              isPrimary: true
            }
          ]
        }
      }
    })
  ]);

  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const customerPassword = await bcrypt.hash("Cliente123!", 12);

  const admin = await prisma.user.create({
    data: {
      firstName: "Gorila",
      lastName: "Admin",
      email: "admin@gorilastrong.com",
      phone: "+54 351 5550000",
      passwordHash: adminPassword,
      roleId: adminRole.id,
      cart: {
        create: {}
      }
    }
  });

  const customer = await prisma.user.create({
    data: {
      firstName: "Luciano",
      lastName: "Pereyra",
      email: "cliente@gorilastrong.com",
      phone: "+54 351 5551122",
      passwordHash: customerPassword,
      roleId: customerRole.id,
      cart: {
        create: {
          items: {
            create: [
              {
                productId: products[0].id,
                quantity: 1,
                unitPrice: products[0].price
              }
            ]
          }
        }
      }
    }
  });

  const customerAddress = await prisma.address.create({
    data: {
      userId: customer.id,
      label: "Casa",
      recipientName: "Luciano Pereyra",
      street: "Av. Colón",
      number: "2150",
      city: "Córdoba",
      province: "Córdoba",
      postalCode: "5000",
      notes: "Tocar timbre 3",
      isDefault: true
    }
  });

  await prisma.discount.create({
    data: {
      name: "10% Transferencia",
      description: "Descuento automático pagando por transferencia bancaria.",
      code: "TRANSFER10",
      type: DiscountType.PERCENTAGE,
      value: 10,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      active: true
    }
  });

  await prisma.order.create({
    data: {
      code: "GS-1001",
      userId: customer.id,
      addressId: customerAddress.id,
      deliveryMethod: DeliveryMethod.SHIPMENT,
      paymentMethod: PaymentMethod.MERCADO_PAGO,
      status: OrderStatus.DELIVERED,
      subtotal: 48990,
      discountTotal: 0,
      shippingCost: 2500,
      total: 51490,
      recipientName: customerAddress.recipientName,
      contactPhone: customer.phone,
      street: customerAddress.street,
      number: customerAddress.number,
      city: customerAddress.city,
      province: customerAddress.province,
      postalCode: customerAddress.postalCode,
      items: {
        create: [
          {
            productId: products[0].id,
            nameSnapshot: products[0].name,
            brandSnapshot: products[0].brand,
            price: products[0].price,
            quantity: 1,
            subtotal: products[0].price
          }
        ]
      },
      payment: {
        create: {
          provider: PaymentMethod.MERCADO_PAGO,
          status: PaymentStatus.APPROVED,
          amount: 51490,
          transactionId: "MP-DEMO-1001",
          externalReference: "GS-1001",
          paidAt: new Date()
        }
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      adminUserId: admin.id,
      action: "SEED_CREATED",
      entity: "system",
      metadata: {
        message: "Datos iniciales cargados"
      }
    }
  });
}

main()
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
