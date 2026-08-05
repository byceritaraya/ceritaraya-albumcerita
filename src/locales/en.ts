// ─── AlbumCerita — English Locale ────────────────────────────────────────────
// Voice: Warm · Personal · Calm · Celebratory · Human
// Rule: Localization over literal translation — feel natural in English.

const en = {
  // ─── Brand ──────────────────────────────────────────────────────────────────
  brand: {
    name: 'AlbumCerita',
    tagline: 'by Cerita Raya',
    openingCamera: 'Opening Camera...',
    loadingAlbum: 'Loading Your Album...',
    preparingDownload: 'Preparing Download...',
    loadingGallery: 'Loading Gallery...',
    sharingMoments: 'Sharing Your Moments...',
    publishingAlbum: 'Publishing Album...',
  },

  // ─── Guest Auth ──────────────────────────────────────────────────────────────
  guestAuth: {
    roleLabel: 'Guest',
    pinTitle: (eventName: string) => eventName,
    pinSubtitle: (hostName: string) =>
      `You've been invited by ${hostName} to help capture this event's most beautiful moments.\n\nEnter the Event PIN to join.`,
    nameTitle: "What's your name?",
    namePlaceholder: 'Your name',
    pinPlaceholder: '••••••',
    pinLabel: 'Event PIN',
    nameLabel: 'Your Name',
    submitPin: 'Join the Celebration',
    submitName: 'Start Capturing',
    pending: 'Just a moment...',
  },

  // ─── Host Auth ──────────────────────────────────────────────────────────────
  hostAuth: {
    roleLabel: 'Host',
    title: (hostName: string) => `Welcome back,\n${hostName}!`,
    subtitle: 'Enter your Host PIN to manage the album.',
    pinLabel: 'Host PIN',
    pinPlaceholder: '••••••',
    submit: 'Open My Album',
    pending: 'Just a moment...',
  },

  // ─── Guest Welcome Modal ─────────────────────────────────────────────────────
  guestWelcome: {
    greeting: (name: string) => `Hi, ${name}`,
    invited: (eventName: string) =>
      `You've been invited as a Moment Taker at **${eventName}**.`,
    role: `Your photos will help tell the story of this day from your own perspective. Capture the moments, share your point of view, and help create memories everyone will treasure.`,
    review: (hostName: string) =>
      `Before sharing, give your photos a quick look and keep only the ones you'd be proud of. **${hostName}** will curate everything before the album goes live.`,
    encouragement: `Give it your best shot.`,
    cta: 'Start Capturing',
  },

  // ─── Host Welcome Modal ──────────────────────────────────────────────────────
  hostWelcome: {
    greeting: (hostName: string) => `Welcome, ${hostName}.`,
    description: `This is where your guests' memories come together. Review, curate, and share the moments that tell your story best.`,
    cta: 'Open My Album',
  },



  // ─── Upload Form ─────────────────────────────────────────────────────────────
  upload: {
    capturedMomentsTitle: 'Captured Moments',
    readyToShare: (n: number) => `${n} ready to share`,
    shareBtn: (n: number) => `Share ${n} Moment${n !== 1 ? 's' : ''}`,
    shareBtnActive: 'Sharing Your Moments...',
    quotaReached: (added: number, skipped: number) =>
      `${added} photo${added !== 1 ? 's' : ''} added — ${skipped} skipped. You've reached your limit.`,
    successSingle: 'Your moment is ready to be seen. ✨',
    successMultiple: (n: number) => `${n} moments shared — beautifully done. ✨`,
    partialFail: (ok: number, fail: number) =>
      `${ok} shared, ${fail} didn't make it. Tap to retry those.`,
    allFailed: 'Something slipped through. Give it another try.',
    uploadError: 'Something slipped through. Give it another try.',
    allUploaded: 'All your moments have been shared.',
    quotaFull: "You've captured all your frames for this event.",
    statusFailed: 'Try Again',
  },

  // ─── Album View ───────────────────────────────────────────────────────────────
  albumView: {
    stats: {
      momentTakers: 'Guests',
      moments: 'Moments',
      shotsLeft: 'Shots Left',
      hidden: 'Hidden',
    },
    published: 'Published',
    publicAlbum: 'Public Album',
    copyLink: 'Copy Public Link',
    linkCopied: 'Copied!',
    unpublish: 'Unpublish',
    saving: 'Saving...',
    shareGuestLink: 'Share Guest Link',
    publishAlbum: 'Publish Album',
    downloadAlbum: 'Download Album',
    preparingDownload: 'Preparing Download...',
    capturedMoments: 'Captured Moments',
    yourMoments: 'Your Moments',
    sortLatest: 'Latest First',
    sortContributor: 'By Contributor',
    select: 'Select',
    cancelSelect: 'Done',
    hide: 'Hide',
    unhide: 'Show',
    emptyTitle: 'Your story starts here.',
    emptyGuest: 'No moments yet — be the first to capture yours.',
    emptyHost: 'Share your Guest Link and the moments will find their way here.',
    takenBy: (name: string) => `by ${name}`,
    footer: 'Every photo you share becomes part of a beautiful story.',
    moment: (n: number) => `${n} ${n === 1 ? 'Moment' : 'Moments'}`,
    download: 'Download',
    preparingContributorDownload: 'Preparing...',
    roleHost: 'Host',
    roleGuest: 'Guest',
  },

  // ─── Film Roll ───────────────────────────────────────────────────────────────
  filmRoll: {
    title: 'Film Roll',
    framesRemaining: (n: number) => `${n} Frame${n !== 1 ? 's' : ''} Remaining`,
    lastFrame: 'Last Frame!',
    rollFull: 'Your roll is full — time to share.',
    momentCaptured: '✓ Moment Captured',
    viewFilmRoll: 'Develop My Film',
    reviewTitle: 'Your Roll',
    reviewSubtitle: (n: number) => `${n} frame${n !== 1 ? 's' : ''} captured`,
    shareRoll: 'Share My Roll',
    sharingRoll: 'Sharing Your Roll...',
    retakeFrame: (n: number) => `Retake Frame ${n}`,
    rollShared: 'Your roll has been shared — beautifully done. ✨',
    noFrames: 'No frames captured yet.',
    rollFullSubtitle: "You've captured all your frames. Ready to share?",
    takePhoto: 'Capture Frame',
    goToFilmLab: 'Go to Film Lab',
    continueToFilmLab: 'Continue to Film Lab',
    fromGallery: 'From Gallery',
    captureMore: 'Capture More Moments',
    addFromGallery: '+ Add from Gallery',
  },

  // ─── Film Processing ────────────────────────────────────────────────────────
  filmProcessing: {
    developMyFilm: 'Develop My Film',
    preparing: 'Preparing Your Film...',
    developing: 'Developing Negatives...',
    applying: 'Applying Film Recipe...',
    finalizing: 'Finalizing...',
    ready: 'Your Film is Ready ✨',
  },

  // ─── Publish Modal ──────────────────────────────────────────────────────────
  publishModal: {
    title: 'Ready to Share?',
    body: `Only visible moments will appear in the public album.\n\nAnyone with the link can view the memories — no PIN needed.`,
    cancel: 'Not Yet',
    confirm: 'Publish Album',
    publishing: 'Publishing Your Album...',
    successTitle: 'Album Live',
    successBody: 'Your memories are now live for everyone to enjoy. ✨',
  },

  // ─── Delete Photo Modal ──────────────────────────────────────────────────────
  deleteModal: {
    title: 'Remove This Moment?',
    body: 'This moment will be gone for good.',
    cancel: 'Keep It',
    confirm: 'Remove',
    removing: 'Removing...',
  },

  // ─── Moderation Bar ─────────────────────────────────────────────────────────
  modBar: {
    selected: (n: number) => `${n} selected`,
    hide: 'Hide',
    show: 'Show',
  },

  // ─── Lightbox ────────────────────────────────────────────────────────────────
  lightbox: {
    takenBy: (name: string) => `Captured by ${name}`,
    download: 'Download Photo',
    close: 'Close',
    prev: 'Previous',
    next: 'Next',
  },

  // ─── Gallery (Event Page) ────────────────────────────────────────────────────
  gallery: {
    title: 'Captured Moments',
    shown: (n: number) => `${n} shown`,
    totalPhotos: 'Total Moments',
    momentTakers: 'Guests',
    emptyTitle: 'The stage is set.',
    emptyBody: 'Moments will appear here as guests start capturing.',
  },

  // ─── Admin — Events List ─────────────────────────────────────────────────────
  adminEvents: {
    title: 'Events',
    subtitle: 'All events managed through AlbumCerita.',
    newEvent: '+ New Event',
    emptyTitle: 'No events yet.',
    emptyBody: 'Events you create will appear here.',
    colName: 'Event Name',
    colId: 'Event ID',
    colState: 'State',
    colCreated: 'Created',
    colActions: 'Actions',
    view: 'View',
    delete: 'Delete',
    total: (n: number) => `${n} event${n !== 1 ? 's' : ''} total`,
    errorPrefix: 'Error:',
  },

  // ─── Admin — Delete Event Modal ──────────────────────────────────────────────
  adminDeleteEvent: {
    title: 'Delete This Event?',
    body: 'This action is permanent and cannot be undone.',
    willRemove: 'This will permanently remove:',
    items: ['Event details', 'Guest sessions', 'Photos', 'Contributors', 'Host & Guest access'],
    cancel: 'Keep Event',
    confirm: 'Delete Event',
    removing: 'Removing Event...',
    errorAlert: 'Failed to delete event. Please try again.',
  },

  // ─── Admin — Event Detail ──────────────────────────────────────────────────
  adminEventDetail: {
    eventsBreadcrumb: 'Events',
    guestAccess: 'Guest Access',
    hostAccess: 'Host Access',
    albumStatus: 'Album Status',
    statusPublished: 'Published',
    statusDraft: 'Draft',
    publicLink: 'Public Album Link',
    publicHelper: 'The album is currently visible to the public. Only the Host can publish or unpublish albums.',
    draftHelper: 'This album is only visible to the Host and Guests with a PIN. The Host can publish it from their dashboard.',
    eventConfig: 'Event Configuration',
    sysInfo: 'System Information',
    legacyEventId: 'Legacy Event ID',
    state: 'State',
    created: 'Created',
  },

  // ─── Admin — Access Card ────────────────────────────────────────────────────
  adminAccessCard: {
    link: 'Link',
    pin: 'PIN',
    copyLink: 'Copy Link',
    copyPin: 'Copy PIN',
    hidden: '•••••• (Hidden)',
    pinHiddenDesc: 'PIN is only shown once upon creation or reset.',
    downloadQr: 'Download QR',
  },

  // ─── Admin — Reset PIN ───────────────────────────────────────────────────────
  adminResetPin: {
    legacy: 'Reset PIN',
    host: 'Reset Host PIN',
    guest: 'Reset Guest PIN',
    title: (target: string) => `${target}?`,
    desc1: 'The current PIN will stop working.',
    desc2: 'Existing sessions and uploaded photos will not be affected.',
    desc3: (target: string) => `New ${target === 'host' ? 'hosts' : target === 'guest' ? 'guests' : 'contributors'} must use the new PIN.`,
    cancel: 'Cancel',
    confirm: 'Confirm Reset',
  },

  // ─── Admin — Edit Event Form ─────────────────────────────────────────────────
  adminEditEvent: {
    coverImage: 'Cover Image',
    replace: 'Replace',
    remove: 'Remove',
    uploadCover: 'Upload Cover Image',
    eventName: 'Event Name *',
    hostName: 'Host Name',
    optional: '(optional)',
    theme: 'Theme',
    retention: 'Retention',
    maxContributors: 'Max Contributors',
    photosPerGuest: 'Photos Per Guest',
    saveChanges: 'Save Changes',
    saving: 'Saving…',
    saved: 'Changes saved successfully.',
    unlimited: 'Unlimited',
    months: (n: number) => `${n} month${n !== 1 ? 's' : ''}`,
    photos: (n: number) => `${n} photos`,
  },

  // ─── Admin — New Event Form ──────────────────────────────────────────────────
  adminNewEvent: {
    title: 'Create Event',
    subtitle: 'Fill in the details below. A human-readable slug, Event ID, and PINs will be generated automatically.',
    eventDetails: 'Event Details',
    error: 'Error:',
    eventName: 'Event Name',
    eventNamePlaceholder: 'e.g. David & Valerie Wedding',
    eventDate: 'Event Date',
    eventDateHelper: 'Used to generate the event slug, e.g.',
    hostName: 'Host Name (Optional)',
    hostNamePlaceholder: 'e.g. David & Valerie',
    eventType: 'Event Type',
    types: {
      wedding: 'Wedding',
      birthday: 'Birthday',
      corporate: 'Corporate',
      other: 'Other',
    },
    theme: 'Theme (Optional)',
    retention: 'Retention',
    maxContributors: 'Max Contributors',
    photosPerGuest: 'Photos Per Guest',
    cancel: 'Cancel',
    createBtn: 'Create Event',
    creatingBtn: 'Creating event…',
  },

  // ─── Admin — PIN Banner ──────────────────────────────────────────────────────
  adminPinBanner: {
    copied: 'Copied',
    copy: 'Copy',
    resetSuccess: 'PIN Reset Successfully',
    createSuccess: 'Event Created Successfully',
    saveNote: 'Save the Event ID and PIN below.\nYou will not be able to see the PIN again.',
    eventId: 'Event ID',
    pin: 'PIN',
    shareNote: 'Share the Event ID and PIN with your client securely.\nDo not store or share the PIN publicly.',
    confirmBtn: "I've Saved This Information",
  },

  // ─── Language Switcher ───────────────────────────────────────────────────────
  langSwitcher: {
    label: 'Switch language',
  },

  // ─── Splash Screen ──────────────────────────────────────────────────────────
  splash: {
    tagline: 'Every moment, beautifully preserved.',
  },
};

export type Translations = typeof en;
export default en;
