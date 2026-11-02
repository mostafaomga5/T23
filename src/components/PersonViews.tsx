import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Calendar,
  FileText,
  Plus,
  Edit3,
  Trash2,
  Share2,
  ArrowRight,
  ArrowLeft,
  Check,
  Briefcase,
  Shield,
  CreditCard,
  FolderOpen,
} from 'lucide-react';
import {
  PersonProfile,
  VaultRecord,
  Language,
  OrganizationalGroupKey,
  PageId,
} from '../types/vault';
import { RecordCard } from './RecordCard';

const RELATIONSHIP_PRESETS: Array<{
  key: string;
  ar: string;
  en: string;
  defaultGroup: OrganizationalGroupKey;
}> = [
  { key: 'myself', ar: 'نفسي (صاحب الحساب)', en: 'Myself', defaultGroup: 'personal' },
  { key: 'wife', ar: 'الزوجة', en: 'Wife', defaultGroup: 'family' },
  { key: 'husband', ar: 'الزوج', en: 'Husband', defaultGroup: 'family' },
  { key: 'son', ar: 'الابن', en: 'Son', defaultGroup: 'family' },
  { key: 'daughter', ar: 'الابنة', en: 'Daughter', defaultGroup: 'family' },
  { key: 'father', ar: 'الأب', en: 'Father', defaultGroup: 'family' },
  { key: 'mother', ar: 'الأم', en: 'Mother', defaultGroup: 'family' },
  { key: 'brother', ar: 'الأخ', en: 'Brother', defaultGroup: 'family' },
  { key: 'sister', ar: 'الأخت', en: 'Sister', defaultGroup: 'family' },
  { key: 'friend', ar: 'صديق', en: 'Friend', defaultGroup: 'other' },
  { key: 'employee', ar: 'موظف', en: 'Employee', defaultGroup: 'employees' },
  { key: 'worker', ar: 'عامل / فني', en: 'Worker / Technician', defaultGroup: 'employees' },
  { key: 'business_partner', ar: 'شريك عمل', en: 'Business Partner', defaultGroup: 'business' },
  { key: 'custom', ar: 'صلة أو صفة أخرى مخصصة...', en: 'Custom Relationship / Role...', defaultGroup: 'other' },
];

const AVATAR_COLORS = [
  '#0A1128',
  '#1E3A8A',
  '#2563EB',
  '#0F766E',
  '#0369A1',
  '#4338CA',
  '#334155',
  '#B45309',
];

interface PeopleDirectoryViewProps {
  people: PersonProfile[];
  records: VaultRecord[];
  lang: Language;
  onSelectPerson: (personId: string) => void;
  onAddPerson: () => void;
  onAddInfoToPerson: (personId: string) => void;
}

export const PeopleDirectoryView: React.FC<PeopleDirectoryViewProps> = ({
  people,
  records,
  lang,
  onSelectPerson,
  onAddPerson,
  onAddInfoToPerson,
}) => {
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<OrganizationalGroupKey | 'all'>('all');

  const filteredPeople = people.filter((p) => {
    if (groupFilter !== 'all' && p.group !== groupFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.relationshipLabelAr.toLowerCase().includes(q) ||
      p.relationshipLabelEn.toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const groupTabs: Array<{ id: OrganizationalGroupKey | 'all'; ar: string; en: string }> = [
    { id: 'all', ar: 'جميع الأشخاص', en: 'All People' },
    { id: 'personal', ar: 'شخصي', en: 'Personal' },
    { id: 'family', ar: 'العائلة والأبناء', en: 'Family' },
    { id: 'employees', ar: 'الموظفون والعاملون', en: 'Employees & Workers' },
    { id: 'business', ar: 'شركاء الأعمال', en: 'Business' },
    { id: 'other', ar: 'أخرى', en: 'Other' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {lang === 'ar'
              ? 'دليل الأشخاص والملفات الشخصية'
              : 'People & Profiles Directory'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'ar'
              ? 'حساب واحد يدعم عدداً غير محدود من الأشخاص (العائلة، الأبناء، الموظفون، وشركاء العمل) مع فصل تام لوثائق كل شخص.'
              : 'One account supporting unlimited people (family, children, employees, and business contacts) with isolated document profiles.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddPerson}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{lang === 'ar' ? '+ إضافة شخص جديد' : '+ Add New Person'}</span>
        </button>
      </div>

      {/* Search & Group Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              lang === 'ar'
                ? 'ابحث باسم الشخص، صلة القرابة، الوظيفة، أو رقم الهاتف...'
                : 'Search by name, relationship, job title, or phone...'
            }
            className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
          {groupTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setGroupFilter(tab.id)}
              className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                groupFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {lang === 'ar' ? tab.ar : tab.en}
            </button>
          ))}
        </div>
      </div>

      {/* People Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPeople.map((person) => {
          const personRecords = records.filter(
            (r) => r.personId === person.id && !r.isArchived
          );
          const passportsCount = personRecords.filter(
            (r) => r.category === 'passports' || r.documentType === 'passport'
          ).length;
          const idCount = personRecords.filter((r) => r.category === 'identity').length;

          return (
            <div
              key={person.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl text-white font-bold text-base flex items-center justify-center shrink-0"
                      style={{ backgroundColor: person.avatarColor || '#0A1128' }}
                    >
                      {person.fullName.trim().slice(0, 2)}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectPerson(person.id)}
                        className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-400 text-start transition-colors"
                      >
                        {person.fullName}
                      </button>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-medium text-blue-700 dark:text-blue-400">
                          {lang === 'ar'
                            ? person.relationshipLabelAr
                            : person.relationshipLabelEn}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {personRecords.length}{' '}
                          {lang === 'ar' ? 'سجلات ووثائق' : 'records'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metadata summary */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-4">
                  {person.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono tabular-nums" dir="ltr">
                        {person.phone}
                      </span>
                    </div>
                  )}
                  {person.birthDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono tabular-nums">
                        {lang === 'ar' ? 'تاريخ الميلاد: ' : 'DOB: '}
                        {person.birthDate}
                      </span>
                    </div>
                  )}
                  {person.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 pt-1">
                      {person.notes}
                    </p>
                  )}
                </div>

                {/* Document breakdown line */}
                <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between mb-4">
                  <span>
                    {lang === 'ar' ? 'وثائق الهوية: ' : 'IDs: '}
                    <strong className="tabular-nums">{idCount}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {lang === 'ar' ? 'جوازات السفر: ' : 'Passports: '}
                    <strong className="tabular-nums">{passportsCount}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {lang === 'ar' ? 'الإجمالي: ' : 'Total: '}
                    <strong className="tabular-nums">{personRecords.length}</strong>
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onAddInfoToPerson(person.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'إضافة معلومة' : 'Add Info'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPerson(person.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  <span>{lang === 'ar' ? 'فتح ملف الشخص' : 'Open Profile'}</span>
                  {lang === 'ar' ? (
                    <ArrowLeft className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface AddEditPersonViewProps {
  lang: Language;
  editingPerson?: PersonProfile | null;
  onSavePerson: (person: PersonProfile) => void;
  onCancel: () => void;
}

export const AddEditPersonView: React.FC<AddEditPersonViewProps> = ({
  lang,
  editingPerson,
  onSavePerson,
  onCancel,
}) => {
  const [fullName, setFullName] = useState(editingPerson?.fullName || '');
  const [relationshipKey, setRelationshipKey] = useState(
    editingPerson?.relationshipKey || 'wife'
  );
  const [customRelAr, setCustomRelAr] = useState(
    editingPerson?.relationshipLabelAr || ''
  );
  const [customRelEn, setCustomRelEn] = useState(
    editingPerson?.relationshipLabelEn || ''
  );
  const [group, setGroup] = useState<OrganizationalGroupKey>(
    editingPerson?.group || 'family'
  );
  const [phone, setPhone] = useState(editingPerson?.phone || '');
  const [birthDate, setBirthDate] = useState(editingPerson?.birthDate || '');
  const [notes, setNotes] = useState(editingPerson?.notes || '');
  const [tagsInput, setTagsInput] = useState(
    editingPerson ? editingPerson.tags.join(', ') : ''
  );
  const [avatarColor, setAvatarColor] = useState(
    editingPerson?.avatarColor || '#1E3A8A'
  );

  const handlePresetChange = (key: string) => {
    setRelationshipKey(key);
    const preset = RELATIONSHIP_PRESETS.find((r) => r.key === key);
    if (preset && key !== 'custom') {
      setCustomRelAr(preset.ar);
      setCustomRelEn(preset.en);
      setGroup(preset.defaultGroup);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const preset = RELATIONSHIP_PRESETS.find((r) => r.key === relationshipKey);
    const labelAr =
      relationshipKey === 'custom'
        ? customRelAr.trim() || customRelEn.trim() || 'صلة مخصصة'
        : customRelAr.trim() || preset?.ar || 'عضو';
    const labelEn =
      relationshipKey === 'custom'
        ? customRelEn.trim() || customRelAr.trim() || 'Custom Role'
        : customRelEn.trim() || preset?.en || 'Member';

    const newPerson: PersonProfile = {
      id: editingPerson?.id || 'person-' + Date.now(),
      fullName: fullName.trim(),
      relationshipKey,
      relationshipLabelAr: labelAr,
      relationshipLabelEn: labelEn,
      group,
      phone: phone.trim() || undefined,
      birthDate: birthDate || undefined,
      notes: notes.trim() || undefined,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      avatarColor,
      isAccountOwner: editingPerson?.isAccountOwner || false,
      createdAt: editingPerson?.createdAt || new Date().toISOString(),
    };

    onSavePerson(newPerson);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {editingPerson
              ? lang === 'ar'
                ? 'تعديل بيانات الشخص'
                : 'Edit Person Profile'
              : lang === 'ar'
              ? 'إضافة شخص جديد إلى الخزنة'
              : 'Add a New Person Profile'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'ar'
              ? 'أنشئ ملفاً مستقلاً لأي فرد من العائلة أو موظف أو عامل أو شريك عمل لحفظ وثائقه وأرقامه بشكل منظم.'
              : 'Create an independent profile for a family member, child, employee, worker, or business contact.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {lang === 'ar' ? 'الاسم الكامل للشخص *' : 'Person Full Name *'}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'مثال: سارة طارق المنصور / م. أحمد محمود'
                  : 'e.g., Sara Tarek Al-Mansour / Eng. Ahmed Mahmoud'
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar' ? 'صلة القرابة أو الصفة الوظيفية' : 'Relationship or Role'}
              </label>
              <select
                value={relationshipKey}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                {RELATIONSHIP_PRESETS.map((r) => (
                  <option key={r.key} value={r.key}>
                    {lang === 'ar' ? r.ar : r.en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar' ? 'المجموعة التنظيمية' : 'Organizational Group'}
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value as OrganizationalGroupKey)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="personal">{lang === 'ar' ? 'شخصي' : 'Personal'}</option>
                <option value="family">{lang === 'ar' ? 'العائلة والأبناء' : 'Family'}</option>
                <option value="employees">
                  {lang === 'ar' ? 'الموظفون والعاملون' : 'Employees & Workers'}
                </option>
                <option value="business">
                  {lang === 'ar' ? 'الأعمال والشركاء' : 'Business'}
                </option>
                <option value="other">{lang === 'ar' ? 'أخرى' : 'Other'}</option>
              </select>
            </div>
          </div>

          {/* Customizable relationship label inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ar'
                  ? 'مسمى الصفة المخصص (عربي)'
                  : 'Custom Role Label (Arabic)'}
              </label>
              <input
                type="text"
                value={customRelAr}
                onChange={(e) => setCustomRelAr(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: موظف — محاسب قانوني' : 'Arabic role label'}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ar'
                  ? 'مسمى الصفة المخصص (إنجليزي)'
                  : 'Custom Role Label (English)'}
              </label>
              <input
                type="text"
                value={customRelEn}
                onChange={(e) => setCustomRelEn(e.target.value)}
                placeholder="e.g., Employee — Senior Accountant"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone Number (Optional)'}
              </label>
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+966 50 000 0000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar' ? 'تاريخ الميلاد (اختياري)' : 'Date of Birth (Optional)'}
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {lang === 'ar' ? 'لون الأيقونة التعريفية' : 'Profile Badge Color'}
            </label>
            <div className="flex items-center gap-2.5">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                  className={`w-9 h-9 rounded-xl transition-transform ${
                    avatarColor === color
                      ? 'ring-2 ring-offset-2 ring-blue-600 scale-105'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {lang === 'ar' ? 'ملاحظات حول الشخص (اختياري)' : 'Notes (Optional)'}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'أي ملاحظات مهمة تخص وثائق هذا الشخص أو أرقامه...'
                  : 'Any important notes regarding this person...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {lang === 'ar' ? 'وسوم مخصصة (مفصولة بفاصلة)' : 'Custom Tags (comma-separated)'}
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder={lang === 'ar' ? 'العائلة، سفر، تأمين' : 'family, travel, insurance'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{lang === 'ar' ? 'حفظ ملف الشخص' : 'Save Person Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PersonDetailsViewProps {
  person: PersonProfile;
  records: VaultRecord[];
  lang: Language;
  maskByDefault: boolean;
  onBack: () => void;
  onEditPerson: (person: PersonProfile) => void;
  onDeletePerson: (personId: string) => void;
  onAddInformationToPerson: (personId: string) => void;
  onSelectRecord: (recordId: string) => void;
  onToggleFavorite: (recordId: string) => void;
  onCopyValue: (val: string, label: string, recordId: string) => void;
  onSharePersonRecords: (personId: string) => void;
}

type PersonSectionTab =
  | 'overview'
  | 'identity'
  | 'passports'
  | 'cards'
  | 'contacts'
  | 'work'
  | 'government'
  | 'other'
  | 'notes';

export const PersonDetailsView: React.FC<PersonDetailsViewProps> = ({
  person,
  records,
  lang,
  maskByDefault,
  onBack,
  onEditPerson,
  onDeletePerson,
  onAddInformationToPerson,
  onSelectRecord,
  onToggleFavorite,
  onCopyValue,
  onSharePersonRecords,
}) => {
  const [activeTab, setActiveTab] = useState<PersonSectionTab>('overview');
  const [profileSearch, setProfileSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const personRecords = records.filter(
    (r) => r.personId === person.id && !r.isArchived
  );

  const filteredRecords = personRecords.filter((rec) => {
    if (profileSearch.trim()) {
      const q = profileSearch.toLowerCase();
      const match =
        rec.titleAr.toLowerCase().includes(q) ||
        rec.titleEn.toLowerCase().includes(q) ||
        rec.recordNumber.toLowerCase().includes(q) ||
        rec.fields.some(
          (f) =>
            f.labelAr.toLowerCase().includes(q) ||
            f.labelEn.toLowerCase().includes(q) ||
            f.value.toLowerCase().includes(q)
        );
      if (!match) return false;
    }

    if (activeTab === 'overview') return true;
    if (activeTab === 'identity') return rec.category === 'identity';
    if (activeTab === 'passports')
      return rec.category === 'passports' || rec.documentType === 'passport';
    if (activeTab === 'cards')
      return rec.category === 'financial' || rec.category === 'memberships';
    if (activeTab === 'contacts') return rec.category === 'contacts';
    if (activeTab === 'work') return rec.category === 'work';
    if (activeTab === 'government')
      return rec.category === 'government' || rec.category === 'complaints';
    if (activeTab === 'other') return rec.category === 'custom';
    if (activeTab === 'notes') return rec.recordKind === 'note' || Boolean(rec.notesAr || rec.notesEn);
    return true;
  });

  const sections: Array<{ id: PersonSectionTab; ar: string; en: string }> = [
    { id: 'overview', ar: 'نظرة عامة', en: 'Overview' },
    { id: 'identity', ar: 'وثائق الهوية', en: 'Identity Documents' },
    { id: 'passports', ar: 'جوازات السفر', en: 'Passports' },
    { id: 'cards', ar: 'البطاقات والعضويات', en: 'Cards' },
    { id: 'contacts', ar: 'بيانات الاتصال', en: 'Contact Information' },
    { id: 'work', ar: 'العمل والتعليم', en: 'Work & Education' },
    { id: 'government', ar: 'السجلات الحكومية', en: 'Government Records' },
    { id: 'other', ar: 'مستندات أخرى', en: 'Other Documents' },
    { id: 'notes', ar: 'الملاحظات', en: 'Notes' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl text-white font-bold text-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: person.avatarColor || '#0A1128' }}
            >
              {person.fullName.trim().slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <button
                  type="button"
                  onClick={onBack}
                  className="hover:text-slate-900 dark:hover:text-white underline"
                >
                  {lang === 'ar' ? 'دليل الأشخاص' : 'People Directory'}
                </button>
                <span aria-hidden="true">/</span>
                <span className="text-blue-700 dark:text-blue-400 font-semibold">
                  {lang === 'ar'
                    ? person.relationshipLabelAr
                    : person.relationshipLabelEn}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {person.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                {person.phone && (
                  <span className="font-mono tabular-nums" dir="ltr">
                    {person.phone}
                  </span>
                )}
                {person.birthDate && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {lang === 'ar' ? 'الميلاد: ' : 'DOB: '}
                      {person.birthDate}
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                  {personRecords.length}{' '}
                  {lang === 'ar' ? 'وثيقة وسجل محفوظ' : 'saved records'}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Actions including "+ Add Information to This Person" */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onAddInformationToPerson(person.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>
                {lang === 'ar'
                  ? '+ إضافة معلومة لهذا الشخص'
                  : '+ Add Information to This Person'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSharePersonRecords(person.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Share2 className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تصدير / مشاركة' : 'Export / Share'}</span>
            </button>

            <button
              type="button"
              onClick={() => onEditPerson(person)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Edit3 className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
            </button>

            {!person.isAccountOwner && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center"
                aria-label={lang === 'ar' ? 'حذف ملف الشخص' : 'Delete Person'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {confirmDelete && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-red-800 dark:text-red-200">
              {lang === 'ar'
                ? 'هل أنت متأكد من حذف ملف هذا الشخص؟ ستبقى سجلاته محفوظة كسجلات عامة غير مرتبطة.'
                : 'Delete this person profile? Associated records will remain safely stored as unassigned records.'}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-xs font-medium"
              >
                {lang === 'ar' ? 'تراجع' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => onDeletePerson(person.id)}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold"
              >
                {lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section Tabs + Search inside Person Profile */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveTab(sec.id)}
              className={`px-3 py-2 min-h-[38px] rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === sec.id
                  ? 'bg-[#0A1128] dark:bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {lang === 'ar' ? sec.ar : sec.en}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            type="text"
            value={profileSearch}
            onChange={(e) => setProfileSearch(e.target.value)}
            placeholder={
              lang === 'ar'
                ? 'بحث داخل ملف هذا الشخص...'
                : 'Search within this profile...'
            }
            className="w-full ps-8 pe-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Person Notes Summary when on Overview or Notes tab */}
      {(activeTab === 'overview' || activeTab === 'notes') && person.notes && (
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-4">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {lang === 'ar' ? 'ملاحظات الملف الشخصي:' : 'Profile Notes:'}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{person.notes}</p>
        </div>
      )}

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center">
          <FolderOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {lang === 'ar'
              ? 'لا توجد سجلات في هذا القسم حالياً'
              : 'No records in this section yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            {lang === 'ar'
              ? 'يمكنك إضافة أي مستند أو رقم أو بطاقة مباشرة إلى ملف هذا الشخص.'
              : 'You can add any document, passport, number, or custom record directly to this person.'}
          </p>
          <button
            type="button"
            onClick={() => onAddInformationToPerson(person.id)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>
              {lang === 'ar'
                ? '+ إضافة معلومة لهذا الشخص'
                : '+ Add Information to This Person'}
            </span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((rec) => (
            <RecordCard
              key={rec.id}
              record={rec}
              person={person}
              lang={lang}
              maskByDefault={maskByDefault}
              onSelectRecord={onSelectRecord}
              onToggleFavorite={onToggleFavorite}
              onCopyValue={onCopyValue}
              onShareRecord={() => onSharePersonRecords(person.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
