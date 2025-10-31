import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "title": "Score Counter",
      "player1": "Player 1",
      "player2": "Player 2",
      "reset": "Reset Game",
      "footer": "Created with Vite, React, TypeScript and Tailwind CSS.",
      "managePlayers": "Manage Players",
      "backToGame": "Back to Game",
      "addPlayer": "Add",
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
      }
    }
  },
  cs: {
    translation: {
      "title": "Počítadlo bodů",
      "player1": "Hráč 1",
      "player2": "Hráč 2",
      "reset": "Resetovat hru",
      "footer": "Vytvořeno s Vite, React, TypeScript a Tailwind CSS.",
      "managePlayers": "Správa hráčů",
      "backToGame": "Zpět do hry",
      "addPlayer": "Přidat",
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
      }
    }
  }
};

i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: 'cs', // výchozí jazyk
    fallbackLng: 'en', // jazyk, který se použije, pokud překlad chybí
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    }
  });

export default i18next;
