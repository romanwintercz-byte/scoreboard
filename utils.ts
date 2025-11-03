import { Match, Player, TournamentSettings, GameRecord } from './types';

/**
 * Triggers haptic feedback (vibration) on supported devices.
 * @param pattern A number or array of numbers representing the vibration pattern in milliseconds.
 */
export const triggerHapticFeedback = (pattern: number | number[] = 50) => {
    if (window.navigator && 'vibrate' in window.navigator) {
        try {
            window.navigator.vibrate(pattern);
        } catch (error) {
            console.warn("Haptic feedback failed:", error);
        }
    }
};

/**
 * Creates a JSON blob from data and triggers a download.
 * @param data The JavaScript object to export.
 * @param filename The desired name for the downloaded file.
 */
export const exportDataToFile = (data: object, filename: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


// --- TOURNAMENT GENERATION UTILS ---

type PlayerWithStats = Player & { average: number };

export const generateRoundRobinMatches = (playerIds: string[]): Match[] => {
    const matches: Match[] = [];
    for (let i = 0; i < playerIds.length; i++) {
        for (let j = i + 1; j < playerIds.length; j++) {
            matches.push({
                id: `match-${Date.now()}-${i}-${j}`,
                player1Id: playerIds[i],
                player2Id: playerIds[j],
                status: 'pending',
            });
        }
    }
    return matches;
};

export const generateKnockoutBracket = (playersWithStats: PlayerWithStats[], settings: TournamentSettings): Match[] => {
    let players = [...playersWithStats];

    if (settings.seeding === 'random') {
        // Fisher-Yates shuffle
        for (let i = players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [players[i], players[j]] = [players[j], players[i]];
        }
    } else { // 'average'
        players.sort((a, b) => b.average - a.average);
    }
    
    const numPlayers = players.length;
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(numPlayers)));
    const byes = bracketSize - numPlayers;

    const matches: Match[] = [];
    const rounds: Match[][] = [];

    // --- Round 1 ---
    const round1: Match[] = [];
    const numRound1Matches = bracketSize / 2;
    const playersInRound1 = players.slice(byes);
    const topSeedsWithByes = players.slice(0, byes);

    for (let i = 0; i < numRound1Matches - byes; i++) {
        const p1 = playersInRound1[i];
        const p2 = playersInRound1[playersInRound1.length - 1 - i];
        round1.push({
            id: `match-${Date.now()}-r1-${i}`,
            player1Id: p1.id,
            player2Id: p2.id,
            status: 'pending',
            round: 1,
        });
    }
    rounds.push(round1);

    // --- Subsequent Rounds ---
    let currentRoundPlayers = topSeedsWithByes.length + round1.length;
    let roundNum = 2;
    while (currentRoundPlayers > 1) {
        const nextRound: Match[] = [];
        const numMatchesInRound = currentRoundPlayers / 2;
        for (let i = 0; i < numMatchesInRound; i++) {
            nextRound.push({
                id: `match-${Date.now()}-r${roundNum}-${i}`,
                player1Id: null,
                player2Id: null,
                status: 'pending',
                round: roundNum,
            });
        }
        rounds.push(nextRound);
        currentRoundPlayers /= 2;
        roundNum++;
    }

    // --- Link matches together ---
    const allMatches = rounds.flat();
    
    // Link round 1 matches to round 2
    for(let i = 0; i < round1.length; i++) {
        const match = round1[i];
        const nextMatchIndex = Math.floor(i / 2);
        match.nextMatchId = rounds[1][nextMatchIndex].id;
    }

    // Pass top seeds with byes directly to round 2
    for(let i = 0; i < topSeedsWithByes.length; i++) {
        const player = topSeedsWithByes[i];
        const targetMatchIndex = Math.floor(i / 2);
        const targetMatch = rounds[1][targetMatchIndex];
        if (i % 2 === 0) {
            targetMatch.player1Id = player.id;
        } else {
            targetMatch.player2Id = player.id;
        }
    }

    // Link all other rounds
    for (let r = 1; r < rounds.length - 1; r++) {
        for (let i = 0; i < rounds[r].length; i++) {
            const match = rounds[r][i];
            const nextMatchIndex = Math.floor(i / 2);
            match.nextMatchId = rounds[r+1][nextMatchIndex].id;
        }
    }
    
    return allMatches;
};
