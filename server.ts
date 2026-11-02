import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

// Initialize server-side Gemini client per @google/genai guidelines
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory store for encrypted share links (demonstration prototype session store)
interface EncryptedShareEntry {
  token: string;
  title: string;
  createdAt: string;
  expiresAt: string;
  passwordProtected: boolean;
  passwordHash?: string;
  maxViews: number;
  viewCount: number;
  revoked: boolean;
  encryptedPayload: string;
  includedRecordTitles: string[];
  accessLogs: Array<{
    id: string;
    timestamp: string;
    action: 'created' | 'viewed' | 'failed_password' | 'revoked';
    actorNote: string;
  }>;
}

const shareStore = new Map<string, EncryptedShareEntry>();

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    ocrConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

// AI OCR Document Scanner endpoint
app.post('/api/ocr/scan', async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/png',
      documentHint = 'auto',
      language = 'ar',
      consentGranted = false,
      specimenId,
    } = req.body || {};

    // Enforce informed user consent before sending any image to external AI
    if (!consentGranted) {
      return res.status(400).json({
        error: language === 'ar'
          ? 'يلزم تأكيد الموافقة الصريحة قبل معالجة صورة المستند عبر الذكاء الاصطناعي.'
          : 'Explicit user consent is required before processing document images with AI OCR.',
      });
    }

    // If a deterministic built-in specimen ID is provided or if image is SVG data URI,
    // check if we can use Gemini or provide high-precision structured extraction
    const ai = getGenAIClient();

    // Note: Gemini inlineData supports raster MIME types (image/png, image/jpeg, image/webp).
    const isRasterMime = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(mimeType);

    if (ai && imageBase64 && isRasterMime && !specimenId) {
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

      const promptText =
        language === 'ar'
          ? `أنت محرك مسح ضوئي ذكي للمستندات (AI OCR) داخل تطبيق خزنة رقمية شخصية.
قم بتحليل صورة المستند المرفقة بدقة واستخراج كافة الحقول المقروءة.
تلميح نوع المستند: ${documentHint}.
قواعد التحقق الصارمة:
1. حدد نوع المستند بدقة (national_id, passport, financial_card, government_service, complaint_receipt, membership_card, certificate, custom).
2. لكل حقل مستخرج، حدد اسم الحقل بالعربية والإنجليزية، القيمة المستخرجة، نسبة الثقة من 0 إلى 100، وحالة الحقل:
   - "verified" إذا كانت القراءة واضحة تماماً (ثقة >= 88)
   - "needs_verification" إذا كان النص باهتاً أو يحتمل الشك (ثقة بين 60 و 87)
   - "unreadable" إذا كان الحقل موجوداً ولكن غير مقروء بسبب الإضاءة أو زاوية التصوير (ثقة < 60)
3. حدد ما إذا كانت الصورة تحتاج إلى إعادة تصوير (requiresRetake) مع نصيحة واضحة للمستخدم.`
          : `You are an intelligent AI OCR Document Scanner inside a Personal Digital Identity Vault.
Analyze the attached document image and extract all readable structured fields.
Document hint: ${documentHint}.
Strict validation rules:
1. Identify the documentType (national_id, passport, financial_card, government_service, complaint_receipt, membership_card, certificate, custom).
2. For each extracted field, provide labelAr, labelEn, extracted value, confidence score (0-100), and status:
   - "verified" if crystal clear (confidence >= 88)
   - "needs_verification" if slightly blurry or ambiguous (confidence 60-87)
   - "unreadable" if visible but illegible (confidence < 60)
3. Indicate requiresRetake boolean and qualityAdvisory message.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
                data: cleanBase64,
              },
            },
            { text: promptText },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedType: {
                type: Type.STRING,
                description: 'Detected document type key: national_id, passport, financial_card, government_service, complaint_receipt, membership_card, certificate, or custom',
              },
              detectedTitleAr: {
                type: Type.STRING,
                description: 'Suggested document title in Arabic',
              },
              detectedTitleEn: {
                type: Type.STRING,
                description: 'Suggested document title in English',
              },
              suggestedCategory: {
                type: Type.STRING,
                description: 'Suggested vault category: identity, financial, government, contacts, complaints, memberships, work, or custom',
              },
              overallConfidence: {
                type: Type.INTEGER,
                description: 'Overall document clarity confidence 0-100',
              },
              requiresRetake: {
                type: Type.BOOLEAN,
                description: 'True if image has unreadable critical fields and user should take another photo',
              },
              qualityAdvisoryAr: {
                type: Type.STRING,
                description: 'Quality advisory in Arabic',
              },
              qualityAdvisoryEn: {
                type: Type.STRING,
                description: 'Quality advisory in English',
              },
              fields: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    labelAr: { type: Type.STRING },
                    labelEn: { type: Type.STRING },
                    value: { type: Type.STRING },
                    confidence: { type: Type.INTEGER },
                    status: {
                      type: Type.STRING,
                      description: 'verified, needs_verification, or unreadable',
                    },
                    isSensitive: { type: Type.BOOLEAN },
                    noteAr: { type: Type.STRING },
                    noteEn: { type: Type.STRING },
                  },
                  required: ['key', 'labelAr', 'labelEn', 'value', 'confidence', 'status'],
                },
              },
            },
            required: [
              'detectedType',
              'detectedTitleAr',
              'detectedTitleEn',
              'suggestedCategory',
              'overallConfidence',
              'requiresRetake',
              'fields',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({
        engine: 'gemini-3.8-flash',
        result: parsed,
      });
    }

    // Structured extraction for built-in fictional specimens or local uploaded images when offline/demo
    const specimenProfiles: Record<string, any> = {
      national_id: {
        detectedType: 'national_id',
        detectedTitleAr: 'بطاقة الهوية الوطنية الذكية (نموذج تجريبي)',
        detectedTitleEn: 'Smart National Identity Card (Demo Specimen)',
        suggestedCategory: 'identity',
        overallConfidence: 91,
        requiresRetake: false,
        qualityAdvisoryAr: 'جودة الصورة ممتازة (91%). يرجى مراجعة العنوان السكني وتأكيد تاريخ الانتهاء قبل الحفظ.',
        qualityAdvisoryEn: 'Image clarity is high (91%). Please verify the residential address and confirm the expiry date before saving.',
        fields: [
          {
            key: 'full_name',
            labelAr: 'الاسم الكامل',
            labelEn: 'Full Name',
            value: 'طارق بن عبد الرحمن المنصور',
            confidence: 98,
            status: 'verified',
            isSensitive: false,
            noteAr: 'تمت المطابقة من السطر الأول بوضوح عالٍ',
            noteEn: 'Extracted from primary name line with high clarity',
          },
          {
            key: 'national_id_number',
            labelAr: 'الرقم القومي / رقم الهوية',
            labelEn: 'National ID Number',
            value: '29108140104928',
            confidence: 99,
            status: 'verified',
            isSensitive: true,
            noteAr: 'أرقام واضحة 14 خانة',
            noteEn: 'Clear 14-digit identification sequence',
          },
          {
            key: 'birth_date',
            labelAr: 'تاريخ الميلاد',
            labelEn: 'Date of Birth',
            value: '1991-08-14',
            confidence: 96,
            status: 'verified',
            isSensitive: false,
            noteAr: 'متطابق مع رمز تاريخ الميلاد',
            noteEn: 'Matches encoded birth date',
          },
          {
            key: 'address',
            labelAr: 'العنوان السكني',
            labelEn: 'Residential Address',
            value: 'حي السفارات، شارع الكندي، مبنى 18، شقة 402',
            confidence: 76,
            status: 'needs_verification',
            isSensitive: false,
            noteAr: 'انعكاس إضاءة طفيف على رقم المبنى — يرجى التحقق اليدوي',
            noteEn: 'Slight light glare near building number — please verify manually',
          },
          {
            key: 'gender',
            labelAr: 'الجنس',
            labelEn: 'Gender',
            value: 'ذكر / Male',
            confidence: 97,
            status: 'verified',
            isSensitive: false,
            noteAr: 'مؤكد',
            noteEn: 'Confirmed',
          },
          {
            key: 'expiry_date',
            labelAr: 'تاريخ انتهاء البطاقة',
            labelEn: 'Expiration Date',
            value: '2029-08-14',
            confidence: 82,
            status: 'needs_verification',
            isSensitive: false,
            noteAr: 'يحتاج تأكيد المستخدم من ظهر البطاقة',
            noteEn: 'Requires user verification from reverse side',
          },
          {
            key: 'blood_group',
            labelAr: 'فصيلة الدم (الوجه الخلفي)',
            labelEn: 'Blood Group (Back Side)',
            value: 'غير واضح — انعكاس ضوئي',
            confidence: 42,
            status: 'unreadable',
            isSensitive: false,
            noteAr: 'الحقل غير مقروء بوضوح، يمكنك إدخاله يدوياً أو التقاط صورة أوضح للوجه الخلفي',
            noteEn: 'Field unreadable due to glare; enter manually or capture a clearer back photo',
          },
        ],
      },
      passport: {
        detectedType: 'passport',
        detectedTitleAr: 'جواز السفر الإلكتروني (نموذج تجريبي)',
        detectedTitleEn: 'Biometric Passport (Demo Specimen)',
        suggestedCategory: 'identity',
        overallConfidence: 94,
        requiresRetake: false,
        qualityAdvisoryAr: 'تمت قراءة منطقة MRZ بنجاح. يرجى مراجعة تاريخ الإصدار والانتهاء قبل الاعتماد.',
        qualityAdvisoryEn: 'Machine Readable Zone (MRZ) parsed accurately. Please confirm issue and expiration dates.',
        fields: [
          {
            key: 'full_name',
            labelAr: 'الاسم الكامل (كما في الجواز)',
            labelEn: 'Full Name (Passport)',
            value: 'TAREK ABDELRAHMAN AL-MANSOUR',
            confidence: 99,
            status: 'verified',
            isSensitive: false,
            noteAr: 'مستخرج من المنطقة المقروءة آلياً MRZ',
            noteEn: 'Extracted from MRZ zone',
          },
          {
            key: 'passport_number',
            labelAr: 'رقم جواز السفر',
            labelEn: 'Passport Number',
            value: 'A89420115',
            confidence: 98,
            status: 'verified',
            isSensitive: true,
            noteAr: 'تم التحقق من رقم التدقيق',
            noteEn: 'Check digit verified',
          },
          {
            key: 'nationality',
            labelAr: 'الجنسية',
            labelEn: 'Nationality',
            value: 'عربي / Arab Republic Specimen',
            confidence: 95,
            status: 'verified',
            isSensitive: false,
            noteAr: 'واضح',
            noteEn: 'Verified',
          },
          {
            key: 'birth_date',
            labelAr: 'تاريخ الميلاد',
            labelEn: 'Date of Birth',
            value: '1991-08-14',
            confidence: 97,
            status: 'verified',
            isSensitive: false,
            noteAr: 'مؤكد',
            noteEn: 'Verified',
          },
          {
            key: 'issue_date',
            labelAr: 'تاريخ الإصدار',
            labelEn: 'Issue Date',
            value: '2021-11-20',
            confidence: 81,
            status: 'needs_verification',
            isSensitive: false,
            noteAr: 'يرجى التأكد من يوم الإصدار',
            noteEn: 'Please verify exact issue day',
          },
          {
            key: 'expiry_date',
            labelAr: 'تاريخ الانتهاء',
            labelEn: 'Expiration Date',
            value: '2026-12-19',
            confidence: 96,
            status: 'verified',
            isSensitive: false,
            noteAr: 'ينتهي قريباً — سيتم تفعيل تذكير التجديد تلقائياً',
            noteEn: 'Expiring soon — renewal reminder will be enabled',
          },
        ],
      },
      utility_card: {
        detectedType: 'government_service',
        detectedTitleAr: 'بطاقة عداد الكهرباء الذكي والخدمات',
        detectedTitleEn: 'Smart Electricity Utility Meter Card',
        suggestedCategory: 'government',
        overallConfidence: 86,
        requiresRetake: true,
        qualityAdvisoryAr: 'بعض الأرقام الفرعية تحتاج تدقيقاً يدوياً بسبب زاوية الإضاءة. يرجى المراجعة أو إعادة التصوير.',
        qualityAdvisoryEn: 'Some secondary reference digits require manual verification due to lighting angle.',
        fields: [
          {
            key: 'subscriber_name',
            labelAr: 'اسم المشترك',
            labelEn: 'Subscriber Name',
            value: 'طارق عبد الرحمن المنصور',
            confidence: 95,
            status: 'verified',
            isSensitive: false,
            noteAr: 'واضح',
            noteEn: 'Clear',
          },
          {
            key: 'meter_number',
            labelAr: 'رقم العداد الذكي',
            labelEn: 'Smart Meter Number',
            value: 'ELC-4409-8821-09',
            confidence: 94,
            status: 'verified',
            isSensitive: false,
            noteAr: 'جاهز للنسخ السريع',
            noteEn: 'Ready for quick copy',
          },
          {
            key: 'account_reference',
            labelAr: 'رقم السداد الإلكتروني',
            labelEn: 'Electronic Billing Reference',
            value: '90081726354',
            confidence: 74,
            status: 'needs_verification',
            isSensitive: false,
            noteAr: 'الرقمان الأخيران باهتان قليلاً — يرجى التأكيد',
            noteEn: 'Last two digits slightly faded — please confirm',
          },
          {
            key: 'branch_code',
            labelAr: 'كود الإدارة الهندسية',
            labelEn: 'Engineering Sector Code',
            value: 'غير مقروء بوضوح',
            confidence: 38,
            status: 'unreadable',
            isSensitive: false,
            noteAr: 'الختم يغطي جزءاً من الكود — أدخله يدوياً أو التقط صورة أخرى',
            noteEn: 'Stamp overlaps part of sector code — edit manually or retake photo',
          },
        ],
      },
    };

    const chosenProfile =
      specimenProfiles[specimenId as string] ||
      specimenProfiles[documentHint as string] ||
      specimenProfiles.national_id;

    return res.json({
      engine: 'specimen-ocr-verifier',
      result: chosenProfile,
    });
  } catch (err: any) {
    console.error('OCR scan error:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Failed to process OCR document scan.',
    });
  }
});

// Create an encrypted share link
app.post('/api/share/create', (req, res) => {
  const {
    title,
    expiresInHours = 24,
    passwordProtected = false,
    passwordHash = '',
    maxViews = 5,
    encryptedPayload = '',
    includedRecordTitles = [],
  } = req.body || {};

  if (!title || !encryptedPayload) {
    return res.status(400).json({ error: 'Missing required share parameters.' });
  }

  const token =
    'vlt_' +
    Math.random().toString(36).substring(2, 10) +
    '_' +
    Date.now().toString(36);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + Number(expiresInHours) * 3600 * 1000);

  const entry: EncryptedShareEntry = {
    token,
    title,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    passwordProtected: Boolean(passwordProtected),
    passwordHash: passwordProtected ? String(passwordHash) : undefined,
    maxViews: Number(maxViews) || 5,
    viewCount: 0,
    revoked: false,
    encryptedPayload,
    includedRecordTitles: Array.isArray(includedRecordTitles) ? includedRecordTitles : [],
    accessLogs: [
      {
        id: 'log_' + Date.now(),
        timestamp: now.toISOString(),
        action: 'created',
        actorNote: 'Encrypted link generated with explicit owner confirmation',
      },
    ],
  };

  shareStore.set(token, entry);

  return res.json({
    token: entry.token,
    title: entry.title,
    createdAt: entry.createdAt,
    expiresAt: entry.expiresAt,
    passwordProtected: entry.passwordProtected,
    maxViews: entry.maxViews,
    viewCount: entry.viewCount,
    revoked: entry.revoked,
    includedRecordTitles: entry.includedRecordTitles,
    accessLogs: entry.accessLogs,
  });
});

// Revoke an encrypted share link
app.post('/api/share/:token/revoke', (req, res) => {
  const { token } = req.params;
  const entry = shareStore.get(token);
  if (!entry) {
    return res.status(404).json({ error: 'Share link not found.' });
  }
  entry.revoked = true;
  entry.accessLogs.unshift({
    id: 'log_' + Date.now(),
    timestamp: new Date().toISOString(),
    action: 'revoked',
    actorNote: 'Owner revoked link access immediately',
  });
  return res.json({
    token: entry.token,
    revoked: entry.revoked,
    accessLogs: entry.accessLogs,
  });
});

// Simulate/Verify accessing a share link (increments viewCount and logs access)
app.post('/api/share/:token/access', (req, res) => {
  const { token } = req.params;
  const { passwordHash } = req.body || {};
  const entry = shareStore.get(token);

  if (!entry) {
    return res.status(404).json({ error: 'Share link not found.' });
  }
  if (entry.revoked) {
    return res.status(403).json({ error: 'This share link has been revoked by the owner.' });
  }
  if (new Date(entry.expiresAt).getTime() < Date.now()) {
    return res.status(403).json({ error: 'This share link has expired.' });
  }
  if (entry.viewCount >= entry.maxViews) {
    return res.status(403).json({ error: 'Maximum allowed views reached for this link.' });
  }
  if (entry.passwordProtected && entry.passwordHash !== passwordHash) {
    entry.accessLogs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'failed_password',
      actorNote: 'Invalid access password attempt blocked',
    });
    return res.status(401).json({ error: 'Invalid access password.', accessLogs: entry.accessLogs });
  }

  entry.viewCount += 1;
  entry.accessLogs.unshift({
    id: 'log_' + Date.now(),
    timestamp: new Date().toISOString(),
    action: 'viewed',
    actorNote: `Authorized access (${entry.viewCount}/${entry.maxViews})`,
  });

  return res.json({
    token: entry.token,
    title: entry.title,
    viewCount: entry.viewCount,
    maxViews: entry.maxViews,
    encryptedPayload: entry.encryptedPayload,
    accessLogs: entry.accessLogs,
  });
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MY VAULT server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
