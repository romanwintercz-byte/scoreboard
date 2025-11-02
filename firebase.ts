import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// =================================================================
// DŮLEŽITÉ: VLOŽTE VLASTNÍ KONFIGURACI FIREBASE
// =================================================================
// 1. Jděte na https://console.firebase.google.com/
// 2. Vytvořte nový projekt.
// 3. V nastavení projektu (Project Settings) přidejte novou "Web app".
// 4. Zkopírujte sem objekt `firebaseConfig`.
// 5. V sekci "Authentication" povolte metodu přihlášení "Google".
// 6. V sekci "Firestore Database" vytvořte databázi (doporučujeme začít v testovacím módu).
// =================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Inicializace Firebase
const app = initializeApp(firebaseConfig);

// Služby Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);

// Poskytovatel přihlášení
export const googleProvider = new GoogleAuthProvider();