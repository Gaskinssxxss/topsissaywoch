<template>
  <div class="app-shell">
    <aside class="sidebar">
      <NuxtLink class="brand" to="/">
        <span class="brand-mark">SPK</span>
        <span>
          <strong>TOPSIS Stunting</strong>
          <small>Dataset Adaptif</small>
        </span>
      </NuxtLink>

      <nav class="nav-list" aria-label="Navigasi utama">
        <NuxtLink to="/" exact-active-class="active">Dashboard</NuxtLink>
        <NuxtLink to="/results" active-class="active">Hasil Ranking</NuxtLink>
        <NuxtLink to="/topsis" active-class="active">Detail TOPSIS</NuxtLink>
        <NuxtLink to="/scores" active-class="active">Nilai Data</NuxtLink>
        <NuxtLink to="/criteria" active-class="active">Kriteria</NuxtLink>
        <NuxtLink to="/alternatives" active-class="active">Wilayah</NuxtLink>
      </nav>
    </aside>

    <main class="main-panel">
      <NuxtPage />
    </main>
  </div>
</template>
