import React from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { Theme } from './useTheme';

const THEMES: { id: Theme; nameKey: string; color: string }[] = [
    { id: 'deep-teal', nameKey: 'themes.deepTeal', color: '#10b981' },
    { id: 'arctic-light', nameKey: 'themes.arcticLight', color: '#3b82f6' },
    { id: 'crimson-night', nameKey: 'themes.crimsonNight', color: '#dc2626' },
    { id: 'sunset-orange', nameKey: 'themes.sunsetOrange', color: '#f97316' },
    { id: 'cyber-violet', nameKey: 'themes.cyberViolet', color: '#a855f7' },
];

const SettingsModal: React.FC<{
    currentTheme: Theme;
    onThemeChange: (theme: Theme) => void;
    onClose: () => void;
}> = ({ currentTheme, onThemeChange, onClose }) => {
    const { t, i18n } = useTranslation();
    const changeLanguage = (lng: string) => i18next.changeLanguage(lng);
    const currentLanguage = i18n.language || 'cs';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[--color-surface] rounded-2xl shadow-2xl p-6 w-full max-w-md text-center" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-[--color-accent] mb-6">{t('settings.title')}</h2>
                
                <div className="text-left mb-6">
                    <p className="text-[--color-text-secondary] font-semibold mb-3">{t('settings.colorTheme')}</p>
                    <div className="grid grid-cols-5 gap-3">
                        {THEMES.map(theme => (
                            <button 
                                key={theme.id}
                                onClick={() => onThemeChange(theme.id)}
                                className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${currentTheme === theme.id ? 'ring-2 ring-[--color-accent]' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-full border-2 border-white/20" style={{ backgroundColor: theme.color }}></div>
                                <span className="text-xs text-[--color-text-primary]">{t(theme.nameKey)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="text-left mb-6">
                    <p className="text-[--color-text-secondary] font-semibold mb-3">{t('settings.language')}</p>
                     <div className="bg-[--color-surface-light] rounded-lg p-1 flex">
                        <button onClick={() => changeLanguage('cs')} className={`w-full px-3 py-2 text-sm font-semibold rounded-md transition-colors ${currentLanguage.startsWith('cs') ? 'bg-[--color-primary] text-white' : 'text-[--color-text-primary] hover:bg-[--color-bg]'}`}>Čeština</button>
                        <button onClick={() => changeLanguage('en')} className={`w-full px-3 py-2 text-sm font-semibold rounded-md transition-colors ${currentLanguage.startsWith('en') ? 'bg-[--color-primary] text-white' : 'text-[--color-text-primary] hover:bg-[--color-bg]'}`}>English</button>
                    </div>
                </div>
                
                <button onClick={onClose} className="w-full bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold py-3 rounded-lg transition-colors">{t('common.close')}</button>
            </div>
        </div>
    );
};

export default SettingsModal;
