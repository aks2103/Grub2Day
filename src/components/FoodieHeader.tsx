import React, { useState } from 'react';
import { Refrigerator, RotateCcw, User as UserIcon, Languages, LogOut, Check, Plus, Globe } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { User } from 'firebase/auth';
import { HouseholdProfile } from '../services/authService';

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
  activeProfileId?: string;
  householdProfiles?: HouseholdProfile[];
  onSelectProfile?: (profileId: string) => void;
  onAddNewProfile?: () => void;
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
  activeProfileId = 'alok',
  householdProfiles = [],
  onSelectProfile,
  onAddNewProfile,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const t = TRANSLATIONS[language];
  const dateObj = new Date(currentDateStr);
  const formattedDate = dateObj.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const activeProfile = householdProfiles.find(p => p.id === activeProfileId) || householdProfiles[0] || {
    id: 'alok',
    name: 'Alok',
    role: 'Husband',
    avatarIcon: '👨‍💼',
  };

  const displayName = currentUser
    ? (currentUser.displayName || currentUser.email?.split('@')[0] || 'User')
    : activeProfile.name;

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

            {/* User Profile & Account Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-8 pl-1.5 pr-2 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200/80 hover:border-orange-200 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title={`Profile: ${displayName}`}
              >
                {currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="User avatar" 
                    className="w-5 h-5 rounded-full object-cover border border-orange-300"
                  />
                ) : (
                  <span className="text-sm">{activeProfile.avatarIcon || '👤'}</span>
                )}
                <span className="text-[11px] font-black text-slate-800 max-w-[55px] xs:max-w-[75px] truncate">
                  {displayName.split(' ')[0]}
                </span>
              </button>

              {/* Profile Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in duration-100 text-xs">
                  {/* Active Header */}
                  <div className="px-3 py-2 border-b border-slate-100 bg-orange-50/40">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {language === 'hi' ? 'सक्रिय प्रोफ़ाइल' : 'Active Profile'}
                    </p>
                    <p className="font-black text-slate-900 truncate text-xs mt-0.5 flex items-center gap-1">
                      <span>{activeProfile.avatarIcon || '👤'}</span>
                      <span>{displayName}</span>
                      {currentUser && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 ml-auto">
                          Google
                        </span>
                      )}
                    </p>
                    {currentUser && (
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {currentUser.email}
                      </p>
                    )}
                  </div>

                  {/* Switch Household Profiles */}
                  <div className="py-1">
                    <p className="px-3 pt-1 pb-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      {language === 'hi' ? 'सदस्य चुनें' : 'Switch Member'}
                    </p>
                    {householdProfiles.map(p => {
                      const isActive = !currentUser && activeProfileId === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setShowUserMenu(false);
                            if (onSelectProfile) onSelectProfile(p.id);
                          }}
                          className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs font-bold transition-colors ${
                            isActive
                              ? 'bg-orange-50 text-orange-950 font-black'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{p.avatarIcon}</span>
                            <span>{p.name}</span>
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-orange-600" />}
                        </button>
                      );
                    })}

                    {onAddNewProfile && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onAddNewProfile();
                        }}
                        className="w-full text-left px-3 py-1.5 text-slate-600 hover:text-orange-700 hover:bg-orange-50 flex items-center gap-2 text-xs font-bold"
                      >
                        <Plus className="w-3.5 h-3.5 text-orange-500" />
                        <span>{language === 'hi' ? '+ नया सदस्य जोड़ें' : '+ Add Family Member'}</span>
                      </button>
                    )}
                  </div>

                  {/* Cloud Sync with Google */}
                  <div className="pt-1 border-t border-slate-100">
                    {currentUser ? (
                      onSignOut && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onSignOut();
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? 'गूगल साइन आउट' : 'Sign Out of Google'}</span>
                        </button>
                      )
                    ) : (
                      onSignInWithGoogle && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onSignInWithGoogle();
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-700 font-black flex items-center gap-2"
                        >
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                          <span>{language === 'hi' ? 'गूगल से लॉगिन करें' : 'Sign in with Google'}</span>
                        </button>
                      )
                    )}
                  </div>

                  {/* Food Preferences Modal */}
                  {onOpenProfile && (
                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenProfile();
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-orange-50 text-slate-700 font-bold flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-orange-600" />
                        <span>{language === 'hi' ? 'भोजन प्राथमिकताएं बदलें' : 'Edit Food Preferences'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

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
