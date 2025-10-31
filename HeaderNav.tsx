
import React from 'react';
import { useTranslation } from 'react-i18next';
import { type View } from './types';

const HeaderNav: React.FC<{
    currentView: View;
    onNavigate: (view: View) => void;
}> = ({ currentView, onNavigate }) => {
    const { t, i18n } = useTranslation();
    const changeLanguage = (lng: string) => i18n.changeLanguage(lng);
    
    const navLinkClasses = (view: View) => 
      `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        currentView === view 
        ? 'bg-teal-500 text-white' 
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`;

    return (
        <header className="absolute top-0 left-0 right-0 bg-gray-800 bg-opacity-50 p-4 flex justify-between items-center z-10">
            <nav className="flex items-center gap-4 bg-gray-900 rounded-lg p-1">
                <button onClick={() => onNavigate('scoreboard')} className={navLinkClasses('scoreboard')}>
                    {t('nav.game')}
                </button>
                <button onClick={() => onNavigate('playerManager')} className={navLinkClasses('playerManager')}>
                    {t('nav.players')}
                </button>
                <button onClick={() => onNavigate('stats')} className={navLinkClasses('stats')}>
                    {t('nav.stats')}
                </button>
            </nav>
            <div className="bg-gray-900 rounded-lg p-1">
              <button onClick={() => changeLanguage('cs')} className={`px-3 py-1 text-sm font-semibold rounded-md ${i18n.language.startsWith('cs') ? 'text-teal-300' : 'text-gray-400 hover:text-white'}`}>CS</button>
              <span className="text-gray-600">|</span>
              <button onClick={() => changeLanguage('en')} className={`px-3 py-1 text-sm font-semibold rounded-md ${i18n.language.startsWith('en') ? 'text-teal-300' : 'text-gray-400 hover:text-white'}`}>EN</button>
            </div>
        </header>
    );
}

export default HeaderNav;