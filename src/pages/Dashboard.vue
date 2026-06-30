<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        Welcome, {{ authStore.user?.user_metadata?.full_name || 'User' }}
      </h1>
      <p class="text-gray-600">
        Manage your ITGC audit engagements
      </p>
    </div>

    <!-- Status Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Subscription Status -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Subscription
        </h3>
        <div v-if="authStore.subscription?.status === 'active'" class="text-green-600 font-bold">
          Active
        </div>
        <div v-else class="text-yellow-600 font-bold">
          Free Plan
        </div>
        <p class="text-sm text-gray-600 mt-2">
          {{ authStore.subscription?.current_period_end
            ? `Renews: ${formatDate(authStore.subscription.current_period_end)}`
            : 'Complete 1 free assessment then upgrade'
          }}
        </p>
      </div>

      <!-- Assessments Completed -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Assessments
        </h3>
        <div class="text-3xl font-bold text-blue-600">
          {{ assessments.length }}
        </div>
        <p class="text-sm text-gray-600 mt-2">
          {{ authStore.canCreateAssessment ? 'Can create new assessment' : 'Upgrade to create more' }}
        </p>
      </div>

      <!-- Templates Purchased -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Templates
        </h3>
        <div class="text-3xl font-bold text-blue-600">
          {{ purchasedTemplates.length }}
        </div>
        <p class="text-sm text-gray-600 mt-2">
          <router-link to="/templates" class="text-blue-600 hover:text-blue-700">
            Browse more templates →
          </router-link>
        </p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-1">
            Ready to start a new assessment?
          </h3>
          <p class="text-gray-600">
            {{ authStore.canCreateAssessment 
              ? 'Create your audit assessment now' 
              : 'Upgrade to your subscription to create more assessments' 
            }}
          </p>
        </div>
        <div class="flex gap-4">
          <button
            v-if="authStore.canCreateAssessment"
            @click="showNewAssessmentModal = true"
            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            + New Assessment
          </button>
          <router-link
            v-if="!authStore.canCreateAssessment"
            to="/upgrade"
            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium text-center"
          >
            Upgrade Now
          </router-link>
        </div>
      </div>
    </div>

    <!-- Assessments List -->
    <div class="bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b">
        <h2 class="text-lg font-semibold text-gray-900">
          Your Assessments
        </h2>
      </div>
      
      <div v-if="assessments.length === 0" class="px-6 py-12 text-center">
        <p class="text-gray-600 mb-4">No assessments yet</p>
        <button
          v-if="authStore.canCreateAssessment"
          @click="showNewAssessmentModal = true"
          class="text-blue-600 hover:text-blue-700 font-medium"
        >
          Create your first assessment
        </button>
      </div>

      <div v-else class="divide-y">
        <div
          v-for="assessment in assessments"
          :key="assessment.id"
          class="px-6 py-4 hover:bg-gray-50 flex justify-between items-center"
        >
          <div>
            <h3 class="font-semibold text-gray-900">
              {{ assessment.assessment_name }}
            </h3>
            <p class="text-sm text-gray-600 mt-1">
              {{ assessment.status === 'completed' ? 'Completed' : 'In Progress' }}
              • {{ formatDate(assessment.created_at) }}
            </p>
          </div>
          <div class="flex gap-2">
            <router-link
              :to="`/assessment/${assessment.id}`"
              class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
            >
              {{ assessment.status === 'completed' ? 'View' : 'Continue' }}
            </router-link>
            <button
              @click="deleteAssessment(assessment.id)"
              class="bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- New Assessment Modal -->
    <div v-if="showNewAssessmentModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          New Assessment
        </h2>
        <input
          v-model="newAssessmentName"
          type="text"
          placeholder="Assessment name (e.g., Q1 Audit)"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
        />
        <div class="flex gap-4">
          <button
            @click="createAssessment"
            :disabled="!newAssessmentName || loadingCreate"
            class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {{ loadingCreate ? 'Creating...' : 'Create' }}
          </button>
          <button
            @click="showNewAssessmentModal = false"
            class="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { dbService } from '../services/database'

const authStore = useAuthStore()
const router = useRouter()

const assessments = ref([])
const purchasedTemplates = ref([])
const showNewAssessmentModal = ref(false)
const newAssessmentName = ref('')
const loadingCreate = ref(false)

// Format date helper
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Load data
const loadData = async () => {
  if (!authStore.user) return

  assessments.value = await dbService.getUserAssessments(authStore.user.id)
  purchasedTemplates.value = await dbService.getUserPurchasedTemplates(authStore.user.id)
}

// Create assessment
const createAssessment = async () => {
  if (!newAssessmentName.value || !authStore.user) return

  loadingCreate.value = true
  try {
    const assessment = await dbService.createAssessment(
      authStore.user.id,
      newAssessmentName.value
    )

    await dbService.incrementAssessmentCount(authStore.user.id)
    await authStore.initAuth()

    showNewAssessmentModal.value = false
    newAssessmentName.value = ''

    router.push(`/assessment/${assessment.id}`)
  } finally {
    loadingCreate.value = false
  }
}

// Delete assessment
const deleteAssessment = async (assessmentId) => {
  if (confirm('Are you sure you want to delete this assessment?')) {
    await dbService.deleteAssessment(assessmentId)
    loadData()
  }
}

onMounted(() => {
  loadData()
})
</script>
