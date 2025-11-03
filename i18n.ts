import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // General
      'cancel': 'Cancel',
      'save': 'Save',
      'edit': 'Edit',
      'delete': 'Delete',
      'changeGame': 'Change Game',
      'installApp': 'Install App',
      'footer': 'Score Counter',
      'common.close': 'Close',

      // Navigation
      'nav.game': 'Game',
      'nav.tournaments': 'Tournaments',
      'nav.players': 'Players',
      'nav.stats': 'Stats',

      // Player Management
      'managePlayers': 'Manage Players',
      'addPlayer': 'Add Player',
      'addPlayerTitle': 'Add a New Player',
      'editPlayer': 'Edit Player',
      'playerNamePlaceholder': 'Player\'s name',
      'chooseAvatar': 'Choose an avatar',
      'uploadFile': 'Upload file',
      'takePhoto': 'Take photo',
      'noPlayers': 'No players found. Add one to get started!',
      'confirmDelete': 'Are you sure you want to delete {{name}}?',
      'cameraError': 'Error accessing camera.',

      // First Time User Modal
      'firstTime.title': 'Welcome!',
      'firstTime.description': 'How would you like to get started?',
      'firstTime.generate': 'Generate sample data',
      'firstTime.generateSubtext': 'Create 6 sample players to test the app.',
      'firstTime.add': 'Add my first player',
      'firstTime.addSubtext': 'Manually create your first player profile.',
      'firstTime.import': 'Import players',
      'firstTime.importSubtext': 'Feature coming soon!',
      'firstTime.importAlert': 'Importing players will be available in a future update!',

      // Game Setup
      'gameSetup.title': 'New Game',
      'gameSetup.selectType': 'Select Game Type',
      'gameSetup.fourBall': '4-Ball',
      'gameSetup.freeGame': 'Free Game',
      'gameSetup.oneCushion': '1-Cushion',
      'gameSetup.threeCushion': '3-Cushion',
      'gameSetup.playersInGame': 'Players',
      'gameSetup.availablePlayers': 'Available',
      'gameSetup.targetScore': 'Target Score',
      'gameSetup.gameMode': 'Game Mode',
      'gameSetup.roundRobin': 'Individual',
      'gameSetup.teamPlay': 'Team',
      'gameSetup.team1': 'Team 1',
      'gameSetup.team2': 'Team 2',
      'gameSetup.endCondition': 'End Condition',
      'gameSetup.equalInnings': 'Equal Innings',
      'gameSetup.suddenDeath': 'Sudden Death',
      'gameSetup.startGame': 'Start Game',

      // Handicap
      'handicap.offerTitle': 'Handicap Offer',
      'handicap.offerDescription': 'Based on averages, it is suggested that <strong>{{playerName}}</strong> receives a <strong>{{points}}-point</strong> head start.',
      'handicap.offerExplanation': 'This helps to balance the game. Do you want to apply this handicap?',
      'handicap.accept': 'Accept Handicap',
      'handicap.decline': 'Decline & Play',
      
      // Scoreboard & Game
      'noPlayersSelected': 'No players selected.',
      'scoreboard.pointsToTarget': '{{points}} to win',
      'scoreboard.average': 'Avg',
      'scoreboard.inning': 'Inning {{count}}',
      'scoreboard.last6': 'Last 6',
      'turnHistory.title': 'Turn History',
      'turnHistory.show': 'Show history',
      'turnHistory.turn': 'Turn {{count}}',
      'turnHistory.noHistory': 'No turns recorded yet.',
      'undoTurn': 'Undo',
      'scorePad.clean10': 'Clean 10',
      'scorePad.clean20': 'Clean 20',
      'scorePad.add': 'Add',
      'scorePad.endTurn': 'End Turn',
      
      // Post Game
      'postGame.title': 'Game Over',
      'postGame.winner': 'Winner',
      'postGame.handicapApplied': 'Handicap: +{{points}}',
      'postGame.average': 'Average',
      'postGame.showChart': 'Show Chart',
      'postGame.hideChart': 'Hide Chart',
      'postGame.rematch': 'Rematch',
      'postGame.newGame': 'New Game',
      
      // Stats
      'stats.title': 'Statistics',
      'stats.selectGameType': 'Select a game type to see stats.',
      'stats.noStatsForGame': 'No stats recorded for this game type yet.',
      'stats.sortBy': 'Sort by:',
      'stats.player': 'Player',
      'stats.games': 'Games',
      'stats.wins': 'Wins',
      'stats.losses': 'Losses',
      'stats.winRate': 'Win %',
      'stats.avgScore': 'Avg.',
      'stats.zeroInnings': 'Zero Innings',
      'stats.clean10s': 'Clean 10s',
      'stats.clean20s': 'Clean 20s',
      
      // Player Stats Modal
      'playerStats.close': 'Close',
      'playerStats.generalAverage': 'Overall Average',
      'playerStats.movingAverage': 'Moving Avg (10)',
      'playerStats.avgTrendTitle': 'Average Trend (Last 20)',
      'playerStats.h2hTitle': 'Head-to-Head',
      'playerStats.noH2hData': 'No 1v1 data available.',
      'playerStats.noStats': 'Not enough data to display stats.',

      // Settings
      'settings.title': 'Settings',
      'settings.colorTheme': 'Color Theme',
      'settings.language': 'Language',
      'themes.deepTeal': 'Teal',
      'themes.arcticLight': 'Light',
      'themes.crimsonNight': 'Crimson',
      'themes.sunsetOrange': 'Orange',
      'themes.cyberViolet': 'Violet',

      // Tournaments
      'tournament.title': 'Tournaments',
      'tournament.create': 'Create Tournament',
      'tournament.noTournaments': 'No tournaments found. Create one to get started!',
      'tournament.ongoing': 'Ongoing',
      'tournament.completed': 'Completed',
      'tournament.setupTitle': 'New Tournament Setup',
      'tournament.name': 'Tournament Name',
      'tournament.namePlaceholder': 'e.g., "Club Championship"',
      'tournament.selectPlayers': 'Select Players',
      'tournament.notEnoughPlayers': 'A tournament requires at least 3 players.',
      'tournament.tooManyPlayers': 'A tournament can have a maximum of 8 players.',
      'tournament.backToList': 'Back to List',
      'tournament.winner': 'Tournament Winner!',
      'tournament.leaderboard': 'Leaderboard',
      'tournament.played': 'P',
      'tournament.wins': 'W',
      'tournament.draws': 'D',
      'tournament.losses': 'L',
      'tournament.points': 'Pts',
      'tournament.matches': 'Matches',
      'tournament.matchVs': 'vs',
      'tournament.playMatch': 'Play Match',
      'tournament.cannotDeletePlayer': 'Cannot delete a player who is in an ongoing tournament.',
    }
  },
  cs: {
    translation: {
      // Obecné
      'cancel': 'Zrušit',
      'save': 'Uložit',
      'edit': 'Upravit',
      'delete': 'Smazat',
      'changeGame': 'Změnit hru',
      'installApp': 'Instalovat aplikaci',
      'footer': 'Počítadlo Skóre',
      'common.close': 'Zavřít',

      // Navigace
      'nav.game': 'Hra',
      'nav.tournaments': 'Turnaje',
      'nav.players': 'Hráči',
      'nav.stats': 'Statistiky',

      // Správa hráčů
      'managePlayers': 'Správa hráčů',
      'addPlayer': 'Přidat hráče',
      'addPlayerTitle': 'Přidat nového hráče',
      'editPlayer': 'Upravit hráče',
      'playerNamePlaceholder': 'Jméno hráče',
      'chooseAvatar': 'Vyberte avatara',
      'uploadFile': 'Nahrát soubor',
      'takePhoto': 'Vyfotit',
      'noPlayers': 'Nebyli nalezeni žádní hráči. Přidejte nějakého a začněte!',
      'confirmDelete': 'Opravdu si přejete smazat hráče {{name}}?',
      'cameraError': 'Chyba při přístupu k fotoaparátu.',

      // Modál pro prvního uživatele
      'firstTime.title': 'Vítejte!',
      'firstTime.description': 'Jak si přejete začít?',
      'firstTime.generate': 'Vygenerovat ukázková data',
      'firstTime.generateSubtext': 'Vytvoří 6 ukázkových hráčů pro otestování aplikace.',
      'firstTime.add': 'Přidat mého prvního hráče',
      'firstTime.addSubtext': 'Ručně vytvořte svůj první profil hráče.',
      'firstTime.import': 'Importovat hráče',
      'firstTime.importSubtext': 'Funkce bude brzy k dispozici!',
      'firstTime.importAlert': 'Import hráčů bude dostupný v budoucí aktualizaci!',

      // Nastavení hry
      'gameSetup.title': 'Nová hra',
      'gameSetup.selectType': 'Vyberte typ hry',
      'gameSetup.fourBall': '4-Koule',
      'gameSetup.freeGame': 'Volná hra',
      'gameSetup.oneCushion': 'Jednoband',
      'gameSetup.threeCushion': 'Trojband',
      'gameSetup.playersInGame': 'Hráči',
      'gameSetup.availablePlayers': 'K dispozici',
      'gameSetup.targetScore': 'Cílové skóre',
      'gameSetup.gameMode': 'Herní mód',
      'gameSetup.roundRobin': 'Každý s každým',
      'gameSetup.teamPlay': 'Týmová hra',
      'gameSetup.team1': 'Tým 1',
      'gameSetup.team2': 'Tým 2',
      'gameSetup.endCondition': 'Ukončení hry',
      'gameSetup.equalInnings': 'Stejný počet náběhů',
      'gameSetup.suddenDeath': 'Náhlá smrt',
      'gameSetup.startGame': 'Začít hru',
      
      // Handicap
      'handicap.offerTitle': 'Nabídka handicapu',
      'handicap.offerDescription': 'Na základě průměrů se doporučuje, aby <strong>{{playerName}}</strong> získal náskok <strong>{{points}} bodů</strong>.',
      'handicap.offerExplanation': 'Toto pomáhá vyrovnat hru. Chcete tento handicap použít?',
      'handicap.accept': 'Přijmout handicap',
      'handicap.decline': 'Odmítnout a hrát',

      // Scoreboard a hra
      'noPlayersSelected': 'Nebyli vybráni žádní hráči.',
      'scoreboard.pointsToTarget': '{{points}} do vítězství',
      'scoreboard.average': 'Prům.',
      'scoreboard.inning': 'Náběh {{count}}',
      'scoreboard.last6': 'Posl. 6',
      'turnHistory.title': 'Historie náběhů',
      'turnHistory.show': 'Ukázat historii',
      'turnHistory.turn': 'Náběh {{count}}',
      'turnHistory.noHistory': 'Zatím žádné zaznamenané náběhy.',
      'undoTurn': 'Zpět',
      'scorePad.clean10': 'Čistých 10',
      'scorePad.clean20': 'Čistých 20',
      'scorePad.add': 'Přidat',
      'scorePad.endTurn': 'Ukončit náběh',
      
      // Po hře
      'postGame.title': 'Konec hry',
      'postGame.winner': 'Vítěz',
      'postGame.handicapApplied': 'Handicap: +{{points}}',
      'postGame.average': 'Průměr',
      'postGame.showChart': 'Ukázat graf',
      'postGame.hideChart': 'Skrýt graf',
      'postGame.rematch': 'Odveta',
      'postGame.newGame': 'Nová hra',

      // Statistiky
      'stats.title': 'Statistiky',
      'stats.selectGameType': 'Vyberte typ hry pro zobrazení statistik.',
      'stats.noStatsForGame': 'Pro tento typ hry zatím nebyly zaznamenány žádné statistiky.',
      'stats.sortBy': 'Seřadit podle:',
      'stats.player': 'Hráč',
      'stats.games': 'Her',
      'stats.wins': 'Výher',
      'stats.losses': 'Proher',
      'stats.winRate': 'Výhry %',
      'stats.avgScore': 'Prům.',
      'stats.zeroInnings': 'Nulové náběhy',
      'stats.clean10s': 'Čistých 10',
      'stats.clean20s': 'Čistých 20',

      // Modál statistik hráče
      'playerStats.close': 'Zavřít',
      'playerStats.generalAverage': 'Celkový průměr',
      'playerStats.movingAverage': 'Klouzavý prům. (10)',
      'playerStats.avgTrendTitle': 'Trend průměru (posl. 20)',
      'playerStats.h2hTitle': 'Vzájemné zápasy',
      'playerStats.noH2hData': 'Žádná data 1v1 nejsou k dispozici.',
      'playerStats.noStats': 'Není dostatek dat pro zobrazení statistik.',

      // Nastavení
      'settings.title': 'Nastavení',
      'settings.colorTheme': 'Barevné téma',
      'settings.language': 'Jazyk',
      'themes.deepTeal': 'Tyrkys',
      'themes.arcticLight': 'Světlé',
      'themes.crimsonNight': 'Karmín',
      'themes.sunsetOrange': 'Oranžové',
      'themes.cyberViolet': 'Fialové',

      // Turnaje
      'tournament.title': 'Turnaje',
      'tournament.create': 'Vytvořit turnaj',
      'tournament.noTournaments': 'Nebyly nalezeny žádné turnaje. Vytvořte nějaký a začněte!',
      'tournament.ongoing': 'Probíhající',
      'tournament.completed': 'Ukončené',
      'tournament.setupTitle': 'Nastavení nového turnaje',
      'tournament.name': 'Název turnaje',
      'tournament.namePlaceholder': 'např. "Klubové mistrovství"',
      'tournament.selectPlayers': 'Vyberte hráče',
      'tournament.notEnoughPlayers': 'Turnaj vyžaduje alespoň 3 hráče.',
      'tournament.tooManyPlayers': 'Turnaj může mít maximálně 8 hráčů.',
      'tournament.backToList': 'Zpět na seznam',
      'tournament.winner': 'Vítěz turnaje!',
      'tournament.leaderboard': 'Tabulka',
      'tournament.played': 'O',
      'tournament.wins': 'V',
      'tournament.draws': 'R',
      'tournament.losses': 'P',
      'tournament.points': 'B',
      'tournament.matches': 'Zápasy',
      'tournament.matchVs': 'vs',
      'tournament.playMatch': 'Hrát zápas',
      'tournament.cannotDeletePlayer': 'Nelze smazat hráče, který je v probíhajícím turnaji.',
    }
  }
};

i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: 'cs',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18next;