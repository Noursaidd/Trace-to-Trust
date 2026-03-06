import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'en' | 'ar';
type Dict = Record<string, string>;

const i18nDict: Record<Lang, Dict> = {
  en: {
    'app.name': 'Trace-to-Trust',
    'lang.switch': 'العربية',
    'theme.toggle': 'Toggle theme',

    'nav.overview': 'Overview',
    'nav.batches': 'All Batches',
    'nav.create': 'Create Batch',
    'nav.events': 'Add Events',
    'nav.sign': 'Sign Events',
    'nav.labels': 'Generate QR Labels',
    'nav.revoke': 'Revoke Batch',

    'event.ORIGIN_DECLARED': 'ORIGIN_DECLARED',
    'event.HARVEST_OR_CATCH': 'HARVEST_OR_CATCH',
    'event.PROCESSING': 'PROCESSING',
    'event.PACKAGING': 'PACKAGING',
    'event.TRANSPORT': 'TRANSPORT',
    'event.STORAGE': 'STORAGE',
    'event.RETAIL_DELIVERY': 'RETAIL_DELIVERY',
    'event.QUALITY_TEST': 'QUALITY_TEST',

    'product.HONEY': 'Honey',
    'product.FRANKINCENSE': 'Frankincense',
    'product.DATES': 'Dates',
    'product.FISH': 'Fish',
    'product.Honey': 'Honey',
    'product.Frankincense': 'Frankincense',
    'product.Dates': 'Dates',
    'product.Fish': 'Fish',

    'landing.hero.title': 'Verify Local Products in Oman',
    'landing.hero.desc': 'Ensure authenticity and traceability of Omani products through blockchain-powered verification',
    'landing.hero.scan': 'Scan QR Code',
    'landing.hero.admin': 'Admin Dashboard',
    'landing.stats.producers': 'Trusted by 240+ producers',
    'landing.stats.labels': '1.2M+ QR labels verified',
    'landing.stats.wilayat': 'Coverage across 11 wilayat',
    'landing.how.title': 'How It Works',
    'landing.step1.title': 'Create Batch',
    'landing.step1.desc': 'Producer creates a new product batch with details',
    'landing.step2.title': 'Sign Credential',
    'landing.step2.desc': 'Digital signature ensures authenticity',
    'landing.step3.title': 'Scan & Verify',
    'landing.step3.desc': 'Consumers scan QR to verify product origin',
    'landing.categories.title': 'Featured Categories',
    'landing.categories.traceable': 'Traceable and verified',
    'landing.footer.desc': 'Ensuring authenticity of local Omani products through digital verification',
    'landing.footer.links': 'Quick Links',
    'landing.footer.verify': 'Verify Product',
    'landing.footer.admin': 'Admin Portal',
    'landing.footer.contact': 'Contact',
    'landing.footer.location': 'Muscat, Oman',
    'landing.footer.rights': '© 2026 Trace-to-Trust. All rights reserved.',

    'common.back': 'Back',
    'common.exit': 'Exit',
    'common.batch': 'Batch',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.all': 'All',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.search': 'Search',
    'common.noData': 'No data',

    'verify.title': 'Verification',
    'verify.qr': 'QR code',
    'verify.product': 'Product',
    'verify.type': 'Type',
    'verify.origin': 'Origin',
    'verify.expiry': 'Expiry',
    'verify.journey': 'Product Journey',
    'verify.noEvents': 'No events yet.',
    'verify.revoked': 'Revoked',
    'verify.revokedDesc': 'This batch has been revoked by the producer/admin.',
    'verify.scanCount': 'Scan Count',
    'verify.scanHelp': 'For anti-clone detection.',
    'verify.cloneWarn': 'This QR label was scanned many times. Possible clone.',
    'verify.badge.valid': 'Signature Valid',
    'verify.badge.tampered': 'Tampered',
    'verify.badge.partial': 'Partially Verified',

    'dashboard.title': 'Trace-to-Trust Admin',
    'dashboard.panel': 'Admin Panel',
    'dashboard.loginTitle': 'Admin Login',
    'dashboard.overview': 'Admin Overview',
    'dashboard.totalScans': 'Total Scans',
    'dashboard.batches': 'Batches',
    'dashboard.signedEvents': 'Signed Events',
    'dashboard.revoked': 'Revoked',
    'dashboard.labels': 'Labels',
    'dashboard.events': 'Events',
    'dashboard.filters.title': 'Filters',
    'dashboard.filters.desc': 'Narrow batches by category, location, status, action, or keyword.',
    'dashboard.filters.shown': 'Shown',
    'dashboard.filterType': 'Filter by product type',
    'dashboard.searchPh': 'Search by ID, product, type, or origin',
    'dashboard.table.id': 'ID',
    'dashboard.table.product': 'Product',
    'dashboard.table.type': 'Type',
    'dashboard.table.origin': 'Origin',
    'dashboard.table.labels': 'Labels',
    'dashboard.active': 'Active',
    'dashboard.revokedBadge': 'Revoked',
    'dashboard.verifyLabel': 'Verify Label',
    'dashboard.noLabels': 'No labels yet',

    'create.title': 'Create New Batch',
    'create.productName': 'Product Name',
    'create.productNamePh': 'e.g., Premium Omani Honey',
    'create.productType': 'Product Type',
    'create.selectType': 'Select type',
    'create.origin': 'Origin (Wilaya)',
    'create.selectWilaya': 'Select wilaya',
    'create.quantity': 'Quantity',
    'create.productionDate': 'Production Date',
    'create.expiryDate': 'Expiry Date',
    'create.description': 'Description',
    'create.submit': 'Create Batch',
    'create.ok': 'Created batch',

    'events.title': 'Add Journey Event',
    'events.batch': 'Batch',
    'events.selectBatch': 'Select batch',
    'events.type': 'Event Type',
    'events.location': 'Location (optional)',
    'events.locationPh': 'e.g., Muscat',
    'events.payload': 'Payload JSON (flexible per product type)',
    'events.submit': 'Add Event',
    'events.ok': 'Event created',

    'sign.title': 'Sign Events (Tier B)',
    'sign.unsigned': 'Unsigned events',
    'sign.signed': 'Signed',
    'sign.submit': 'Sign',

    'labels.title': 'Generate QR Labels (Different QR per item)',
    'labels.count': 'How many QR labels?',
    'labels.submit': 'Generate',
    'labels.ok': 'Created QR labels',
    'labels.latest': 'Latest QR labels',
    'labels.png': 'QR PNG',
    'labels.first20': 'Showing first 20. (For MVP: you can print QR PNGs.)',

    'revoke.title': 'Revoke Batch',
    'revoke.reason': 'Reason',
    'revoke.reasonPh': 'e.g., Failed quality test',
    'revoke.submit': 'Revoke',
    'revoke.ok': 'Revoked',
  },
  ar: {
    'app.name': 'تتبع للثقة',
    'lang.switch': 'English',
    'theme.toggle': 'تبديل النمط',

    'nav.overview': 'نظرة عامة',
    'nav.batches': 'جميع الدفعات',
    'nav.create': 'إنشاء دفعة',
    'nav.events': 'إضافة أحداث',
    'nav.sign': 'توقيع الأحداث',
    'nav.labels': 'إنشاء ملصقات QR',
    'nav.revoke': 'إلغاء دفعة',

    'event.ORIGIN_DECLARED': 'إعلان المصدر',
    'event.HARVEST_OR_CATCH': 'الحصاد/الصيد',
    'event.PROCESSING': 'المعالجة',
    'event.PACKAGING': 'التغليف',
    'event.TRANSPORT': 'النقل',
    'event.STORAGE': 'التخزين',
    'event.RETAIL_DELIVERY': 'التوصيل للبيع',
    'event.QUALITY_TEST': 'فحص الجودة',

    'product.HONEY': 'عسل',
    'product.FRANKINCENSE': 'لبان',
    'product.DATES': 'تمور',
    'product.FISH': 'أسماك',
    'product.Honey': 'عسل',
    'product.Frankincense': 'لبان',
    'product.Dates': 'تمور',
    'product.Fish': 'أسماك',

    'landing.hero.title': 'تحقق من المنتجات المحلية في عُمان',
    'landing.hero.desc': 'اضمن أصالة المنتجات العُمانية وإمكانية تتبعها عبر التحقق المدعوم بالبلوك تشين',
    'landing.hero.scan': 'مسح رمز QR',
    'landing.hero.admin': 'لوحة التحكم',
    'landing.stats.producers': 'موثوق من أكثر من 240 منتجًا',
    'landing.stats.labels': 'أكثر من 1.2 مليون ملصق QR تم التحقق منه',
    'landing.stats.wilayat': 'تغطية عبر 11 ولاية',
    'landing.how.title': 'كيف يعمل',
    'landing.step1.title': 'إنشاء دفعة',
    'landing.step1.desc': 'ينشئ المنتج دفعة جديدة بتفاصيل المنتج',
    'landing.step2.title': 'توقيع الاعتماد',
    'landing.step2.desc': 'التوقيع الرقمي يضمن الأصالة',
    'landing.step3.title': 'امسح وتحقق',
    'landing.step3.desc': 'يقوم المستهلك بمسح الرمز للتحقق من مصدر المنتج',
    'landing.categories.title': 'الفئات المميزة',
    'landing.categories.traceable': 'قابل للتتبع والتحقق',
    'landing.footer.desc': 'ضمان أصالة المنتجات العُمانية المحلية عبر التحقق الرقمي',
    'landing.footer.links': 'روابط سريعة',
    'landing.footer.verify': 'التحقق من المنتج',
    'landing.footer.admin': 'بوابة الإدارة',
    'landing.footer.contact': 'تواصل معنا',
    'landing.footer.location': 'مسقط، عُمان',
    'landing.footer.rights': '© 2026 تتبع للثقة. جميع الحقوق محفوظة.',

    'common.back': 'رجوع',
    'common.exit': 'خروج',
    'common.batch': 'دفعة',
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.all': 'الكل',
    'common.actions': 'الإجراءات',
    'common.status': 'الحالة',
    'common.search': 'بحث',
    'common.noData': 'لا توجد بيانات',

    'verify.title': 'التحقق',
    'verify.qr': 'رمز QR',
    'verify.product': 'المنتج',
    'verify.type': 'النوع',
    'verify.origin': 'المنشأ',
    'verify.expiry': 'تاريخ الانتهاء',
    'verify.journey': 'رحلة المنتج',
    'verify.noEvents': 'لا توجد أحداث بعد.',
    'verify.revoked': 'ملغاة',
    'verify.revokedDesc': 'تم إلغاء هذه الدفعة بواسطة المنتج/الإدارة.',
    'verify.scanCount': 'عدد مرات المسح',
    'verify.scanHelp': 'للكشف عن النسخ المقلدة.',
    'verify.cloneWarn': 'تم مسح هذا الملصق مرات عديدة. احتمال وجود نسخة مقلدة.',
    'verify.badge.valid': 'توقيع صالح',
    'verify.badge.tampered': 'تم التلاعب',
    'verify.badge.partial': 'تحقق جزئي',

    'dashboard.title': 'إدارة تتبع للثقة',
    'dashboard.panel': 'لوحة الإدارة',
    'dashboard.loginTitle': 'تسجيل دخول الإدارة',
    'dashboard.loginDesc': 'أدخل كلمة مرور الإدارة للوصول إلى واجهات لوحة التحكم.',
    'dashboard.password': 'كلمة المرور',
    'dashboard.unlock': 'فتح',
    'dashboard.wrongPassword': 'كلمة المرور غير صحيحة',
    'dashboard.overview': 'نظرة عامة للإدارة',
    'dashboard.totalScans': 'إجمالي المسح',
    'dashboard.batches': 'الدفعات',
    'dashboard.signedEvents': 'الأحداث الموقعة',
    'dashboard.revoked': 'الملغاة',
    'dashboard.labels': 'الملصقات',
    'dashboard.events': 'الأحداث',
    'dashboard.filters.title': 'عوامل التصفية',
    'dashboard.filters.desc': 'قم بالبحث عن النتائج حسب النوع والمنشأ والحالة والإجراء.',
    'dashboard.filters.shown': 'المعروض',
    'dashboard.filterType': 'تصفية حسب نوع المنتج',
    'dashboard.searchPh': 'ابحث بالمعرف أو المنتج أو النوع أو المنشأ',
    'dashboard.table.id': 'المعرف',
    'dashboard.table.product': 'المنتج',
    'dashboard.table.type': 'النوع',
    'dashboard.table.origin': 'المنشأ',
    'dashboard.table.labels': 'الملصقات',
    'dashboard.active': 'نشطة',
    'dashboard.revokedBadge': 'ملغاة',
    'dashboard.verifyLabel': 'تحقق من الملصق',
    'dashboard.noLabels': 'لا توجد ملصقات بعد',

    'create.title': 'إنشاء دفعة جديدة',
    'create.productName': 'اسم المنتج',
    'create.productNamePh': 'مثال: عسل عُماني فاخر',
    'create.productType': 'نوع المنتج',
    'create.selectType': 'اختر النوع',
    'create.origin': 'المنشأ (الولاية)',
    'create.selectWilaya': 'اختر الولاية',
    'create.quantity': 'الكمية',
    'create.productionDate': 'تاريخ الإنتاج',
    'create.expiryDate': 'تاريخ الانتهاء',
    'create.description': 'الوصف',
    'create.submit': 'إنشاء دفعة',
    'create.ok': 'تم إنشاء الدفعة',

    'events.title': 'إضافة حدث للرحلة',
    'events.batch': 'الدفعة',
    'events.selectBatch': 'اختر دفعة',
    'events.type': 'نوع الحدث',
    'events.location': 'الموقع (اختياري)',
    'events.locationPh': 'مثال: مسقط',
    'events.payload': 'بيانات JSON (مرنة حسب نوع المنتج)',
    'events.submit': 'إضافة حدث',
    'events.ok': 'تم إنشاء الحدث',

    'sign.title': 'توقيع الأحداث (المستوى B)',
    'sign.unsigned': 'الأحداث غير الموقعة',
    'sign.signed': 'موقّع',
    'sign.submit': 'توقيع',

    'labels.title': 'إنشاء ملصقات QR (رمز مختلف لكل عنصر)',
    'labels.count': 'كم عدد ملصقات QR؟',
    'labels.submit': 'إنشاء',
    'labels.ok': 'تم إنشاء ملصقات QR',
    'labels.latest': 'أحدث ملصقات QR',
    'labels.png': 'صورة QR',
    'labels.first20': 'يتم عرض أول 20 فقط. (للنسخة الأولية: يمكنك طباعة صور QR.)',

    'revoke.title': 'إلغاء دفعة',
    'revoke.reason': 'السبب',
    'revoke.reasonPh': 'مثال: فشل اختبار الجودة',
    'revoke.submit': 'إلغاء',
    'revoke.ok': 'تم الإلغاء',
  },
};

Object.assign(i18nDict.en, {
  'common.cancel': 'Cancel',
  'dashboard.editing': 'Editing',
  'dashboard.editBatch': 'Edit Batch',
  'dashboard.editBatchDesc': 'Update batch details and save changes directly from this table.',
  'dashboard.updateBatch': 'Update',
  'dashboard.batchUpdated': 'Batch updated successfully.',
  'dashboard.revokePrompt': 'Enter a reason for revoking this batch (optional):',
});

Object.assign(i18nDict.ar, {
  'common.cancel': 'إلغاء',
  'dashboard.editing': 'التعديل',
  'dashboard.editBatch': 'تعديل الدفعة',
  'dashboard.editBatchDesc': 'حدّث بيانات الدفعة واحفظ التغييرات مباشرة من الجدول.',
  'dashboard.updateBatch': 'تحديث',
  'dashboard.batchUpdated': 'تم تحديث الدفعة بنجاح.',
  'dashboard.revokePrompt': 'أدخل سبب إلغاء هذه الدفعة (اختياري):',
});

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  dir: 'ltr' | 'rtl';
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = 'trace_lang_v1';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'ar' ? 'ar' : 'en';
  });

  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const value = useMemo<I18nContextValue>(() => ({
    lang,
    setLang,
    dir,
    t: (key: string) => i18nDict[lang][key] ?? i18nDict.en[key] ?? key,
  }), [lang, dir]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function translateProductType(value: string | undefined, t: (key: string) => string) {
  if (!value) return '—';
  const key = `product.${value}`;
  const translated = t(key);
  return translated === key ? value : translated;
}

export function translateEventType(value: string | undefined, t: (key: string) => string) {
  if (!value) return '—';
  const key = `event.${value}`;
  const translated = t(key);
  return translated === key ? value : translated;
}
