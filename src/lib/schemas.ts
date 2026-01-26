import { z } from "zod";

// ==================== USERS ====================
export const userSchema = z.object({
  displayName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  cpf: z.string().length(11, "CPF deve ter 11 dígitos"),
  phone: z.string().min(10, "Telefone inválido"),
  address: z.string().min(5, "Endereço muito curto"),
  maritalStatus: z.string().optional(),
  gender: z.string().optional(),
  isProducer: z.boolean().default(false),
  isAdmin: z.boolean().default(false),
  producerName: z.string().optional(),
  taxId: z.string().optional(),
  businessEmail: z.string().email().optional(),
  documentUrl: z.string().url().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export type User = z.infer<typeof userSchema>;

// ==================== EVENTS ====================
export const eventSchema = z.object({
  eventName: z.string().min(3, "Nome do evento muito curto"),
  category: z.enum(["Evento", "Festival", "Show"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  location: z.string().min(5, "Local muito curto"),
  imageUrl: z.string().url("URL inválida"),
  description: z.string().min(10, "Descrição muito curta"),
  producerId: z.string(),
  // Preços Pista
  pricePistaInteira: z.number().min(0),
  pricePistaMeia: z.number().min(0).optional(),
  // Preços Pista Premium
  pricePremiumInteira: z.number().min(0).optional(),
  pricePremiumMeia: z.number().min(0).optional(),
  // Preços VIP
  priceVipInteira: z.number().min(0).optional(),
  priceVipMeia: z.number().min(0).optional(),
  // Preços Camarote
  priceCamaroteInteira: z.number().min(0).optional(),
  priceCamaroteMeia: z.number().min(0).optional(),
  // Capacidades
  capacityPista: z.number().int().min(1),
  capacityPremium: z.number().int().min(0).optional(),
  capacityVip: z.number().int().min(0).optional(),
  capacityCamarote: z.number().int().min(0).optional(),
  // Vendidos
  soldPista: z.number().int().min(0).default(0),
  soldPremium: z.number().int().min(0).default(0),
  soldVip: z.number().int().min(0).default(0),
  soldCamarote: z.number().int().min(0).default(0),
  createdAt: z.any(),
});

export type Event = z.infer<typeof eventSchema>;

// ==================== ORDERS ====================
export const orderItemSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  eventName: z.string(),
  ticketType: z.string(),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
  image: z.string(),
  location: z.string(),
  date: z.string(),
});

export const pixPayerSchema = z.object({
  name: z.string().min(3),
  documentType: z.enum(["cpf", "cnpj"]),
  document: z.string(),
  email: z.string().email(),
});

export const orderSchema = z.object({
  userId: z.string(),
  userEmail: z.string().email(),
  items: z.array(orderItemSchema).min(1),
  total: z.number().min(0),
  status: z.enum(["paid", "pending", "cancelled"]),
  paymentMethod: z.enum(["pix", "credit"]),
  pixPayer: pixPayerSchema.optional(),
  createdAt: z.any(),
});

export type Order = z.infer<typeof orderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type PixPayer = z.infer<typeof pixPayerSchema>;

// ==================== CATEGORIAS ====================
export const categories = ["Evento", "Festival", "Show"] as const;
export type Category = (typeof categories)[number];

// ==================== STATUS ====================
export const orderStatuses = ["paid", "pending", "cancelled"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

// ==================== PAYMENT ====================
export const paymentMethods = ["pix", "credit"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];
