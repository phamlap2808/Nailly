<template>
  <AdminShell>
    <header class="page-heading">
      <div>
        <p class="eyebrow">Access</p>
        <h1 class="display-title">Permissions</h1>
        <p>Control what each admin role can view, edit, export, and process.</p>
      </div>
    </header>

    <section class="permission-matrix surface-panel">
      <div class="matrix-head">
        <div>
          <p class="eyebrow">Matrix</p>
          <h2>Role permissions</h2>
        </div>
        <p>Owner permissions are always enabled.</p>
      </div>

      <div v-if="loading" class="loading-state">Loading permissions...</div>
      <div v-else class="matrix-table" role="table" aria-label="Role permissions">
        <div class="matrix-row matrix-row--head" role="row">
          <span>Permission</span>
          <span>Owner</span>
          <span>Manager</span>
          <span>Staff</span>
        </div>

        <template v-for="group in permissionGroups" :key="group.label">
          <div class="matrix-group">{{ group.label }}</div>
          <div v-for="permission in group.permissions" :key="permission" class="matrix-row" role="row">
            <div class="permission-copy">
              <strong>{{ formatPermissionLabel(permission) }}</strong>
              <span>{{ permission }}</span>
            </div>
            <label class="matrix-check matrix-check--locked">
              <input type="checkbox" checked disabled />
              <span>Locked</span>
            </label>
            <label class="matrix-check">
              <input
                type="checkbox"
                :checked="roleHasPermission('manager', permission)"
                @change="togglePermission('manager', permission, ($event.target as HTMLInputElement).checked)"
              />
              <span>Manager</span>
            </label>
            <label class="matrix-check">
              <input
                type="checkbox"
                :checked="roleHasPermission('staff', permission)"
                @change="togglePermission('staff', permission, ($event.target as HTMLInputElement).checked)"
              />
              <span>Staff</span>
            </label>
          </div>
        </template>
      </div>

      <div class="matrix-actions">
        <p v-if="saveMessage" class="save-message">{{ saveMessage }}</p>
        <button class="btn-secondary" :disabled="saving" @click="resetDefaults">Reset defaults</button>
        <button class="btn-primary" :disabled="saving" @click="saveAllPermissions">
          {{ saving ? 'Saving...' : 'Save permissions' }}
        </button>
      </div>
    </section>
  </AdminShell>
</template>

<script setup lang="ts">
import {
  adminPermissionValues,
  defaultRolePermissions,
  type AdminPermission,
  type AdminRole
} from '@nailly/shared/src/permissions'
import { resolveRuntimeApiBaseUrl } from '../../utils/api-url'

definePageMeta({
  middleware: 'admin-auth',
  layout: false
})

type EditableRole = Extract<AdminRole, 'manager' | 'staff'>

interface PermissionPayload {
  permissions: AdminPermission[]
  roles: Record<AdminRole, AdminPermission[]>
}

const permissionGroups: Array<{ label: string; permissions: AdminPermission[] }> = [
  { label: 'Bookings', permissions: ['bookings.view', 'bookings.update', 'bookings.checkout'] },
  { label: 'Checkout and invoices', permissions: ['pos.use', 'invoices.view', 'invoices.create', 'invoices.pay', 'invoices.refund', 'invoices.void'] },
  { label: 'Reports', permissions: ['reports.view', 'reports.export'] },
  { label: 'Catalog', permissions: ['catalog.view', 'catalog.manage', 'staff.view', 'staff.manage'] },
  { label: 'Content', permissions: ['media.view', 'media.manage', 'banners.view', 'banners.manage'] },
  { label: 'Growth and settings', permissions: ['promotions.view', 'promotions.manage', 'settings.view', 'settings.manage'] },
  { label: 'Administration', permissions: ['users.view', 'users.manage', 'permissions.manage'] }
]

const config = useRuntimeConfig()
const baseUrl = resolveRuntimeApiBaseUrl(config, import.meta.server)
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const loading = ref(true)
const saving = ref(false)
const saveMessage = ref('')
const rolePermissions = reactive<Record<AdminRole, Set<AdminPermission>>>({
  owner: new Set(adminPermissionValues),
  manager: new Set(defaultRolePermissions.manager),
  staff: new Set(defaultRolePermissions.staff)
})

function applyPayload(payload: PermissionPayload | null) {
  if (!payload) return
  rolePermissions.owner = new Set(adminPermissionValues)
  rolePermissions.manager = new Set(payload.roles.manager)
  rolePermissions.staff = new Set(payload.roles.staff)
}

try {
  const payload = await $fetch<PermissionPayload>(`${baseUrl}/admin/permissions`, {
    credentials: 'include',
    headers: requestHeaders
  })
  applyPayload(payload)
} finally {
  loading.value = false
}

function roleHasPermission(role: AdminRole, permission: AdminPermission) {
  return role === 'owner' || rolePermissions[role].has(permission)
}

function togglePermission(role: EditableRole, permission: AdminPermission, enabled: boolean) {
  if (enabled) {
    rolePermissions[role].add(permission)
    return
  }

  rolePermissions[role].delete(permission)
}

function resetDefaults() {
  rolePermissions.manager = new Set(defaultRolePermissions.manager)
  rolePermissions.staff = new Set(defaultRolePermissions.staff)
  saveMessage.value = 'Defaults restored locally. Save to apply.'
}

async function saveRolePermissions(role: EditableRole) {
  return $fetch(`${baseUrl}/admin/permissions`, {
    method: 'PATCH',
    credentials: 'include',
    headers: requestHeaders,
    body: {
      role,
      permissions: Array.from(rolePermissions[role])
    }
  })
}

async function saveAllPermissions() {
  saving.value = true
  saveMessage.value = ''
  try {
    await Promise.all([saveRolePermissions('manager'), saveRolePermissions('staff')])
    saveMessage.value = 'Permissions saved.'
  } finally {
    saving.value = false
  }
}

function formatPermissionLabel(permission: AdminPermission) {
  return permission
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
</script>

<style scoped>
.permission-matrix {
  display: grid;
  gap: 1.25rem;
}

.matrix-head,
.matrix-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.matrix-head h2,
.matrix-head p,
.matrix-actions p {
  margin: 0;
}

.matrix-head > p {
  color: var(--color-muted);
}

.matrix-table {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
}

.matrix-row {
  display: grid;
  grid-template-columns: minmax(16rem, 1fr) repeat(3, minmax(8rem, 0.42fr));
  align-items: center;
  gap: 0.75rem;
  border-top: 1px solid var(--color-border);
  padding: 0.75rem 1rem;
}

.matrix-row--head {
  border-top: 0;
  background: var(--color-bg-strong);
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.matrix-group {
  border-top: 1px solid var(--color-border);
  background: rgba(125, 78, 63, 0.07);
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  padding: 0.65rem 1rem;
  text-transform: uppercase;
}

.permission-copy {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.permission-copy strong {
  color: var(--color-ink);
}

.permission-copy span {
  color: var(--color-muted);
  font-size: 0.82rem;
}

.matrix-check {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--color-ink-soft);
  font-weight: 800;
}

.matrix-check input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary);
}

.matrix-check--locked {
  color: var(--color-muted);
}

.save-message {
  color: var(--color-primary);
  font-weight: 800;
}

@media (max-width: 900px) {
  .matrix-table {
    overflow-x: auto;
  }

  .matrix-row {
    min-width: 46rem;
  }

  .matrix-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
