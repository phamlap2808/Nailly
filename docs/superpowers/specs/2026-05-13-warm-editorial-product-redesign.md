# Warm Editorial Product Redesign

Date: 2026-05-13
Status: Approved for implementation planning

## Goal

Redesign the Nailly frontend so the product feels professional, intuitive, and suitable for a boutique nail studio. The redesign covers the public landing page, public booking flow, and admin dashboard in one coordinated pass.

The backend API and data model should remain unchanged. The work should improve layout, visual hierarchy, responsive behavior, and component polish without adding new backend features.

## Design Direction

Use the approved Warm Editorial direction:

- Warm boutique palette built around soft ivory, clay, rose-brown, muted taupe, and deep espresso text.
- Editorial typography hierarchy, with a refined serif display face for major page titles and clean sans-serif text for forms, tables, and controls.
- Premium but restrained UI: soft surfaces, clear borders, 8px button/control radius, calm spacing, and photography-led public presentation.
- Avoid generic SaaS blue, flat template cards, oversized decorative gradients, and one-note beige UI.

The public side should feel elegant and brand-forward. The admin side should keep the same visual language but prioritize scanning, density, and operational clarity.

## Scope

In scope:

- Global CSS tokens and shared UI polish.
- Public navigation.
- Landing page.
- Service cards/list presentation.
- Gallery presentation.
- Booking page layout.
- Booking form controls, service selection, time slot grid, validation states, and confirmation state.
- Admin shell/sidebar/top navigation behavior.
- Admin overview.
- Admin bookings table/status actions.
- Admin services, staff, media, settings pages.
- Login page polish.
- Responsive behavior for mobile and tablet.
- Existing frontend tests updated to match redesigned semantics where needed.

Out of scope:

- Backend API changes.
- Database schema changes.
- New booking statuses or operational workflows.
- Online payments.
- Customer accounts.
- Multi-branch support.
- Calendar view or advanced analytics.

## Public Site Design

The landing page should become a warm editorial storefront for the salon.

Hero:

- First viewport should clearly show the salon name or brand identity, a concise value proposition, and a primary booking CTA.
- Include a strong visual area for nail/salon imagery. The implementation may use existing gallery images from the API where available and a polished fallback visual treatment when not.
- Use supporting copy that makes the page feel like a real boutique salon, not a placeholder template.
- Keep the next content section partially visible on common mobile and desktop viewport heights.

Navigation:

- Use a lighter, more refined public nav with brand on the left and concise links/actions on the right.
- Primary booking action should be visually distinct.
- Mobile nav should avoid horizontal overflow and keep the booking CTA easy to reach.

Services:

- Replace the current flat equal-card grid with a more scannable editorial service presentation.
- Service entries should make name, duration, and price easy to compare.
- Descriptions should be readable without making each service card too tall.

Trust, Gallery, Staff, Location:

- Convert "Why Choose Us" into proof blocks for hygiene, technicians, and premium products.
- Make the gallery feel like a portfolio, with responsive image rhythm rather than a plain uniform grid.
- Staff cards should look intentional even when only name and title are available.
- Location and contact details should become a clear visit panel before the final CTA.

## Booking Flow Design

The booking page should guide the customer through a long form without feeling long.

Layout:

- Desktop uses a main form area plus a sticky booking summary panel.
- Mobile uses a single-column layout with the summary placed near the final CTA.
- Avoid narrow fixed-width forms; the layout should use available width while keeping line length comfortable.

Form grouping:

- Group fields into clear sections: services, schedule, customer details, note.
- Use section headings and subtle step indicators to show progress through the form.
- Required fields must remain clear.

Service selection:

- Replace raw checkbox rows with selectable service cards.
- Each service card should show name, duration, and price; selected state should be unmistakable.
- Multiple selected services must remain understandable in the summary.

Scheduling:

- Date, staff preference, and time slots should feel connected.
- Time slot buttons must have stable dimensions, clear selected state, loading state, and empty state.
- Mobile time slots should remain large enough to tap and should not resize unpredictably.

Summary and confirmation:

- Summary should show selected services, duration or service count where available, selected date/time, party size, and total price estimate based on selected services.
- Submission state should prevent duplicate submissions.
- Success state should confirm the request was received and explain that the salon will contact the customer to confirm.
- Error state should be visually clear without overwhelming the form.

## Admin Dashboard Design

The admin dashboard should feel like an operations tool that belongs to the same brand family.

Admin shell:

- Replace the dark generic sidebar with a warmer espresso sidebar.
- Navigation should have clearer active states and better spacing.
- On mobile, admin navigation should become a compact top/tile navigation pattern rather than a cramped fixed sidebar.
- User identity and logout should remain available without dominating the layout.

Page structure:

- Use a consistent admin page header pattern: title, supporting context, primary action or filters.
- Use consistent panels for metrics, tables, forms, upload areas, and modals.
- Keep admin pages denser than the public site, but not visually cramped.

Overview:

- Improve stat cards with stronger labels, values, and context.
- Keep the overview lightweight because the current API only supports basic counts.

Bookings:

- Improve filters with segmented controls or polished select controls.
- Table rows should be easier to scan: customer, service context if available, date, time, status, action.
- Status badges should have distinct warm editorial colors for pending, confirmed, completed, and cancelled.
- On mobile, booking rows should stack into cards instead of compressing into an unreadable table.

Services and Staff:

- Use consistent list/card rows with active indicators and clear edit actions.
- Modals should use shared form styling, clear headings, and stable action placement.
- Service and staff pages should handle empty states gracefully.

Media:

- Upload form should look like a contained management panel.
- Media grid should be responsive, with stable image ratios and metadata controls that do not overflow on mobile.

Settings:

- Settings form should be organized into readable fields with a professional panel style.
- Save state should be clear and buttons should not shift layout.

Login:

- Login should match the redesigned brand direction.
- Demo credentials can remain but should be visually secondary.
- Mobile login should fit comfortably without overflow.

## Responsive Requirements

Responsive design is required for every redesigned surface.

- Mobile widths must use single-column layouts for public content and booking forms.
- Admin tables must become cards or stacked rows below tablet width.
- Navigation must not overflow horizontally.
- Buttons, segmented controls, slots, and form fields must keep stable dimensions and readable text.
- Text must not overlap, clip, or require viewport-based font scaling.
- Fixed-format elements such as time slots, media cards, service rows, and admin rows should use stable grid or flex constraints.
- Cards should use 8px radius unless a larger radius is reserved for major media containers.

## Components and Implementation Boundaries

The implementation should stay within the existing Nuxt app and reuse current API calls.

Likely frontend changes:

- `apps/web/assets/css/main.css`: design tokens, base typography, shared utility classes.
- `apps/web/components/PublicNav.vue`: public navigation redesign.
- `apps/web/pages/index.vue`: landing page redesign.
- `apps/web/pages/booking.vue`: booking page layout and summary.
- `apps/web/components/BookingForm.vue`: grouped booking form, service cards, summary data, states.
- `apps/web/components/ServiceCard.vue`: redesigned service presentation or replaced usage pattern.
- `apps/web/components/TimeSlotGrid.vue`: polished stable slot buttons.
- `apps/web/components/GalleryGrid.vue`: responsive editorial gallery.
- `apps/web/components/AdminShell.vue`: admin shell and responsive nav.
- `apps/web/pages/admin/*.vue`: admin page layout polish and responsive table/card behavior.
- `apps/web/pages/admin/login.vue`: login page polish.
- `apps/web/tests/*.test.ts`: update frontend tests to reflect new labels, controls, or structure.

Avoid introducing a new UI framework or backend contract. Use existing Nuxt modules and local CSS patterns.

## Data Flow

Data flow remains unchanged:

- Public site uses `GET /public/site`.
- Booking availability uses `GET /public/availability`.
- Booking submission uses `POST /public/bookings`.
- Admin pages use existing admin endpoints with credentials.
- Session state continues to use the existing Pinia session store and admin middleware.

The redesign may compute display-only values client-side, such as selected service total price, selected service count, and summary labels. These values must not replace server-side booking validation.

## Error Handling and States

Public pages:

- Site loading should show a polished neutral state.
- Missing optional data should degrade gracefully.
- Gallery and staff sections should hide or use intentional empty states based on current behavior.

Booking:

- Availability loading, no slots, submit loading, submit success, and submit error states must be visually distinct.
- Invalid or incomplete selections should rely on native validation plus clear UI grouping.

Admin:

- Loading and empty states should match the redesigned visual system.
- Mutating actions should keep current behavior but display clearer disabled/loading states where already supported.
- Failed API calls should not create broken layouts.

## Testing Strategy

Update and run relevant frontend tests:

- Landing smoke/content test should validate the redesigned public content still renders key services, navigation, and booking CTA.
- Booking form test should cover service selection, date/time slot interaction, summary-related behavior where practical, and successful submit flow.
- Admin nav test should validate available role-based navigation remains present.
- Admin booking/status behavior should remain covered by existing tests where applicable.
- API tests should not require changes unless frontend changes reveal a contract issue.

Verification before implementation completion should include:

```bash
docker compose run --rm tooling bun --filter @nailly/web test
docker compose run --rm tooling bun --filter @nailly/web lint
docker compose run --rm tooling bun --filter @nailly/web build
```

If shared types or API-facing behavior are touched unexpectedly, run the broader workspace verification.

## Acceptance Criteria

- Public landing page looks like a polished boutique nail studio site, not a plain template.
- Booking flow is visually grouped, easier to scan, and usable on mobile.
- Admin dashboard has a coherent operational layout with readable tables/cards and clear status badges.
- All redesigned pages are responsive across mobile, tablet, and desktop.
- Existing backend API remains unchanged.
- Existing user flows still work: public booking, admin login, booking status update, service/staff/media/settings management.
- Frontend tests, lint, and build pass after implementation.
