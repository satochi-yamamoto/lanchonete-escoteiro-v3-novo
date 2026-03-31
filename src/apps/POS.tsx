import React, { useState } from 'react';
import { useStore } from '../store';
import { OrderType, Product, PaymentMethod, Order, ShiftTransaction } from '../types';
import { Button, formatCurrency } from '../components/ui';
import { ProductGrid, CartPanel, PaymentModal, ShiftPanel, SuccessModal, ZReportModal, CashClosingReportModal } from '../components/pos/PosComponents';
import { Settings, LogOut, User, Lock, Monitor, Power, ShoppingCart, X, BarChart2, FileText, ChevronRight } from 'lucide-react';
import { printReceipt } from '../utils';

export const POS = ({ onExit }: { onExit: () => void }) => {
    const {
        currentSession,
        products, cart, cartTotals, currentShift, orders, maxItemsPerOrder, activePaymentMethodsPOS,
        printReceiptEnabled,
        addToCart, removeFromCart, updateCartItem, clearCart, createOrder,
        openShift, closeShift, addShiftTransaction, addProduct
    } = useStore();

    const [uiState, setUiState] = useState<{
        modal: 'NONE' | 'PAYMENT' | 'SHIFT' | 'AUTH_VOID' | 'SUCCESS' | 'CLOSE_SHIFT' | 'REPORTS' | 'CASH_CLOSING_REPORT';
        pendingVoidId?: string;
    }>({ modal: 'NONE' });

    // TC019 - Shift validation error state
    const [shiftValidationError, setShiftValidationError] = useState<string | null>(null);

    // Mobile Cart State
    const [showMobileCart, setShowMobileCart] = useState(false);

    // Open Shift State
    const [shiftStartAmount, setShiftStartAmount] = useState('150.00');
    const [operatorName, setOperatorName] = useState('Caixa 01');
    const [terminalId, setTerminalId] = useState('PDV-01');

    // Order State
    const [lastOrder, setLastOrder] = useState<Order | null>(null);
    const [lastPaidAmount, setLastPaidAmount] = useState<number>(0);

    // --- Handlers ---

    const handleOpenShift = () => {
        const amount = parseFloat(shiftStartAmount);
        if (amount >= 0 && operatorName && terminalId) {
            openShift(operatorName, amount, terminalId);
        } else {
            alert("Preencha todos os campos corretamente.");
        }
    };

    const handleCloseShift = () => {
        if (!currentShift) return;
        setUiState({ modal: 'CLOSE_SHIFT' });
    };

    const handleTransaction = (type: 'DROP' | 'ADD' | 'REIMBURSEMENT', amount?: number, reason?: string, extras?: any) => {
        // Overloaded to support direct call from ShiftPanel with custom data
        if (amount !== undefined && reason !== undefined) {
            addShiftTransaction(type, amount, reason, extras);
            return;
        }

        // Default simple transaction flow
        const label = type === 'DROP' ? 'Sangria' : 'Suprimento';
        const amountStr = prompt(`Valor para ${label}:`);
        if (!amountStr) return;
        const finalAmount = parseFloat(amountStr);
        const finalReason = prompt("Motivo (opcional):") || "";

        // Auth simulation
        if (type === 'DROP') {
            const pin = prompt("SENHA DO GERENTE:");
            if (pin !== '1234') {
                alert("Senha Inválida");
                return;
            }
        }

        if (!isNaN(finalAmount) && finalAmount > 0) {
            addShiftTransaction(type, finalAmount, finalReason);
        }
    };

    const handlePaymentConfirm = (method: PaymentMethod, paidAmount: number, customId?: string) => {
        // 1. Create the order in store with optional custom ID (for TV/Pager)
        createOrder(OrderType.DINE_IN, method, "Cliente Balcão", customId);

        // 2. Retrieve the order just created (synchronously available in zustand state)
        // We assume it's the last one in the list
        const currentOrders = useStore.getState().orders;
        const newOrder = currentOrders[currentOrders.length - 1];

        // 3. Print the receipt if enabled
        if (printReceiptEnabled) {
            printReceipt(newOrder);
        }

        // 4. Set local state for success modal
        setLastOrder(newOrder);
        setLastPaidAmount(paidAmount);
        setUiState({ modal: 'SUCCESS' });
    };

    // --- Render Logic ---

    // 1. Shift Closed Screen
    if (!currentShift || currentShift.status === 'CLOSED') {
        return (
            <div className="h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full relative">
                    <button onClick={onExit} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <LogOut size={20} />
                    </button>
                    <div className="flex justify-center mb-6">
                        <div className="bg-red-100 p-4 rounded-full text-red-600"><Lock size={32} /></div>
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-2">Caixa Fechado</h1>

                    {!currentSession ? (
                        <div className="text-center">
                            <p className="text-red-600 font-bold mb-4">A LOJA ESTÁ FECHADA</p>
                            <p className="text-gray-500 mb-6">Abra o expediente da loja no painel administrativo para liberar a abertura de caixa.</p>
                            <Button variant="secondary" className="w-full" onClick={onExit}>VOLTAR AO MENU</Button>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-500 text-center mb-6">Inicie o turno para começar a vender.</p>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-bold mb-1 text-gray-600">Operador</label>
                                    <input
                                        type="text"
                                        value={operatorName}
                                        onChange={e => setOperatorName(e.target.value)}
                                        className="w-full border p-3 rounded-lg bg-gray-50 focus:bg-white transition-colors"
                                        placeholder="Nome do Operador"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1 text-gray-600">Terminal (ID)</label>
                                    <input
                                        type="text"
                                        value={terminalId}
                                        onChange={e => setTerminalId(e.target.value)}
                                        className="w-full border p-3 rounded-lg bg-gray-50 focus:bg-white transition-colors"
                                        placeholder="ex: PDV-01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1 text-gray-600">Fundo de Caixa (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={shiftStartAmount}
                                        onChange={e => setShiftStartAmount(e.target.value)}
                                        className="w-full border p-3 rounded-lg text-lg font-bold text-green-700"
                                    />
                                </div>
                            </div>
                            <Button onClick={handleOpenShift} className="w-full py-4 text-lg shadow-xl">ABRIR CAIXA</Button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // 2. Main POS Screen
    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-100 overflow-hidden font-sans relative">

            {/* --- MOBILE HEADER --- */}
            <div className="md:hidden h-14 bg-gray-900 text-white flex items-center justify-between px-4 shrink-0 z-30 shadow-md">
                <div className="font-bold text-lg tracking-tighter text-red-500">PDV</div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end opacity-70">
                        <span className="text-[10px] font-mono leading-none">{currentShift.terminal_id}</span>
                        <span className="text-[10px] leading-none">{currentShift.staff_name.split(' ')[0]}</span>
                    </div>
                    <button onClick={onExit} className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-900/50 hover:bg-blue-500 transition-colors" title="Trocar Módulo">
                        <LogOut size={18} className="rotate-180" />
                    </button>
                </div>
            </div>

            {/* --- DESKTOP SIDEBAR --- */}
            <div className="hidden md:flex w-20 bg-gray-900 text-white flex-col items-center py-4 gap-6 z-30 shadow-xl shrink-0">
                <div className="font-bold text-xl tracking-tighter text-red-500">PDV</div>

                <div className="flex flex-col gap-4 w-full px-2">
                    <button
                        className="p-3 w-full bg-gray-800 rounded-lg hover:bg-gray-700 active:bg-blue-600 transition-colors flex justify-center text-blue-400 hover:text-white"
                        onClick={() => setUiState({ modal: 'SHIFT' })}
                        title="Ajustes de Turno"
                    >
                        <Settings size={20} />
                    </button>

                    <button
                        className="p-3 w-full bg-gray-800 rounded-lg hover:bg-gray-700 active:bg-green-600 transition-colors flex justify-center text-green-400 hover:text-white"
                        onClick={() => setUiState({ modal: 'REPORTS' })}
                        title="Relatórios"
                    >
                        <BarChart2 size={20} />
                    </button>

                    <div className="h-px bg-gray-800 w-full mx-auto my-2"></div>

                    <button
                        className="p-3 w-full bg-red-900/50 border border-red-900 rounded-lg hover:bg-red-600 hover:text-white text-red-400 transition-all flex justify-center shadow-inner"
                        onClick={handleCloseShift}
                        title="Fechar Turno (Relatório Z)"
                    >
                        <Power size={20} />
                    </button>
                </div>

                <div className="flex-1"></div>

                <button
                    onClick={onExit}
                    className="p-3 w-full bg-gray-800 rounded-lg hover:bg-gray-700 text-blue-400 hover:text-white transition-colors mb-4 flex justify-center"
                    title="Trocar Módulo"
                >
                    <LogOut size={20} className="rotate-180" />
                </button>

                <div className="flex flex-col items-center gap-1 mb-4 opacity-50">
                    <Monitor size={16} />
                    <span className="text-[10px] font-mono">{currentShift.terminal_id}</span>
                </div>
            </div>

            {/* Product Catalog */}
            <div className="flex-1 p-2 md:p-4 pr-2 overflow-hidden flex flex-col pb-20 md:pb-4 relative">
                <div className="flex-1 overflow-hidden">
                    <ProductGrid
                        products={products}
                        onAdd={(p) => {
                            if (cart.length >= maxItemsPerOrder) {
                                alert(`Limite de ${maxItemsPerOrder} itens por pedido atingido.`);
                                return;
                            }
                            addToCart(p);
                        }}
                        onCreateProduct={addProduct}
                    />
                </div>
            </div>

            {/* --- MOBILE BOTTOM NAV --- */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around z-40 pb-safe">
                <button
                    onClick={() => setUiState({ modal: 'SHIFT' })}
                    className="flex flex-col items-center justify-center w-14 h-full text-gray-500 active:text-blue-600"
                >
                    <Settings size={20} />
                    <span className="text-[10px] mt-1">Ajustes</span>
                </button>

                <button
                    onClick={() => setUiState({ modal: 'REPORTS' })}
                    className="flex flex-col items-center justify-center w-14 h-full text-gray-500 active:text-green-600"
                >
                    <BarChart2 size={20} />
                    <span className="text-[10px] mt-1">Relatórios</span>
                </button>

                <button
                    onClick={() => setShowMobileCart(true)}
                    className="flex flex-col items-center justify-center -mt-6 w-14 h-14 bg-blue-600 rounded-full text-white shadow-lg shadow-blue-600/30 active:scale-95 transition-transform relative"
                >
                    <ShoppingCart size={24} />
                    {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center border-2 border-white">
                            {cart.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={handleCloseShift}
                    className="flex flex-col items-center justify-center w-14 h-full text-gray-500 active:text-red-600"
                >
                    <Power size={20} />
                    <span className="text-[10px] mt-1">Fechar</span>
                </button>
            </div>

            {/* Current Cart (Responsive) */}
            <div className={`
        fixed inset-0 z-50 bg-white transform transition-transform duration-300 md:relative md:transform-none md:inset-auto md:z-10
        ${showMobileCart ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        w-full md:w-[400px] flex flex-col shadow-2xl
      `}>
                {/* Mobile Header for Cart */}
                <div className="md:hidden flex justify-between items-center p-4 bg-gray-900 text-white">
                    <h2 className="font-bold text-lg">Carrinho ({cart.length})</h2>
                    <button onClick={() => setShowMobileCart(false)} className="p-2 bg-gray-800 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="h-14 bg-white border-b flex items-center px-4 justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                            <User size={16} />
                        </div>
                        <div>
                            <span className="font-bold text-sm text-gray-800 block leading-none">{currentShift.staff_name}</span>
                            <span className="text-[10px] text-gray-400 font-mono">ID: {currentShift.id.slice(0, 6)}</span>
                        </div>
                    </div>
                    <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Online
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <CartPanel
                        cart={cart}
                        totals={cartTotals}
                        onRemove={removeFromCart}
                        onUpdate={updateCartItem}
                    />
                </div>

                <div className="p-4 bg-white border-t shrink-0 pb-8 md:pb-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="danger" onClick={clearCart} disabled={cart.length === 0}>Cancelar</Button>
                        <Button variant="success" onClick={() => {
                            // TC019 FIX: Improved shift validation with visible error message
                            if (!currentShift || currentShift.status === 'CLOSED') {
                                console.log('[SHIFT VALIDATION] Checkout blocked - no open shift');
                                setShiftValidationError('Abra um turno de caixa antes de realizar vendas');
                                setTimeout(() => setShiftValidationError(null), 3000);
                                return;
                            }
                            console.log('[CHECKOUT] Opening payment modal');
                            setUiState({ modal: 'PAYMENT' });
                            setShowMobileCart(false);
                        }} disabled={cart.length === 0}>PAGAR</Button>
                    </div>
                </div>
            </div>

            {/* TC019 - Shift Validation Error Toast */}
            {shiftValidationError && (
                <div
                    role="alert"
                    data-testid="shift-validation-error"
                    className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl z-[9999] font-bold animate-in fade-in slide-in-from-top duration-300"
                    style={{ maxWidth: '90%', width: 'auto' }}
                >
                    <div className="flex items-center gap-3">
                        <Lock size={24} className="flex-shrink-0" />
                        <p>{shiftValidationError}</p>
                    </div>
                </div>
            )}

            {/* Modals */}
            {uiState.modal === 'PAYMENT' && (
                <PaymentModal
                    total={cartTotals.total}
                    activeMethods={activePaymentMethodsPOS}
                    onCancel={() => setUiState({ modal: 'NONE' })}
                    onConfirm={handlePaymentConfirm}
                />
            )}

            {uiState.modal === 'SUCCESS' && lastOrder && (
                <SuccessModal
                    order={lastOrder}
                    paidAmount={lastPaidAmount}
                    onClose={() => setUiState({ modal: 'NONE' })}
                />
            )}

            {uiState.modal === 'SHIFT' && (
                <ShiftPanel
                    shift={currentShift}
                    orders={orders}
                    onCloseShift={handleCloseShift}
                    onTransaction={handleTransaction}
                    onClose={() => setUiState({ modal: 'NONE' })}
                />
            )}

            {uiState.modal === 'CLOSE_SHIFT' && currentShift && (
                <ZReportModal
                    shift={currentShift}
                    orders={orders}
                    onClose={() => setUiState({ modal: 'NONE' })}
                    onConfirmClose={(payload: any) => {
                        closeShift(payload);
                        setUiState({ modal: 'NONE' });
                    }}
                />
            )}

            {uiState.modal === 'REPORTS' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="bg-gray-900 text-white p-5 flex justify-between items-center">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <BarChart2 size={20} /> Relatórios
                            </h2>
                            <button onClick={() => setUiState({ modal: 'NONE' })} className="p-1 hover:bg-white/20 rounded">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-2">
                            <button
                                onClick={() => setUiState({ modal: 'CASH_CLOSING_REPORT' })}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 border hover:border-blue-200 rounded-xl transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                        <FileText size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-gray-800 text-sm">Fechamento de Caixa</div>
                                        <div className="text-xs text-gray-500">Resumo de vendas e movimentações do turno</div>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {uiState.modal === 'CASH_CLOSING_REPORT' && currentShift && (
                <CashClosingReportModal
                    shift={currentShift}
                    orders={orders}
                    onClose={() => setUiState({ modal: 'REPORTS' })}
                />
            )}
        </div>
    );
};