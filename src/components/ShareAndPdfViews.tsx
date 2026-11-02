import React, { useState } from 'react';
import {
  Share2,
  FileText,
  Download,
  Copy,
  Check,
  Lock,
  Printer,
  Image as ImageIcon,
  Code,
  ShieldCheck,
  Ban,
  Eye,
} from 'lucide-react';
import {
  VaultRecord,
  PersonProfile,
  Language,
  PdfExportLanguageMode,
  EncryptedShareLink,
} from '../types/vault';
import {
  formatRecordForCopy,
  recordsToCSV,
  recordsToJSON,
} from '../utils/vaultLogic';
import { encryptVaultPayload, sha256Hex } from '../utils/cryptoEngine';

interface ShareCenterViewProps {
  records: VaultRecord[];
  peopleMap: Record<string, PersonProfile>;
  lang: Language;
  preselectedRecordIds?: string[];
  shareLinks: EncryptedShareLink[];
  onCreateShareLink: (link: EncryptedShareLink) => void;
  onRevokeShareLink: (token: string) => void;
  onOpenPdfPreview: (
    recordIds: string[],
    selectedFields: Record<string, string[]>,
    pdfLangMode: PdfExportLanguageMode,
    includeImages: boolean
  ) => void;
  onLogExportActivity: (descAr: string, descEn: string) => void;
}

type ExportFormatType = 'text' | 'pdf' | 'images' | 'json' | 'csv' | 'encrypted_link';

export const ShareCenterView: React.FC<ShareCenterViewProps> = ({
  records,
  peopleMap,
  lang,
  preselectedRecordIds = [],
  shareLinks,
  onCreateShareLink,
  onRevokeShareLink,
  onOpenPdfPreview,
  onLogExportActivity,
}) => {
  const activeRecords = records.filter((r) => !r.isArchived);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>(
    preselectedRecordIds.length > 0
      ? preselectedRecordIds
      : activeRecords.slice(0, 2).map((r) => r.id)
  );
  const [selectedFieldsByRecord, setSelectedFieldsByRecord] = useState<
    Record<string, string[]>
  >({});
  const [exportFormat, setExportFormat] = useState<ExportFormatType>('text');
  const [pdfLangMode, setPdfLangMode] = useState<PdfExportLanguageMode>('bilingual');
  const [includeImages, setIncludeImages] = useState<boolean>(true);
  const [userConfirmedSelection, setUserConfirmedSelection] = useState<boolean>(false);
  const [copiedPreview, setCopiedPreview] = useState<boolean>(false);

  // Encrypted link options
  const [linkTitle, setLinkTitle] = useState<string>(
    lang === 'ar' ? 'حزمة وثائق مشفرة للمراجعة' : 'Encrypted Document Package'
  );
  const [expiresInHours, setExpiresInHours] = useState<number>(24);
  const [linkPassword, setLinkPassword] = useState<string>('');
  const [maxViews, setMaxViews] = useState<number>(3);
  const [creatingLink, setCreatingLink] = useState<boolean>(false);

  const chosenRecords = activeRecords.filter((r) =>
    selectedRecordIds.includes(r.id)
  );

  const toggleRecordSelection = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setUserConfirmedSelection(false);
  };

  const toggleFieldSelection = (recordId: string, fieldId: string, allFieldIds: string[]) => {
    setSelectedFieldsByRecord((prev) => {
      const current = prev[recordId] || allFieldIds;
      const updated = current.includes(fieldId)
        ? current.filter((id) => id !== fieldId)
        : [...current, fieldId];
      return { ...prev, [recordId]: updated };
    });
    setUserConfirmedSelection(false);
  };

  // Generate live preview string
  const generatePreviewText = (): string => {
    if (chosenRecords.length === 0) {
      return lang === 'ar'
        ? 'يرجى اختيار سجل واحد على الأقل للمعاينة.'
        : 'Please select at least one record to preview.';
    }
    if (exportFormat === 'csv') {
      return recordsToCSV(chosenRecords, lang, peopleMap);
    }
    if (exportFormat === 'json') {
      return recordsToJSON(chosenRecords, selectedFieldsByRecord, peopleMap);
    }
    return chosenRecords
      .map((rec) => {
        const owner = rec.personId ? peopleMap[rec.personId]?.fullName : undefined;
        return formatRecordForCopy(
          rec,
          selectedFieldsByRecord[rec.id],
          lang,
          owner
        );
      })
      .join('\n\n------------------------\n\n');
  };

  const previewContent = generatePreviewText();

  const handleCopyPreview = () => {
    if (!userConfirmedSelection) return;
    navigator.clipboard?.writeText(previewContent);
    setCopiedPreview(true);
    onLogExportActivity(
      `نسخ نص منسق لعدد (${chosenRecords.length}) سجلات من مركز المشاركة`,
      `Copied formatted text for ${chosenRecords.length} records from Share Center`
    );
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  const handleDownloadFile = (content: string, filename: string, mime: string) => {
    if (!userConfirmedSelection) return;
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onLogExportActivity(
      `تصدير ملف ${filename} من مركز المشاركة`,
      `Exported file ${filename} from Share Center`
    );
  };

  const handleCreateEncryptedLink = async () => {
    if (!userConfirmedSelection || chosenRecords.length === 0) return;
    setCreatingLink(true);
    try {
      const secretPass = linkPassword.trim() || 'vault-default-session-key';
      const encryptedPayload = await encryptVaultPayload(previewContent, secretPass);
      const passwordHash = linkPassword.trim()
        ? await sha256Hex(linkPassword.trim())
        : '';

      const response = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: linkTitle,
          expiresInHours,
          passwordProtected: Boolean(linkPassword.trim()),
          passwordHash,
          maxViews,
          encryptedPayload,
          includedRecordTitles: chosenRecords.map((r) =>
            lang === 'ar' ? r.titleAr : r.titleEn
          ),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        onCreateShareLink({
          ...data,
          plainPasswordHint: linkPassword.trim() ? '••••' : undefined,
          encryptedPayload,
        });
        onLogExportActivity(
          `إنشاء رابط مشاركة مشفر (${linkTitle}) بصلاحية ${expiresInHours} ساعة`,
          `Created encrypted expiring share link (${linkTitle})`
        );
      }
    } finally {
      setCreatingLink(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {lang === 'ar'
            ? 'مركز المشاركة والتصدير الآمن'
            : 'Secure Share & Export Center'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {lang === 'ar'
            ? 'اختر السجلات والحقول المحددة بدقة من شخص واحد أو عدة أشخاص، وعاين النتيجة الكاملة قبل التصدير أو المشاركة المشفرة.'
            : 'Select records across one or multiple people, choose exact fields to include, preview the complete output, and confirm before exporting.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Steps 1-4: Selection & Format Configuration */}
        <div className="lg:col-span-7 space-y-5">
          {/* Step 1 & 2: Select Records & Granular Fields */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {lang === 'ar'
                ? 'الخطوة 1 و 2: اختر السجلات والحقول المطلوب تضمينها فقط'
                : 'Step 1 & 2: Select Records and Specific Fields to Include'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              {lang === 'ar'
                ? 'لن يتم تضمين أي وثيقة أو معلومة لم تقم باختيارها صراحةً.'
                : 'Only explicitly selected records and checked fields will be included.'}
            </p>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pe-1">
              {activeRecords.map((rec) => {
                const isSelected = selectedRecordIds.includes(rec.id);
                const owner = rec.personId ? peopleMap[rec.personId] : undefined;
                const allFieldIds = rec.fields.map((f) => f.id);
                const checkedFields = selectedFieldsByRecord[rec.id] || allFieldIds;

                return (
                  <div
                    key={rec.id}
                    className={`p-4 rounded-2xl border transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <label className="flex items-start justify-between gap-3 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRecordSelection(rec.id)}
                          className="mt-1 rounded border-slate-300"
                        />
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {lang === 'ar' ? rec.titleAr : rec.titleEn}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {owner
                              ? `${owner.fullName} (${
                                  lang === 'ar'
                                    ? owner.relationshipLabelAr
                                    : owner.relationshipLabelEn
                                })`
                              : lang === 'ar'
                              ? 'سجل عام'
                              : 'General Record'}{' '}
                            · <span className="font-mono">{rec.recordNumber}</span>
                          </div>
                        </div>
                      </div>
                    </label>

                    {isSelected && rec.fields.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 ps-7 flex flex-wrap gap-2">
                        {rec.fields.map((f) => {
                          const fChecked = checkedFields.includes(f.id);
                          return (
                            <label
                              key={f.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                                fChecked
                                  ? 'bg-white dark:bg-slate-800 border-blue-500 text-slate-900 dark:text-white font-medium'
                                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={fChecked}
                                onChange={() =>
                                  toggleFieldSelection(rec.id, f.id, allFieldIds)
                                }
                                className="rounded border-slate-300"
                              />
                              <span>{lang === 'ar' ? f.labelAr : f.labelEn}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Export Format */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'ar'
                ? 'الخطوة 3: اختر صيغة التصدير أو المشاركة'
                : 'Step 3: Choose Export or Sharing Format'}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'text',
                  ar: 'نص منظم (واتساب / إيميل)',
                  en: 'Formatted Text (WhatsApp)',
                  icon: FileText,
                },
                {
                  id: 'pdf',
                  ar: 'وثيقة PDF احترافية',
                  en: 'Professional PDF',
                  icon: Printer,
                },
                {
                  id: 'images',
                  ar: 'الصور الأصلية للمستندات',
                  en: 'Original Document Images',
                  icon: ImageIcon,
                },
                {
                  id: 'encrypted_link',
                  ar: 'رابط مشفر مؤقت',
                  en: 'Encrypted Expiring Link',
                  icon: Lock,
                },
                {
                  id: 'json',
                  ar: 'بيانات مهيكلة (JSON)',
                  en: 'Structured JSON',
                  icon: Code,
                },
                {
                  id: 'csv',
                  ar: 'جدول بيانات (CSV)',
                  en: 'Spreadsheet CSV',
                  icon: Share2,
                },
              ].map((fmt) => {
                const Icon = fmt.icon;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setExportFormat(fmt.id as ExportFormatType)}
                    className={`p-3.5 rounded-2xl border text-start transition-colors flex flex-col justify-between gap-2 ${
                      exportFormat === fmt.id
                        ? 'border-[#0A1128] bg-[#0A1128] text-white dark:border-blue-500 dark:bg-blue-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                      {lang === 'ar' ? fmt.ar : fmt.en}
                    </span>
                  </button>
                );
              })}
            </div>

            {exportFormat === 'pdf' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'لغة واتجاه ملف PDF:' : 'PDF Layout & Language:'}
                  </span>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    {(['ar', 'en', 'bilingual'] as PdfExportLanguageMode[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPdfLangMode(m)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          pdfLangMode === m
                            ? 'bg-[#0A1128] text-white'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {m === 'ar'
                          ? 'عربي (RTL)'
                          : m === 'en'
                          ? 'English (LTR)'
                          : lang === 'ar'
                          ? 'ثنائي اللغة (AR + EN)'
                          : 'Bilingual (AR + EN)'}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span>
                    {lang === 'ar'
                      ? 'تضمين الصور الأصلية للمستندات المختارة داخل ملف PDF'
                      : 'Include original document scan photographs inside PDF'}
                  </span>
                </label>
              </div>
            )}

            {exportFormat === 'encrypted_link' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'ar' ? 'مدة الصلاحية (ساعات)' : 'Expiration (Hours)'}
                    </label>
                    <select
                      value={expiresInHours}
                      onChange={(e) => setExpiresInHours(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    >
                      <option value={1}>1 {lang === 'ar' ? 'ساعة' : 'Hour'}</option>
                      <option value={24}>24 {lang === 'ar' ? 'ساعة' : 'Hours'}</option>
                      <option value={72}>3 {lang === 'ar' ? 'أيام' : 'Days'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'ar' ? 'الحد الأقصى للمشاهدات' : 'Max Allowed Views'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={maxViews}
                      onChange={(e) => setMaxViews(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'ar' ? 'كلمة مرور الرابط (اختياري)' : 'Access Password'}
                    </label>
                    <input
                      type="password"
                      value={linkPassword}
                      onChange={(e) => setLinkPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Steps 5-7: Complete Live Preview, Explicit Confirmation & Action */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'ar'
                ? 'الخطوة 4 و 5: معاينة النتيجة الكاملة والتأكيد'
                : 'Step 4 & 5: Complete Result Preview & Confirmation'}
            </h2>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {chosenRecords.length} {lang === 'ar' ? 'سجلات' : 'records'}
            </span>
          </div>

          {exportFormat === 'images' ? (
            <div className="grid grid-cols-1 gap-3 max-h-[320px] overflow-y-auto p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              {chosenRecords.filter((r) => r.frontImageUrl).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  {lang === 'ar'
                    ? 'السجلات المختارة لا تحتوي على صور مرفقة.'
                    : 'Selected records do not have attached document images.'}
                </p>
              ) : (
                chosenRecords.map((rec) =>
                  rec.frontImageUrl ? (
                    <div key={rec.id} className="space-y-1.5">
                      <div className="text-xs font-semibold">
                        {lang === 'ar' ? rec.titleAr : rec.titleEn}
                      </div>
                      <img
                        src={rec.frontImageUrl}
                        alt={rec.titleEn}
                        referrerPolicy="no-referrer"
                        className="w-full rounded-xl border border-slate-200"
                      />
                    </div>
                  ) : null
                )
              )}
            </div>
          ) : (
            <pre
              className="w-full h-64 overflow-auto p-4 rounded-2xl bg-slate-950 text-slate-100 text-xs font-mono leading-relaxed whitespace-pre-wrap"
              dir={exportFormat === 'json' || exportFormat === 'csv' ? 'ltr' : lang === 'ar' ? 'rtl' : 'ltr'}
            >
              {previewContent}
            </pre>
          )}

          {/* Explicit Confirmation Gate */}
          <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={userConfirmedSelection}
              onChange={(e) => setUserConfirmedSelection(e.target.checked)}
              className="mt-0.5 rounded border-slate-300"
            />
            <span>
              {lang === 'ar'
                ? 'أؤكد مراجعة المعاينة أعلاه والموافقة الصريحة على تصدير أو مشاركة هذه الحقول المختارة فقط.'
                : 'I have reviewed the complete preview above and explicitly confirm exporting or sharing only these selected fields.'}
            </span>
          </label>

          {/* Export / Share Execution Buttons */}
          <div className="space-y-2.5">
            {exportFormat === 'pdf' ? (
              <button
                type="button"
                disabled={!userConfirmedSelection || chosenRecords.length === 0}
                onClick={() =>
                  onOpenPdfPreview(
                    selectedRecordIds,
                    selectedFieldsByRecord,
                    pdfLangMode,
                    includeImages
                  )
                }
                className="w-full py-3 px-4 min-h-[46px] rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {lang === 'ar'
                    ? 'فتح معاينة طباعة وتصدير وثيقة PDF'
                    : 'Open Printable PDF Dossier Preview'}
                </span>
              </button>
            ) : exportFormat === 'encrypted_link' ? (
              <button
                type="button"
                disabled={!userConfirmedSelection || chosenRecords.length === 0 || creatingLink}
                onClick={handleCreateEncryptedLink}
                className="w-full py-3 px-4 min-h-[46px] rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {creatingLink
                    ? lang === 'ar'
                      ? 'جاري التشفير وإنشاء الرابط...'
                      : 'Encrypting & Creating Link...'
                    : lang === 'ar'
                    ? 'إنشاء رابط مشاركة مشفر ومؤقت (AES-256-GCM)'
                    : 'Generate Encrypted Expiring Share Link'}
                </span>
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={!userConfirmedSelection || chosenRecords.length === 0}
                  onClick={handleCopyPreview}
                  className="py-3 px-4 min-h-[46px] rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {copiedPreview ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{lang === 'ar' ? 'تم النسخ للحافظة' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'نسخ المحتوى المنسق' : 'Copy Formatted Output'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={!userConfirmedSelection || chosenRecords.length === 0}
                  onClick={() => {
                    const ext =
                      exportFormat === 'csv'
                        ? 'csv'
                        : exportFormat === 'json'
                        ? 'json'
                        : 'txt';
                    const mime =
                      exportFormat === 'csv'
                        ? 'text/csv;charset=utf-8'
                        : exportFormat === 'json'
                        ? 'application/json'
                        : 'text/plain;charset=utf-8';
                    handleDownloadFile(
                      previewContent,
                      `my-vault-export-${Date.now()}.${ext}`,
                      mime
                    );
                  }}
                  className="py-3 px-4 min-h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تنزيل الملف' : 'Download File'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Encrypted Share Links & Access Logs */}
      {shareLinks.length > 0 && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'ar'
                ? 'روابط المشاركة المشفرة وسجل الوصول (Access Logs)'
                : 'Active Encrypted Share Links & Access Logs'}
            </h2>
          </div>

          <div className="space-y-3">
            {shareLinks.map((lnk) => (
              <div
                key={lnk.token}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {lnk.title}
                    </span>
                    <span className="text-xs text-slate-500">·</span>
                    <span
                      className={`text-xs font-semibold ${
                        lnk.revoked ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {lnk.revoked
                        ? lang === 'ar'
                          ? 'ملغى (تم سحب الصلاحية)'
                          : 'Revoked'
                        : lang === 'ar'
                        ? 'نشط ومشفر'
                        : 'Active & Encrypted'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Token: {lnk.token} · Views: {lnk.viewCount}/{lnk.maxViews} · Expires:{' '}
                    {new Date(lnk.expiresAt).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {lang === 'ar' ? 'آخر سجل وصول: ' : 'Latest Access Log: '}
                    {lnk.accessLogs[0]?.actorNote} (
                    {new Date(lnk.accessLogs[0]?.timestamp).toLocaleTimeString()})
                  </div>
                </div>

                {!lnk.revoked && (
                  <button
                    type="button"
                    onClick={() => onRevokeShareLink(lnk.token)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 shrink-0"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'إلغاء الرابط فوراً' : 'Revoke Link'}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface PdfPreviewViewProps {
  records: VaultRecord[];
  peopleMap: Record<string, PersonProfile>;
  selectedFieldsByRecord: Record<string, string[]>;
  pdfLangMode: PdfExportLanguageMode;
  includeImages: boolean;
  lang: Language;
  onChangePdfLangMode: (mode: PdfExportLanguageMode) => void;
  onBackToShare: () => void;
}

export const PdfPreviewView: React.FC<PdfPreviewViewProps> = ({
  records,
  peopleMap,
  selectedFieldsByRecord,
  pdfLangMode,
  includeImages,
  lang,
  onChangePdfLangMode,
  onBackToShare,
}) => {
  const isRtl = pdfLangMode === 'ar' || (pdfLangMode === 'bilingual' && lang === 'ar');

  return (
    <div className="space-y-6">
      {/* Non-Print Control Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToShare}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            {lang === 'ar' ? 'العودة لمركز المشاركة' : 'Back to Share Center'}
          </button>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['ar', 'en', 'bilingual'] as PdfExportLanguageMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onChangePdfLangMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  pdfLangMode === m
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {m === 'ar'
                  ? 'عربي (RTL)'
                  : m === 'en'
                  ? 'English (LTR)'
                  : 'Bilingual (AR + EN)'}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] rounded-xl bg-[#0A1128] text-white text-xs font-bold hover:bg-slate-800"
        >
          <Printer className="w-4 h-4" />
          <span>{lang === 'ar' ? 'طباعة / حفظ كملف PDF' : 'Print / Save as PDF'}</span>
        </button>
      </div>

      {/* Printable A4 Dossier Sheet */}
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="max-w-4xl mx-auto rounded-3xl bg-white text-slate-900 border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8"
      >
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500">
              MY VAULT — OFFICIAL RECORD DOSSIER
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              {pdfLangMode === 'ar'
                ? 'بيان الوثائق والمعلومات الشخصية المعتمدة'
                : pdfLangMode === 'en'
                ? 'Verified Personal & Family Information Dossier'
                : 'بيان الوثائق والمعلومات · Personal Information Dossier'}
            </h1>
          </div>
          <div className="text-end text-xs font-mono text-slate-600 tabular-nums">
            <div>DATE: {new Date().toISOString().slice(0, 10)}</div>
            <div>RECORDS: {records.length}</div>
          </div>
        </div>

        <div className="space-y-8">
          {records.map((rec, idx) => {
            const owner = rec.personId ? peopleMap[rec.personId] : undefined;
            const allowedIds = selectedFieldsByRecord[rec.id];
            const fields =
              allowedIds && allowedIds.length > 0
                ? rec.fields.filter((f) => allowedIds.includes(f.id))
                : rec.fields;

            return (
              <div
                key={rec.id}
                className="border border-slate-200 rounded-2xl p-6 space-y-4 break-inside-avoid"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="text-xs text-slate-500">
                      #{idx + 1} ·{' '}
                      {owner
                        ? `${owner.fullName} (${
                            pdfLangMode === 'en'
                              ? owner.relationshipLabelEn
                              : owner.relationshipLabelAr
                          })`
                        : pdfLangMode === 'en'
                        ? 'General Record'
                        : 'سجل عام'}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {pdfLangMode === 'ar'
                        ? rec.titleAr
                        : pdfLangMode === 'en'
                        ? rec.titleEn
                        : `${rec.titleAr} — ${rec.titleEn}`}
                    </h2>
                  </div>
                  {rec.recordNumber && (
                    <div className="font-mono text-sm font-bold bg-slate-100 px-3 py-1.5 rounded-lg tabular-nums">
                      {rec.recordNumber}
                    </div>
                  )}
                </div>

                {/* Fields Table */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fields.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="text-[11px] font-semibold text-slate-500">
                        {pdfLangMode === 'ar'
                          ? f.labelAr
                          : pdfLangMode === 'en'
                          ? f.labelEn
                          : `${f.labelAr} / ${f.labelEn}`}
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Optional Document Scan Images */}
                {includeImages && rec.frontImageUrl && (
                  <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[11px] text-slate-500 mb-1">
                        {pdfLangMode === 'en' ? 'Front Image Specimen' : 'صورة الوجه الأمامي'}
                      </div>
                      <img
                        src={rec.frontImageUrl}
                        alt={rec.titleEn}
                        referrerPolicy="no-referrer"
                        className="w-full rounded-xl border border-slate-200"
                      />
                    </div>
                    {rec.backImageUrl && (
                      <div>
                        <div className="text-[11px] text-slate-500 mb-1">
                          {pdfLangMode === 'en' ? 'Back Image Specimen' : 'صورة الوجه الخلفي'}
                        </div>
                        <img
                          src={rec.backImageUrl}
                          alt={`${rec.titleEn} Back`}
                          referrerPolicy="no-referrer"
                          className="w-full rounded-xl border border-slate-200"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
