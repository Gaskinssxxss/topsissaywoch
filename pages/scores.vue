<template>
  <section>
    <PageHeader
      title="Nilai Alternatif"
      description="Input nilai setiap wilayah untuk seluruh kriteria. Data ini menjadi matriks keputusan TOPSIS."
    >
      <template #actions>
        <select v-if="availableYears.length" v-model.number="selectedYear" class="toolbar-select" aria-label="Tahun nilai">
          <option v-for="year in availableYears" :key="year" :value="year">
            Tahun {{ year }}
          </option>
        </select>
        <NuxtLink class="btn" to="/">Dashboard</NuxtLink>
        <button class="btn primary" :disabled="pendingSave" @click="saveScores">
          <span v-if="pendingSave" class="spinner" aria-hidden="true"></span>
          {{ pendingSave ? 'Menyimpan...' : 'Simpan Nilai' }}
        </button>
      </template>
    </PageHeader>

    <div v-if="message" class="message section" :class="{ error: messageType === 'error' }">
      {{ message }}
    </div>

    <div v-if="pendingSave" class="process-card section">
      <div class="spinner large" aria-hidden="true"></div>
      <div>
        <strong>Menyimpan matriks keputusan</strong>
        <p>Nilai setiap wilayah sedang disimpan agar bisa dipakai pada proses TOPSIS berikutnya.</p>
        <div class="progress-line" aria-hidden="true"></div>
      </div>
    </div>

    <section class="panel">
      <div class="panel-header">
        <h2>Matriks Keputusan Tahun {{ selectedYear ?? '-' }}</h2>
        <span class="badge">{{ alternatives.length }} x {{ criteria.length }}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kode</th>
              <th>Wilayah</th>
              <th v-for="criterion in criteria" :key="criterion.id" class="number">
                {{ criterion.code }}
                <span class="badge" :class="criterion.type">{{ criterion.type }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alternative in alternatives" :key="alternative.id">
              <td>{{ alternative.code }}</td>
              <td><strong>{{ alternative.name }}</strong></td>
              <td v-for="criterion in criteria" :key="criterion.id" class="number">
                <input
                  v-model.number="matrix[alternative.id][criterion.id]"
                  class="score-input"
                  type="number"
                  step="0.01"
                  min="0"
                  :aria-label="`${alternative.name} ${criterion.name}`"
                >
              </td>
            </tr>
            <tr v-if="!alternatives.length || !criteria.length">
              <td :colspan="2 + criteria.length">
                <div class="message">
                  Data alternatif atau kriteria belum tersedia.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel section">
      <div class="panel-header">
        <h2>Keterangan Kriteria</h2>
      </div>
      <div class="table-wrap">
        <table class="compact-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama</th>
              <th class="number">Bobot</th>
              <th>Tipe</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="criterion in criteria" :key="criterion.id">
              <td>{{ criterion.code }}</td>
              <td>{{ criterion.name }}</td>
              <td class="number">{{ number(criterion.weight, 2) }}</td>
              <td><span class="badge" :class="criterion.type">{{ criterion.type }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
type Alternative = {
  id: number
  code: string
  name: string
}

type Criteria = {
  id: number
  code: string
  name: string
  weight: number
  type: 'benefit' | 'cost'
}

type Score = {
  alternativeId: number
  criteriaId: number
  value: number
}

const { number } = useFormat()
const pendingSave = ref(false)
const message = ref('')
const messageType = ref<'info' | 'error'>('info')
const matrix = reactive<Record<number, Record<number, number>>>({})
const selectedYear = ref<number | null>(null)

const { data: alternativesData } = await useFetch<Alternative[]>('/api/alternatives', {
  default: () => []
})
const { data: criteriaData } = await useFetch<Criteria[]>('/api/criteria', {
  default: () => []
})
const { data: summary } = await useFetch<any>('/api/dashboard/summary')
const availableYears = computed<number[]>(() => summary.value?.years ?? [])

watchEffect(() => {
  if (!selectedYear.value && summary.value?.latestYear) {
    selectedYear.value = summary.value.latestYear
  }
})

const scoresUrl = computed(() => `/api/scores?year=${selectedYear.value ?? summary.value?.latestYear ?? 2024}`)
const { data: scoresData, refresh: refreshScores } = await useFetch<Score[]>(scoresUrl, {
  default: () => []
})

const alternatives = computed(() => alternativesData.value)
const criteria = computed(() => criteriaData.value)

watch([alternatives, criteria, scoresData], () => {
  for (const key of Object.keys(matrix)) {
    delete matrix[Number(key)]
  }

  for (const alternative of alternatives.value) {
    matrix[alternative.id] = {}
    for (const criterion of criteria.value) {
      matrix[alternative.id][criterion.id] = 0
    }
  }

  for (const score of scoresData.value) {
    matrix[score.alternativeId] ??= {}
    matrix[score.alternativeId][score.criteriaId] = Number(score.value)
  }
}, { immediate: true })

async function saveScores() {
  pendingSave.value = true
  message.value = ''
  try {
    const scores = []
    for (const alternative of alternatives.value) {
      for (const criterion of criteria.value) {
        scores.push({
          alternativeId: alternative.id,
          criteriaId: criterion.id,
          value: Number(matrix[alternative.id]?.[criterion.id] ?? 0),
          year: selectedYear.value ?? summary.value?.latestYear ?? 2024
        })
      }
    }

    await $fetch('/api/scores', {
      method: 'POST',
      body: { scores }
    })

    messageType.value = 'info'
    message.value = `${scores.length} nilai berhasil disimpan.`
    await refreshScores()
  } catch (error: any) {
    messageType.value = 'error'
    message.value = error?.data?.message || error?.message || 'Gagal menyimpan nilai.'
  } finally {
    pendingSave.value = false
  }
}
</script>
