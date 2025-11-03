import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Player } from '../types';
import Avatar from './Avatar';
import { PREDEFINED_AVATARS_EDITOR } from '../constants';
import { triggerHapticFeedback } from '../utils';


const PlayerEditorModal: React.FC<{
    playerToEdit?: Player;
    onSave: (playerData: { name: string; avatar: string }) => void;
    onClose: () => void;
    onOpenCamera: (currentState: { name: string; avatar: string }) => void;
}> = ({ playerToEdit, onSave, onClose, onOpenCamera }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(playerToEdit?.name || '');
    const [avatar, setAvatar] = useState(playerToEdit?.avatar || PREDEFINED_AVATARS_EDITOR[0]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        if (name.trim()) {
            triggerHapticFeedback(50);
            onSave({ name: name.trim(), avatar });
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40 p-4" onClick={onClose}>
            <div className="bg-[--color-surface] rounded-2xl shadow-2xl p-6 w-full max-w-md text-center transform transition-transform duration-300" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-[--color-accent] mb-6">{playerToEdit && playerToEdit.id ? t('editPlayer') : t('addPlayerTitle')}</h2>
                <Avatar avatar={avatar} className="w-24 h-24 mx-auto mb-4" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('playerNamePlaceholder') as string}
                    className="w-full bg-[--color-surface-light] text-[--color-text-primary] rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-[--color-accent]" />

                <div className="text-left mb-6">
                    <p className="text-[--color-text-secondary] font-semibold mb-3">{t('chooseAvatar')}</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button onClick={() => fileInputRef.current?.click()} className="h-20 bg-[--color-surface-light] hover:bg-[--color-bg] rounded-lg flex flex-col items-center justify-center text-xs transition-colors"><span className="text-2xl mb-1">📤</span>{t('uploadFile')}</button>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <button onClick={() => onOpenCamera({ name, avatar })} className="h-20 bg-[--color-surface-light] hover:bg-[--color-bg] rounded-lg flex flex-col items-center justify-center text-xs transition-colors"><span className="text-2xl mb-1">📸</span>{t('takePhoto')}</button>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                        {PREDEFINED_AVATARS_EDITOR.map((svgPath, index) => (
                           <button key={index} onClick={() => setAvatar(svgPath)} className={`p-1 rounded-full transition-all ${avatar === svgPath ? 'ring-2 ring-[--color-accent]' : ''}`}>
                               <Avatar avatar={svgPath} className="w-full h-full" />
                           </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={onClose} className="w-full bg-[--color-surface-light] hover:bg-[--color-border] text-[--color-text-primary] font-bold py-3 rounded-lg transition-colors">{t('cancel')}</button>
                    <button onClick={handleSave} className="w-full bg-[--color-green] hover:bg-[--color-green-hover] text-white font-bold py-3 rounded-lg transition-colors">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

export default PlayerEditorModal;