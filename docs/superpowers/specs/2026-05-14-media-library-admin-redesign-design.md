# Media Library Admin Redesign

Date: 2026-05-14
Status: Approved for implementation

## Goal

Redesign `Admin > Media` so managers can manage uploaded imagery faster and with clearer hierarchy. The page should move from a simple upload form plus card grid into a management-oriented media library using the approved Warm Editorial admin style.

The backend API and database schema stay unchanged. The redesign is frontend-only.

## Direction

Use the approved **Library Table + Upload Rail** layout:

- A compact upload rail on the left.
- A searchable, filterable media table on the right.
- Pagination for large media libraries.
- Mobile-friendly stacked rows.

This direction prioritizes operational clarity over a decorative gallery view. Media should still show image thumbnails, but the page should make metadata work easy: finding assets, checking usage, seeing file size, and updating alt text.

## Scope

In scope:

- Redesign `apps/web/pages/admin/media.vue`.
- Add frontend-only media filtering, search, pagination, and display helpers.
- Add focused tests for helper logic where practical.
- Keep existing upload and alt-text update behavior.
- Preserve support for `gallery`, `service`, and `staff` usage types.
- Keep responsive behavior polished on desktop, tablet, and mobile.

Out of scope:

- Backend API changes.
- Delete media.
- Bulk upload.
- Bulk edit.
- Assigning media directly to services or staff.
- Image cropping or transformation.
- New database fields.

## Layout

Desktop uses a two-column admin workspace:

- **Upload Rail**: narrow left panel, about 280-340px wide.
- **Media Library**: main right panel, fills remaining width.

The upload rail contains:

- File picker styled as a contained upload target.
- Alt text field.
- Usage select.
- Upload button with loading state.
- Inline upload error.
- Short file guidance: JPEG, PNG, WEBP, up to 5 MB.

The library panel contains:

- Header row with title and count summary.
- Toolbar with search, usage filter, and rows-per-page select.
- Table with thumbnail, asset details, usage, size, alt status, alt text editor, and action state.
- Pagination footer with count summary and Previous/Next controls.

## Table Behavior

Rows should be scannable and dense, similar to the redesigned Services and Staff pages.

Columns:

- **Asset**: thumbnail plus a short label derived from the asset URL/object path when possible.
- **Usage**: `Gallery`, `Service`, or `Staff` displayed as a compact badge.
- **Size**: formatted as KB or MB.
- **Alt status**: `Ready` when alt text is non-empty, `Missing` when empty.
- **Alt text**: editable input that keeps current PATCH-on-change behavior.
- **Action/status**: compact `Saved`/`Saving`/`Error` row feedback may be shown for alt-text edits using local frontend state only.

Search should match:

- Alt text.
- Usage type.
- Public URL or derived filename.

Usage filter options:

- All.
- Gallery.
- Service.
- Staff.

Pagination should match the admin Staff/Services pattern:

- Rows per page: 5, 10, 20.
- Reset to page 1 when search, usage filter, or page size changes.
- Clamp current page if filtered results shrink.
- Empty state distinguishes between no media yet and no media matching filters.

## Responsive Behavior

Tablet:

- Upload rail stacks above the library or becomes a full-width panel.
- Below 980px, toolbar becomes two columns, with search spanning the full width.

Mobile:

- Single-column layout.
- Table header hides.
- Each media row becomes a card-like stacked row.
- Thumbnail remains stable and does not force horizontal scroll.
- Alt text input and actions use full width when needed.
- Pagination controls stack cleanly.

No text should overlap, clip, or require viewport-based font sizing.

## Data Flow

Data flow remains unchanged:

- Fetch media with `GET /admin/media`.
- Upload media with `POST /admin/media`.
- Update alt text with `PATCH /admin/media/:id`.

Frontend computed helpers may derive:

- Filename label from `publicUrl`.
- Usage label.
- Formatted byte size.
- Alt status.
- Filtered media list.
- Paginated media list.

These helpers must not change persisted data.

## Error Handling and States

Loading:

- Show a polished panel loading state.

Upload errors:

- Keep the existing inline error pattern.
- Preserve backend error messages where available.

Alt text update:

- Keep current behavior of patching on field change.
- If adding visual feedback, keep it local to the row and do not block unrelated rows.

Empty states:

- No media: explain that uploaded media will appear in the library.
- No filter matches: explain that current filters returned no assets.

## Testing

Add or update frontend tests for pure helper behavior:

- Media filtering by search and usage.
- Pagination with page clamping.
- Byte formatting.
- Alt status derivation.

Run verification before completion:

- `@nailly/web` tests.
- `@nailly/web` lint/typecheck.
- `@nailly/web` build.

## Implementation Notes

Expected files:

- Modify `apps/web/pages/admin/media.vue`.
- Add `apps/web/utils/admin-media-library.ts` for filtering, pagination, formatting, and alt-status helpers.
- Add `apps/web/tests/admin-media-library.test.ts` for helper tests.

The implementation should reuse current global form, button, panel, and pagination visual patterns from Staff and Services.
