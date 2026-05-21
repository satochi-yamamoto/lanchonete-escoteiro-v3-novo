import React, { useEffect, useRef, useState } from 'react';
import { POS } from './apps/POS';
import { Admin } from './apps/Admin';
import { Button } from './components/ui';
import { useStore } from './store';
import { LoginScreen } from './components/LoginScreen';
import { User } from './types';
import { LogOut } from 'lucide-react';

// Simple router to switch between apps for the demo
const App = () => {
    const [currentApp, setCurrentApp] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const initializeBackend = useStore(s => s.initializeBackend);
    const backend = useStore(s => s.backend);
    const realtimeStatus = useStore(s => s.realtimeStatus);
    const didInit = useRef(false);

    useEffect(() => {
        if (didInit.current) return;
        didInit.current = true;
        void initializeBackend();
    }, [initializeBackend]);

    if (!currentUser) {
        return <LoginScreen onLogin={setCurrentUser} />;
    }

    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentApp(null);
    };

    if (!currentApp) {
        // Role-based Access Control
        const role = currentUser.role;
        const canAccessAdmin = role === 'ADMIN';
        const canAccessPOS = role === 'ADMIN' || role === 'MANAGER' || role === 'CASHIER';

        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4 relative">
                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="absolute top-6 right-6 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors text-sm"
                >
                    <LogOut size={16} /> Sair ({currentUser.name})
                </button>

                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                    Lanchonete Escoteiros Cooper
                </h1>
                <p className="text-gray-400 mb-12 text-lg md:text-xl text-center">Selecione um módulo para iniciar</p>

                {/* Connection Status Box */}
                {backend.kind === 'supabase' && (
                    <div className="mb-8 flex flex-col items-center gap-4 w-full max-w-2xl">
                        {backend.status === 'loading' && (
                            <div className="text-sm text-blue-300 animate-pulse">Conectando ao banco de dados...</div>
                        )}

                        {backend.status === 'ready' && (
                            <div className={`text-xs px-3 py-1 rounded-full border flex items-center gap-2 ${realtimeStatus === 'SUBSCRIBED'
                                ? 'bg-green-900/30 border-green-500/50 text-green-400'
                                : 'bg-yellow-900/30 border-yellow-500/50 text-yellow-400'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${realtimeStatus === 'SUBSCRIBED' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                                Realtime: {realtimeStatus}
                                {realtimeStatus === 'CHANNEL_ERROR' && " (Verifique se a tabela 'orders' está na publicação do Supabase)"}
                            </div>
                        )}

                        {backend.status === 'error' && (
                            <div className="p-4 rounded bg-red-900/50 border border-red-500/50 text-sm text-gray-200 text-center w-full">
                                <p className="font-bold text-red-300 mb-2">Falha na conexão com o Banco de Dados</p>
                                <p className="mb-2">{backend.error}</p>
                                <p className="text-xs opacity-75">
                                    Dica: Se este é o primeiro acesso, certifique-se de ter rodado os scripts
                                    <code>schema.clean.sql</code> e <code>schema.rls.sql</code> no painel do Supabase.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
                    {canAccessPOS && (
                        <MenuButton
                            title="Terminal PDV"
                            desc="Interface do caixa para pedidos."
                            onClick={() => setCurrentApp('POS')}
                            color="bg-blue-600"
                        />
                    )}

                    {canAccessAdmin && (
                        <MenuButton
                            title="Admin Backoffice"
                            desc="Painel de gestão e relatórios."
                            onClick={() => setCurrentApp('ADMIN')}
                            color="bg-gray-700"
                        />
                    )}
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

            {currentApp === 'POS' && <POS onExit={() => setCurrentApp(null)} currentUserRole={currentUser.role} />}
            {currentApp === 'ADMIN' && <Admin onExit={() => setCurrentApp(null)} onLogout={handleLogout} />}
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
