import {
  DiscountType,
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductType,
  RoleKey
} from "@prisma/client";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: RoleKey;
};

export type ProductCardDto = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  type: ProductType;
  objective: string;
  featured: boolean;
};

export type ProductDetailDto = ProductCardDto & {
  description: string;
  benefits: string[];
  weight?: string | null;
  flavor?: string | null;
  images: Array<{ id: string; url: string; alt: string }>;
};

export type CartItemDto = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  stock: number;
  image: string;
};

export type CartDto = {
  id: string;
  items: CartItemDto[];
  subtotal: number;
  itemCount: number;
};

export type OrderItemDto = {
  id: string;
  name: string;
  brand: string;
  quantity: number;
  price: number;
  subtotal: number;
};

export type DiscountSummaryDto = {
  id: string;
  name: string;
  code: string | null;
  type: DiscountType;
  value: number;
  amount: number;
};

export type BankTransferDetailsDto = {
  alias: string;
  cbu: string;
  accountHolder: string;
  bankName: string | null;
  instructions: string | null;
  reference: string;
  amount: number;
  expiresAt: string | null;
};

export type OrderPaymentDto = {
  provider: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  dueAt: string | null;
  paidAt: string | null;
  reference: string | null;
  checkoutUrl: string | null;
  transfer: BankTransferDetailsDto | null;
};

export type OrderSummaryDto = {
  id: string;
  code: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  subtotal: number;
  shippingCost: number;
  discountTotal: number;
  total: number;
  createdAt: string;
  province: string;
  city: string;
  items: OrderItemDto[];
  paymentStatus: PaymentStatus;
  payment: OrderPaymentDto;
};

export type PaymentMethodOptionDto = {
  method: PaymentMethod;
  label: string;
  description: string;
};

export type CheckoutQuoteDto = {
  deliveryMethod: DeliveryMethod;
  province: string | null;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  availablePaymentMethods: PaymentMethodOptionDto[];
  appliedDiscount: DiscountSummaryDto | null;
  transferPreview: Omit<
    BankTransferDetailsDto,
    "reference" | "amount" | "expiresAt"
  > | null;
};

export type AdminDashboardDto = {
  revenue: number;
  totalOrders: number;
  activeProducts: number;
  customers: number;
  pendingVerification: number;
  lowStockProducts: number;
  recentOrders: OrderSummaryDto[];
};
