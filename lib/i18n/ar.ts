// lib/i18n/ar.ts — Arabic (RTL) — اللغة العربية
export const ar = {
  dir: 'rtl' as const,
  lang: 'ar',

  // ── Navbar ─────────────────────────────────────────────────────────
  nav: {
    features:      'المميزات',
    pricing:       'الأسعار',
    intelligence:  '📊 ذكاء مهني',
    templates:     'القوالب',
    dashboard:     'لوحة التحكم',
    signOut:       'خروج',
    signIn:        'دخول',
    startFree:     'ابدأ مجاناً',
    menuAriaLabel: 'القائمة',
  },

  // ── Hero ───────────────────────────────────────────────────────────
  hero: {
    badge:        'أول منصة ذكاء مهني عربية',
    headline1:    'سيرتك الذاتية',
    headline2:    'تفتح الأبواب.',
    headline3:    'نصنعها معاً.',
    subtext:      'ذكاء اصطناعي يفهم سوق العمل في المغرب والخليج. سيرة ذاتية بالعربية والإنجليزية. تحليل رواتب وفجوات مهارات فورياً.',
    ctaAI:        'أنشئ سيرتك بالذكاء الاصطناعي',
    ctaManual:    'إنشاء يدوي',
    stat1Num:     '+50K',
    stat1Label:   'سيرة ذاتية',
    stat2Num:     '8',
    stat2Label:   'دول عربية',
    stat3Num:     '98%',
    stat3Label:   'معدل الرضا',
    // CV mockup
    mockName:     'أحمد بن علي',
    mockTitle:    'مطوّر برمجيات أول',
    mockLocation: 'دبي، الإمارات',
    mockMatch:    'مطابقة السوق ٨٥٪',
    mockAnalyze:  'الذكاء الاصطناعي يحلل ملفك',
    mockAccepted: '✓ تم قبولك',
    mockCompany:  'Careem — Dubai',
    mockSalary:   'الراتب المتوقع',
  },

  // ── Countries ──────────────────────────────────────────────────────
  countries: {
    sectionLabel: '— الأسواق المدعومة',
    headline:     'قوالب مخصصة لكل دولة',
    subtext:      'كل سوق له معاييره — المغرب يختلف عن دبي. نحن نعرف هذا الفرق.',
    stat1Num:     '٥٠٬٠٠٠+',
    stat1Label:   'سيرة ذاتية',
    stat2Num:     '٨',
    stat2Label:   'دول عربية',
    stat3Num:     '٥',
    stat3Label:   'قوالب متخصصة',
    stat4Num:     '٣',
    stat4Label:   'لغات مدعومة',
    list: [
      { flag: '🇲🇦', name: 'المغرب',   sub: 'Casablanca, Rabat' },
      { flag: '🇦🇪', name: 'الإمارات', sub: 'Dubai, Abu Dhabi' },
      { flag: '🇸🇦', name: 'السعودية', sub: 'Riyadh, Jeddah' },
      { flag: '🇪🇬', name: 'مصر',      sub: 'Cairo, Alexandria' },
      { flag: '🇶🇦', name: 'قطر',      sub: 'Doha' },
      { flag: '🇰🇼', name: 'الكويت',   sub: 'Kuwait City' },
      { flag: '🇩🇿', name: 'الجزائر',  sub: 'Algiers, Oran' },
      { flag: '🇹🇳', name: 'تونس',     sub: 'Tunis, Sfax' },
    ],
  },

  // ── Features ───────────────────────────────────────────────────────
  features: {
    sectionLabel: '— لماذا سيرتي',
    headline1:    'مبني من الأساس',
    headline2:    'للعربي',
    subtext:      'ليست ترجمة لأداة غربية. منصة مصممة بعمق لفهم ديناميكيات سوق العمل في منطقة الشرق الأوسط وشمال أفريقيا.',
    discoverMore: 'اكتشف أكثر ←',
    list: [
      { icon: '✦',  title: 'ذكاء اصطناعي يفهم العربية',      desc: 'يكتب النبذة المهنية، يحسّن أوصاف الخبرات، ويقترح المهارات المناسبة لسوق العمل العربي تحديداً.' },
      { icon: '📊', title: 'لوحة الذكاء المهني',              desc: 'تحليل فوري لراتبك المتوقع في كل دولة عربية، فجوات مهاراتك، وأفضل القطاعات لملفك المهني.' },
      { icon: '🌐', title: 'ثنائي اللغة بذكاء',               desc: 'أنشئ سيرتك بالعربية والإنجليزية في نفس اللحظة. النظام يترجم ويكيّف المحتوى بشكل احترافي.' },
      { icon: '🎯', title: 'تخصيص لكل وظيفة',                desc: 'الصق أي إعلان وظيفي وسيعيد الذكاء الاصطناعي صياغة سيرتك لتطابق المتطلبات وتتخطى أنظمة ATS.' },
      { icon: '🏆', title: 'قوالب لكل سوق',                   desc: 'قوالب مصممة لمتطلبات المغرب، الإمارات، السعودية، ومصر. كل دولة لها توقعاتها — نحن نعرف الفرق.' },
      { icon: '⚡', title: 'PDF احترافي فورياً',              desc: 'تصدير بجودة طباعة عالية في ثوانٍ. تصميم نظيف يُبهر مديري التوظيف من أول نظرة.' },
    ],
  },

  // ── Intelligence Teaser ────────────────────────────────────────────
  intelligence: {
    badge:        '✦ ميزة حصرية',
    headline1:    'أكثر من مجرد',
    headline2:    'سيرة ذاتية.',
    subtext:      'لوحة الذكاء المهني تحلل ملفك وتخبرك بالضبط كم راتبك المتوقع في كل دولة عربية، وأي المهارات تنقصك، وأي القطاعات تبحث عن شخص مثلك الآن.',
    feature1Title: 'معايرة الراتب',
    feature1Desc:  'قارن راتبك بالسوق في ٥ دول عربية',
    feature2Title: 'فجوات المهارات',
    feature2Desc:  'اعرف بالضبط ما يمنعك من الترقي',
    feature3Title: 'نبض السوق',
    feature3Desc:  'أي القطاعات تنمو وتناسب ملفك الآن',
    cta:           '📊 جرّب الذكاء المهني مجاناً ←',
    // Dashboard mockup labels
    mockHeader:    'لوحة الذكاء المهني',
    mockSubtitle:  'مطوّر برمجيات',
    mockLive:      'تحليل مباشر',
    mockHealth:    'الصحة المهنية',
    mockScore:     'جيد جداً',
    mockScoreDesc: 'ملفك مطلوب في ٣ قطاعات رئيسية',
    mockMetric1:   'مطابقة السوق',
    mockMetric2:   'طلب المهارات',
    mockMetric3:   'تميّز الملف',
    mockSalaryTitle: 'معايير الراتب الشهري',
    mockSkillsTitle: 'فجوات المهارات',
  },

  // ── Testimonials ───────────────────────────────────────────────────
  testimonials: {
    sectionLabel: 'قصص نجاح حقيقية',
    headline1:    'مهنيون وجدوا',
    headline2:    'طريقهم.',
    rating:       '٤.٩/٥',
    ratingDesc:   '— من أكثر من ٢٬٠٠٠ تقييم',
    list: [
      { name: 'سلمى العمراني', role: 'مديرة تسويق',   company: 'OCP Group',          country: '🇲🇦 المغرب',       avatar: 'س', avatarBg: 'linear-gradient(135deg,#C9A84C,#8B6E2A)', quote: 'أرسلت سيرتي لثلاث شركات في دبي وحصلت على مقابلتين في نفس الأسبوع. الذكاء الاصطناعي أعاد صياغة خبراتي بطريقة لم أكن أتخيلها.', result: '٢ مقابلة في أسبوع', resultColor: '#22C55E' },
      { name: 'يوسف بن خليل',  role: 'مهندس برمجيات', company: 'Careem',             country: '🇦🇪 الإمارات',     avatar: 'ي', avatarBg: 'linear-gradient(135deg,#22C55E,#16A34A)', quote: 'كنت أستخدم Canva لسنوات. سيرتي فهمت متطلبات السوق الخليجي تماماً — النمط، اللغة، حتى ترتيب الأقسام. مختلف تماماً.',             result: 'وظيفة في Careem',   resultColor: '#C9A84C' },
      { name: 'نور الدين قاسمي', role: 'محلل مالي',    company: 'Attijariwafa Bank', country: '🇲🇦 الدار البيضاء', avatar: 'ن', avatarBg: 'linear-gradient(135deg,#06B6D4,#0284C7)', quote: 'ميزة تحليل الرواتب غيّرت كيف أتفاوض. عرفت قيمتي الحقيقية في السوق وتفاوضت بثقة على راتب أعلى بـ٣٠٪.',                              result: '+٣٠٪ في الراتب',  resultColor: '#06B6D4' },
      { name: 'هند المنصوري',  role: 'مصممة UX',       company: 'Noon',              country: '🇸🇦 الرياض',       avatar: 'هـ', avatarBg: 'linear-gradient(135deg,#A78BFA,#7C3AED)', quote: 'الوضع ثنائي اللغة مذهل — سيرتي بالعربية والإنجليزية في ملف واحد. المحافظون في السعودية ومديرو التوظيف الأجانب كلاهما أُعجب بها.', result: 'مقبولة في Noon',   resultColor: '#A78BFA' },
    ],
  },

  // ── Pricing ────────────────────────────────────────────────────────
  pricing: {
    sectionLabel: 'الأسعار',
    headline1:    'بسيط. شفاف.',
    headline2:    'بدون مفاجآت.',
    subtext:      'ابدأ مجاناً وادفع فقط عندما تكون مستعداً للتحميل.',
    trust1:       '💳 دفع آمن بالكامل',
    trust2:       '🔒 لا حاجة لبطاقة ائتمان',
    trust3:       '↺ استرداد خلال 7 أيام',
    plans: [
      {
        id: 'free', name: 'مجاني', nameEn: 'Free', price: '٠', currency: '$', period: null,
        badge: null, desc: 'جرّب المنصة بدون قيود', cta: 'ابدأ مجاناً',
        features: [
          { text: 'إنشاء سيرة ذاتية كاملة', included: true },
          { text: 'معاينة مباشرة',           included: true },
          { text: 'مساعد الذكاء الاصطناعي', included: true },
          { text: 'تصدير PDF',               included: false },
          { text: 'جميع القوالب',             included: false },
          { text: 'لوحة الذكاء المهني',       included: false },
        ],
      },
      {
        id: 'basic', name: 'أساسي', nameEn: 'Basic', price: '٧', currency: '$', period: 'دفعة واحدة',
        badge: 'الأكثر طلباً', desc: 'كل ما تحتاج لتحميل سيرتك', cta: 'احصل عليه — $7',
        features: [
          { text: 'إنشاء سيرة ذاتية كاملة',  included: true },
          { text: 'معاينة مباشرة',            included: true },
          { text: 'مساعد الذكاء الاصطناعي',  included: true },
          { text: 'تصدير PDF عالي الجودة',    included: true },
          { text: 'جميع القوالب الـ٥',        included: true },
          { text: 'لوحة الذكاء المهني',        included: false },
        ],
      },
      {
        id: 'pro', name: 'احترافي', nameEn: 'Pro', price: '١٥', currency: '$', period: '/شهر',
        badge: null, desc: 'للمحترفين الطموحين', cta: 'اشترك الآن',
        features: [
          { text: 'كل مميزات الأساسي',              included: true },
          { text: 'لوحة الذكاء المهني',              included: true },
          { text: 'سير ذاتية غير محدودة',            included: true },
          { text: 'تخصيص لوظائف غير محدودة',        included: true },
          { text: 'تحليل رواتب وفجوات مهارات',       included: true },
          { text: 'أولوية الدعم الفني',              included: true },
        ],
      },
    ],
  },

  // ── CTA ────────────────────────────────────────────────────────────
  cta: {
    headline1:  'سيرتك الذاتية',
    headline2:  'تنتظرك.',
    subtext:    'انضم لأكثر من ٥٠٬٠٠٠ مهني عربي يبنون مستقبلهم الوظيفي مع سيرتي. مجاناً. الآن.',
    ctaAI:      'أنشئ سيرتك بالذكاء الاصطناعي',
    ctaManual:  'إنشاء يدوي',
    trust1:     '✓ مجاناً بالكامل',
    trust2:     '✓ لا تثبيت مطلوب',
    trust3:     '✓ بدون بطاقة ائتمان',
    trust4:     '✓ جاهز في ٥ دقائق',
  },

  // ── Footer ─────────────────────────────────────────────────────────
  footer: {
    brand:       'منصة الذكاء المهني العربية الأولى. مبنية لسوق الشرق الأوسط وشمال أفريقيا.',
    colProduct:  'المنتج',
    colMarkets:  'الأسواق',
    colCompany:  'الشركة',
    startFree:   'ابدأ مجاناً ←',
    copyright:   '© ٢٠٢٥ سيرتي — جميع الحقوق محفوظة',
    madeWith:    'صُنع بـ ❤ للمهني العربي',
    productLinks: [
      { label: 'إنشاء سيرة ذاتية', href: '/generate' },
      { label: 'المحرر اليدوي',    href: '/builder' },
      { label: 'الذكاء المهني',    href: '/intelligence' },
      { label: 'تخصيص لوظيفة',    href: '/tailor' },
      { label: 'القوالب',          href: '#templates' },
    ],
    marketLinks: [
      { label: 'المغرب',      href: '#' },
      { label: 'الإمارات',    href: '#' },
      { label: 'السعودية',    href: '#' },
      { label: 'مصر',         href: '#' },
      { label: 'قطر والكويت', href: '#' },
    ],
    companyLinks: [
      { label: 'سياسة الخصوصية', href: '#' },
      { label: 'شروط الاستخدام', href: '#' },
      { label: 'تواصل معنا',     href: '#' },
    ],
  },

  // ── Auth Pages ─────────────────────────────────────────────────────
  auth: {
    loginTitle:        'أهلاً بعودتك',
    loginSubtext:      'سجّل دخولك للوصول لسيرتك الذاتية',
    loginCta:          'تسجيل الدخول',
    loginLoading:      'جاري الدخول...',
    loginError:        'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    loginNoAccount:    'ليس لديك حساب؟',
    loginCreateFree:   'أنشئ حساباً مجاناً',
    registerTitle:     'أنشئ حسابك المجاني',
    registerSubtext:   'ابدأ بإنشاء سيرتك الذاتية الاحترافية',
    registerCta:       'إنشاء الحساب مجاناً ←',
    registerLoading:   'جاري الإنشاء...',
    registerHaveAcct:  'لديك حساب؟',
    registerSignIn:    'تسجيل الدخول',
    fieldName:         'الاسم الكامل',
    fieldEmail:        'البريد الإلكتروني',
    fieldPassword:     'كلمة المرور',
    fieldPasswordHint: '8 أحرف على الأقل',
    namePlaceholder:   'أحمد بنعلي',
    emailPlaceholder:  'ahmed@email.com',
    passwordPlaceholder: '••••••••',
    orContinueWith:    'أو تابع بـ',
    googleBtn:         'Google',
  },

  // ── Language Switcher ──────────────────────────────────────────────
  langSwitcher: {
    label: 'اللغة',
    ar:    'العربية',
    en:    'English',
    fr:    'Français',
  },
  // ── Validation messages ────────────────────────────────────────────

  validation: {
        required:          'هذا الحقل مطلوب',
        url:               'رابط غير صحيح — يجب أن يبدأ بـ https://',
        phone:             'رقم الهاتف غير صحيح',
        date:              'صيغة التاريخ غير صحيحة — مثال: 2022 أو 2022-06',
        gpa:               'المعدل غير صحيح — مثال: 3.8/4.0',
        email: {
            invalid:         'البريد الإلكتروني غير صحيح',
        },
        name: {
            required:        'الاسم مطلوب',
            max:             'الاسم طويل جداً (60 حرف كحد أقصى)',
        },
        password: {
            min:             'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل',
            max:             'كلمة المرور طويلة جداً',
            letter:          'يجب أن تحتوي كلمة المرور على حرف واحد على الأقل',
            number:          'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل',
        },
        jobTitle: {
            required:        'المسمى الوظيفي مطلوب',
        },
        company: {
            required:        'اسم الشركة مطلوب',
        },
        institution: {
            required:        'اسم المؤسسة التعليمية مطلوب',
        },
        summary: {
            max:             'النبذة طويلة جداً (800 حرف كحد أقصى)',
        },
        description: {
            max:             'الوصف طويل جداً (800 حرف كحد أقصى)',
        },
        skill: {
            max:             'اسم المهارة طويل جداً',
        },
        experience: {
            max:             'لا يمكن إضافة أكثر من 15 خبرة',
        },
        education: {
            max:             'لا يمكن إضافة أكثر من 10 شهادات',
        },
        skills: {
            max:             'لا يمكن إضافة أكثر من 30 مهارة',
        },
        generate: {
            min:             'يرجى كتابة وصف أكثر تفصيلاً (20 حرف على الأقل)',
            max:             'الوصف طويل جداً (3000 حرف كحد أقصى)',
        },
        tailor: {
            min:             'يرجى إدراج وصف وظيفي كامل (50 حرف على الأقل)',
            max:             'الوصف الوظيفي طويل جداً (5000 حرف كحد أقصى)',
        },
        payment: {
            plan:             'خطة الدفع يجب أن تكون BASIC أو PRO',
        },
        ai: {
            action:          'إجراء الذكاء الاصطناعي غير صحيح',
            context:         'السياق مطلوب',
        },
    },
}




export type Translations = typeof ar
