import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "title": "Score Counter",
      "undoTurn": "Undo Last Turn",
      "changeGame": "Change Game",
      "footer": "Created with React, TypeScript and Tailwind CSS.",
      "managePlayers": "Manage Players",
      "addPlayer": "Add Player",
      "playerNamePlaceholder": "Player name...",
      "noPlayers": "No players have been added yet.",
      "noPlayersSelected": "No players selected for the game.",
      "edit": "Edit",
      "delete": "Delete",
      "save": "Save",
      "cancel": "Cancel",
      "confirmDelete": "Are you sure you want to delete {{name}}?",
      "common": {
        "yes": "Yes",
        "no": "No"
      },
      "nav": {
        "game": "Game",
        "players": "Players",
        "stats": "Leaderboard",
        "tournaments": "Tournaments"
      },
      "addPlayerTitle": "Add New Player",
      "editPlayer": "Edit Player",
      "chooseAvatar": "Choose Avatar",
      "uploadFile": "Upload",
      "takePhoto": "Take Photo",
      "capturePhoto": "Capture",
      "cameraError": "Could not access the camera. Please check permissions.",
      "gameSetup": {
        "title": "Game Setup",
        "selectType": "Select Game Type",
        "fourBall": "Four-Ball",
        "threeBall": "Three-Ball",
        "freeGame": "Free Game",
        "oneCushion": "One-Cushion",
        "threeCushion": "Three-Cushion",
        "startGame": "Start Game",
        "availablePlayers": "Available Players",
        "playersInGame": "Players in Game",
        "selectUpTo4": "Select up to 4 players",
        "gameMode": "Game Mode",
        "roundRobin": "Round Robin",
        "teamPlay": "Team Play",
        "team1": "Team 1",
        "team2": "Team 2",
        "targetScore": "Target Score",
        "endCondition": "End Condition",
        "suddenDeath": "Sudden Death",
        "equalInnings": "Equal Innings",
        "addPlayerToTeam": "Add Player",
        "allowOvershooting": "Allow Overshooting"
      },
      "noAvailablePlayers": "No other players available.",
      "gameMode_round-robin": "{{type}} / Round Robin",
      "gameMode_team": "{{type}} / Team Play",
      "scoreboard": {
        "currentTurnScore": "Current Turn",
        "inning": "Inning {{count}}",
        "average": "Avg",
        "last6": "Last 6",
        "pointsToTarget": "To Target: {{points}}"
      },
      "scorePad": {
        "endTurn": "End Turn",
        "clean10": "Clean 10",
        "clean20": "Clean 20",
        "add": "Add"
      },
      "stats": {
        "title": "Leaderboard",
        "selectGameType": "Select a game type to see the leaderboard",
        "noStatsForGame": "No statistics available for this game type yet.",
        "player": "Player",
        "games": "Games",
        "wins": "Wins",
        "losses": "Losses",
        "winRate": "Win %",
        "avgScore": "Avg",
        "highestScoreInGame": "Best",
        "sortBy": "Sort by:",
        "playerStatsTitle": "Player Statistics",
        "zeroInnings": "Zero Innings",
        "clean10s": "Clean 10s",
        "clean20s": "Clean 20s"
      },
       "playerStats": {
        "title": "Player Profile",
        "noStats": "This player has not played any games yet.",
        "summaryFor": "Summary for",
        "close": "Close",
        "generalAverage": "General Average",
        "movingAverage": "Moving Average (10 Games)",
        "allGames": "All Games",
        "h2hTitle": "Head-to-Head",
        "noH2hData": "No head-to-head games played yet.",
        "avgTrendTitle": "Average Trend (Last 20 Games)"
      },
      "firstTime": {
        "title": "Welcome!",
        "description": "It looks like this is your first time here. How would you like to start?",
        "generate": "Generate 10 Sample Players",
        "generateSubtext": "Explore the app with pre-filled data.",
        "add": "Add Your First Player",
        "addSubtext": "Start building your own roster.",
        "import": "Import Players",
        "importSubtext": "(Coming Soon)",
        "importAlert": "Player data import feature is coming soon!"
      },
      "postGame": {
          "title": "Final Results",
          "winner": "Winner",
          "rematch": "Rematch",
          "newGame": "New Game",
          "average": "Average",
          "handicapApplied": "Handicap: +{{points}}",
          "scoreProgression": "Score Progression",
          "showChart": "Show Chart",
          "hideChart": "Hide Chart"
      },
      "handicap": {
          "offerTitle": "Handicap Offer",
          "offerDescription": "Based on recent performance, we suggest giving <strong>{{playerName}}</strong> a handicap of <strong>{{points}}</strong> points to balance the game.",
          "offerExplanation": "This is calculated from the players' averages. Do you want to apply this handicap?",
          "accept": "Accept Handicap",
          "decline": "Decline & Start"
      },
      "tournament": {
        "title": "Tournaments",
        "create": "Create New Tournament",
        "noTournaments": "No tournaments have been created yet.",
        "ongoing": "Ongoing",
        "completed": "Completed",
        "select": "Select Tournament",
        "setupTitle": "New Tournament Setup",
        "name": "Tournament Name",
        "namePlaceholder": "e.g., 'Friday Night League'",
        "selectPlayers": "Select Players (3-8)",
        "notEnoughPlayers": "You need at least 3 players to start a tournament.",
        "tooManyPlayers": "Maximum of 8 players allowed for a tournament.",
        "backToList": "Back to Tournaments",
        "leaderboard": "Leaderboard",
        "matches": "Matches",
        "pos": "Pos",
        "played": "P",
        "wins": "W",
        "draws": "D",
        "losses": "L",
        "points": "Pts",
        "playMatch": "Play Match",
        "matchVs": "vs",
        "winner": "Tournament Winner",
        "cannotDeletePlayer": "This player cannot be deleted as they are part of an ongoing tournament."
      },
      "turnHistory": {
        "show": "Recent Turns",
        "title": "Turn History",
        "turn": "Turn {{count}}",
        "noHistory": "No history for this game."
      }
    }
  },
  cs: {
    translation: {
      "title": "Počítadlo Skóre",
      "undoTurn": "Vzít zpět tah",
      "changeGame": "Změnit hru",
      "footer": "Vytvořeno s React, TypeScript a Tailwind CSS.",
      "managePlayers": "Správa hráčů",
      "addPlayer": "Přidat hráče",
      "playerNamePlaceholder": "Jméno hráče...",
      "noPlayers": "Zatím zde nejsou žádní hráči.",
      "noPlayersSelected": "Pro hru nejsou vybráni žádní hráči.",
      "edit": "Upravit",
      "delete": "Smazat",
      "save": "Uložit",
      "cancel": "Zrušit",
      "confirmDelete": "Opravdu chcete smazat hráče {{name}}?",
      "common": {
        "yes": "Ano",
        "no": "Ne"
      },
      "nav": {
        "game": "Hra",
        "players": "Hráči",
        "stats": "Žebříček",
        "tournaments": "Turnaje"
      },
      "addPlayerTitle": "Přidat nového hráče",
      "editPlayer": "Upravit hráče",
      "chooseAvatar": "Vyberte si avatara",
      "uploadFile": "Nahrát",
      "takePhoto": "Vyfotit",
      "capturePhoto": "Vyfotit",
      "cameraError": "Nepodařilo se získat přístup ke kameře. Zkontrolujte prosím oprávnění.",
      "gameSetup": {
        "title": "Příprava hry",
        "selectType": "Vyberte typ hry",
        "fourBall": "4 koule",
        "threeBall": "3 koule",
        "freeGame": "Volná hra",
        "oneCushion": "Jednoband",
        "threeCushion": "Trojband",
        "startGame": "Spustit hru",
        "availablePlayers": "Hráči k dispozici",
        "playersInGame": "Hráči ve hře",
        "selectUpTo4": "Vyberte až 4 hráče",
        "gameMode": "Herní mód",
        "roundRobin": "Každý s každým",
        "teamPlay": "Týmová hra",
        "team1": "Tým 1",
        "team2": "Tým 2",
        "targetScore": "Cílové skóre",
        "endCondition": "Ukončení hry",
        "suddenDeath": "Okamžitý konec",
        "equalInnings": "Dohrávka",
        "addPlayerToTeam": "Přidat hráče",
        "allowOvershooting": "Povolit přehrání"
      },
      "noAvailablePlayers": "Žádní další hráči nejsou k dispozici.",
      "gameMode_round-robin": "{{type}} / Každý s každým",
      "gameMode_team": "{{type}} / Týmová hra",
      "scoreboard": {
        "currentTurnScore": "Aktuální náběh",
        "inning": "Náběh {{count}}",
        "average": "Průměr",
        "last6": "Posl. 6",
        "pointsToTarget": "Do cíle: {{points}}"
      },
      "scorePad": {
        "endTurn": "Ukončit náběh",
        "clean10": "Čistá 10",
        "clean20": "Čistá 20",
        "add": "Přidat"
      },
       "stats": {
        "title": "Žebříček",
        "selectGameType": "Vyberte typ hry pro zobrazení žebříčku",
        "noStatsForGame": "Pro tento typ hry zatím nejsou žádné statistiky.",
        "player": "Hráč",
        "games": "Her",
        "wins": "Výher",
        "losses": "Proher",
        "winRate": "Úspěšnost",
        "avgScore": "Průměr",
        "highestScoreInGame": "Nejlepší",
        "sortBy": "Seřadit podle:",
        "playerStatsTitle": "Statistiky Hráče",
        "zeroInnings": "Prázdné náběhy",
        "clean10s": "Čisté 10",
        "clean20s": "Čisté 20"
      },
      "playerStats": {
        "title": "Profil hráče",
        "noStats": "Tento hráč zatím neodehrál žádnou hru.",
        "summaryFor": "Souhrn pro",
        "close": "Zavřít",
        "generalAverage": "Generální průměr",
        "movingAverage": "Klouzavý průměr (10 her)",
        "allGames": "Všechny hry",
        "h2hTitle": "Vzájemné zápasy",
        "noH2hData": "Zatím nebyly odehrány žádné vzájemné zápasy.",
        "avgTrendTitle": "Vývoj průměru (posledních 20 her)"
      },
      "firstTime": {
        "title": "Vítejte!",
        "description": "Vypadá to, že jste tu poprvé. Jak si přejete začít?",
        "generate": "Vygenerovat 10 vzorových hráčů",
        "generateSubtext": "Prozkoumejte aplikaci s předvyplněnými daty.",
        "add": "Přidat prvního hráče",
        "addSubtext": "Začněte budovat vlastní soupisku.",
        "import": "Importovat hráče",
        "importSubtext": "(Již brzy)",
        "importAlert": "Funkce importu dat hráčů bude brzy k dispozici!"
      },
       "postGame": {
          "title": "Konečné výsledky",
          "winner": "Vítěz",
          "rematch": "Odveta",
          "newGame": "Nová hra",
          "average": "Průměr",
          "handicapApplied": "Handicap: +{{points}}",
          "scoreProgression": "Vývoj skóre",
          "showChart": "Zobrazit graf",
          "hideChart": "Skrýt graf"
      },
      "handicap": {
          "offerTitle": "Nabídka handicapu",
          "offerDescription": "Na základě posledních výkonů navrhujeme dát hráči <strong>{{playerName}}</strong> handicap <strong>{{points}}</strong> bodů pro vyrovnání hry.",
          "offerExplanation": "Výpočet je založen na průměrech hráčů. Chcete tento handicap použít?",
          "accept": "Přijmout handicap",
          "decline": "Odmítnout a hrát"
      },
      "tournament": {
        "title": "Turnaje",
        "create": "Vytvořit nový turnaj",
        "noTournaments": "Zatím nebyly vytvořeny žádné turnaje.",
        "ongoing": "Probíhající",
        "completed": "Dokončené",
        "select": "Vybrat turnaj",
        "setupTitle": "Nastavení nového turnaje",
        "name": "Název turnaje",
        "namePlaceholder": "např. 'Páteční liga'",
        "selectPlayers": "Vybrat hráče (3-8)",
        "notEnoughPlayers": "Pro zahájení turnaje potřebujete alespoň 3 hráče.",
        "tooManyPlayers": "Turnaj může mít maximálně 8 hráčů.",
        "backToList": "Zpět na turnaje",
        "leaderboard": "Tabulka",
        "matches": "Zápasy",
        "pos": "Poz",
        "played": "Z",
        "wins": "V",
        "draws": "R",
        "losses": "P",
        "points": "Body",
        "playMatch": "Hrát zápas",
        "matchVs": "vs",
        "winner": "Vítěz turnaje",
        "cannotDeletePlayer": "Tohoto hráče nelze smazat, protože je součástí probíhajícího turnaje."
      },
      "turnHistory": {
        "show": "Minulé náběhy",
        "title": "Historie náběhů",
        "turn": "Náběh {{count}}",
        "noHistory": "Žádná historie pro tuto hru."
      }
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