// ─── AlbumCerita — Bahasa Indonesia Locale ───────────────────────────────────
// Suara: Hangat · Personal · Tenang · Penuh semangat · Manusiawi
// Aturan: Lokalisasi bukan terjemahan harfiah — terasa alami dalam Bahasa Indonesia.

import type { Translations } from './en';

const id: Translations = {
  // ─── Brand ──────────────────────────────────────────────────────────────────
  brand: {
    name: 'AlbumCerita',
    tagline: 'by Cerita Raya',
    openingCamera: 'Membuka Kamera...',
    loadingAlbum: 'Memuat Albummu...',
    preparingDownload: 'Menyiapkan Unduhan...',
    loadingGallery: 'Memuat Galeri...',
    sharingMoments: 'Membagikan Momenmu...',
    publishingAlbum: 'Menerbitkan Album...',
  },

  // ─── Guest Auth ──────────────────────────────────────────────────────────────
  guestAuth: {
    roleLabel: 'Tamu',
    pinTitle: (eventName: string) => eventName,
    pinSubtitle: (hostName: string) =>
      `Kamu diundang oleh ${hostName} untuk ikut mengabadikan momen terbaik dari acara ini.\n\nMasukkan PIN untuk bergabung.`,
    nameTitle: 'Siapa namamu?',
    namePlaceholder: 'Namamu',
    pinPlaceholder: '••••••',
    pinLabel: 'PIN Acara',
    nameLabel: 'Namamu',
    submitPin: 'Gabung ke Acara',
    submitName: 'Mulai Mengabadikan',
    pending: 'Sebentar ya...',
  },

  // ─── Host Auth ──────────────────────────────────────────────────────────────
  hostAuth: {
    roleLabel: 'Host',
    title: (hostName: string) => `Selamat datang,\n${hostName}!`,
    subtitle: 'Masukkan PIN Host untuk mengelola album.',
    pinLabel: 'PIN Host',
    pinPlaceholder: '••••••',
    submit: 'Buka Albumku',
    pending: 'Sebentar ya...',
  },

  // ─── Guest Welcome Modal ─────────────────────────────────────────────────────
  guestWelcome: {
    greeting: (name: string) => `Hai, ${name}`,
    invited: (eventName: string) =>
      `Kamu diundang sebagai Moment Taker di **${eventName}**.`,
    role: `Foto-fotomu akan membantu menceritakan hari istimewa ini dari sudut pandangmu sendiri. Abadikan momennya, bagikan perspektifmu, dan bantu ciptakan kenangan yang tak terlupakan.`,
    review: (hostName: string) =>
      `Sebelum membagikan, cek dulu foto-fotomu dan pilih yang terbaik. **${hostName}** akan mengkurasi semuanya sebelum album dipublikasikan.`,
    encouragement: `Berikan yang terbaik dari dirimu.`,
    cta: 'Mulai Mengabadikan',
  },

  // ─── Host Welcome Modal ──────────────────────────────────────────────────────
  hostWelcome: {
    greeting: (name: string) => `Selamat datang, ${name}`,
    description: `Di sinilah kenangan dari semua tamumu berkumpul. Kurasi, sembunyikan, dan bagikan momen-momen yang paling berkesan.`,
    cta: 'Buka Albumku',
  },

  // ─── Upload Form ─────────────────────────────────────────────────────────────
  upload: {
    capturedMomentsTitle: 'Momen Terabadikan',
    readyToShare: (n: number) => `${n} siap dibagikan`,
    shareBtn: (n: number) => `Bagikan ${n} Momen`,
    shareBtnActive: 'Membagikan Momenmu...',
    quotaReached: (added: number, skipped: number) =>
      `${added} foto ditambahkan — ${skipped} dilewati. Kamu sudah mencapai batas.`,
    successSingle: 'Momenmu siap untuk dilihat. ✨',
    successMultiple: (n: number) => `${n} momen dibagikan — luar biasa. ✨`,
    partialFail: (ok: number, fail: number) =>
      `${ok} berhasil, ${fail} tidak berhasil. Ketuk untuk mencoba ulang.`,
    allFailed: 'Ada yang terlewat. Coba lagi, ya.',
    uploadError: 'Ada yang terlewat. Coba lagi, ya.',
    allUploaded: 'Semua momenmu sudah berhasil dibagikan.',
    quotaFull: 'Kamu sudah mengabadikan semua frame untuk acara ini.',
    statusFailed: 'Coba Lagi',
  },

  // ─── Album View ───────────────────────────────────────────────────────────────
  albumView: {
    stats: {
      momentTakers: 'Tamu',
      moments: 'Momen',
      shotsLeft: 'Sisa Frame',
      hidden: 'Disembunyikan',
    },
    published: 'Dipublikasikan',
    publicAlbum: 'Album Publik',
    copyLink: 'Salin Tautan Publik',
    linkCopied: 'Tersalin!',
    unpublish: 'Batalkan Publikasi',
    saving: 'Menyimpan...',
    shareGuestLink: 'Bagikan ke Tamu',
    publishAlbum: 'Terbitkan Album',
    downloadAlbum: 'Unduh Album',
    preparingDownload: 'Menyiapkan Unduhan...',
    capturedMoments: 'Momen Terabadikan',
    yourMoments: 'Momenmu',
    sortLatest: 'Terbaru',
    sortContributor: 'Per Kontributor',
    select: 'Pilih',
    cancelSelect: 'Selesai',
    hide: 'Sembunyikan',
    unhide: 'Tampilkan',
    emptyTitle: 'Ceritamu dimulai di sini.',
    emptyGuest: 'Belum ada momen — jadilah yang pertama mengabadikannya.',
    emptyHost: 'Bagikan Guest Link-mu dan momen akan mulai berdatangan.',
    takenBy: (name: string) => `oleh ${name}`,
    footer: 'Setiap foto yang kamu bagikan menjadi bagian dari cerita indah ini.',
    moment: (n: number) => `${n} Momen`,
    download: 'Unduh',
    preparingContributorDownload: 'Menyiapkan...',
    roleHost: 'Host',
    roleGuest: 'Tamu',
  },

  // ─── Film Roll ───────────────────────────────────────────────────────────────
  filmRoll: {
    title: 'Rol Film',
    framesRemaining: (n: number) => `${n} Frame Tersisa`,
    lastFrame: 'Frame Terakhir!',
    rollFull: 'Rol filmmu penuh — waktunya dibagikan.',
    momentCaptured: '✓ Momen Terabadikan',
    viewFilmRoll: 'Cuci Rol Film',
    reviewTitle: 'Rol Kamu',
    reviewSubtitle: (n: number) => `${n} frame terabadikan`,
    shareRoll: 'Bagikan Rol Kamu',
    sharingRoll: 'Membagikan Rol Film...',
    retakeFrame: (n: number) => `Foto Ulang Frame ${n}`,
    rollShared: 'Rol filmmu telah dibagikan — luar biasa. ✨',
    noFrames: 'Belum ada frame yang terabadikan.',
    rollFullSubtitle: 'Kamu sudah menggunakan semua frame. Siap dibagikan?',
    takePhoto: 'Abadikan Frame',
    fromGallery: 'Dari Galeri',
  },

  // ─── Film Processing ────────────────────────────────────────────────────────
  filmProcessing: {
    developMyFilm: 'Cuci Rol Film',
    preparing: 'Mempersiapkan Rol Film...',
    developing: 'Memproses Negatif Film...',
    applying: 'Menerapkan Resep Film...',
    finalizing: 'Sedang Diselesaikan...',
    ready: 'Rol Filmmu Siap ✨',
  },

  // ─── Publish Modal ──────────────────────────────────────────────────────────
  publishModal: {
    title: 'Siap Dibagikan?',
    body: `Hanya momen yang terlihat yang akan tampil di album publik.\n\nSiapa saja yang punya tautan bisa melihat kenangan ini — tanpa PIN.`,
    cancel: 'Belum Sekarang',
    confirm: 'Terbitkan Album',
    publishing: 'Menerbitkan Albummu...',
    successTitle: 'Album Sudah Tayang',
    successBody: 'Kenanganmu kini bisa dinikmati semua orang. ✨',
  },

  // ─── Delete Photo Modal ──────────────────────────────────────────────────────
  deleteModal: {
    title: 'Hapus Momen Ini?',
    body: 'Momen ini akan hilang selamanya.',
    cancel: 'Simpan',
    confirm: 'Hapus',
    removing: 'Menghapus...',
  },

  // ─── Moderation Bar ─────────────────────────────────────────────────────────
  modBar: {
    selected: (n: number) => `${n} dipilih`,
    hide: 'Sembunyikan',
    show: 'Tampilkan',
  },

  // ─── Lightbox ────────────────────────────────────────────────────────────────
  lightbox: {
    takenBy: (name: string) => `Diabadikan oleh ${name}`,
    download: 'Unduh Foto',
    close: 'Tutup',
    prev: 'Sebelumnya',
    next: 'Berikutnya',
  },

  // ─── Gallery (Event Page) ────────────────────────────────────────────────────
  gallery: {
    title: 'Momen Terabadikan',
    shown: (n: number) => `${n} ditampilkan`,
    totalPhotos: 'Total Momen',
    momentTakers: 'Tamu',
    emptyTitle: 'Panggung sudah siap.',
    emptyBody: 'Momen akan muncul di sini saat tamu mulai mengabadikannya.',
  },

  // ─── Admin — Events List ─────────────────────────────────────────────────────
  adminEvents: {
    title: 'Acara',
    subtitle: 'Semua acara yang dikelola melalui AlbumCerita.',
    newEvent: '+ Acara Baru',
    emptyTitle: 'Belum ada acara.',
    emptyBody: 'Acara yang kamu buat akan muncul di sini.',
    colName: 'Nama Acara',
    colId: 'ID Acara',
    colState: 'Status',
    colCreated: 'Dibuat',
    colActions: 'Aksi',
    view: 'Lihat',
    delete: 'Hapus',
    total: (n: number) => `${n} acara`,
    errorPrefix: 'Error:',
  },

  // ─── Admin — Delete Event Modal ──────────────────────────────────────────────
  adminDeleteEvent: {
    title: 'Hapus Acara Ini?',
    body: 'Tindakan ini permanen dan tidak bisa dibatalkan.',
    willRemove: 'Ini akan menghapus secara permanen:',
    items: ['Detail acara', 'Sesi tamu', 'Foto-foto', 'Kontributor', 'Akses Host & Tamu'],
    cancel: 'Batalkan',
    confirm: 'Hapus Acara',
    removing: 'Menghapus Acara...',
    errorAlert: 'Gagal menghapus acara. Silakan coba lagi.',
  },

  // ─── Admin — Event Detail ──────────────────────────────────────────────────
  adminEventDetail: {
    eventsBreadcrumb: 'Acara',
    guestAccess: 'Akses Tamu',
    hostAccess: 'Akses Host',
    albumStatus: 'Status Album',
    statusPublished: 'Dipublikasikan',
    statusDraft: 'Draf',
    publicLink: 'Tautan Album Publik',
    publicHelper: 'Album saat ini dapat dilihat oleh publik. Hanya Host yang dapat mempublikasikan atau membatalkan publikasi album.',
    draftHelper: 'Album ini hanya dapat dilihat oleh Host dan Tamu yang memiliki PIN. Host dapat mempublikasikannya dari dasbor mereka.',
    eventConfig: 'Konfigurasi Acara',
    sysInfo: 'Informasi Sistem',
    legacyEventId: 'ID Acara (Legacy)',
    state: 'Status',
    created: 'Dibuat',
  },

  // ─── Admin — Access Card ────────────────────────────────────────────────────
  adminAccessCard: {
    link: 'Tautan',
    pin: 'PIN',
    copyLink: 'Salin Tautan',
    copyPin: 'Salin PIN',
    hidden: '•••••• (Tersembunyi)',
    pinHiddenDesc: 'PIN hanya ditampilkan sekali saat dibuat atau diatur ulang.',
    downloadQr: 'Unduh QR',
  },

  // ─── Admin — Reset PIN ───────────────────────────────────────────────────────
  adminResetPin: {
    legacy: 'Atur Ulang PIN',
    host: 'Atur Ulang PIN Host',
    guest: 'Atur Ulang PIN Tamu',
    title: (target: string) => `${target}?`,
    desc1: 'PIN saat ini tidak akan berfungsi lagi.',
    desc2: 'Sesi yang ada dan foto yang diunggah tidak akan terpengaruh.',
    desc3: (target: string) => `${target === 'host' ? 'Host' : target === 'guest' ? 'Tamu' : 'Kontributor'} baru harus menggunakan PIN yang baru.`,
    cancel: 'Batal',
    confirm: 'Konfirmasi',
  },

  // ─── Admin — Edit Event Form ─────────────────────────────────────────────────
  adminEditEvent: {
    coverImage: 'Sampul Acara',
    replace: 'Ganti',
    remove: 'Hapus',
    uploadCover: 'Unggah Sampul Acara',
    eventName: 'Nama Acara *',
    hostName: 'Nama Host',
    optional: '(opsional)',
    theme: 'Tema',
    retention: 'Masa Aktif',
    maxContributors: 'Maks. Kontributor',
    photosPerGuest: 'Foto Per Tamu',
    saveChanges: 'Simpan Perubahan',
    saving: 'Menyimpan…',
    saved: 'Perubahan berhasil disimpan.',
    unlimited: 'Tak Terbatas',
    months: (n: number) => `${n} bulan`,
    photos: (n: number) => `${n} foto`,
  },

  // ─── Admin — New Event Form ──────────────────────────────────────────────────
  adminNewEvent: {
    title: 'Buat Acara',
    subtitle: 'Isi detail di bawah ini. Slug yang mudah dibaca, ID Acara, dan PIN akan dibuat secara otomatis.',
    eventDetails: 'Detail Acara',
    error: 'Kesalahan:',
    eventName: 'Nama Acara',
    eventNamePlaceholder: 'mis. Pernikahan Budi & Ani',
    eventDate: 'Tanggal Acara',
    eventDateHelper: 'Digunakan untuk membuat slug acara, mis.',
    hostName: 'Nama Host (Opsional)',
    hostNamePlaceholder: 'mis. Budi & Ani',
    eventType: 'Jenis Acara',
    types: {
      wedding: 'Pernikahan',
      birthday: 'Ulang Tahun',
      corporate: 'Perusahaan',
      other: 'Lainnya',
    },
    theme: 'Tema (Opsional)',
    retention: 'Masa Aktif',
    maxContributors: 'Maks. Kontributor',
    photosPerGuest: 'Foto Per Tamu',
    cancel: 'Batal',
    createBtn: 'Buat Acara',
    creatingBtn: 'Membuat acara…',
  },

  // ─── Admin — PIN Banner ──────────────────────────────────────────────────────
  adminPinBanner: {
    copied: 'Tersalin',
    copy: 'Salin',
    resetSuccess: 'PIN Berhasil Diatur Ulang',
    createSuccess: 'Acara Berhasil Dibuat',
    saveNote: 'Simpan ID Acara dan PIN di bawah ini.\nKamu tidak akan bisa melihat PIN ini lagi.',
    eventId: 'ID Acara',
    pin: 'PIN',
    shareNote: 'Bagikan ID Acara dan PIN kepada klien dengan aman.\nJangan menyimpan atau membagikan PIN secara publik.',
    confirmBtn: 'Saya Telah Menyimpan Informasi Ini',
  },

  // ─── Language Switcher ───────────────────────────────────────────────────────
  langSwitcher: {
    label: 'Ganti bahasa',
  },

  // ─── Splash Screen ──────────────────────────────────────────────────────────
  splash: {
    tagline: 'Setiap momen, tersimpan indah.',
  },
};

export default id;
