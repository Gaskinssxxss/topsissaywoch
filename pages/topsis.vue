<template>
  <section>
    <PageHeader
      title="Perhitungan TOPSIS"
      description="Detail proses sesuai tahapan TOPSIS: normalisasi, pembobotan, solusi ideal, jarak, dan preferensi."
    >
      <template #actions>
        <select v-if="availableYears.length" v-model.number="selectedYear" class="toolbar-select" aria-label="Tahun detail TOPSIS">
          <option v-for="year in availableYears" :key="year" :value="year">
            Tahun {{ year }}
          </option>
        </select>
        <button class="btn primary" :disabled="pending" @click="calculate">
          <span v-if="pending" class="spinner" aria-hidden="true"></span>
          {{ pending ? 'Menghitung...' : 'Hitung TOPSIS' }}
        </button>
      </template>
    </PageHeader>

    <div v-if="message" class="message section" :class="{ error: messageType === 'error' }">
      {{ message }}
    </div>

    <div v-if="pending" class="process-card section">
      <div class="spinner large" aria-hidden="true"></div>
      <div>
        <strong>Membuat detail perhitungan</strong>
        <p>Normalisasi, matriks terbobot, solusi ideal, jarak, dan preferensi sedang diperbarui.</p>
        <div class="progress-line" aria-hidden="true"></div>
      </div>
    </div>

    <section v-if="detail" class="panel">
      <div class="panel-header">
        <h2>Detail Tahun {{ detail.year }}</h2>
        <span class="badge">{{ activeLabel }}</span>
      </div>
      <div class="panel-body">
        <div class="matrix-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="btn"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div v-if="activeTab === 'decision'" class="table-wrap">
        <MatrixTable :criteria="detail.criteria" :rows="detail.decisionMatrix" :digits="2" />
      </div>

      <div v-else-if="activeTab === 'normalized'" class="table-wrap">
        <MatrixTable :criteria="detail.criteria" :rows="detail.normalizedMatrix" :digits="6" />
      </div>

      <div v-else-if="activeTab === 'weighted'" class="table-wrap">
        <MatrixTable :criteria="detail.criteria" :rows="detail.weightedMatrix" :digits="6" />
      </div>

      <div v-else-if="activeTab === 'ideal'" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Solusi</th>
              <th v-for="criterion in detail.criteria" :key="criterion.id" class="number">
                {{ criterion.code }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>A+ Ideal Positif</strong></td>
              <td v-for="criterion in detail.criteria" :key="criterion.id" class="number">
                {{ number(detail.idealPositive[criterion.code], 6) }}
              </td>
            </tr>
            <tr>
              <td><strong>A- Ideal Negatif</strong></td>
              <td v-for="criterion in detail.criteria" :key="criterion.id" class="number">
                {{ number(detail.idealNegative[criterion.code], 6) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Wilayah</th>
              <th class="number">D+</th>
              <th class="number">D-</th>
              <th class="number">Preferensi</th>
              <th class="number">Ranking</th>
              <th>Kategori</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in detail.results" :key="row.alternativeId">
              <td><strong>{{ row.alternativeName }}</strong></td>
              <td class="number">{{ number(row.dPlus, 6) }}</td>
              <td class="number">{{ number(row.dMinus, 6) }}</td>
              <td class="number">{{ number(row.preferenceValue, 6) }}</td>
              <td class="number">{{ row.rank }}</td>
              <td><span class="badge">{{ row.category }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-else class="panel">
      <div class="panel-body">
        <div class="message">
          Detail perhitungan belum tersedia. Jalankan hitung TOPSIS untuk membuat detail matriks.
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
type TabKey = 'decision' | 'normalized' | 'weighted' | 'ideal' | 'distance'

const { number } = useFormat()
const pending = ref(false)
const message = ref('')
const messageType = ref<'info' | 'error'>('info')
const activeTab = ref<TabKey>('decision')
const selectedYear = ref<number | null>(null)
const tabs: { key: TabKey, label: string }[] = [
  { key: 'decision', label: 'Matriks Keputusan' },
  { key: 'normalized', label: 'Normalisasi' },
  { key: 'weighted', label: 'Terbobot' },
  { key: 'ideal', label: 'Solusi Ideal' },
  { key: 'distance', label: 'Jarak & Preferensi' }
]

const { data: summary } = await useFetch<any>('/api/dashboard/summary')
const availableYears = computed<number[]>(() => summary.value?.years ?? [])

watchEffect(() => {
  if (!selectedYear.value && summary.value?.latestYear) {
    selectedYear.value = summary.value.latestYear
  }
})

const detailUrl = computed(() => `/api/topsis/detail?year=${selectedYear.value ?? summary.value?.latestYear ?? 2024}`)
const { data: detail, refresh } = await useFetch<any>(detailUrl, {
  default: () => null
})

const activeLabel = computed(() => tabs.find((tab) => tab.key === activeTab.value)?.label ?? '')

async function calculate() {
  pending.value = true
  message.value = ''
  try {
    await $fetch('/api/topsis/calculate', {
      method: 'POST',
      body: { year: selectedYear.value ?? summary.value?.latestYear ?? 2024 }
    })
    messageType.value = 'info'
    message.value = 'Perhitungan TOPSIS berhasil diperbarui.'
    await refresh()
  } catch (error: any) {
    messageType.value = 'error'
    message.value = error?.data?.message || error?.message || 'Gagal menghitung TOPSIS.'
  } finally {
    pending.value = false
  }
}
</script>
