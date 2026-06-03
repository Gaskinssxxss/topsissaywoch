<template>
  <table>
    <thead>
      <tr>
        <th>Kode</th>
        <th>Wilayah</th>
        <th v-for="criterion in criteria" :key="criterion.id" class="number">
          {{ criterion.code }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.alternativeId">
        <td>{{ row.alternativeCode }}</td>
        <td><strong>{{ row.alternativeName }}</strong></td>
        <td v-for="criterion in criteria" :key="criterion.id" class="number">
          {{ number(row.values[criterion.code], digits) }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
const { number } = useFormat()

defineProps<{
  criteria: Array<{ id: number, code: string }>
  rows: Array<{
    alternativeId: number
    alternativeCode: string
    alternativeName: string
    values: Record<string, number>
  }>
  digits?: number
}>()
</script>
