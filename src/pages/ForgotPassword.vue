<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-2 text-center">
          Reset your password
        </h2>
        <p class="text-gray-600 text-center mb-8">
          Enter your email and we'll send you a reset link.
        </p>

        <div v-if="sent" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-center">
          If an account exists for that email, a reset link is on its way — check your inbox.
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
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

          <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {{ loading ? 'Sending...' : 'Send reset link' }}
          </button>
        </form>

        <p class="text-center text-gray-600 mt-6">
          <router-link to="/login" class="text-blue-600 hover:text-blue-700 font-medium">
            Back to sign in
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { authService } from '../services/auth'

const email = ref('')
const loading = ref(false)
const sent = ref(false)
const error = ref('')

const handleSubmit = async () => {
  error.value = ''
  if (!email.value) {
    error.value = 'Please enter your email.'
    return
  }
  loading.value = true
  try {
    const result = await authService.resetPassword(email.value)
    if (result.success) {
      // Generic message either way — don't reveal whether the account exists
      sent.value = true
    } else {
      error.value = result.error || 'Something went wrong. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>
