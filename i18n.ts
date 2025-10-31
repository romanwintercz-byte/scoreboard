import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "title": "Score Counter",
      "reset": "Reset Game",
      "footer": "Created with React, TypeScript and Tailwind CSS.",
      "managePlayers": "Manage Players",
      "addPlayer": "Add Player",
      "playerNamePlaceholder": "Player name...",
      "noPlayers": "No players have been added yet.",
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
      "cameraError": "Could not access the camera. Please check permissions."
    }
  },
  cs: {
    translation: {
      "title": "Počítadlo bodů",
      "reset": "Resetovat hru",
      "footer": "Vytvořeno s React, TypeScript a Tailwind CSS.",
      "managePlayers": "Správa hráčů",
      "addPlayer": "Přidat hráče",
      "playerNamePlaceholder": "Jméno hráče...",
      "noPlayers": "Zatím zde nejsou žádní hráči.",
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
      "cameraError": "Nepodařilo se získat přístup ke kameři. Zkontrolujte prosím oprávnění."
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