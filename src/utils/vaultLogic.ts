import {
  VaultRecord,
  VaultCategoryKey,
  Language,
  OcrVerificationStatus,
  PersonProfile,
  RecordKind,
} from '../types/vault';

/**
 * Masks a sensitive string value while keeping the last `visibleSuffix` characters readable.
 */
export function maskSensitiveValue(value: string, visibleSuffix = 4): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.length <= visibleSuffix) {
    return '•'.repeat(trimmed.length);
  }
  const suffix = trimmed.slice(-visibleSuffix);
  const maskedLength = Math.min(Math.max(trimmed.length - visibleSuffix, 4), 12);
  return `${'•'.repeat(maskedLength)} ${suffix}`;
}

/**
 * Classifies an OCR confidence percentage (0-100) into a verification status.
 */
export function classifyOcrConfidence(confidence: number): OcrVerificationStatus {
  if (confidence >= 88) return 'verified';
  if (confidence >= 60) return 'needs_verification';
  return 'unreadable';
}

/**
 * Verifies whether a two-sided document scan has either both front & back images
 * OR an explicit confirmation from the user that only one side is required.
 */
export function isTwoSidedScanComplete(params: {
  isTwoSidedDocument: boolean;
  hasFrontImage: boolean;
  hasBackImage: boolean;
  singleSideConfirmed: boolean;
}): boolean {
  if (!params.hasFrontImage) return false;
  if (!params.isTwoSidedDocument) return true;
  return Boolean(params.hasBackImage || params.singleSideConfirmed);
}

/**
 * Computes expiration status and days remaining relative to a reference ISO date.
 */
export function computeExpirationStatus(
  expirationDate?: string,
  nowIso: string = new Date().toISOString()
): {
  status: 'nominal' | 'expiring_soon' | 'expired' | 'no_expiry';
  daysRemaining: number | null;
} {
  if (!expirationDate) {
    return { status: 'no_expiry', daysRemaining: null };
  }
  const expMs = new Date(expirationDate).getTime();
  const nowMs = new Date(nowIso).getTime();
  if (Number.isNaN(expMs) || Number.isNaN(nowMs)) {
    return { status: 'no_expiry', daysRemaining: null };
  }
  const diffDays = Math.ceil((expMs - nowMs) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { status: 'expired', daysRemaining: diffDays };
  }
  if (diffDays <= 90) {
    return { status: 'expiring_soon', daysRemaining: diffDays };
  }
  return { status: 'nominal', daysRemaining: diffDays };
}

/**
 * Formats a VaultRecord (or subset of selected fields) into clean structured text
 * ready for WhatsApp, email, or clipboard sharing, preserving original official values.
 */
export function formatRecordForCopy(
  record: VaultRecord,
  selectedFieldIds?: string[],
  lang: Language = 'ar',
  personName?: string
): string {
  const title = lang === 'ar' ? record.titleAr : record.titleEn;
  const ownerLabel = lang === 'ar' ? 'صاحب السجل' : 'Person / Owner';
  const numberLabel = lang === 'ar' ? 'الرقم المرجعي / الأساسي' : 'Reference Number';
  const lines: string[] = [];

  lines.push(`=== ${title} ===`);
  if (personName) {
    lines.push(`${ownerLabel}: ${personName}`);
  }
  if (record.recordNumber) {
    lines.push(`${numberLabel}: ${record.recordNumber}`);
  }

  const fieldsToInclude =
    selectedFieldIds && selectedFieldIds.length > 0
      ? record.fields.filter((f) => selectedFieldIds.includes(f.id))
      : record.fields;

  for (const field of fieldsToInclude) {
    const label = lang === 'ar' ? field.labelAr : field.labelEn;
    lines.push(`${label}: ${field.value}`);
  }

  if (record.expirationDate) {
    const expLabel = lang === 'ar' ? 'تاريخ الانتهاء' : 'Expiration Date';
    lines.push(`${expLabel}: ${record.expirationDate}`);
  }

  const notes = lang === 'ar' ? record.notesAr : record.notesEn;
  if (notes && (!selectedFieldIds || selectedFieldIds.length === 0)) {
    const notesLabel = lang === 'ar' ? 'ملاحظات' : 'Notes';
    lines.push(`${notesLabel}: ${notes}`);
  }

  return lines.join('\n');
}

export interface SearchFilterOptions {
  query?: string;
  personId?: string | 'all' | 'unassigned';
  category?: VaultCategoryKey | 'all';
  recordKind?: RecordKind | 'all';
  collectionId?: string | 'all';
  documentType?: string | 'all';
  onlyFavorites?: boolean;
  includeArchived?: boolean;
  onlyArchived?: boolean;
  expirationFilter?: 'all' | 'nominal' | 'expiring_soon' | 'expired';
  peopleMap?: Record<string, PersonProfile>;
  nowIso?: string;
}

/**
 * Filters and searches VaultRecords across people, bilingual fields, numbers, tags, and notes.
 */
export function filterAndSearchRecords(
  records: VaultRecord[],
  options: SearchFilterOptions = {}
): VaultRecord[] {
  const {
    query = '',
    personId = 'all',
    category = 'all',
    recordKind = 'all',
    collectionId = 'all',
    documentType = 'all',
    onlyFavorites = false,
    includeArchived = false,
    onlyArchived = false,
    expirationFilter = 'all',
    peopleMap = {},
    nowIso = new Date().toISOString(),
  } = options;

  const normalizedQuery = query.trim().toLowerCase();

  return records.filter((rec) => {
    if (onlyArchived) {
      if (!rec.isArchived) return false;
    } else if (!includeArchived && rec.isArchived) {
      return false;
    }

    if (onlyFavorites && !rec.isFavorite) {
      return false;
    }

    if (personId === 'unassigned') {
      if (rec.personId) return false;
    } else if (personId !== 'all' && rec.personId !== personId) {
      return false;
    }

    if (category !== 'all') {
      if (category === 'passports') {
        if (rec.category !== 'passports' && rec.documentType !== 'passport') return false;
      } else if (rec.category !== category) {
        return false;
      }
    }

    if (recordKind !== 'all' && rec.recordKind !== recordKind) {
      return false;
    }

    if (collectionId !== 'all' && rec.collectionId !== collectionId) {
      return false;
    }

    if (documentType !== 'all' && rec.documentType !== documentType) {
      return false;
    }

    if (expirationFilter !== 'all') {
      const exp = computeExpirationStatus(rec.expirationDate, nowIso);
      if (exp.status !== expirationFilter) {
        return false;
      }
    }

    if (!normalizedQuery) {
      return true;
    }

    const owner = rec.personId ? peopleMap[rec.personId] : undefined;

    const searchableParts: string[] = [
      rec.titleAr,
      rec.titleEn,
      rec.recordNumber,
      rec.descriptionAr,
      rec.descriptionEn,
      rec.notesAr || '',
      rec.notesEn || '',
      rec.customCategoryName || '',
      rec.documentType,
      owner?.fullName || '',
      owner?.relationshipLabelAr || '',
      owner?.relationshipLabelEn || '',
      ...rec.tags,
      ...rec.fields.flatMap((f) => [f.labelAr, f.labelEn, f.value]),
    ];

    return searchableParts.some((part) =>
      String(part || '').toLowerCase().includes(normalizedQuery)
    );
  });
}

/**
 * Exports selected records as a CSV string including Person/Owner name.
 */
export function recordsToCSV(
  records: VaultRecord[],
  lang: Language = 'ar',
  peopleMap: Record<string, PersonProfile> = {}
): string {
  const headers =
    lang === 'ar'
      ? ['المعرف', 'صاحب السجل', 'العنوان', 'الفئة', 'الرقم المرجعي', 'تاريخ الانتهاء', 'الحقول التفصيلية', 'الوسوم']
      : ['ID', 'Person / Owner', 'Title', 'Category', 'Reference Number', 'Expiration Date', 'Detailed Fields', 'Tags'];

  const escapeCsv = (val: string) => {
    const clean = String(val ?? '').replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = records.map((r) => {
    const title = lang === 'ar' ? r.titleAr : r.titleEn;
    const ownerName = r.personId && peopleMap[r.personId]
      ? peopleMap[r.personId].fullName
      : lang === 'ar' ? 'سجل عام' : 'General Record';
    const fieldsSummary = r.fields
      .map((f) => `${lang === 'ar' ? f.labelAr : f.labelEn}: ${f.value}`)
      .join(' | ');
    return [
      escapeCsv(r.id),
      escapeCsv(ownerName),
      escapeCsv(title),
      escapeCsv(r.category),
      escapeCsv(r.recordNumber),
      escapeCsv(r.expirationDate || ''),
      escapeCsv(fieldsSummary),
      escapeCsv(r.tags.join(', ')),
    ].join(',');
  });

  return [headers.map(escapeCsv).join(','), ...rows].join('\n');
}

/**
 * Exports selected records as a formatted JSON string.
 */
export function recordsToJSON(
  records: VaultRecord[],
  selectedFieldIdsByRecord?: Record<string, string[]>,
  peopleMap: Record<string, PersonProfile> = {}
): string {
  const sanitized = records.map((rec) => {
    const allowedFieldIds = selectedFieldIdsByRecord?.[rec.id];
    const fields =
      allowedFieldIds && allowedFieldIds.length > 0
        ? rec.fields.filter((f) => allowedFieldIds.includes(f.id))
        : rec.fields;
    const owner = rec.personId ? peopleMap[rec.personId] : undefined;
    return {
      id: rec.id,
      personName: owner?.fullName || null,
      personRelationship: owner ? `${owner.relationshipLabelAr} / ${owner.relationshipLabelEn}` : null,
      titleAr: rec.titleAr,
      titleEn: rec.titleEn,
      category: rec.category,
      recordNumber: rec.recordNumber,
      issueDate: rec.issueDate,
      expirationDate: rec.expirationDate,
      fields: fields.map((f) => ({
        labelAr: f.labelAr,
        labelEn: f.labelEn,
        value: f.value,
      })),
      tags: rec.tags,
    };
  });
  return JSON.stringify(sanitized, null, 2);
}
