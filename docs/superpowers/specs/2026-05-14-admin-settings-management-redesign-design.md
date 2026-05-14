# Admin Settings Management Redesign

Date: 2026-05-14
Status: Approved for implementation

## Goal

Redesign `Admin > Settings` so salon profile, contact, and SEO fields are easier to manage and more evenly distributed across the page.

The backend API and database schema remain unchanged.

## Direction

Use a **Two-column Management Form**:

- Main form on the left with clear sections.
- Sticky preview/status panel on the right.
- Short fields use balanced two-column grids.
- Long text areas use full-width rows.
- Save action is compact, clear, and stable.

## Scope

In scope:

- Redesign `apps/web/pages/admin/settings.vue`.
- Add frontend helper logic for PATCH payload normalization and preview copy.
- Add helper tests.
- Preserve `GET /admin/shop-settings` and `PATCH /admin/shop-settings`.
- Preserve current optional `email` and `mapUrl` behavior as `null` when empty.
- Make the page responsive on tablet and mobile.

Out of scope:

- Backend API changes.
- New settings fields.
- Validation beyond existing native input types.
- Autosave.
- Multi-location settings.

## Layout

Desktop:

- `settings-workspace` uses two columns: main form plus preview panel.
- Main form contains sections:
  - Public profile: shop name, tagline, description.
  - Contact: phone, email, address, map URL.
  - Search preview: SEO title, SEO description.
- Preview panel shows a concise read-only summary of the live form values.
- Save panel stays in the preview column so the primary action is easy to find without stretching across the form.

Tablet and mobile:

- Workspace stacks to one column below 980px.
- Field grids collapse cleanly below 640px.
- Buttons and save state fit without horizontal scroll.

## Data Flow

Data flow remains unchanged:

- Fetch settings with `GET /admin/shop-settings`.
- Save settings with `PATCH /admin/shop-settings`.

Frontend helpers may derive:

- Normalized save payload.
- Preview title/tagline/contact/search text.

These helpers must not persist new data or alter backend contracts.

## Testing

Add tests for:

- Empty `email` and `mapUrl` becoming `null` in the save payload.
- Non-empty values being preserved.
- Preview copy falling back to readable placeholders when fields are blank.

Run verification:

- `@nailly/web` tests.
- `@nailly/web` lint/typecheck.
- `@nailly/web` build.
