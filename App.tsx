import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// --- IKONY AVATARŮ ---
const PREDEFINED_AVATARS = [
  // Animal icons
  'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', // Person
  'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4V7h2v6h-2z', // Pet
  'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z', // Cloud
  'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z', // House
  'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-9 12l-5-5 1.41-1.41L11 13.17l7.59-7.59L20 7l-9 9z', // Mail
  'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5L20.49 19l-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z', // Search
];


// --- TYPY ---
type Player = {
  id: string;
  name: string;
  avatar: string; // Base64 Data URL for user images, or SVG path for predefined
};

type View = 'scoreboard' | 'playerManager';
type PlayerSlot = 'player1' | 'player2';
type ModalState = 
  | { view: 'closed' } 
  | { view: 'playerEditor'; player?: Player } 
  | { view: 'camera'; context: { originalPlayer?: Player, name: string, avatar: string }};


// --- KOMPONENTA: HORNÍ NAVIGACE ---
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
        <header className="absolute top-0 left-0 right-0 bg-gray-800 bg-opacity-50 p-4 flex justify-between items-center">
            <nav className="flex items-center gap-4 bg-gray-900 rounded-lg p-1">
                <button onClick={() => onNavigate('scoreboard')} className={navLinkClasses('scoreboard')}>
                    {t('nav.game')}
                </button>
                <button onClick={() => onNavigate('playerManager')} className={navLinkClasses('playerManager')}>
                    {t('nav.players')}
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

// --- KOMPONENTA: AVATAR ---
const Avatar: React.FC<{ avatar: string; className?: string }> = ({ avatar, className = "w-16 h-16" }) => {
    if (avatar.startsWith('data:image')) {
        return <img src={avatar} alt="Avatar" className={`rounded-full object-cover ${className}`} />;
    }
    // Predefined SVG
    return (
        <div className={`rounded-full bg-indigo-500 flex items-center justify-center ${className}`}>
            <svg className="w-2/3 h-2/3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d={avatar}></path>
            </svg>
        </div>
    );
};


// --- KOMPONENTA: MODÁLNÍ OKNO PRO FOCENÍ ---
const CameraCaptureModal: React.FC<{
    onCapture: (dataUrl: string) => void;
    onClose: () => void;
}> = ({ onCapture, onClose }) => {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        const enableCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera: ", err);
                alert(t('cameraError'));
                onClose();
            }
        };
        enableCamera();

        return () => { // Cleanup
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [t, onClose]);
    
    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                const { videoWidth, videoHeight } = videoRef.current;
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;
                context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                onCapture(dataUrl);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg text-center" onClick={e => e.stopPropagation()}>
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg mb-4"></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <button onClick={handleCapture} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors">
                    {t('capturePhoto')}
                </button>
            </div>
        </div>
    )
}

// --- KOMPONENTA: MODÁLNÍ OKNO PRO EDITACI HRÁČE ---
const PlayerEditorModal: React.FC<{
    playerToEdit?: Player;
    onSave: (playerData: { name: string; avatar: string }) => void;
    onClose: () => void;
    onOpenCamera: (currentState: { name: string; avatar: string }) => void;
}> = ({ playerToEdit, onSave, onClose, onOpenCamera }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(playerToEdit?.name || '');
    const [avatar, setAvatar] = useState(playerToEdit?.avatar || PREDEFINED_AVATARS[0]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        if (name.trim()) {
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
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md text-center transform transition-transform duration-300" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-teal-400 mb-6">{playerToEdit && playerToEdit.id ? t('editPlayer') : t('addPlayerTitle')}</h2>
                <Avatar avatar={avatar} className="w-24 h-24 mx-auto mb-4" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('playerNamePlaceholder')}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-teal-400" />

                <div className="text-left mb-6">
                    <p className="text-gray-400 font-semibold mb-3">{t('chooseAvatar')}</p>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <button onClick={() => fileInputRef.current?.click()} className="h-20 bg-gray-700 hover:bg-gray-600 rounded-lg flex flex-col items-center justify-center text-xs transition-colors"><span className="text-2xl mb-1">📤</span>{t('uploadFile')}</button>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <button onClick={() => onOpenCamera({ name, avatar })} className="h-20 bg-gray-700 hover:bg-gray-600 rounded-lg flex flex-col items-center justify-center text-xs transition-colors"><span className="text-2xl mb-1">📸</span>{t('takePhoto')}</button>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                        {PREDEFINED_AVATARS.map((svgPath, index) => (
                           <button key={index} onClick={() => setAvatar(svgPath)} className={`p-1 rounded-full transition-all ${avatar === svgPath ? 'ring-2 ring-teal-400' : ''}`}>
                               <Avatar avatar={svgPath} className="w-full h-full" />
                           </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={onClose} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors">{t('cancel')}</button>
                    <button onClick={handleSave} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

// --- KOMPONENTA: KARTA HRÁČE VE SPRÁVCI ---
const PlayerInfoCard: React.FC<{
    player: Player;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ player, onEdit, onDelete }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-gray-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-lg transform hover:-translate-y-1 transition-transform">
            <Avatar avatar={player.avatar} className="w-20 h-20 mb-3" />
            <p className="text-white text-lg font-semibold truncate w-full">{player.name}</p>
            <div className="flex gap-2 mt-3">
                <button onClick={onEdit} className="text-teal-400 hover:text-teal-300 text-sm font-semibold">{t('edit')}</button>
                <button onClick={onDelete} className="text-red-500 hover:text-red-400 text-sm font-semibold">{t('delete')}</button>
            </div>
        </div>
    )
}

// --- KOMPONENTA: SPRÁVA HRÁČŮ ---
const PlayerManager: React.FC<{
    players: Player[];
    onAddPlayer: () => void;
    onEditPlayer: (player: Player) => void;
    onDeletePlayer: (id: string) => void;
}> = ({ players, onAddPlayer, onEditPlayer, onDeletePlayer }) => {
    const { t } = useTranslation();

    const handleDelete = (player: Player) => {
        if (window.confirm(t('confirmDelete', { name: player.name }))) {
            onDeletePlayer(player.id);
        }
    }

    return (
        <div className="w-full max-w-4xl p-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-white">{t('managePlayers')}</h1>
                <button onClick={onAddPlayer} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                    {t('addPlayer')}
                </button>
            </div>

            {players.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {players.map(player => (
                        <PlayerInfoCard 
                            key={player.id}
                            player={player}
                            onEdit={() => onEditPlayer(player)}
                            onDelete={() => handleDelete(player)}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500 mt-16">{t('noPlayers')}</p>
            )}
        </div>
    );
}

// --- KOMPONENTA: KARTA HRÁČE NA POČÍTADLE ---
const PlayerScoreCard: React.FC<{
  player: Player | null;
  score: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSelectPlayer: () => void;
  titleKey: string;
}> = ({ player, score, onIncrement, onDecrement, onSelectPlayer, titleKey }) => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full text-center transform transition-transform duration-300">
      <div className="flex items-center justify-center gap-4 mb-4 h-16">
          {player && <Avatar avatar={player.avatar} className="w-12 h-12" />}
          <h2 className="text-3xl font-bold text-teal-400 truncate">{player ? player.name : t(titleKey)}</h2>
      </div>

      {player ? (
        <>
            <p className="text-8xl font-mono font-extrabold text-white mb-6">{score}</p>
            <div className="flex justify-center gap-4">
            <button onClick={onDecrement} aria-label={t('aria.decrement', { player: player.name })}
                className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-16 h-16 flex items-center justify-center text-4xl shadow-lg transform hover:scale-110 transition-all duration-200 ease-in-out">
                -
            </button>
            <button onClick={onIncrement} aria-label={t('aria.increment', { player: player.name })}
                className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full w-16 h-16 flex items-center justify-center text-4xl shadow-lg transform hover:scale-110 transition-all duration-200 ease-in-out">
                +
            </button>
            </div>
        </>
      ) : (
        <div className="h-[148px] flex items-center justify-center">
            <button onClick={onSelectPlayer} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200">
                {t(titleKey)}
            </button>
        </div>
      )}
    </div>
  );
};


// --- VÝBĚR HRÁČE (MODÁLNÍ OKNO) ---
const PlayerSelectionModal: React.FC<{
  players: Player[];
  onSelect: (player: Player) => void;
  onClose: () => void;
}> = ({ players, onSelect, onClose }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-teal-400 mb-6">{t('selectPlayerTitle')}</h2>
        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
          {players.length > 0 ? (
            players.map(p => (
              <button key={p.id} onClick={() => onSelect(p)} className="flex items-center gap-4 text-white bg-indigo-600 hover:bg-indigo-700 font-semibold py-3 px-4 rounded-lg w-full transition-colors duration-200">
                <Avatar avatar={p.avatar} className="w-8 h-8"/>
                <span>{p.name}</span>
              </button>
            ))
          ) : (
            <p className="text-gray-400">{t('noAvailablePlayers')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// --- HLAVNÍ KOMPONENTA APLIKACE ---
const App: React.FC = () => {
  const { t } = useTranslation();
  
  // --- STAVY ---
  const [view, setView] = useState<View>('scoreboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerOneScore, setPlayerOneScore] = useState(0);
  const [playerTwoScore, setPlayerTwoScore] = useState(0);
  const [selectedPlayer1Id, setSelectedPlayer1Id] = useState<string | null>(null);
  const [selectedPlayer2Id, setSelectedPlayer2Id] = useState<string | null>(null);
  const [isSelectingFor, setIsSelectingFor] = useState<PlayerSlot | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ view: 'closed' });

  // --- ODVOZENÉ STAVY ---
  const player1 = useMemo(() => players.find(p => p.id === selectedPlayer1Id) || null, [players, selectedPlayer1Id]);
  const player2 = useMemo(() => players.find(p => p.id === selectedPlayer2Id) || null, [players, selectedPlayer2Id]);
  const availablePlayers = useMemo(() => {
    if (!isSelectingFor) return [];
    const otherPlayerId = isSelectingFor === 'player1' ? selectedPlayer2Id : selectedPlayer1Id;
    return players.filter(p => p.id !== otherPlayerId);
  }, [players, isSelectingFor, selectedPlayer1Id, selectedPlayer2Id]);

  // --- FUNKCE PRO SPRÁVU HRÁČŮ ---
  const handleSavePlayer = useCallback((playerData: { name: string; avatar: string }) => {
    if (modalState.view === 'playerEditor') {
        const playerToEdit = modalState.player;
        if (playerToEdit && playerToEdit.id) { // Edit existing
            setPlayers(prev => prev.map(p => p.id === playerToEdit.id ? { ...p, ...playerData } : p));
        } else { // Add new
            const newPlayer: Player = { id: Date.now().toString(), ...playerData };
            setPlayers(prev => [...prev, newPlayer]);
        }
    }
    setModalState({ view: 'closed' });
  }, [modalState]);
  
  const deletePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    if (selectedPlayer1Id === id) setSelectedPlayer1Id(null);
    if (selectedPlayer2Id === id) setSelectedPlayer2Id(null);
  };

  const openCameraHandler = (editorState: { name: string, avatar: string }) => {
    if (modalState.view === 'playerEditor') {
        setModalState({
            view: 'camera',
            context: {
                originalPlayer: modalState.player,
                ...editorState
            }
        });
    }
  };

  const handleCapturedImage = useCallback((dataUrl: string) => {
    if (modalState.view === 'camera') {
        const { context } = modalState;
        setModalState({
            view: 'playerEditor',
            player: {
                ...(context.originalPlayer || { id: '', name: '' }),
                name: context.name,
                avatar: dataUrl
            }
        });
    }
  }, [modalState]);

  const closeCameraHandler = () => {
    if (modalState.view === 'camera') {
        const { context } = modalState;
        setModalState({
            view: 'playerEditor',
            player: {
                 ...(context.originalPlayer || { id: '', name: '' }),
                 name: context.name,
                 avatar: context.avatar,
            }
        });
    }
  };

  // --- OVLÁDACÍ FUNKCE ---
  const handleReset = () => {
    setPlayerOneScore(0);
    setPlayerTwoScore(0);
  }
  
  const handleSelectPlayer = (player: Player) => {
    if (isSelectingFor === 'player1') setSelectedPlayer1Id(player.id);
    else if (isSelectingFor === 'player2') setSelectedPlayer2Id(player.id);
    setIsSelectingFor(null);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-4 pt-24 font-sans antialiased">
      <HeaderNav currentView={view} onNavigate={setView} />
      
      {/* --- Modální okna --- */}
      {isSelectingFor && <PlayerSelectionModal players={availablePlayers} onSelect={handleSelectPlayer} onClose={() => setIsSelectingFor(null)}/>}
      
      {modalState.view === 'playerEditor' && 
        <PlayerEditorModal 
            playerToEdit={modalState.player}
            onSave={handleSavePlayer}
            onClose={() => setModalState({ view: 'closed' })}
            onOpenCamera={openCameraHandler}
        />}
        
      {modalState.view === 'camera' && 
        <CameraCaptureModal 
            onCapture={handleCapturedImage} 
            onClose={closeCameraHandler} 
        />}

      <main className="w-full max-w-4xl flex flex-col items-center">
        {view === 'scoreboard' ? (
          <>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
              {t('title')}
            </h1>
            <div className="flex flex-col md:flex-row gap-8 mb-8 w-full">
              <PlayerScoreCard player={player1} titleKey="selectPlayer1" score={playerOneScore}
                onIncrement={() => setPlayerOneScore(s => s + 1)}
                onDecrement={() => setPlayerOneScore(s => Math.max(0, s - 1))}
                onSelectPlayer={() => setIsSelectingFor('player1')}
              />
              <PlayerScoreCard player={player2} titleKey="selectPlayer2" score={playerTwoScore}
                onIncrement={() => setPlayerTwoScore(s => s + 1)}
                onDecrement={() => setPlayerTwoScore(s => Math.max(0, s - 1))}
                onSelectPlayer={() => setIsSelectingFor('player2')}
              />
            </div>
            <div className="text-center">
              <button onClick={handleReset} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200">
                {t('reset')}
              </button>
            </div>
          </>
        ) : (
          <PlayerManager 
            players={players}
            onAddPlayer={() => setModalState({ view: 'playerEditor' })}
            onEditPlayer={(p) => setModalState({ view: 'playerEditor', player: p })}
            onDeletePlayer={deletePlayer}
          />
        )}
      </main>

      <footer className="absolute bottom-4 text-gray-500 text-sm">
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
};

export default App;
