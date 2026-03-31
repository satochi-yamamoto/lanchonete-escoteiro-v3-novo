import React, { useEffect, useRef, useState } from 'react';
import { POS } from './apps/POS';
import { Kiosk } from './apps/Kiosk';
import { KDS } from './apps/KDS';
import { TV } from './apps/TV';
import { Admin } from './apps/Admin';
import { KDSSimplified } from './apps/KDSSimplified';
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

    // Check for guest mode (for Kiosk direct access)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        const isKioskPath = window.location.pathname === '/kiosk' || window.location.pathname.endsWith('/kiosk');

        // TC029 FIX: Support both ?mode=kiosk query param AND /kiosk pathname
        if ((mode === 'kiosk' || isKioskPath) && !currentUser) {
            // Create a virtual guest user for Kiosk
            const guestUser: User = {
                id: 'guest-kiosk',
                name: 'Cliente Totem',
                pin: '',
                role: 'CASHIER', // Give basic permissions
                active: true
            };
            console.log('[Guest Mode] Activating guest mode for Kiosk:', { mode, isKioskPath, pathname: window.location.pathname });
            setCurrentUser(guestUser);
            setCurrentApp('KIOSK');
        }
    }, [currentUser]);

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
        const canAccessKitchen = role === 'ADMIN' || role === 'KITCHEN';
        const canAccessTV = true; // All profiles can access TV

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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full">
                    {canAccessPOS && (
                        <MenuButton
                            title="Terminal PDV"
                            desc="Interface do caixa para pedidos."
                            onClick={() => setCurrentApp('POS')}
                            color="bg-blue-600"
                        />
                    )}

                    {canAccessPOS && (
                        <MenuButton
                            title="Totem Autoatendimento"
                            desc="Interface touch para clientes."
                            onClick={() => setCurrentApp('KIOSK')}
                            color="bg-red-600"
                        />
                    )}

                    {canAccessKitchen && (
                        <MenuButton
                            title="KDS (Completo)"
                            desc="Display de produção (3 etapas)."
                            onClick={() => setCurrentApp('KDS')}
                            color="bg-orange-600"
                        />
                    )}

                    {canAccessKitchen && (
                        <MenuButton
                            title="KDS (Simplificado)"
                            desc="Apenas entrega rápida (1 etapa)."
                            onClick={() => setCurrentApp('KDS_SIMPLIFIED')}
                            color="bg-amber-500 text-gray-900"
                        />
                    )}

                    {canAccessTV && (
                        <MenuButton
                            title="Status TV"
                            desc="Painel público de senhas."
                            onClick={() => setCurrentApp('TV')}
                            color="bg-green-600"
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

            {currentApp === 'POS' && <POS onExit={() => setCurrentApp(null)} />}
            {currentApp === 'KIOSK' && <Kiosk />}
            {currentApp === 'KDS' && <KDS onExit={() => setCurrentApp(null)} />}
            {currentApp === 'KDS_SIMPLIFIED' && <KDSSimplified onExit={() => setCurrentApp(null)} />}
            {currentApp === 'TV' && <TV onExit={() => setCurrentApp(null)} />}
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
