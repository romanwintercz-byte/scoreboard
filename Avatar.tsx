import React from 'react';

// Výchozí SVG cesta pro ikonu osoby, použije se jako záchranná varianta
const FALLBACK_AVATAR_PATH = 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z';

const Avatar: React.FC<{ avatar: string; className?: string }> = ({ avatar, className = "w-16 h-16" }) => {
    // Zajistí, že i když je avatar null, undefined nebo prázdný, použije se výchozí ikona
    const finalAvatarPath = avatar || FALLBACK_AVATAR_PATH;
    
    if (typeof finalAvatarPath === 'string' && finalAvatarPath.startsWith('data:image')) {
        return <img src={finalAvatarPath} alt="Avatar" className={`rounded-full object-cover ${className}`} />;
    }
    
    return (
        <div className={`rounded-full bg-indigo-500 flex items-center justify-center ${className}`}>
            <svg className="w-2/3 h-2/3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d={finalAvatarPath}></path>
            </svg>
        </div>
    );
};

export default Avatar;