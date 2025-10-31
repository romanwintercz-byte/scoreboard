import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "title": "Score Counter",
      "resetScores": "Reset Scores",
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
      "selectPlayerTitle": "Select a Player",
      "selectPlayer1": "Select Player 1",
      "selectPlayer2": "Select Player 2",
      "noAvailablePlayers": "No other players available.",
      "confirmDelete": "Are you sure you want to delete {{name}}?",
      "aria": {
        "increment": "Add point to {{player}}",
        "decrement": "Remove point from {{player}}"
      },
      "nav": {
        "game": "Game",
        "players": "Players"
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
        "teamPlayRequirement": "Select 4 players for Team Play",
        "team1": "Team 1",
        "team2": "Team 2"
      },
      "gameMode": "{{type}}",
      "gameMode_team": "{{type}} (Team Play)",
      "gameMode_round-robin": "{{type}} (Round Robin)"
    }
  },
  cs: {
    translation: {
      "title": "Počítadlo bodů",
      "resetScores": "Resetovat skóre",
      "changeGame": "Změnit hru",
      "footer": "Vytvořeno s React, TypeScript a Tailwind CSS.",
      "managePlayers": "Správa hráčů",
      "addPlayer": "Přidat hráče",
      "playerNamePlaceholder": "Jméno hráče...",
      "noPlayers": "Zatím zde nejsou žádní hráči.",
      "noPlayersSelected": "Do hry nejsou vybráni žádní hráči.",
      "edit": "Upravit",
      "delete": "Smazat",
      "save": "Uložit",
      "cancel": "Zrušit",
      "selectPlayerTitle": "Vyberte hráče",
      "selectPlayer1": "Vybrat hráče 1",
      "selectPlayer2": "Vybrat hráče 2",
      "noAvailablePlayers": "Žádní další hráči nejsou k dispozici.",
      "confirmDelete": "Opravdu chcete smazat hráče {{name}}?",
      "aria": {
        "increment": "Přidat bod hráči {{player}}",
        "decrement": "Odebrat bod hráči {{player}}"
      },
      "nav": {
        "game": "Hra",
        "players": "Hráči"
      },
      "addPlayerTitle": "Přidat nového hráče",
      "editPlayer": "Upravit hráče",
      "chooseAvatar": "Vyberte si avatara",
      "uploadFile": "Nahrát",
      "takePhoto": "Vyfotit",
      "capturePhoto": "Vyfotit",
      "cameraError": "Nepodařilo se získat přístup ke kameři. Zkontrolujte prosím oprávnění.",
      "gameSetup": {
        "title": "Příprava hry",
        "selectType": "Vyberte typ hry",
        "fourBall": "Hra na 4 koule",
        "threeBall": "Hra na 3 koule",
        "freeGame": "Volná hra",
        "oneCushion": "Jednoband",
        "threeCushion": "Trojband",
        "startGame": "Zahájit hru",
        "availablePlayers": "Dostupní hráči",
        "playersInGame": "Hráči ve hře",
        "selectUpTo4": "Vyberte až 4 hráče",
        "gameMode": "Herní mód",
        "roundRobin": "Každý s každým",
        "teamPlay": "Týmová hra",
        "teamPlayRequirement": "Pro týmovou hru vyberte 4 hráče",
        "team1": "Tým 1",
        "team2": "Tým 2"
      },
      "gameMode": "{{type}}",
      "gameMode_team": "{{type}} (Týmová hra)",
      "gameMode_round-robin": "{{type}} (Každý s každým)"
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