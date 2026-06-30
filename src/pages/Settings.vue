<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

    <!-- Profile -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="font-semibold text-gray-900 mb-4">Profile</h2>
      <form @submit.prevent="saveProfile" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            v-model="fullName"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            :value="authStore.user?.email"
            type="email"
            disabled
            class="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500"
          />
        </div>
        <button
          type="submit"
          :disabled="savingProfile"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
        >
          {{ savingProfile ? 'Saving…' : 'Save Changes' }}
        </button>
        <span v-if="profileSaved" class="text-sm text-green-600 ml-3">Saved ✓</span>
      </form>
    </div>

    <!-- Subscription -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="font-semibold text-gray-900 mb-4">Subscription</h2>
      <p class="text-sm text-gray-600 mb-4">
        Status:
        <span class="font-medium" :class="isActive ? 'text-green-600' : 'text-yellow-600'">
          {{ isActive ? 'Active – $15/month' : 'Free plan' }}
        </span>
      </p>
      <button
        v-if="isActive"
        @click="openPortal"
        class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
      >
        Manage Billing
      </button>
      <router-link
        v-else
        to="/upgrade"
        class="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
      >
        Upgrade to Premium
      </router-link>
    </div>

    <!-- Password -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="font-semibold text-gray-900 mb-4">Change Password</h2>
      <form @submit.prevent="changePassword" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            v-model="newPassword"
            type="password"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="••••••••"
          />
        </div>
        <div v-if="passwordError" class="text-sm text-red-600">{{ passwordError }}</div>
        <div v-if="passwordSuccess" class="text-sm text-green-600">Password updated ✓</div>
        <button
          type="submit"
          :disabled="changingPassword"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
        >
          {{ changingPassword ? 'Updating…' : 'Update Password' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { dbService } from '../services/database'
import { stripeService } from '../services/stripe'
import { authService } from '../services/auth'

const authStore = useAuthStore()

const fullName = ref('')
const savingProfile = ref(false)
const profileSaved = ref(false)

const newPassword = ref('')
const changingPassword = ref(false)
const passwordError = ref('')
const passwordSuccess = ref(false)

const isActive = computed(() => authStore.subscription?.status === 'active')

const saveProfile = async () => {
  if (!authStore.user) return
  savingProfile.value = true
  profileSaved.value = false
  try {
    await dbService.updateUserProfile(authStore.user.id, { full_name: fullName.value })
    profileSaved.value = true
  } finally {
    savingProfile.value = false
  }
}

const changePassword = async () => {
  passwordError.value = ''
  passwordSuccess.value = false
  if (newPassword.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters'
    return
  }
  changingPassword.value = true
  try {
    const result = await authService.updatePassword(newPassword.value)
    if (result.success) {
      passwordSuccess.value = true
      newPassword.value = ''
    } else {
      passwordError.value = result.error
    }
  } finally {
    changingPassword.value = false
  }
}

const openPortal = async () => {
  if (!authStore.user?.profile?.stripe_customer_id) return
  await stripeService.openCustomerPortal(authStore.user.profile.stripe_customer_id)
}

onMounted(() => {
  fullName.value = authStore.user?.profile?.full_name || ''
})
</script>
