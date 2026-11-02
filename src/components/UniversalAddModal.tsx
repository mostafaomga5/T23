import React, { useState } from 'react';
import {
  X,
  UserPlus,
  FilePlus,
  ScanLine,
  Hash,
  StickyNote,
  FolderPlus,
  Layers,
  Check,
} from 'lucide-react';
import {
  Language,
  PageId,
  PersonProfile,
  VaultCategoryKey,
  VaultRecord,
  CustomCategoryDef,
} from '../types/vault';

interface UniversalAddModalProps {
  isOpen: boolean;
  lang: Language;
  people: PersonProfile[];
  preselectedPersonId?: string;
  onClose: () => void;
  onNavigate: (page: PageId, opts?: { personId?: string }) => void;
  onQuickCreateRecord: (record: VaultRecord) => void;
  onQuickCreateCategory: (cat: CustomCategoryDef) => void;
}

type QuickMode = 'menu' | 'number' | 'note' | 'category';

export const UniversalAddModal: React.FC<UniversalAddModalProps> = ({
  isOpen,
  lang,
  people,
  preselectedPersonId,
  onClose,
  onNavigate,
  onQuickCreateRecord,
  onQuickCreateCategory,
}) => {
  const [mode, setMode] = useState<QuickMode>('menu');
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [personId, setPersonId] = useState<string>(preselectedPersonId || '');
  const [category, setCategory] = useState<VaultCategoryKey>('government');
  const [catNameAr, setCatNameAr] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catDesc, setCatDesc] = useState('');

  if (!isOpen) return null;

  const resetAndClose = () => {
    setMode('menu');
    setTitle('');
    setValue('');
    setNotes('');
    setCatNameAr('');
    setCatNameEn('');
    setCatDesc('');
    onClose();
  };

  const handleSaveQuickRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const now = new Date().toISOString();
    const newRec: VaultRecord = {
      id: 'rec-' + Date.now(),
      personId: personId || undefined,
      recordKind: mode === 'number' ? 'number' : 'note',
      titleAr: title.trim(),
      titleEn: title.trim(),
      category: mode === 'number' ? category : 'custom',
      collectionId: 'col-my-docs',
      documentType: mode === 'number' ? 'quick_number' : 'quick_note',
      recordNumber: mode === 'number' ? value.trim() : '',
      descriptionAr: notes.trim() || (mode === 'number' ? 'رقم محفوظ للنسخ السريع' : 'ملاحظة شخصية محفوظة'),
      descriptionEn: notes.trim() || (mode === 'number' ? 'Saved quick reference number' : 'Saved personal note'),
      notesAr: notes.trim(),
      notesEn: notes.trim(),
      fields:
        mode === 'number' && value.trim()
          ? [
              {
                id: 'f-' + Date.now(),
                key: 'quick_val',
                labelAr: title.trim(),
                labelEn: title.trim(),
                value: value.trim(),
              },
            ]
          : [],
      tags: [mode === 'number' ? 'رقم سريع' : 'ملاحظة'],
      isFavorite: true,
      isArchived: false,
      usageCount: 1,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    onQuickCreateRecord(newRec);
    resetAndClose();
  };

  const handleSaveQuickCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameAr.trim() && !catNameEn.trim()) return;
    const ar = catNameAr.trim() || catNameEn.trim();
    const en = catNameEn.trim() || catNameAr.trim();

    onQuickCreateCategory({
      id: 'cat-' + Date.now(),
      nameAr: ar,
      nameEn: en,
      descriptionAr: catDesc.trim() || 'فئة مخصصة من إنشائك',
      descriptionEn: catDesc.trim() || 'User-created custom category',
      iconName: 'Folder',
      colorClass: 'bg-slate-900 text-white',
      createdAt: new Date().toISOString(),
    });
    resetAndClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={lang === 'ar' ? 'إضافة جديد إلى الخزنة' : 'Add New to Vault'}
    >
      <div className="w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {mode === 'menu'
                ? lang === 'ar'
                  ? '+ إضافة جديد إلى خزنتك الرقمية'
                  : '+ Add New to Your Digital Vault'
                : mode === 'number'
                ? lang === 'ar'
                  ? 'حفظ رقم مهم بخطوة واحدة'
                  : 'Save an Important Number'
                : mode === 'note'
                ? lang === 'ar'
                  ? 'إضافة ملاحظة أو معلومة سريعة'
                  : 'Add a Quick Note'
                : lang === 'ar'
                ? 'إنشاء فئة مخصصة جديدة'
                : 'Create a Custom Category'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'ar'
                ? 'اختر نوع المعلومة التي تريد إضافتها بأقل خطوات ممكنة'
                : 'Choose what you want to store with minimal steps'}
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-2 min-h-[40px] min-w-[40px] rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
            aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'menu' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            {/* 1. Add a Person */}
            <button
              type="button"
              onClick={() => {
                resetAndClose();
                onNavigate('add-person');
              }}
              className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-slate-800/60 text-start transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-[#0A1128] text-white flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'ar' ? 'إضافة شخص' : 'Add a Person'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'ar'
                    ? 'فرد عائلة، ابن، موظف، عامل، أو شريك عمل'
                    : 'Family member, child, employee, worker, or contact'}
                </div>
              </div>
            </button>

            {/* 2. Add a Document */}
            <button
              type="button"
              onClick={() => {
                resetAndClose();
                onNavigate('edit-document', { personId: preselectedPersonId });
              }}
              className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-slate-800/60 text-start transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
                <FilePlus className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'ar' ? 'إضافة مستند' : 'Add a Document'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'ar'
                    ? 'هوية، جواز سفر، شهادة ميلاد، عقد، أو بطاقة'
                    : 'ID, passport, birth certificate, contract, or card'}
                </div>
              </div>
            </button>

            {/* 3. Scan a Document */}
            <button
              type="button"
              onClick={() => {
                resetAndClose();
                onNavigate('scanner', { personId: preselectedPersonId });
              }}
              className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-slate-800/60 text-start transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <ScanLine className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'ar' ? 'مسح مستند (AI OCR)' : 'Scan a Document (AI OCR)'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'ar'
                    ? 'التقاط صورة واستخراج البيانات تلقائياً مع التدقيق'
                    : 'Camera or photo upload with automatic field extraction'}
                </div>
              </div>
            </button>

            {/* 4. Add a Number */}
            <button
              type="button"
              onClick={() => setMode('number')}
              className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-slate-800/60 text-start transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'ar' ? 'إضافة رقم مهم' : 'Add a Number'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'ar'
                    ? 'عداد كهرباء، رقم شكوى، آيبان، أو رقم مرجعي'
                    : 'Meter number, complaint ref, IBAN, or subscription ID'}
                </div>
              </div>
            </button>

            {/* 5. Add a Note */}
            <button
              type="button"
              onClick={() => setMode('note')}
              className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-slate-800/60 text-start transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0">
                <StickyNote className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'ar' ? 'إضافة ملاحظة' : 'Add a Note'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'ar'
                    ? 'عنوان وطني، تعليمات طبية، أو تفاصيل مهمة'
                    : 'Address details, medical instructions, or personal notes'}
                </div>
              </div>
            </button>

            {/* 6. Create a Category */}
            <button
              type="button"
              onClick={() => setMode('category')}
              className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-slate-800/60 text-start transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-700 text-white flex items-center justify-center shrink-0">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'ar' ? 'إنشاء فئة جديدة' : 'Create a Category'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'ar'
                    ? 'تخصيص قسم جديد للمركبات، العقارات، أو الأعمال'
                    : 'Create a custom category for vehicles, property, or travel'}
                </div>
              </div>
            </button>

            {/* 7. Add Anything Else */}
            <button
              type="button"
              onClick={() => {
                resetAndClose();
                onNavigate('edit-document', { personId: preselectedPersonId });
              }}
              className="sm:col-span-2 flex items-center justify-between gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-slate-400 text-start transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#0A1128] text-white flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {lang === 'ar'
                      ? 'إضافة أي معلومة مخصصة أخرى (حقول غير محدودة)'
                      : 'Add Anything Else (Unlimited Custom Fields & Attachments)'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'ar'
                      ? 'صمم سجلّك الخاص بأي عدد من الحقول والصور والملاحظات والتواريخ'
                      : 'Build any custom record with custom fields, dates, photos, and tags'}
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}

        {(mode === 'number' || mode === 'note') && (
          <form onSubmit={handleSaveQuickRecord} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {mode === 'number'
                  ? lang === 'ar'
                    ? 'اسم الرقم / البيان (مثال: عداد كهرباء الشقة، رقم شكوى المياه)'
                    : 'Number Title (e.g., Apartment Electricity Meter, Complaint Ref)'
                  : lang === 'ar'
                  ? 'عنوان الملاحظة'
                  : 'Note Title'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  mode === 'number'
                    ? lang === 'ar'
                      ? 'عداد الكهرباء الرئيسي'
                      : 'Main Electricity Meter'
                    : lang === 'ar'
                    ? 'عنوان المنزل الوطني والموقع'
                    : 'National Address Details'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            {mode === 'number' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'ar' ? 'الرقم أو القيمة المرجعية' : 'Number / Reference Value'}
                </label>
                <input
                  type="text"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="ELC-9948210"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm text-slate-900 dark:text-white"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'ar' ? 'ربط بشخص (اختياري)' : 'Assign to Person (Optional)'}
                </label>
                <select
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">
                    {lang === 'ar' ? 'عام — بدون شخص محدد' : 'General — Unassigned'}
                  </option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({lang === 'ar' ? p.relationshipLabelAr : p.relationshipLabelEn})
                    </option>
                  ))}
                </select>
              </div>

              {mode === 'number' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {lang === 'ar' ? 'الفئة' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VaultCategoryKey)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="government">
                      {lang === 'ar' ? 'الخدمات الحكومية والمرافق' : 'Government & Utilities'}
                    </option>
                    <option value="complaints">
                      {lang === 'ar' ? 'الطلبات والشكاوى' : 'Applications & Complaints'}
                    </option>
                    <option value="financial">
                      {lang === 'ar' ? 'البطاقات والحسابات المالية' : 'Financial Cards'}
                    </option>
                    <option value="contacts">
                      {lang === 'ar' ? 'أرقام الهواتف والطوارئ' : 'Phone & Contacts'}
                    </option>
                    <option value="memberships">
                      {lang === 'ar' ? 'العضويات والاشتراكات' : 'Memberships'}
                    </option>
                    <option value="custom">
                      {lang === 'ar' ? 'سجلات مخصصة' : 'Custom Records'}
                    </option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar' ? 'التفاصيل أو الملاحظات' : 'Details / Notes'}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'اكتب أي تفاصيل إضافية تود تذكرها...'
                    : 'Enter any additional details...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('menu')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                {lang === 'ar' ? 'رجوع' : 'Back'}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'ar' ? 'حفظ فوراً' : 'Save Now'}</span>
              </button>
            </div>
          </form>
        )}

        {mode === 'category' && (
          <form onSubmit={handleSaveQuickCategory} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar' ? 'اسم الفئة بالعربية' : 'Category Name (Arabic)'}
              </label>
              <input
                type="text"
                required
                value={catNameAr}
                onChange={(e) => setCatNameAr(e.target.value)}
                placeholder="مثال: وثائق السفر والتأشيرات"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar' ? 'اسم الفئة بالإنجليزية (اختياري)' : 'Category Name (English)'}
              </label>
              <input
                type="text"
                value={catNameEn}
                onChange={(e) => setCatNameEn(e.target.value)}
                placeholder="e.g., Travel Visas & Clearances"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar' ? 'وصف مختصر' : 'Short Description'}
              </label>
              <input
                type="text"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder={lang === 'ar' ? 'وصف لما سيتم حفظه في هذه الفئة' : 'Description of items in this category'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('menu')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                {lang === 'ar' ? 'رجوع' : 'Back'}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'ar' ? 'إنشاء الفئة' : 'Create Category'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
