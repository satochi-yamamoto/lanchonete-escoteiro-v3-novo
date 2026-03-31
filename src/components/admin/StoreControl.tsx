import React, { useState } from 'react';
import { useStore } from '../../store';
import { OrderStatus } from '../../types';
import { Store, Lock, Unlock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button, Card } from '../ui';

export const StoreControl = () => {
    const { currentSession, currentShift, orders, openStore, closeStore, forceCompleteAllOrders } = useStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleForceComplete = async () => {
        if (!confirm("Isso marcará TODOS os pedidos em andamento como ENTREGUES. Deseja continuar?")) return;
        
        setLoading(true);
        try {
            await forceCompleteAllOrders();
            setError(null); // Clear error if it was about active orders
            alert("Todos os pedidos foram finalizados com sucesso.");
        } catch (e) {
            alert("Erro ao finalizar pedidos.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenStore = async () => {
        setLoading(true);
        try {
            // In a real app, we might want to get the actual logged-in user name
            openStore('Admin User');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseStore = async () => {
        setError(null);
        
        // Validation 1: Check for open shifts
        if (currentShift && currentShift.status === 'OPEN') {
            setError("Não é possível fechar a loja com caixas abertos. Feche todos os turnos de caixa primeiro.");
            return;
        }

        // Validation 2: Check for active orders
        // Active orders are those that are not DELIVERED or CANCELLED
        const activeOrders = orders.filter(o => 
            o.session_id === currentSession?.id && 
            o.status !== OrderStatus.DELIVERED && 
            o.status !== OrderStatus.CANCELLED
        );

        if (activeOrders.length > 0) {
            setError(`Existem ${activeOrders.length} pedidos em andamento. Finalize todos os pedidos antes de fechar a loja.`);
            return;
        }

        if (!confirm("Tem certeza que deseja fechar a loja? Isso encerrará o expediente atual.")) {
            return;
        }

        setLoading(true);
        try {
            closeStore('Admin User');
        } finally {
            setLoading(false);
        }
    };

    if (!currentSession) {
        return (
            <Card className="bg-gray-800 text-white border-l-4 border-l-red-500 shadow-xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-2">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/20 rounded-full text-red-400">
                            <Store size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Loja Fechada</h3>
                            <p className="text-gray-400 text-sm">Nenhum expediente ativo no momento.</p>
                        </div>
                    </div>
                    <Button 
                        onClick={handleOpenStore} 
                        disabled={loading}
                        className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-green-900/50 flex items-center justify-center gap-2"
                    >
                        {loading ? <span className="animate-spin">⌛</span> : <Unlock size={20} />}
                        ABRIR LOJA
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="bg-white border-l-4 border-l-green-500 shadow-md mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-full text-green-600">
                        <CheckCircle size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Loja Aberta</h3>
                        <p className="text-gray-500 text-sm">
                            Iniciado em {new Date(currentSession.opened_at).toLocaleString()} por {currentSession.opened_by}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                    {error && (
                        <div className="text-xs text-red-600 font-bold bg-red-50 px-3 py-2 rounded border border-red-200 flex items-center gap-2 animate-pulse">
                            <AlertTriangle size={14} /> {error}
                        </div>
                    )}
                    
                    <div className="flex gap-2">
                        <Button
                            onClick={handleForceComplete}
                            disabled={loading}
                            variant="secondary"
                            className="w-full md:w-auto bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-200 font-bold"
                        >
                            ZERAR PEDIDOS
                        </Button>

                        <Button 
                            onClick={handleCloseStore} 
                            disabled={loading}
                            className="w-full md:w-auto bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 px-6 rounded-lg border border-red-200 flex items-center justify-center gap-2 transition-colors"
                        >
                            {loading ? <span className="animate-spin">⌛</span> : <Lock size={20} />}
                            FECHAR LOJA
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};
