<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-6 text-center">
          Create Account
        </h2>
        <p class="text-gray-600 text-center mb-8">
          Start your free ITGC audit assessment
        </p>

        <form @submit.prevent="handleSignup" class="space-y-6">
          <!-- Full Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              v-model="fullName"
              type="text"
              id="name"
              required
              class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

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
            <p class="text-sm text-gray-500 mt-1">
              At least 8 characters
            </p>
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirm" class="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              id="confirm"
              required
              class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <!-- Honeypot: off-screen, hidden from people; bots fill it and get silently dropped -->
          <div style="position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden;" aria-hidden="true">
            <label>Leave this field empty
              <input v-model="hpField" type="text" name="company_website" tabindex="-1" autocomplete="off" />
            </label>
          </div>

          <!-- Error message -->
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {{ error }}
          </div>

          <!-- Bot protection -->
          <TurnstileWidget ref="captchaEl" @verified="captchaToken = $event" @expired="captchaToken = ''" />

          <!-- Submit button -->
          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {{ authStore.loading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <!-- Login link -->
        <p class="text-center text-gray-600 mt-6">
          Already have an account?
          <router-link to="/login" class="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
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

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const captchaToken = ref('')
const captchaEl = ref(null)
const captchaRequired = !!import.meta.env.VITE_TURNSTILE_SITE_KEY
const hpField = ref('')
const authStore = useAuthStore()
const router = useRouter()

const handleSignup = async () => {
  error.value = ''

  // Honeypot — bots fill this hidden field; humans never see it. Silently drop them.
  if (hpField.value) return

  // Validation
  if (!fullName.value || !email.value || !password.value || !confirmPassword.value) {
    error.value = 'All fields are required'
    return
  }

  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  if (captchaRequired && !captchaToken.value) {
    error.value = 'Please complete the CAPTCHA.'
    return
  }

  // Sign up
  const result = await authStore.signup(email.value, password.value, fullName.value, captchaToken.value)

  if (result.success) {
    // Redirect to create first assessment
    router.push('/dashboard')
  } else {
    error.value = result.error || 'Sign up failed'
    // Tokens are single-use — reset for another attempt
    captchaToken.value = ''
    captchaEl.value?.reset()
  }
}
</script>
