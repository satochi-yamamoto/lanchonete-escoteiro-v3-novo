import React, { useState } from 'react';
import { User } from '../types';
import { useStore } from '../store';
import { User as UserIcon, Lock, ChevronRight, Delete } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const { users } = useStore();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        setPin('');
        setError(false);
    };

    const handlePinInput = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            setError(false);

            // TC001 FIX: Debug logging for PIN validation
            console.log('[PIN Input]', { digit: num, newPin, pinLength: newPin.length, selectedUser: selectedUser?.name });

            // Auto submit if 4 digits
            if (newPin.length === 4) {
                console.log('[PIN Validation]', { enteredPin: newPin, expectedPin: selectedUser?.pin, match: newPin === selectedUser?.pin });
                if (selectedUser && newPin === selectedUser.pin) {
                    console.log('[LOGIN SUCCESS]', selectedUser.name);
                    onLogin(selectedUser);
                } else {
                    console.log('[LOGIN FAILED] PIN mismatch');
                    setError(true);
                    setTimeout(() => setPin(''), 500);
                }
            }
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4 md:p-6 font-sans">
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700">

                {/* Left Side: User Selection */}
                <div className="p-6 md:p-8 border-r-0 md:border-r border-b md:border-b-0 border-gray-700 flex flex-col h-[400px] md:h-auto">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <UserIcon className="text-blue-500" />
                        Selecione o Usuário
                    </h2>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {users.map(user => (
                            <button
                                key={user.id}
                                onClick={() => handleUserSelect(user)}
                                className={`w-full p-4 rounded-xl flex items-center justify-between transition-all duration-200 ${selectedUser?.id === user.id
                                    ? 'bg-blue-600 text-white shadow-lg scale-[1.02]'
                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
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
                <div className="p-6 md:p-8 flex flex-col items-center justify-center bg-gray-800/50 relative h-[400px] md:h-auto">
                    {!selectedUser ? (
                        <div className="text-center opacity-30">
                            <Lock size={64} className="mx-auto mb-4" />
                            <p>Selecione um usuário para continuar</p>
                        </div>
                    ) : (
                        <div className="w-full max-w-[280px] animate-in fade-in slide-in-from-right duration-300">
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-medium mb-2">Olá, <span className="font-bold text-blue-400">{selectedUser.name}</span></h3>
                                <p className="text-sm text-gray-400">Digite seu PIN de acesso</p>
                            </div>

                            {/* PIN Display */}
                            <div className="flex justify-center gap-4 mb-8" key={selectedUser.id}>
                                {[0, 1, 2, 3].map(i => (
                                    <div
                                        key={i}
                                        className={`w-4 h-4 rounded-full transition-all duration-200 ${pin.length > i
                                            ? error ? 'bg-red-500 scale-110' : 'bg-blue-500 scale-110'
                                            : 'bg-gray-600'
                                            }`}
                                    />
                                ))}
                            </div>

                            {error && (
                                <div className="absolute top-4 right-0 left-0 text-center text-red-500 text-sm font-bold animate-pulse">
                                    PIN Incorreto
                                </div>
                            )}

                            {/* Numpad */}
                            <div className="grid grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => handlePinInput(num.toString())}
                                        className="h-16 rounded-xl bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-2xl font-bold transition-all shadow-md active:scale-95"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <div className="col-start-2">
                                    <button
                                        onClick={() => handlePinInput('0')}
                                        className="w-full h-16 rounded-xl bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-2xl font-bold transition-all shadow-md active:scale-95"
                                    >
                                        0
                                    </button>
                                </div>
                                <button
                                    onClick={handleBackspace}
                                    className="h-16 rounded-xl bg-gray-700/50 hover:bg-red-900/30 text-red-400 flex items-center justify-center transition-all active:scale-95"
                                >
                                    <Delete size={24} />
                                </button>
                            </div>
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
