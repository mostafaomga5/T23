import React, { useState } from 'react';
import {
  Shield,
  Users,
  ScanLine,
  Copy,
  Share2,
  Lock,
  ArrowLeft,
  ArrowRight,
  Globe,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { Language, PageId } from '../types/vault';
import { SPECIMEN_IMAGES } from '../data/seedData';

interface PublicViewsProps {
  lang: Language;
  onToggleLanguage: () => void;
  onNavigate: (page: PageId) => void;
  onUnlockVault: (userEmail?: string) => void;
}

export const LandingPageView: React.FC<PublicViewsProps> = ({
  lang,
  onToggleLanguage,
  onNavigate,
  onUnlockVault,
}) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onUnlockVault();
          }}
          className="text-lg font-bold tracking-tight text-[#0A1128] dark:text-white whitespace-nowrap shrink-0"
        >
          MY VAULT
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a
            href="#people"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            {lang === 'ar' ? 'إدارة الأشخاص' : 'Multi-Person'}
          </a>
          <a
            href="#scanner"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            {lang === 'ar' ? 'الماسح الذكي' : 'AI Scanner'}
          </a>
          <a
            href="#sharing"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            {lang === 'ar' ? 'المشاركة والتصدير' : 'Share & Export'}
          </a>
          <a
            href="#security"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            {lang === 'ar' ? 'الأمان والخصوصية' : 'Security'}
          </a>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onUnlockVault()}
            className="px-4 py-2 min-h-[40px] text-xs font-semibold text-white bg-[#0A1128] dark:bg-blue-600 rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            {lang === 'ar' ? 'دخول إلى الخزنة' : 'Enter Vault'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-20 space-y-20">
        {/* Hero Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
              <span>{lang === 'ar' ? 'خزنتك الرقمية الشخصية والعائلية' : 'Universal Digital Vault'}</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={onToggleLanguage}
                className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400 hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}</span>
              </button>
            </div>

            <h1
              className="text-3xl sm:text-5xl font-bold text-[#0A1128] dark:text-white leading-tight"
              style={{ textWrap: 'balance' }}
            >
              {lang === 'ar'
                ? 'حساب واحد. عدد غير محدود من الأشخاص والوثائق والأرقام في مكان واحد.'
                : 'One Account. Unlimited People, Documents, and Custom Records.'}
            </h1>

            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {lang === 'ar'
                ? 'تخلص نهائياً من عناء حمل الأوراق أو البحث المتكرر في الصور والرسائل عن أرقام الهويات، جوازات سفر العائلة والموظفين، عدادات الكهرباء، وأرقام الشكاوى. كل معلومة منظمة وجاهزة للنسخ والمشاركة الآمنة فوراً.'
                : 'Eliminate carrying physical papers or searching through old photos and messages for IDs, family and employee passports, utility meters, and reference numbers. Everything is organized, searchable, ready to copy, and securely shareable.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onUnlockVault()}
                className="inline-flex items-center gap-2 px-6 py-3.5 min-h-[48px] rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
              >
                <span>
                  {lang === 'ar'
                    ? 'افتح الخزنة الرقمية الآن (نسخة تجريبية كاملة)'
                    : 'Open Digital Vault Now (Full Interactive Demo)'}
                </span>
                {lang === 'ar' ? (
                  <ArrowLeft className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="px-5 py-3.5 min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="px-5 py-3.5 min-h-[48px] rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                {lang === 'ar' ? 'إنشاء حساب جديد' : 'Create Account'}
              </button>
            </div>
          </div>

          {/* Right Specimen Preview Card */}
          <div className="lg:col-span-5 rounded-3xl bg-[#0A1128] text-white p-6 sm:p-8 flex flex-col justify-between border border-slate-800">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>
                  {lang === 'ar'
                    ? 'معاينة فورية — بطاقة هوية وجواز سفر'
                    : 'Live Vault Specimen Preview'}
                </span>
                <span className="font-mono text-blue-300">AES-256-GCM</span>
              </div>
              <img
                src={SPECIMEN_IMAGES.idFront}
                alt="MY VAULT Specimen Card"
                referrerPolicy="no-referrer"
                className="w-full rounded-2xl border border-slate-700"
              />
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold font-mono tabular-nums text-white">
                  ∞
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {lang === 'ar' ? 'أشخاص وموظفون' : 'People & Staff'}
                </div>
              </div>
              <div>
                <div className="text-xl font-bold font-mono tabular-nums text-white">
                  AI OCR
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {lang === 'ar' ? 'مسح وتدقيق ذكي' : 'Smart Verification'}
                </div>
              </div>
              <div>
                <div className="text-xl font-bold font-mono tabular-nums text-white">
                  1-Tap
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {lang === 'ar' ? 'نسخ ومشاركة PDF' : 'Copy & PDF Export'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars */}
        <section id="people" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0A1128] text-white flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'ar'
                ? '01. إدارة غير محدودة للأشخاص'
                : '01. Unlimited Multi-Person Profiles'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'ar'
                ? 'أنشئ ملفات مستقلة لنفسك، الزوجة، الأبناء، الوالدين، أو عشرات الموظفين والعاملين، مع إمكانية حفظ عدة جوازات سفر وهويات وعقود دون أي خلط.'
                : 'Create independent profiles for yourself, spouse, children, parents, or dozens of employees, supporting multiple passports and IDs per account.'}
            </p>
          </div>

          <div
            id="scanner"
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-700 text-white flex items-center justify-center">
              <ScanLine className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'ar'
                ? '02. الماسح الذكي AI OCR مع التحقق اليدوي'
                : '02. AI OCR Scanner with Verification'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'ar'
                ? 'امسح الوجه الأمامي والخلفي للهويات والجوازات، راجع مؤشر الثقة لكل حقل، عدّل يدوياً، واحتفظ بالصورة الأصلية منفصلة عن النص المستخرج.'
                : 'Scan front and back sides, inspect field confidence scores, edit unclear text manually, and store original photographs separately.'}
            </p>
          </div>

          <div
            id="sharing"
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'ar'
                ? '03. نسخ فوري وتصدير PDF ثنائي اللغة'
                : '03. Instant Copy & Bilingual PDF Export'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'ar'
                ? 'انسخ أي رقم بضغطة واحدة، أو صدّر ملف PDF احترافي بالعربية أو الإنجليزية أو كلتيهما، أو أنشئ رابط مشاركة مشفر ومؤقت.'
                : 'Copy any number in one tap, generate Arabic/English/Bilingual PDFs, or share via password-protected expiring encrypted links.'}
            </p>
          </div>
        </section>
      </main>

      <footer
        id="security"
        className="px-6 lg:px-12 py-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          {lang === 'ar'
            ? 'MY VAULT — خزنتك الرقمية الشخصية والعائلية. جميع البيانات المعروضة في النسخة التجريبية هي بيانات افتراضية للعرض فقط.'
            : 'MY VAULT — Personal, Family & Business Digital Vault. Prototype uses fictional demonstration data only.'}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onUnlockVault()}
            className="font-semibold text-slate-800 dark:text-slate-200 hover:underline"
          >
            {lang === 'ar' ? 'فتح لوحة التحكم' : 'Launch Dashboard'}
          </button>
        </div>
      </footer>
    </div>
  );
};

export const LoginView: React.FC<PublicViewsProps> = ({
  lang,
  onToggleLanguage,
  onNavigate,
  onUnlockVault,
}) => {
  const [email, setEmail] = useState('tarek.mansour@vault-demo.sa');
  const [password, setPassword] = useState('••••••••••••');
  const [otpCode, setOtpCode] = useState('482910');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    onUnlockVault(email.trim());
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0A1128] text-white flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                {lang === 'ar' ? 'تسجيل الدخول إلى MY VAULT' : 'Sign In to MY VAULT'}
              </h1>
              <p className="text-xs text-slate-500">
                {lang === 'ar' ? 'خزنتك الرقمية المشفرة' : 'Encrypted Digital Vault'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleLanguage}
            className="text-xs font-semibold text-blue-700 dark:text-blue-400"
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <input
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'ar' ? 'كلمة المرور الرئيسية (Master Password)' : 'Master Password'}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'ar'
                ? 'رمز التحقق الثنائي (MFA Code)'
                : 'Two-Factor Authentication Code (MFA)'}
            </label>
            <input
              type="text"
              dir="ltr"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm tracking-widest"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-bold hover:bg-slate-800"
          >
            {lang === 'ar' ? 'فك التشفير والدخول للخزنة' : 'Decrypt & Unlock Vault'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="text-blue-700 dark:text-blue-400 font-semibold hover:underline"
          >
            {lang === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="text-slate-500 hover:text-slate-800"
          >
            {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const RegisterView: React.FC<PublicViewsProps> = ({
  lang,
  onToggleLanguage,
  onNavigate,
  onUnlockVault,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enableMfa, setEnableMfa] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) return;
    onUnlockVault(email.trim());
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0A1128] text-white flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                {lang === 'ar' ? 'إنشاء خزنة رقمية جديدة' : 'Create Your Digital Vault'}
              </h1>
              <p className="text-xs text-slate-500">
                {lang === 'ar'
                  ? 'تشفير محلي AES-256-GCM لحسابك وعائلتك'
                  : 'Client-side AES-256-GCM encrypted vault'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleLanguage}
            className="text-xs font-semibold text-blue-700 dark:text-blue-400"
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'ar' ? 'الاسم الكامل لصاحب الحساب *' : 'Account Owner Full Name *'}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={lang === 'ar' ? 'طارق بن عبد الرحمن المنصور' : 'Tarek Al-Mansour'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'ar' ? 'البريد الإلكتروني *' : 'Email Address *'}
            </label>
            <input
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'ar' ? 'كلمة المرور الرئيسية للخزنة *' : 'Master Vault Password *'}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={enableMfa}
              onChange={(e) => setEnableMfa(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>
              {lang === 'ar'
                ? 'تفعيل المصادقة الثنائية (MFA) وتشفير المفاتيح المحلي'
                : 'Enable Multi-Factor Authentication (MFA) & Client Key Derivation'}
            </span>
          </label>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#0A1128] dark:bg-blue-600 text-white text-xs font-bold hover:bg-slate-800"
          >
            {lang === 'ar' ? 'إنشاء الخزنة والبدء فوراً' : 'Create Vault & Get Started'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-blue-700 dark:text-blue-400 font-semibold hover:underline"
          >
            {lang === 'ar' ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'Already have an account? Sign In'}
          </button>
          <button
            type="button"
            onClick={() => onUnlockVault()}
            className="text-slate-600 font-medium hover:underline"
          >
            {lang === 'ar' ? 'تجربة فورية' : 'Instant Demo'}
          </button>
        </div>
      </div>
    </div>
  );
};
