import React, { useState } from 'react';
import { Refrigerator, RotateCcw, User as UserIcon, Languages, LogOut } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { User } from 'firebase/auth';

interface FoodieHeaderProps {
  currentDateStr: string;
  onOpenPantry: () => void;
  householdName?: string;
  onOpenProfile?: () => void;
  language?: 'en' | 'hi';
  onToggleLanguage?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  currentUser?: User | null;
  onSignInWithGoogle?: () => void;
  onSignOut?: () => void;
}

export const FoodieHeader: React.FC<FoodieHeaderProps> = ({
  currentDateStr,
  onOpenPantry,
  householdName,
  onOpenProfile,
  language = 'en',
  onToggleLanguage,
  onRefresh,
  isRefreshing = false,
  currentUser,
  onSignInWithGoogle,
  onSignOut,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const t = TRANSLATIONS[language];
  const dateObj = new Date(currentDateStr);
  const formattedDate = dateObj.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="pt-[max(var(--sat),12px)] pb-2.5 px-3.5 border-b border-orange-100/70 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
      <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto">
        {/* Row 1: Brand Logo + Name & Top Controls */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Brand & Household Name */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg shadow-sm shadow-orange-500/20 flex-shrink-0">
              🍲
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
                  Grub<span className="text-orange-500">2Day</span>
                </h1>
                {householdName && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100/80 text-orange-900 border border-orange-200/80 truncate max-w-[85px] xs:max-w-[110px] sm:max-w-[160px]">
                    {language === 'hi'
                      ? householdName
                          .replace(/['’]s Kitchen/gi, ' की रसोई')
                          .replace(/['’]s Rasoi/gi, ' की रसोई')
                          .replace(/Kitchen/gi, 'रसोई')
                          .replace(/Rasoi/gi, 'रसोई')
                          .replace(/Wifey/gi, 'साथी')
                          .replace(/Partner/gi, 'साथी')
                          .replace(/ & /g, ' और ')
                      : householdName
                          .replace(/['’]s Rasoi/gi, "'s Kitchen")
                          .replace(/Rasoi/gi, 'Kitchen')
                          .replace(/Wifey/gi, 'Partner')}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-semibold text-amber-700 mt-0.5 truncate">
                <span>{formattedDate}</span>
                <span className="mx-1">•</span>
                <span>{t.subtitle}</span>
              </p>
            </div>
          </div>

          {/* Right Action Icons (Compact & Clean - Never Overflows) */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Language Toggle */}
            {onToggleLanguage && (
              <button
                onClick={onToggleLanguage}
                className="h-8 px-2 rounded-xl bg-amber-50 hover:bg-amber-100/90 active:scale-95 text-amber-900 border border-amber-200/80 text-[11px] font-black transition-all flex items-center gap-1 shadow-2xs"
                title={t.langToggleTitle}
              >
                <Languages className="w-3.5 h-3.5 text-amber-700" />
                <span>{t.langToggleLabel}</span>
              </button>
            )}

            {/* Google Sign-in / User Account Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="h-8 pl-1 pr-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title={`Signed in as ${currentUser.displayName || currentUser.email}`}
                >
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="User avatar" 
                      className="w-6 h-6 rounded-full object-cover border border-orange-300"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-[11px] font-black flex items-center justify-center">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-slate-700 max-w-[50px] truncate hidden sm:inline">
                    {(currentUser.displayName || currentUser.email)?.split(' ')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in duration-100 text-xs">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">
                        {currentUser.displayName || 'Family Account'}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                    {onOpenProfile && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenProfile();
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-orange-50 text-slate-700 font-bold flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-orange-600" />
                        <span>{language === 'hi' ? 'प्रोफ़ाइल व प्राथमिकताएं' : 'Food Preferences'}</span>
                      </button>
                    )}
                    {onSignOut && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onSignOut();
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-2 border-t border-slate-100"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'साइन आउट' : 'Sign Out'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : onSignInWithGoogle ? (
              <button
                onClick={onSignInWithGoogle}
                className="h-8 px-2 sm:px-2.5 rounded-xl bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Sign in with Google"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="text-[11px] hidden xs:inline">{language === 'hi' ? 'लॉग इन' : 'Login'}</span>
              </button>
            ) : (
              onOpenProfile && (
                <button
                  onClick={onOpenProfile}
                  className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200/70 flex items-center justify-center transition-all shadow-2xs"
                  title={t.profileTitle}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                </button>
              )
            )}

            {/* Pantry / Fridge Button */}
            <button
              onClick={onOpenPantry}
              className="h-8 px-2 sm:px-2.5 rounded-xl bg-orange-50 hover:bg-orange-100/80 active:scale-95 text-orange-900 text-xs font-bold border border-orange-200/70 transition-all flex items-center gap-1 shadow-2xs"
              title={t.pantryTitle}
            >
              <Refrigerator className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-[11px] hidden xs:inline">{t.fridgeBtn}</span>
            </button>

            {/* Refresh & Shuffle Dishes */}
            <button
              onClick={onRefresh || (() => window.location.reload())}
              className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-orange-50 active:scale-95 text-slate-600 hover:text-orange-700 border border-slate-200/70 hover:border-orange-200 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
              title={language === 'hi' ? 'मेनू बदलें और नया सुझाव पाएं' : 'Shuffle & refresh meals'}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
