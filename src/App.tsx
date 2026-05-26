import React, { useEffect, useRef, useState } from 'react';
import { POS } from './apps/POS';
import { Admin } from './apps/Admin';
import { Button } from './components/ui';
import { useStore } from './store';
import { LoginScreen } from './components/LoginScreen';
import { User } from './types';
import { LogOut, Monitor, Settings2 } from 'lucide-react';

// Simple router to switch between apps for the demo
const App = () => {
    const [currentApp, setCurrentApp] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const initializeBackend = useStore(s => s.initializeBackend);
    const backend = useStore(s => s.backend);
    const backendStatus = useStore(s => s.backendStatus);
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
            <div className="min-h-screen flex flex-col items-center justify-center bg-cooper-canvas text-cooper-ink p-4 relative cooper-subtle-grid">
                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="absolute top-6 right-6 flex items-center gap-2 bg-cooper-surface hover:bg-cooper-panel border border-cooper-line px-4 py-2 rounded-lg transition-colors text-sm shadow-lift"
                >
                    <LogOut size={16} /> Sair ({currentUser.name})
                </button>

                <div className="mb-10 text-center max-w-2xl">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-cooper-leaf text-white shadow-lift">
                        C
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-cooper-muted mb-3">
                        Grupo Escoteiro Cooper Cotia
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center tracking-tight">
                        Lanchonete Escoteiros
                    </h1>
                    <p className="text-cooper-muted text-lg md:text-xl text-center">
                        Selecione o módulo de trabalho para iniciar a operação.
                    </p>
                </div>

                {/* Connection Status Box */}
                {backend.kind === 'supabase' && (
                    <div className="mb-8 flex flex-col items-center gap-4 w-full max-w-2xl">
                        {backendStatus.status === 'loading' && (
                            <div className="text-sm text-cooper-leaf animate-pulse">Conectando ao banco de dados...</div>
                        )}

                        {backendStatus.status === 'ready' && (
                            <div className={`text-xs px-3 py-1 rounded-full border flex items-center gap-2 ${realtimeStatus === 'SUBSCRIBED'
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-amber-50 border-amber-200 text-amber-800'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${realtimeStatus === 'SUBSCRIBED' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                                Realtime: {realtimeStatus}
                                {realtimeStatus === 'CHANNEL_ERROR' && " (Verifique se a tabela 'orders' está na publicação do Supabase)"}
                            </div>
                        )}

                        {backendStatus.status === 'error' && (
                            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-900 text-center w-full">
                                <p className="font-bold text-red-700 mb-2">Falha na conexão com o Banco de Dados</p>
                                <p className="mb-2">{backendStatus.error}</p>
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
                            icon={<Monitor size={22} />}
                        />
                    )}

                    {canAccessAdmin && (
                        <MenuButton
                            title="Admin Backoffice"
                            desc="Painel de gestão e relatórios."
                            onClick={() => setCurrentApp('ADMIN')}
                            icon={<Settings2 size={22} />}
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

const MenuButton = ({ title, desc, onClick, icon }: any) => (
    <button
        onClick={onClick}
        className="bg-cooper-surface hover:bg-cooper-panel p-7 rounded-lg text-left transition-all active:scale-[0.98] shadow-soft border border-cooper-line group"
    >
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-cooper-leaf/10 text-cooper-leaf">
            {icon}
        </div>
        <h3 className="text-2xl font-bold mb-2 group-hover:translate-x-1 transition-transform">{title}</h3>
        <p className="text-cooper-muted">{desc}</p>
    </button>
);

export default App;
