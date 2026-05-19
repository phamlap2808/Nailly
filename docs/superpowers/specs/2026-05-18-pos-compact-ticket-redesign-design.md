# POS Compact Ticket Redesign

## Summary

Redesign `/admin/pos` with the approved Option B, `Compact Ticket`, while keeping the current backend and invoice payload contract. The page should feel like a cashier work surface: fast service selection, compact editable ticket rows, and a visible total/action panel.

## Scope

- Keep existing API calls: services, staff, shop settings, and invoice creation.
- Keep invoice payload fields in cents for backend compatibility.
- Replace the current three-column layout with a two-column desktop layout:
  - Main checkout column: service search/grid and invoice ticket.
  - Sticky summary column: totals, discount/tip, save action, status.
- Improve mobile by stacking into one column with full-width controls.
- Improve money inputs by labeling them as user-facing amounts while converting to cents internally.

## UX Requirements

- Header should not carry the primary save action; the action belongs with the total.
- Service picker should use a compact grid, not a long one-item-per-row list.
- Ticket rows should not squeeze all controls into one horizontal line on narrower screens.
- Remove action should be compact and accessible.
- Summary should emphasize final total first, then subtotal/discount/tax/tip details.
- Empty ticket state should be clear and calm.

## Verification

- Add a focused static test for the approved POS layout markers.
- Run the focused test using the Node container because Vitest workers are unstable under the current Bun container.
- Run Nuxt typecheck through the existing Docker web service.
- Manually verify `/admin/pos` renders after login.
