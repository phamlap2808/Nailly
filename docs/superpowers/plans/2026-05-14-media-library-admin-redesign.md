# Media Library Admin Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `Admin > Media` as a Library Table + Upload Rail experience without changing backend contracts.

**Architecture:** Keep API usage in `apps/web/pages/admin/media.vue`. Move display-only logic into `apps/web/utils/admin-media-library.ts` so filtering, pagination, filename derivation, size formatting, and alt status are isolated and testable. The page composes those helpers with existing admin CSS patterns from Services and Staff.

**Tech Stack:** Nuxt 4, Vue 3 Composition API, TypeScript, Vitest, scoped CSS, existing `$fetch` admin endpoints.

---

## Files

- Modify: `docs/superpowers/specs/2026-05-14-media-library-admin-redesign-design.md`
- Create: `docs/superpowers/plans/2026-05-14-media-library-admin-redesign.md`
- Create: `apps/web/utils/admin-media-library.ts`
- Create: `apps/web/tests/admin-media-library.test.ts`
- Modify: `apps/web/pages/admin/media.vue`

## Task 1: Media Library Helper Tests

**Files:**
- Create: `apps/web/tests/admin-media-library.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/tests/admin-media-library.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  filterMediaAssets,
  formatMediaBytes,
  getAltStatus,
  getMediaFilename,
  getUsageLabel,
  paginateMediaAssets
} from '../utils/admin-media-library'

const assets = [
  {
    id: 'gallery-soft',
    publicUrl: 'http://localhost:9100/nailly-media/demo/gallery-soft-pink-manicure.jpg',
    altText: 'Soft pink manicure',
    usageType: 'gallery',
    sizeBytes: 512_000
  },
  {
    id: 'service-gel',
    publicUrl: 'http://localhost:9100/nailly-media/demo/service-gel-manicure.jpg',
    altText: '',
    usageType: 'service',
    sizeBytes: 1_572_864
  },
  {
    id: 'staff-maya',
    publicUrl: 'http://localhost:9100/nailly-media/demo/staff-maya.jpg',
    altText: 'Maya portrait',
    usageType: 'staff',
    sizeBytes: 98_304
  }
]

describe('admin media library helpers', () => {
  it('filters media by search text and usage type', () => {
    expect(filterMediaAssets(assets, { searchQuery: 'pink', usage: 'all' }).map((asset) => asset.id)).toEqual([
      'gallery-soft'
    ])

    expect(filterMediaAssets(assets, { searchQuery: 'gel', usage: 'service' }).map((asset) => asset.id)).toEqual([
      'service-gel'
    ])

    expect(filterMediaAssets(assets, { searchQuery: '', usage: 'staff' }).map((asset) => asset.id)).toEqual([
      'staff-maya'
    ])
  })

  it('paginates media and clamps the current page', () => {
    const firstPage = paginateMediaAssets(assets, 1, 2)

    expect(firstPage.items.map((asset) => asset.id)).toEqual(['gallery-soft', 'service-gel'])
    expect(firstPage).toMatchObject({
      currentPage: 1,
      totalPages: 2,
      totalItems: 3,
      startItem: 1,
      endItem: 2
    })

    const lastPage = paginateMediaAssets(assets, 9, 2)

    expect(lastPage.items.map((asset) => asset.id)).toEqual(['staff-maya'])
    expect(lastPage).toMatchObject({
      currentPage: 2,
      totalPages: 2,
      startItem: 3,
      endItem: 3
    })
  })

  it('formats media display metadata', () => {
    expect(getMediaFilename(assets[0])).toBe('gallery-soft-pink-manicure.jpg')
    expect(getUsageLabel('gallery')).toBe('Gallery')
    expect(getUsageLabel('service')).toBe('Service')
    expect(getUsageLabel('staff')).toBe('Staff')
    expect(formatMediaBytes(512_000)).toBe('500 KB')
    expect(formatMediaBytes(1_572_864)).toBe('1.5 MB')
    expect(getAltStatus('Soft pink manicure')).toBe('Ready')
    expect(getAltStatus('   ')).toBe('Missing')
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/web && node ../../node_modules/vitest/vitest.mjs run tests/admin-media-library.test.ts'
```

Expected: FAIL because `../utils/admin-media-library` does not exist.

## Task 2: Media Library Helpers

**Files:**
- Create: `apps/web/utils/admin-media-library.ts`

- [ ] **Step 1: Implement helpers**

Create `apps/web/utils/admin-media-library.ts` with:

```ts
export type MediaUsageFilter = 'all' | 'gallery' | 'service' | 'staff'
export type AltStatus = 'Ready' | 'Missing'

interface MediaAssetLike {
  publicUrl: string
  altText?: string | null
  usageType: string
  sizeBytes: number
}

interface MediaPagination<TAsset> {
  items: TAsset[]
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  startItem: number
  endItem: number
}

export function getMediaFilename(asset: Pick<MediaAssetLike, 'publicUrl'>) {
  try {
    const url = new URL(asset.publicUrl)
    return decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) ?? asset.publicUrl)
  } catch {
    return asset.publicUrl.split('/').filter(Boolean).at(-1) ?? asset.publicUrl
  }
}

export function getUsageLabel(value: string) {
  if (value === 'gallery') return 'Gallery'
  if (value === 'service') return 'Service'
  if (value === 'staff') return 'Staff'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function formatMediaBytes(value: number) {
  if (!Number.isFinite(value)) return ''
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

export function getAltStatus(value: string | null | undefined): AltStatus {
  return value?.trim() ? 'Ready' : 'Missing'
}

export function filterMediaAssets<TAsset extends MediaAssetLike>(
  assets: TAsset[],
  filters: { searchQuery: string; usage: MediaUsageFilter }
) {
  const query = filters.searchQuery.trim().toLocaleLowerCase()

  return assets.filter((asset) => {
    const matchesUsage = filters.usage === 'all' || asset.usageType === filters.usage
    if (!matchesUsage) return false
    if (!query) return true

    return [
      asset.altText ?? '',
      asset.usageType,
      asset.publicUrl,
      getMediaFilename(asset)
    ]
      .join(' ')
      .toLocaleLowerCase()
      .includes(query)
  })
}

export function paginateMediaAssets<TAsset>(
  assets: TAsset[],
  currentPage: number,
  pageSize: number
): MediaPagination<TAsset> {
  const safePageSize = Math.max(1, Math.trunc(pageSize) || 1)
  const totalItems = assets.length
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize))
  const safeCurrentPage = Math.min(Math.max(1, Math.trunc(currentPage) || 1), totalPages)
  const startIndex = (safeCurrentPage - 1) * safePageSize
  const endIndex = Math.min(startIndex + safePageSize, totalItems)

  return {
    items: assets.slice(startIndex, endIndex),
    currentPage: safeCurrentPage,
    totalPages,
    totalItems,
    pageSize: safePageSize,
    startItem: totalItems ? startIndex + 1 : 0,
    endItem: endIndex
  }
}
```

- [ ] **Step 2: Run tests to verify GREEN**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/web && node ../../node_modules/vitest/vitest.mjs run tests/admin-media-library.test.ts'
```

Expected: PASS for `admin-media-library.test.ts`.

## Task 3: Redesign Admin Media Page

**Files:**
- Modify: `apps/web/pages/admin/media.vue`

- [ ] **Step 1: Update script behavior**

Import helper functions and add refs/computed state:

```ts
import type { MediaUsageFilter } from '../../utils/admin-media-library'
import {
  filterMediaAssets,
  formatMediaBytes,
  getAltStatus,
  getMediaFilename,
  getUsageLabel,
  paginateMediaAssets
} from '../../utils/admin-media-library'

const searchQuery = ref('')
const usageFilter = ref<MediaUsageFilter>('all')
const pageSize = ref(5)
const currentPage = ref(1)
const rowSaveState = reactive<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({})

const filteredMediaList = computed(() =>
  filterMediaAssets(mediaList.value, {
    searchQuery: searchQuery.value,
    usage: usageFilter.value
  })
)
const mediaPage = computed(() => paginateMediaAssets(filteredMediaList.value, currentPage.value, pageSize.value))
const paginatedMediaList = computed(() => mediaPage.value.items)
const paginationSummary = computed(() => {
  if (!mediaPage.value.totalItems) return '0 media'
  return `${mediaPage.value.startItem}-${mediaPage.value.endItem} of ${mediaPage.value.totalItems} media`
})
```

- [ ] **Step 2: Replace layout**

Use the existing page as the source of API behavior, but restructure the template into:

- `.media-workspace`
- `.upload-rail.surface-panel`
- `.media-library.surface-panel`
- `.media-toolbar`
- `.media-table`
- `.pagination-bar`

Keep `handleUpload()` and `handleAltChange()` wired to the same endpoints.

- [ ] **Step 3: Add responsive CSS**

Use scoped CSS with:

- Desktop: `grid-template-columns: minmax(280px, 340px) minmax(0, 1fr)`.
- Below `980px`: one-column workspace and two-column toolbar.
- Below `640px`: one-column toolbar, stacked media rows, full-width pagination buttons.

## Task 4: Verification

**Files:**
- Verify all modified web files.

- [ ] **Step 1: Run web tests**

Run:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm-slim bash -lc 'cd apps/web && node ../../node_modules/vitest/vitest.mjs run'
```

Expected: all web tests pass.

- [ ] **Step 2: Run web lint/typecheck**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web lint
```

Expected: exits with code 0.

- [ ] **Step 3: Run web build**

Run:

```bash
docker compose run --rm tooling bun --filter @nailly/web build
```

Expected: exits with code 0. Existing sourcemap/esbuild host mismatch warnings may appear, but the command must finish successfully.

- [ ] **Step 4: Restart web and smoke route**

Run:

```bash
docker compose restart web
sleep 3
curl -sS -I http://localhost:3000/admin/media
```

Expected: unauthenticated route returns `302 Found` to `/admin/login`.
