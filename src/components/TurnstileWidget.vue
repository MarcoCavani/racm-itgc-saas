<template>
  <div v-if="siteKey" ref="el" class="flex justify-center my-2"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits(['verified', 'expired'])
const el = ref(null)
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
let widgetId = null

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function loadScript() {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve()
    const existing = document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile"]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', reject)
      return
    }
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = reject
    document.head.appendChild(s)
  })
}

function waitForTurnstile(timeout = 6000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    ;(function check() {
      if (window.turnstile) return resolve()
      if (Date.now() - start > timeout) return reject(new Error('Turnstile not ready'))
      setTimeout(check, 100)
    })()
  })
}

function render() {
  if (!window.turnstile || !el.value) return
  widgetId = window.turnstile.render(el.value, {
    sitekey: siteKey,
    callback: (token) => emit('verified', token),
    'expired-callback': () => emit('expired'),
    'error-callback': () => emit('expired'),
  })
}

// Parent calls this to get a fresh token after a failed attempt (tokens are single-use)
function reset() {
  emit('expired')
  if (window.turnstile && widgetId !== null) {
    try { window.turnstile.reset(widgetId) } catch (e) { /* noop */ }
  }
}
defineExpose({ reset })

onMounted(async () => {
  if (!siteKey) {
    console.warn('[Turnstile] VITE_TURNSTILE_SITE_KEY not set — CAPTCHA disabled')
    return
  }
  try {
    await loadScript()
    await waitForTurnstile()
    render()
  } catch (e) {
    console.error('[Turnstile] failed to initialise', e)
  }
})

onBeforeUnmount(() => {
  if (window.turnstile && widgetId !== null) {
    try { window.turnstile.remove(widgetId) } catch (e) { /* noop */ }
  }
})
</script>
