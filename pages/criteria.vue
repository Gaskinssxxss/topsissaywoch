<template>
  <section>
    <PageHeader
      title="Data Kriteria"
      description="Kelola kriteria, bobot, dan tipe benefit/cost yang digunakan dalam TOPSIS."
    />

    <div v-if="message" class="message section" :class="{ error: messageType === 'error' }">
      {{ message }}
    </div>

    <div v-if="pending" class="process-card section">
      <div class="spinner large" aria-hidden="true"></div>
      <div>
        <strong>Memperbarui data kriteria</strong>
        <p>Sistem sedang menyimpan bobot, tipe kriteria, dan menyegarkan daftar.</p>
        <div class="progress-line" aria-hidden="true"></div>
      </div>
    </div>

    <div class="stats-grid">
      <article class="stat">
        <span>Total Bobot</span>
        <strong>{{ number(totalWeight, 2) }}</strong>
      </article>
      <article class="stat">
        <span>Status Bobot</span>
        <strong>{{ Math.abs(totalWeight - 1) < 0.000001 ? 'Valid' : 'Cek' }}</strong>
      </article>
      <article class="stat">
        <span>Benefit</span>
        <strong>{{ benefitCount }}</strong>
      </article>
      <article class="stat">
        <span>Cost</span>
        <strong>{{ costCount }}</strong>
      </article>
    </div>

    <div class="grid-2">
      <section class="panel">
        <div class="panel-header">
          <h2>Daftar Kriteria</h2>
          <span class="badge">{{ criteria?.length ?? 0 }} kriteria</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama</th>
                <th class="number">Bobot</th>
                <th>Tipe</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in criteria" :key="item.id">
                <td>{{ item.code }}</td>
                <td><strong>{{ item.name }}</strong></td>
                <td class="number">{{ number(item.weight, 2) }}</td>
                <td><span class="badge" :class="item.type">{{ item.type }}</span></td>
                <td>
                  <div class="actions">
                    <button class="btn subtle" @click="edit(item)">Edit</button>
                    <button class="btn danger" @click="remove(item)">Hapus</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>{{ form.id ? 'Edit Kriteria' : 'Tambah Kriteria' }}</h2>
        </div>
        <form class="panel-body form-grid" @submit.prevent="save">
          <div class="field">
            <label for="code">Kode</label>
            <input id="code" v-model="form.code" placeholder="C1" required>
          </div>
          <div class="field">
            <label for="weight">Bobot</label>
            <input id="weight" v-model.number="form.weight" type="number" min="0" max="1" step="0.01" required>
          </div>
          <div class="field full">
            <label for="name">Nama Kriteria</label>
            <input id="name" v-model="form.name" placeholder="Prevalensi Stunting" required>
          </div>
          <div class="field full">
            <label for="type">Tipe</label>
            <select id="type" v-model="form.type">
              <option value="benefit">Benefit</option>
              <option value="cost">Cost</option>
            </select>
          </div>
          <div class="field full">
            <div class="actions">
              <button class="btn primary" type="submit" :disabled="pending">
                <span v-if="pending" class="spinner" aria-hidden="true"></span>
                {{ pending ? 'Menyimpan...' : (form.id ? 'Simpan Perubahan' : 'Tambah Kriteria') }}
              </button>
              <button class="btn" type="button" :disabled="pending" @click="resetForm">Reset</button>
            </div>
          </div>
        </form>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
type Criteria = {
  id: number
  code: string
  name: string
  weight: number
  type: 'benefit' | 'cost'
}

const { number } = useFormat()
const pending = ref(false)
const message = ref('')
const messageType = ref<'info' | 'error'>('info')
const form = reactive<Criteria>({
  id: 0,
  code: '',
  name: '',
  weight: 0,
  type: 'benefit'
})

const { data: criteria, refresh } = await useFetch<Criteria[]>('/api/criteria', {
  default: () => []
})

const totalWeight = computed(() => criteria.value.reduce((sum, item) => sum + Number(item.weight), 0))
const benefitCount = computed(() => criteria.value.filter((item) => item.type === 'benefit').length)
const costCount = computed(() => criteria.value.filter((item) => item.type === 'cost').length)

function edit(item: Criteria) {
  Object.assign(form, item)
}

function resetForm() {
  Object.assign(form, {
    id: 0,
    code: '',
    name: '',
    weight: 0,
    type: 'benefit'
  })
}

async function save() {
  pending.value = true
  message.value = ''
  try {
    const body = {
      code: form.code,
      name: form.name,
      weight: form.weight,
      type: form.type
    }

    if (form.id) {
      await $fetch(`/api/criteria/${form.id}`, { method: 'PUT', body })
      message.value = 'Kriteria berhasil diperbarui.'
    } else {
      await $fetch('/api/criteria', { method: 'POST', body })
      message.value = 'Kriteria berhasil ditambahkan.'
    }

    messageType.value = 'info'
    resetForm()
    await refresh()
  } catch (error: any) {
    messageType.value = 'error'
    message.value = error?.data?.message || error?.message || 'Gagal menyimpan kriteria.'
  } finally {
    pending.value = false
  }
}

async function remove(item: Criteria) {
  if (!confirm(`Hapus kriteria ${item.name}? Nilai dan hasil terkait juga akan terhapus.`)) return

  pending.value = true
  message.value = ''
  try {
    await $fetch(`/api/criteria/${item.id}`, { method: 'DELETE' })
    messageType.value = 'info'
    message.value = 'Kriteria berhasil dihapus.'
    await refresh()
  } catch (error: any) {
    messageType.value = 'error'
    message.value = error?.data?.message || error?.message || 'Gagal menghapus kriteria.'
  } finally {
    pending.value = false
  }
}
</script>
