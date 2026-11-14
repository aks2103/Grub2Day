import React from 'react';
import { ExternalLink, X, ShieldAlert, CheckCircle, Users } from 'lucide-react';
import { AuthErrorInfo } from '../services/authService';

interface AuthGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorInfo: AuthErrorInfo | null;
  onContinueOffline: () => void;
  language?: 'en' | 'hi';
}

export const AuthGuidanceModal: React.FC<AuthGuidanceModalProps> = ({
  isOpen,
  onClose,
  errorInfo,
  onContinueOffline,
  language = 'en',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-orange-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-orange-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">
                {errorInfo?.title || 'Google Sign-In Status'}
              </h3>
              <p className="text-[11px] text-amber-900 font-bold">
                {language === 'hi' ? 'फ़ायरबेस प्रमाणीकरण सूचना' : 'Firebase Authentication Setup'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700 leading-relaxed overflow-y-auto max-h-[70vh]">
          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2">
            <p className="font-extrabold text-slate-900">
              Why did this happen?
            </p>
            <p className="whitespace-pre-line text-slate-600">
              {errorInfo?.message || 'Firebase Authentication requires Google Provider activation in Firebase Console.'}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>How to Enable Google Login (30 seconds):</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1 font-medium">
              <li>Open your Firebase Console project.</li>
              <li>Click <strong className="text-slate-900">Get started</strong> under Authentication.</li>
              <li>Under <strong className="text-slate-900">Sign-in method</strong>, choose <strong className="text-slate-900">Google</strong>.</li>
              <li>Toggle <strong className="text-slate-900">Enable</strong>, set support email, and save!</li>
            </ol>
          </div>

          {errorInfo?.actionUrl && (
            <a
              href={errorInfo.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <span>Open Firebase Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-[11px] text-slate-500 font-semibold text-center">
              Don't want to set up Google Auth right now? You can maintain multiple isolated profiles directly in the app!
            </p>
            <button
              onClick={() => {
                onClose();
                onContinueOffline();
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Use Household Profiles (Alok & Partner)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
