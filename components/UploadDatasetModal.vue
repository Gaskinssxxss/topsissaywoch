<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" role="presentation" @click.self="close">
      <section
        class="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
      >
        <div v-if="busy" class="modal-busy">
          <div class="spinner large" aria-hidden="true"></div>
          <strong>{{ pendingInspect ? 'Membaca tahun dataset' : 'Mengupload dataset' }}</strong>
          <p>
            {{ pendingInspect
              ? 'Sistem sedang mencari tahun yang lengkap untuk semua kriteria.'
              : 'Sistem sedang menyimpan nilai per wilayah untuk tahun yang dipilih.' }}
          </p>
          <div class="progress-line" aria-hidden="true"></div>
        </div>

        <header class="modal-header">
          <div>
            <h2 id="upload-modal-title">Upload Dataset</h2>
            <p>Upload hanya menyimpan data. Proses TOPSIS dijalankan terpisah dari dashboard.</p>
          </div>
          <button class="btn subtle icon-btn" type="button" aria-label="Tutup modal" @click="close">
            x
          </button>
        </header>

        <div v-if="message" class="message section" :class="{ error: messageType === 'error' }">
          {{ message }}
        </div>

        <form class="modal-body form-grid" @submit.prevent="upload">
          <div class="field">
            <label for="modal-year">Tahun Data Valid</label>
            <select
              id="modal-year"
              v-model.number="selectedYear"
              :disabled="busy || validYears.length === 0"
              required
            >
              <option value="" disabled>Pilih tahun dari dataset</option>
              <option v-for="yearOption in validYears" :key="yearOption" :value="yearOption">
                {{ yearOption }}
              </option>
            </select>
          </div>

          <div class="field">
            <label>Status Upload</label>
            <div class="readonly-field">
              {{ statusText }}
            </div>
          </div>

          <div class="field full">
            <label for="modal-files">File CSV</label>
            <label class="file-drop" for="modal-files">
              <strong>{{ files.length ? `${files.length} file siap diupload` : 'Pilih file CSV' }}</strong>
              <span>Pilih beberapa CSV sekaligus: stunting, status gizi, kemiskinan, dan sanitasi.</span>
              <input
                id="modal-files"
                ref="fileInput"
                type="file"
                accept=".csv,text/csv"
                multiple
                required
                @change="onFilesChange"
              >
            </label>
          </div>

          <div class="field full">
            <ul class="criteria-checklist">
              <li :class="{ found: foundCodes.has('C1') }">Stunting</li>
              <li :class="{ found: foundCodes.has('C2') }">Wasting</li>
              <li :class="{ found: foundCodes.has('C3') }">Underweight</li>
              <li :class="{ found: foundCodes.has('C4') }">Kemiskinan</li>
              <li :class="{ found: foundCodes.has('C5') }">Sanitasi Layak</li>
            </ul>
          </div>

          <div v-if="files.length" class="field full">
            <div class="selected-files">
              <div v-for="file in files" :key="file.name">
                <span>{{ file.name }}</span>
                <strong>{{ number(file.size / 1024, 1) }} KB</strong>
              </div>
            </div>
          </div>

          <div v-if="result" class="field full">
            <div class="upload-result">
              <div>
                <strong>{{ result.imported ? 'Dataset berhasil diupload' : 'Dataset belum lengkap' }}</strong>
                <p>
                  {{ result.imported
                    ? `${result.alternatives} wilayah, ${result.foundCriteria?.length ?? 0} kriteria, dan ${result.scores ?? 0} nilai berhasil disimpan.`
                    : 'Periksa kembali file yang belum memuat semua kriteria.' }}
                </p>
              </div>
              <span class="badge" :class="{ benefit: result.imported, cost: !result.imported }">
                {{ result.imported ? 'Siap dihitung' : 'Belum siap' }}
              </span>
            </div>
          </div>

          <div v-if="result?.missingCriteria?.length" class="field full">
            <div class="message error">
              Kriteria belum ditemukan:
              {{ result.missingCriteria.map((item: any) => `${item.code} ${item.name}`).join(', ') }}
            </div>
          </div>

          <div class="field full">
            <div class="actions modal-actions">
              <button class="btn" type="button" :disabled="busy || files.length === 0" @click="inspect">
                <span v-if="pendingInspect" class="spinner" aria-hidden="true"></span>
                {{ pendingInspect ? 'Membaca...' : 'Baca Tahun Dataset' }}
              </button>
              <button class="btn primary" type="submit" :disabled="busy || files.length === 0 || !selectedYear">
                <span v-if="pending" class="spinner" aria-hidden="true"></span>
                {{ pending ? 'Mengupload...' : 'Upload Dataset' }}
              </button>
              <button class="btn" type="button" :disabled="busy" @click="reset">Reset</button>
              <button class="btn subtle" type="button" :disabled="busy" @click="close">Tutup</button>
            </div>
          </div>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  imported: [payload: any]
}>()

const { number } = useFormat()

const pending = ref(false)
const pendingInspect = ref(false)
const files = ref<File[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const message = ref('')
const messageType = ref<'info' | 'error'>('info')
const result = ref<any>(null)
const inspectResult = ref<any>(null)
const selectedYear = ref<number | ''>('')

const busy = computed(() => pending.value || pendingInspect.value)
const validYears = computed<number[]>(() => inspectResult.value?.validYears ?? [])
const foundCodes = computed(() => {
  const codes = new Set(result.value?.foundCriteria ?? [])
  for (const file of inspectResult.value?.detectedFiles ?? []) {
    if (file.detected.includes('stunting')) codes.add('C1')
    if (file.detected.includes('status_gizi')) {
      codes.add('C1')
      codes.add('C2')
      codes.add('C3')
    }
    if (file.detected.includes('kemiskinan')) codes.add('C4')
    if (file.detected.includes('sanitasi_layak')) codes.add('C5')
  }
  return codes
})
const statusText = computed(() => {
  if (!files.value.length) return 'Belum ada file'
  if (pendingInspect.value) return 'Membaca tahun dataset...'
  if (validYears.value.length) return `${validYears.value.length} tahun valid tersedia`
  if (inspectResult.value) return 'Tidak ada tahun lengkap'
  return `${files.value.length} file dipilih`
})

function onFilesChange(event: Event) {
  const target = event.target as HTMLInputElement
  files.value = Array.from(target.files ?? [])
  result.value = null
  inspectResult.value = null
  selectedYear.value = ''
  message.value = ''
}

function reset() {
  files.value = []
  result.value = null
  inspectResult.value = null
  selectedYear.value = ''
  message.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function close() {
  if (busy.value) return
  emit('close')
}

async function inspect() {
  pendingInspect.value = true
  message.value = ''
  result.value = null
  selectedYear.value = ''

  try {
    const formData = new FormData()
    for (const file of files.value) {
      formData.append('files', file)
    }

    inspectResult.value = await $fetch('/api/datasets/inspect', {
      method: 'POST',
      body: formData
    })

    if (validYears.value.length) {
      messageType.value = 'info'
      message.value = 'Tahun valid ditemukan. Pilih tahun data sebelum upload.'
    } else {
      messageType.value = 'error'
      message.value = 'Tidak ada tahun yang lengkap untuk semua kriteria di file yang dipilih.'
    }
  } catch (error: any) {
    messageType.value = 'error'
    message.value = error?.data?.message || error?.message || 'Gagal membaca tahun dataset.'
  } finally {
    pendingInspect.value = false
  }
}

async function upload() {
  pending.value = true
  message.value = ''
  result.value = null

  try {
    const formData = new FormData()
    formData.append('year', String(selectedYear.value))
    formData.append('process', 'false')
    for (const file of files.value) {
      formData.append('files', file)
    }

    result.value = await $fetch('/api/datasets/upload', {
      method: 'POST',
      body: formData
    })

    messageType.value = result.value.imported ? 'info' : 'error'
    message.value = result.value.imported
      ? 'Dataset berhasil diupload. Jalankan proses TOPSIS dari dashboard.'
      : 'Dataset berhasil dibaca, tetapi belum lengkap.'

    if (result.value.imported) {
      emit('imported', result.value)
    }
  } catch (error: any) {
    messageType.value = 'error'
    message.value = error?.data?.message || error?.message || 'Upload dataset gagal.'
  } finally {
    pending.value = false
  }
}
</script>
