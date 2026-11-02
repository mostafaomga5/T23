import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Check,
  Trash2,
  FolderPlus,
  Clock,
  Shield,
  Lock,
  Globe,
  HardDrive,
  Download,
  UserCheck,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import {
  VaultReminder,
  VaultRecord,
  PersonProfile,
  CustomCategoryDef,
  ActivityLogEntry,
  AuthorizedRoleMember,
  SecuritySettingsState,
  Language,
  VaultCategoryKey,
} from '../types/vault';
import { computeExpirationStatus, recordsToJSON, recordsToCSV } from '../utils/vaultLogic';

/* 1. Reminders & Expiration Tracking View */
export const RemindersView: React.FC<{
  reminders: VaultReminder[];
  records: VaultRecord[];
  peopleMap: Record<string, PersonProfile>;
  lang: Language;
  onAddReminder: (rem: VaultReminder) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onSelectRecord: (recordId: string) => void;
}> = ({
  reminders,
  records,
  peopleMap,
  lang,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onSelectRecord,
}) => {
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('2026-12-15');
  const [personId, setPersonId] = useState('');
  const [notifyDays, setNotifyDays] = useState(30);

  const expiringRecords = records.filter((r) => {
    if (r.isArchived || !r.expirationDate) return false;
    const st = computeExpirationStatus(r.expirationDate);
    return st.status === 'expiring_soon' || st.status === 'expired';
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;
    onAddReminder({
      id: 'rem-' + Date.now(),
      personId: personId || undefined,
      titleAr: title.trim(),
      titleEn: title.trim(),
      category: 'custom',
      targetDate,
      notifyDaysBefore: notifyDays,
      isCompleted: false,
    });
    setTitle('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {lang === 'ar'
            ? 'التذكيرات الذكية وتتبع تواريخ الانتهاء'
            : 'Smart Reminders & Expiration Tracking'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {lang === 'ar'
            ? 'تنبيهات تلقائية لمواعيد تجديد جوازات السفر، الهويات، التأمين الطبي، الإقامات، ومتابعة الشكاوى المرتبطة بكل شخص.'
            : 'Automated tracking for passport renewals, IDs, insurance policies, work permits, and complaint follow-ups linked to each person.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'ar' ? 'التذكيرات المجدولة' : 'Scheduled Reminders'}
            </h2>
            <div className="space-y-3">
              {reminders.map((rem) => {
                const owner = rem.personId ? peopleMap[rem.personId] : undefined;
                const exp = computeExpirationStatus(rem.targetDate);
                return (
                  <div
                    key={rem.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                      rem.isCompleted
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => onToggleReminder(rem.id)}
                        className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center ${
                          rem.isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                        aria-label="Toggle reminder complete"
                      >
                        {rem.isCompleted && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {lang === 'ar' ? rem.titleAr : rem.titleEn}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {owner
                            ? `${owner.fullName}`
                            : lang === 'ar'
                            ? 'تذكير عام'
                            : 'General'}{' '}
                          · <span className="font-mono">{rem.targetDate}</span> ·{' '}
                          <span>
                            {lang === 'ar'
                              ? `تنبيه قبل ${rem.notifyDaysBefore} يوم`
                              : `Notify ${rem.notifyDaysBefore}d before`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {exp.daysRemaining !== null && !rem.isCompleted && (
                        <span className="text-xs font-mono font-semibold text-amber-600 tabular-nums">
                          {exp.daysRemaining}d
                        </span>
                      )}
                      {rem.recordId && (
                        <button
                          type="button"
                          onClick={() => onSelectRecord(rem.recordId!)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium"
                        >
                          {lang === 'ar' ? 'فتح الوثيقة' : 'View Doc'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteReminder(rem.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600"
                        aria-label="Delete reminder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Automated Document Expirations */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'ar'
                ? 'وثائق تقترب من تاريخ الانتهاء تلقائياً'
                : 'Documents Approaching Expiration'}
            </h2>
            {expiringRecords.map((rec) => {
              const owner = rec.personId ? peopleMap[rec.personId] : undefined;
              const exp = computeExpirationStatus(rec.expirationDate);
              return (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {lang === 'ar' ? rec.titleAr : rec.titleEn}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {owner?.fullName} · {rec.expirationDate} ({exp.daysRemaining}{' '}
                      {lang === 'ar' ? 'يوم متبقٍ' : 'days left'})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectRecord(rec.id)}
                    className="px-3 py-1.5 rounded-xl bg-[#0A1128] text-white text-xs font-semibold"
                  >
                    {lang === 'ar' ? 'مراجعة' : 'Inspect'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Custom Reminder Form */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            {lang === 'ar' ? '+ إضافة تذكير جديد' : '+ Add New Reminder'}
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ar' ? 'عنوان التذكير *' : 'Reminder Title *'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'مثال: تجديد إقامة الموظف / سداد فاتورة المياه'
                    : 'e.g., Renew Employee Work Permit'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ar' ? 'الشخص المرتبط (اختياري)' : 'Linked Person (Optional)'}
              </label>
              <select
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="">{lang === 'ar' ? 'عام' : 'General'}</option>
                {Object.values(peopleMap).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'التاريخ المستهدف' : 'Target Date'}
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'التنبيه قبل (أيام)' : 'Notify Before (Days)'}
                </label>
                <select
                  value={notifyDays}
                  onChange={(e) => setNotifyDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value={7}>7 {lang === 'ar' ? 'أيام' : 'Days'}</option>
                  <option value={30}>30 {lang === 'ar' ? 'يوماً' : 'Days'}</option>
                  <option value={60}>60 {lang === 'ar' ? 'يوماً' : 'Days'}</option>
                  <option value={90}>90 {lang === 'ar' ? 'يوماً' : 'Days'}</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-bold"
            >
              {lang === 'ar' ? 'حفظ التذكير' : 'Save Reminder'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* 2. Custom Categories & Business Organization Permissions View */
export const CustomCategoriesView: React.FC<{
  customCategories: CustomCategoryDef[];
  authorizedRoles: AuthorizedRoleMember[];
  lang: Language;
  onAddCategory: (cat: CustomCategoryDef) => void;
  onDeleteCategory: (id: string) => void;
  onAddAuthorizedRole: (member: AuthorizedRoleMember) => void;
}> = ({
  customCategories,
  authorizedRoles,
  lang,
  onAddCategory,
  onDeleteCategory,
  onAddAuthorizedRole,
}) => {
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [desc, setDesc] = useState('');

  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] =
    useState<AuthorizedRoleMember['role']>('Viewer');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {lang === 'ar'
            ? 'الفئات المخصصة وتنظيم العائلة والأعمال'
            : 'Custom Categories & Family/Business Organization'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {lang === 'ar'
            ? 'أنشئ عدداً غير محدود من الفئات المخصصة، ونظّم الصلاحيات الاختيارية لحسابات الأعمال والموظفين.'
            : 'Create unlimited user-defined categories and configure role-based access permissions for business and family organization.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'ar' ? 'الفئات المخصصة الحالية' : 'Your Custom Categories'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customCategories.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {lang === 'ar' ? c.nameAr : c.nameEn}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {lang === 'ar' ? c.descriptionAr : c.descriptionEn}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(c.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600"
                    aria-label="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Role-Based Business & Family Permissions */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'ar'
                  ? 'صلاحيات الوصول الاختيارية (الأعمال والعائلة)'
                  : 'Role-Based Authorized Users (Business & Family)'}
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              {lang === 'ar'
                ? 'جميع السجلات خاصة بصاحب الحساب افتراضياً. لا يُسمح لأي مستخدم بالوصول إلا للمجموعات المصرح بها صراحةً.'
                : 'All records are strictly private by default. Authorized roles only access explicitly permitted organizational groups.'}
            </p>
            <div className="space-y-2.5">
              {authorizedRoles.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {m.name} ({m.role})
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {m.email} · Groups: {m.allowedGroups.join(', ')}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600">
                    {lang === 'ar' ? 'مصرح' : 'Authorized'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Create Category & Add Role Forms */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!nameAr.trim() && !nameEn.trim()) return;
              onAddCategory({
                id: 'cat-' + Date.now(),
                nameAr: nameAr.trim() || nameEn.trim(),
                nameEn: nameEn.trim() || nameAr.trim(),
                descriptionAr: desc.trim() || 'فئة مخصصة',
                descriptionEn: desc.trim() || 'Custom category',
                iconName: 'Folder',
                colorClass: 'bg-slate-900 text-white',
                createdAt: new Date().toISOString(),
              });
              setNameAr('');
              setNameEn('');
              setDesc('');
            }}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'ar' ? '+ إنشاء فئة مخصصة جديدة' : '+ Create Custom Category'}
            </h3>
            <input
              type="text"
              required
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder={lang === 'ar' ? 'اسم الفئة بالعربية' : 'Category Name (Arabic)'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder={lang === 'ar' ? 'اسم الفئة بالإنجليزية' : 'Category Name (English)'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={lang === 'ar' ? 'وصف الفئة' : 'Description'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-bold"
            >
              {lang === 'ar' ? 'إضافة الفئة' : 'Add Category'}
            </button>
          </form>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!memberName.trim() || !memberEmail.trim()) return;
              onAddAuthorizedRole({
                id: 'role-' + Date.now(),
                name: memberName.trim(),
                email: memberEmail.trim(),
                role: memberRole,
                allowedGroups: ['employees'],
                status: 'active',
              });
              setMemberName('');
              setMemberEmail('');
            }}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'ar'
                ? '+ إضافة مستخدم مصرح (حساب أعمال)'
                : '+ Add Authorized User Role'}
            </h3>
            <input
              type="text"
              required
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder={lang === 'ar' ? 'اسم المستخدم المصرح' : 'Full Name'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
            <input
              type="email"
              required
              dir="ltr"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="user@company.sa"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
            <select
              value={memberRole}
              onChange={(e) =>
                setMemberRole(e.target.value as AuthorizedRoleMember['role'])
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              <option value="Administrator">Administrator</option>
              <option value="Manager">Manager</option>
              <option value="Document Editor">Document Editor</option>
              <option value="Viewer">Viewer</option>
            </select>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
            >
              {lang === 'ar' ? 'منح صلاحية مقيدة' : 'Grant Restricted Permission'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* 3. Recent Activity Log View */
export const RecentActivityView: React.FC<{
  logs: ActivityLogEntry[];
  peopleMap: Record<string, PersonProfile>;
  lang: Language;
}> = ({ logs, peopleMap, lang }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {lang === 'ar'
            ? 'سجل النشاط والعمليات الأخيرة'
            : 'Recent Activity & Audit Log'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {lang === 'ar'
            ? 'سجل زمني دقيق لعمليات النسخ، الإضافة، المسح الضوئي، التصدير، والمشاركة المشفرة (بدون تسجيل القيم السرية في السجلات).'
            : 'Chronological audit trail of copy actions, scans, edits, exports, and encrypted shares (without logging raw plaintext secrets).'}
        </p>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
        {logs.map((log) => {
          const person = log.personId ? peopleMap[log.personId] : undefined;
          return (
            <div
              key={log.id}
              className="p-4 sm:p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {lang === 'ar' ? log.titleAr : log.titleEn}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {log.actorName}
                    {person ? ` · ${person.fullName}` : ''}
                  </div>
                </div>
              </div>
              <div className="text-xs font-mono text-slate-400 tabular-nums shrink-0">
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* 4. Security, Profile, Language/Privacy & Storage Views */
export const SecuritySettingsView: React.FC<{
  settings: SecuritySettingsState;
  lang: Language;
  onUpdateSettings: (patch: Partial<SecuritySettingsState>) => void;
  onLockNow: () => void;
}> = ({ settings, lang, onUpdateSettings, onLockNow }) => {
  const [recoveryKeyShown, setRecoveryKeyShown] = useState(false);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {lang === 'ar'
              ? 'إعدادات الأمان والتشفير'
              : 'Security & Encryption Settings'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {lang === 'ar'
              ? 'إدارة التشفير المحلي AES-256-GCM، المصادقة الثنائية (MFA)، القفل التلقائي للجلسة، ومفتاح الاسترداد.'
              : 'Manage client-side AES-256-GCM encryption, Multi-Factor Authentication, auto-lock timers, and recovery keys.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onLockNow}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
        >
          <Lock className="w-4 h-4" />
          <span>{lang === 'ar' ? 'قفل الخزنة فوراً' : 'Lock Vault Immediately'}</span>
        </button>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <label className="flex items-center justify-between gap-4 py-2 cursor-pointer">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'ar'
                ? 'التشفير من طرف العميل (Client-Side AES-256-GCM)'
                : 'Client-Side Vault Encryption (AES-256-GCM)'}
            </div>
            <div className="text-xs text-slate-500">
              {lang === 'ar'
                ? 'تشفير محتويات الخزنة الحساسة ومرفقات المشاركة باستخدام مفتاح مشتق عبر PBKDF2.'
                : 'Encrypt sensitive vault payloads using Web Crypto API PBKDF2-SHA256.'}
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.clientEncryptionEnabled}
            onChange={(e) =>
              onUpdateSettings({ clientEncryptionEnabled: e.target.checked })
            }
            className="w-5 h-5 rounded border-slate-300"
          />
        </label>

        <label className="flex items-center justify-between gap-4 py-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'ar'
                ? 'المصادقة متعددة العوامل (Multi-Factor Authentication)'
                : 'Multi-Factor Authentication (MFA)'}
            </div>
            <div className="text-xs text-slate-500">
              {lang === 'ar'
                ? 'طلب رمز تحقق إضافي عند الدخول أو تصدير السجلات الحساسة.'
                : 'Require OTP verification code when signing in or exporting vault archives.'}
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.mfaEnabled}
            onChange={(e) => onUpdateSettings({ mfaEnabled: e.target.checked })}
            className="w-5 h-5 rounded border-slate-300"
          />
        </label>

        <label className="flex items-center justify-between gap-4 py-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'ar'
                ? 'إخفاء الأرقام الحساسة افتراضياً (Mask Sensitive Values)'
                : 'Mask Sensitive Numbers by Default'}
            </div>
            <div className="text-xs text-slate-500">
              {lang === 'ar'
                ? 'إخفاء أرقام الهويات وجوازات السفر والآيبان بنقاط (••••) حتى تضغط على زر الإظهار.'
                : 'Mask ID numbers, passports, and IBANs until explicitly revealed.'}
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.maskSensitiveByDefault}
            onChange={(e) =>
              onUpdateSettings({ maskSensitiveByDefault: e.target.checked })
            }
            className="w-5 h-5 rounded border-slate-300"
          />
        </label>

        <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'ar'
                ? 'مهلة القفل التلقائي عند عدم النشاط'
                : 'Automatic Session Lock Timeout'}
            </div>
            <div className="text-xs text-slate-500">
              {lang === 'ar'
                ? 'قفل الخزنة تلقائياً لحماية بياناتك في حال ترك الجهاز مفتوحاً.'
                : 'Automatically lock session after inactivity.'}
            </div>
          </div>
          <select
            value={settings.autoLockMinutes}
            onChange={(e) =>
              onUpdateSettings({ autoLockMinutes: Number(e.target.value) })
            }
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
          >
            <option value={1}>1 {lang === 'ar' ? 'دقيقة' : 'Minute'}</option>
            <option value={5}>5 {lang === 'ar' ? 'دقائق' : 'Minutes'}</option>
            <option value={15}>15 {lang === 'ar' ? 'دقيقة' : 'Minutes'}</option>
            <option value={30}>30 {lang === 'ar' ? 'دقيقة' : 'Minutes'}</option>
          </select>
        </div>

        {/* Recovery Key Box */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {lang === 'ar'
                ? 'مفتاح الاسترداد المشفر للطوارئ (Recovery Key)'
                : 'Emergency Vault Recovery Key'}
            </span>
            <button
              type="button"
              onClick={() => setRecoveryKeyShown((v) => !v)}
              className="text-xs font-semibold text-blue-700 dark:text-blue-400"
            >
              {recoveryKeyShown
                ? lang === 'ar'
                  ? 'إخفاء المفتاح'
                  : 'Hide Key'
                : lang === 'ar'
                ? 'إظهار مفتاح الاسترداد'
                : 'Reveal Recovery Key'}
            </button>
          </div>
          {recoveryKeyShown && (
            <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs tracking-wider text-center">
              VLT-9940-K82M-771Q-X90P-2026-ARGN
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const LanguageAndPrivacySettingsView: React.FC<{
  lang: Language;
  settings: SecuritySettingsState;
  records: VaultRecord[];
  peopleMap: Record<string, PersonProfile>;
  onChangeLanguage: (l: Language) => void;
  onUpdateSettings: (patch: Partial<SecuritySettingsState>) => void;
  onResetOrDeleteAll: () => void;
}> = ({
  lang,
  settings,
  records,
  peopleMap,
  onChangeLanguage,
  onUpdateSettings,
  onResetOrDeleteAll,
}) => {
  const [confirmPurge, setConfirmPurge] = useState(false);

  const exportFullBackup = (format: 'json' | 'csv') => {
    const content =
      format === 'json'
        ? recordsToJSON(records, undefined, peopleMap)
        : recordsToCSV(records, lang, peopleMap);
    const blob = new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-vault-complete-backup.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {lang === 'ar'
            ? 'إعدادات اللغة والخصوصية وحوكمة البيانات'
            : 'Language, Privacy & Data Governance'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {lang === 'ar'
            ? 'تحكم كامل في لغة الواجهة (RTL/LTR)، لغة تصدير ملفات PDF، موافقة الذكاء الاصطناعي، وتصدير أو حذف بياناتك.'
            : 'Control interface language (Arabic RTL / English LTR), PDF export defaults, AI OCR consent, and full data portability.'}
        </p>
      </div>

      {/* Language Switch Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {lang === 'ar' ? 'نظام اللغة واتجاه الواجهة' : 'Interface Language & Direction'}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChangeLanguage('ar')}
            className={`p-4 rounded-2xl border text-start transition-colors ${
              lang === 'ar'
                ? 'border-[#0A1128] bg-[#0A1128] text-white'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="text-sm font-bold">العربية (Arabic — RTL)</div>
            <div className="text-xs opacity-80 mt-0.5">
              اللغة الافتراضية مع محاذاة كاملة من اليمين إلى اليسار
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChangeLanguage('en')}
            className={`p-4 rounded-2xl border text-start transition-colors ${
              lang === 'en'
                ? 'border-[#0A1128] bg-[#0A1128] text-white'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="text-sm font-bold">English (LTR Interface)</div>
            <div className="text-xs opacity-80 mt-0.5">
              Complete English interface while preserving official document values
            </div>
          </button>
        </div>
      </div>

      {/* Privacy & Data Export */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'ar'
                ? 'الموافقة المسبقة لخدمة المسح الذكي (AI OCR Consent)'
                : 'Informed Consent for AI OCR Processing'}
            </div>
            <div className="text-xs text-slate-500">
              {lang === 'ar'
                ? 'عدم إرسال أي صورة مستند للمعالجة الذكية دون تأكيد موافقتك الصريحة.'
                : 'Never send private document images to AI OCR without explicit user consent.'}
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.aiOcrConsentDefault}
            onChange={(e) =>
              onUpdateSettings({ aiOcrConsentDefault: e.target.checked })
            }
            className="w-5 h-5 rounded border-slate-300"
          />
        </label>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'ar'
                ? 'تصدير كافة البيانات الشخصية (Data Portability)'
                : 'Export All Personal & Family Data'}
            </div>
            <div className="text-xs text-slate-500">
              {lang === 'ar'
                ? 'تنزيل نسخة كاملة من جميع الأشخاص والوثائق والأرقام بصيغة JSON أو CSV.'
                : 'Download a complete archive of all people and records in JSON or CSV.'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportFullBackup('json')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A1128] text-white text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              onClick={() => exportFullBackup('csv')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Permanent Account Data Deletion */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-red-600">
              {lang === 'ar'
                ? 'الحذف النهائي لبيانات الخزنة أو استعادة ضبط المصنع التجريبي'
                : 'Permanently Purge Vault Data / Reset Prototype'}
            </div>
            <div className="text-xs text-slate-500">
              {lang === 'ar'
                ? 'مسح جميع السجلات المضافة محلياً بشكل فوري ونهائي.'
                : 'Permanently wipe local vault storage.'}
            </div>
          </div>
          {!confirmPurge ? (
            <button
              type="button"
              onClick={() => setConfirmPurge(true)}
              className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50"
            >
              {lang === 'ar' ? 'مسح / إعادة ضبط الخزنة' : 'Purge / Reset Vault'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmPurge(false)}
                className="px-3 py-1.5 rounded-lg border text-xs"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetOrDeleteAll();
                  setConfirmPurge(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold"
              >
                {lang === 'ar' ? 'تأكيد المسح النهائي' : 'Confirm Purge'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ProfileSettingsView: React.FC<{
  owner: PersonProfile;
  lang: Language;
  onUpdateOwner: (updated: PersonProfile) => void;
}> = ({ owner, lang, onUpdateOwner }) => {
  const [name, setName] = useState(owner.fullName);
  const [phone, setPhone] = useState(owner.phone || '');
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {lang === 'ar' ? 'إعدادات الحساب الشخصي' : 'Account Owner Profile Settings'}
        </h1>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onUpdateOwner({ ...owner, fullName: name.trim() || owner.fullName, phone });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
        className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {lang === 'ar' ? 'اسم صاحب الحساب الرئيسي' : 'Primary Account Owner Name'}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {lang === 'ar' ? 'رقم الجوال الموثق' : 'Verified Mobile Number'}
          </label>
          <input
            type="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A1128] text-white text-xs font-bold"
        >
          <Check className="w-4 h-4" />
          <span>
            {saved
              ? lang === 'ar'
                ? 'تم حفظ التعديلات'
                : 'Saved!'
              : lang === 'ar'
              ? 'حفظ التغييرات'
              : 'Save Profile'}
          </span>
        </button>
      </form>
    </div>
  );
};

export const StorageManagementView: React.FC<{
  peopleCount: number;
  records: VaultRecord[];
  lang: Language;
}> = ({ peopleCount, records, lang }) => {
  const docsWithImages = records.filter((r) => r.frontImageUrl || r.backImageUrl).length;
  const totalFields = records.reduce((acc, r) => acc + r.fields.length, 0);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {lang === 'ar'
            ? 'إدارة المساحة التخزينية المشفرة'
            : 'Encrypted Vault Storage Management'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {lang === 'ar'
            ? 'لا توجد حدود مصطنعة على عدد الأشخاص أو السجلات؛ يتوسع التخزين المشفر وفق احتياجاتك.'
            : 'No artificial limits on people or documents; encrypted object and structured storage scales with your vault.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500">
            {lang === 'ar' ? 'الأشخاص والملفات الشخصية' : 'People Profiles'}
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-1">
            {peopleCount} / ∞
          </div>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500">
            {lang === 'ar' ? 'إجمالي الوثائق والسجلات' : 'Total Vault Records'}
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-1">
            {records.length} ({totalFields} {lang === 'ar' ? 'حقل' : 'fields'})
          </div>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500">
            {lang === 'ar' ? 'الصور الأصلية عالية الدقة' : 'High-Res Document Scans'}
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-1">
            {docsWithImages} (14.2 MB / 10 GB)
          </div>
        </div>
      </div>
    </div>
  );
};
