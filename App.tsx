
import React, { useState } from 'react';

const App: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-4 font-sans antialiased">
      <main className="bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 max-w-2xl w-full text-center transform hover:scale-[1.02] transition-transform duration-500 ease-in-out">
        <div className="mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Vite + React + Vercel
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          Tento projekt je jednoduchý základ pro vaši React aplikaci. Je připraven k nasazení na Vercel přes GitHub.
        </p>
        <div className="bg-gray-700/50 p-6 rounded-lg ring-1 ring-white/10">
          <p className="text-md text-gray-400 mb-4">
            Jednoduchý interaktivní prvek pro testování:
          </p>
          <button
            onClick={() => setCount((count) => count + 1)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-cyan-300"
          >
            Počet kliknutí: {count}
          </button>
        </div>
      </main>
      <footer className="mt-8 text-gray-500 text-sm">
        <p>Vytvořeno s Vite, React, TypeScript a Tailwind CSS.</p>
      </footer>
    </div>
  );
};

export default App;

