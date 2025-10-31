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
      "nav": {
        "game": "Game",
        "players": "Players",
        "stats": "Leaderboard"
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
        "addPlayerToTeam": "Add Player"
      },
      "noAvailablePlayers": "No other players available.",
      "gameMode_round-robin": "{{type}} / Round Robin",
      "gameMode_team": "{{type}} / Team Play",
      "scoreboard": {
        "currentTurnScore": "Current Turn",
        "inning": "Inning {{count}}"
      },
      "scorePad": {
        "endTurn": "End Turn",
        "undo": "Undo",
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
        "playerStatsTitle": "Player Statistics"
      },
       "playerStats": {
        "title": "Player Profile",
        "noStats": "This player has not played any games yet.",
        "summaryFor": "Summary for",
        "close": "Close",
        "generalAverage": "General Average",
        "movingAverage": "Moving Average (10 Games)"
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
      "nav": {
        "game": "Hra",
        "players": "Hráči",
        "stats": "Žebříček"
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
        "fourBall": "Hra na 4 koule",
        "threeBall": "Hra na 3 koule",
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
        "addPlayerToTeam": "Přidat hráče"
      },
      "noAvailablePlayers": "Žádní další hráči nejsou k dispozici.",
      "gameMode_round-robin": "{{type}} / Každý s každým",
      "gameMode_team": "{{type}} / Týmová hra",
      "scoreboard": {
        "currentTurnScore": "Aktuální náběh",
        "inning": "Náběh {{count}}"
      },
      "scorePad": {
        "endTurn": "Ukončit náběh",
        "undo": "Zpět",
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
        "playerStatsTitle": "Statistiky Hráče"
      },
      "playerStats": {
        "title": "Profil hráče",
        "noStats": "Tento hráč zatím neodehrál žádnou hru.",
        "summaryFor": "Souhrn pro",
        "close": "Zavřít",
        "generalAverage": "Generální průměr",
        "movingAverage": "Klouzavý průměr (10 her)"
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