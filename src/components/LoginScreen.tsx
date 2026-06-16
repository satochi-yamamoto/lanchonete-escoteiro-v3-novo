import React, { useCallback, useEffect, useState } from 'react';
import { User } from '../types';
import { useStore } from '../store';
import { User as UserIcon, Lock, ChevronRight, Delete, Loader2 } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const { users, authenticateUserByPin } = useStore();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [pin, setPin] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        setPin('');
        setErrorMessage('');
    };

    const authenticate = useCallback(async (pinToValidate: string) => {
        if (!selectedUser || pinToValidate.length !== 4 || isAuthenticating) return;
        setIsAuthenticating(true);
        setErrorMessage('');
        const authenticatedUser = await authenticateUserByPin(selectedUser.id, pinToValidate);
        if (authenticatedUser) {
            onLogin(authenticatedUser);
            return;
        }
        setErrorMessage('PIN inválido');
        setPin('');
        setIsAuthenticating(false);
    }, [authenticateUserByPin, isAuthenticating, onLogin, selectedUser]);

    const handlePinInput = (num: string) => {
        if (isAuthenticating || !selectedUser) return;
        if (pin.length >= 4) return;
        const newPin = `${pin}${num}`;
        setPin(newPin);
        setErrorMessage('');
        if (newPin.length === 4) {
            void authenticate(newPin);
        }
    };

    const handleBackspace = () => {
        if (isAuthenticating) return;
        setPin(prev => prev.slice(0, -1));
        setErrorMessage('');
    };

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (!selectedUser) return;
            if (event.key >= '0' && event.key <= '9') {
                handlePinInput(event.key);
            }
            if (event.key === 'Backspace') {
                handleBackspace();
            }
            if (event.key === 'Enter' && pin.length === 4) {
                void authenticate(pin);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [authenticate, pin, selectedUser]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-cooper-canvas text-cooper-ink p-4 md:p-6 font-sans cooper-subtle-grid">
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-cooper-surface rounded-lg overflow-hidden shadow-soft border border-cooper-line">

                {/* Left Side: User Selection */}
                <div className="p-6 md:p-8 border-r-0 md:border-r border-b md:border-b-0 border-cooper-line flex flex-col h-[440px] md:h-auto">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-cooper-muted mb-3">
                        Grupo Escoteiro Cooper Cotia
                    </p>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <UserIcon className="text-cooper-leaf" />
                        Selecione o Usuário
                    </h2>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {users.length === 0 && (
                            <div className="rounded-lg border border-cooper-line bg-cooper-panel p-4 text-sm text-cooper-muted">
                                Nenhum usuário encontrado no backend. Verifique a tabela <code>users</code> no Supabase.
                            </div>
                        )}
                        {users.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => handleUserSelect(user)}
                                className={`w-full p-4 rounded-lg flex items-center justify-between transition-all duration-200 border ${selectedUser?.id === user.id
                                    ? 'bg-cooper-leaf text-white shadow-lift border-cooper-leaf'
                                    : 'bg-cooper-panel hover:bg-cooper-surface text-cooper-ink border-cooper-line'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selectedUser?.id === user.id ? 'bg-white text-cooper-leaf' : 'bg-cooper-surface text-cooper-muted border border-cooper-line'
                                        }`}>
                                        {user.name.charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold">{user.name}</div>
                                        <div className="text-xs opacity-70 uppercase tracking-wider">{user.role}</div>
                                    </div>
                                </div>
                                {selectedUser?.id === user.id && <ChevronRight size={20} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Side: PIN Pad */}
                <div className="p-6 md:p-8 flex flex-col items-center justify-center bg-cooper-panel/70 relative h-[440px] md:h-auto">
                    {!selectedUser ? (
                        <div className="text-center text-cooper-muted">
                            <Lock size={64} className="mx-auto mb-4" />
                            <p>Selecione um usuário para continuar</p>
                        </div>
                    ) : (
                        <div className="w-full max-w-[280px] animate-in fade-in slide-in-from-right duration-300">
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-medium mb-2">Olá, <span className="font-bold text-cooper-leaf">{selectedUser.name}</span></h3>
                                <p className="text-sm text-cooper-muted">Digite seu PIN de acesso</p>
                            </div>

                            {/* PIN Display */}
                            <div className="flex justify-center gap-4 mb-8" key={selectedUser.id}>
                                {[0, 1, 2, 3].map(i => (
                                    <div
                                        key={i}
                                        className={`w-4 h-4 rounded-full transition-all duration-200 ${pin.length > i
                                            ? errorMessage ? 'bg-red-500 scale-110' : 'bg-cooper-leaf scale-110'
                                            : 'bg-cooper-line'
                                            }`}
                                    />
                                ))}
                            </div>

                            {errorMessage && (
                                <div className="absolute top-4 right-0 left-0 text-center text-red-400 text-sm font-bold animate-pulse">
                                    {errorMessage}
                                </div>
                            )}

                            {isAuthenticating && (
                                <div className="mb-3 text-center text-xs text-slate-300 flex items-center justify-center gap-2">
                                    <Loader2 size={14} className="animate-spin" />
                                    Validando credenciais...
                                </div>
                            )}

                            {/* Numpad */}
                            <div className="grid grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => handlePinInput(num.toString())}
                                        disabled={isAuthenticating}
                                        className="h-16 rounded-lg bg-cooper-surface hover:bg-white disabled:opacity-50 active:bg-cooper-panel text-2xl font-bold transition-all shadow-lift border border-cooper-line active:scale-[0.98]"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <div className="col-start-2">
                                    <button
                                        onClick={() => handlePinInput('0')}
                                        disabled={isAuthenticating}
                                        className="w-full h-16 rounded-lg bg-cooper-surface hover:bg-white disabled:opacity-50 active:bg-cooper-panel text-2xl font-bold transition-all shadow-lift border border-cooper-line active:scale-[0.98]"
                                    >
                                        0
                                    </button>
                                </div>
                                <button
                                    onClick={handleBackspace}
                                    disabled={isAuthenticating}
                                    className="h-16 rounded-lg bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-700 flex items-center justify-center transition-all border border-red-100 active:scale-[0.98]"
                                >
                                    <Delete size={24} />
                                </button>
                            </div>

                            <button
                                disabled={pin.length !== 4 || isAuthenticating}
                                onClick={() => void authenticate(pin)}
                                className="mt-4 w-full rounded-lg bg-cooper-leaf hover:bg-cooper-leafDark disabled:bg-cooper-line disabled:text-cooper-muted text-white py-3 font-semibold transition-colors shadow-lift"
                            >
                                Entrar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="fixed bottom-4 text-xs text-cooper-muted text-center">
                <div>Lanchonete Escoteiros POS Suite v2.0</div>
                <div>Desenvolvido por SATOCHI YAMAMOTO TECNOLOGIA DA INFORMACAO LTDA</div>
            </div>
        </div>
    );
};
