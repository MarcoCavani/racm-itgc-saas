<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Template Library</h1>
      <p class="text-gray-600">Pre-built ITGC audit templates — $10 each</p>
    </div>

    <div v-if="loading" class="text-center py-20 text-gray-500">Loading templates...</div>

    <div v-else-if="templates.length === 0" class="bg-white rounded-lg shadow p-12 text-center">
      <p class="text-gray-600">No templates available yet. Check back soon.</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="template in templates"
        :key="template.id"
        class="bg-white rounded-lg shadow border border-gray-200 flex flex-col"
      >
        <div class="p-6 flex-1">
          <span
            v-if="template.domain"
            class="inline-block text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded mb-3"
          >
            {{ template.domain }}
          </span>
          <h3 class="font-semibold text-gray-900 mb-2">{{ template.name }}</h3>
          <p class="text-sm text-gray-600">{{ template.description }}</p>
        </div>
        <div class="px-6 pb-6">
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold text-gray-900">${{ Number(template.price).toFixed(2) }}</span>

            <button
              v-if="purchasedIds.has(template.id)"
              @click="download(template)"
              class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              Download
            </button>
            <button
              v-else
              @click="purchase(template)"
              :disabled="purchasingId === template.id"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
            >
              {{ purchasingId === template.id ? 'Redirecting…' : 'Buy for $10' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { dbService } from '../services/database'
import { stripeService } from '../services/stripe'

const authStore = useAuthStore()
const templates = ref([])
const purchasedIds = ref(new Set())
const loading = ref(true)
const purchasingId = ref(null)

const loadTemplates = async () => {
  loading.value = true
  templates.value = await dbService.getTemplates()

  if (authStore.user) {
    const purchases = await dbService.getUserPurchasedTemplates(authStore.user.id)
    purchasedIds.value = new Set(purchases.map((p) => p.template_id))
  }
  loading.value = false
}

const purchase = async (template) => {
  if (!authStore.user) return
  purchasingId.value = template.id
  try {
    await stripeService.createTemplateCheckout(authStore.user.id, template.id)
  } catch (e) {
    console.error('Purchase failed:', e)
    purchasingId.value = null
  }
}

const download = (template) => {
  const url = template.excel_file_url || template.pdf_file_url || template.word_file_url
  if (url) window.open(url, '_blank')
}

onMounted(loadTemplates)
</script>
