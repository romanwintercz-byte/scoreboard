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
        "stats": "Statistics"
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
        "teamPlayRequirement": "Team Play requires exactly 4 players.",
        "team1": "Team 1",
        "team2": "Team 2",
        "targetScore": "Target Score",
        "endCondition": "End Condition",
        "suddenDeath": "Sudden Death",
        "equalInnings": "Equal Innings"
      },
      "noAvailablePlayers": "No other players available.",
      "gameMode_round-robin": "{{type}} / Round Robin",
      "gameMode_team": "{{type}} / Team Play",
      "scoreboard": {
        "currentTurnScore": "Current Turn"
      },
      "scorePad": {
        "endTurn": "End Turn",
        "undo": "Undo",
        "clean10": "Clean 10",
        "clean20": "Clean 20",
        "add": "Add"
      },
      "stats": {
        "title": "Player Statistics",
        "selectGameType": "Select a game type to see stats",
        "noStatsForGame": "No statistics available for this game type yet.",
        "player": "Player",
        "games": "Games",
        "wins": "Wins"
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
        "stats": "Statistiky"
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
        "teamPlayRequirement": "Týmová hra vyžaduje právě 4 hráče.",
        "team1": "Tým 1",
        "team2": "Tým 2",
        "targetScore": "Cílové skóre",
        "endCondition": "Ukončení hry",
        "suddenDeath": "Okamžitý konec",
        "equalInnings": "Dohrávka"
      },
      "noAvailablePlayers": "Žádní další hráči nejsou k dispozici.",
      "gameMode_round-robin": "{{type}} / Každý s každým",
      "gameMode_team": "{{type}} / Týmová hra",
      "scoreboard": {
        "currentTurnScore": "Aktuální náběh"
      },
      "scorePad": {
        "endTurn": "Ukončit náběh",
        "undo": "Zpět",
        "clean10": "Čistá 10",
        "clean20": "Čistá 20",
        "add": "Přidat"
      },
       "stats": {
        "title": "Statistiky Hráčů",
        "selectGameType": "Vyberte typ hry pro zobrazení statistik",
        "noStatsForGame": "Pro tento typ hry zatím nejsou žádné statistiky.",
        "player": "Hráč",
        "games": "Her",
        "wins": "Výher"
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
