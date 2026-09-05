'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { MODULES } from '@/packages/access/domain/navigation';
import { usePermission } from '@/packages/access/presentation';
import Icon from '@/shared/ui/icon';
import Logo from '@/shared/ui/logo';
import { PanelShell } from '@/shared/ui/shells';

const MODULE_ACCENTS = {
  emerald: 'bg-brand-soft text-brand',
  violet: 'bg-info-soft text-info',
  sky: 'bg-info-soft text-info',
  amber: 'bg-warn-soft text-warn',
  rose: 'bg-danger-soft text-danger',
};

const MODULE_ICONS = {
  'stock-management': 'layers',
  'user-management': 'key',
  'stocktake-ops': 'calendar',
  'stockwaste-ops': 'box',
  'receiving-ops': 'truck',
};

const APPS = [
  {
    name: 'Inventory Admin',
    icon: 'layers',
    accent: 'bg-brand-soft text-brand',
    summary:
      'Portal back office: memantau dan memvalidasi dokumen stock take, melihat dokumen waste, serta memegang seluruh konfigurasi yang mengendalikan tiga aplikasi lain.',
    pages: ['Stock Take', 'Waste', 'Stock Take Scheduler', 'Stock Waste App', 'Return Waste Products'],
    href: '/dashboard',
    hrefLabel: 'Buka dashboard',
  },
  {
    name: 'Stock Take',
    icon: 'calendar',
    accent: 'bg-info-soft text-info',
    summary:
      'Tiga wajah: Inventory Control menjadwalkan perhitungan per outlet, Technical Support mengelola akun crew, dan outlet crew menghitung stok fisik lewat layar mobile bersesi dua jam.',
    pages: ['Konfigurasi jadwal', 'Akun outlet crew', 'Form perhitungan (mobile)'],
    href: '/ops/stocktake/control',
    hrefLabel: 'Buka Stock Take Ops',
  },
  {
    name: 'Stock Waste',
    icon: 'trash',
    accent: 'bg-warn-soft text-warn',
    summary:
      'Aplikasi mobile outlet crew untuk mencatat produk terbuang: pilih kategori, isi produk beserta foto bukti, lalu kirim sekali untuk seluruh kategori.',
    pages: ['Pilih kategori', 'Isi produk per kategori', 'Unggah bukti foto'],
    href: '/ops/stockwaste/crew',
    hrefLabel: 'Buka Form Waste',
  },
  {
    name: 'Receiving',
    icon: 'truck',
    accent: 'bg-danger-soft text-danger',
    summary:
      'Dua wajah: back office memantau surat jalan beserta statusnya, dan outlet crew menerima atau membatalkan DO dengan bukti foto sebelum batas pukul 22:30.',
    pages: ['Daftar Delivery Order', 'Detail dan validasi', 'Penerimaan (mobile)'],
    href: '/ops/receiving/desk',
    hrefLabel: 'Buka Receiving Ops',
  },
];

const LAYERS = [
  { name: 'domain', note: 'entity dan aturan bisnis murni — tanpa React, Redux, atau jaringan' },
  { name: 'port', note: 'kontrak: repository (driven) dan usecase (driving)' },
  { name: 'usecase', note: 'orkestrasi; menerima repository lewat konstruktor' },
  { name: 'repository', note: 'adapter data; saat ini in-memory dengan seed' },
  { name: 'presentation', note: 'hook dan komponen' },
];

const PANEL_STEPS = [
  {
    title: 'Pilih persona',
    body: 'Lima persona siap pakai: Admin Penuh, Validator Restricted, Staff Konfigurasi, Viewer Saja, dan Outlet Crew. Memilih salah satunya mengganti seluruh daftar izin sekaligus.',
  },
  {
    title: 'Nyalakan atau matikan izin satu per satu',
    body: 'Setiap izin punya kotak centang sendiri. Matikan izin lihat mana pun, lalu perhatikan menu sidebar dan kartu dashboard ikut hilang tanpa memuat ulang halaman.',
  },
  {
    title: 'Atur atribut Restricted',
    body: 'Izin validasi stock take punya atribut tambahan Restricted / Not Restricted. Mode Restricted membuat tombol edit dan validasi hilang setelah pukul 12:00.',
  },
  {
    title: 'Simulasikan waktu',
    body: 'Sakelar "lewat pukul 12:00" menguji aturan Restricted, dan pemilih jendela waste memaksa form waste terbuka atau tertutup di luar jam 13:00–23:00.',
  },
  {
    title: 'Simulasikan koneksi putus',
    body: 'Sakelar koneksi memunculkan pita merah di layar outlet crew dan dialog di portal back office; mematikannya lagi memunculkan pita hijau pemulihan.',
  },
];

export default function HomePage() {
  const { filterModules, moduleEntry, profile, permissions } = usePermission();
  const modules = useMemo(() => filterModules(MODULES), [filterModules]);

  return (
    <PanelShell>
      <div className="mx-auto max-w-5xl">
        <section className="max-w-3xl">
          <Logo className="mb-6 h-9 w-auto" />

          <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
            <Icon name="sparkles" className="size-3.5" />
            Project portofolio · seluruh datanya fiktif
          </span>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-strong lg:text-4xl">
            Empat aplikasi inventori, satu basis kode
          </h1>

          <p className="mt-4 text-base leading-relaxed text-body">
            amb membangun ulang sebuah sistem inventori multi-aplikasi dari spesifikasi
            fungsionalnya: satu portal back office dan tiga aplikasi lapangan yang dipakai outlet
            crew. Keempatnya berdiri di atas arsitektur hexagonal dengan lapisan data yang bisa
            ditukar, dan hak aksesnya dihitung per-izin, bukan per-peran.
          </p>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Demo ini berjalan sepenuhnya di peramban memakai adapter in-memory. Nama brand, outlet,
            produk, pemasok, dan pengguna di dalamnya dibuat khusus untuk peragaan.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-strong">
            Halo {profile?.name?.split(' ')[0] ?? 'Pengguna'}, pilih modul yang ingin dibuka
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Kombinasi izinmu saat ini membuka {modules.length} dari {MODULES.length} modul, dari
            total {permissions.length} izin aktif. Ubah kombinasinya lewat panel demo di pojok kanan
            bawah.
          </p>

          {modules.length ? (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((module) => (
                <li key={module.id}>
                  <Link
                    href={moduleEntry(module)}
                    className="group flex h-full flex-col rounded-2xl border border-line bg-panel p-5 transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
                  >
                    <span
                      className={`grid size-11 place-items-center rounded-xl ${MODULE_ACCENTS[module.accent] ?? MODULE_ACCENTS.emerald}`}
                    >
                      <Icon name={MODULE_ICONS[module.id] ?? 'box'} className="size-5" />
                    </span>
                    <span className="mt-4 block text-base font-semibold text-strong">
                      {module.name}
                    </span>
                    <span className="mt-1.5 block flex-1 text-sm text-muted-foreground">
                      {module.description}
                    </span>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                      Buka modul
                      <Icon
                        name="chevronRight"
                        className="size-3.5 transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-line bg-panel px-6 py-16 text-center">
              <p className="text-sm font-semibold text-strong">Belum ada modul yang bisa dibuka</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Kombinasi izin saat ini tidak membuka satu modul pun. Nyalakan setidaknya satu izin
                lihat lewat panel demo.
              </p>
            </div>
          )}
        </section>

        <section className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight text-strong">Aplikasinya</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Di sistem aslinya keempatnya berdiri sendiri. Di sini semuanya jadi route group dalam
            satu aplikasi Next.js, tapi tetap dipisah shell dan hak aksesnya.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {APPS.map((app) => (
              <div
                key={app.name}
                className="flex flex-col rounded-2xl border border-line bg-panel p-5"
              >
                <span className={`grid size-11 place-items-center rounded-xl ${app.accent}`}>
                  <Icon name={app.icon} className="size-5" />
                </span>

                <h3 className="mt-4 text-base font-semibold text-strong">{app.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-body">{app.summary}</p>

                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {app.pages.map((page) => (
                    <li
                      key={page}
                      className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                    >
                      {page}
                    </li>
                  ))}
                </ul>

                <Link
                  href={app.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand"
                >
                  {app.hrefLabel}
                  <Icon name="chevronRight" className="size-3.5" />
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-4 rounded-xl bg-panel-soft px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            Keempatnya benar-benar terhubung lewat data, bukan lewat tautan: jadwal yang didaftarkan
            Inventory Control menentukan apa yang dihitung crew; hasil hitung crew muncul di daftar
            back office untuk divalidasi; konfigurasi produk per kategori dan batas kuantitas
            menentukan apa yang bisa diisi di form waste; dokumen waste mengurangi stok outlet; dan
            DO yang dikonfirmasi diterima menambahnya kembali.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight text-strong">Arsitektur hexagonal</h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Tiap konteks bisnis — <code className="text-body">access</code>,{' '}
            <code className="text-body">catalog</code>, dan{' '}
            <code className="text-body">documents</code> — berdiri sebagai paket sendiri dengan lima
            lapisan yang tidak boleh saling melompat.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-line bg-panel p-5">
              <p className="font-mono text-xs text-muted-foreground">
                src/packages/&lt;konteks&gt;/
              </p>
              <ul className="mt-3 space-y-2.5">
                {LAYERS.map((layer) => (
                  <li key={layer.name} className="flex gap-3">
                    <span className="w-28 shrink-0 font-mono text-xs text-brand">{layer.name}</span>
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      {layer.note}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-panel p-5">
                <h3 className="text-sm font-semibold text-strong">Arahnya satu arah</h3>
                <p className="mt-2 font-mono text-xs text-brand">
                  presentation → usecase → port ← repository
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Domain tidak mengimpor apa pun dari luar dirinya, sehingga aturan bisnisnya bisa
                  diuji tanpa React maupun jaringan.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-panel p-5">
                <h3 className="text-sm font-semibold text-strong">Satu titik tukar adapter</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Semua kabel bertemu di{' '}
                  <code className="text-body">src/shared/config/di.js</code>. Mengganti adapter
                  in-memory dengan adapter REST cukup mengubah tiga baris di sana — domain, use
                  case, dan seluruh komponen tidak perlu disentuh karena hanya mengenal kontrak
                  port.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-panel p-5">
                <h3 className="text-sm font-semibold text-strong">Aturan bisnis punya pemeriksa</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  <code className="text-body">npm run check</code> menjalankan pemeriksaan tanpa
                  framework terhadap lapisan domain dan seed: rumus selisih, ambang toleransi, batas
                  kuantitas, jendela waktu, dan pergerakan stok.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight text-strong">Hak akses per-izin</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Bukan peran, tapi daftar izin',
                body: 'Pengguna tidak memegang satu label peran. Yang disimpan adalah daftar izin, dan kombinasi apa pun sah — termasuk kombinasi yang tidak punya nama.',
              },
              {
                title: 'Izin bisa punya atribut',
                body: 'Izin validasi stock take membawa atribut Restricted. Pemiliknya hanya boleh menyunting dan memvalidasi sampai pukul 12:00; setelah itu tombolnya hilang dan penolakannya juga ditegakkan di lapisan use case.',
              },
              {
                title: 'Menu ikut disaring',
                body: 'Sidebar, kartu modul di Panel Admin, kolom aksi pada tabel, sampai route-nya sendiri semuanya membaca daftar izin yang sama. Tanpa izin lihat, halamannya tidak bisa dibuka lewat alamat langsung.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-line bg-panel p-5">
                <h3 className="text-sm font-semibold text-strong">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight text-strong">
            Cara memakai demo control panel
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Tombol <span className="font-medium text-body">Panel Demo</span> melayang di pojok kanan
            bawah setiap halaman. Panel itu alat peraga portofolio: di sistem produksi daftar izin
            datang dari sesi login dan tidak bisa diubah dari sisi klien.
          </p>

          <ol className="mt-6 space-y-3">
            {PANEL_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4 rounded-2xl border border-line bg-panel p-5">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-strong">{step.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {step.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 rounded-2xl border border-line bg-panel p-6">
          <h2 className="text-base font-semibold text-strong">Mulai dari mana</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-body">
            Pemilih modul di atas adalah pintu masuknya: modul yang terbuka menyesuaikan izin yang
            sedang aktif. Kalau ingin langsung melihat keterhubungan antar aplikasi, isi form waste
            di layar outlet crew lalu buka daftar Waste di Inventory Admin.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {APPS.map((app) => (
              <Link
                key={app.name}
                href={app.href}
                className="inline-flex h-10 items-center rounded-lg border border-line px-4 text-sm font-medium text-body transition-colors hover:border-line-strong hover:text-strong"
              >
                {app.name}
              </Link>
            ))}
          </div>
        </section>
        <footer className="mt-14 border-t border-line pt-6">
          <p className="text-xs text-muted-foreground">
            Next.js App Router · JavaScript · Tailwind CSS · Redux Toolkit · shadcn/ui — seluruh
            nama brand, outlet, produk, pemasok, dan pengguna di dalam demo ini fiktif.
          </p>
        </footer>
      </div>
    </PanelShell>
  );
}
