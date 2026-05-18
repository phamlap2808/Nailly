# Admin Reports Tabs And Charts

Date: 2026-05-18
Status: Approved for implementation planning

## Goal

Redesign the admin `Reports` page so finance data is easier to manage by splitting it into focused report tabs and adding lightweight charts for quick visual scanning.

The redesign uses Option A, the approved Executive Tabs direction.

## Requirements

- Use Nuxt UI `UTabs` for the report tab control.
- Store the active report tab in the URL query as `?tab=<value>`.
- Preserve the current backend contract and existing `/admin/reports/revenue` response.
- Preserve existing filters: date range, staff, and payment method.
- Preserve existing CSV export links.
- Add charts without introducing a heavy charting library.
- Keep the page responsive on mobile and tablet.

## Nuxt UI Tabs Behavior

Use `UTabs` with an `items` array and explicit `value` fields.

Report tab values:

- `overview`
- `revenue`
- `payments`
- `services`
- `staff`
- `exports`

The active tab is controlled by a computed model:

- Getter reads `route.query.tab`.
- Invalid or missing tab falls back to `overview`.
- Setter updates the current route query while preserving other query parameters.

This follows the official Nuxt UI Tabs pattern for controlled active items and route query backed tabs.

Reference:

- `https://ui.nuxt.com/docs/components/tabs`

## Page Structure

Header:

- Keep the existing `Finance / Reports` page title and description.
- Keep the print action in the header.

Filters:

- Keep one shared filter panel above the tabs.
- Filters apply to all report tabs.
- Filters remain local state for this pass; only active tab is stored in the URL.

Tabs:

- Use a horizontal `UTabs` control under the filters.
- Use a polished Warm Editorial style so the tabs match the admin system.
- On smaller screens, tabs may horizontally scroll rather than compress text.

## Tab Content

### Overview

Purpose: quick executive summary.

Content:

- KPI grid: Gross, Refunds, Net, Tax, Tips, Invoices.
- Revenue trend chart grouped from visible invoices by day.
- Payment mix chart based on visible payments.
- Compact top service and top staff preview lists.

### Revenue

Purpose: invoice status and revenue quality.

Content:

- Revenue by status chart.
- Status breakdown rows with invoice count and total amount.
- Empty state when no invoices match filters.

### Payments

Purpose: payment method and refund visibility.

Content:

- Payment method chart.
- Payment breakdown rows.
- Refund summary section using report refunds.
- Empty state when no payments match filters.

### Services

Purpose: service sales performance.

Content:

- Top services chart using service sales rows.
- Service sales table with service, lines, quantity, and sales.

### Staff

Purpose: staff sales and commission reporting.

Content:

- Staff payroll chart using payroll rows.
- Staff payroll table with staff, lines, sales, and commission.

### Exports

Purpose: keep CSV actions findable without cluttering analytics.

Content:

- Existing CSV links: invoices, payments, refunds, payroll.
- Short copy explaining exports keep the current endpoint behavior in this pass.

## Chart Design

Use local CSS/SVG charts rather than adding a chart library.

Chart types:

- Vertical bar chart for revenue trend.
- Donut or segmented chart for payment mix.
- Horizontal bars for status, service, and staff rankings.

Requirements:

- Charts must use stable dimensions with responsive constraints.
- Charts must not depend on viewport-based font sizing.
- Every chart needs readable text labels or adjacent rows so users are not forced to infer exact values from visuals alone.
- Empty chart states should show a quiet message instead of blank space.

## Data Flow

The page continues fetching:

- `GET /admin/reports/revenue`

Existing derived data remains:

- `visibleInvoices`
- `visiblePayments`
- `visibleItems`
- `summary`
- `statusBreakdown`
- `paymentBreakdown`
- `serviceRows`
- `payrollRows`

New derived data:

- `visibleRefunds`
- `revenueTrendRows`
- `topServiceRows`
- `topPayrollRows`

No backend changes are required.

## Testing

Add frontend tests that verify:

- The Reports page uses `UTabs`.
- The tab values include `overview`, `revenue`, `payments`, `services`, `staff`, and `exports`.
- Active tab state is backed by `route.query.tab`.
- Invalid or missing tab falls back to `overview`.
- Chart helper data groups revenue by day and keeps values in cents.

Verification after implementation:

- `bun --filter @nailly/web test`
- `docker compose run --rm tooling bun --filter @nailly/web lint`
- `docker compose run --rm tooling bun --filter @nailly/web build`
