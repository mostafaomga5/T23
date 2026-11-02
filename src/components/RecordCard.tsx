import React, { useState } from 'react';
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  Star,
  Share2,
  FileText,
  User,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import {
  VaultRecord,
  PersonProfile,
  Language,
} from '../types/vault';
import {
  maskSensitiveValue,
  computeExpirationStatus,
  formatRecordForCopy,
} from '../utils/vaultLogic';

interface RecordCardProps {
  record: VaultRecord;
  person?: PersonProfile;
  lang: Language;
  maskByDefault: boolean;
  onSelectRecord: (recordId: string) => void;
  onToggleFavorite: (recordId: string) => void;
  onCopyValue: (value: string, label: string, recordId: string) => void;
  onShareRecord: (recordId: string) => void;
  onSelectPerson?: (personId: string) => void;
}

export const RecordCard: React.FC<RecordCardProps> = ({
  record,
  person,
  lang,
  maskByDefault,
  onSelectRecord,
  onToggleFavorite,
  onCopyValue,
  onShareRecord,
  onSelectPerson,
}) => {
  const [revealedFields, setRevealedFields] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const title = lang === 'ar' ? record.titleAr : record.titleEn;
  const description = lang === 'ar' ? record.descriptionAr : record.descriptionEn;
  const expStatus = computeExpirationStatus(record.expirationDate);

  const handleCopy = (val: string, label: string, keyId: string) => {
    onCopyValue(val, label, record.id);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const toggleReveal = (keyId: string) => {
    setRevealedFields((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const categoryLabels: Record<string, { ar: string; en: string }> = {
    identity: { ar: 'الهوية الشخصية', en: 'Personal Identity' },
    passports: { ar: 'جوازات السفر', en: 'Passports' },
    financial: { ar: 'البطاقات والحسابات المالية', en: 'Financial Records' },
    government: { ar: 'الخدمات الحكومية والمرافق', en: 'Government & Utilities' },
    contacts: { ar: 'أرقام الهواتف والطوارئ', en: 'Contacts & Emergency' },
    complaints: { ar: 'الطلبات والشكاوى', en: 'Applications & Complaints' },
    memberships: { ar: 'العضويات والتأمين', en: 'Memberships & Insurance' },
    work: { ar: 'العمل والموظفون', en: 'Work & Employees' },
    custom: { ar: record.customCategoryName || 'سجلات مخصصة', en: record.customCategoryName || 'Custom Records' },
  };

  const catLabel = categoryLabels[record.category]
    ? lang === 'ar'
      ? categoryLabels[record.category].ar
      : categoryLabels[record.category].en
    : record.category;

  const isPrimaryNumberSensitive =
    record.category === 'financial' ||
    record.documentType === 'national_id' ||
    record.documentType === 'passport';

  const showPrimaryNumberPlain =
    !maskByDefault || !isPrimaryNumberSensitive || revealedFields['primary_number'];

  return (
    <div className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between">
      <div>
        {/* Clean Unboxed Metadata Line (Zero-Pill Discipline) */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-slate-700 dark:text-slate-300">{catLabel}</span>
            <span aria-hidden="true">·</span>
            {person ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectPerson) onSelectPerson(person.id);
                }}
                className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 hover:underline font-medium"
              >
                <User className="w-3 h-3 shrink-0" />
                <span>{person.fullName}</span>
              </button>
            ) : (
              <span>{lang === 'ar' ? 'سجل عام (غير مرتبط بشخص)' : 'General Record (Unassigned)'}</span>
            )}
            {expStatus.status !== 'no_expiry' && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  className={`inline-flex items-center gap-1 font-medium ${
                    expStatus.status === 'expired'
                      ? 'text-red-600 dark:text-red-400'
                      : expStatus.status === 'expiring_soon'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  <Calendar className="w-3 h-3 shrink-0" />
                  {expStatus.status === 'expired'
                    ? lang === 'ar'
                      ? 'منتهي الصلاحية'
                      : 'Expired'
                    : expStatus.status === 'expiring_soon'
                    ? lang === 'ar'
                      ? `ينتهي خلال ${expStatus.daysRemaining} يوم`
                      : `Expires in ${expStatus.daysRemaining}d`
                    : lang === 'ar'
                    ? 'ساري المفعول'
                    : 'Active'}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onToggleFavorite(record.id)}
              className={`p-2 min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center transition-colors ${
                record.isFavorite
                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              aria-label={
                lang === 'ar'
                  ? `تفضيل ${record.titleAr}`
                  : `Favorite ${record.titleEn}`
              }
            >
              <Star className="w-4 h-4" fill={record.isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => onSelectRecord(record.id)}
            className="text-start block w-full group-hover:text-blue-900 dark:group-hover:text-blue-300 transition-colors"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              {title}
            </h3>
          </button>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              {description}
            </p>
          )}
        </div>

        {/* Primary Reference Number Bar with 1-Tap Quick Copy */}
        {record.recordNumber && (
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 mb-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'الرقم الأساسي / المرجعي' : 'Primary Reference Number'}
              </div>
              <div
                className="font-mono text-sm font-semibold text-slate-900 dark:text-white truncate tabular-nums"
                dir="ltr"
              >
                {showPrimaryNumberPlain
                  ? record.recordNumber
                  : maskSensitiveValue(record.recordNumber, 4)}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {maskByDefault && isPrimaryNumberSensitive && (
                <button
                  type="button"
                  onClick={() => toggleReveal('primary_number')}
                  className="p-2 min-h-[38px] min-w-[38px] rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
                  aria-label={
                    showPrimaryNumberPlain
                      ? lang === 'ar'
                        ? 'إخفاء الرقم'
                        : 'Mask number'
                      : lang === 'ar'
                      ? 'إظهار الرقم'
                      : 'Reveal number'
                  }
                >
                  {showPrimaryNumberPlain ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    record.recordNumber,
                    lang === 'ar' ? record.titleAr : record.titleEn,
                    'primary_number'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-lg bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-medium hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
                aria-label={
                  lang === 'ar'
                    ? `نسخ الرقم ${record.titleAr}`
                    : `Copy number for ${record.titleEn}`
                }
              >
                {copiedKey === 'primary_number' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'ar' ? 'تم النسخ' : 'Copied'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'نسخ الرقم' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Top 2 Quick Fields Preview with Copy */}
        {record.fields.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {record.fields.slice(0, 2).map((field) => {
              const fLabel = lang === 'ar' ? field.labelAr : field.labelEn;
              const isRevealed =
                !maskByDefault || !field.isSensitive || revealedFields[field.id];
              return (
                <div
                  key={field.id}
                  className="flex items-center justify-between gap-2 text-xs py-1 border-b border-slate-100 dark:border-slate-800/80 last:border-0"
                >
                  <span className="text-slate-500 dark:text-slate-400 truncate">
                    {fLabel}:
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate tabular-nums">
                      {isRevealed ? field.value : maskSensitiveValue(field.value, 4)}
                    </span>
                    {maskByDefault && field.isSensitive && (
                      <button
                        type="button"
                        onClick={() => toggleReveal(field.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        aria-label={lang === 'ar' ? `إظهار ${fLabel}` : `Reveal ${fLabel}`}
                      >
                        {isRevealed ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopy(field.value, fLabel, field.id)}
                      className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                      aria-label={lang === 'ar' ? `نسخ ${fLabel}` : `Copy ${fLabel}`}
                    >
                      {copiedKey === field.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const formatted = formatRecordForCopy(
                record,
                undefined,
                lang,
                person?.fullName
              );
              handleCopy(formatted, title, 'full_record');
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            {copiedKey === 'full_record' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>{lang === 'ar' ? 'نسخ السجل كاملاً' : 'Copy Full Record'}</span>
          </button>

          <button
            type="button"
            onClick={() => onShareRecord(record.id)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'مشاركة' : 'Share'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onSelectRecord(record.id)}
          className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          <span>{lang === 'ar' ? 'التفاصيل' : 'Details'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
