<template>
  <div class="login-page">
    <form class="login-card" @submit.prevent="handleLogin">
      <h1>{{ $t('admin.login') }}</h1>

      <div v-if="error" class="login-error">{{ error }}</div>

      <label class="field">
        <span>Email</span>
        <input v-model="email" type="email" required autocomplete="email" />
      </label>

      <label class="field">
        <span>Password</span>
        <input v-model="password" type="password" required autocomplete="current-password" />
      </label>

      <button type="submit" class="submit-btn" :disabled="loading">
        {{ loading ? 'Signing in...' : 'Sign in' }}
      </button>

      <details class="demo-hint">
        <summary>Demo credentials</summary>
        <pre>owner@lumanails.example / owner-password
manager@lumanails.example / manager-password
staff@lumanails.example / staff-password</pre>
      </details>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { AdminProfile } from '~/stores/session'

definePageMeta({
  layout: false
})

const session = useSessionStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await session.login(email.value, password.value)
    navigateTo('/admin')
  } catch (e: any) {
    error.value = e?.data?.error?.message ?? 'Invalid credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 2rem;
}

.login-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
}

.login-card h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1.5rem;
}

.login-error {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 0.6rem 0.75rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

.field span {
  font-size: 0.85rem;
  font-weight: 500;
}

.field input {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
}

.submit-btn {
  width: 100%;
  padding: 0.7rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-card);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.demo-hint {
  margin-top: 1.5rem;
  font-size: 0.8rem;
  color: var(--color-muted);
}

.demo-hint summary {
  cursor: pointer;
  font-weight: 500;
}

.demo-hint pre {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  line-height: 1.6;
}
</style>
