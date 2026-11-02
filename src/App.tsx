import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Users,
  FileText,
  ScanLine,
  Search,
  Share2,
  Bell,
  Star,
  Archive,
  Clock,
  FolderPlus,
  Settings,
  Lock,
  Globe,
  HardDrive,
  Plus,
  Copy,
  Check,
  CreditCard,
  Landmark,
  Briefcase,
  Phone,
  AlertCircle,
  Award,
  Layers,
  UserPlus,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import {
  Language,
  PageId,
  PersonProfile,
  VaultRecord,
  VaultCollection,
  CustomCategoryDef,
  VaultReminder,
  ActivityLogEntry,
  AuthorizedRoleMember,
  EncryptedShareLink,
  SecuritySettingsState,
  VaultCategoryKey,
  PdfExportLanguageMode,
  RecordKind,
} from './types/vault';
import {
  INITIAL_PEOPLE,
  INITIAL_RECORDS,
  INITIAL_COLLECTIONS,
  INITIAL_CUSTOM_CATEGORIES,
  INITIAL_REMINDERS,
  INITIAL_AUTHORIZED_ROLES,
  INITIAL_ACTIVITY_LOGS,
} from './data/seedData';
import {
  filterAndSearchRecords,
  computeExpirationStatus,
} from './utils/vaultLogic';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { RecordCard } from './components/RecordCard';
import { UniversalAddModal } from './components/UniversalAddModal';
import {
  PeopleDirectoryView,
  AddEditPersonView,
  PersonDetailsView,
} from './components/PersonViews';
import { SmartScannerView } from './components/SmartScannerView';
import { ShareCenterView, PdfPreviewView } from './components/ShareAndPdfViews';
import {
  DocumentDetailsView,
  EditCreateDocumentView,
} from './components/DocumentViews';
import {
  LandingPageView,
  LoginView,
  RegisterView,
} from './components/PublicAndAuthViews';
import {
  RemindersView,
  CustomCategoriesView,
  RecentActivityView,
  SecuritySettingsView,
  LanguageAndPrivacySettingsView,
  ProfileSettingsView,
  StorageManagementView,
} from './components/SettingsAndUtilityViews';

const STORAGE_KEYS = {
  LANG: 'my_vault_lang_v4',
  PEOPLE: 'my_vault_people_v4',
  RECORDS: 'my_vault_records_v4',
  CUSTOM_CATS: 'my_vault_custom_cats_v4',
  REMINDERS: 'my_vault_reminders_v4',
  ACTIVITY: 'my_vault_activity_v4',
  SETTINGS: 'my_vault_settings_v4',
};

export default function App() {
  // Check ?autostart=1 to skip landing page during automated verification or direct launch
  const initialPage = useMemo<PageId>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 'dashboard';
      }
    }
    return 'dashboard';
  }, []);

  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LANG);
      if (saved === 'ar' || saved === 'en') return saved;
    } catch {}
    return 'ar';
  });

  const [activePage, setActivePage] = useState<PageId>(initialPage);
  const [people, setPeople] = useState<PersonProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PEOPLE);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PEOPLE;
  });

  const [records, setRecords] = useState<VaultRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_RECORDS;
  });

  const [collections] = useState<VaultCollection[]>(INITIAL_COLLECTIONS);

  const [customCategories, setCustomCategories] = useState<CustomCategoryDef[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_CATS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CUSTOM_CATEGORIES;
  });

  const [reminders, setReminders] = useState<VaultReminder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_REMINDERS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_ACTIVITY_LOGS;
  });

  const [authorizedRoles, setAuthorizedRoles] = useState<AuthorizedRoleMember[]>(
    INITIAL_AUTHORIZED_ROLES
  );

  const [shareLinks, setShareLinks] = useState<EncryptedShareLink[]>([]);

  const [securitySettings, setSecuritySettings] = useState<SecuritySettingsState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      clientEncryptionEnabled: true,
      mfaEnabled: true,
      biometricQuickUnlock: true,
      autoLockMinutes: 15,
      maskSensitiveByDefault: true,
      aiOcrConsentDefault: true,
      zeroTelemetryMode: true,
      defaultExportLang: 'bilingual',
      lastKeyRotation: '2026-10-15',
    };
  });

  // Contextual navigation states
  const [selectedPersonId, setSelectedPersonId] = useState<string>('person-owner');
  const [editingPerson, setEditingPerson] = useState<PersonProfile | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('rec-owner-id');
  const [editingRecord, setEditingRecord] = useState<VaultRecord | null>(null);
  const [preselectedPersonForAdd, setPreselectedPersonForAdd] = useState<
    string | undefined
  >(undefined);
  const [preselectedShareIds, setPreselectedShareIds] = useState<string[]>([]);

  // PDF Preview state
  const [pdfRecordIds, setPdfRecordIds] = useState<string[]>(['rec-owner-id', 'rec-owner-passport']);
  const [pdfFieldsMap, setPdfFieldsMap] = useState<Record<string, string[]>>({});
  const [pdfLangMode, setPdfLangMode] = useState<PdfExportLanguageMode>('bilingual');
  const [pdfIncludeImages, setPdfIncludeImages] = useState<boolean>(true);

  // Global Search & Filter state
  const [globalQuery, setGlobalQuery] = useState<string>('');
  const [searchPersonFilter, setSearchPersonFilter] = useState<string>('all');
  const [searchCategoryFilter, setSearchCategoryFilter] = useState<VaultCategoryKey | 'all'>('all');
  const [searchKindFilter, setSearchKindFilter] = useState<RecordKind | 'all'>('all');
  const [searchExpirationFilter, setSearchExpirationFilter] = useState<
    'all' | 'nominal' | 'expiring_soon' | 'expired'
  >('all');

  // Universal "+ Add New" Modal & Mobile Drawer & Notifications
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Sync HTML dir and lang attributes immediately on language switch
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(STORAGE_KEYS.LANG, lang);
    } catch {}
  }, [lang]);

  // Persist state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));
    } catch {}
  }, [people]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    } catch {}
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CATS, JSON.stringify(customCategories));
    } catch {}
  }, [customCategories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    } catch {}
  }, [reminders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activityLogs));
    } catch {}
  }, [activityLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(securitySettings));
    } catch {}
  }, [securitySettings]);

  const peopleMap = useMemo(() => {
    const map: Record<string, PersonProfile> = {};
    for (const p of people) {
      map[p.id] = p;
    }
    return map;
  }, [people]);

  const accountOwner = useMemo(
    () => people.find((p) => p.isAccountOwner) || people[0],
    [people]
  );

  // Navigate helper that always resets scroll position to top
  const navigateTo = (
    page: PageId,
    opts?: { personId?: string; recordId?: string; clearEdit?: boolean }
  ) => {
    if (opts?.personId !== undefined) {
      setPreselectedPersonForAdd(opts.personId);
    }
    if (opts?.recordId) {
      setSelectedRecordId(opts.recordId);
    }
    if (opts?.clearEdit) {
      setEditingRecord(null);
      setEditingPerson(null);
    }
    setActivePage(page);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const logActivity = (
    actionType: ActivityLogEntry['actionType'],
    titleAr: string,
    titleEn: string,
    personId?: string,
    recordId?: string
  ) => {
    const entry: ActivityLogEntry = {
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      actionType,
      titleAr,
      titleEn,
      personId,
      recordId,
      actorName: accountOwner?.fullName || 'Owner',
    };
    setActivityLogs((prev) => [entry, ...prev.slice(0, 49)]);
  };

  const handleCopyValue = (val: string, label: string, recordId: string) => {
    navigator.clipboard?.writeText(val);
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId ? { ...r, usageCount: (r.usageCount || 0) + 1 } : r
      )
    );
    logActivity(
      'copy',
      `تم نسخ "${label}" إلى الحافظة`,
      `Copied "${label}" to clipboard`,
      undefined,
      recordId
    );
    setCopyToast(
      lang === 'ar' ? `تم نسخ: ${label}` : `Copied: ${label}`
    );
    setTimeout(() => setCopyToast(null), 2200);
  };

  const handleToggleFavorite = (recordId: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId ? { ...r, isFavorite: !r.isFavorite } : r
      )
    );
  };

  const handleToggleArchive = (recordId: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId ? { ...r, isArchived: !r.isArchived } : r
      )
    );
  };

  const handleSaveRecord = (rec: VaultRecord) => {
    setRecords((prev) => {
      const exists = prev.some((item) => item.id === rec.id);
      if (exists) {
        return prev.map((item) => (item.id === rec.id ? rec : item));
      }
      return [rec, ...prev];
    });
    logActivity(
      editingRecord ? 'edit' : 'create',
      `${editingRecord ? 'تحديث' : 'إضافة'} سجل: ${rec.titleAr}`,
      `${editingRecord ? 'Updated' : 'Created'} record: ${rec.titleEn}`,
      rec.personId,
      rec.id
    );
    setEditingRecord(null);
    setSelectedRecordId(rec.id);
    navigateTo('document-details', { recordId: rec.id });
  };

  const handleDeleteRecord = (recordId: string) => {
    const target = records.find((r) => r.id === recordId);
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    if (target) {
      logActivity(
        'delete',
        `حذف سجل: ${target.titleAr}`,
        `Deleted record: ${target.titleEn}`,
        target.personId
      );
    }
    navigateTo('all-documents');
  };

  const handleSavePerson = (person: PersonProfile) => {
    setPeople((prev) => {
      const exists = prev.some((p) => p.id === person.id);
      if (exists) {
        return prev.map((p) => (p.id === person.id ? person : p));
      }
      return [...prev, person];
    });
    logActivity(
      editingPerson ? 'edit' : 'create',
      `${editingPerson ? 'تعديل' : 'إضافة'} ملف شخص: ${person.fullName}`,
      `${editingPerson ? 'Updated' : 'Added'} person profile: ${person.fullName}`,
      person.id
    );
    setEditingPerson(null);
    setSelectedPersonId(person.id);
    navigateTo('person-details');
  };

  const handleDeletePerson = (personId: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== personId));
    setRecords((prev) =>
      prev.map((r) => (r.personId === personId ? { ...r, personId: undefined } : r))
    );
    navigateTo('people');
  };

  // Public pages (Landing, Login, Register)
  if (activePage === 'landing') {
    return (
      <LandingPageView
        lang={lang}
        onToggleLanguage={() => setLang((l) => (l === 'ar' ? 'en' : 'ar'))}
        onNavigate={(p) => navigateTo(p)}
        onUnlockVault={() => navigateTo('dashboard')}
      />
    );
  }
  if (activePage === 'login') {
    return (
      <LoginView
        lang={lang}
        onToggleLanguage={() => setLang((l) => (l === 'ar' ? 'en' : 'ar'))}
        onNavigate={(p) => navigateTo(p)}
        onUnlockVault={() => navigateTo('dashboard')}
      />
    );
  }
  if (activePage === 'register') {
    return (
      <RegisterView
        lang={lang}
        onToggleLanguage={() => setLang((l) => (l === 'ar' ? 'en' : 'ar'))}
        onNavigate={(p) => navigateTo(p)}
        onUnlockVault={() => navigateTo('dashboard')}
      />
    );
  }

  // Active non-archived records
  const activeRecords = records.filter((r) => !r.isArchived);
  const frequentlyUsedRecords = [...activeRecords]
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
    .slice(0, 4);

  const upcomingExpirations = activeRecords.filter((r) => {
    const st = computeExpirationStatus(r.expirationDate);
    return st.status === 'expiring_soon' || st.status === 'expired';
  });

  // Sidebar navigation items covering all required pages
  const navGroups: Array<{
    groupLabelAr: string;
    groupLabelEn: string;
    items: Array<{ id: PageId; ar: string; en: string; icon: any; badge?: number }>;
  }> = [
    {
      groupLabelAr: 'الرئيسية والأشخاص',
      groupLabelEn: 'Core & People',
      items: [
        { id: 'dashboard', ar: 'لوحة التحكم الرئيسية', en: 'Dashboard', icon: Landmark },
        {
          id: 'people',
          ar: 'دليل الأشخاص والعائلة',
          en: 'People Directory',
          icon: Users,
          badge: people.length,
        },
        { id: 'scanner', ar: 'الماسح الذكي AI OCR', en: 'AI Scanner', icon: ScanLine },
        { id: 'search', ar: 'البحث الشامل', en: 'Global Search', icon: Search },
      ],
    },
    {
      groupLabelAr: 'الوثائق والفئات',
      groupLabelEn: 'Documents & Categories',
      items: [
        {
          id: 'all-documents',
          ar: 'جميع الوثائق والسجلات',
          en: 'All Documents',
          icon: FileText,
          badge: activeRecords.length,
        },
        { id: 'category-identity', ar: 'الهوية الشخصية', en: 'Personal Identity', icon: Shield },
        {
          id: 'passports',
          ar: 'جوازات السفر',
          en: 'Passports',
          icon: Globe,
          badge: activeRecords.filter(
            (r) => r.category === 'passports' || r.documentType === 'passport'
          ).length,
        },
        {
          id: 'category-government',
          ar: 'الخدمات الحكومية والمرافق',
          en: 'Government & Utilities',
          icon: Landmark,
        },
        {
          id: 'category-work',
          ar: 'العمل والموظفون',
          en: 'Work & Employees',
          icon: Briefcase,
        },
        {
          id: 'category-financial',
          ar: 'البطاقات والحسابات المالية',
          en: 'Financial Cards',
          icon: CreditCard,
        },
        {
          id: 'category-complaints',
          ar: 'الطلبات والشكاوى',
          en: 'Applications & Complaints',
          icon: AlertCircle,
        },
        {
          id: 'category-contacts',
          ar: 'أرقام الهواتف والطوارئ',
          en: 'Contacts & Emergency',
          icon: Phone,
        },
        {
          id: 'category-memberships',
          ar: 'العضويات والتأمين',
          en: 'Memberships',
          icon: Award,
        },
        {
          id: 'custom-records',
          ar: 'السجلات المخصصة',
          en: 'Custom Records',
          icon: Layers,
        },
      ],
    },
    {
      groupLabelAr: 'المشاركة والتنظيم',
      groupLabelEn: 'Sharing & Organization',
      items: [
        { id: 'share-center', ar: 'مركز المشاركة والتصدير', en: 'Share Center', icon: Share2 },
        { id: 'pdf-preview', ar: 'معاينة وثيقة PDF', en: 'PDF Preview', icon: FileText },
        { id: 'favorites', ar: 'المفضلة والوصول السريع', en: 'Favorites', icon: Star },
        {
          id: 'reminders',
          ar: 'التذكيرات والانتهاء',
          en: 'Reminders',
          icon: Bell,
          badge: reminders.filter((r) => !r.isCompleted).length,
        },
        {
          id: 'custom-categories',
          ar: 'الفئات والصلاحيات',
          en: 'Custom Categories',
          icon: FolderPlus,
        },
        { id: 'recent-activity', ar: 'سجل النشاط الأخير', en: 'Recent Activity', icon: Clock },
        { id: 'archived', ar: 'الأرشيف', en: 'Archive', icon: Archive },
      ],
    },
    {
      groupLabelAr: 'الإعدادات والأمان',
      groupLabelEn: 'Settings & Security',
      items: [
        { id: 'profile', ar: 'إعدادات الملف الشخصي', en: 'Profile Settings', icon: Settings },
        { id: 'security', ar: 'إعدادات الأمان والتشفير', en: 'Security Settings', icon: Lock },
        {
          id: 'language-settings',
          ar: 'اللغة والخصوصية',
          en: 'Language & Privacy',
          icon: Globe,
        },
        { id: 'storage', ar: 'إدارة المساحة التخزينية', en: 'Storage Management', icon: HardDrive },
      ],
    },
  ];

  // Helper to render Category/Filtered Record List pages
  const renderCategoryRecordPage = (
    titleAr: string,
    titleEn: string,
    subtitleAr: string,
    subtitleEn: string,
    filterFn: (rec: VaultRecord) => boolean,
    defaultCat?: VaultCategoryKey
  ) => {
    const list = records.filter(filterFn);
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {lang === 'ar' ? titleAr : titleEn}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {lang === 'ar' ? subtitleAr : subtitleEn}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setPreselectedPersonForAdd(undefined);
                navigateTo('edit-document');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? '+ إضافة سجل جديد' : '+ Add New Record'}</span>
            </button>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'ar' ? 'لا توجد سجلات في هذا القسم حالياً' : 'No records in this view yet'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                navigateTo('edit-document');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A1128] text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة أول سجل' : 'Add First Record'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map((rec) => (
              <RecordCard
                key={rec.id}
                record={rec}
                person={rec.personId ? peopleMap[rec.personId] : undefined}
                lang={lang}
                maskByDefault={securitySettings.maskSensitiveByDefault}
                onSelectRecord={(id) => navigateTo('document-details', { recordId: id })}
                onToggleFavorite={handleToggleFavorite}
                onCopyValue={handleCopyValue}
                onShareRecord={(id) => {
                  setPreselectedShareIds([id]);
                  navigateTo('share-center');
                }}
                onSelectPerson={(pid) => {
                  setSelectedPersonId(pid);
                  navigateTo('person-details');
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar Navigation */}
      <aside className="no-print hidden lg:flex flex-col w-68 shrink-0 bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 sticky top-0 h-screen overflow-y-auto">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-2.5 text-start"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0A1128] text-white flex items-center justify-center font-bold text-sm">
              MV
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-[#0A1128] dark:text-white leading-none">
                MY VAULT
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {lang === 'ar' ? 'خزنتك الرقمية الشاملة' : 'Universal Digital Vault'}
              </div>
            </div>
          </button>
        </div>

        {/* Prominent Universal "+ Add New" CTA in Sidebar */}
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={() => {
              setPreselectedPersonForAdd(undefined);
              setIsAddModalOpen(true);
            }}
            className="w-full py-2.5 px-4 min-h-[44px] rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? '+ إضافة جديد' : '+ Add New'}</span>
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 p-4 space-y-5">
          {navGroups.map((grp, gIdx) => (
            <div key={gIdx}>
              <div className="px-3 mb-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                {lang === 'ar' ? grp.groupLabelAr : grp.groupLabelEn}
              </div>
              <div className="space-y-0.5">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const active = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateTo(item.id)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 min-h-[38px] rounded-xl text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#0A1128] dark:bg-blue-600 text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          {lang === 'ar' ? item.ar : item.en}
                        </span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[11px] font-mono tabular-nums ${
                            active ? 'text-blue-200' : 'text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigateTo('landing')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4" />
            <span>{lang === 'ar' ? 'صفحة العرض الرئيسية' : 'Landing Page'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Top Workspace Header */}
        <header className="no-print sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 min-h-[42px] min-w-[42px] rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center"
              aria-label={lang === 'ar' ? 'فتح القائمة' : 'Open Menu'}
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => navigateTo('dashboard')}
              className="text-base font-bold tracking-tight text-[#0A1128] dark:text-white whitespace-nowrap shrink-0"
            >
              MY VAULT
            </button>
          </div>

          {/* Global Quick Search Input in Top Bar */}
          <div className="hidden md:block flex-1 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
              <input
                type="text"
                value={globalQuery}
                onChange={(e) => {
                  setGlobalQuery(e.target.value);
                  if (activePage !== 'search') {
                    setActivePage('search');
                  }
                }}
                placeholder={
                  lang === 'ar'
                    ? 'بحث شامل: اسم شخص، جواز سفر، رقم هوية، عداد كهرباء...'
                    : 'Search any person, passport, ID number, meter...'
                }
                className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Right Utility Actions: Language Switch, Notifications, PWA Install, + Add New */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton lang={lang} />

            {/* Prominent Language Switcher (AR / EN) */}
            <button
              type="button"
              onClick={() => setLang((l) => (l === 'ar' ? 'en' : 'ar'))}
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((o) => !o)}
                className="p-2 min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center relative"
                aria-label={lang === 'ar' ? 'التنبيهات والتذكيرات' : 'Notifications'}
              >
                <Bell className="w-4 h-4 text-slate-700 dark:text-slate-200" />
              </button>

              {notificationsOpen && (
                <div className="absolute end-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">
                      {lang === 'ar' ? 'التنبيهات والتذكيرات' : 'Reminders & Alerts'}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigateTo('reminders')}
                      className="text-xs text-blue-600 font-semibold hover:underline"
                    >
                      {lang === 'ar' ? 'عرض الكل' : 'View All'}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {reminders.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs"
                      >
                        <div className="font-semibold">
                          {lang === 'ar' ? r.titleAr : r.titleEn}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                          {r.targetDate}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Universal "+ Add New" Button */}
            <button
              type="button"
              onClick={() => {
                setPreselectedPersonForAdd(undefined);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-bold hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? '+ إضافة جديد' : '+ Add New'}</span>
            </button>
          </div>
        </header>

        {/* Copy Confirmation Toast */}
        {copyToast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-16 start-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A1128] text-white text-xs font-bold shadow-lg border border-slate-700"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{copyToast}</span>
          </div>
        )}

        {/* Main Page Router Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
          {/* PAGE: DASHBOARD */}
          {activePage === 'dashboard' && (
            <div className="space-y-8">
              {/* Welcome & Quick Action Strip */}
              <section className="rounded-3xl bg-[#0A1128] text-white p-6 sm:p-8 border border-slate-800">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="text-xs text-blue-300 font-medium">
                      {lang === 'ar'
                        ? 'خزنتك الرقمية الشخصية والعائلية والأعمال'
                        : 'Personal, Family & Business Digital Vault'}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold">
                      {lang === 'ar'
                        ? `مرحباً، ${accountOwner?.fullName || 'طارق المنصور'}`
                        : `Welcome, ${accountOwner?.fullName || 'Tarek Al-Mansour'}`}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                      {lang === 'ar'
                        ? 'كل وثائقك ووثائق عائلتك وموظفيك، أرقام الهويات، جوازات السفر، وعدادات الخدمات في مكان واحد منظم وجاهز للنسخ والمشاركة.'
                        : 'All your personal, family, and employee documents, passports, IDs, and utility numbers organized in one place.'}
                    </p>
                  </div>

                  {/* Immediate Fast Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPreselectedPersonForAdd(undefined);
                        setIsAddModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{lang === 'ar' ? '+ إضافة جديد' : '+ Add New'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('scanner')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                    >
                      <ScanLine className="w-4 h-4 text-emerald-400" />
                      <span>{lang === 'ar' ? 'مسح مستند (AI OCR)' : 'Scan ID / Passport'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('add-person', { clearEdit: true })}
                      className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                    >
                      <UserPlus className="w-4 h-4 text-blue-300" />
                      <span>{lang === 'ar' ? 'إضافة شخص' : 'Add Person'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('share-center')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-amber-300" />
                      <span>{lang === 'ar' ? 'مركز المشاركة و PDF' : 'Share & PDF'}</span>
                    </button>
                  </div>
                </div>

                {/* 4-Pillar Overview Strip (1. People, 2. Documents, 3. Numbers & Info, 4. Custom Collections) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => navigateTo('people')}
                    className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-start transition-colors"
                  >
                    <div className="text-xs text-slate-400">
                      {lang === 'ar' ? '1. الأشخاص والملفات' : '1. People & Profiles'}
                    </div>
                    <div className="text-xl font-bold font-mono tabular-nums mt-1">
                      {people.length}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('all-documents')}
                    className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-start transition-colors"
                  >
                    <div className="text-xs text-slate-400">
                      {lang === 'ar' ? '2. الوثائق الرسمية' : '2. Official Documents'}
                    </div>
                    <div className="text-xl font-bold font-mono tabular-nums mt-1">
                      {activeRecords.filter((r) => r.recordKind === 'document').length}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('category-government')}
                    className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-start transition-colors"
                  >
                    <div className="text-xs text-slate-400">
                      {lang === 'ar' ? '3. الأرقام والمعلومات' : '3. Numbers & References'}
                    </div>
                    <div className="text-xl font-bold font-mono tabular-nums mt-1">
                      {activeRecords.filter((r) => r.recordKind !== 'document').length}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('custom-categories')}
                    className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-start transition-colors"
                  >
                    <div className="text-xs text-slate-400">
                      {lang === 'ar' ? '4. الفئات والمجموعات' : '4. Custom Collections'}
                    </div>
                    <div className="text-xl font-bold font-mono tabular-nums mt-1">
                      {collections.length + customCategories.length}
                    </div>
                  </button>
                </div>
              </section>

              {/* SECTION: PEOPLE & PROFILES STRIP */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {lang === 'ar'
                        ? 'الأشخاص والملفات الشخصية (العائلة، الأبناء، والموظفون)'
                        : 'People & Profiles (Family, Children & Employees)'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('add-person', { clearEdit: true })}
                      className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                    >
                      {lang === 'ar' ? '+ إضافة شخص' : '+ Add Person'}
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() => navigateTo('people')}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline"
                    >
                      {lang === 'ar' ? 'عرض جميع الأشخاص' : 'View Directory'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {people.slice(0, 4).map((person) => {
                    const count = activeRecords.filter(
                      (r) => r.personId === person.id
                    ).length;
                    return (
                      <div
                        key={person.id}
                        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPersonId(person.id);
                            navigateTo('person-details');
                          }}
                          className="flex items-center gap-3 text-start min-w-0 flex-1"
                        >
                          <div
                            className="w-11 h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center shrink-0"
                            style={{ backgroundColor: person.avatarColor }}
                          >
                            {person.fullName.trim().slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {person.fullName}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {lang === 'ar'
                                ? person.relationshipLabelAr
                                : person.relationshipLabelEn}{' '}
                              · <span className="font-mono">{count}</span>
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPreselectedPersonForAdd(person.id);
                            setIsAddModalOpen(true);
                          }}
                          className="p-2 min-h-[38px] min-w-[38px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-[#0A1128] hover:text-white transition-colors flex items-center justify-center shrink-0"
                          aria-label={
                            lang === 'ar'
                              ? `إضافة معلومة إلى ${person.fullName}`
                              : `Add info to ${person.fullName}`
                          }
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* SECTION: MAIN CATEGORIES GRID */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {lang === 'ar'
                      ? 'أقسام الخزنة الرئيسية'
                      : 'Main Vault Categories'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigateTo('custom-categories')}
                    className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                  >
                    {lang === 'ar' ? '+ إدارة الفئات المخصصة' : '+ Custom Categories'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    {
                      page: 'category-identity' as PageId,
                      ar: 'الهوية الشخصية',
                      en: 'Personal Identity',
                      subAr: 'بطاقات الهوية وشهادات الميلاد',
                      subEn: 'IDs & Birth Certificates',
                      icon: Shield,
                      count: activeRecords.filter((r) => r.category === 'identity').length,
                    },
                    {
                      page: 'passports' as PageId,
                      ar: 'جوازات السفر',
                      en: 'Passports',
                      subAr: 'جوازات العائلة والموظفين',
                      subEn: 'All Family & Staff Passports',
                      icon: Globe,
                      count: activeRecords.filter(
                        (r) => r.category === 'passports' || r.documentType === 'passport'
                      ).length,
                    },
                    {
                      page: 'category-government' as PageId,
                      ar: 'الخدمات الحكومية',
                      en: 'Government Services',
                      subAr: 'عدادات الكهرباء والمياه والغاز',
                      subEn: 'Electricity, Water & Gas',
                      icon: Landmark,
                      count: activeRecords.filter((r) => r.category === 'government').length,
                    },
                    {
                      page: 'category-work' as PageId,
                      ar: 'العمل والموظفون',
                      en: 'Work & Employees',
                      subAr: 'العقود، الإقامات، والشهادات',
                      subEn: 'Contracts, Permits & Degrees',
                      icon: Briefcase,
                      count: activeRecords.filter((r) => r.category === 'work').length,
                    },
                    {
                      page: 'category-financial' as PageId,
                      ar: 'البطاقات والحسابات المالية',
                      en: 'Financial Cards',
                      subAr: 'أرقام الآيبان والحسابات البنكية',
                      subEn: 'IBANs & Bank References',
                      icon: CreditCard,
                      count: activeRecords.filter((r) => r.category === 'financial').length,
                    },
                    {
                      page: 'category-complaints' as PageId,
                      ar: 'الطلبات والشكاوى',
                      en: 'Applications & Complaints',
                      subAr: 'أرقام البلاغات والدور والمتابعة',
                      subEn: 'Complaint & Tracking IDs',
                      icon: AlertCircle,
                      count: activeRecords.filter((r) => r.category === 'complaints').length,
                    },
                    {
                      page: 'category-contacts' as PageId,
                      ar: 'الهواتف والطوارئ',
                      en: 'Phone & Contacts',
                      subAr: 'أرقام الطوارئ والملفات الطبية',
                      subEn: 'Emergency & Medical Contacts',
                      icon: Phone,
                      count: activeRecords.filter((r) => r.category === 'contacts').length,
                    },
                    {
                      page: 'category-memberships' as PageId,
                      ar: 'العضويات والتأمين',
                      en: 'Memberships',
                      subAr: 'التأمين الطبي والأندية',
                      subEn: 'Medical Insurance & Clubs',
                      icon: Award,
                      count: activeRecords.filter((r) => r.category === 'memberships').length,
                    },
                    {
                      page: 'custom-records' as PageId,
                      ar: 'السجلات المخصصة',
                      en: 'Custom Records',
                      subAr: 'المركبات، العقارات، وأي معلومة',
                      subEn: 'Vehicles, Property & Custom',
                      icon: Layers,
                      count: activeRecords.filter((r) => r.category === 'custom').length,
                    },
                    {
                      page: 'favorites' as PageId,
                      ar: 'المفضلة السريعة',
                      en: 'Favorites',
                      subAr: 'الأكثر استخداماً للنسخ الفوري',
                      subEn: 'Starred for 1-Tap Copy',
                      icon: Star,
                      count: activeRecords.filter((r) => r.isFavorite).length,
                    },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.page}
                        type="button"
                        onClick={() => navigateTo(cat.page)}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-start transition-colors flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#0A1128] dark:text-blue-400 flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-500 tabular-nums">
                            {cat.count}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {lang === 'ar' ? cat.ar : cat.en}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {lang === 'ar' ? cat.subAr : cat.subEn}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* SECTION: FREQUENTLY USED RECORDS & QUICK COPY */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {lang === 'ar'
                        ? 'الوثائق والأرقام الأكثر استخداماً (نسخ فوري)'
                        : 'Frequently Used Documents & Numbers (Quick Copy)'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo('all-documents')}
                    className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                  >
                    {lang === 'ar' ? 'عرض جميع السجلات' : 'View All Records'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {frequentlyUsedRecords.map((rec) => (
                    <RecordCard
                      key={rec.id}
                      record={rec}
                      person={rec.personId ? peopleMap[rec.personId] : undefined}
                      lang={lang}
                      maskByDefault={securitySettings.maskSensitiveByDefault}
                      onSelectRecord={(id) =>
                        navigateTo('document-details', { recordId: id })
                      }
                      onToggleFavorite={handleToggleFavorite}
                      onCopyValue={handleCopyValue}
                      onShareRecord={(id) => {
                        setPreselectedShareIds([id]);
                        navigateTo('share-center');
                      }}
                      onSelectPerson={(pid) => {
                        setSelectedPersonId(pid);
                        navigateTo('person-details');
                      }}
                    />
                  ))}
                </div>
              </section>

              {/* BOTTOM SPLIT: UPCOMING EXPIRATIONS & RECENT ACTIVITY */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {lang === 'ar'
                        ? 'التذكيرات وتواريخ الانتهاء القريبة'
                        : 'Upcoming Expirations & Reminders'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigateTo('reminders')}
                      className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                    >
                      {lang === 'ar' ? 'إدارة التذكيرات' : 'Manage'}
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {upcomingExpirations.slice(0, 3).map((rec) => {
                      const owner = rec.personId ? peopleMap[rec.personId] : undefined;
                      const exp = computeExpirationStatus(rec.expirationDate);
                      return (
                        <div
                          key={rec.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {lang === 'ar' ? rec.titleAr : rec.titleEn}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {owner?.fullName || (lang === 'ar' ? 'سجل عام' : 'General')} ·{' '}
                              <span className="font-mono">{rec.expirationDate}</span>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-amber-600 shrink-0 tabular-nums">
                            {exp.daysRemaining} {lang === 'ar' ? 'يوم' : 'days'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {lang === 'ar' ? 'أحدث العمليات والنشاط' : 'Recent Vault Activity'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigateTo('recent-activity')}
                      className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                    >
                      {lang === 'ar' ? 'السجل الكامل' : 'Full Log'}
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {activityLogs.slice(0, 3).map((act) => (
                      <div
                        key={act.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3"
                      >
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {lang === 'ar' ? act.titleAr : act.titleEn}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 shrink-0 tabular-nums">
                          {new Date(act.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* PAGE: PEOPLE DIRECTORY */}
          {activePage === 'people' && (
            <PeopleDirectoryView
              people={people}
              records={records}
              lang={lang}
              onSelectPerson={(pid) => {
                setSelectedPersonId(pid);
                navigateTo('person-details');
              }}
              onAddPerson={() => {
                setEditingPerson(null);
                navigateTo('add-person');
              }}
              onAddInfoToPerson={(pid) => {
                setPreselectedPersonForAdd(pid);
                setIsAddModalOpen(true);
              }}
            />
          )}

          {/* PAGE: ADD / EDIT PERSON */}
          {activePage === 'add-person' && (
            <AddEditPersonView
              lang={lang}
              editingPerson={editingPerson}
              onSavePerson={handleSavePerson}
              onCancel={() => navigateTo('people')}
            />
          )}

          {/* PAGE: PERSON PROFILE DETAILS */}
          {activePage === 'person-details' && (
            <PersonDetailsView
              person={peopleMap[selectedPersonId] || people[0]}
              records={records}
              lang={lang}
              maskByDefault={securitySettings.maskSensitiveByDefault}
              onBack={() => navigateTo('people')}
              onEditPerson={(p) => {
                setEditingPerson(p);
                navigateTo('add-person');
              }}
              onDeletePerson={handleDeletePerson}
              onAddInformationToPerson={(pid) => {
                setPreselectedPersonForAdd(pid);
                setIsAddModalOpen(true);
              }}
              onSelectRecord={(rid) => navigateTo('document-details', { recordId: rid })}
              onToggleFavorite={handleToggleFavorite}
              onCopyValue={handleCopyValue}
              onSharePersonRecords={(pid) => {
                const pRecIds = activeRecords
                  .filter((r) => r.personId === pid)
                  .map((r) => r.id);
                setPreselectedShareIds(pRecIds);
                navigateTo('share-center');
              }}
            />
          )}

          {/* PAGE: ALL DOCUMENTS */}
          {activePage === 'all-documents' &&
            renderCategoryRecordPage(
              'جميع الوثائق والسجلات والأرقام',
              'All Documents, Numbers & Records',
              'كافة الوثائق والسجلات المحفوظة لجميع الأشخاص والسجلات العامة.',
              'Complete collection of documents and records across all people and general records.',
              (r) => !r.isArchived
            )}

          {/* PAGE: PERSONAL IDENTITY */}
          {activePage === 'category-identity' &&
            renderCategoryRecordPage(
              'الهوية الشخصية والوثائق المدنية',
              'Personal Identity Documents',
              'بطاقات الهوية الوطنية، شهادات الميلاد، وسجلات الأسرة لجميع الأفراد.',
              'National IDs, birth certificates, and family identity records across all profiles.',
              (r) => !r.isArchived && r.category === 'identity',
              'identity'
            )}

          {/* PAGE: PASSPORTS (Shows all passports from all people clearly associated with owner) */}
          {activePage === 'passports' &&
            renderCategoryRecordPage(
              'جوازات السفر ووثائق السفر (لجميع الأشخاص)',
              'Passports & Travel Documents (All People)',
              'جميع جوازات السفر الخاصة بصاحب الحساب، العائلة، الأبناء، والموظفين مع تواريخ الانتهاء.',
              'All passports belonging to the account owner, spouse, children, and employees.',
              (r) =>
                !r.isArchived &&
                (r.category === 'passports' || r.documentType === 'passport'),
              'passports'
            )}

          {/* PAGE: GOVERNMENT SERVICES */}
          {activePage === 'category-government' &&
            renderCategoryRecordPage(
              'الخدمات الحكومية والمرافق المنزلية',
              'Government Services & Utilities',
              'عدادات الكهرباء، المياه، الغاز، البطاقات التموينية، وأرقام السداد.',
              'Electricity, water, gas meters, ration cards, and government references.',
              (r) => !r.isArchived && r.category === 'government',
              'government'
            )}

          {/* PAGE: WORK & EMPLOYEES */}
          {activePage === 'category-work' &&
            renderCategoryRecordPage(
              'العمل والموظفون والتعليم',
              'Work, Employees & Education',
              'عقود العمل، رخص الإقامة، الشهادات العلمية، وبيانات العاملين.',
              'Employment contracts, residency work permits, certificates, and staff records.',
              (r) => !r.isArchived && r.category === 'work',
              'work'
            )}

          {/* PAGE: FINANCIAL CARDS */}
          {activePage === 'category-financial' &&
            renderCategoryRecordPage(
              'البطاقات والحسابات المالية',
              'Financial Cards & Bank References',
              'أرقام الآيبان (IBAN)، الحسابات البنكية، والمرجعيات المالية مع إخفاء القيم الحساسة.',
              'IBAN numbers, bank account references, and financial records.',
              (r) => !r.isArchived && r.category === 'financial',
              'financial'
            )}

          {/* PAGE: APPLICATIONS & COMPLAINTS */}
          {activePage === 'category-complaints' &&
            renderCategoryRecordPage(
              'الطلبات والشكاوى وأرقام المتابعة',
              'Applications, Complaints & Tracking Numbers',
              'أرقام الشكاوى، الطلبات الحكومية، أرقام الدور، ورموز التتبع.',
              'Complaint numbers, service applications, queue numbers, and tracking codes.',
              (r) => !r.isArchived && r.category === 'complaints',
              'complaints'
            )}

          {/* PAGE: CONTACTS & EMERGENCY */}
          {activePage === 'category-contacts' &&
            renderCategoryRecordPage(
              'أرقام الهواتف وجهات الاتصال والطوارئ',
              'Phone Numbers & Emergency Contacts',
              'أرقام الطوارئ، الأطباء، الملفات الطبية، وأرقام التواصل المهمة.',
              'Emergency contacts, medical file numbers, and essential phone numbers.',
              (r) => !r.isArchived && r.category === 'contacts',
              'contacts'
            )}

          {/* PAGE: MEMBERSHIPS */}
          {activePage === 'category-memberships' &&
            renderCategoryRecordPage(
              'العضويات وبطاقات التأمين والاشتراكات',
              'Memberships, Insurance & Subscriptions',
              'بطاقات التأمين الطبي، عضويات الأندية، والاشتراكات الدورية.',
              'Medical insurance cards, club memberships, and recurring subscriptions.',
              (r) => !r.isArchived && r.category === 'memberships',
              'memberships'
            )}

          {/* PAGE: CUSTOM RECORDS */}
          {activePage === 'custom-records' &&
            renderCategoryRecordPage(
              'السجلات والمعلومات المخصصة',
              'Universal Custom Records',
              'المركبات، العقارات، الملاحظات، وأي معلومة مخصصة قمت بإنشائها.',
              'Vehicles, real estate, notes, and unlimited user-created custom records.',
              (r) => !r.isArchived && r.category === 'custom',
              'custom'
            )}

          {/* PAGE: FAVORITES */}
          {activePage === 'favorites' &&
            renderCategoryRecordPage(
              'المفضلة والوصول السريع',
              'Favorite Records',
              'السجلات والأرقام المميزة بنجمة للوصول والنسخ الفوري.',
              'Starred documents and numbers for immediate access and copying.',
              (r) => !r.isArchived && r.isFavorite
            )}

          {/* PAGE: ARCHIVED */}
          {activePage === 'archived' &&
            renderCategoryRecordPage(
              'السجلات المؤرشفة',
              'Archived Records',
              'الوثائق والسجلات السابقة المحفوظة في الأرشيف.',
              'Historical documents and records stored in the archive.',
              (r) => r.isArchived
            )}

          {/* PAGE: AI DOCUMENT SCANNER */}
          {activePage === 'scanner' && (
            <SmartScannerView
              lang={lang}
              people={people}
              preselectedPersonId={preselectedPersonForAdd}
              defaultConsent={securitySettings.aiOcrConsentDefault}
              onSaveScannedRecord={(newRec) => {
                handleSaveRecord(newRec);
                logActivity(
                  'scan',
                  `مسح وحفظ وثيقة عبر AI OCR: ${newRec.titleAr}`,
                  `Scanned & saved document via AI OCR: ${newRec.titleEn}`,
                  newRec.personId,
                  newRec.id
                );
              }}
            />
          )}

          {/* PAGE: DOCUMENT DETAILS */}
          {activePage === 'document-details' && (
            <DocumentDetailsView
              record={
                records.find((r) => r.id === selectedRecordId) || records[0]
              }
              person={
                records.find((r) => r.id === selectedRecordId)?.personId
                  ? peopleMap[
                      records.find((r) => r.id === selectedRecordId)!.personId!
                    ]
                  : undefined
              }
              lang={lang}
              maskByDefault={securitySettings.maskSensitiveByDefault}
              onBack={() => navigateTo('all-documents')}
              onEdit={(rec) => {
                setEditingRecord(rec);
                navigateTo('edit-document');
              }}
              onDuplicate={(rec) => {
                const copyRec: VaultRecord = {
                  ...rec,
                  id: 'rec-dup-' + Date.now(),
                  titleAr: `${rec.titleAr} (نسخة)`,
                  titleEn: `${rec.titleEn} (Copy)`,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                handleSaveRecord(copyRec);
              }}
              onToggleArchive={handleToggleArchive}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteRecord}
              onShare={(rid) => {
                setPreselectedShareIds([rid]);
                navigateTo('share-center');
              }}
              onCopyValue={handleCopyValue}
              onSelectPerson={(pid) => {
                setSelectedPersonId(pid);
                navigateTo('person-details');
              }}
            />
          )}

          {/* PAGE: EDIT / CREATE DOCUMENT */}
          {activePage === 'edit-document' && (
            <EditCreateDocumentView
              lang={lang}
              people={people}
              collections={collections}
              customCategories={customCategories}
              editingRecord={editingRecord}
              preselectedPersonId={preselectedPersonForAdd}
              onSaveRecord={handleSaveRecord}
              onCancel={() => navigateTo('dashboard')}
            />
          )}

          {/* PAGE: GLOBAL SEARCH */}
          {activePage === 'search' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {lang === 'ar'
                    ? 'البحث الشامل والذكي في الخزنة'
                    : 'Universal Vault Search'}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {lang === 'ar'
                    ? 'ابحث باسم الشخص، اسم الوثيقة، رقم الهوية، جواز السفر، رقم العداد، رقم الشكوى، أو أي حقل مخصص.'
                    : 'Search across all people, document names, ID numbers, passports, meter numbers, complaints, notes, and tags.'}
                </p>
              </div>

              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-400 absolute top-1/2 -translate-y-1/2 start-4" />
                  <input
                    type="text"
                    value={globalQuery}
                    onChange={(e) => setGlobalQuery(e.target.value)}
                    placeholder={
                      lang === 'ar'
                        ? 'اكتب أي اسم أو رقم أو كلمة للبحث الفوري (مثال: جواز، رامي، ELC-4409)...'
                        : 'Type any name, number, or keyword (e.g., Passport, Rami, ELC-4409)...'
                    }
                    className="w-full ps-12 pe-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                {/* Filters by Person, Category, Record Type, and Expiration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <select
                    value={searchPersonFilter}
                    onChange={(e) => setSearchPersonFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="all">
                      {lang === 'ar' ? 'جميع الأشخاص' : 'All People'}
                    </option>
                    <option value="unassigned">
                      {lang === 'ar' ? 'سجلات عامة (غير مرتبطة بشخص)' : 'General / Unassigned'}
                    </option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName}
                      </option>
                    ))}
                  </select>

                  <select
                    value={searchCategoryFilter}
                    onChange={(e) =>
                      setSearchCategoryFilter(
                        e.target.value as VaultCategoryKey | 'all'
                      )
                    }
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="all">
                      {lang === 'ar' ? 'جميع الفئات' : 'All Categories'}
                    </option>
                    <option value="identity">
                      {lang === 'ar' ? 'الهوية الشخصية' : 'Personal Identity'}
                    </option>
                    <option value="passports">
                      {lang === 'ar' ? 'جوازات السفر' : 'Passports'}
                    </option>
                    <option value="government">
                      {lang === 'ar' ? 'الخدمات الحكومية' : 'Government Services'}
                    </option>
                    <option value="work">
                      {lang === 'ar' ? 'العمل والموظفون' : 'Work & Employees'}
                    </option>
                    <option value="financial">
                      {lang === 'ar' ? 'البطاقات المالية' : 'Financial Cards'}
                    </option>
                    <option value="complaints">
                      {lang === 'ar' ? 'الطلبات والشكاوى' : 'Applications & Complaints'}
                    </option>
                    <option value="contacts">
                      {lang === 'ar' ? 'الهواتف والطوارئ' : 'Contacts'}
                    </option>
                    <option value="memberships">
                      {lang === 'ar' ? 'العضويات والتأمين' : 'Memberships'}
                    </option>
                    <option value="custom">
                      {lang === 'ar' ? 'السجلات المخصصة' : 'Custom Records'}
                    </option>
                  </select>

                  <select
                    value={searchKindFilter}
                    onChange={(e) =>
                      setSearchKindFilter(e.target.value as RecordKind | 'all')
                    }
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="all">
                      {lang === 'ar' ? 'كل أنواع السجلات' : 'All Record Types'}
                    </option>
                    <option value="document">
                      {lang === 'ar' ? 'وثائق رسمية' : 'Documents'}
                    </option>
                    <option value="number">
                      {lang === 'ar' ? 'أرقام مرجعية' : 'Numbers & References'}
                    </option>
                    <option value="note">
                      {lang === 'ar' ? 'ملاحظات' : 'Notes'}
                    </option>
                    <option value="custom">
                      {lang === 'ar' ? 'سجلات مخصصة' : 'Custom Items'}
                    </option>
                  </select>

                  <select
                    value={searchExpirationFilter}
                    onChange={(e) =>
                      setSearchExpirationFilter(e.target.value as any)
                    }
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="all">
                      {lang === 'ar' ? 'جميع حالات الصلاحية' : 'All Expiration States'}
                    </option>
                    <option value="nominal">
                      {lang === 'ar' ? 'ساري المفعول' : 'Active / Nominal'}
                    </option>
                    <option value="expiring_soon">
                      {lang === 'ar' ? 'ينتهي قريباً' : 'Expiring Soon'}
                    </option>
                    <option value="expired">
                      {lang === 'ar' ? 'منتهي الصلاحية' : 'Expired'}
                    </option>
                  </select>
                </div>
              </div>

              {(() => {
                const results = filterAndSearchRecords(records, {
                  query: globalQuery,
                  personId: searchPersonFilter,
                  category: searchCategoryFilter,
                  recordKind: searchKindFilter,
                  expirationFilter: searchExpirationFilter,
                  peopleMap,
                });

                return (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-500">
                      {lang === 'ar'
                        ? `عدد النتائج المطابقة: ${results.length}`
                        : `Matching Results: ${results.length}`}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.map((rec) => (
                        <RecordCard
                          key={rec.id}
                          record={rec}
                          person={rec.personId ? peopleMap[rec.personId] : undefined}
                          lang={lang}
                          maskByDefault={securitySettings.maskSensitiveByDefault}
                          onSelectRecord={(id) =>
                            navigateTo('document-details', { recordId: id })
                          }
                          onToggleFavorite={handleToggleFavorite}
                          onCopyValue={handleCopyValue}
                          onShareRecord={(id) => {
                            setPreselectedShareIds([id]);
                            navigateTo('share-center');
                          }}
                          onSelectPerson={(pid) => {
                            setSelectedPersonId(pid);
                            navigateTo('person-details');
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* PAGE: SHARE CENTER */}
          {activePage === 'share-center' && (
            <ShareCenterView
              records={records}
              peopleMap={peopleMap}
              lang={lang}
              preselectedRecordIds={preselectedShareIds}
              shareLinks={shareLinks}
              onCreateShareLink={(lnk) => setShareLinks((prev) => [lnk, ...prev])}
              onRevokeShareLink={async (token) => {
                await fetch(`/api/share/${token}/revoke`, { method: 'POST' });
                setShareLinks((prev) =>
                  prev.map((l) => (l.token === token ? { ...l, revoked: true } : l))
                );
              }}
              onOpenPdfPreview={(ids, fieldsMap, mode, incImg) => {
                setPdfRecordIds(ids);
                setPdfFieldsMap(fieldsMap);
                setPdfLangMode(mode);
                setPdfIncludeImages(incImg);
                navigateTo('pdf-preview');
              }}
              onLogExportActivity={(ar, en) => logActivity('export', ar, en)}
            />
          )}

          {/* PAGE: PDF PREVIEW */}
          {activePage === 'pdf-preview' && (
            <PdfPreviewView
              records={records.filter((r) => pdfRecordIds.includes(r.id))}
              peopleMap={peopleMap}
              selectedFieldsByRecord={pdfFieldsMap}
              pdfLangMode={pdfLangMode}
              includeImages={pdfIncludeImages}
              lang={lang}
              onChangePdfLangMode={setPdfLangMode}
              onBackToShare={() => navigateTo('share-center')}
            />
          )}

          {/* PAGE: REMINDERS */}
          {activePage === 'reminders' && (
            <RemindersView
              reminders={reminders}
              records={records}
              peopleMap={peopleMap}
              lang={lang}
              onAddReminder={(rem) => setReminders((prev) => [rem, ...prev])}
              onToggleReminder={(id) =>
                setReminders((prev) =>
                  prev.map((r) =>
                    r.id === id ? { ...r, isCompleted: !r.isCompleted } : r
                  )
                )
              }
              onDeleteReminder={(id) =>
                setReminders((prev) => prev.filter((r) => r.id !== id))
              }
              onSelectRecord={(rid) =>
                navigateTo('document-details', { recordId: rid })
              }
            />
          )}

          {/* PAGE: CUSTOM CATEGORIES & ROLES */}
          {activePage === 'custom-categories' && (
            <CustomCategoriesView
              customCategories={customCategories}
              authorizedRoles={authorizedRoles}
              lang={lang}
              onAddCategory={(cat) =>
                setCustomCategories((prev) => [cat, ...prev])
              }
              onDeleteCategory={(id) =>
                setCustomCategories((prev) => prev.filter((c) => c.id !== id))
              }
              onAddAuthorizedRole={(m) =>
                setAuthorizedRoles((prev) => [...prev, m])
              }
            />
          )}

          {/* PAGE: RECENT ACTIVITY */}
          {activePage === 'recent-activity' && (
            <RecentActivityView
              logs={activityLogs}
              peopleMap={peopleMap}
              lang={lang}
            />
          )}

          {/* PAGE: PROFILE SETTINGS */}
          {activePage === 'profile' && accountOwner && (
            <ProfileSettingsView
              owner={accountOwner}
              lang={lang}
              onUpdateOwner={(updated) =>
                setPeople((prev) =>
                  prev.map((p) => (p.id === updated.id ? updated : p))
                )
              }
            />
          )}

          {/* PAGE: SECURITY SETTINGS */}
          {activePage === 'security' && (
            <SecuritySettingsView
              settings={securitySettings}
              lang={lang}
              onUpdateSettings={(patch) =>
                setSecuritySettings((prev) => ({ ...prev, ...patch }))
              }
              onLockNow={() => navigateTo('login')}
            />
          )}

          {/* PAGE: LANGUAGE & PRIVACY SETTINGS */}
          {(activePage === 'language-settings' || activePage === 'privacy') && (
            <LanguageAndPrivacySettingsView
              lang={lang}
              settings={securitySettings}
              records={records}
              peopleMap={peopleMap}
              onChangeLanguage={(l) => setLang(l)}
              onUpdateSettings={(patch) =>
                setSecuritySettings((prev) => ({ ...prev, ...patch }))
              }
              onResetOrDeleteAll={() => {
                localStorage.clear();
                setPeople(INITIAL_PEOPLE);
                setRecords(INITIAL_RECORDS);
                setCustomCategories(INITIAL_CUSTOM_CATEGORIES);
                setReminders(INITIAL_REMINDERS);
              }}
            />
          )}

          {/* PAGE: STORAGE MANAGEMENT */}
          {activePage === 'storage' && (
            <StorageManagementView
              peopleCount={people.length}
              records={records}
              lang={lang}
            />
          )}
        </main>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-slate-950/60 backdrop-blur-sm flex"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full overflow-y-auto p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-base font-bold text-[#0A1128] dark:text-white">
                MY VAULT
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-500"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {navGroups.map((grp, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-[11px] font-bold text-slate-400 px-2">
                  {lang === 'ar' ? grp.groupLabelAr : grp.groupLabelEn}
                </div>
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateTo(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium ${
                        activePage === item.id
                          ? 'bg-[#0A1128] text-white font-semibold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{lang === 'ar' ? item.ar : item.en}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Tab Bar (<= 15% viewport height cap, 44px+ hitboxes) */}
      <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center h-14 px-2">
        <button
          type="button"
          onClick={() => navigateTo('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[44px] text-[10px] font-medium ${
            activePage === 'dashboard'
              ? 'text-[#0A1128] dark:text-blue-400 font-bold'
              : 'text-slate-500'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span className="mt-0.5">{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('people')}
          className={`flex flex-col items-center justify-center min-h-[44px] text-[10px] font-medium ${
            activePage === 'people' || activePage === 'person-details'
              ? 'text-[#0A1128] dark:text-blue-400 font-bold'
              : 'text-slate-500'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="mt-0.5">{lang === 'ar' ? 'الأشخاص' : 'People'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setPreselectedPersonForAdd(undefined);
            setIsAddModalOpen(true);
          }}
          className="flex flex-col items-center justify-center min-h-[44px] text-[10px] font-bold text-blue-700 dark:text-blue-400"
        >
          <div className="w-8 h-8 rounded-xl bg-[#0A1128] text-white flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('scanner')}
          className={`flex flex-col items-center justify-center min-h-[44px] text-[10px] font-medium ${
            activePage === 'scanner'
              ? 'text-[#0A1128] dark:text-blue-400 font-bold'
              : 'text-slate-500'
          }`}
        >
          <ScanLine className="w-4 h-4" />
          <span className="mt-0.5">{lang === 'ar' ? 'الماسح' : 'Scan'}</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('search')}
          className={`flex flex-col items-center justify-center min-h-[44px] text-[10px] font-medium ${
            activePage === 'search'
              ? 'text-[#0A1128] dark:text-blue-400 font-bold'
              : 'text-slate-500'
          }`}
        >
          <Search className="w-4 h-4" />
          <span className="mt-0.5">{lang === 'ar' ? 'بحث' : 'Search'}</span>
        </button>
      </nav>

      {/* Universal "+ Add New" Modal */}
      <UniversalAddModal
        isOpen={isAddModalOpen}
        lang={lang}
        people={people}
        preselectedPersonId={preselectedPersonForAdd}
        onClose={() => setIsAddModalOpen(false)}
        onNavigate={(page, opts) => {
          if (opts?.personId) setPreselectedPersonForAdd(opts.personId);
          setEditingRecord(null);
          setEditingPerson(null);
          navigateTo(page);
        }}
        onQuickCreateRecord={(rec) => {
          handleSaveRecord(rec);
        }}
        onQuickCreateCategory={(cat) => {
          setCustomCategories((prev) => [cat, ...prev]);
          navigateTo('custom-categories');
        }}
      />

      <OfflineIndicator lang={lang} />
    </div>
  );
}
