import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core'

export const adminRole = pgEnum('admin_role', ['owner', 'manager', 'staff'])
export const bookingStatus = pgEnum('booking_status', [
  'pending_confirmation',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
])
export const invoiceStatus = pgEnum('invoice_status', [
  'draft',
  'open',
  'paid',
  'partially_refunded',
  'refunded',
  'void'
])
export const invoiceSource = pgEnum('invoice_source', ['booking', 'walk_in'])
export const invoiceItemType = pgEnum('invoice_item_type', ['service', 'manual'])
export const financePaymentMethod = pgEnum('finance_payment_method', [
  'cash',
  'credit_card',
  'debit_card',
  'zelle',
  'venmo',
  'gift_card',
  'other'
])

export const shopSettings = pgTable('shop_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  locale: text('locale').notNull().default('en'),
  tagline: text('tagline').notNull(),
  description: text('description').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address').notNull(),
  mapUrl: text('map_url'),
  openingHours: jsonb('opening_hours').$type<Record<string, string>>().notNull(),
  taxRateBps: integer('tax_rate_bps').notNull().default(825),
  receiptFooter: text('receipt_footer').notNull().default('Thank you for visiting Luma Nail Studio.'),
  invoicePrefix: text('invoice_prefix').notNull().default('INV'),
  seoTitle: text('seo_title').notNull(),
  seoDescription: text('seo_description').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  objectKey: text('object_key').notNull().unique(),
  publicUrl: text('public_url').notNull(),
  contentType: text('content_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  altText: text('alt_text').notNull(),
  usageType: text('usage_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const serviceCategories = pgTable('service_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => serviceCategories.id).notNull(),
  imageId: uuid('image_id').references(() => mediaAssets.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  priceCents: integer('price_cents').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  imageId: uuid('image_id').references(() => mediaAssets.id),
  name: text('name').notNull(),
  title: text('title').notNull(),
  bio: text('bio').notNull(),
  commissionRateBps: integer('commission_rate_bps').notNull().default(4000),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const staffServices = pgTable(
  'staff_services',
  {
    staffId: uuid('staff_id').references(() => staff.id).notNull(),
    serviceId: uuid('service_id').references(() => services.id).notNull()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.staffId, table.serviceId] })
  })
)

export const availabilityRules = pgTable('availability_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').references(() => staff.id),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  active: boolean('active').notNull().default(true)
})

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    staffId: uuid('staff_id').references(() => staff.id),
    customerName: text('customer_name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    partySize: integer('party_size').notNull().default(1),
    appointmentDate: text('appointment_date').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    status: bookingStatus('status').notNull().default('pending_confirmation'),
    note: text('note'),
    source: text('source').notNull().default('public_web'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    slotIdx: uniqueIndex('bookings_staff_date_time_unique').on(
      table.staffId,
      table.appointmentDate,
      table.startTime
    )
  })
)

export const bookingServices = pgTable(
  'booking_services',
  {
    bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
    serviceId: uuid('service_id').references(() => services.id).notNull()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.bookingId, table.serviceId] })
  })
)

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  source: invoiceSource('source').notNull(),
  bookingId: uuid('booking_id').references(() => bookings.id),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  customerEmail: text('customer_email'),
  status: invoiceStatus('status').notNull().default('draft'),
  subtotalCents: integer('subtotal_cents').notNull().default(0),
  discountCents: integer('discount_cents').notNull().default(0),
  discountReason: text('discount_reason'),
  taxRateBps: integer('tax_rate_bps').notNull().default(0),
  taxCents: integer('tax_cents').notNull().default(0),
  tipCents: integer('tip_cents').notNull().default(0),
  totalCents: integer('total_cents').notNull().default(0),
  paidCents: integer('paid_cents').notNull().default(0),
  refundedCents: integer('refunded_cents').notNull().default(0),
  voidReason: text('void_reason'),
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => adminUsers.id),
  updatedBy: uuid('updated_by').references(() => adminUsers.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => invoices.id).notNull(),
  itemType: invoiceItemType('item_type').notNull(),
  serviceId: uuid('service_id').references(() => services.id),
  staffId: uuid('staff_id').references(() => staff.id),
  name: text('name').notNull(),
  description: text('description'),
  quantity: integer('quantity').notNull().default(1),
  unitPriceCents: integer('unit_price_cents').notNull(),
  lineTotalCents: integer('line_total_cents').notNull(),
  commissionRateBps: integer('commission_rate_bps').notNull().default(0),
  commissionCents: integer('commission_cents').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => invoices.id).notNull(),
  method: financePaymentMethod('method').notNull(),
  amountCents: integer('amount_cents').notNull(),
  reference: text('reference'),
  note: text('note'),
  paidAt: timestamp('paid_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => adminUsers.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const refunds = pgTable('refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => invoices.id).notNull(),
  paymentId: uuid('payment_id').references(() => payments.id),
  method: financePaymentMethod('method').notNull(),
  amountCents: integer('amount_cents').notNull(),
  reason: text('reason').notNull(),
  refundedAt: timestamp('refunded_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => adminUsers.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: adminRole('role').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const serviceRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id]
  }),
  image: one(mediaAssets, {
    fields: [services.imageId],
    references: [mediaAssets.id]
  }),
  staffServices: many(staffServices)
}))
