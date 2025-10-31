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
