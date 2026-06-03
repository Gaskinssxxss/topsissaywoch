# SPK TOPSIS Stunting

Aplikasi Sistem Pendukung Keputusan untuk menentukan prioritas wilayah penanganan stunting menggunakan metode TOPSIS. Aplikasi dibuat dengan Nuxt full stack, SQLite, dan upload dataset CSV adaptif.

## Fitur Utama

- Upload beberapa file CSV dataset kesehatan/kemiskinan/sanitasi.
- Sistem membaca tahun valid dari dataset sebelum import.
- User wajib memilih tahun yang lengkap untuk semua kriteria.
- Import dataset tanpa langsung memproses TOPSIS.
- Proses TOPSIS dijalankan manual dari Dashboard.
- Menampilkan ranking prioritas wilayah.
- Menampilkan detail perhitungan TOPSIS: matriks keputusan, normalisasi, terbobot, solusi ideal, jarak, dan preferensi.
- Hapus seluruh data untuk testing ulang.

## Teknologi

- Nuxt 4
- Vue 3
- Nitro server API
- SQLite
- better-sqlite3

## Prasyarat

Gunakan Node.js versi 22. Disarankan memakai versi yang sama dengan development:

```bash
node --version
```

Versi yang dipakai saat development:

```text
v22.22.0
```

Jika memakai `nvm`:

```bash
nvm install 22.22.0
nvm use 22.22.0
```

## Instalasi

Clone atau salin project ini, lalu masuk ke folder project:

```bash
cd stuntingproj
```

Install dependency:

```bash
npm install
```

## Menjalankan Aplikasi

Jalankan development server:

```bash
npm run dev
```

Buka di browser:

```text
http://localhost:3000
```

## Build Production

Untuk memastikan project bisa dibuild:

```bash
npm run build
```

Preview hasil build:

```bash
npm run preview
```

## Database

Aplikasi memakai SQLite di:

```text
data/spk_stunting.sqlite
```

Schema database ada di:

```text
database/schema.sql
```

Saat aplikasi berjalan, schema akan dibuat otomatis jika belum ada.

Jika ingin mulai dari database kosong, bisa hapus file SQLite:

```bash
rm -f data/spk_stunting.sqlite
```

Atau gunakan tombol **Hapus Data** di Dashboard untuk mengosongkan data lewat UI.

## Alur Penggunaan

1. Buka Dashboard.
2. Klik **Upload Dataset**.
3. Pilih beberapa file CSV.
4. Klik **Baca Tahun Dataset**.
5. Pilih tahun valid dari dropdown.
6. Klik **Upload Dataset**.
7. Klik **Proses TOPSIS** di Dashboard.
8. Buka halaman **Hasil Ranking** untuk melihat prioritas wilayah.

## Syarat Dataset CSV

Dataset harus memiliki kolom `Tahun` dan data untuk kriteria berikut:

- Stunting
- Wasting
- Underweight
- Kemiskinan
- Sanitasi Layak

Tahun hanya bisa dipilih jika semua kriteria tersedia lengkap pada tahun tersebut. Jika tahun tertentu tidak muncul di dropdown, berarti file yang diupload belum lengkap untuk tahun itu.

## Struktur Folder Penting

```text
assets/css/main.css              Styling global UI
components/UploadDatasetModal.vue Modal upload dataset adaptif
database/schema.sql              Schema SQLite
pages/index.vue                  Dashboard utama
pages/results.vue                Hasil ranking TOPSIS
pages/topsis.vue                 Detail perhitungan TOPSIS
server/api                       API backend Nuxt/Nitro
server/services/adaptiveDataset.ts Logic baca dan import dataset
server/services/topsis.ts        Logic metode TOPSIS
server/utils/db.ts               Koneksi SQLite
```

## Troubleshooting

Jika dependency bermasalah:

```bash
rm -rf node_modules
npm install
```

Jika build error karena versi Node:

```bash
nvm use 22.22.0
npm install
npm run build
```

Jika tahun dataset tidak muncul:

- Pastikan semua file CSV sudah dipilih.
- Pastikan semua file punya kolom `Tahun`.
- Pastikan tahun tersebut tersedia di semua data kriteria yang dibutuhkan.
- Klik ulang **Baca Tahun Dataset** setelah mengganti file.

Jika hasil ranking kosong:

- Pastikan dataset sudah berhasil diupload.
- Pastikan tahun aktif sudah benar.
- Klik **Proses TOPSIS** dari Dashboard.
