import React, { useState } from 'react';
import { POS } from './apps/POS';
import { Kiosk } from './apps/Kiosk';
import { KDS } from './apps/KDS';
import { TV } from './apps/TV';
import { Admin } from './apps/Admin';
import { Button } from './components/ui';

// Simple router to switch between apps for the demo
const App = () => {
  const [currentApp, setCurrentApp] = useState<string | null>(null);

  if (!currentApp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 text-center">
            Lanchonete Escoteiros Cooper
        </h1>
        <p className="text-gray-400 mb-12 text-xl">Selecione um módulo para iniciar</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full">
            <MenuButton 
                title="Terminal PDV" 
                desc="Interface do caixa para pedidos." 
                onClick={() => setCurrentApp('POS')} 
                color="bg-blue-600"
            />
            <MenuButton 
                title="Totem Autoatendimento" 
                desc="Interface touch para clientes." 
                onClick={() => setCurrentApp('KIOSK')} 
                color="bg-red-600"
            />
             <MenuButton 
                title="KDS (Cozinha)" 
                desc="Display de produção para cozinha." 
                onClick={() => setCurrentApp('KDS')} 
                color="bg-orange-600"
            />
             <MenuButton 
                title="Status TV" 
                desc="Painel público de senhas." 
                onClick={() => setCurrentApp('TV')} 
                color="bg-green-600"
            />
             <MenuButton 
                title="Admin Backoffice" 
                desc="Painel de gestão e relatórios." 
                onClick={() => setCurrentApp('ADMIN')} 
                color="bg-gray-700"
            />
        </div>
      </div>
    );
  }

  return (
    <div>
        {/* Floating Home Button for Demo Navigation */}
        <div className="fixed bottom-4 left-4 z-50 opacity-20 hover:opacity-100 transition-opacity">
            <Button onClick={() => setCurrentApp(null)} variant="secondary" className="shadow-2xl border-gray-400">
                Trocar Módulo
            </Button>
        </div>

        {currentApp === 'POS' && <POS onExit={() => setCurrentApp(null)} />}
        {currentApp === 'KIOSK' && <Kiosk />}
        {currentApp === 'KDS' && <KDS />}
        {currentApp === 'TV' && <TV />}
        {currentApp === 'ADMIN' && <Admin />}
    </div>
  );
};

const MenuButton = ({ title, desc, onClick, color }: any) => (
    <button 
        onClick={onClick}
        className={`${color} hover:brightness-110 p-8 rounded-2xl text-left transition-all hover:scale-105 active:scale-95 shadow-lg group`}
    >
        <h3 className="text-2xl font-bold mb-2 group-hover:translate-x-1 transition-transform">{title}</h3>
        <p className="opacity-80">{desc}</p>
    </button>
);

export default App;