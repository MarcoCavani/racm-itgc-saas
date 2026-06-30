<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="loading" class="text-center py-20 text-gray-500">Loading assessment...</div>

    <div v-else-if="!assessment" class="text-center py-20">
      <p class="text-gray-600 mb-4">Assessment not found.</p>
      <router-link to="/dashboard" class="text-blue-600 hover:text-blue-700 font-medium">Back to Dashboard</router-link>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ assessment.assessment_name }}</h1>
          <p class="text-sm text-gray-500 mt-1">
            {{ assessment.status === 'completed' ? 'Completed' : 'In progress' }}
            · {{ answeredCount }} / {{ totalControls }} controls assessed
          </p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm text-gray-400" v-if="saveState === 'saving'">Saving…</span>
          <span class="text-sm text-green-600 font-medium" v-else-if="saveState === 'saved'">Saved ✓</span>
          <button @click="exportCsv" class="btn-secondary">Export CSV</button>
          <button @click="exportExcel" :disabled="exportingExcel" class="btn-secondary">
            {{ exportingExcel ? 'Exporting…' : 'Export Excel' }}
          </button>
          <button @click="generateReport" class="btn-secondary">Generate Report</button>
          <button
            v-if="assessment.status !== 'completed'"
            @click="markComplete"
            :disabled="completing"
            class="btn-primary"
          >{{ completing ? 'Finalizing…' : 'Mark as Complete' }}</button>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div class="bg-blue-600 h-2 rounded-full transition-all" :style="{ width: progressPercent + '%' }"></div>
      </div>

      <!-- Group tabs -->
      <div class="flex flex-wrap gap-1 mb-2 border-b border-gray-200">
        <button
          v-for="group in groups" :key="group.letter"
          @click="activeGroup = group.letter"
          class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
          :class="activeGroup === group.letter ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          {{ group.letter }}
          <span class="ml-1 text-xs" :class="activeGroup === group.letter ? 'text-blue-400' : 'text-gray-400'">
            ({{ group.answered }}/{{ group.total }})
          </span>
        </button>
      </div>

      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-5">{{ activeGroupCategory }}</p>

      <!-- Controls list -->
      <div class="space-y-3">
        <div
          v-for="control in controlsInActiveGroup" :key="control.ref"
          class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <!-- Collapsed header -->
          <button
            @click="toggleExpand(control.ref)"
            class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded shrink-0">{{ control.ref }}</span>
              <span class="font-semibold text-gray-900 truncate">{{ control.risk_title }}</span>
            </div>
            <div class="flex items-center gap-3 ml-4 shrink-0">
              <span class="text-xs px-2.5 py-1 rounded-full font-semibold" :class="conclusionBadgeClass(responses[control.ref]?.overall_conclusion)">
                {{ formatLabel(responses[control.ref]?.overall_conclusion) }}
              </span>
              <span class="text-gray-400 text-sm">{{ expanded.has(control.ref) ? '▲' : '▼' }}</span>
            </div>
          </button>

          <!-- Expanded detail -->
          <div v-if="expanded.has(control.ref)" class="border-t border-gray-100">

            <!-- Control information -->
            <div class="px-6 py-5 space-y-5 bg-gray-50">
              <div>
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Risk Description</h4>
                <p class="text-sm text-gray-700 leading-relaxed">{{ control.risk_description }}</p>
              </div>
              <div>
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Control Objective</h4>
                <p class="text-sm text-gray-700 leading-relaxed">{{ control.control_objective }}</p>
              </div>
              <div>
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Control Description</h4>
                <div class="text-sm text-gray-700 leading-relaxed" v-html="renderText(control.control_description)"></div>
              </div>
              <div>
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Design Effectiveness Test Procedures</h4>
                <div class="text-sm text-gray-700 leading-relaxed" v-html="renderText(control.design_effectiveness_test_procedures)"></div>
              </div>
              <div v-if="control.operating_effectiveness_test_procedures">
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Operating Effectiveness Test Procedures</h4>
                <div class="text-sm text-gray-700 leading-relaxed" v-html="renderText(control.operating_effectiveness_test_procedures)"></div>
              </div>
            </div>

            <!-- Assessment Results -->
            <div class="px-6 py-5">
              <h4 class="text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Assessment Results</h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="field-label">Control Owner</label>
                  <input v-model="responses[control.ref].control_owner" type="text" class="field-input" placeholder="Name or role" />
                </div>
                <div>
                  <label class="field-label">Tested By</label>
                  <input v-model="responses[control.ref].tested_by" type="text" class="field-input" placeholder="Auditor name" />
                </div>
                <div>
                  <label class="field-label">Design Effectiveness Result</label>
                  <select v-model="responses[control.ref].design_effectiveness" class="field-input">
                    <option value="not tested">not tested</option>
                    <option value="effective">effective</option>
                    <option value="ineffective">ineffective</option>
                    <option value="not applicable">not applicable</option>
                  </select>
                </div>
                <div>
                  <label class="field-label">Operating Effectiveness Result</label>
                  <select v-model="responses[control.ref].operating_effectiveness" class="field-input">
                    <option value="not tested">not tested</option>
                    <option value="effective">effective</option>
                    <option value="ineffective">ineffective</option>
                    <option value="not applicable">not applicable</option>
                  </select>
                </div>
                <div>
                  <label class="field-label">Overall Conclusion</label>
                  <select v-model="responses[control.ref].overall_conclusion" class="field-input">
                    <option value="not tested">not tested</option>
                    <option value="effective">effective</option>
                    <option value="partially effective">partially effective</option>
                    <option value="ineffective">ineffective</option>
                  </select>
                </div>
                <div>
                  <label class="field-label">Testing Workpaper Reference</label>
                  <input v-model="responses[control.ref].workpaper_reference" type="text" class="field-input" placeholder="e.g. link or filename" />
                </div>
              </div>

              <div class="mt-4">
                <label class="field-label">Observations Noted</label>
                <textarea v-model="responses[control.ref].observations_noted" rows="3" class="field-input" placeholder="Document findings or observations..."></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8">
        <router-link to="/dashboard" class="text-gray-500 hover:text-gray-800 text-sm font-medium">← Back to Dashboard</router-link>
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
const exportingExcel = ref(false)
const activeGroup = ref('A')
const expanded = ref(new Set())
const saveState = ref('idle')
const responses = reactive({})
let saveTimeout = null

const totalControls = controlsData.length
const groupLetters = [...new Set(controlsData.map(c => c.group))].sort()

const groups = computed(() =>
  groupLetters.map(letter => {
    const inGroup = controlsData.filter(c => c.group === letter)
    const answered = inGroup.filter(c => responses[c.ref]?.overall_conclusion && responses[c.ref].overall_conclusion !== 'not tested').length
    return { letter, total: inGroup.length, answered }
  })
)

const controlsInActiveGroup = computed(() => controlsData.filter(c => c.group === activeGroup.value))
const activeGroupCategory = computed(() => controlsInActiveGroup.value[0]?.category || '')
const answeredCount = computed(() => Object.values(responses).filter(r => r.overall_conclusion && r.overall_conclusion !== 'not tested').length)
const progressPercent = computed(() => totalControls === 0 ? 0 : Math.round((answeredCount.value / totalControls) * 100))

const toggleExpand = (refKey) => {
  const next = new Set(expanded.value)
  next.has(refKey) ? next.delete(refKey) : next.add(refKey)
  expanded.value = next
}

const formatLabel = (val) => val || 'not tested'

const conclusionBadgeClass = (v) => {
  if (v === 'effective') return 'bg-green-100 text-green-700'
  if (v === 'partially effective') return 'bg-orange-100 text-orange-700'
  if (v === 'ineffective') return 'bg-red-100 text-red-700'
  if (v === 'not applicable') return 'bg-gray-100 text-gray-500'
  return 'bg-yellow-50 text-yellow-700'
}

// Parse numbered lists into proper HTML
const renderText = (text) => {
  if (!text) return ''
  const parts = text.split(/(?=\b\d+\.\s)/)
  if (parts.length > 1) {
    const items = parts
      .map(item => {
        const clean = item.replace(/^\d+\.\s*/, '').trim()
        if (!clean) return ''
        // Handle sub-items: a. b. c.
        const subParts = clean.split(/(?<=\s)(?=[a-z]\.\s)/)
        if (subParts.length > 1) {
          const main = subParts[0].trim()
          const subs = subParts.slice(1)
            .map(s => `<li style="margin-top:4px">${s.replace(/^[a-z]\.\s*/, '').trim()}</li>`)
            .join('')
          return `<li style="margin-bottom:6px">${main}<ul style="list-style-type:lower-alpha;padding-left:20px;margin-top:6px">${subs}</ul></li>`
        }
        return `<li style="margin-bottom:6px">${clean}</li>`
      })
      .filter(Boolean)
      .join('')
    return `<ol style="list-style-type:decimal;padding-left:20px;margin:0;line-height:1.7">${items}</ol>`
  }
  return `<p style="margin:0;line-height:1.7">${text.replace(/\n/g, '<br>')}</p>`
}

const initResponses = (savedData) => {
  controlsData.forEach(c => {
    const e = savedData?.[c.ref]
    responses[c.ref] = {
      control_owner: e?.control_owner || '',
      tested_by: e?.tested_by || '',
      design_effectiveness: e?.design_effectiveness || 'not tested',
      operating_effectiveness: e?.operating_effectiveness || 'not tested',
      overall_conclusion: e?.overall_conclusion || 'not tested',
      workpaper_reference: e?.workpaper_reference || '',
      observations_noted: e?.observations_noted || '',
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

// CSV export
const exportCsv = () => {
  const rows = [
    ['Ref', 'Category', 'Risk Title', 'Control Owner', 'Tested By', 'Design Effectiveness', 'Operating Effectiveness', 'Overall Conclusion', 'Workpaper Reference', 'Physical Evidence Reference', 'Observations Noted'],
  ]
  controlsData.forEach(c => {
    const r = responses[c.ref] || {}
    rows.push([
      c.ref, c.category, c.risk_title,
      r.control_owner || '', r.tested_by || '',
      r.design_effectiveness || 'not tested',
      r.operating_effectiveness || 'not tested',
      r.overall_conclusion || 'not tested',
      r.workpaper_reference || '', '',
      (r.observations_noted || '').replace(/\n/g, ' '),
    ])
  })
  const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${assessment.value?.assessment_name || 'assessment'}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// Excel export with full formatting
const exportExcel = async () => {
  exportingExcel.value = true
  try {
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    wb.creator = 'RACM ITGC SaaS'
    wb.created = new Date()

    const ws = wb.addWorksheet('ITGC Assessment', {
      views: [{ state: 'frozen', ySplit: 1 }],
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    })

    ws.columns = [
      { header: 'Ref', key: 'ref', width: 8 },
      { header: 'Category', key: 'category', width: 28 },
      { header: 'Risk Title', key: 'risk_title', width: 28 },
      { header: 'Control Description', key: 'control_description', width: 45 },
      { header: 'Control Owner', key: 'control_owner', width: 18 },
      { header: 'Tested By', key: 'tested_by', width: 18 },
      { header: 'Design Effectiveness', key: 'design_effectiveness', width: 20 },
      { header: 'Operating Effectiveness', key: 'operating_effectiveness', width: 22 },
      { header: 'Overall Conclusion', key: 'overall_conclusion', width: 20 },
      { header: 'Workpaper Reference', key: 'workpaper_reference', width: 24 },
      { header: 'Physical Evidence Reference', key: 'physical_evidence', width: 28 },
      { header: 'Observations Noted', key: 'observations_noted', width: 40 },
    ]

    // Style header row
    const header = ws.getRow(1)
    header.height = 32
    header.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      }
    })

    const conclusionColors = {
      'effective':           { bg: 'FFD1FAE5', fg: 'FF065F46' },
      'partially effective': { bg: 'FFFEF3C7', fg: 'FF92400E' },
      'ineffective':         { bg: 'FFFEE2E2', fg: 'FF991B1B' },
      'not applicable':      { bg: 'FFF3F4F6', fg: 'FF6B7280' },
    }

    controlsData.forEach((c, i) => {
      const r = responses[c.ref] || {}
      const row = ws.addRow({
        ref: c.ref,
        category: c.category,
        risk_title: c.risk_title,
        control_description: c.control_description,
        control_owner: r.control_owner || '',
        tested_by: r.tested_by || '',
        design_effectiveness: r.design_effectiveness || 'not tested',
        operating_effectiveness: r.operating_effectiveness || 'not tested',
        overall_conclusion: r.overall_conclusion || 'not tested',
        workpaper_reference: r.workpaper_reference || '',
        physical_evidence: '',
        observations_noted: r.observations_noted || '',
      })

      row.height = 50
      const rowBg = i % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC'

      row.eachCell((cell, colNum) => {
        cell.alignment = { wrapText: true, vertical: 'top' }
        cell.font = { size: 10, name: 'Calibri' }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        }
      })

      // Colour-code conclusion cell
      const conclusion = r.overall_conclusion
      if (conclusion && conclusionColors[conclusion]) {
        const cell = row.getCell('overall_conclusion')
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: conclusionColors[conclusion].bg } }
        cell.font = { bold: true, color: { argb: conclusionColors[conclusion].fg }, size: 10, name: 'Calibri' }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      }

      // Colour-code design + operating cells
      ;['design_effectiveness', 'operating_effectiveness'].forEach(key => {
        const val = r[key]
        const cell = row.getCell(key)
        if (val === 'effective') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }
          cell.font = { color: { argb: 'FF065F46' }, size: 10, name: 'Calibri' }
        } else if (val === 'ineffective') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
          cell.font = { color: { argb: 'FF991B1B' }, size: 10, name: 'Calibri' }
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      })

      // Bold ref cell
      row.getCell('ref').font = { bold: true, size: 10, name: 'Calibri' }
      row.getCell('ref').alignment = { horizontal: 'center', vertical: 'top' }
    })

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${assessment.value?.assessment_name || 'assessment'}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Excel export failed:', e)
    alert('Excel export failed — try Export CSV instead.')
  } finally {
    exportingExcel.value = false
  }
}

// HTML report
const generateReport = () => {
  const name = assessment.value?.assessment_name || 'Assessment'
  const date = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })

  const conclusionStyle = (v) => {
    if (v === 'effective') return 'color:#065F46;background:#D1FAE5;padding:2px 8px;border-radius:4px;font-weight:600'
    if (v === 'partially effective') return 'color:#92400E;background:#FEF3C7;padding:2px 8px;border-radius:4px;font-weight:600'
    if (v === 'ineffective') return 'color:#991B1B;background:#FEE2E2;padding:2px 8px;border-radius:4px;font-weight:600'
    if (v === 'not applicable') return 'color:#6B7280;background:#F3F4F6;padding:2px 8px;border-radius:4px;font-weight:600'
    return 'color:#92400E;background:#FEF9C3;padding:2px 8px;border-radius:4px;font-weight:600'
  }

  const parseHtml = (text) => {
    if (!text) return '—'
    const parts = text.split(/(?=\b\d+\.\s)/)
    if (parts.length > 1) {
      const items = parts.map(item => {
        const clean = item.replace(/^\d+\.\s*/, '').trim()
        if (!clean) return ''
        const subParts = clean.split(/(?<=\s)(?=[a-z]\.\s)/)
        if (subParts.length > 1) {
          const main = subParts[0].trim()
          const subs = subParts.slice(1).map(s => `<li>${s.replace(/^[a-z]\.\s*/, '').trim()}</li>`).join('')
          return `<li>${main}<ul style="list-style-type:lower-alpha;padding-left:18px;margin-top:4px">${subs}</ul></li>`
        }
        return `<li>${clean}</li>`
      }).filter(Boolean).join('')
      return `<ol style="margin:6px 0;padding-left:20px;line-height:1.7">${items}</ol>`
    }
    return `<span style="line-height:1.7">${text.replace(/\n/g, '<br>')}</span>`
  }

  const summaryRows = controlsData.map(c => {
    const r = responses[c.ref] || {}
    return `<tr>
      <td style="font-weight:700;color:#1D4ED8">${c.ref}</td>
      <td>${c.risk_title}</td>
      <td>${r.control_owner || '—'}</td>
      <td>${r.tested_by || '—'}</td>
      <td style="text-align:center"><span style="${conclusionStyle(r.design_effectiveness)}">${r.design_effectiveness || 'not tested'}</span></td>
      <td style="text-align:center"><span style="${conclusionStyle(r.operating_effectiveness)}">${r.operating_effectiveness || 'not tested'}</span></td>
      <td style="text-align:center"><span style="${conclusionStyle(r.overall_conclusion)}">${r.overall_conclusion || 'not tested'}</span></td>
    </tr>`
  }).join('')

  const detailSections = controlsData.map(c => {
    const r = responses[c.ref] || {}
    return `
    <div style="page-break-inside:avoid;margin-bottom:28px;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden">
      <div style="background:#1D4ED8;color:white;padding:10px 16px;display:flex;align-items:center;gap:12px">
        <span style="font-weight:700;font-size:13px">${c.ref}</span>
        <span style="font-weight:600;font-size:13px">${c.risk_title}</span>
        <span style="margin-left:auto"><span style="${conclusionStyle(r.overall_conclusion)};background:rgba(255,255,255,0.2);color:white">${r.overall_conclusion || 'not tested'}</span></span>
      </div>
      <div style="padding:16px;background:#F9FAFB">
        <p style="margin:0 0 6px 0"><strong>Risk Description:</strong> ${c.risk_description}</p>
        <p style="margin:0 0 6px 0"><strong>Control Objective:</strong> ${c.control_objective}</p>
        <div style="margin:0 0 6px 0"><strong>Control Description:</strong> ${parseHtml(c.control_description)}</div>
        <div style="margin:0 0 6px 0"><strong>Design Test Procedures:</strong> ${parseHtml(c.design_effectiveness_test_procedures)}</div>
        ${c.operating_effectiveness_test_procedures ? `<div style="margin:0 0 6px 0"><strong>Operating Test Procedures:</strong> ${parseHtml(c.operating_effectiveness_test_procedures)}</div>` : ''}
      </div>
      <div style="padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px">
        <div><strong>Control Owner:</strong> ${r.control_owner || '—'}</div>
        <div><strong>Tested By:</strong> ${r.tested_by || '—'}</div>
        <div><strong>Design Effectiveness:</strong> <span style="${conclusionStyle(r.design_effectiveness)}">${r.design_effectiveness || 'not tested'}</span></div>
        <div><strong>Operating Effectiveness:</strong> <span style="${conclusionStyle(r.operating_effectiveness)}">${r.operating_effectiveness || 'not tested'}</span></div>
        <div><strong>Overall Conclusion:</strong> <span style="${conclusionStyle(r.overall_conclusion)}">${r.overall_conclusion || 'not tested'}</span></div>
        <div><strong>Workpaper Reference:</strong> ${r.workpaper_reference || '—'}</div>
        ${r.observations_noted ? `<div style="grid-column:1/-1"><strong>Observations:</strong><br>${r.observations_noted.replace(/\n/g, '<br>')}</div>` : ''}
      </div>
    </div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${name} — ITGC Audit Report</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #111827; margin: 40px; line-height: 1.5; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; color: #111827; }
    .meta { color: #6B7280; margin-bottom: 36px; font-size: 13px; }
    h2 { font-size: 15px; font-weight: 700; color: #1D4ED8; border-bottom: 2px solid #BFDBFE; padding-bottom: 6px; margin: 32px 0 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1D4ED8; color: white; padding: 9px 10px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 8px 10px; border-bottom: 1px solid #E5E7EB; font-size: 11px; vertical-align: top; }
    tr:nth-child(even) td { background: #F8FAFC; }
    @media print { body { margin: 15px; } }
  </style>
</head>
<body>
  <h1>${name}</h1>
  <div class="meta">ITGC Audit Report &nbsp;&bull;&nbsp; Generated: ${date} &nbsp;&bull;&nbsp; ${answeredCount.value} of ${totalControls} controls assessed</div>

  <h2>Assessment Summary</h2>
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
  ${detailSections}
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

onMounted(loadAssessment)
onBeforeUnmount(() => { if (saveTimeout) clearTimeout(saveTimeout) })
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 text-sm font-semibold transition-colors;
}
.btn-secondary {
  @apply bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors;
}
.field-label {
  @apply block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5;
}
.field-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}
</style>
