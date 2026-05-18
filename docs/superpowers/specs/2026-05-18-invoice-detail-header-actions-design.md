# Invoice Detail Header Actions

Date: 2026-05-18
Status: Approved for implementation planning

## Goal

Make the invoice detail header easier to navigate and visually lighter by adding a clear return path to the invoice list and consolidating print actions into one compact control.

## Scope

In scope:

- Add a small `Back to invoices` link above the invoice heading.
- Replace the separate `Print receipt` and `Print A4` buttons with one print icon button that opens a dropdown menu.
- Preserve the existing receipt and A4 print destinations.
- Keep the header comfortable on desktop and mobile.

Out of scope:

- Changes to invoice data, payment workflows, refund workflows, or print page contents.
- New backend behavior.
- Redesigning the rest of the invoice detail page.

## Interaction Design

Header layout:

- The return link sits above the existing `Invoice` eyebrow and title so it reads as navigation, not as a transactional action.
- The print control stays on the right side of the header where the old print buttons already lived.

Print menu:

- The trigger is a compact icon button with a printer symbol and tooltip text `Print`.
- Activating the trigger opens a dropdown with exactly two actions:
  - `Print receipt`
  - `Print A4`
- Selecting either menu item navigates to the current existing route.
- The menu closes after selecting an item, clicking outside, or pressing `Escape`.

## Responsive And Accessibility Requirements

- On mobile, the back link remains above the title and the print trigger keeps a stable compact size.
- The header may wrap vertically, but controls must not overlap.
- The icon button needs an accessible label.
- The dropdown trigger should expose expanded state to assistive technology.
- Menu actions must remain keyboard reachable.

## Implementation Notes

- Reuse the current local Vue/CSS patterns in `apps/web/pages/admin/invoices/[id]/index.vue`.
- Do not add a new UI dependency for this small menu.
- Prefer a simple local state toggle plus outside-click and `Escape` handling.
- Preserve existing `NuxtLink` destinations:
  - `/admin/invoices/:id/receipt`
  - `/admin/invoices/:id/print`

## Testing

- Add a focused frontend test that asserts the invoice detail page exposes:
  - a `Back to invoices` link targeting `/admin/invoices`
  - a print menu trigger
  - both print menu destinations
- Re-run the web test suite and build verification after implementation.
