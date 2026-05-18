# Full Finance Suite Design

## Summary

Build a full admin finance suite for Nailly that supports checkout, walk-in POS invoices, printed bills, refunds, revenue reporting, payroll-style commission reporting, and CSV exports.

The suite extends the existing booking/admin system. It does not change public booking behavior and does not introduce online card processing. Admin users record payments manually by method.

## Goals

- Let staff create an invoice from an existing booking.
- Let staff create a walk-in invoice without a booking.
- Support invoice line items with per-line staff assignment.
- Calculate subtotal, discount, fixed-rate tax, tip, total due, payments, refunds, and net collected.
- Print both 80mm receipt bills and A4 invoices.
- Support full and partial refunds with reason/history.
- Report revenue by date range, staff, service, payment method, and invoice status.
- Report staff commission using invoice-time commission snapshots.
- Export invoices, payments, refunds, revenue summaries, and payroll reports to CSV.

## Non-Goals

- No online payment gateway or card token storage.
- No accounting ledger, inventory, bank reconciliation, or tax filing workflow.
- No customer accounts.
- No multi-location finance consolidation.
- No automatic payroll payout.

## Decisions

- Tax uses a fixed shop-level tax rate configured in admin settings.
- Payment methods are fixed: `cash`, `credit_card`, `debit_card`, `zelle`, `venmo`, `gift_card`, `other`.
- Staff commission is a fixed percent on each staff profile.
- Each invoice service line can choose its own staff member.
- Invoices can be created from bookings or as walk-in POS invoices.
- Print formats include 80mm receipt and A4 invoice.
- Refunds can be partial or full and must store reason/history.
- Reports include CSV, charts, and printable report pages.

## Roles

`owner`
: Full finance access, including settings, reports, exports, refunds, voids, and commission rates.

`manager`
: Can run checkout/POS, view invoices, take payments, issue refunds/voids, and view/export reports.

`staff`
: Can run checkout/POS and view their relevant invoices. Staff cannot change tax settings, commission rates, or view full payroll reports.

## Admin Navigation

Add these admin areas:

- `POS`: create walk-in invoices and checkout active bookings.
- `Invoices`: searchable invoice list and detail.
- `Reports`: revenue, service, staff, payment-method, refund, and payroll tabs.

Existing areas extend as follows:

- `Bookings`: add `Checkout` action for eligible bookings.
- `Staff`: add commission rate field.
- `Settings`: add finance settings, starting with tax rate.

## Data Model

### Settings

Add finance fields to the existing `shop_settings` table:

- `taxRateBps`: integer basis points, where `825` means `8.25%`.
- `receiptFooter`: optional receipt footer text.
- `invoicePrefix`: default `INV`.

### Staff

Add:

- `commissionRateBps`: integer basis points, where `4500` means `45%`.

### Invoices

Fields:

- `id`
- `invoiceNumber`
- `source`: `booking` or `walk_in`
- `bookingId`: nullable
- `customerName`
- `customerPhone`
- `customerEmail`
- `status`: `draft`, `open`, `paid`, `partially_refunded`, `refunded`, `void`
- `subtotalCents`
- `discountCents`
- `discountReason`
- `taxRateBps`
- `taxCents`
- `tipCents`
- `totalCents`
- `paidCents`
- `refundedCents`
- `voidReason`
- `issuedAt`
- `paidAt`
- `voidedAt`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

### Invoice Items

Fields:

- `id`
- `invoiceId`
- `itemType`: `service` or `manual`
- `serviceId`: nullable
- `staffId`: nullable
- `name`
- `description`
- `quantity`
- `unitPriceCents`
- `lineTotalCents`
- `commissionRateBps`
- `commissionCents`
- `sortOrder`

Service invoice items snapshot name, price, staff, and commission rate at invoice time.

### Payments

Fields:

- `id`
- `invoiceId`
- `method`
- `amountCents`
- `reference`
- `note`
- `paidAt`
- `createdBy`
- `createdAt`

### Refunds

Fields:

- `id`
- `invoiceId`
- `paymentId`: nullable
- `method`
- `amountCents`
- `reason`
- `refundedAt`
- `createdBy`
- `createdAt`

## Calculation Rules

All money is stored as integer cents.

Invoice totals:

1. `subtotalCents = sum(item.quantity * item.unitPriceCents)`
2. `discountCents` cannot exceed `subtotalCents`.
3. All invoice items are taxable in this version.
4. `taxableSubtotalCents = subtotalCents - discountCents`
5. `taxCents = Math.round(taxableSubtotalCents * taxRateBps / 10000)`
6. `tipCents` is not taxed.
7. `totalCents = taxableSubtotalCents + taxCents + tipCents`
8. `paidCents = sum(payments.amountCents)`
9. `refundedCents = sum(refunds.amountCents)`
10. `netCollectedCents = paidCents - refundedCents`

Commission:

1. Each invoice item snapshots `commissionRateBps` from assigned staff.
2. `commissionCents = Math.round(lineTotalCents * commissionRateBps / 10000)`.
3. Discounts reduce invoice totals but do not rewrite historical commission snapshots unless the item is edited before payment.
4. Refunded invoices reduce report net revenue. Payroll report shows both earned commission and refunded-impact adjustments.

Status:

- `draft`: invoice is being edited.
- `open`: invoice is issued but not fully paid.
- `paid`: paid in full and not refunded.
- `partially_refunded`: paid and partially refunded.
- `refunded`: paid and fully refunded.
- `void`: cancelled before payment or administratively voided.

## Workflows

### Booking Checkout

1. Admin opens a confirmed or completed booking.
2. Admin clicks `Checkout`.
3. System creates a draft invoice with booking customer details and selected booking services.
4. Each service line defaults to the booking staff when available.
5. Admin can adjust line staff, add manual items, apply discount, add tip, and take payment.
6. When paid, booking status becomes `completed` unless it already is completed.
7. Admin can print receipt or A4 invoice.

### Walk-In POS

1. Admin opens `POS`.
2. Admin enters customer name/phone optionally.
3. Admin adds services or manual items.
4. Admin assigns staff per service line.
5. Admin applies discount/tip and records payment.
6. System creates a paid or open invoice depending on payment amount.
7. Admin can print receipt or A4 invoice.

### Refund

1. Admin opens a paid invoice.
2. Admin clicks `Refund`.
3. Admin selects amount, method, and reason.
4. System validates refund amount does not exceed remaining refundable amount.
5. Invoice status updates to `partially_refunded` or `refunded`.
6. Reports reflect gross, refunds, and net separately.

### Void

1. Admin opens a draft/open invoice with no recorded payment.
2. Admin enters void reason.
3. Invoice status becomes `void`.
4. Void invoices are excluded from collected revenue and shown separately in reports.
5. Paid invoices cannot be voided; they must use refund workflows.

## Screens

### POS

Layout:

- Left: service/manual item picker.
- Center: invoice line item table.
- Right: totals, discount, tax, tip, payment panel.

Controls:

- Add service.
- Add manual item.
- Assign staff per line.
- Edit quantity and price before payment.
- Add discount and reason.
- Add tip.
- Choose payment method.
- Save draft.
- Pay.
- Print receipt.
- Print A4 invoice.

### Invoice List

Table columns:

- Invoice number
- Customer
- Source
- Date
- Staff summary
- Total
- Paid
- Refunded
- Status
- Actions

Filters:

- Date range
- Status
- Source
- Payment method
- Staff
- Search by invoice/customer/phone

### Invoice Detail

Sections:

- Header summary.
- Customer and source booking.
- Line items.
- Totals.
- Payments.
- Refunds.
- Print actions.
- Void/refund actions.
- Audit timestamps and admin actor names.

### Print Views

Receipt 80mm:

- Salon name/address/phone.
- Invoice number/date.
- Customer optional.
- Line items.
- Subtotal, discount, tax, tip, total, payment, refund.
- Payment method.
- Footer.

A4 Invoice:

- Salon header.
- Customer block.
- Invoice metadata.
- Itemized table.
- Totals.
- Payment/refund history.
- Notes/footer.

### Reports

Tabs:

- Revenue overview.
- Sales by service.
- Sales by staff.
- Payment methods.
- Refunds.
- Payroll/commission.

Filters:

- Date range.
- Staff.
- Service/category.
- Payment method.
- Invoice status.

Outputs:

- On-screen KPI cards.
- Charts.
- Tables.
- Printable A4 report page.
- CSV exports.

## API Surface

Admin finance endpoints:

- `GET /admin/invoices`
- `POST /admin/invoices`
- `POST /admin/invoices/from-booking`
- `GET /admin/invoices/:id`
- `PATCH /admin/invoices/:id`
- `POST /admin/invoices/:id/payments`
- `POST /admin/invoices/:id/refunds`
- `POST /admin/invoices/:id/void`
- `GET /admin/invoices/:id/receipt`
- `GET /admin/invoices/:id/print`
- `GET /admin/reports/revenue`
- `GET /admin/reports/services`
- `GET /admin/reports/staff`
- `GET /admin/reports/payroll`
- `GET /admin/exports/invoices.csv`
- `GET /admin/exports/payments.csv`
- `GET /admin/exports/refunds.csv`
- `GET /admin/exports/payroll.csv`

All endpoints require admin auth and RBAC checks.

## Implementation Phases

### Phase 1: Finance Foundation

- Shared finance schemas/enums.
- Database schema for invoices, items, payments, refunds.
- Staff commission rate field.
- Tax setting field.
- Invoice math helper with unit tests.
- Seed finance demo data.

### Phase 2: Checkout and POS

- Booking checkout endpoint and action.
- Walk-in invoice creation.
- POS admin page.
- Invoice list/detail.
- Payment recording.

### Phase 3: Print and Refunds

- Receipt 80mm print view.
- A4 invoice print view.
- Void workflow.
- Partial/full refund workflow.
- Refund history.

### Phase 4: Reports and Payroll

- Revenue report APIs.
- Staff/service/payment/refund reports.
- Payroll commission report.
- Charts.
- Printable report page.
- CSV exports.

## Testing

Shared:

- Finance enum validation.
- Invoice calculation and rounding.
- Payment method validation.

API:

- Invoice creation from booking.
- Walk-in invoice creation.
- Invoice item staff assignment.
- Tax snapshot.
- Commission snapshot.
- Payment recording and status transitions.
- Partial/full refund validation.
- Void validation.
- Report aggregation.
- CSV export formatting.
- RBAC for finance actions.

Web:

- POS invoice math helpers.
- Invoice table filtering/pagination.
- Report filters and summaries.
- Print route smoke checks.
- Admin nav role visibility.

## Acceptance Criteria

- Admin can checkout an existing booking and print a bill.
- Admin can create a walk-in POS invoice.
- Invoice totals use the configured tax rate and integer-cent math.
- Each service line can have its own staff assignment.
- Commission reports use invoice-time snapshots.
- Admin can record payments with the selected fixed payment methods.
- Admin can issue partial and full refunds with reasons.
- Admin can view revenue charts and printable reports.
- Admin can export finance CSV files.
- Public booking remains unchanged.
