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
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4 md:p-6 font-sans">
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">

                {/* Left Side: User Selection */}
                <div className="p-6 md:p-8 border-r-0 md:border-r border-b md:border-b-0 border-slate-700 flex flex-col h-[440px] md:h-auto">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <UserIcon className="text-emerald-400" />
                        Selecione o Usuário
                    </h2>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {users.length === 0 && (
                            <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-sm text-slate-300">
                                Nenhum usuário encontrado no backend. Verifique a tabela <code>users</code> no Supabase.
                            </div>
                        )}
                        {users.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => handleUserSelect(user)}
                                className={`w-full p-4 rounded-xl flex items-center justify-between transition-all duration-200 ${selectedUser?.id === user.id
                                    ? 'bg-emerald-600 text-white shadow-lg scale-[1.02]'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selectedUser?.id === user.id ? 'bg-white text-blue-600' : 'bg-gray-600 text-gray-400'
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
                <div className="p-6 md:p-8 flex flex-col items-center justify-center bg-slate-900/50 relative h-[440px] md:h-auto">
                    {!selectedUser ? (
                        <div className="text-center opacity-30">
                            <Lock size={64} className="mx-auto mb-4" />
                            <p>Selecione um usuário para continuar</p>
                        </div>
                    ) : (
                        <div className="w-full max-w-[280px] animate-in fade-in slide-in-from-right duration-300">
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-medium mb-2">Olá, <span className="font-bold text-emerald-400">{selectedUser.name}</span></h3>
                                <p className="text-sm text-gray-400">Digite seu PIN de acesso</p>
                            </div>

                            {/* PIN Display */}
                            <div className="flex justify-center gap-4 mb-8" key={selectedUser.id}>
                                {[0, 1, 2, 3].map(i => (
                                    <div
                                        key={i}
                                        className={`w-4 h-4 rounded-full transition-all duration-200 ${pin.length > i
                                            ? errorMessage ? 'bg-red-500 scale-110' : 'bg-emerald-500 scale-110'
                                            : 'bg-slate-600'
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
                                        className="h-16 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 active:bg-slate-500 text-2xl font-bold transition-all shadow-md active:scale-95"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <div className="col-start-2">
                                    <button
                                        onClick={() => handlePinInput('0')}
                                        disabled={isAuthenticating}
                                        className="w-full h-16 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 active:bg-slate-500 text-2xl font-bold transition-all shadow-md active:scale-95"
                                    >
                                        0
                                    </button>
                                </div>
                                <button
                                    onClick={handleBackspace}
                                    disabled={isAuthenticating}
                                    className="h-16 rounded-xl bg-slate-700/50 hover:bg-red-900/30 disabled:opacity-50 text-red-400 flex items-center justify-center transition-all active:scale-95"
                                >
                                    <Delete size={24} />
                                </button>
                            </div>

                            <button
                                disabled={pin.length !== 4 || isAuthenticating}
                                onClick={() => void authenticate(pin)}
                                className="mt-4 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 py-3 font-semibold transition-colors"
                            >
                                Entrar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="fixed bottom-4 text-xs text-gray-600">
                Lanchonete Escoteiros POS Suite v2.0
            </div>
        </div>
    );
};
