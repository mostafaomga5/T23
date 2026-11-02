import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { Language } from '../types/vault';

export const PWAInstallButton: React.FC<{ lang: Language }> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isInstallable) {
            install();
          } else {
            setShowGuide(true);
          }
        }}
        className="inline-flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
        aria-label={lang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
      >
        <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>{lang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#0A1128] text-white flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'تثبيت MY VAULT على جهازك' : 'Install MY VAULT on Your Device'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'ar' ? 'تطبيق ويب تقدمي (PWA) يعمل بدون اتصال' : 'Installable Progressive Web App'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700">
              {isIOS ? (
                <>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'على أجهزة iPhone و iPad (متصفح Safari):' : 'On iPhone / iPad (Safari):'}
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs leading-relaxed">
                    <li>
                      {lang === 'ar'
                        ? 'اضغط على زر المشاركة (Share) في شريط Safari السفلي.'
                        : 'Tap the Share button in the Safari toolbar.'}
                    </li>
                    <li>
                      {lang === 'ar'
                        ? 'اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).'
                        : 'Select "Add to Home Screen".'}
                    </li>
                    <li>
                      {lang === 'ar'
                        ? 'اضغط على "إضافة" للوصول الفوري إلى خزنتك الرقمية.'
                        : 'Tap "Add" to launch MY VAULT directly from your home screen.'}
                    </li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'على أندرويد أو سطح المكتب (Chrome / Edge):' : 'On Android or Desktop (Chrome / Edge):'}
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs leading-relaxed">
                    <li>
                      {lang === 'ar'
                        ? 'اضغط على أيقونة التثبيت في شريط العنوان العلوي للمتصفح أو قائمة المتصفح (⋮).'
                        : 'Click the install icon in your browser address bar or menu (⋮).'}
                    </li>
                    <li>
                      {lang === 'ar'
                        ? 'اختر "تثبيت التطبيق" (Install App) لتشغيل الخزنة كتطبيق مستقل.'
                        : 'Select "Install App" to run MY VAULT in standalone mode.'}
                    </li>
                  </ol>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-[#0A1128] text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              {lang === 'ar' ? 'حسناً، فهمت' : 'Got It'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC<{ lang: Language }> = ({ lang }) => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        {lang === 'ar'
          ? 'وضع عدم الاتصال — يتم عرض البيانات المشفرة المحفوظة محلياً'
          : 'Offline Mode — Using locally cached vault records'}
      </span>
    </div>
  );
};
