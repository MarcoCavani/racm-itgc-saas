<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="loading" class="text-center py-20 text-gray-500">
      Loading assessment...
    </div>

    <div v-else-if="!assessment" class="text-center py-20">
      <p class="text-gray-600 mb-4">Assessment not found.</p>
      <router-link to="/dashboard" class="text-blue-600 hover:text-blue-700 font-medium">
        Back to Dashboard
      </router-link>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ assessment.assessment_name }}</h1>
          <p class="text-sm text-gray-600 mt-1">
            {{ assessment.status === 'completed' ? 'Completed' : 'In progress' }}
            · {{ answeredCount }} / {{ totalControls }} controls answered
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-400" v-if="saveState === 'saving'">Saving…</span>
          <span class="text-sm text-green-600" v-else-if="saveState === 'saved'">Saved ✓</span>
          <button
            @click="exportCsv"
            class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Export CSV
          </button>
          <button
            v-if="assessment.status !== 'completed'"
            @click="markComplete"
            :disabled="completing"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
          >
            {{ completing ? 'Finalizing…' : 'Mark as Complete' }}
          </button>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          class="bg-blue-600 h-2 rounded-full transition-all"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>

      <!-- Group tabs -->
      <div class="flex flex-wrap gap-2 mb-2 border-b">
        <button
          v-for="group in groups"
          :key="group.letter"
          @click="activeGroup = group.letter"
          class="px-4 py-2 text-sm font-medium border-b-2 -mb-px"
          :class="activeGroup === group.letter
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          {{ group.letter }}
          <span class="ml-1 text-xs text-gray-400">({{ group.answered }}/{{ group.total }})</span>
        </button>
      </div>

      <p class="text-sm text-gray-500 mb-4">{{ activeGroupCategory }}</p>

      <!-- Controls list -->
      <div class="space-y-4">
        <div
          v-for="control in controlsInActiveGroup"
          :key="control.ref"
          class="bg-white rounded-lg shadow border border-gray-200"
        >
          <button
            @click="toggleExpand(control.ref)"
            class="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <div>
              <span class="text-xs font-semibold text-blue-600">{{ control.ref }}</span>
              <h3 class="font-semibold text-gray-900">{{ control.risk_title }}</h3>
            </div>
            <div class="flex items-center gap-3">
              <span
                class="text-xs px-2 py-1 rounded-full font-medium"
                :class="statusBadgeClass(responses[control.ref]?.status)"
              >
                {{ responses[control.ref]?.status || 'Not Started' }}
              </span>
              <span class="text-gray-400 text-lg leading-none">{{ expanded.has(control.ref) ? '−' : '+' }}</span>
            </div>
          </button>

          <div v-if="expanded.has(control.ref)" class="px-5 pb-5 border-t pt-4 space-y-4">
            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase mb-1">Risk Description</h4>
              <p class="text-sm text-gray-700">{{ control.risk_description }}</p>
            </div>
            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase mb-1">Control Objective</h4>
              <p class="text-sm text-gray-700">{{ control.control_objective }}</p>
            </div>
            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase mb-1">Control Description</h4>
              <p class="text-sm text-gray-700 whitespace-pre-line">{{ control.control_description }}</p>
            </div>
            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase mb-1">Design Effectiveness Test Procedures</h4>
              <p class="text-sm text-gray-700 whitespace-pre-line">{{ control.design_effectiveness_test_procedures }}</p>
            </div>
            <div v-if="control.operating_effectiveness_test_procedures">
              <h4 class="text-xs font-semibold text-gray-500 uppercase mb-1">Operating Effectiveness Test Procedures</h4>
              <p class="text-sm text-gray-700 whitespace-pre-line">{{ control.operating_effectiveness_test_procedures }}</p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
              <select
                v-model="responses[control.ref].status"
                class="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="Not Started">Not Started</option>
                <option value="Effective">Effective</option>
                <option value="Not Effective">Not Effective</option>
                <option value="N/A">N/A</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Observations Noted</label>
              <textarea
                v-model="responses[control.ref].observations_noted"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Document findings or observations..."
              ></textarea>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Testing / Workpaper Notes</label>
              <textarea
                v-model="responses[control.ref].testing_workpapers"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Reference workpapers or testing notes..."
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8">
        <router-link to="/dashboard" class="text-gray-600 hover:text-gray-900 text-sm font-medium">
          ← Back to Dashboard
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { dbService } from '../services/database'
import controlsData from '../data/controls.json'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const assessment = ref(null)
const loading = ref(true)
const completing = ref(false)
const activeGroup = ref('A')
const expanded = ref(new Set())
const saveState = ref('idle') // idle | saving | saved
const responses = reactive({})

let saveTimeout = null

const totalControls = controlsData.length
const groupLetters = [...new Set(controlsData.map((c) => c.group))].sort()

const groups = computed(() =>
  groupLetters.map((letter) => {
    const inGroup = controlsData.filter((c) => c.group === letter)
    const answered = inGroup.filter(
      (c) => responses[c.ref] && responses[c.ref].status !== 'Not Started'
    ).length
    return { letter, total: inGroup.length, answered }
  })
)

const controlsInActiveGroup = computed(() =>
  controlsData.filter((c) => c.group === activeGroup.value)
)

const activeGroupCategory = computed(() => controlsInActiveGroup.value[0]?.category || '')

const answeredCount = computed(
  () => Object.values(responses).filter((r) => r.status && r.status !== 'Not Started').length
)

const progressPercent = computed(() =>
  totalControls === 0 ? 0 : Math.round((answeredCount.value / totalControls) * 100)
)

const toggleExpand = (refKey) => {
  const next = new Set(expanded.value)
  next.has(refKey) ? next.delete(refKey) : next.add(refKey)
  expanded.value = next
}

const statusBadgeClass = (status) => {
  if (status === 'Effective') return 'bg-green-100 text-green-700'
  if (status === 'Not Effective') return 'bg-red-100 text-red-700'
  if (status === 'N/A') return 'bg-gray-100 text-gray-600'
  return 'bg-yellow-100 text-yellow-700'
}

const initResponses = (savedData) => {
  controlsData.forEach((c) => {
    const existing = savedData?.[c.ref]
    responses[c.ref] = {
      status: existing?.status || 'Not Started',
      observations_noted: existing?.observations_noted || '',
      testing_workpapers: existing?.testing_workpapers || '',
    }
  })
}

const loadAssessment = async () => {
  loading.value = true
  const data = await dbService.getAssessment(route.params.id)
  assessment.value = data
  if (data) initResponses(data.controls_data)
  loading.value = false
}

const saveResponses = async () => {
  if (!assessment.value) return
  saveState.value = 'saving'
  try {
    await dbService.updateAssessmentData(assessment.value.id, { ...responses })
    saveState.value = 'saved'
  } catch (e) {
    console.error('Save failed:', e)
    saveState.value = 'idle'
  }
}

watch(
  responses,
  () => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(saveResponses, 1200)
  },
  { deep: true }
)

const markComplete = async () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  completing.value = true
  try {
    await saveResponses()
    await dbService.completeAssessment(assessment.value.id)
    if (authStore.user?.profile?.assessment_count === 0) {
      await dbService.incrementAssessmentCount(authStore.user.id)
    }
    router.push('/dashboard')
  } finally {
    completing.value = false
  }
}

const exportCsv = () => {
  const rows = [
    ['Ref', 'Category', 'Risk Title', 'Status', 'Observations Noted', 'Testing/Workpaper Notes'],
  ]
  controlsData.forEach((c) => {
    const r = responses[c.ref] || {}
    rows.push([
      c.ref,
      c.category,
      c.risk_title,
      r.status || 'Not Started',
      (r.observations_noted || '').replace(/\n/g, ' '),
      (r.testing_workpapers || '').replace(/\n/g, ' '),
    ])
  })
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${assessment.value?.assessment_name || 'assessment'}-report.csv`
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(loadAssessment)
onBeforeUnmount(() => {
  if (saveTimeout) clearTimeout(saveTimeout)
})
</script>
