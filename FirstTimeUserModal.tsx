import React from 'react';
import { useTranslation } from 'react-i18next';

interface FirstTimeUserModalProps {
    onGenerate: () => void;
    onAdd: () => void;
    onImport: () => void;
    onClose: () => void;
}

const ActionButton: React.FC<{
    onClick: () => void;
    title: string;
    subtext: string;
    icon: string;
    disabled?: boolean;
}> = ({ onClick, title, subtext, icon, disabled }) => {
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className="w-full text-left p-4 bg-gray-700 rounded-lg flex items-center gap-4 transition-all duration-200 enabled:hover:bg-indigo-600 enabled:hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
        >
            <div className="text-4xl">{icon}</div>
            <div>
                <h3 className="font-bold text-white text-lg">{title}</h3>
                <p className="text-gray-400 text-sm">{subtext}</p>
            </div>
        </button>
    );
};


const FirstTimeUserModal: React.FC<FirstTimeUserModalProps> = ({ onGenerate, onAdd, onImport, onClose }) => {
    const { t } = useTranslation();

    return (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center transform transition-transform duration-300" 
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-4xl font-extrabold text-teal-400 mb-2">{t('firstTime.title')}</h2>
                <p className="text-gray-300 mb-8">{t('firstTime.description')}</p>

                <div className="flex flex-col gap-4">
                    <ActionButton
                        onClick={onGenerate}
                        title={t('firstTime.generate')}
                        subtext={t('firstTime.generateSubtext')}
                        icon="🎲"
                    />
                    <ActionButton
                        onClick={onAdd}
                        title={t('firstTime.add')}
                        subtext={t('firstTime.addSubtext')}
                        icon="👤"
                    />
                    <ActionButton
                        onClick={onImport}
                        title={t('firstTime.import')}
                        subtext={t('firstTime.importSubtext')}
                        icon="📤"
                        disabled={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default FirstTimeUserModal;