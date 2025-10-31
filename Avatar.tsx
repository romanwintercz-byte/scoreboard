import React from 'react';

const Avatar: React.FC<{ avatar: string; className?: string }> = ({ avatar, className = "w-16 h-16" }) => {
    if (avatar.startsWith('data:image')) {
        return <img src={avatar} alt="Avatar" className={`rounded-full object-cover ${className}`} />;
    }
    return (
        <div className={`rounded-full bg-indigo-500 flex items-center justify-center ${className}`}>
            <svg className="w-2/3 h-2/3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d={avatar}></path>
            </svg>
        </div>
    );
};

export default Avatar;