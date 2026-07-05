<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-sm font-medium text-gray-500 mb-1">Total Revenue</h3>
        <p class="text-2xl font-bold text-gray-900">${{ stats.total.toFixed(2) }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-sm font-medium text-gray-500 mb-1">Subscription Revenue</h3>
        <p class="text-2xl font-bold text-gray-900">${{ stats.subscriptionRevenue.toFixed(2) }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-sm font-medium text-gray-500 mb-1">Template Revenue</h3>
        <p class="text-2xl font-bold text-gray-900">${{ stats.templateRevenue.toFixed(2) }}</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6 border-b">
      <button
        v-for="tab in ['Users', 'Subscriptions', 'Payments', 'Templates']"
        :key="tab"
        @click="activeTab = tab"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px"
        :class="activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Users -->
    <div v-if="activeTab === 'Users'" class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
          <tr>
            <th class="px-6 py-3">Name</th>
            <th class="px-6 py-3">Email</th>
            <th class="px-6 py-3">Plan</th>
            <th class="px-6 py-3">Assessments</th>
            <th class="px-6 py-3">Joined</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="u in users" :key="u.id">
            <td class="px-6 py-3">{{ u.full_name || '—' }}</td>
            <td class="px-6 py-3">{{ u.email }}</td>
            <td class="px-6 py-3">
              <span
                class="px-2 py-1 rounded-full text-xs font-medium"
                :class="u.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
              >
                {{ u.subscription_status }}
              </span>
            </td>
            <td class="px-6 py-3">{{ u.assessment_count }}</td>
            <td class="px-6 py-3">{{ formatDate(u.created_at) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="users.length === 0" class="px-6 py-8 text-center text-gray-500">No users yet.</p>
    </div>

    <!-- Subscriptions -->
    <div v-if="activeTab === 'Subscriptions'" class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
          <tr>
            <th class="px-6 py-3">User</th>
            <th class="px-6 py-3">Status</th>
            <th class="px-6 py-3">Renews</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="s in subscriptions" :key="s.id">
            <td class="px-6 py-3">{{ s.users?.email }}</td>
            <td class="px-6 py-3 capitalize">{{ s.status }}</td>
            <td class="px-6 py-3">{{ s.current_period_end ? formatDate(s.current_period_end) : '—' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="subscriptions.length === 0" class="px-6 py-8 text-center text-gray-500">No subscriptions yet.</p>
    </div>

    <!-- Payments -->
    <div v-if="activeTab === 'Payments'" class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
          <tr>
            <th class="px-6 py-3">User</th>
            <th class="px-6 py-3">Type</th>
            <th class="px-6 py-3">Amount</th>
            <th class="px-6 py-3">Status</th>
            <th class="px-6 py-3">Date</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="p in payments" :key="p.id">
            <td class="px-6 py-3">{{ p.users?.email }}</td>
            <td class="px-6 py-3 capitalize">{{ p.type }}</td>
            <td class="px-6 py-3">${{ Number(p.amount).toFixed(2) }}</td>
            <td class="px-6 py-3 capitalize">{{ p.status }}</td>
            <td class="px-6 py-3">{{ formatDate(p.created_at) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="payments.length === 0" class="px-6 py-8 text-center text-gray-500">No payments yet.</p>
    </div>

    <!-- Templates -->
    <div v-if="activeTab === 'Templates'">
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="font-semibold text-gray-900 mb-4">Add Template</h3>
        <form @submit.prevent="createTemplate" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            v-model="newTemplate.name"
            placeholder="Template name"
            required
            class="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <input
            v-model="newTemplate.domain"
            placeholder="Domain (e.g. IT General Controls)"
            class="px-4 py-2 border border-gray-300 rounded-lg"
          />

          <!-- Excel file upload -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <input
                v-model="newTemplate.excel_file_url"
                placeholder="Excel file URL"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <label class="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 whitespace-nowrap">
                {{ uploadingExcel ? 'Uploading…' : 'Upload .xlsx' }}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  class="hidden"
                  :disabled="uploadingExcel"
                  @change="uploadExcel"
                />
              </label>
            </div>
            <p v-if="uploadError" class="text-xs text-red-600">{{ uploadError }}</p>
            <p v-if="uploadingExcel" class="text-xs text-blue-600">Uploading file to storage…</p>
          </div>

          <!-- PDF file upload -->
          <div class="flex items-center gap-2">
            <input
              v-model="newTemplate.pdf_file_url"
              placeholder="PDF file URL (optional)"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <label class="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 whitespace-nowrap">
              {{ uploadingPdf ? 'Uploading…' : 'Upload .pdf' }}
              <input
                type="file"
                accept=".pdf"
                class="hidden"
                :disabled="uploadingPdf"
                @change="uploadPdf"
              />
            </label>
          </div>

          <textarea
            v-model="newTemplate.description"
            placeholder="Description"
            rows="3"
            class="sm:col-span-2 px-4 py-2 border border-gray-300 rounded-lg"
          ></textarea>
          <button
            type="submit"
            :disabled="creatingTemplate || uploadingExcel || uploadingPdf"
            class="sm:col-span-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
          >
            {{ creatingTemplate ? 'Adding…' : 'Add Template ($10)' }}
          </button>
        </form>
      </div>

      <!-- Template list -->
      <div class="bg-white rounded-lg shadow divide-y">
        <div v-for="t in templates" :key="t.id" class="px-6 py-4 flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <p class="font-medium text-gray-900">{{ t.name }}</p>
              <span v-if="t.domain" class="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">{{ t.domain }}</span>
            </div>
            <p v-if="t.description" class="text-sm text-gray-500 line-clamp-2 mb-1">{{ t.description }}</p>
            <div class="flex gap-3 text-xs text-gray-400 flex-wrap">
              <a v-if="t.excel_file_url" :href="t.excel_file_url" target="_blank" class="text-blue-500 hover:underline">Excel</a>
              <a v-if="t.pdf_file_url"   :href="t.pdf_file_url"   target="_blank" class="text-blue-500 hover:underline">PDF</a>
              <span v-if="!t.excel_file_url && !t.pdf_file_url" class="text-red-400">No file URL set</span>
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <span class="text-gray-700 font-medium">${{ Number(t.price).toFixed(2) }}</span>
            <button
              @click="deleteTemplate(t.id)"
              :disabled="deletingId === t.id"
              class="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 font-medium"
            >
              {{ deletingId === t.id ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
        <p v-if="templates.length === 0" class="px-6 py-8 text-center text-gray-500">No templates yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { dbService } from '../services/database'
import { supabase } from '../services/supabase'

const activeTab = ref('Users')
const users = ref([])
const subscriptions = ref([])
const payments = ref([])
const templates = ref([])
const stats = ref({ total: 0, subscriptionRevenue: 0, templateRevenue: 0, paymentCount: 0 })

const creatingTemplate = ref(false)
const deletingId = ref(null)
const uploadingExcel = ref(false)
const uploadingPdf = ref(false)
const uploadError = ref('')
const newTemplate = ref({ name: '', domain: '', description: '', excel_file_url: '', pdf_file_url: '' })

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const loadAll = async () => {
  users.value = await dbService.getAllUsers()
  subscriptions.value = await dbService.getAllSubscriptions()
  payments.value = await dbService.getAllPayments()
  templates.value = await dbService.getTemplates()
  stats.value = await dbService.getRevenueStats()
}

const uploadFile = async (file, field, loadingRef) => {
  uploadError.value = ''
  loadingRef.value = true
  try {
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const { error } = await supabase.storage
      .from('templates')
      .upload(filename, file, { upsert: true })

    if (error) {
      uploadError.value = `Upload failed: ${error.message}. Make sure a public "templates" bucket exists in Supabase Storage.`
      return
    }

    const { data } = supabase.storage.from('templates').getPublicUrl(filename)
    newTemplate.value[field] = data.publicUrl
  } finally {
    loadingRef.value = false
  }
}

const uploadExcel = (e) => {
  const file = e.target.files[0]
  if (file) uploadFile(file, 'excel_file_url', uploadingExcel)
  e.target.value = ''
}

const uploadPdf = (e) => {
  const file = e.target.files[0]
  if (file) uploadFile(file, 'pdf_file_url', uploadingPdf)
  e.target.value = ''
}

const createTemplate = async () => {
  creatingTemplate.value = true
  try {
    await dbService.createTemplate({ ...newTemplate.value, price: 10.0 })
    newTemplate.value = { name: '', domain: '', description: '', excel_file_url: '', pdf_file_url: '' }
    templates.value = await dbService.getTemplates()
  } finally {
    creatingTemplate.value = false
  }
}

const deleteTemplate = async (id) => {
  if (!confirm('Delete this template? This cannot be undone.')) return
  deletingId.value = id
  try {
    await supabase.from('templates').delete().eq('id', id)
    templates.value = templates.value.filter((t) => t.id !== id)
  } finally {
    deletingId.value = null
  }
}

onMounted(loadAll)
</script>
