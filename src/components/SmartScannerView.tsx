import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  RotateCw,
  Sliders,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Edit3,
  RefreshCw,
  ShieldAlert,
  Check,
  FileImage,
} from 'lucide-react';
import {
  Language,
  PersonProfile,
  VaultCategoryKey,
  VaultField,
  VaultRecord,
  OcrVerificationStatus,
} from '../types/vault';
import { SPECIMEN_IMAGES } from '../data/seedData';
import { isTwoSidedScanComplete } from '../utils/vaultLogic';

interface SmartScannerViewProps {
  lang: Language;
  people: PersonProfile[];
  preselectedPersonId?: string;
  defaultConsent: boolean;
  onSaveScannedRecord: (record: VaultRecord) => void;
}

export const SmartScannerView: React.FC<SmartScannerViewProps> = ({
  lang,
  people,
  preselectedPersonId,
  defaultConsent,
  onSaveScannedRecord,
}) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    preselectedPersonId || 'person-owner'
  );
  const [documentHint, setDocumentHint] = useState<string>('national_id');
  const [isTwoSided, setIsTwoSided] = useState<boolean>(true);
  const [singleSideConfirmed, setSingleSideConfirmed] = useState<boolean>(false);

  const [frontImage, setFrontImage] = useState<string>(SPECIMEN_IMAGES.idFront);
  const [backImage, setBackImage] = useState<string>(SPECIMEN_IMAGES.idBack);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [rotation, setRotation] = useState<number>(0);
  const [enhanceContrast, setEnhanceContrast] = useState<boolean>(false);
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);

  const [consentGranted, setConsentGranted] = useState<boolean>(defaultConsent);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Camera state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // OCR Result State
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [detectedTitleAr, setDetectedTitleAr] = useState<string>('');
  const [detectedTitleEn, setDetectedTitleEn] = useState<string>('');
  const [suggestedCategory, setSuggestedCategory] =
    useState<VaultCategoryKey>('identity');
  const [overallConfidence, setOverallConfidence] = useState<number>(0);
  const [requiresRetake, setRequiresRetake] = useState<boolean>(false);
  const [qualityAdvisoryAr, setQualityAdvisoryAr] = useState<string>('');
  const [qualityAdvisoryEn, setQualityAdvisoryEn] = useState<string>('');
  const [extractedFields, setExtractedFields] = useState<VaultField[]>([]);
  const [userConfirmedAccuracy, setUserConfirmedAccuracy] =
    useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadSpecimen = (type: 'national_id' | 'passport' | 'utility_card') => {
    setDocumentHint(type);
    setHasScanned(false);
    setScanError(null);
    setRotation(0);
    if (type === 'national_id') {
      setFrontImage(SPECIMEN_IMAGES.idFront);
      setBackImage(SPECIMEN_IMAGES.idBack);
      setIsTwoSided(true);
      setSingleSideConfirmed(false);
    } else if (type === 'passport') {
      setFrontImage(SPECIMEN_IMAGES.passportOwner);
      setBackImage('');
      setIsTwoSided(false);
      setSingleSideConfirmed(true);
    } else {
      setFrontImage(SPECIMEN_IMAGES.utilityCard);
      setBackImage('');
      setIsTwoSided(false);
      setSingleSideConfirmed(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (activeSide === 'front') {
        setFrontImage(dataUrl);
      } else {
        setBackImage(dataUrl);
      }
      setHasScanned(false);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setScanError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      setScanError(
        lang === 'ar'
          ? 'تعذر الوصول إلى الكاميرا في هذه البيئة؛ يمكنك رفع صورة من جهازك أو استخدام النماذج التجريبية الجاهزة.'
          : 'Camera access unavailable in this browser environment; please upload an image or select a demo specimen.'
      );
    }
  };

  const captureFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 800;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      if (activeSide === 'front') setFrontImage(dataUrl);
      else setBackImage(dataUrl);
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
    }
    setCameraActive(false);
  };

  const runOcrScan = async () => {
    setScanError(null);
    if (!consentGranted) {
      setScanError(
        lang === 'ar'
          ? 'يرجى تفعيل مربع الموافقة على معالجة الصورة بالذكاء الاصطناعي أولاً.'
          : 'Please check the informed consent box before running AI OCR extraction.'
      );
      return;
    }

    setIsScanning(true);
    try {
      const isSvgSpecimen = frontImage.startsWith('data:image/svg+xml');
      const mimeMatch = frontImage.match(/^data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

      const response = await fetch('/api/ocr/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: frontImage,
          mimeType,
          documentHint,
          language: lang,
          consentGranted,
          specimenId: isSvgSpecimen ? documentHint : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'OCR request failed');
      }

      const res = data.result;
      setDetectedTitleAr(res.detectedTitleAr || 'مستند ممسوح ضوئياً');
      setDetectedTitleEn(res.detectedTitleEn || 'Scanned Document');
      setSuggestedCategory(
        (res.suggestedCategory as VaultCategoryKey) || 'identity'
      );
      setOverallConfidence(res.overallConfidence ?? 90);
      setRequiresRetake(Boolean(res.requiresRetake));
      setQualityAdvisoryAr(res.qualityAdvisoryAr || '');
      setQualityAdvisoryEn(res.qualityAdvisoryEn || '');

      const mappedFields: VaultField[] = (res.fields || []).map(
        (f: any, idx: number) => ({
          id: 'ocr-f-' + idx + '-' + Date.now(),
          key: f.key || 'field_' + idx,
          labelAr: f.labelAr || f.key,
          labelEn: f.labelEn || f.key,
          value: f.value || '',
          isSensitive: Boolean(f.isSensitive),
          confidence: f.confidence ?? 85,
          verificationStatus: (f.status as OcrVerificationStatus) || 'verified',
          noteAr: f.noteAr,
          noteEn: f.noteEn,
        })
      );

      setExtractedFields(mappedFields);
      setHasScanned(true);
      setUserConfirmedAccuracy(false);
    } catch (err: any) {
      setScanError(err?.message || 'Error scanning document');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFieldEdit = (fieldId: string, newValue: string) => {
    setExtractedFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? {
              ...f,
              value: newValue,
              verificationStatus: 'manually_corrected',
              confidence: 100,
            }
          : f
      )
    );
  };

  const twoSidedComplete = isTwoSidedScanComplete({
    isTwoSidedDocument: isTwoSided,
    hasFrontImage: Boolean(frontImage),
    hasBackImage: Boolean(backImage),
    singleSideConfirmed,
  });

  const handleConfirmAndSave = () => {
    if (!userConfirmedAccuracy || !twoSidedComplete) return;

    const primaryNumField =
      extractedFields.find(
        (f) =>
          f.key.includes('number') ||
          f.key.includes('id') ||
          f.key.includes('meter')
      ) || extractedFields[1] || extractedFields[0];

    const expField = extractedFields.find((f) => f.key.includes('expiry'));
    const issueField = extractedFields.find((f) => f.key.includes('issue'));
    const now = new Date().toISOString();

    const newRec: VaultRecord = {
      id: 'rec-ocr-' + Date.now(),
      personId: selectedPersonId || undefined,
      recordKind: 'document',
      titleAr: detectedTitleAr,
      titleEn: detectedTitleEn,
      category:
        documentHint === 'passport' ? 'passports' : suggestedCategory,
      collectionId: 'col-my-docs',
      documentType: documentHint,
      recordNumber: primaryNumField ? primaryNumField.value : 'OCR-' + Date.now(),
      descriptionAr: 'تم استخراجه وتدقيقه عبر الماسح الذكي AI OCR مع حفظ الصورة الأصلية بشكل مستقل',
      descriptionEn: 'Extracted and verified via Smart AI OCR with original image preserved separately',
      issueDate: issueField?.value,
      expirationDate: expField?.value,
      frontImageUrl: frontImage,
      backImageUrl: backImage || undefined,
      isTwoSidedDocument: isTwoSided,
      singleSideConfirmed,
      fields: extractedFields,
      tags: ['AI OCR', documentHint],
      isFavorite: true,
      isArchived: false,
      usageCount: 1,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    onSaveScannedRecord(newRec);
  };

  const renderStatusBadge = (status?: OcrVerificationStatus, confidence?: number) => {
    if (status === 'verified') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>
            {lang === 'ar' ? 'تم الاستخراج بنجاح' : 'Successfully Extracted'}{' '}
            ({confidence}%)
          </span>
        </span>
      );
    }
    if (status === 'manually_corrected') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
          <Edit3 className="w-3.5 h-3.5" />
          <span>{lang === 'ar' ? 'تم التعديل والتأكيد يدوياً' : 'Manually Corrected'}</span>
        </span>
      );
    }
    if (status === 'needs_verification') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>
            {lang === 'ar' ? 'يحتاج مراجعة وتدقيق' : 'Needs Verification'} ({confidence}%)
          </span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
        <HelpCircle className="w-3.5 h-3.5" />
        <span>
          {lang === 'ar' ? 'غير واضح — يرجى التعديل أو إعادة التصوير' : 'Unreadable — Edit or Retake'} ({confidence}%)
        </span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {lang === 'ar'
              ? 'الماسح الذكي للمستندات (AI OCR)'
              : 'Smart Document Scanner — AI OCR'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'ar'
              ? 'التقط صورة أو ارفع مستنداً (الوجه الأمامي والخلفي) لاستخراج الحقول تلقائياً مع المراجعة اليدوية قبل الحفظ.'
              : 'Capture or upload front & back document images to extract structured fields with confidence indicators and manual verification.'}
          </p>
        </div>

        {/* Specimen Quick Loaders for Instant Testing */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">
            {lang === 'ar' ? 'نماذج تجريبية جاهزة:' : 'Demo Specimens:'}
          </span>
          <button
            type="button"
            onClick={() => loadSpecimen('national_id')}
            className={`px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-semibold border transition-colors ${
              documentHint === 'national_id'
                ? 'bg-[#0A1128] text-white border-[#0A1128]'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {lang === 'ar' ? 'بطاقة هوية (وجهين)' : 'National ID (2-Sided)'}
          </button>
          <button
            type="button"
            onClick={() => loadSpecimen('passport')}
            className={`px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-semibold border transition-colors ${
              documentHint === 'passport'
                ? 'bg-[#0A1128] text-white border-[#0A1128]'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {lang === 'ar' ? 'جواز سفر إلكتروني' : 'Biometric Passport'}
          </button>
          <button
            type="button"
            onClick={() => loadSpecimen('utility_card')}
            className={`px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-semibold border transition-colors ${
              documentHint === 'utility_card'
                ? 'bg-[#0A1128] text-white border-[#0A1128]'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {lang === 'ar' ? 'بطاقة عداد كهرباء' : 'Utility Meter Card'}
          </button>
        </div>
      </div>

      {/* Main Two-Column Scanner Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Capture, Front/Back Slots, Readability Controls */}
        <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveSide('front')}
                className={`px-3.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-colors ${
                  activeSide === 'front'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {lang === 'ar' ? '1. الوجه الأمامي' : '1. Front Side'}
              </button>
              <button
                type="button"
                onClick={() => setActiveSide('back')}
                className={`px-3.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-colors ${
                  activeSide === 'back'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {lang === 'ar' ? '2. الوجه الخلفي' : '2. Back Side'}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'رفع صورة' : 'Upload Photo'}</span>
              </button>
              <button
                type="button"
                onClick={cameraActive ? stopCamera : startCamera}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>
                  {cameraActive
                    ? lang === 'ar'
                      ? 'إيقاف الكاميرا'
                      : 'Stop Camera'
                    : lang === 'ar'
                    ? 'الكاميرا'
                    : 'Camera'}
                </span>
              </button>
            </div>
          </div>

          {/* Viewport Frame with Boundary Detection & Readability Enhancement */}
          <div className="relative rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 aspect-[16/10] flex items-center justify-center">
            {cameraActive ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <button
                  type="button"
                  onClick={captureFromCamera}
                  className="absolute bottom-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg"
                >
                  {lang === 'ar' ? 'التقاط الصورة الآن' : 'Capture Frame'}
                </button>
              </div>
            ) : (activeSide === 'front' ? frontImage : backImage) ? (
              <img
                src={activeSide === 'front' ? frontImage : backImage}
                alt={activeSide === 'front' ? 'Front Document Scan' : 'Back Document Scan'}
                referrerPolicy="no-referrer"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  filter: enhanceContrast ? 'contrast(1.22) brightness(1.04)' : 'none',
                }}
                className="max-w-full max-h-full object-contain transition-transform duration-200 p-3"
              />
            ) : (
              <div className="text-center p-6 text-slate-400">
                <FileImage className="w-10 h-10 mx-auto mb-2 opacity-60" />
                <p className="text-xs">
                  {lang === 'ar'
                    ? 'لم يتم إرفاق صورة للوجه الخلفي بعد. ارفع صورة أو أكد الاكتفاء بوجه واحد أدناه.'
                    : 'No back side image uploaded yet. Upload an image or confirm single-side below.'}
                </p>
              </div>
            )}

            {/* Document Boundary Guides */}
            {showBoundaries && (
              <div className="pointer-events-none absolute inset-5 border-2 border-dashed border-blue-400/70 rounded-2xl" />
            )}
          </div>

          {/* Image Tools: Rotate, Contrast, Boundaries */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تدوير 90°' : 'Rotate 90°'}</span>
              </button>
              <button
                type="button"
                onClick={() => setEnhanceContrast((c) => !c)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-medium ${
                  enhanceContrast
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تحسين القراءة والتباين' : 'Enhance Readability'}</span>
              </button>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showBoundaries}
                onChange={(e) => setShowBoundaries(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span>{lang === 'ar' ? 'إظهار حدود المستند' : 'Document Boundaries'}</span>
            </label>
          </div>

          {/* Two-Sided Document Verification Rule */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTwoSided}
                  onChange={(e) => setIsTwoSided(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span>
                  {lang === 'ar'
                    ? 'هذا المستند ذو وجهين (أمامي وخلفي)'
                    : 'This document has two sides (Front & Back)'}
                </span>
              </label>
              <span className="text-xs text-slate-500">
                {frontImage && backImage
                  ? lang === 'ar'
                    ? 'الوجهان متوفران'
                    : 'Both sides attached'
                  : lang === 'ar'
                  ? 'وجه واحد فقط مرفق'
                  : '1 side attached'}
              </span>
            </div>

            {isTwoSided && !backImage && (
              <label className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={singleSideConfirmed}
                  onChange={(e) => setSingleSideConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-amber-400"
                />
                <span>
                  {lang === 'ar'
                    ? 'لم يتم إرفاق الوجه الخلفي بعد — أؤكد صراحةً أن وجهاً واحداً يكفي لحفظ هذا المستند.'
                    : 'Back side not provided — I explicitly confirm that only one side is needed for this record.'}
                </span>
              </label>
            )}
          </div>

          {/* Person Assignment + Explicit Informed Consent + Run OCR CTA */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar'
                  ? 'ربط المستند الممسوح بملف شخص:'
                  : 'Assign Scanned Document to Person:'}
              </label>
              <select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="">
                  {lang === 'ar' ? 'سجل عام (غير مرتبط بشخص محدد)' : 'General Record (Unassigned)'}
                </option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({lang === 'ar' ? p.relationshipLabelAr : p.relationshipLabelEn})
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGranted}
                onChange={(e) => setConsentGranted(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span>
                {lang === 'ar'
                  ? 'أوافق على تحليل صورة المستند عبر محرك المسح الذكي (AI OCR) لاستخراج الحقول النصية مع الاحتفاظ بالصورة الأصلية بشكل منفصل.'
                  : 'I consent to processing this document image with AI OCR to extract text fields while storing the original image separately.'}
              </span>
            </label>

            {scanError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                {scanError}
              </div>
            )}

            <button
              type="button"
              disabled={isScanning}
              onClick={runOcrScan}
              className="w-full py-3 px-4 min-h-[46px] rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ScanLine className="w-4 h-4" />
              <span>
                {isScanning
                  ? lang === 'ar'
                    ? 'جاري تحليل المستند واستخراج الحقول...'
                    : 'Analyzing Document & Extracting Fields...'
                  : lang === 'ar'
                  ? 'بدء المسح الذكي واستخراج البيانات (AI OCR)'
                  : 'Extract Document Fields (AI OCR)'}
              </span>
            </button>
          </div>
        </div>

        {/* Right Column: Extracted Fields Verification & Manual Editing */}
        <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          {!hasScanned ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto">
                <ScanLine className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'ar'
                  ? 'جاهز لاستخراج وتدقيق حقول المستند'
                  : 'Ready to Extract & Verify Document Fields'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {lang === 'ar'
                  ? 'اضغط على "بدء المسح الذكي" لتحليل الصورة المعروضة. ستظهر جميع الحقول المستخرجة هنا مع مؤشر الدقة وإمكانية التعديل اليدوي لكل حقل قبل الحفظ.'
                  : 'Click "Extract Document Fields" to run OCR on the selected image. Every extracted field will be shown with its confidence score for manual verification before saving.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-xs text-slate-500">
                    {lang === 'ar' ? 'نتيجة التعرف التلقائي' : 'Detected Document Type'}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {lang === 'ar' ? detectedTitleAr : detectedTitleEn}
                  </h2>
                </div>
                <div className="text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 tabular-nums">
                  {lang === 'ar' ? 'متوسط الوضوح: ' : 'Clarity Score: '}
                  {overallConfidence}%
                </div>
              </div>

              {/* Advisory & Retake Alert if Needed */}
              <div
                className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start justify-between gap-3 ${
                  requiresRetake
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div>
                  <div className="font-bold mb-0.5">
                    {requiresRetake
                      ? lang === 'ar'
                        ? 'تنبيه جودة الصورة: يُنصح بالتقاط صورة أوضح أو تدقيق الحقول الغامضة'
                        : 'Image Clarity Advisory: Please verify highlighted fields or retake photo'
                      : lang === 'ar'
                      ? 'تقرير الفحص الذكي:'
                      : 'Smart Verification Summary:'}
                  </div>
                  <p>{lang === 'ar' ? qualityAdvisoryAr : qualityAdvisoryEn}</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'صورة أخرى' : 'Retake Photo'}</span>
                </button>
              </div>

              {/* Extracted Fields List with Individual Editing & Confidence Indicators */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto pe-1">
                {extractedFields.map((field) => (
                  <div
                    key={field.id}
                    className={`p-3.5 rounded-2xl border transition-colors ${
                      field.verificationStatus === 'unreadable'
                        ? 'border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20'
                        : field.verificationStatus === 'needs_verification'
                        ? 'border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {lang === 'ar' ? field.labelAr : field.labelEn}
                      </label>
                      {renderStatusBadge(field.verificationStatus, field.confidence)}
                    </div>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => handleFieldEdit(field.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white"
                    />
                    {(field.noteAr || field.noteEn) && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {lang === 'ar' ? field.noteAr : field.noteEn}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Non-Legal OCR Disclaimer + User Confirmation Gate */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {lang === 'ar'
                      ? 'ملاحظة مهمة: يتحقق نظام المسح الضوئي (OCR) من وضوح النص وتناسق الحقول فقط، ولا يُعد تصديقاً قانونياً أو إثباتاً رسمياً لصحة الوثيقة.'
                      : 'Important: OCR checks text readability and format consistency only; it does not verify the legal authenticity or official validity of a document.'}
                  </span>
                </div>

                <label className="flex items-start gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userConfirmedAccuracy}
                    onChange={(e) => setUserConfirmedAccuracy(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  <span>
                    {lang === 'ar'
                      ? 'لقد راجعت الحقول المستخرجة أعلاه وقارنتها بالصورة الأصلية وأؤكد صحتها قبل الحفظ في الخزنة.'
                      : 'I have reviewed the extracted values against the original image and confirm their accuracy before saving.'}
                  </span>
                </label>

                <button
                  type="button"
                  disabled={!userConfirmedAccuracy || !twoSidedComplete}
                  onClick={handleConfirmAndSave}
                  className="w-full py-3 px-4 min-h-[46px] rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {lang === 'ar'
                      ? 'اعتماد وحفظ المستند والبيانات المستخرجة في الخزنة'
                      : 'Confirm & Save Document to Vault'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
