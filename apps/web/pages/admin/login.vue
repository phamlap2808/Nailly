<template>
  <main class="login-page">
    <section class="login-shell surface-panel" aria-labelledby="login-title">
      <div class="login-intro">
        <NuxtLink to="/" class="brand-lockup">
          <span class="brand-mark">LN</span>
          <span>Luma Nail Studio</span>
        </NuxtLink>
        <p class="eyebrow">Admin</p>
        <h1 id="login-title" class="display-title">Studio sign in</h1>
        <p>Manage appointments, services, staff, and the public salon profile.</p>
      </div>

      <form class="login-card" @submit.prevent="handleLogin">
        <div v-if="error" class="login-error" role="alert">{{ error }}</div>

        <label class="field">
          <span>Email</span>
          <input v-model="email" class="form-control" type="email" required autocomplete="email" />
        </label>

        <label class="field">
          <span>Password</span>
          <input
            v-model="password"
            class="form-control"
            type="password"
            required
            autocomplete="current-password"
          />
        </label>

        <button type="submit" class="btn-primary submit-btn" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>

        <details class="demo-hint">
          <summary>Demo credentials</summary>
          <div class="demo-list">
            <code>owner@lumanails.example / owner-password</code>
            <code>manager@lumanails.example / manager-password</code>
            <code>staff@lumanails.example / staff-password</code>
          </div>
        </details>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const session = useSessionStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

function getErrorMessage(value: unknown) {
  if (
    value &&
    typeof value === 'object' &&
    'data' in value &&
    value.data &&
    typeof value.data === 'object' &&
    'error' in value.data &&
    value.data.error &&
    typeof value.data.error === 'object' &&
    'message' in value.data.error &&
    typeof value.data.error.message === 'string'
  ) {
    return value.data.error.message
  }
  return 'Invalid credentials.'
}

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await session.login(email.value, password.value)
    navigateTo('/admin')
  } catch (err: unknown) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background:
    linear-gradient(135deg, rgba(248, 243, 237, 0.94), rgba(239, 226, 214, 0.72)),
    var(--color-bg);
  padding: 1.25rem;
}

.login-shell {
  width: min(100%, 920px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.8fr);
  min-height: 560px;
  overflow: hidden;
}

.login-intro {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2rem;
  background: var(--color-ink);
  color: #fff8ef;
  padding: clamp(1.5rem, 4vw, 3rem);
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: #fff8ef;
  text-decoration: none;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.12rem;
  line-height: 1.1;
  letter-spacing: 0;
}

.brand-mark {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: #fff8ef;
  color: var(--color-ink);
  font-size: 0.75rem;
  font-weight: 900;
}

.login-intro .eyebrow {
  color: #d7ab91;
  margin-top: auto;
}

.login-intro h1 {
  max-width: 9ch;
  margin: 0.3rem 0 0;
  font-size: clamp(3rem, 7vw, 5.4rem);
}

.login-intro p:not(.eyebrow) {
  max-width: 28rem;
  color: rgba(255, 248, 239, 0.74);
  margin: 0.9rem 0 0;
}

.login-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: var(--color-surface);
  padding: clamp(1.5rem, 4vw, 2.5rem);
}

.login-error {
  border: 1px solid #edc2bc;
  border-radius: var(--radius-card);
  background: #fbedea;
  color: var(--color-danger);
  padding: 0.75rem;
  font-size: 0.88rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.field {
  display: grid;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

.field span {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  font-weight: 700;
}

.submit-btn {
  width: 100%;
  margin-top: 0.25rem;
}

.demo-hint {
  border-top: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: 0.82rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
}

.demo-hint summary {
  cursor: pointer;
  font-weight: 800;
}

.demo-list {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.75rem;
}

.demo-list code {
  display: block;
  border-radius: var(--radius-card);
  background: var(--color-bg-strong);
  color: var(--color-ink-soft);
  font-size: 0.76rem;
  padding: 0.45rem 0.55rem;
  white-space: normal;
  overflow-wrap: anywhere;
}

@media (max-width: 760px) {
  .login-page {
    align-items: stretch;
  }

  .login-shell {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .login-intro {
    min-height: 300px;
  }

  .login-intro h1 {
    max-width: 11ch;
  }
}
</style>
