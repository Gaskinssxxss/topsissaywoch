<template>
  <section>
    <PageHeader
      title="Data Alternatif"
      description="Kelola wilayah kabupaten/kota yang menjadi alternatif keputusan."
    />

    <div v-if="message" class="message section" :class="{ error: messageType === 'error' }">
      {{ message }}
    </div>

    <div v-if="pending" class="process-card section">
      <div class="spinner large" aria-hidden="true"></div>
      <div>
        <strong>Memperbarui data wilayah</strong>
        <p>Sistem sedang menyimpan perubahan alternatif dan menyegarkan daftar wilayah.</p>
        <div class="progress-line" aria-hidden="true"></div>
      </div>
    </div>

    <div class="grid-2">
      <section class="panel">
        <div class="panel-header">
          <h2>Daftar Wilayah</h2>
          <span class="badge">{{ alternatives?.length ?? 0 }} alternatif</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Wilayah</th>
                <th>Provinsi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in alternatives" :key="item.id">
                <td>{{ item.code }}</td>
                <td><strong>{{ item.name }}</strong></td>
                <td>{{ item.province }}</td>
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
          <h2>{{ form.id ? 'Edit Alternatif' : 'Tambah Alternatif' }}</h2>
        </div>
        <form class="panel-body form-grid" @submit.prevent="save">
          <div class="field">
            <label for="code">Kode</label>
            <input id="code" v-model="form.code" placeholder="5201" required>
          </div>
          <div class="field">
            <label for="province">Provinsi</label>
            <input id="province" v-model="form.province" required>
          </div>
          <div class="field full">
            <label for="name">Nama Wilayah</label>
            <input id="name" v-model="form.name" placeholder="Kabupaten Lombok Barat" required>
          </div>
          <div class="field full">
            <div class="actions">
              <button class="btn primary" type="submit" :disabled="pending">
                <span v-if="pending" class="spinner" aria-hidden="true"></span>
                {{ pending ? 'Menyimpan...' : (form.id ? 'Simpan Perubahan' : 'Tambah Alternatif') }}
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
type Alternative = {
  id: number
  code: string
  name: string
  province: string
}

const pending = ref(false)
const message = ref('')
const messageType = ref<'info' | 'error'>('info')
const form = reactive({
  id: 0,
  code: '',
  name: '',
  province: 'Nusa Tenggara Barat'
})

const { data: alternatives, refresh } = await useFetch<Alternative[]>('/api/alternatives', {
  default: () => []
})

function edit(item: Alternative) {
  form.id = item.id
  form.code = item.code
  form.name = item.name
  form.province = item.province
}

function resetForm() {
  form.id = 0
  form.code = ''
  form.name = ''
  form.province = 'Nusa Tenggara Barat'
}

async function save() {
  pending.value = true
  message.value = ''
  try {
    const body = {
      code: form.code,
      name: form.name,
      province: form.province
    }

    if (form.id) {
      await $fetch(`/api/alternatives/${form.id}`, { method: 'PUT', body })
      message.value = 'Alternatif berhasil diperbarui.'
    } else {
      await $fetch('/api/alternatives', { method: 'POST', body })
      message.value = 'Alternatif berhasil ditambahkan.'
    }

    messageType.value = 'info'
    resetForm()
    await refresh()
  } catch (error: any) {
    messageType.value = 'error'
    message.value = error?.data?.message || error?.message || 'Gagal menyimpan alternatif.'
  } finally {
    pending.value = false
  }
}

async function remove(item: Alternative) {
  if (!confirm(`Hapus ${item.name}? Nilai dan hasil terkait juga akan terhapus.`)) return

  pending.value = true
  message.value = ''
  try {
    await $fetch(`/api/alternatives/${item.id}`, { method: 'DELETE' })
    messageType.value = 'info'
    message.value = 'Alternatif berhasil dihapus.'
    await refresh()
  } catch (error: any) {
    messageType.value = 'error'
    message.value = error?.data?.message || error?.message || 'Gagal menghapus alternatif.'
  } finally {
    pending.value = false
  }
}
</script>
