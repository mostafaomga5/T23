import React, { useState, useRef } from 'react';
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  Star,
  Share2,
  Edit3,
  Trash2,
  Archive,
  Files,
  Plus,
  RotateCw,
  Upload,
  User,
  Calendar,
  ArrowLeft,
  ArrowRight,
  FileText,
} from 'lucide-react';
import {
  VaultRecord,
  VaultField,
  PersonProfile,
  VaultCategoryKey,
  VaultCollection,
  CustomCategoryDef,
  Language,
  RecordKind,
} from '../types/vault';
import {
  maskSensitiveValue,
  formatRecordForCopy,
  computeExpirationStatus,
} from '../utils/vaultLogic';

interface DocumentDetailsViewProps {
  record: VaultRecord;
  person?: PersonProfile;
  lang: Language;
  maskByDefault: boolean;
  onBack: () => void;
  onEdit: (record: VaultRecord) => void;
  onDuplicate: (record: VaultRecord) => void;
  onToggleArchive: (recordId: string) => void;
  onToggleFavorite: (recordId: string) => void;
  onDelete: (recordId: string) => void;
  onShare: (recordId: string) => void;
  onCopyValue: (val: string, label: string, recordId: string) => void;
  onSelectPerson?: (personId: string) => void;
}

export const DocumentDetailsView: React.FC<DocumentDetailsViewProps> = ({
  record,
  person,
  lang,
  maskByDefault,
  onBack,
  onEdit,
  onDuplicate,
  onToggleArchive,
  onToggleFavorite,
  onDelete,
  onShare,
  onCopyValue,
  onSelectPerson,
}) => {
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>(
    record.fields.map((f) => f.id)
  );
  const [revealedFields, setRevealedFields] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [imgRotation, setImgRotation] = useState<number>(0);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const title = lang === 'ar' ? record.titleAr : record.titleEn;
  const description = lang === 'ar' ? record.descriptionAr : record.descriptionEn;
  const notes = lang === 'ar' ? record.notesAr : record.notesEn;
  const exp = computeExpirationStatus(record.expirationDate);

  const triggerCopy = (val: string, label: string, key: string) => {
    onCopyValue(val, label, record.id);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const toggleFieldSelect = (id: string) => {
    setSelectedFieldIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {lang === 'ar' ? (
              <ArrowRight className="w-4 h-4" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
            <span>{lang === 'ar' ? 'رجوع' : 'Back'}</span>
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {person ? (
                <button
                  type="button"
                  onClick={() => onSelectPerson && onSelectPerson(person.id)}
                  className="text-blue-700 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{person.fullName}</span>
                </button>
              ) : (
                <span>{lang === 'ar' ? 'سجل عام' : 'General Record'}</span>
              )}
              <span aria-hidden="true">·</span>
              <span>{record.documentType}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite(record.id)}
            className={`p-2.5 min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center ${
              record.isFavorite ? 'text-amber-500' : 'text-slate-400'
            }`}
            aria-label={lang === 'ar' ? 'تفضيل' : 'Favorite'}
          >
            <Star className="w-4 h-4" fill={record.isFavorite ? 'currentColor' : 'none'} />
          </button>

          <button
            type="button"
            onClick={() => onShare(record.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-semibold"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'مشاركة / PDF' : 'Share / PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(record)}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(record)}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
          >
            <Files className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تكرار' : 'Duplicate'}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleArchive(record.id)}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>
              {record.isArchived
                ? lang === 'ar'
                  ? 'استعادة من الأرشيف'
                  : 'Unarchive'
                : lang === 'ar'
                ? 'أرشفة'
                : 'Archive'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="p-2.5 min-h-[40px] min-w-[40px] rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 flex items-center justify-center"
            aria-label={lang === 'ar' ? 'حذف السجل' : 'Delete Record'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center justify-between gap-4">
          <span className="text-xs font-semibold text-red-800 dark:text-red-200">
            {lang === 'ar'
              ? 'هل أنت متأكد من حذف هذا السجل نهائياً؟'
              : 'Are you sure you want to permanently delete this record?'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-xs font-medium"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => onDelete(record.id)}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold"
            >
              {lang === 'ar' ? 'تأكيد الحذف النهائي' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Structured Fields & Multi-Copy Controls */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'ar'
                  ? 'البيانات والحقول التفصيلية (نسخ سريع)'
                  : 'Structured Record Fields & Quick Copy'}
              </h2>
              {description && (
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const formattedSelected = formatRecordForCopy(
                    record,
                    selectedFieldIds,
                    lang,
                    person?.fullName
                  );
                  triggerCopy(formattedSelected, title, 'selected_fields');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {copiedId === 'selected_fields' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>
                  {lang === 'ar'
                    ? `نسخ الحقول المحددة (${selectedFieldIds.length})`
                    : `Copy Selected (${selectedFieldIds.length})`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const fullText = formatRecordForCopy(
                    record,
                    undefined,
                    lang,
                    person?.fullName
                  );
                  triggerCopy(fullText, title, 'all_fields');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-semibold"
              >
                {copiedId === 'all_fields' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>
                  {lang === 'ar' ? 'نسخ السجل المنسق كاملاً' : 'Copy Full Record'}
                </span>
              </button>
            </div>
          </div>

          {/* Primary Reference Number */}
          {record.recordNumber && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-500">
                  {lang === 'ar'
                    ? 'الرقم المرجعي / رقم الوثيقة الأساسي'
                    : 'Primary Document / Reference Number'}
                </div>
                <div
                  className="font-mono text-lg font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums"
                  dir="ltr"
                >
                  {record.recordNumber}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  triggerCopy(record.recordNumber, title, 'primary_ref')
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-semibold"
              >
                {copiedId === 'primary_ref' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{lang === 'ar' ? 'تم النسخ' : 'Copied'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'نسخ الرقم' : 'Copy Number'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Individual Fields List */}
          <div className="space-y-2.5">
            {record.fields.map((f) => {
              const fLabel = lang === 'ar' ? f.labelAr : f.labelEn;
              const isRevealed =
                !maskByDefault || !f.isSensitive || revealedFields[f.id];
              const isChecked = selectedFieldIds.includes(f.id);

              return (
                <div
                  key={f.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleFieldSelect(f.id)}
                      className="rounded border-slate-300"
                      aria-label={fLabel}
                    />
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {fLabel}
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate tabular-nums mt-0.5">
                        {isRevealed ? f.value : maskSensitiveValue(f.value, 4)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {maskByDefault && f.isSensitive && (
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedFields((prev) => ({
                            ...prev,
                            [f.id]: !prev[f.id],
                          }))
                        }
                        className="p-2 min-h-[38px] min-w-[38px] rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
                        aria-label={lang === 'ar' ? 'إظهار / إخفاء' : 'Reveal / Mask'}
                      >
                        {isRevealed ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => triggerCopy(f.value, fLabel, f.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      {copiedId === f.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{lang === 'ar' ? 'تم النسخ' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'نسخ' : 'Copy'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dates & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {record.issueDate && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                <span className="text-slate-500">
                  {lang === 'ar' ? 'تاريخ الإصدار: ' : 'Issue Date: '}
                </span>
                <strong className="font-mono tabular-nums">{record.issueDate}</strong>
              </div>
            )}
            {record.expirationDate && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500">
                    {lang === 'ar' ? 'تاريخ الانتهاء: ' : 'Expiration Date: '}
                  </span>
                  <strong className="font-mono tabular-nums">
                    {record.expirationDate}
                  </strong>
                </div>
                <span
                  className={`font-semibold ${
                    exp.status === 'expired'
                      ? 'text-red-600'
                      : exp.status === 'expiring_soon'
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {exp.daysRemaining !== null
                    ? lang === 'ar'
                      ? `${exp.daysRemaining} يوم`
                      : `${exp.daysRemaining}d`
                    : ''}
                </span>
              </div>
            )}
          </div>

          {notes && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {lang === 'ar' ? 'ملاحظات إضافية:' : 'Additional Notes:'}
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line">
                {notes}
              </p>
            </div>
          )}
        </div>

        {/* Right: Stored Original Document Photographs (Kept Separate from Extracted Text) */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'ar'
                  ? 'الصور الأصلية للمستند'
                  : 'Original Document Photographs'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ar'
                  ? 'محفوظة بشكل منفصل عن الحقول النصية المستخرجة'
                  : 'Stored independently from extracted text fields'}
              </p>
            </div>
            {record.frontImageUrl && (
              <button
                type="button"
                onClick={() => setImgRotation((r) => (r + 90) % 360)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تدوير' : 'Rotate'}</span>
              </button>
            )}
          </div>

          {record.frontImageUrl ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {lang === 'ar' ? 'الوجه الأمامي (الأصل):' : 'Front Side (Original):'}
                </div>
                <div className="rounded-2xl bg-slate-950 p-3 overflow-hidden border border-slate-800">
                  <img
                    src={record.frontImageUrl}
                    alt={record.titleEn}
                    referrerPolicy="no-referrer"
                    style={{ transform: `rotate(${imgRotation}deg)` }}
                    className="w-full rounded-xl object-contain transition-transform"
                  />
                </div>
              </div>

              {record.backImageUrl && (
                <div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {lang === 'ar' ? 'الوجه الخلفي (الأصل):' : 'Back Side (Original):'}
                  </div>
                  <div className="rounded-2xl bg-slate-950 p-3 overflow-hidden border border-slate-800">
                    <img
                      src={record.backImageUrl}
                      alt={`${record.titleEn} Back`}
                      referrerPolicy="no-referrer"
                      style={{ transform: `rotate(${imgRotation}deg)` }}
                      className="w-full rounded-xl object-contain transition-transform"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 text-center">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                {lang === 'ar'
                  ? 'هذا السجل عبارة عن رقم أو بيان نصي بدون صورة مرفقة. يمكنك إضافة صورة من زر التعديل.'
                  : 'This record is a structured number/text record without attached photos. Click Edit to attach images.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface EditCreateDocumentViewProps {
  lang: Language;
  people: PersonProfile[];
  collections: VaultCollection[];
  customCategories: CustomCategoryDef[];
  editingRecord?: VaultRecord | null;
  preselectedPersonId?: string;
  preselectedCategory?: VaultCategoryKey;
  onSaveRecord: (record: VaultRecord) => void;
  onCancel: () => void;
}

export const EditCreateDocumentView: React.FC<EditCreateDocumentViewProps> = ({
  lang,
  people,
  collections,
  customCategories,
  editingRecord,
  preselectedPersonId,
  preselectedCategory,
  onSaveRecord,
  onCancel,
}) => {
  const [personId, setPersonId] = useState<string>(
    editingRecord?.personId ?? preselectedPersonId ?? ''
  );
  const [recordKind, setRecordKind] = useState<RecordKind>(
    editingRecord?.recordKind || 'document'
  );
  const [titleAr, setTitleAr] = useState<string>(editingRecord?.titleAr || '');
  const [titleEn, setTitleEn] = useState<string>(editingRecord?.titleEn || '');
  const [category, setCategory] = useState<VaultCategoryKey>(
    editingRecord?.category || preselectedCategory || 'identity'
  );
  const [customCategoryName, setCustomCategoryName] = useState<string>(
    editingRecord?.customCategoryName || ''
  );
  const [collectionId, setCollectionId] = useState<string>(
    editingRecord?.collectionId || collections[0]?.id || 'col-my-docs'
  );
  const [documentType, setDocumentType] = useState<string>(
    editingRecord?.documentType || 'custom_doc'
  );
  const [recordNumber, setRecordNumber] = useState<string>(
    editingRecord?.recordNumber || ''
  );
  const [descriptionAr, setDescriptionAr] = useState<string>(
    editingRecord?.descriptionAr || ''
  );
  const [issueDate, setIssueDate] = useState<string>(
    editingRecord?.issueDate || ''
  );
  const [expirationDate, setExpirationDate] = useState<string>(
    editingRecord?.expirationDate || ''
  );
  const [notesAr, setNotesAr] = useState<string>(editingRecord?.notesAr || '');
  const [tagsInput, setTagsInput] = useState<string>(
    editingRecord ? editingRecord.tags.join(', ') : ''
  );
  const [frontImageUrl, setFrontImageUrl] = useState<string>(
    editingRecord?.frontImageUrl || ''
  );
  const [backImageUrl, setBackImageUrl] = useState<string>(
    editingRecord?.backImageUrl || ''
  );
  const [fields, setFields] = useState<VaultField[]>(
    editingRecord?.fields || [
      {
        id: 'f-init-1',
        key: 'field_1',
        labelAr: 'البيان الأول / الاسم',
        labelEn: 'Primary Field / Name',
        value: '',
        isSensitive: false,
      },
    ]
  );

  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || '');
      if (side === 'front') setFrontImageUrl(url);
      else setBackImageUrl(url);
    };
    reader.readAsDataURL(file);
  };

  const addCustomField = () => {
    setFields((prev) => [
      ...prev,
      {
        id: 'f-' + Date.now() + '-' + prev.length,
        key: 'custom_' + (prev.length + 1),
        labelAr: '',
        labelEn: '',
        value: '',
        isSensitive: false,
      },
    ]);
  };

  const updateField = (id: string, patch: Partial<VaultField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
    );
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr.trim() && !titleEn.trim()) return;

    const cleanTitleAr = titleAr.trim() || titleEn.trim();
    const cleanTitleEn = titleEn.trim() || titleAr.trim();
    const now = new Date().toISOString();

    const cleanedFields = fields
      .filter((f) => f.labelAr.trim() || f.labelEn.trim() || f.value.trim())
      .map((f) => ({
        ...f,
        labelAr: f.labelAr.trim() || f.labelEn.trim() || 'حقل مخصص',
        labelEn: f.labelEn.trim() || f.labelAr.trim() || 'Custom Field',
      }));

    const newRec: VaultRecord = {
      id: editingRecord?.id || 'rec-' + Date.now(),
      personId: personId || undefined,
      recordKind,
      titleAr: cleanTitleAr,
      titleEn: cleanTitleEn,
      category,
      customCategoryName:
        category === 'custom' ? customCategoryName.trim() || 'سجلات مخصصة' : undefined,
      collectionId,
      documentType,
      recordNumber: recordNumber.trim(),
      descriptionAr: descriptionAr.trim() || cleanTitleAr,
      descriptionEn: descriptionAr.trim() || cleanTitleEn,
      issueDate: issueDate || undefined,
      expirationDate: expirationDate || undefined,
      notesAr: notesAr.trim() || undefined,
      notesEn: notesAr.trim() || undefined,
      frontImageUrl: frontImageUrl || undefined,
      backImageUrl: backImageUrl || undefined,
      fields: cleanedFields,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      isFavorite: editingRecord?.isFavorite ?? false,
      isArchived: editingRecord?.isArchived ?? false,
      usageCount: editingRecord?.usageCount ?? 1,
      status: editingRecord?.status || 'active',
      createdAt: editingRecord?.createdAt || now,
      updatedAt: now,
    };

    onSaveRecord(newRec);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {editingRecord
              ? lang === 'ar'
                ? 'تعديل الوثيقة أو السجل'
                : 'Edit Document or Record'
              : lang === 'ar'
              ? 'إنشاء وثيقة أو سجل مخصص جديد'
              : 'Create New Document or Custom Record'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar'
              ? 'أضف أي وثيقة أو رقم أو معلومة، اربطها بشخص محدد أو اتركها كسجل عام، وأضف عدداً غير محدود من الحقول.'
              : 'Store any document, number, or custom record, assign it to a person or keep it general, and add unlimited custom fields.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Person Assignment & Record Kind */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar'
                  ? 'الشخص صاحب الوثيقة (أو سجل عام)'
                  : 'Assigned Person (or General Record)'}
              </label>
              <select
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="">
                  {lang === 'ar'
                    ? 'سجل عام — غير مرتبط بشخص محدد (مثل عداد الكهرباء)'
                    : 'General Record — Unassigned (e.g., Utility Meter)'}
                </option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} (
                    {lang === 'ar'
                      ? p.relationshipLabelAr
                      : p.relationshipLabelEn}
                    )
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar' ? 'الفئة الرئيسية' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VaultCategoryKey)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="identity">
                  {lang === 'ar' ? 'الهوية الشخصية' : 'Personal Identity'}
                </option>
                <option value="passports">
                  {lang === 'ar' ? 'جوازات السفر' : 'Passports'}
                </option>
                <option value="government">
                  {lang === 'ar' ? 'الخدمات الحكومية والمرافق' : 'Government Services'}
                </option>
                <option value="work">
                  {lang === 'ar' ? 'العمل والموظفون والتعليم' : 'Work & Employees'}
                </option>
                <option value="financial">
                  {lang === 'ar' ? 'البطاقات والحسابات المالية' : 'Financial Cards'}
                </option>
                <option value="memberships">
                  {lang === 'ar' ? 'العضويات والتأمين' : 'Memberships & Insurance'}
                </option>
                <option value="complaints">
                  {lang === 'ar' ? 'الطلبات والشكاوى' : 'Applications & Complaints'}
                </option>
                <option value="contacts">
                  {lang === 'ar' ? 'أرقام الهواتف والطوارئ' : 'Phone & Contacts'}
                </option>
                <option value="custom">
                  {lang === 'ar' ? 'فئة مخصصة أخرى' : 'Custom Category'}
                </option>
              </select>
            </div>
          </div>

          {category === 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar' ? 'اسم الفئة المخصصة' : 'Custom Category Name'}
              </label>
              <input
                type="text"
                list="custom-cats-list"
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: المركبات، العقارات، السفر' : 'e.g., Vehicles, Real Estate'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
              <datalist id="custom-cats-list">
                {customCategories.map((c) => (
                  <option key={c.id} value={lang === 'ar' ? c.nameAr : c.nameEn} />
                ))}
              </datalist>
            </div>
          )}

          {/* Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar' ? 'عنوان الوثيقة أو السجل *' : 'Record Title *'}
              </label>
              <input
                type="text"
                required
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'مثال: عداد الكهرباء الرئيسي / جواز سفر سارة'
                    : 'e.g., Main Electricity Meter / Sara Passport'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar'
                  ? 'الرقم الأساسي / المرجعي (للنسخ السريع)'
                  : 'Primary Reference Number'}
              </label>
              <input
                type="text"
                dir="ltr"
                value={recordNumber}
                onChange={(e) => setRecordNumber(e.target.value)}
                placeholder="ELC-9948210 / A89420115"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar' ? 'تاريخ الإصدار / التسجيل (اختياري)' : 'Issue Date (Optional)'}
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar'
                  ? 'تاريخ الانتهاء / المتابعة (لتفعيل التذكيرات)'
                  : 'Expiration Date (Enables Smart Reminder)'}
              </label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
              />
            </div>
          </div>

          {/* Dynamic Custom Fields Section */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {lang === 'ar'
                  ? 'الحقول المخصصة (أضف أي عدد من الحقول والأرقام)'
                  : 'Custom Fields (Unlimited structured fields)'}
              </h3>
              <button
                type="button"
                onClick={addCustomField}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? '+ إضافة حقل' : '+ Add Field'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={field.labelAr}
                      onChange={(e) =>
                        updateField(field.id, {
                          labelAr: e.target.value,
                          labelEn: field.labelEn || e.target.value,
                        })
                      }
                      placeholder={lang === 'ar' ? 'اسم الحقل (مثال: رقم الحساب)' : 'Field Label'}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateField(field.id, { value: e.target.value })}
                      placeholder={lang === 'ar' ? 'القيمة أو الرقم' : 'Field Value'}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-1.5">
                    <label className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(field.isSensitive)}
                        onChange={(e) =>
                          updateField(field.id, { isSensitive: e.target.checked })
                        }
                        className="rounded border-slate-300"
                      />
                      <span>{lang === 'ar' ? 'سري' : 'Mask'}</span>
                    </label>
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                      aria-label="Remove field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Front & Back Image Attachments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageFile(e, 'front')}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => frontInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {frontImageUrl
                    ? lang === 'ar'
                      ? 'تغيير صورة الوجه الأمامي'
                      : 'Change Front Image'
                    : lang === 'ar'
                    ? 'إرفاق صورة الوجه الأمامي (اختياري)'
                    : 'Attach Front Image (Optional)'}
                </span>
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
              <input
                ref={backInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageFile(e, 'back')}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => backInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {backImageUrl
                    ? lang === 'ar'
                      ? 'تغيير صورة الوجه الخلفي'
                      : 'Change Back Image'
                    : lang === 'ar'
                    ? 'إرفاق صورة الوجه الخلفي (اختياري)'
                    : 'Attach Back Image (Optional)'}
                </span>
              </button>
            </div>
          </div>

          {/* Notes & Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {lang === 'ar' ? 'ملاحظات إضافية' : 'Notes'}
            </label>
            <textarea
              rows={3}
              value={notesAr}
              onChange={(e) => setNotesAr(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {lang === 'ar' ? 'الوسوم (مفصولة بفاصلة)' : 'Tags (comma-separated)'}
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder={lang === 'ar' ? 'مهم، رسمي، منزل' : 'important, official, home'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-bold hover:bg-slate-800"
            >
              <Check className="w-4 h-4" />
              <span>{lang === 'ar' ? 'حفظ السجل في الخزنة' : 'Save Record to Vault'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
