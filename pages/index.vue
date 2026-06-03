<template>
  <section>
    <PageHeader
      title="Dashboard"
      description="Mulai dari upload dataset, proses TOPSIS, lalu lihat wilayah prioritas."
    >
      <template #actions>
        <select v-if="availableYears.length" v-model.number="selectedYear" class="toolbar-select" aria-label="Tahun kerja">
          <option v-for="year in availableYears" :key="year" :value="year">
            Tahun {{ year }}
          </option>
        </select>
        <button class="btn primary" type="button" @click="showUploadModal = true">
          Upload Dataset
        </button>
        <button class="btn" :disabled="!hasData || pendingCalculate" @click="calculate">
          <span v-if="pendingCalculate" class="spinner" aria-hidden="true"></span>
          {{ pendingCalculate ? 'Memproses...' : 'Proses TOPSIS' }}
        </button>
        <NuxtLink class="btn" to="/results">Ranking</NuxtLink>
        <button class="btn danger" :disabled="pendingClear" @click="clearData">
          <span v-if="pendingClear" class="spinner danger" aria-hidden="true"></span>
          {{ pendingClear ? 'Menghapus...' : 'Hapus Data' }}
        </button>
      </template>
    </PageHeader>

    <div v-if="message" class="message section" :class="{ error: messageType === 'error' }">
      {{ message }}
    </div>

    <div v-if="pendingCalculate || pendingClear" class="process-card section">
      <div class="spinner large" aria-hidden="true"></div>
      <div>
        <strong>{{ pendingCalculate ? 'TOPSIS sedang dihitung' : 'Data sistem sedang dikosongkan' }}</strong>
        <p>
          {{ pendingCalculate
            ? 'Sistem sedang membuat matriks normalisasi, pembobotan, solusi ideal, jarak, dan ranking.'
            : 'Sistem sedang menghapus alternatif, kriteria, nilai, dan hasil perhitungan lama.' }}
        </p>
        <div class="progress-line" aria-hidden="true"></div>
      </div>
    </div>

    <section class="status-banner section" :class="{ empty: !hasData }">
      <div>
        <span class="eyebrow">{{ hasData ? (hasResult ? 'Hasil TOPSIS tersedia' : 'Dataset sudah diupload') : 'Belum ada data' }}</span>
        <h2>{{ statusTitle }}</h2>
        <p>
          {{ hasData
            ? (hasResult
              ? 'Ranking sudah tersedia. Anda tetap bisa menghitung ulang jika data baru diupload atau nilai diubah.'
              : 'Data sudah masuk ke sistem, tetapi belum dihitung. Jalankan proses TOPSIS untuk membuat ranking prioritas.')
            : 'Sistem dibuat kosong agar data dapat diuji berulang. Upload beberapa CSV, lalu sistem akan mendeteksi kolom dan menggabungkan data per wilayah.' }}
        </p>
      </div>
      <div class="status-actions">
        <button v-if="!hasData" class="btn primary" type="button" @click="showUploadModal = true">
          Upload Sekarang
        </button>
        <button v-else class="btn primary" :disabled="pendingCalculate" @click="calculate">
          <span v-if="pendingCalculate" class="spinner" aria-hidden="true"></span>
          {{ pendingCalculate ? 'Memproses...' : (hasResult ? 'Hitung Ulang' : 'Proses TOPSIS') }}
        </button>
        <NuxtLink v-if="hasResult" class="btn" to="/results">Buka Ranking</NuxtLink>
      </div>
    </section>

    <div class="stats-grid">
      <article class="stat">
        <span>Alternatif Wilayah</span>
        <strong>{{ summary?.alternatives ?? 0 }}</strong>
        <small>Kabupaten/kota yang dibandingkan</small>
      </article>
      <article class="stat">
        <span>Kriteria</span>
        <strong>{{ summary?.criteria ?? 0 }}</strong>
        <small>Indikator penilaian TOPSIS</small>
      </article>
      <article class="stat">
        <span>Nilai Data</span>
        <strong>{{ summary?.scores ?? 0 }}</strong>
        <small>Nilai wilayah per kriteria</small>
      </article>
      <article class="stat">
        <span>Tahun Aktif</span>
        <strong>{{ selectedYear || '-' }}</strong>
        <small>Tahun yang sedang dipakai</small>
      </article>
    </div>

    <div class="grid-2">
      <section class="panel">
        <div class="panel-header">
          <h2>Wilayah Prioritas Utama</h2>
          <span v-if="summary?.topResult" class="badge">Ranking 1</span>
        </div>
        <div class="panel-body">
          <template v-if="summary?.topResult">
            <div class="priority-summary">
              <div>
                <span class="rank-cell">1</span>
              </div>
              <div>
                <h3>{{ summary.topResult.alternativeName }}</h3>
                <p>
                  Nilai preferensi {{ number(summary.topResult.preferenceValue, 6) }}
                  dengan kategori {{ summary.topResult.category }}.
                </p>
                <NuxtLink class="btn subtle" to="/results">Lihat semua ranking</NuxtLink>
              </div>
            </div>
          </template>
          <div v-else class="empty-state">
            <strong>Ranking belum tersedia</strong>
            <p>{{ hasData ? 'Dataset sudah ada. Jalankan proses TOPSIS untuk membuat ranking.' : 'Upload dataset lengkap agar sistem dapat menghitung prioritas wilayah.' }}</p>
            <button v-if="hasData" class="btn primary" :disabled="pendingCalculate" @click="calculate">
              <span v-if="pendingCalculate" class="spinner" aria-hidden="true"></span>
              {{ pendingCalculate ? 'Memproses...' : 'Proses TOPSIS' }}
            </button>
            <button v-else class="btn primary" type="button" @click="showUploadModal = true">
              Upload Dataset
            </button>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>Alur Penggunaan</h2>
        </div>
        <div class="panel-body">
          <ol class="step-list">
            <li :class="{ done: hasData }">
              <span>1</span>
              <div>
                <strong>Upload dataset CSV</strong>
                <p>Pilih file stunting, status gizi, kemiskinan, dan sanitasi.</p>
              </div>
            </li>
            <li :class="{ done: hasScores }">
              <span>2</span>
              <div>
                <strong>Data siap dihitung</strong>
                <p>Kolom dikenali otomatis dan nilai disimpan per wilayah.</p>
              </div>
            </li>
            <li :class="{ done: hasResult }">
              <span>3</span>
              <div>
                <strong>Proses TOPSIS</strong>
                <p>Jalankan perhitungan untuk menghasilkan ranking prioritas.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </div>

    <UploadDatasetModal
      :open="showUploadModal"
      @close="showUploadModal = false"
      @imported="handleDatasetImported"
    />
  </section>
</template>

<script setup lang="ts">
const { number } = useFormat()

const message = ref('')
const messageType = ref<'info' | 'error'>('info')
const pendingCalculate = ref(false)
const pendingClear = ref(false)
const showUploadModal = ref(false)
const selectedYear = ref<number | null>(null)

const summaryUrl = computed(() => selectedYear.value
  ? `/api/dashboard/summary?year=${selectedYear.value}`
  : '/api/dashboard/summary'
)
const { data: summary, refresh } = await useFetch<any>(summaryUrl)

const hasData = computed(() => Boolean(summary.value?.alternatives && summary.value?.criteria))
const hasScores = computed(() => Boolean(summary.value?.scores))
const hasResult = computed(() => Boolean(summary.value?.topResult))
const availableYears = computed<number[]>(() => summary.value?.years ?? [])
const statusTitle = computed(() => {
  if (!hasData.value) return 'Upload dataset untuk memulai analisis'
  if (!hasResult.value) return `Dataset tahun ${selectedYear.value ?? '-'} siap diproses`
  return `Ranking tahun ${selectedYear.value ?? '-'} sudah tersedia`
})

watchEffect(() => {
  if (!selectedYear.value && summary.value?.latestYear) {
    selectedYear.value = summary.value.latestYear
  }
})

async function calculate() {
  pendingCalculate.value = true
  message.value = ''
  try {
    const result = await $fetch<any>('/api/topsis/calculate', {
      method: 'POST',
      body: { year: selectedYear.value ?? summary.value?.latestYear ?? 2024 }
    })
    messageType.value = 'info'
    message.value = `Perhitungan TOPSIS selesai. Ranking pertama: ${result.results[0]?.alternativeName}.`
    await refresh()
  } catch (error: any) {
    messageType.value = 'error'
    message.value = error?.data?.message || error?.message || 'Gagal menghitung TOPSIS.'
  } finally {
    pendingCalculate.value = false
  }
}

async function handleDatasetImported(payload: any) {
  messageType.value = 'info'
  message.value = 'Dataset berhasil diupload. Klik Proses TOPSIS untuk membuat ranking.'
  selectedYear.value = payload?.year ?? selectedYear.value
  showUploadModal.value = false
  await refresh()
}

async function clearData() {
  if (!confirm('Hapus semua data sistem supaya bisa test upload ulang?')) return

  pendingClear.value = true
  message.value = ''
  try {
    await $fetch('/api/datasets/clear', { method: 'DELETE' })
    messageType.value = 'info'
    message.value = 'Data sistem berhasil dikosongkan.'
    selectedYear.value = null
    await refresh()
  } catch (error: any) {
    messageType.value = 'error'
    message.value = error?.data?.message || error?.message || 'Gagal menghapus data.'
  } finally {
    pendingClear.value = false
  }
}
</script>
