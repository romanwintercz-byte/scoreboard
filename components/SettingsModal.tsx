import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Theme } from '../hooks';
import { exportDataToFile } from '../utils';
import { AppDataHook } from '../hooks';
import { FullExportData, Player, AllStats, GameRecord, Tournament } from '../types';

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
    appData: AppDataHook;
}> = ({ currentTheme, onThemeChange, onClose, appData }) => {
    const { t, i18n } = useTranslation();
    const importFileRef = useRef<HTMLInputElement>(null);
    const { players, stats, completedGamesLog, tournaments, setPlayers, setStats, setCompletedGamesLog, setTournaments } = appData;

    const changeLanguage = (lng: string) => i18n.changeLanguage(lng);
    const currentLanguage = i18n.language || 'cs';

    const handleExport = () => {
        const exportObject: FullExportData = {
            type: 'ScoreCounterFullBackup',
            version: 1,
            exportedAt: new Date().toISOString(),
            data: {
                players,
                stats,
                completedGamesLog,
                tournaments,
            },
        };
        const date = new Date().toISOString().split('T')[0];
        exportDataToFile(exportObject, `score-counter-backup-${date}.json`);
    };
    
    const handleImportClick = () => {
        importFileRef.current?.click();
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File is not text");
                const parsedData = JSON.parse(text) as FullExportData;

                if (parsedData.type !== 'ScoreCounterFullBackup' || !parsedData.data) {
                    throw new Error("Invalid file format");
                }
                
                if (window.confirm(t('settings.importWarningBody') as string)) {
                    setPlayers(parsedData.data.players || []);
                    setStats(parsedData.data.stats || {});
                    setCompletedGamesLog(parsedData.data.completedGamesLog || []);
                    setTournaments(parsedData.data.tournaments || []);
                    alert(t('import.success'));
                    window.location.reload();
                }
            } catch (error) {
                console.error("Import failed:", error);
                alert(t('import.error.invalid'));
            } finally {
                // Reset file input
                if (event.target) {
                    event.target.value = '';
                }
            }
        };
        reader.onerror = () => {
             alert(t('import.error.file'));
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[--color-surface] rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-[--color-accent] mb-6 text-center">{t('settings.title')}</h2>
                
                <div className="space-y-6">
                    {/* Color Theme */}
                    <div className="text-left">
                        <p className="text-[--color-text-secondary] font-semibold mb-3">{t('settings.colorTheme')}</p>
                        <div className="grid grid-cols-5 gap-3">
                            {THEMES.map(theme => (
                                <button key={theme.id} onClick={() => onThemeChange(theme.id)} className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${currentTheme === theme.id ? 'ring-2 ring-[--color-accent]' : ''}`}>
                                    <div className="w-10 h-10 rounded-full border-2 border-white/20" style={{ backgroundColor: theme.color }}></div>
                                    <span className="text-xs text-[--color-text-primary]">{t(theme.nameKey)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Language */}
                    <div className="text-left">
                        <p className="text-[--color-text-secondary] font-semibold mb-3">{t('settings.language')}</p>
                        <div className="bg-[--color-surface-light] rounded-lg p-1 flex">
                            <button onClick={() => changeLanguage('cs')} className={`w-full px-3 py-2 text-sm font-semibold rounded-md transition-colors ${currentLanguage.startsWith('cs') ? 'bg-[--color-primary] text-white' : 'text-[--color-text-primary] hover:bg-[--color-bg]'}`}>Čeština</button>
                            <button onClick={() => changeLanguage('en')} className={`w-full px-3 py-2 text-sm font-semibold rounded-md transition-colors ${currentLanguage.startsWith('en') ? 'bg-[--color-primary] text-white' : 'text-[--color-text-primary] hover:bg-[--color-bg]'}`}>English</button>
                        </div>
                    </div>

                    {/* Data Management */}
                    <div className="text-left border-t border-[--color-border] pt-6">
                         <p className="text-[--color-text-secondary] font-semibold mb-3">{t('settings.dataManagement')}</p>
                         <div className="space-y-3">
                            <button onClick={handleExport} className="w-full text-left p-4 bg-[--color-surface-light] rounded-lg flex items-center gap-4 transition-colors hover:bg-[--color-primary]">
                                <div className="text-2xl">📤</div>
                                <div>
                                    <h3 className="font-bold text-[--color-text-primary] text-md">{t('settings.exportAll')}</h3>
                                    <p className="text-[--color-text-secondary] text-xs">{t('settings.exportAllDescription')}</p>
                                </div>
                            </button>
                            <button onClick={handleImportClick} className="w-full text-left p-4 bg-[--color-surface-light] rounded-lg flex items-center gap-4 transition-colors hover:bg-[--color-primary]">
                                <input type="file" ref={importFileRef} onChange={handleFileSelected} accept=".json" className="hidden" />
                                <div className="text-2xl">📥</div>
                                <div>
                                    <h3 className="font-bold text-[--color-text-primary] text-md">{t('settings.importAll')}</h3>
                                    <p className="text-[--color-text-secondary] text-xs">{t('settings.importAllDescription')}</p>
                                </div>
                            </button>
                         </div>
                    </div>
                </div>
                
                <button onClick={onClose} className="w-full bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold py-3 rounded-lg transition-colors mt-8">{t('common.close')}</button>
            </div>
        </div>
    );
};

export default SettingsModal;