export type Language = 'ar' | 'en';
export type PdfExportLanguageMode = 'ar' | 'en' | 'bilingual';

export type VaultCategoryKey =
  | 'identity'
  | 'passports'
  | 'financial'
  | 'government'
  | 'contacts'
  | 'complaints'
  | 'memberships'
  | 'work'
  | 'custom';

export type OrganizationalGroupKey =
  | 'personal'
  | 'family'
  | 'employees'
  | 'business'
  | 'other';

export type RecordKind = 'document' | 'number' | 'note' | 'custom';

export type PageId =
  | 'landing'
  | 'register'
  | 'login'
  | 'dashboard'
  | 'people'
  | 'add-person'
  | 'person-details'
  | 'all-documents'
  | 'category-identity'
  | 'passports'
  | 'category-government'
  | 'category-work'
  | 'category-memberships'
  | 'category-financial'
  | 'category-complaints'
  | 'category-contacts'
  | 'custom-records'
  | 'scanner'
  | 'document-details'
  | 'edit-document'
  | 'search'
  | 'favorites'
  | 'share-center'
  | 'pdf-preview'
  | 'reminders'
  | 'custom-categories'
  | 'recent-activity'
  | 'archived'
  | 'profile'
  | 'security'
  | 'language-settings'
  | 'privacy'
  | 'storage';

export type OcrVerificationStatus =
  | 'verified'
  | 'needs_verification'
  | 'unreadable'
  | 'manually_corrected';

export interface PersonProfile {
  id: string;
  fullName: string;
  relationshipKey: string;
  relationshipLabelAr: string;
  relationshipLabelEn: string;
  group: OrganizationalGroupKey;
  phone?: string;
  birthDate?: string;
  notes?: string;
  tags: string[];
  avatarColor: string;
  avatarUrl?: string;
  isAccountOwner?: boolean;
  createdAt: string;
}

export interface VaultField {
  id: string;
  key: string;
  labelAr: string;
  labelEn: string;
  value: string;
  fieldType?: 'text' | 'number' | 'date' | 'note';
  isSensitive?: boolean;
  confidence?: number;
  verificationStatus?: OcrVerificationStatus;
  noteAr?: string;
  noteEn?: string;
}

export interface VaultRecord {
  id: string;
  personId?: string; // Optional: belongs to a specific person OR unassigned/general
  recordKind: RecordKind;
  titleAr: string;
  titleEn: string;
  category: VaultCategoryKey;
  customCategoryId?: string;
  customCategoryName?: string;
  collectionId: string;
  documentType: string;
  recordNumber: string;
  descriptionAr: string;
  descriptionEn: string;
  issueDate?: string;
  expirationDate?: string;
  notesAr?: string;
  notesEn?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  isTwoSidedDocument?: boolean;
  singleSideConfirmed?: boolean;
  fields: VaultField[];
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;
  usageCount?: number;
  status?: 'active' | 'pending' | 'in_review' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface VaultCollection {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  iconName: string;
  colorHex: string;
  group: OrganizationalGroupKey;
  isPrivate: boolean;
  accessRole: 'owner' | 'family_restricted' | 'work_isolated';
}

export interface CustomCategoryDef {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  iconName: string;
  colorClass: string;
  createdAt: string;
}

export interface VaultReminder {
  id: string;
  recordId?: string;
  personId?: string;
  titleAr: string;
  titleEn: string;
  category: VaultCategoryKey;
  targetDate: string;
  notifyDaysBefore: number;
  isCompleted: boolean;
  notesAr?: string;
  notesEn?: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  actionType: 'copy' | 'create' | 'edit' | 'scan' | 'share' | 'export' | 'delete' | 'security';
  titleAr: string;
  titleEn: string;
  personId?: string;
  recordId?: string;
  actorName: string;
}

export interface AuthorizedRoleMember {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Manager' | 'Document Editor' | 'Viewer';
  allowedGroups: OrganizationalGroupKey[];
  status: 'active' | 'revoked';
}

export interface EncryptedShareLink {
  token: string;
  title: string;
  createdAt: string;
  expiresAt: string;
  passwordProtected: boolean;
  plainPasswordHint?: string;
  maxViews: number;
  viewCount: number;
  revoked: boolean;
  includedRecordTitles: string[];
  encryptedPayload: string;
  accessLogs: Array<{
    id: string;
    timestamp: string;
    action: 'created' | 'viewed' | 'failed_password' | 'revoked';
    actorNote: string;
  }>;
}

export interface SecuritySettingsState {
  clientEncryptionEnabled: boolean;
  mfaEnabled: boolean;
  biometricQuickUnlock: boolean;
  autoLockMinutes: number;
  maskSensitiveByDefault: boolean;
  aiOcrConsentDefault: boolean;
  zeroTelemetryMode: boolean;
  defaultExportLang: PdfExportLanguageMode;
  lastKeyRotation: string;
}
