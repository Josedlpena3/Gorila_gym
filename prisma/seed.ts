import bcrypt from "bcrypt";
import {
  DeliveryMethod,
  DiscountType,
  Objective,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
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

  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Proteínas",
        slug: "proteinas",
        description: "Aislados, concentrados y blends premium."
      }
    }),
    prisma.category.create({
      data: {
        name: "Creatinas",
        slug: "creatinas",
        description: "Creatina micronizada para fuerza, potencia y volumen."
      }
    }),
    prisma.category.create({
      data: {
        name: "Pre entrenos",
        slug: "pre-entrenos",
        description: "Fórmulas para empuje, foco y energía."
      }
    }),
    prisma.category.create({
      data: {
        name: "Aminoácidos",
        slug: "aminoacidos",
        description: "BCAA y fórmulas de recuperación muscular."
      }
    }),
    prisma.category.create({
      data: {
        name: "Vitaminas y bienestar",
        slug: "vitaminas-bienestar",
        description: "Soporte diario para salud, recuperación e inmunidad."
      }
    }),
    prisma.category.create({
      data: {
        name: "Ganadores de peso",
        slug: "ganadores-de-peso",
        description: "Calorías y nutrientes para subir masa muscular."
      }
    }),
    prisma.category.create({
      data: {
        name: "Quemadores",
        slug: "quemadores",
        description: "Apoyo para definición y rendimiento metabólico."
      }
    }),
    prisma.category.create({
      data: {
        name: "Accesorios",
        slug: "accesorios",
        description: "Shakers y accesorios de entrenamiento."
      }
    })
  ]);

  const categoryBySlug = Object.fromEntries(
    categories.map((category) => [category.slug, category])
  );

  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: "STAR-WHEY-001",
        name: "Star Whey Premium",
        slug: "star-whey-premium",
        brand: "Star Nutrition",
        objective: Objective.MUSCLE_GAIN,
        categoryId: categoryBySlug["proteinas"].id,
        description:
          "Proteína whey premium para desarrollo muscular, recuperación rápida y mejor cobertura proteica diaria.",
        benefits: [
          "24 g de proteína por porción",
          "Ideal para post entreno",
          "Excelente solubilidad"
        ],
        price: 52990,
        stock: 20,
        active: true,
        featured: true,
        weight: "2 lb",
        flavor: "Chocolate",
        images: {
          create: [
            {
              url: "https://starnutrition.com.ar/cdn/shop/files/CreatineM-300g.png?v=1718218487",
              alt: "Suplemento Star Nutrition",
              position: 0,
              isPrimary: true
            }
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        sku: "ENA-CREA-002",
        name: "ENA Creatina Micronizada",
        slug: "ena-creatina-micronizada",
        brand: "ENA",
        objective: Objective.PERFORMANCE,
        categoryId: categoryBySlug["creatinas"].id,
        description:
          "Creatina micronizada de alta pureza para mejorar la fuerza, la potencia y el rendimiento en series intensas.",
        benefits: [
          "5 g por porción",
          "Mayor fuerza y volumen",
          "Mezcla fácil"
        ],
        price: 24990,
        stock: 28,
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
        sku: "XTR-PRE-003",
        name: "Xtrenght Pre Extreme",
        slug: "xtrenght-pre-extreme",
        brand: "Xtrenght",
        objective: Objective.PERFORMANCE,
        categoryId: categoryBySlug["pre-entrenos"].id,
        description:
          "Pre entreno con cafeína y citrulina para más energía, congestión y enfoque antes de las rutinas exigentes.",
        benefits: [
          "Energía sostenida",
          "Mayor foco mental",
          "Ayuda a la congestión"
        ],
        price: 31990,
        stock: 15,
        active: true,
        featured: false,
        weight: "420 g",
        flavor: "Frutos rojos",
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1200&q=80",
              alt: "Pre entreno de alto rendimiento",
              position: 0,
              isPrimary: true
            }
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        sku: "ULT-BCAA-004",
        name: "Ultra Tech BCAA Recovery",
        slug: "ultra-tech-bcaa-recovery",
        brand: "Ultra Tech",
        objective: Objective.RECOVERY,
        categoryId: categoryBySlug["aminoacidos"].id,
        description:
          "BCAA con glutamina para mejorar la recuperación muscular y bajar la fatiga luego de sesiones intensas.",
        benefits: [
          "Recuperación más rápida",
          "Menor fatiga muscular",
          "Fácil de tomar"
        ],
        price: 21990,
        stock: 24,
        active: true,
        featured: false,
        weight: "300 g",
        flavor: "Lima limón",
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1622484212850-eb596d769edc?auto=format&fit=crop&w=1200&q=80",
              alt: "BCAA para recuperación",
              position: 0,
              isPrimary: true
            }
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        sku: "GLD-GAIN-005",
        name: "Gold Nutrition Mass Builder",
        slug: "gold-nutrition-mass-builder",
        brand: "Gold Nutrition",
        objective: Objective.MUSCLE_GAIN,
        categoryId: categoryBySlug["ganadores-de-peso"].id,
        description:
          "Ganador de peso con carbohidratos y proteína para etapas de volumen con alta demanda calórica.",
        benefits: [
          "Aporta calorías extra",
          "Con proteína de rápida absorción",
          "Ideal para volumen"
        ],
        price: 46990,
        stock: 14,
        active: true,
        featured: false,
        weight: "3 kg",
        flavor: "Vainilla",
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1579722820308-d74e571900a9?auto=format&fit=crop&w=1200&q=80",
              alt: "Mass gainer",
              position: 0,
              isPrimary: true
            }
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        sku: "ON-WHEY-006",
        name: "Gold Standard Whey",
        slug: "gold-standard-whey",
        brand: "Optimum Nutrition",
        objective: Objective.MUSCLE_GAIN,
        categoryId: categoryBySlug["proteinas"].id,
        description:
          "Proteína whey blend para recuperación y construcción muscular con perfil aminoacídico completo.",
        benefits: [
          "Proteína de alta calidad",
          "Blend versátil para todo el día",
          "Sabor premium"
        ],
        price: 64990,
        stock: 12,
        active: true,
        featured: true,
        weight: "2.27 kg",
        flavor: "Doble chocolate",
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1579722821273-0f6c0f1cf5d9?auto=format&fit=crop&w=1200&q=80",
              alt: "Proteína whey premium",
              position: 0,
              isPrimary: true
            }
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        sku: "BSN-SYN-007",
        name: "BSN Syntha-6",
        slug: "bsn-syntha-6",
        brand: "BSN",
        objective: Objective.RECOVERY,
        categoryId: categoryBySlug["proteinas"].id,
        description:
          "Blend proteico pensado para colaciones y recuperación con textura cremosa y liberación sostenida.",
        benefits: [
          "Perfil proteico mixto",
          "Ideal para meriendas",
          "Textura cremosa"
        ],
        price: 58990,
        stock: 16,
        active: true,
        featured: false,
        weight: "2.01 kg",
        flavor: "Cookies & cream",
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1622484212373-58d24f8d6c8d?auto=format&fit=crop&w=1200&q=80",
              alt: "Proteína en polvo",
              position: 0,
              isPrimary: true
            }
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        sku: "MT-NITRO-008",
        name: "Muscletech Nitro Tech",
        slug: "muscletech-nitro-tech",
        brand: "Muscletech",
        objective: Objective.MUSCLE_GAIN,
        categoryId: categoryBySlug["proteinas"].id,
        description:
          "Proteína avanzada orientada a fuerza y volumen con aminoácidos agregados y gran digestibilidad.",
        benefits: [
          "Apoyo para masa muscular",
          "Con aminoácidos agregados",
          "Ideal para post entreno"
        ],
        price: 69990,
        stock: 10,
        active: true,
        featured: false,
        weight: "4 lb",
        flavor: "Milk chocolate",
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=1200&q=80",
              alt: "Proteína para masa muscular",
              position: 0,
              isPrimary: true
            }
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        sku: "UNI-PAK-009",
        name: "Universal Animal Pak",
        slug: "universal-animal-pak",
        brand: "Universal",
        objective: Objective.WELLNESS,
        categoryId: categoryBySlug["vitaminas-bienestar"].id,
        description:
          "Pack multivitamínico y mineral para sostener salud general, recuperación y rendimiento deportivo.",
        benefits: [
          "Cobertura diaria completa",
          "Soporte inmune",
          "Pensado para atletas"
        ],
        price: 37990,
        stock: 18,
        active: true,
        featured: false,
        weight: "44 packs",
        flavor: "Sin sabor",
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80",
              alt: "Multivitamínico deportivo",
              position: 0,
              isPrimary: true
            }
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        sku: "CELL-C4-010",
        name: "Cellucor C4 Original",
        slug: "cellucor-c4-original",
        brand: "Cellucor",
        objective: Objective.PERFORMANCE,
        categoryId: categoryBySlug["pre-entrenos"].id,
        description:
          "Pre entreno clásico para mejorar energía, foco y explosividad antes de entrenar.",
        benefits: [
          "Energía inmediata",
          "Más intensidad",
          "Muy buena solubilidad"
        ],
        price: 45990,
        stock: 13,
        active: true,
        featured: true,
        weight: "390 g",
        flavor: "Fruit punch",
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1615486363974-1d2dce59f6f4?auto=format&fit=crop&w=1200&q=80",
              alt: "Pre entreno premium",
              position: 0,
              isPrimary: true
            }
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        sku: "GS-SHK-011",
        name: "Shaker Premium Gorila",
        slug: "shaker-premium-gorila",
        brand: "Gorila Strong",
        objective: Objective.WELLNESS,
        categoryId: categoryBySlug["accesorios"].id,
        description:
          "Shaker reforzado con cierre hermético para preparar proteína, creatina o intra entrenos sin pérdidas.",
        benefits: [
          "Mezcla práctica",
          "Material resistente",
          "Tapa hermética"
        ],
        price: 8990,
        stock: 30,
        active: true,
        featured: false,
        weight: "700 ml",
        flavor: "Negro mate",
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1600180758890-6b94519a8ba4?auto=format&fit=crop&w=1200&q=80",
              alt: "Shaker para suplementos",
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
      name: "10% Córdoba",
      description: "Beneficio especial para pedidos con entrega en Córdoba.",
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
