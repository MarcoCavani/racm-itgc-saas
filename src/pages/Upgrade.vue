<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="text-center mb-12">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Upgrade Your Plan</h1>
      <p class="text-gray-600">Unlock unlimited ITGC assessments</p>
    </div>

    <div v-if="isActive" class="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-8">
      <p class="text-green-700 font-medium">You're already subscribed! 🎉</p>
      <p class="text-sm text-green-600 mt-1" v-if="authStore.subscription?.current_period_end">
        Renews on {{ formatDate(authStore.subscription.current_period_end) }}
      </p>
      <router-link to="/settings" class="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
        Manage billing →
      </router-link>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <!-- Free Plan -->
      <div class="bg-white rounded-lg shadow border border-gray-200 p-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-1">Free</h3>
        <p class="text-3xl font-bold text-gray-900 mb-4">$0</p>
        <ul class="space-y-3 text-sm text-gray-600 mb-6">
          <li>✓ 1 assessment</li>
          <li>✓ Full controls A–I framework</li>
          <li>✓ CSV export</li>
          <li class="text-gray-400">✗ Unlimited assessments</li>
        </ul>
        <div class="text-center text-sm text-gray-400 font-medium">Current plan</div>
      </div>

      <!-- Premium Plan -->
      <div class="bg-white rounded-lg shadow-lg border-2 border-blue-600 p-8 relative">
        <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
          Most Popular
        </span>
        <h3 class="text-lg font-semibold text-gray-900 mb-1">Premium</h3>
        <p class="text-3xl font-bold text-gray-900 mb-4">
          $15<span class="text-base font-normal text-gray-500">/month</span>
        </p>
        <ul class="space-y-3 text-sm text-gray-600 mb-6">
          <li>✓ Unlimited assessments</li>
          <li>✓ Full controls A–I framework</li>
          <li>✓ CSV export</li>
          <li>✓ Priority support</li>
        </ul>
        <button
          @click="subscribe"
          :disabled="subscribing"
          class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
        >
          {{ subscribing ? 'Redirecting…' : 'Subscribe Now' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { stripeService } from '../services/stripe'

const authStore = useAuthStore()
const subscribing = ref(false)

const isActive = computed(() => authStore.subscription?.status === 'active')

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const subscribe = async () => {
  if (!authStore.user) return
  subscribing.value = true
  try {
    await stripeService.createSubscriptionCheckout(authStore.user.id)
  } catch (e) {
    console.error('Subscription checkout failed:', e)
    subscribing.value = false
  }
}
</script>
