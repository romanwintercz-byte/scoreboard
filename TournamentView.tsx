import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type Tournament, type Match, type TournamentSettings } from './types';
import TournamentList from './TournamentList';
import TournamentSetup from './TournamentSetup';
import TournamentDashboard from './TournamentDashboard';

const TournamentView: React.FC<{
    tournaments: Tournament[];
    players: Player[];
    onCreateTournament: (name: string, playerIds: string[], settings: TournamentSettings) => void;
    onStartMatch: (tournament: Tournament, match: Match) => void;
}> = ({ tournaments, players, onCreateTournament, onStartMatch }) => {
    const { t } = useTranslation();
    const [view, setView] = useState<'list' | 'setup'>('list');
    const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);

    const handleCreateTournament = (name: string, playerIds: string[], settings: TournamentSettings) => {
        onCreateTournament(name, playerIds, settings);
        setView('list');
    };

    if (activeTournament) {
        return (
            <TournamentDashboard 
                tournament={activeTournament}
                players={players}
                onStartMatch={onStartMatch}
                onExit={() => setActiveTournament(null)}
            />
        );
    }

    if (view === 'setup') {
        return (
            <TournamentSetup
                players={players}
                onSubmit={handleCreateTournament}
                onCancel={() => setView('list')}
            />
        );
    }
    
    return (
        <TournamentList
            tournaments={tournaments}
            players={players}
            onSelectTournament={setActiveTournament}
            onCreateNew={() => setView('setup')}
        />
    );
};


// --- Sub Components for TournamentView ---

const TournamentList: React.FC<{
    tournaments: Tournament[];
    players: Player[];
    onSelectTournament: (tournament: Tournament) => void;
    onCreateNew: () => void;
}> = ({ tournaments, players, onSelectTournament, onCreateNew }) => {
    const { t } = useTranslation();
    
    const ongoingTournaments = tournaments.filter(t => t.status === 'ongoing');
    const completedTournaments = tournaments.filter(t => t.status === 'completed');

    return (
        <div className="w-full max-w-4xl p-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-white">{t('tournament.title')}</h1>
                <button onClick={onCreateNew} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                    {t('tournament.create')}
                </button>
            </div>

            {tournaments.length === 0 ? (
                <p className="text-center text-gray-500 mt-16">{t('tournament.noTournaments')}</p>
            ) : (
                <div className="space-y-8">
                    {ongoingTournaments.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-bold text-teal-300 mb-4">{t('tournament.ongoing')}</h2>
                            <div className="space-y-3">
                                {ongoingTournaments.map(t => <TournamentListItem key={t.id} tournament={t} onSelect={() => onSelectTournament(t)} />)}
                            </div>
                        </div>
                    )}
                    {completedTournaments.length > 0 && (
                         <div>
                            <h2 className="text-2xl font-bold text-teal-300 mb-4">{t('tournament.completed')}</h2>
                            <div className="space-y-3">
                                {completedTournaments.map(t => <TournamentListItem key={t.id} tournament={t} onSelect={() => onSelectTournament(t)} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const TournamentListItem: React.FC<{ tournament: Tournament, onSelect: () => void }> = ({ tournament, onSelect }) => {
    const { t } = useTranslation();
    return (
        <button onClick={onSelect} className="w-full text-left bg-gray-800 hover:bg-gray-700 p-4 rounded-lg shadow-md transition-colors">
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-bold text-xl text-white">{tournament.name}</p>
                    <p className="text-sm text-gray-400">
                        {tournament.playerIds.length} players · {new Date(tournament.createdAt).toLocaleDateString()}
                    </p>
                </div>
                 <span className={`px-3 py-1 text-sm font-semibold rounded-full ${tournament.status === 'ongoing' ? 'bg-green-500/20 text-green-300' : 'bg-gray-600/50 text-gray-400'}`}>
                    {t(`tournament.${tournament.status}`)}
                </span>
            </div>
        </button>
    );
}

export default TournamentView;
