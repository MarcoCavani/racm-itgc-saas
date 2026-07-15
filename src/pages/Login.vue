<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <img src="/logo.svg" alt="RACM ITGC" class="h-16 w-16 mx-auto mb-4" />
        <h2 class="text-3xl font-bold text-gray-900 mb-6 text-center">
          RACM ITGC
        </h2>
        <p class="text-gray-600 text-center mb-8">
          Sign in to your account
        </p>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              v-model="email"
              type="email"
              id="email"
              required
              class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              v-model="password"
              type="password"
              id="password"
              required
              class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <!-- Error message -->
          <div v-if="formError || authStore.error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {{ formError || authStore.error }}
          </div>

          <!-- Bot protection -->
          <TurnstileWidget ref="captchaEl" @verified="captchaToken = $event" @expired="captchaToken = ''" />

          <!-- Submit button -->
          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {{ authStore.loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <!-- Sign up link -->
        <p class="text-center text-gray-600 mt-6">
          Don't have an account?
          <router-link to="/signup" class="text-blue-600 hover:text-blue-700 font-medium">
            Sign up
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import TurnstileWidget from '../components/TurnstileWidget.vue'

const email = ref('')
const password = ref('')
const captchaToken = ref('')
const captchaEl = ref(null)
const formError = ref('')
const captchaRequired = !!import.meta.env.VITE_TURNSTILE_SITE_KEY
const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  formError.value = ''
  if (captchaRequired && !captchaToken.value) {
    formError.value = 'Please complete the CAPTCHA.'
    return
  }
  const result = await authStore.login(email.value, password.value, captchaToken.value)
  if (result.success) {
    router.push('/dashboard')
  } else {
    // Tokens are single-use — reset for another attempt
    captchaToken.value = ''
    captchaEl.value?.reset()
  }
}
</script>
