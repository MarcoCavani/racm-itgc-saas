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
            · {{ answeredCount }} / {{ totalControls }} controls assessed
          </p>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <span class="text-sm text-gray-400" v-if="saveState === 'saving'">Saving…</span>
          <span class="text-sm text-green-600" v-else-if="saveState === 'saved'">Saved ✓</span>
          <button
            @click="exportCsv"
            class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Export CSV
          </button>
          <button
            @click="generateReport"
            class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Generate Report
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

      <p class="text-sm text-gray-500 mb-4 font-medium">{{ activeGroupCategory }}</p>

      <!-- Controls list -->
      <div class="space-y-3">
        <div
          v-for="control in controlsInActiveGroup"
          :key="control.ref"
          class="bg-white rounded-lg shadow border border-gray-200"
        >
          <!-- Control header row -->
          <button
            @click="toggleExpand(control.ref)"
            class="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <div class="flex items-center gap-4 min-w-0">
              <span class="text-xs font-semibold text-blue-600 shrink-0">{{ control.ref }}</span>
              <h3 class="font-semibold text-gray-900 truncate">{{ control.risk_title }}</h3>
            </div>
            <div class="flex items-center gap-3 ml-4 shrink-0">
              <span class="text-xs px-2 py-1 rounded-full font-medium" :class="conclusionBadgeClass(responses[control.ref]?.overall_conclusion)">
                {{ formatLabel(responses[control.ref]?.overall_conclusion || 'not tested') }}
              </span>
              <span class="text-gray-400 text-lg leading-none">{{ expanded.has(control.ref) ? '−' : '+' }}</span>
            </div>
          </button>

          <!-- Expanded detail -->
          <div v-if="expanded.has(control.ref)" class="px-5 pb-6 border-t pt-4 space-y-4">
            <!-- Control information -->
            <div class="grid grid-cols-1 gap-3">
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
            </div>

            <!-- Assessment Results -->
            <div class="border-t pt-4">
              <h4 class="text-sm font-semibold text-gray-800 mb-4">Assessment Results</h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Control Owner -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1">Control Owner</label>
                  <input
                    v-model="responses[control.ref].control_owner"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Name or role"
                  />
                </div>

                <!-- Tested By -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1">Tested By</label>
                  <input
                    v-model="responses[control.ref].tested_by"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Auditor name"
                  />
                </div>

                <!-- Design Effectiveness -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1">Design Effectiveness Result</label>
                  <select
                    v-model="responses[control.ref].design_effectiveness"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="not tested">not tested</option>
                    <option value="effective">effective</option>
                    <option value="ineffective">ineffective</option>
                    <option value="not applicable">not applicable</option>
                  </select>
                </div>

                <!-- Operating Effectiveness -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1">Operating Effectiveness Result</label>
                  <select
                    v-model="responses[control.ref].operating_effectiveness"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="not tested">not tested</option>
                    <option value="effective">effective</option>
                    <option value="ineffective">ineffective</option>
                    <option value="not applicable">not applicable</option>
                  </select>
                </div>

                <!-- Overall Conclusion -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1">Overall Conclusion</label>
                  <select
                    v-model="responses[control.ref].overall_conclusion"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="not tested">not tested</option>
                    <option value="effective">effective</option>
                    <option value="partially effective">partially effective</option>
                    <option value="ineffective">ineffective</option>
                  </select>
                </div>

                <!-- Workpaper Reference -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1">Testing Workpaper Reference</label>
                  <input
                    v-model="responses[control.ref].workpaper_reference"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="e.g. link or filename"
                  />
                </div>
              </div>

              <!-- Observations -->
              <div class="mt-4">
                <label class="block text-xs font-medium text-gray-500 mb-1">Observations Noted</label>
                <textarea
                  v-model="responses[control.ref].observations_noted"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Document findings or observations..."
                ></textarea>
              </div>
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
const saveState = ref('idle')
const responses = reactive({})

let saveTimeout = null

const totalControls = controlsData.length
const groupLetters = [...new Set(controlsData.map((c) => c.group))].sort()

const groups = computed(() =>
  groupLetters.map((letter) => {
    const inGroup = controlsData.filter((c) => c.group === letter)
    const answered = inGroup.filter(
      (c) => responses[c.ref] && responses[c.ref].overall_conclusion !== 'not tested'
    ).length
    return { letter, total: inGroup.length, answered }
  })
)

const controlsInActiveGroup = computed(() =>
  controlsData.filter((c) => c.group === activeGroup.value)
)

const activeGroupCategory = computed(() => controlsInActiveGroup.value[0]?.category || '')

const answeredCount = computed(
  () => Object.values(responses).filter((r) => r.overall_conclusion && r.overall_conclusion !== 'not tested').length
)

const progressPercent = computed(() =>
  totalControls === 0 ? 0 : Math.round((answeredCount.value / totalControls) * 100)
)

const toggleExpand = (refKey) => {
  const next = new Set(expanded.value)
  next.has(refKey) ? next.delete(refKey) : next.add(refKey)
  expanded.value = next
}

const formatLabel = (val) => val || 'not tested'

const conclusionBadgeClass = (conclusion) => {
  if (conclusion === 'effective') return 'bg-green-100 text-green-700'
  if (conclusion === 'partially effective') return 'bg-orange-100 text-orange-700'
  if (conclusion === 'ineffective') return 'bg-red-100 text-red-700'
  if (conclusion === 'not applicable') return 'bg-gray-100 text-gray-500'
  return 'bg-yellow-100 text-yellow-700'
}

const initResponses = (savedData) => {
  controlsData.forEach((c) => {
    const existing = savedData?.[c.ref]
    responses[c.ref] = {
      control_owner: existing?.control_owner || '',
      tested_by: existing?.tested_by || '',
      design_effectiveness: existing?.design_effectiveness || 'not tested',
      operating_effectiveness: existing?.operating_effectiveness || 'not tested',
      overall_conclusion: existing?.overall_conclusion || 'not tested',
      workpaper_reference: existing?.workpaper_reference || '',
      observations_noted: existing?.observations_noted || '',
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

watch(responses, () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(saveResponses, 1200)
}, { deep: true })

const markComplete = async () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  completing.value = true
  try {
    await saveResponses()
    await dbService.completeAssessment(assessment.value.id)
    router.push('/dashboard')
  } finally {
    completing.value = false
  }
}

const exportCsv = () => {
  const rows = [
    ['Ref', 'Category', 'Risk Title', 'Control Owner', 'Tested By', 'Design Effectiveness', 'Operating Effectiveness', 'Overall Conclusion', 'Workpaper Reference', 'Observations Noted'],
  ]
  controlsData.forEach((c) => {
    const r = responses[c.ref] || {}
    rows.push([
      c.ref,
      c.category,
      c.risk_title,
      r.control_owner || '',
      r.tested_by || '',
      r.design_effectiveness || 'not tested',
      r.operating_effectiveness || 'not tested',
      r.overall_conclusion || 'not tested',
      r.workpaper_reference || '',
      (r.observations_noted || '').replace(/\n/g, ' '),
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

const generateReport = () => {
  const name = assessment.value?.assessment_name || 'Assessment'
  const date = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })

  const summaryRows = controlsData.map((c) => {
    const r = responses[c.ref] || {}
    const conclusionColor =
      r.overall_conclusion === 'effective' ? '#15803d' :
      r.overall_conclusion === 'partially effective' ? '#c2410c' :
      r.overall_conclusion === 'ineffective' ? '#dc2626' :
      r.overall_conclusion === 'not applicable' ? '#6b7280' : '#92400e'
    return `
      <tr>
        <td>${c.ref}</td>
        <td>${c.risk_title}</td>
        <td>${r.control_owner || '—'}</td>
        <td>${r.tested_by || '—'}</td>
        <td>${r.design_effectiveness || 'not tested'}</td>
        <td>${r.operating_effectiveness || 'not tested'}</td>
        <td style="color:${conclusionColor};font-weight:600">${r.overall_conclusion || 'not tested'}</td>
      </tr>`
  }).join('')

  const detailSections = controlsData.map((c) => {
    const r = responses[c.ref] || {}
    if (r.overall_conclusion === 'not tested' && !r.observations_noted) return ''
    return `
      <div class="control-detail">
        <div class="control-ref">${c.ref} — ${c.risk_title}</div>
        <table class="detail-table">
          <tr><th>Control Owner</th><td>${r.control_owner || '—'}</td><th>Tested By</th><td>${r.tested_by || '—'}</td></tr>
          <tr><th>Design Effectiveness</th><td>${r.design_effectiveness || 'not tested'}</td><th>Operating Effectiveness</th><td>${r.operating_effectiveness || 'not tested'}</td></tr>
          <tr><th>Overall Conclusion</th><td colspan="3" style="font-weight:600">${r.overall_conclusion || 'not tested'}</td></tr>
          ${r.workpaper_reference ? `<tr><th>Workpaper Reference</th><td colspan="3">${r.workpaper_reference}</td></tr>` : ''}
          ${r.observations_noted ? `<tr><th>Observations</th><td colspan="3">${r.observations_noted}</td></tr>` : ''}
        </table>
      </div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${name} — ITGC Report</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; margin: 40px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #666; margin-bottom: 32px; }
    h2 { font-size: 16px; border-bottom: 2px solid #2563eb; padding-bottom: 6px; margin-top: 32px; color: #2563eb; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { padding: 8px 10px; border: 1px solid #e5e7eb; text-align: left; }
    thead th { background: #f3f4f6; font-weight: 600; font-size: 12px; }
    .control-detail { margin-bottom: 24px; }
    .control-ref { font-weight: 700; font-size: 14px; margin-bottom: 8px; color: #1e3a5f; }
    .detail-table th { background: #f9fafb; width: 22%; font-weight: 600; color: #374151; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>${name}</h1>
  <div class="meta">ITGC Audit Report &nbsp;·&nbsp; Generated: ${date}</div>

  <h2>Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Ref</th><th>Risk Title</th><th>Control Owner</th><th>Tested By</th>
        <th>Design</th><th>Operating</th><th>Conclusion</th>
      </tr>
    </thead>
    <tbody>${summaryRows}</tbody>
  </table>

  <h2>Detailed Findings</h2>
  ${detailSections || '<p style="color:#666">No controls assessed yet.</p>'}
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.print()
}

onMounted(loadAssessment)
onBeforeUnmount(() => {
  if (saveTimeout) clearTimeout(saveTimeout)
})
</script>
