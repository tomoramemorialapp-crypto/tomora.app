/**
 * Tomora UI localization.
 *
 * English is the source of truth and holds every key. Other languages provide a
 * curated set of high-traffic UI strings; any missing key falls back to English
 * so the app never shows a blank label. We intentionally never translate names,
 * alternate names, user-generated content (captions, stories, memories), proper
 * nouns ("Tomora"), or taglines — those always render as authored.
 *
 * Non-Latin scripts (CJK, Arabic, Thai, Devanagari, Khmer) are covered by the
 * Noto font fallbacks loaded in global.css so they fit the app's style.
 */

export interface LanguageDef {
  code: string;
  /** Endonym (the language's own name) — shown untranslated in the picker. */
  label: string;
  english: string;
  rtl?: boolean;
}

/** Supported UI languages. Endonyms are used so each reads in its own script. */
export const LANGUAGES: LanguageDef[] = [
  { code: 'en', label: 'English', english: 'English' },
  { code: 'fil', label: 'Filipino', english: 'Filipino' },
  { code: 'es', label: 'Español', english: 'Spanish' },
  { code: 'fr', label: 'Français', english: 'French' },
  { code: 'de', label: 'Deutsch', english: 'German' },
  { code: 'pt', label: 'Português', english: 'Portuguese' },
  { code: 'it', label: 'Italiano', english: 'Italian' },
  { code: 'id', label: 'Bahasa Indonesia', english: 'Indonesian' },
  { code: 'ms', label: 'Bahasa Melayu', english: 'Malay' },
  { code: 'vi', label: 'Tiếng Việt', english: 'Vietnamese' },
  { code: 'th', label: 'ไทย', english: 'Thai' },
  { code: 'km', label: 'ខ្មែរ', english: 'Khmer' },
  { code: 'ja', label: '日本語', english: 'Japanese' },
  { code: 'zh', label: '中文', english: 'Chinese' },
  { code: 'ko', label: '한국어', english: 'Korean' },
  { code: 'hi', label: 'हिन्दी', english: 'Hindi' },
  { code: 'ar', label: 'العربية', english: 'Arabic', rtl: true },
];

export const RTL_CODES = new Set(LANGUAGES.filter((l) => l.rtl).map((l) => l.code));

/** Full English dictionary — the source of truth for every key. */
export const en = {
  // Navigation
  'nav.home': 'Home',
  'nav.familyTree': 'Family Tree',
  'nav.memories': 'Memories',
  'nav.occasions': 'Occasions',
  'nav.companion': 'Companion',
  'nav.you': 'You',

  // Common
  'common.done': 'Done',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.continue': 'Continue',
  'common.openLifeProfile': 'Open Life Profile',
  'common.family': 'Family',
  'common.holiday': 'Holiday',
  'common.seeAll': 'See all',

  // Home
  'home.welcomeBack': 'Welcome back',
  'home.hello': 'Hello, {name}',
  'home.subtitle': "Here's what's happening across your family.",
  'home.upcoming': 'Upcoming',
  'home.forYou': 'For you',
  'home.feedEmptyTitle': 'Your feed is just beginning',
  'home.feedEmptyBody': "As your family shares memories, they'll gather here for you.",
  'home.openTree': 'Open your Family Tree',

  // Occasions
  'occasions.kicker': 'Moments together',
  'occasions.title': 'Occasions',
  'occasions.subtitle': 'Birthdays, remembrances, and the days worth gathering for.',
  'occasions.noDatesTitle': 'No dates yet',
  'occasions.noDatesBody': "Add birthdays and dates to your family's Life Profiles and they'll gather here.",
  'occasions.notify': 'Notify me when it starts',
  'occasions.addToCalendar': 'Add to my calendar',

  // You / profile
  'you.title': 'You',
  'you.account': 'Account',
  'you.privacy': 'Privacy',
  'you.storage': 'Media storage',
  'you.signOut': 'Sign out',
  'you.deleteAccount': 'Delete account',

  // Welcome
  'welcome.tagline': 'ALWAYS WITH YOU',
  'welcome.body': 'Create a private Family Tree for the people, memories, and moments you want to keep close.',
  'welcome.primaryCta': 'Start my Family Tree',
  'welcome.secondaryCta': 'I was invited',
  'welcome.login': 'Log in',

  // Login
  'login.prompt': 'Welcome back.',
  'login.body': 'Log in with your email or username to return to your Family Tree.',
  'login.cta': 'Log in',
  'login.noAccount': 'New here? Start your Family Tree',
  'login.identifier': 'Email or username',

  // Claim
  'claim.prompt': 'Claim your place.',
  'claim.body': "Someone saved a space for you. Choose how you'd like to claim your node.",
  'claim.cta': 'Claim my node',

  // Memories
  'memories.kicker': 'Kept close',
  'memories.title': 'Memories',
  'memories.add': 'Add a memory',
  'memories.emptyTitle': 'No memories yet.',
  'memories.emptyBody': 'Add a photo, story, voice note, or video to keep this light close.',
  'memories.firstCta': 'Add your first memory',

  // Companion
  'companion.kicker': 'Tomora Companion',
  'companion.title': 'A gentle guide',

  // Occasion pages
  'occasionPage.productTitle': 'Occasion Pages',
  'occasionPage.productBody':
    'Open any occasion to see a dedicated page with shared memories. Guestbook messages and support flows are on the way.',
  'occasionPage.productHint': 'Tap an occasion, then choose Open Occasion Page.',
  'occasionPage.notFoundTitle': 'Occasion not found',
  'occasionPage.notFoundBody': 'This occasion may have passed or the link is no longer valid.',
  'occasionPage.memoriesTitle': 'Shared memories',
  'occasionPage.memoriesEmpty': 'No memories are linked to this occasion yet.',
  'occasionPage.guestbookTitle': 'Guestbook',
  'occasionPage.guestbookBody': 'Soon family and friends can leave warm notes, photos, and gentle support.',
  'occasionPage.guestbookSoon': 'Guestbook coming soon',
} satisfies Record<string, string>;

export type TranslationKey = keyof typeof en;

/**
 * Curated overrides per language for the most visible strings. Missing keys
 * fall back to English. (Names, user content, "Tomora", taglines stay as-is.)
 */
type Dict = Partial<Record<TranslationKey, string>>;

const fil: Dict = {
  'nav.home': 'Tahanan',
  'nav.familyTree': 'Puno ng Pamilya',
  'nav.memories': 'Alaala',
  'nav.occasions': 'Okasyon',
  'nav.companion': 'Kasama',
  'nav.you': 'Ikaw',
  'common.done': 'Tapos',
  'common.openLifeProfile': 'Buksan ang Life Profile',
  'common.family': 'Pamilya',
  'common.holiday': 'Pista',
  'common.seeAll': 'Tingnan lahat',
  'home.welcomeBack': 'Maligayang pagbabalik',
  'home.hello': 'Kumusta, {name}',
  'home.subtitle': 'Narito ang mga nangyayari sa iyong pamilya.',
  'home.upcoming': 'Paparating',
  'home.forYou': 'Para sa iyo',
  'occasions.kicker': 'Sandali nang magkasama',
  'occasions.title': 'Mga Okasyon',
  'occasions.subtitle': 'Mga kaarawan, paggunita, at mga araw na dapat magsama-sama.',
  'you.title': 'Ikaw',
};

const es: Dict = {
  'nav.home': 'Inicio',
  'nav.familyTree': 'Árbol familiar',
  'nav.memories': 'Recuerdos',
  'nav.occasions': 'Ocasiones',
  'nav.companion': 'Compañero',
  'nav.you': 'Tú',
  'common.done': 'Listo',
  'common.openLifeProfile': 'Abrir perfil de vida',
  'common.family': 'Familia',
  'common.holiday': 'Festivo',
  'common.seeAll': 'Ver todo',
  'home.welcomeBack': 'Bienvenido de nuevo',
  'home.hello': 'Hola, {name}',
  'home.subtitle': 'Esto es lo que sucede en tu familia.',
  'home.upcoming': 'Próximamente',
  'home.forYou': 'Para ti',
  'occasions.kicker': 'Momentos juntos',
  'occasions.title': 'Ocasiones',
  'occasions.subtitle': 'Cumpleaños, conmemoraciones y los días para reunirse.',
  'you.title': 'Tú',
};

const fr: Dict = {
  'nav.home': 'Accueil',
  'nav.familyTree': 'Arbre familial',
  'nav.memories': 'Souvenirs',
  'nav.occasions': 'Occasions',
  'nav.companion': 'Compagnon',
  'nav.you': 'Vous',
  'common.done': 'Terminé',
  'common.openLifeProfile': 'Ouvrir le profil de vie',
  'common.family': 'Famille',
  'common.holiday': 'Fête',
  'common.seeAll': 'Tout voir',
  'home.welcomeBack': 'Bon retour',
  'home.hello': 'Bonjour, {name}',
  'home.subtitle': 'Voici ce qui se passe dans votre famille.',
  'home.upcoming': 'À venir',
  'home.forYou': 'Pour vous',
  'occasions.kicker': 'Moments ensemble',
  'occasions.title': 'Occasions',
  'occasions.subtitle': 'Anniversaires, commémorations et jours pour se réunir.',
  'you.title': 'Vous',
};

const de: Dict = {
  'nav.home': 'Start',
  'nav.familyTree': 'Stammbaum',
  'nav.memories': 'Erinnerungen',
  'nav.occasions': 'Anlässe',
  'nav.companion': 'Begleiter',
  'nav.you': 'Du',
  'common.done': 'Fertig',
  'common.openLifeProfile': 'Lebensprofil öffnen',
  'common.family': 'Familie',
  'common.holiday': 'Feiertag',
  'common.seeAll': 'Alle ansehen',
  'home.welcomeBack': 'Willkommen zurück',
  'home.hello': 'Hallo, {name}',
  'home.subtitle': 'Das passiert gerade in deiner Familie.',
  'home.upcoming': 'Demnächst',
  'home.forYou': 'Für dich',
  'occasions.kicker': 'Gemeinsame Momente',
  'occasions.title': 'Anlässe',
  'occasions.subtitle': 'Geburtstage, Gedenktage und Tage zum Zusammenkommen.',
  'you.title': 'Du',
};

const pt: Dict = {
  'nav.home': 'Início',
  'nav.familyTree': 'Árvore genealógica',
  'nav.memories': 'Memórias',
  'nav.occasions': 'Ocasiões',
  'nav.companion': 'Companheiro',
  'nav.you': 'Você',
  'common.done': 'Concluído',
  'common.openLifeProfile': 'Abrir perfil de vida',
  'common.family': 'Família',
  'common.holiday': 'Feriado',
  'home.welcomeBack': 'Bem-vindo de volta',
  'home.hello': 'Olá, {name}',
  'home.subtitle': 'Veja o que está acontecendo na sua família.',
  'home.upcoming': 'Em breve',
  'home.forYou': 'Para você',
  'occasions.title': 'Ocasiões',
  'you.title': 'Você',
};

const it: Dict = {
  'nav.home': 'Home',
  'nav.familyTree': 'Albero genealogico',
  'nav.memories': 'Ricordi',
  'nav.occasions': 'Occasioni',
  'nav.companion': 'Compagno',
  'nav.you': 'Tu',
  'common.done': 'Fatto',
  'common.openLifeProfile': 'Apri profilo di vita',
  'common.family': 'Famiglia',
  'common.holiday': 'Festività',
  'home.welcomeBack': 'Bentornato',
  'home.hello': 'Ciao, {name}',
  'home.upcoming': 'In arrivo',
  'home.forYou': 'Per te',
  'occasions.title': 'Occasioni',
  'you.title': 'Tu',
};

const id: Dict = {
  'nav.home': 'Beranda',
  'nav.familyTree': 'Pohon Keluarga',
  'nav.memories': 'Kenangan',
  'nav.occasions': 'Acara',
  'nav.companion': 'Pendamping',
  'nav.you': 'Anda',
  'common.done': 'Selesai',
  'common.openLifeProfile': 'Buka Profil Kehidupan',
  'common.family': 'Keluarga',
  'common.holiday': 'Hari libur',
  'home.welcomeBack': 'Selamat datang kembali',
  'home.hello': 'Halo, {name}',
  'home.subtitle': 'Inilah yang terjadi di keluarga Anda.',
  'home.upcoming': 'Akan datang',
  'home.forYou': 'Untuk Anda',
  'occasions.title': 'Acara',
  'you.title': 'Anda',
};

const ms: Dict = {
  'nav.home': 'Utama',
  'nav.familyTree': 'Pokok Keluarga',
  'nav.memories': 'Kenangan',
  'nav.occasions': 'Majlis',
  'nav.companion': 'Teman',
  'nav.you': 'Anda',
  'common.done': 'Selesai',
  'common.openLifeProfile': 'Buka Profil Kehidupan',
  'common.family': 'Keluarga',
  'common.holiday': 'Cuti',
  'home.welcomeBack': 'Selamat kembali',
  'home.hello': 'Helo, {name}',
  'home.upcoming': 'Akan datang',
  'home.forYou': 'Untuk anda',
  'occasions.title': 'Majlis',
  'you.title': 'Anda',
};

const vi: Dict = {
  'nav.home': 'Trang chủ',
  'nav.familyTree': 'Cây gia đình',
  'nav.memories': 'Kỷ niệm',
  'nav.occasions': 'Dịp lễ',
  'nav.companion': 'Người đồng hành',
  'nav.you': 'Bạn',
  'common.done': 'Xong',
  'common.openLifeProfile': 'Mở Hồ sơ cuộc đời',
  'common.family': 'Gia đình',
  'common.holiday': 'Ngày lễ',
  'home.welcomeBack': 'Chào mừng trở lại',
  'home.hello': 'Xin chào, {name}',
  'home.subtitle': 'Đây là những gì đang diễn ra trong gia đình bạn.',
  'home.upcoming': 'Sắp tới',
  'home.forYou': 'Dành cho bạn',
  'occasions.title': 'Dịp lễ',
  'you.title': 'Bạn',
};

const th: Dict = {
  'nav.home': 'หน้าแรก',
  'nav.familyTree': 'ต้นไม้ครอบครัว',
  'nav.memories': 'ความทรงจำ',
  'nav.occasions': 'โอกาส',
  'nav.companion': 'เพื่อน',
  'nav.you': 'คุณ',
  'common.done': 'เสร็จสิ้น',
  'common.openLifeProfile': 'เปิดโปรไฟล์ชีวิต',
  'common.family': 'ครอบครัว',
  'common.holiday': 'วันหยุด',
  'home.welcomeBack': 'ยินดีต้อนรับกลับ',
  'home.hello': 'สวัสดี {name}',
  'home.upcoming': 'เร็วๆ นี้',
  'home.forYou': 'สำหรับคุณ',
  'occasions.title': 'โอกาส',
  'you.title': 'คุณ',
};

const km: Dict = {
  'nav.home': 'ទំព័រដើម',
  'nav.familyTree': 'មែកធាងគ្រួសារ',
  'nav.memories': 'ការចងចាំ',
  'nav.occasions': 'ឱកាស',
  'nav.companion': 'មិត្តរួម',
  'nav.you': 'អ្នក',
  'common.done': 'រួចរាល់',
  'common.openLifeProfile': 'បើកប្រវត្តិរូបជីវិត',
  'common.family': 'គ្រួសារ',
  'common.holiday': 'ថ្ងៃឈប់សម្រាក',
  'home.welcomeBack': 'សូមស្វាគមន៍ការត្រឡប់មកវិញ',
  'home.hello': 'សួស្ដី {name}',
  'home.upcoming': 'នឹងមកដល់',
  'home.forYou': 'សម្រាប់អ្នក',
  'occasions.title': 'ឱកាស',
  'you.title': 'អ្នក',
};

const ja: Dict = {
  'nav.home': 'ホーム',
  'nav.familyTree': '家系図',
  'nav.memories': '思い出',
  'nav.occasions': '行事',
  'nav.companion': '寄り添い',
  'nav.you': 'あなた',
  'common.done': '完了',
  'common.openLifeProfile': 'ライフプロフィールを開く',
  'common.family': '家族',
  'common.holiday': '祝日',
  'common.seeAll': 'すべて見る',
  'home.welcomeBack': 'おかえりなさい',
  'home.hello': 'こんにちは、{name}',
  'home.subtitle': 'ご家族の最近の様子です。',
  'home.upcoming': '近日',
  'home.forYou': 'あなたへ',
  'occasions.kicker': '共に過ごすひととき',
  'occasions.title': '行事',
  'occasions.subtitle': '誕生日、記念日、そして集う価値のある日々。',
  'you.title': 'あなた',
};

const zh: Dict = {
  'nav.home': '首页',
  'nav.familyTree': '家谱',
  'nav.memories': '回忆',
  'nav.occasions': '纪念日',
  'nav.companion': '陪伴',
  'nav.you': '你',
  'common.done': '完成',
  'common.openLifeProfile': '打开人生档案',
  'common.family': '家庭',
  'common.holiday': '节日',
  'common.seeAll': '查看全部',
  'home.welcomeBack': '欢迎回来',
  'home.hello': '你好，{name}',
  'home.subtitle': '这是你家庭的近况。',
  'home.upcoming': '即将到来',
  'home.forYou': '为你推荐',
  'occasions.kicker': '相聚时光',
  'occasions.title': '纪念日',
  'occasions.subtitle': '生日、追思，以及值得团聚的日子。',
  'you.title': '你',
};

const ko: Dict = {
  'nav.home': '홈',
  'nav.familyTree': '가족 나무',
  'nav.memories': '추억',
  'nav.occasions': '기념일',
  'nav.companion': '동반자',
  'nav.you': '나',
  'common.done': '완료',
  'common.openLifeProfile': '인생 프로필 열기',
  'common.family': '가족',
  'common.holiday': '공휴일',
  'common.seeAll': '모두 보기',
  'home.welcomeBack': '다시 오신 것을 환영합니다',
  'home.hello': '안녕하세요, {name}',
  'home.subtitle': '가족의 최근 소식입니다.',
  'home.upcoming': '다가오는 일정',
  'home.forYou': '추천',
  'occasions.kicker': '함께하는 순간',
  'occasions.title': '기념일',
  'occasions.subtitle': '생일, 추모, 그리고 함께 모일 만한 날들.',
  'you.title': '나',
};

const hi: Dict = {
  'nav.home': 'होम',
  'nav.familyTree': 'परिवार वृक्ष',
  'nav.memories': 'यादें',
  'nav.occasions': 'अवसर',
  'nav.companion': 'साथी',
  'nav.you': 'आप',
  'common.done': 'हो गया',
  'common.openLifeProfile': 'जीवन प्रोफ़ाइल खोलें',
  'common.family': 'परिवार',
  'common.holiday': 'अवकाश',
  'home.welcomeBack': 'वापसी पर स्वागत है',
  'home.hello': 'नमस्ते, {name}',
  'home.subtitle': 'यह आपके परिवार में हो रहा है।',
  'home.upcoming': 'आगामी',
  'home.forYou': 'आपके लिए',
  'occasions.title': 'अवसर',
  'you.title': 'आप',
};

const ar: Dict = {
  'nav.home': 'الرئيسية',
  'nav.familyTree': 'شجرة العائلة',
  'nav.memories': 'الذكريات',
  'nav.occasions': 'المناسبات',
  'nav.companion': 'الرفيق',
  'nav.you': 'أنت',
  'common.done': 'تم',
  'common.openLifeProfile': 'فتح الملف الشخصي للحياة',
  'common.family': 'العائلة',
  'common.holiday': 'عطلة',
  'home.welcomeBack': 'مرحبًا بعودتك',
  'home.hello': 'مرحبًا، {name}',
  'home.subtitle': 'إليك ما يحدث في عائلتك.',
  'home.upcoming': 'قادم',
  'home.forYou': 'لك',
  'occasions.title': 'المناسبات',
  'you.title': 'أنت',
};

export const dictionaries: Record<string, Dict> = {
  en,
  fil,
  es,
  fr,
  de,
  pt,
  it,
  id,
  ms,
  vi,
  th,
  km,
  ja,
  zh,
  ko,
  hi,
  ar,
};
