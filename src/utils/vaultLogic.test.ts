import test from 'node:test';
import assert from 'node:assert/strict';
import {
  maskSensitiveValue,
  classifyOcrConfidence,
  isTwoSidedScanComplete,
  computeExpirationStatus,
  formatRecordForCopy,
  filterAndSearchRecords,
  recordsToCSV,
} from './vaultLogic';
import { VaultRecord, PersonProfile } from '../types/vault';

const sampleOwner: PersonProfile = {
  id: 'person-1',
  fullName: 'طارق بن عبد الرحمن المنصور',
  relationshipKey: 'myself',
  relationshipLabelAr: 'صاحب الحساب (نفسي)',
  relationshipLabelEn: 'Myself (Owner)',
  group: 'personal',
  tags: ['owner'],
  avatarColor: '#0A1128',
  isAccountOwner: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const sampleEmployee: PersonProfile = {
  id: 'person-2',
  fullName: 'م. رامي حسن الكيلاني',
  relationshipKey: 'employee',
  relationshipLabelAr: 'موظف — مهندس موقع',
  relationshipLabelEn: 'Employee — Site Engineer',
  group: 'employees',
  tags: ['employee', 'engineering'],
  avatarColor: '#1E3A8A',
  createdAt: '2026-01-02T00:00:00.000Z',
};

const sampleRecord: VaultRecord = {
  id: 'rec-1',
  personId: 'person-1',
  recordKind: 'document',
  titleAr: 'جواز السفر الإلكتروني',
  titleEn: 'Biometric Passport',
  category: 'passports',
  collectionId: 'col-my-docs',
  documentType: 'passport',
  recordNumber: 'A89420115',
  descriptionAr: 'جواز سفر صاحب الحساب',
  descriptionEn: 'Account Owner Passport',
  issueDate: '2021-11-20',
  expirationDate: '2026-12-01',
  notesAr: 'محفوظ في الخزنة الرئيسية',
  notesEn: 'Stored in primary vault',
  fields: [
    {
      id: 'f1',
      key: 'full_name',
      labelAr: 'الاسم الكامل',
      labelEn: 'Full Name',
      value: 'طارق بن عبد الرحمن المنصور',
    },
    {
      id: 'f2',
      key: 'passport_num',
      labelAr: 'رقم جواز السفر',
      labelEn: 'Passport Number',
      value: 'A89420115',
      isSensitive: true,
    },
  ],
  tags: ['جواز', 'سفر', 'passport'],
  isFavorite: true,
  isArchived: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const employeePassport: VaultRecord = {
  ...sampleRecord,
  id: 'rec-2',
  personId: 'person-2',
  titleAr: 'جواز سفر — م. رامي حسن',
  titleEn: 'Passport — Eng. Rami Hassan',
  recordNumber: 'B77319044',
};

test('maskSensitiveValue masks leading digits and preserves visible suffix', () => {
  const masked = maskSensitiveValue('29108140104928', 4);
  assert.equal(masked.endsWith('4928'), true);
  assert.equal(masked.includes('2910'), false);
});

test('classifyOcrConfidence maps scores to verification statuses accurately', () => {
  assert.equal(classifyOcrConfidence(95), 'verified');
  assert.equal(classifyOcrConfidence(75), 'needs_verification');
  assert.equal(classifyOcrConfidence(40), 'unreadable');
});

test('isTwoSidedScanComplete enforces both sides or explicit single-side confirmation', () => {
  assert.equal(
    isTwoSidedScanComplete({
      isTwoSidedDocument: true,
      hasFrontImage: true,
      hasBackImage: false,
      singleSideConfirmed: false,
    }),
    false
  );
  assert.equal(
    isTwoSidedScanComplete({
      isTwoSidedDocument: true,
      hasFrontImage: true,
      hasBackImage: false,
      singleSideConfirmed: true,
    }),
    true
  );
  assert.equal(
    isTwoSidedScanComplete({
      isTwoSidedDocument: true,
      hasFrontImage: true,
      hasBackImage: true,
      singleSideConfirmed: false,
    }),
    true
  );
});

test('computeExpirationStatus detects nominal, expiring_soon, and expired dates', () => {
  const refNow = '2026-11-02T00:00:00.000Z';
  const soon = computeExpirationStatus('2026-12-01', refNow);
  assert.equal(soon.status, 'expiring_soon');
  assert.equal(soon.daysRemaining, 29);

  const expired = computeExpirationStatus('2025-10-01', refNow);
  assert.equal(expired.status, 'expired');

  const nominal = computeExpirationStatus('2028-05-01', refNow);
  assert.equal(nominal.status, 'nominal');
});

test('formatRecordForCopy produces structured Arabic and English text with owner name', () => {
  const arText = formatRecordForCopy(sampleRecord, ['f1'], 'ar', sampleOwner.fullName);
  assert.equal(arText.includes('جواز السفر الإلكتروني'), true);
  assert.equal(arText.includes('صاحب السجل: طارق بن عبد الرحمن المنصور'), true);
  assert.equal(arText.includes('الاسم الكامل: طارق بن عبد الرحمن المنصور'), true);
  assert.equal(arText.includes('رقم جواز السفر:'), false);
});

test('filterAndSearchRecords returns all matching records across multiple people and filters by personId', () => {
  const peopleMap = {
    'person-1': sampleOwner,
    'person-2': sampleEmployee,
  };
  const records = [sampleRecord, employeePassport];

  // Searching "Passport" returns passports for ALL people
  const allPassports = filterAndSearchRecords(records, { query: 'Passport', peopleMap });
  assert.equal(allPassports.length, 2);

  // Searching by employee name returns employee's records
  const ramiRecords = filterAndSearchRecords(records, { query: 'رامي', peopleMap });
  assert.equal(ramiRecords.length, 1);
  assert.equal(ramiRecords[0].id, 'rec-2');

  // Filtering by personId isolates that person's records
  const ownerOnly = filterAndSearchRecords(records, { personId: 'person-1', peopleMap });
  assert.equal(ownerOnly.length, 1);
  assert.equal(ownerOnly[0].id, 'rec-1');
});

test('recordsToCSV generates valid CSV rows with person column', () => {
  const csv = recordsToCSV([sampleRecord], 'en', { 'person-1': sampleOwner });
  assert.equal(csv.includes('"Biometric Passport"'), true);
  assert.equal(csv.includes('"A89420115"'), true);
  assert.equal(csv.includes('"طارق بن عبد الرحمن المنصور"'), true);
});
