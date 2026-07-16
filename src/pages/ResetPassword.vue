<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-2 text-center">
          Set a new password
        </h2>
        <p class="text-gray-600 text-center mb-8">
          Choose a new password for your account.
        </p>

        <div v-if="done" class="text-center">
          <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            Password updated. You can now sign in.
          </div>
          <router-link
            to="/login"
            class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Go to sign in
          </router-link>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              New password
            </label>
            <input
              v-model="password"
              type="password"
              id="password"
              required
              class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="••••••••"
            />
            <p class="text-sm text-gray-500 mt-1">At least 8 characters</p>
          </div>

          <div>
            <label for="confirm" class="block text-sm font-medium text-gray-700">
              Confirm new password
            </label>
            <input
              v-model="confirm"
              type="password"
              id="confirm"
              required
              class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="••••••••"
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
            {{ loading ? 'Updating...' : 'Update password' }}
          </button>
        </form>

        <p v-if="!done" class="text-center text-gray-600 mt-6">
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

const password = ref('')
const confirm = ref('')
const loading = ref(false)
const done = ref(false)
const error = ref('')

const handleSubmit = async () => {
  error.value = ''
  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  try {
    const result = await authService.updatePassword(password.value)
    if (result.success) {
      done.value = true
    } else {
      error.value = result.error || 'This reset link may have expired — request a new one from "Forgot password".'
    }
  } finally {
    loading.value = false
  }
}
</script>
