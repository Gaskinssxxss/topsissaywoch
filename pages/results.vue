<template>
  <section>
    <PageHeader
      title="Hasil Ranking"
      description="Urutan prioritas wilayah berdasarkan nilai preferensi TOPSIS terbesar."
    >
      <template #actions>
        <select v-if="availableYears.length" v-model.number="selectedYear" class="toolbar-select" aria-label="Tahun ranking">
          <option v-for="year in availableYears" :key="year" :value="year">
            Tahun {{ year }}
          </option>
        </select>
        <button class="btn primary" :disabled="pending" @click="calculate">
          <span v-if="pending" class="spinner" aria-hidden="true"></span>
          {{ pending ? 'Menghitung...' : 'Hitung Ulang' }}
        </button>
      </template>
    </PageHeader>

    <div v-if="message" class="message section" :class="{ error: messageType === 'error' }">
      {{ message }}
    </div>

    <div v-if="pending" class="process-card section">
      <div class="spinner large" aria-hidden="true"></div>
      <div>
        <strong>Memperbarui ranking</strong>
        <p>Sistem sedang menghitung nilai preferensi dan menyusun ulang peringkat wilayah.</p>
        <div class="progress-line" aria-hidden="true"></div>
      </div>
    </div>

    <section class="panel">
      <div class="panel-header">
        <h2>Ranking Tahun {{ selectedYear ?? '-' }}</h2>
        <span class="badge">{{ results?.length ?? 0 }} wilayah</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Kode</th>
              <th>Wilayah</th>
              <th class="number">D+</th>
              <th class="number">D-</th>
              <th class="number">Preferensi</th>
              <th>Kategori</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in results" :key="row.id">
              <td><span class="rank-cell">{{ row.rank }}</span></td>
              <td>{{ row.alternativeCode }}</td>
              <td><strong>{{ row.alternativeName }}</strong></td>
              <td class="number">{{ number(row.dPlus, 6) }}</td>
              <td class="number">{{ number(row.dMinus, 6) }}</td>
              <td class="number">{{ number(row.preferenceValue, 6) }}</td>
              <td><span class="badge">{{ row.category }}</span></td>
            </tr>
            <tr v-if="!results?.length">
              <td colspan="7">
                <div class="message">
                  Hasil ranking belum tersedia. Jalankan hitung ulang untuk membuat hasil TOPSIS.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
const { number } = useFormat()
const pending = ref(false)
const message = ref('')
const messageType = ref<'info' | 'error'>('info')
const selectedYear = ref<number | null>(null)

const { data: summary } = await useFetch<any>('/api/dashboard/summary')
const availableYears = computed<number[]>(() => summary.value?.years ?? [])

watchEffect(() => {
  if (!selectedYear.value && summary.value?.latestYear) {
    selectedYear.value = summary.value.latestYear
  }
})

const resultsUrl = computed(() => `/api/topsis/results?year=${selectedYear.value ?? summary.value?.latestYear ?? 2024}`)
const { data: results, refresh } = await useFetch<any[]>(resultsUrl, {
  default: () => []
})

async function calculate() {
  pending.value = true
  message.value = ''
  try {
    await $fetch('/api/topsis/calculate', {
      method: 'POST',
      body: { year: selectedYear.value ?? summary.value?.latestYear ?? 2024 }
    })
    messageType.value = 'info'
    message.value = 'Hasil ranking berhasil diperbarui.'
    await refresh()
  } catch (error: any) {
    messageType.value = 'error'
    message.value = error?.data?.message || error?.message || 'Gagal menghitung TOPSIS.'
  } finally {
    pending.value = false
  }
}
</script>
