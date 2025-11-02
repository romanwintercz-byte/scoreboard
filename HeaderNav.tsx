import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, FirebaseUser } from './types';
import { useAuth } from './AuthContext';

const HeaderNav: React.FC<{
    currentView: View;
    onNavigate: (view: View) => void;
    onOpenSettings: () => void;
    syncStatus: 'local' | 'syncing' | 'synced';
}> = ({ currentView, onNavigate, onOpenSettings, syncStatus }) => {
    const { t } = useTranslation();
    const { user, signInWithGoogle, signOutUser, loading } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    
    const navLinkClasses = (view: View) => 
      `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        currentView === view 
        ? 'bg-[--color-primary] text-white' 
        : 'text-[--color-text-secondary] hover:bg-[--color-surface] hover:text-[--color-text-primary]'
      }`;

    const SyncIndicator: React.FC = () => {
        const statusMap = {
            local: { text: t('auth.local'), color: 'bg-gray-500' },
            syncing: { text: t('auth.syncing'), color: 'bg-yellow-500 animate-pulse' },
            synced: { text: t('auth.synced'), color: 'bg-green-500' },
        };
        const { text, color } = statusMap[syncStatus];
        return (
            <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
                <span className="text-sm">{text}</span>
            </div>
        );
    };

    return (
        <header className="absolute top-0 left-0 right-0 bg-[--color-surface] bg-opacity-50 p-4 flex justify-between items-center z-10">
            <nav className="flex items-center gap-4 bg-[--color-surface-light] rounded-lg p-1">
                <button onClick={() => onNavigate('scoreboard')} className={navLinkClasses('scoreboard')}>
                    {t('nav.game')}
                </button>
                 <button onClick={() => onNavigate('tournament')} className={navLinkClasses('tournament')}>
                    {t('nav.tournaments')}
                </button>
                <button onClick={() => onNavigate('playerManager')} className={navLinkClasses('playerManager')}>
                    {t('nav.players')}
                </button>
                <button onClick={() => onNavigate('stats')} className={navLinkClasses('stats')}>
                    {t('nav.stats')}
                </button>
            </nav>
            <div className="flex items-center gap-4">
                <button onClick={onOpenSettings} aria-label="Settings" className="p-2 bg-[--color-surface-light] rounded-lg text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <div className="relative">
                    {loading ? (
                        <div className="w-10 h-10 bg-[--color-surface-light] rounded-full animate-pulse"></div>
                    ) : user ? (
                        <div>
                            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                                <img src={user.photoURL || undefined} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full" />
                            </button>
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-[--color-surface] rounded-md shadow-lg py-1 z-20 text-[--color-text-primary]"
                                     onMouseLeave={() => setIsUserMenuOpen(false)}>
                                    <div className="px-4 py-2 text-[--color-text-secondary]">
                                        <p className="font-semibold text-sm">{t('auth.sync')}</p>
                                        <SyncIndicator />
                                    </div>
                                    <div className="border-t border-[--color-border]"></div>
                                    <button
                                        onClick={() => { signOutUser(); setIsUserMenuOpen(false); }}
                                        className="block w-full text-left px-4 py-2 text-sm hover:bg-[--color-surface-light]"
                                    >
                                        {t('nav.signOut')}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={signInWithGoogle}
                            className="bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                            {t('nav.signIn')}
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

export default HeaderNav;
