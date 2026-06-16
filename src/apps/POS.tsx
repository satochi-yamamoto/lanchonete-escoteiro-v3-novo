import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import { OrderType, Product, PaymentMethod, Order, ShiftTransaction, OrderStatus, Shift, TerminalConfig, Promotion, PromotionType } from '../types';
import { Button, formatCurrency } from '../components/ui';
import { ProductGrid, CartPanel, CashPaymentModal, ShiftPanel, SuccessModal, ZReportModal, CashClosingReportModal } from '../components/pos/PosComponents';
import { Settings, LogOut, User, Lock, Monitor, Power, ShoppingCart, X, BarChart2, FileText, ChevronRight, Banknote, QrCode, Hash, Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { printReceipt } from '../utils';
import { buildShiftFixedProducts, computeBurgerPlan, FIXED_BURGER_CATEGORY, FIXED_PRODUCT_IDS } from '../constants/fixedProducts';

export const OPENING_PROMOTION_ID = 'shift-opening-burger-bundle-promotion';

export const buildOpeningPromotion = ({
    quantity,
    value,
    dailyMenuName
}: {
    quantity: number;
    value: number;
    dailyMenuName: string;
}): Promotion => ({
    id: OPENING_PROMOTION_ID,
    name: dailyMenuName.trim() ? `Promoção - ${dailyMenuName.trim()}` : 'Promoção dos Lanches do Dia',
    type: PromotionType.FIXED_PRICE_BUNDLE,
    rules: {
        category_id: FIXED_BURGER_CATEGORY,
        min_quantity: quantity,
        active: true
    },
    value,
    priority: 100,
    valid_days: [0, 1, 2, 3, 4, 5, 6],
    valid_hours_start: '00:00',
    valid_hours_end: '23:59',
    channels: ['POS', 'KIOSK', 'DELIVERY']
});

// O valor unitário sugerido rateia o custo apenas entre os lanches pagantes
// (Escoteiros/Extra), já que os lanches de Chefes têm preço R$ 0,00.
export const calculateOpeningUnitCost = (totalCost: number, payableBurgers: number) => {
    if (!Number.isFinite(payableBurgers) || payableBurgers <= 0) return 0;
    return totalCost / payableBurgers;
};

export const isOpeningShiftInputValid = ({
    startCash,
    operatorName,
    terminalId,
    dailyMenuName,
    totalCost,
    drinksLiters,
    promotionQuantity,
    promotionValue,
    normalQty,
    veganQty,
    finalUnitCost,
    chefeQty = 0
}: {
    startCash: number;
    operatorName: string;
    terminalId: string;
    dailyMenuName: string;
    totalCost: number;
    drinksLiters: number;
    promotionQuantity: number;
    promotionValue: number;
    normalQty: number;
    veganQty: number;
    finalUnitCost: number;
    chefeQty?: number;
}) => {
    const plan = computeBurgerPlan({ normal: normalQty, vegan: veganQty, chefe: chefeQty });
    return (
        startCash >= 0 &&
        Boolean(operatorName.trim()) &&
        Boolean(terminalId) &&
        Boolean(dailyMenuName.trim()) &&
        Number.isFinite(totalCost) &&
        totalCost >= 0 &&
        Number.isFinite(drinksLiters) &&
        drinksLiters >= 0 &&
        Number.isInteger(promotionQuantity) &&
        promotionQuantity > 0 &&
        Number.isFinite(promotionValue) &&
        promotionValue > 0 &&
        Number.isFinite(normalQty) &&
        normalQty >= 0 &&
        Number.isFinite(veganQty) &&
        veganQty >= 0 &&
        plan.total > 0 &&
        Number.isFinite(finalUnitCost) &&
        finalUnitCost >= 0 &&
        Number.isFinite(chefeQty) &&
        chefeQty >= 0 &&
        !plan.chefeExceedsTotal
    );
};

type OpeningCostDetail = {
    id: string;
    reimbursedName: string;
    amount: string;
};

const createOpeningCostDetail = (): OpeningCostDetail => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    reimbursedName: '',
    amount: ''
});

const getOpeningCostDetailsTotal = (details: OpeningCostDetail[]) => (
    details.reduce((total, detail) => {
        const amount = parseFloat(detail.amount || '0');
        return total + (Number.isFinite(amount) ? amount : 0);
    }, 0)
);

export const getOpeningCostReimbursements = (details: OpeningCostDetail[]) => (
    details
        .map((detail) => ({
            payee: detail.reimbursedName.trim(),
            amount: parseFloat(detail.amount || '0')
        }))
        .filter((detail) => Number.isFinite(detail.amount) && detail.amount > 0)
);

const OpeningCostDetailsModal = ({
    details,
    onChange,
    onClose,
    onApply
}: {
    details: OpeningCostDetail[];
    onChange: (details: OpeningCostDetail[]) => void;
    onClose: () => void;
    onApply: () => void;
}) => {
    const total = getOpeningCostDetailsTotal(details);

    const updateDetail = (id: string, field: keyof Omit<OpeningCostDetail, 'id'>, value: string) => {
        onChange(details.map((detail) => (
            detail.id === id ? { ...detail, [field]: value } : detail
        )));
    };

    const addDetail = () => {
        onChange([...details, createOpeningCostDetail()]);
    };

    const removeDetail = (id: string) => {
        const nextDetails = details.filter((detail) => detail.id !== id);
        onChange(nextDetails.length > 0 ? nextDetails : [createOpeningCostDetail()]);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-cooper-surface rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-cooper-line">
                <div className="p-5 border-b flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-cooper-ink">Detalhar Reembolsos</h2>
                        <p className="text-sm text-gray-500">Informe o nome do reembolsado e o valor de cada item.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
                        <X size={22} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-3">
                    <div className="hidden sm:grid sm:grid-cols-[1fr_150px_44px] gap-3 text-xs font-bold uppercase text-gray-500 px-1">
                        <span>Nome do reembolsado</span>
                        <span>Valor</span>
                        <span className="sr-only">Remover</span>
                    </div>
                    {details.map((detail) => (
                        <div key={detail.id} className="grid grid-cols-[1fr_44px] sm:grid-cols-[1fr_150px_44px] gap-3 items-center">
                            <input
                                type="text"
                                value={detail.reimbursedName}
                                onChange={e => updateDetail(detail.id, 'reimbursedName', e.target.value)}
                                className="col-span-2 sm:col-span-1 w-full border p-3 rounded-lg bg-gray-50 focus:bg-white transition-colors"
                                placeholder="Ex: Maria Silva"
                            />
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={detail.amount}
                                onChange={e => updateDetail(detail.id, 'amount', e.target.value)}
                                className="w-full border p-3 rounded-lg text-right font-bold"
                                placeholder="0.00"
                            />
                            <button
                                type="button"
                                onClick={() => removeDetail(detail.id)}
                                className="h-11 w-11 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center"
                                title="Remover linha"
                                aria-label="Remover linha"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    <Button variant="secondary" onClick={addDetail} className="w-full">
                        <Plus size={16} /> Inserir novo
                    </Button>
                </div>

                <div className="p-5 border-t bg-cooper-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase text-gray-500">Total calculado</p>
                        <p className="text-2xl font-black text-cooper-leaf">{formatCurrency(total)}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button onClick={onApply}>Aplicar total</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const OpeningAdjustmentsScreen = ({
    shift,
    activeTerminals,
    onBack,
    onSave
}: {
    shift: Shift;
    activeTerminals: TerminalConfig[];
    onBack: () => void;
    onSave: (updates: Partial<Pick<Shift, 'staff_name' | 'terminal_id' | 'start_cash' | 'opening_product_cost_total' | 'opening_drinks_liters' | 'planned_normal_burgers' | 'planned_vegan_burgers' | 'planned_chefe_burgers' | 'planned_escoteiro_extra_burgers' | 'opening_unit_cost_suggested' | 'opening_unit_cost' | 'opening_promotion_quantity' | 'opening_promotion_value' | 'daily_menu_name'>>) => Promise<void>;
}) => {
    const [operatorName, setOperatorName] = useState(shift.staff_name);
    const [terminalId, setTerminalId] = useState(shift.terminal_id);
    const [startCash, setStartCash] = useState(shift.start_cash.toFixed(2));
    const [dailyMenuName, setDailyMenuName] = useState(shift.daily_menu_name ?? '');
    const [openingProductCostTotal, setOpeningProductCostTotal] = useState((shift.opening_product_cost_total ?? 0).toString());
    const [openingDrinksLiters, setOpeningDrinksLiters] = useState((shift.opening_drinks_liters ?? 0).toString());
    const [openingPromotionQuantity, setOpeningPromotionQuantity] = useState((shift.opening_promotion_quantity ?? 2).toString());
    const [openingPromotionValue, setOpeningPromotionValue] = useState((shift.opening_promotion_value ?? 10).toString());
    const [plannedNormalBurgers, setPlannedNormalBurgers] = useState((shift.planned_normal_burgers ?? 0).toString());
    const [plannedVeganBurgers, setPlannedVeganBurgers] = useState((shift.planned_vegan_burgers ?? 0).toString());
    const [plannedChefeBurgers, setPlannedChefeBurgers] = useState((shift.planned_chefe_burgers ?? 0).toString());
    const [openingUnitCost, setOpeningUnitCost] = useState((shift.opening_unit_cost ?? 0).toString());
    const [openingUnitCostEdited, setOpeningUnitCostEdited] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setOperatorName(shift.staff_name);
        setTerminalId(shift.terminal_id);
        setStartCash(shift.start_cash.toFixed(2));
        setDailyMenuName(shift.daily_menu_name ?? '');
        setOpeningProductCostTotal((shift.opening_product_cost_total ?? 0).toString());
        setOpeningDrinksLiters((shift.opening_drinks_liters ?? 0).toString());
        setOpeningPromotionQuantity((shift.opening_promotion_quantity ?? 2).toString());
        setOpeningPromotionValue((shift.opening_promotion_value ?? 10).toString());
        setPlannedNormalBurgers((shift.planned_normal_burgers ?? 0).toString());
        setPlannedVeganBurgers((shift.planned_vegan_burgers ?? 0).toString());
        setPlannedChefeBurgers((shift.planned_chefe_burgers ?? 0).toString());
        setOpeningUnitCost((shift.opening_unit_cost ?? 0).toString());
        setOpeningUnitCostEdited(false);
    }, [shift.id]);

    const parsedStartCash = parseFloat(startCash || '0');
    const parsedOpeningCost = parseFloat(openingProductCostTotal || '0');
    const parsedOpeningDrinksLiters = parseFloat(openingDrinksLiters || '0');
    const parsedOpeningPromotionQuantity = parseInt(openingPromotionQuantity || '0', 10);
    const parsedOpeningPromotionValue = parseFloat(openingPromotionValue || '0');
    const parsedNormalBurgers = parseInt(plannedNormalBurgers || '0', 10);
    const parsedVeganBurgers = parseInt(plannedVeganBurgers || '0', 10);
    const parsedChefeBurgers = parseInt(plannedChefeBurgers || '0', 10);
    const parsedUnitCost = parseFloat(openingUnitCost || '0');
    const burgerPlan = computeBurgerPlan({
        normal: parsedNormalBurgers,
        vegan: parsedVeganBurgers,
        chefe: parsedChefeBurgers
    });
    const openingUnitCostSuggested = calculateOpeningUnitCost(
        Number.isFinite(parsedOpeningCost) ? parsedOpeningCost : 0,
        burgerPlan.escoteiroExtra
    );
    const isValid = isOpeningShiftInputValid({
        startCash: parsedStartCash,
        operatorName,
        terminalId,
        dailyMenuName,
        totalCost: parsedOpeningCost,
        drinksLiters: parsedOpeningDrinksLiters,
        promotionQuantity: parsedOpeningPromotionQuantity,
        promotionValue: parsedOpeningPromotionValue,
        normalQty: parsedNormalBurgers,
        veganQty: parsedVeganBurgers,
        finalUnitCost: parsedUnitCost,
        chefeQty: parsedChefeBurgers
    });

    useEffect(() => {
        if (!openingUnitCostEdited) {
            setOpeningUnitCost(openingUnitCostSuggested > 0 ? openingUnitCostSuggested.toFixed(2) : '0');
        }
    }, [openingUnitCostEdited, openingUnitCostSuggested]);

    const handleSave = async () => {
        if (!isValid || isSaving) {
            alert('Preencha todos os campos corretamente.');
            return;
        }

        try {
            setIsSaving(true);
            await onSave({
                staff_name: operatorName.trim(),
                terminal_id: terminalId,
                start_cash: parsedStartCash,
                opening_product_cost_total: parsedOpeningCost,
                opening_drinks_liters: parsedOpeningDrinksLiters,
                opening_promotion_quantity: parsedOpeningPromotionQuantity,
                opening_promotion_value: parsedOpeningPromotionValue,
                planned_normal_burgers: parsedNormalBurgers,
                planned_vegan_burgers: parsedVeganBurgers,
                planned_chefe_burgers: parsedChefeBurgers,
                planned_escoteiro_extra_burgers: burgerPlan.escoteiroExtra,
                opening_unit_cost_suggested: openingUnitCostSuggested,
                opening_unit_cost: parsedUnitCost,
                daily_menu_name: dailyMenuName.trim()
            });
            alert('Dados da abertura atualizados.');
        } catch (error) {
            console.error('Falha ao atualizar dados da abertura:', error);
            alert('Não foi possível atualizar os dados da abertura. Verifique a conexão e tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-cooper-surface rounded-lg border border-cooper-line shadow-soft">
            <div className="sticky top-0 z-10 bg-cooper-surface border-b border-cooper-line p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="h-10 w-10 rounded-lg border border-cooper-line bg-white hover:bg-cooper-panel flex items-center justify-center text-cooper-ink"
                        title="Voltar ao PDV"
                        aria-label="Voltar ao PDV"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="text-lg font-black text-cooper-ink">Ajustar Abertura do Caixa</h2>
                        <p className="text-xs text-cooper-muted">Dados carregados da abertura do turno atual.</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={!isValid || isSaving}>
                    <Save size={16} /> {isSaving ? 'Salvando...' : 'Salvar Ajustes'}
                </Button>
            </div>

            <div className="p-4 md:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2">
                        <label className="block text-sm font-bold mb-1 text-gray-600">Operador</label>
                        <input
                            type="text"
                            value={operatorName}
                            onChange={e => setOperatorName(e.target.value)}
                            className="w-full border p-3 rounded-lg bg-gray-50 focus:bg-white transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-600">Fundo de Caixa (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={startCash}
                            onChange={e => setStartCash(e.target.value)}
                            className="w-full border p-3 rounded-lg text-lg font-bold text-green-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-600">Grupo Responsável pelo Caixa</label>
                        {activeTerminals.length > 0 ? (
                            <select
                                value={terminalId}
                                onChange={e => setTerminalId(e.target.value)}
                                className="w-full border p-3 rounded-lg bg-gray-50 focus:bg-white transition-colors"
                            >
                                {activeTerminals.map((terminal) => (
                                    <option key={terminal.id} value={terminal.name}>
                                        {terminal.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={terminalId}
                                onChange={e => setTerminalId(e.target.value)}
                                className="w-full border p-3 rounded-lg bg-gray-50 focus:bg-white transition-colors"
                            />
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold mb-1 text-gray-600">Nome do Lanche do Dia</label>
                        <input
                            type="text"
                            value={dailyMenuName}
                            onChange={e => setDailyMenuName(e.target.value)}
                            className="w-full border p-3 rounded-lg bg-gray-50 focus:bg-white transition-colors"
                            placeholder="Ex: Lanche Escoteiro"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-600">Quantos litros de bebida?</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={openingDrinksLiters}
                            onChange={e => setOpeningDrinksLiters(e.target.value)}
                            className="w-full border p-3 rounded-lg"
                            placeholder="Ex: 20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-600">Quantidade de Lanches na Promoção</label>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={openingPromotionQuantity}
                            onChange={e => setOpeningPromotionQuantity(e.target.value)}
                            className="w-full border p-3 rounded-lg"
                            placeholder="Ex: 2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-600">Valor da Promoção (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={openingPromotionValue}
                            onChange={e => setOpeningPromotionValue(e.target.value)}
                            className="w-full border p-3 rounded-lg font-bold text-purple-700"
                            placeholder="Ex: 10.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Ex: {Number.isFinite(parsedOpeningPromotionQuantity) ? parsedOpeningPromotionQuantity : 0} lanches por {formatCurrency(Number.isFinite(parsedOpeningPromotionValue) ? parsedOpeningPromotionValue : 0)}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-600">Custo dos Produtos/Ingredientes (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={openingProductCostTotal}
                            onChange={e => {
                                setOpeningProductCostTotal(e.target.value);
                                setOpeningUnitCostEdited(false);
                            }}
                            className="w-full border p-3 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-600">Valor Unitário Sugerido/Editável (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={openingUnitCost}
                            onChange={e => {
                                setOpeningUnitCost(e.target.value);
                                setOpeningUnitCostEdited(true);
                            }}
                            className="w-full border p-3 rounded-lg text-lg font-bold text-blue-700"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Referência calculada: {formatCurrency(openingUnitCostSuggested)}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-600">Quantidade de Lanche Normal</label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={plannedNormalBurgers}
                            onChange={e => {
                                setPlannedNormalBurgers(e.target.value);
                                setOpeningUnitCostEdited(false);
                            }}
                            className="w-full border p-3 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-600">Quantidade de Lanche Vegano</label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={plannedVeganBurgers}
                            onChange={e => {
                                setPlannedVeganBurgers(e.target.value);
                                setOpeningUnitCostEdited(false);
                            }}
                            className="w-full border p-3 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-600">Quantidade de Lanche para Chefes</label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={plannedChefeBurgers}
                            onChange={e => {
                                setPlannedChefeBurgers(e.target.value);
                                setOpeningUnitCostEdited(false);
                            }}
                            className={`w-full border p-3 rounded-lg ${burgerPlan.chefeExceedsTotal ? 'border-red-400 bg-red-50' : ''}`}
                        />
                        {burgerPlan.chefeExceedsTotal && (
                            <p className="text-xs text-red-600 mt-1">
                                Não pode exceder o total de lanches ({burgerPlan.total}).
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-600">Quantidade Lanche Escoteiros/Extra</label>
                        <input
                            type="number"
                            value={burgerPlan.escoteiroExtra}
                            readOnly
                            tabIndex={-1}
                            className="w-full border p-3 rounded-lg bg-gray-100 text-gray-700 font-bold cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Calculado: (Normal + Vegano) - Chefes
                        </p>
                    </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Alterações no fundo de caixa ajustam o caixa teórico pela diferença informada.
                </div>
            </div>
        </div>
    );
};

export const POS = ({
    onExit,
    currentUserRole
}: {
    onExit: () => void;
    currentUserRole: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';
}) => {
    const {
        currentSession,
        terminals,
        products, promotions, cart, cartTotals, currentShift, orders, maxItemsPerOrder,
        printReceiptEnabled,
        addToCart, removeFromCart, updateCartItem, clearCart, createOrder,
        openShift, updateShiftOpeningData, closeShift, addShiftTransaction, addShiftTransactions, addProduct,
        addPromotion, updatePromotion
    } = useStore();

    const [uiState, setUiState] = useState<{
        modal: 'NONE' | 'CASH_PAYMENT' | 'SHIFT' | 'AUTH_VOID' | 'SUCCESS' | 'CLOSE_SHIFT' | 'REPORTS' | 'CASH_CLOSING_REPORT';
        pendingVoidId?: string;
    }>({ modal: 'NONE' });

    // TC019 - Shift validation error state
    const [shiftValidationError, setShiftValidationError] = useState<string | null>(null);

    // Mobile Cart State
    const [showMobileCart, setShowMobileCart] = useState(false);
    const [posScreen, setPosScreen] = useState<'CATALOG' | 'OPENING_ADJUSTMENTS'>('CATALOG');

    // Open Shift State
    const [shiftStartAmount, setShiftStartAmount] = useState('150.00');
    const [operatorName, setOperatorName] = useState('Caixa 01');
    const [terminalId, setTerminalId] = useState('');
    const [dailyMenuName, setDailyMenuName] = useState('');
    const [openingProductCostTotal, setOpeningProductCostTotal] = useState('');
    const [openingDrinksLiters, setOpeningDrinksLiters] = useState('');
    const [openingPromotionQuantity, setOpeningPromotionQuantity] = useState('2');
    const [openingPromotionValue, setOpeningPromotionValue] = useState('10.00');
    const [openingCostDetails, setOpeningCostDetails] = useState<OpeningCostDetail[]>([createOpeningCostDetail()]);
    const [showOpeningCostDetails, setShowOpeningCostDetails] = useState(false);
    const [plannedNormalBurgers, setPlannedNormalBurgers] = useState('');
    const [plannedVeganBurgers, setPlannedVeganBurgers] = useState('');
    const [plannedChefeBurgers, setPlannedChefeBurgers] = useState('0');
    const [openingUnitCost, setOpeningUnitCost] = useState('');
    const [openingUnitCostEdited, setOpeningUnitCostEdited] = useState(false);
    const [isOpeningShift, setIsOpeningShift] = useState(false);
    const [isClosingShift, setIsClosingShift] = useState(false);

    const activeTerminals = useMemo(
        () =>
            terminals
                .filter((terminal) => terminal.is_active)
                .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
        [terminals]
    );

    useEffect(() => {
        if (activeTerminals.length === 0) return;
        const stillExists = activeTerminals.some((terminal) => terminal.name === terminalId);
        if (!terminalId || !stillExists) {
            setTerminalId(activeTerminals[0].name);
        }
    }, [activeTerminals, terminalId]);

    const fixedProductAvailability = useMemo(() => {
        if (!currentShift) return [];

        const shiftOrders = orders.filter((order) => (
            order.shift_id === currentShift.id && order.status !== OrderStatus.CANCELLED
        ));

        const countItems = (ids: string[]) => {
            const idsSet = new Set(ids);
            const orderCount = shiftOrders.reduce((total, order) => (
                total + order.items.filter((item) => idsSet.has(item.id)).length
            ), 0);
            const cartCount = cart.filter((item) => idsSet.has(item.id)).length;
            return orderCount + cartCount;
        };

        const plannedChefe = currentShift.planned_chefe_burgers ?? 0;
        const plannedVegan = currentShift.planned_vegan_burgers ?? 0;
        const plannedEscoteiroExtra = currentShift.planned_escoteiro_extra_burgers ?? computeBurgerPlan({
            normal: currentShift.planned_normal_burgers ?? 0,
            vegan: plannedVegan,
            chefe: plannedChefe
        }).escoteiroExtra;

        const chefeUsed = countItems([FIXED_PRODUCT_IDS.CHEFE]);
        const veganUsed = countItems([FIXED_PRODUCT_IDS.VEGANO]);
        const escoteiroExtraUsed = countItems([FIXED_PRODUCT_IDS.ESCOTEIRO, FIXED_PRODUCT_IDS.EXTRA]);

        return [
            {
                id: 'chefe',
                label: 'Chefe',
                planned: plannedChefe,
                used: chefeUsed,
                available: Math.max(0, plannedChefe - chefeUsed)
            },
            ...(plannedVegan > 0 ? [{
                id: 'vegano',
                label: 'Lanche Vegano',
                planned: plannedVegan,
                used: veganUsed,
                available: Math.max(0, plannedVegan - veganUsed)
            }] : []),
            {
                id: 'escoteiro-extra',
                label: 'Lanche Escoteiros/Extra',
                planned: plannedEscoteiroExtra,
                used: escoteiroExtraUsed,
                available: Math.max(0, plannedEscoteiroExtra - escoteiroExtraUsed)
            }
        ];
    }, [cart, currentShift, orders]);

    const fixedAvailabilityByProductId = useMemo(() => {
        const byRowId = Object.fromEntries(fixedProductAvailability.map((row) => [row.id, row.available]));
        const escoteiroExtraAvailable = byRowId['escoteiro-extra'];
        return {
            [FIXED_PRODUCT_IDS.CHEFE]: byRowId.chefe,
            [FIXED_PRODUCT_IDS.VEGANO]: byRowId.vegano,
            [FIXED_PRODUCT_IDS.ESCOTEIRO]: escoteiroExtraAvailable,
            [FIXED_PRODUCT_IDS.EXTRA]: escoteiroExtraAvailable
        };
    }, [fixedProductAvailability]);

    const fixedSalesSummary = useMemo(() => {
        if (!currentShift) return undefined;

        const totalSold = orders
            .filter((order) => order.shift_id === currentShift.id && order.status !== OrderStatus.CANCELLED)
            .reduce((total, order) => total + order.total, 0);
        const productCost = currentShift.opening_product_cost_total ?? 0;

        return {
            totalSold,
            productCost,
            remainingToCost: Math.max(0, productCost - totalSold)
        };
    }, [currentShift, orders]);

    // Lanches fixos do caixa com preço derivado da abertura.
    const shiftFixedProducts = useMemo(
        () => buildShiftFixedProducts(currentShift?.opening_unit_cost, {
            includeVegan: (currentShift?.planned_vegan_burgers ?? 0) > 0,
            availability: fixedAvailabilityByProductId
        }),
        [currentShift?.opening_unit_cost, currentShift?.planned_vegan_burgers, fixedAvailabilityByProductId]
    );

    const parsedOpeningCost = parseFloat(openingProductCostTotal || '0');
    const parsedOpeningPromotionQuantity = parseInt(openingPromotionQuantity || '0', 10);
    const parsedOpeningPromotionValue = parseFloat(openingPromotionValue || '0');
    const parsedNormalBurgers = parseInt(plannedNormalBurgers || '0', 10);
    const parsedVeganBurgers = parseInt(plannedVeganBurgers || '0', 10);

    // Total de lanches = Normal + Vegano. Chefes é um recorte desse total;
    // o restante é destinado a Escoteiros/Extra (calculado, somente leitura).
    // Regras centralizadas em computeBurgerPlan para não divergir da validação.
    const parsedChefeBurgers = parseInt(plannedChefeBurgers || '0', 10);
    const burgerPlan = computeBurgerPlan({
        normal: parsedNormalBurgers,
        vegan: parsedVeganBurgers,
        chefe: parsedChefeBurgers
    });
    const totalPlannedBurgers = burgerPlan.total;
    const escoteiroExtraBurgers = burgerPlan.escoteiroExtra;
    const chefeExceedsTotal = burgerPlan.chefeExceedsTotal;

    // Sugestão baseada nos lanches pagantes (Escoteiros/Extra), pois Chefes = R$ 0,00.
    const openingUnitCostSuggested = calculateOpeningUnitCost(
        Number.isFinite(parsedOpeningCost) ? parsedOpeningCost : 0,
        escoteiroExtraBurgers
    );

    useEffect(() => {
        if (!openingUnitCostEdited) {
            setOpeningUnitCost(openingUnitCostSuggested > 0 ? openingUnitCostSuggested.toFixed(2) : '');
        }
    }, [openingUnitCostEdited, openingUnitCostSuggested]);

    // Order State
    const [lastOrder, setLastOrder] = useState<Order | null>(null);
    const [lastPaidAmount, setLastPaidAmount] = useState<number>(0);
    const [orderIdentifier, setOrderIdentifier] = useState('');

    // --- Handlers ---

    const handleOpenShift = async () => {
        if (isOpeningShift) return;
        const amount = parseFloat(shiftStartAmount);
        const totalCost = parseFloat(openingProductCostTotal);
        const drinksLiters = parseFloat(openingDrinksLiters || '0');
        const promotionQuantity = parseInt(openingPromotionQuantity || '0', 10);
        const promotionValue = parseFloat(openingPromotionValue || '0');
        const normalQty = parseInt(plannedNormalBurgers, 10);
        const veganQty = parseInt(plannedVeganBurgers, 10);
        const chefeQty = parseInt(plannedChefeBurgers || '0', 10);
        const finalUnitCost = parseFloat(openingUnitCost);

        if (isOpeningShiftInputValid({
            startCash: amount,
            operatorName,
            terminalId,
            dailyMenuName,
            totalCost,
            drinksLiters,
            promotionQuantity,
            promotionValue,
            normalQty,
            veganQty,
            finalUnitCost,
            chefeQty
        })) {
            const plan = computeBurgerPlan({ normal: normalQty, vegan: veganQty, chefe: chefeQty });
            const openingReimbursements = getOpeningCostReimbursements(openingCostDetails);
            try {
                setIsOpeningShift(true);
                const openedShift = await openShift(operatorName.trim(), amount, terminalId, {
                    opening_product_cost_total: totalCost,
                    opening_drinks_liters: drinksLiters,
                    opening_promotion_quantity: promotionQuantity,
                    opening_promotion_value: promotionValue,
                    planned_normal_burgers: normalQty,
                    planned_vegan_burgers: veganQty,
                    planned_chefe_burgers: chefeQty,
                    planned_escoteiro_extra_burgers: plan.escoteiroExtra,
                    opening_unit_cost_suggested: openingUnitCostSuggested,
                    opening_unit_cost: finalUnitCost,
                    daily_menu_name: dailyMenuName.trim()
                });
                if (!openedShift) return;
                const openingPromotion = buildOpeningPromotion({
                    quantity: promotionQuantity,
                    value: promotionValue,
                    dailyMenuName
                });
                if (promotions.some((promotion) => promotion.id === OPENING_PROMOTION_ID)) {
                    updatePromotion(OPENING_PROMOTION_ID, openingPromotion);
                } else {
                    addPromotion(openingPromotion);
                }
                await addShiftTransactions(openingReimbursements.map((reimbursement) => ({
                    type: 'REIMBURSEMENT',
                    amount: reimbursement.amount,
                    reason: 'Reembolso Abertura',
                    extras: {
                        payee: reimbursement.payee || 'Reembolso de abertura'
                    }
                })));
            } catch (error) {
                console.error('Falha ao abrir caixa:', error);
                alert('Não foi possível abrir o caixa no banco de dados. Verifique a conexão/Supabase e tente novamente.');
            } finally {
                setIsOpeningShift(false);
            }
        } else {
            alert("Preencha todos os campos corretamente.");
        }
    };

    const handleApplyOpeningCostDetails = () => {
        const total = getOpeningCostDetailsTotal(openingCostDetails);
        setOpeningProductCostTotal(total.toFixed(2));
        setOpeningUnitCostEdited(false);
        setShowOpeningCostDetails(false);
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

        // Permission-based authorization (no hardcoded PIN)
        if (type === 'DROP') {
            const canAuthorizeDrop = currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER';
            if (!canAuthorizeDrop) {
                alert("Apenas Admin/Gerente pode autorizar sangria.");
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
        setOrderIdentifier('');
        setUiState({ modal: 'SUCCESS' });
    };

    const validateCheckout = () => {
        if (!currentShift || currentShift.status === 'CLOSED') {
            console.log('[SHIFT VALIDATION] Checkout blocked - no open shift');
            setShiftValidationError('Abra um turno de caixa antes de realizar vendas');
            setTimeout(() => setShiftValidationError(null), 3000);
            return false;
        }
        return cart.length > 0;
    };

    const handlePixPayment = () => {
        if (!validateCheckout()) return;
        setShowMobileCart(false);
        handlePaymentConfirm(PaymentMethod.PIX, cartTotals.total, orderIdentifier.trim());
    };

    const handleCashPayment = () => {
        if (!validateCheckout()) return;
        setShowMobileCart(false);
        setUiState({ modal: 'CASH_PAYMENT' });
    };

    const handleCancelCart = () => {
        clearCart();
        setOrderIdentifier('');
    };

    const handleSaveOpeningAdjustments = async (updates: Parameters<typeof updateShiftOpeningData>[0]) => {
        const updatedShift = await updateShiftOpeningData(updates);
        if (!updatedShift) {
            throw new Error('Caixa aberto não encontrado para ajuste.');
        }
        const promotionQuantity = updatedShift.opening_promotion_quantity;
        const promotionValue = updatedShift.opening_promotion_value;
        if (
            Number.isInteger(promotionQuantity) &&
            (promotionQuantity ?? 0) > 0 &&
            Number.isFinite(promotionValue) &&
            (promotionValue ?? 0) > 0
        ) {
            const openingPromotion = buildOpeningPromotion({
                quantity: promotionQuantity as number,
                value: promotionValue as number,
                dailyMenuName: updatedShift.daily_menu_name ?? ''
            });
            if (promotions.some((promotion) => promotion.id === OPENING_PROMOTION_ID)) {
                updatePromotion(OPENING_PROMOTION_ID, openingPromotion);
            } else {
                addPromotion(openingPromotion);
            }
        }
    };

    // --- Render Logic ---

    // 1. Shift Closed Screen
    if (!currentShift || currentShift.status === 'CLOSED') {
        return (
            <>
                <div className="h-screen bg-cooper-canvas flex items-center justify-center p-4 cooper-subtle-grid">
                    <div className="bg-cooper-surface p-8 rounded-lg shadow-soft border border-cooper-line max-w-3xl w-full relative max-h-[92vh] overflow-y-auto">
                        <button onClick={onExit} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <LogOut size={20} />
                        </button>
                        <div className="flex justify-center mb-6">
                            <div className="bg-cooper-leaf/10 p-4 rounded-lg text-cooper-leaf"><Lock size={32} /></div>
                        </div>
                        <h1 className="text-2xl font-bold text-center mb-2">Caixa Fechado</h1>

                        {!currentSession ? (
                            <div className="text-center">
                                <p className="text-cooper-leaf font-bold mb-4">A LOJA ESTÁ FECHADA</p>
                                <p className="text-gray-500 mb-6">Abra o expediente da loja no painel administrativo para liberar a abertura de caixa.</p>
                                <Button variant="secondary" className="w-full" onClick={onExit}>VOLTAR AO MENU</Button>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-500 text-center mb-6">Inicie o turno para começar a vender.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="md:col-span-2">
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
                                        <label className="block text-sm font-bold mb-1 text-gray-600">Grupo Responsável pelo Caixa</label>
                                        {activeTerminals.length > 0 ? (
                                            <select
                                                value={terminalId}
                                                onChange={e => setTerminalId(e.target.value)}
                                                className="w-full border p-3 rounded-lg bg-gray-50 focus:bg-white transition-colors"
                                            >
                                                {activeTerminals.map((terminal) => (
                                                    <option key={terminal.id} value={terminal.name}>
                                                        {terminal.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <>
                                                <input
                                                    type="text"
                                                    value=""
                                                    disabled
                                                    className="w-full border p-3 rounded-lg bg-gray-100 text-gray-400"
                                                    placeholder="Nenhum terminal ativo cadastrado"
                                                />
                                                <p className="text-xs text-amber-700 mt-1">
                                                    Cadastre e ative um terminal no Admin para abrir o caixa.
                                                </p>
                                            </>
                                        )}
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
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold mb-1 text-gray-600">Nome do Lanche do Dia</label>
                                        <input
                                            type="text"
                                            value={dailyMenuName}
                                            onChange={e => setDailyMenuName(e.target.value)}
                                            className="w-full border p-3 rounded-lg bg-gray-50 focus:bg-white transition-colors"
                                            placeholder="Ex: Lanche Escoteiro"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1 text-gray-600">Quantos litros de bebida?</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={openingDrinksLiters}
                                            onChange={e => setOpeningDrinksLiters(e.target.value)}
                                            className="w-full border p-3 rounded-lg"
                                            placeholder="Ex: 20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1 text-gray-600">Quantidade de Lanches na Promoção</label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={openingPromotionQuantity}
                                            onChange={e => setOpeningPromotionQuantity(e.target.value)}
                                            className="w-full border p-3 rounded-lg"
                                            placeholder="Ex: 2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1 text-gray-600">Valor da Promoção (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={openingPromotionValue}
                                            onChange={e => setOpeningPromotionValue(e.target.value)}
                                            className="w-full border p-3 rounded-lg font-bold text-purple-700"
                                            placeholder="Ex: 10.00"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Ex: {Number.isFinite(parsedOpeningPromotionQuantity) ? parsedOpeningPromotionQuantity : 0} lanches por {formatCurrency(Number.isFinite(parsedOpeningPromotionValue) ? parsedOpeningPromotionValue : 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1 text-gray-600">Custo dos Produtos/Ingredientes (R$)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={openingProductCostTotal}
                                                onChange={e => {
                                                    setOpeningProductCostTotal(e.target.value);
                                                    setOpeningUnitCostEdited(false);
                                                }}
                                                className="w-full border p-3 rounded-lg"
                                                placeholder="Ex: 450.00"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowOpeningCostDetails(true)}
                                                className="h-[50px] w-[50px] shrink-0 rounded-lg bg-cooper-leaf text-white hover:bg-cooper-leafDark shadow-lift flex items-center justify-center"
                                                title="Detalhar reembolsos"
                                                aria-label="Detalhar reembolsos"
                                            >
                                                <Plus size={22} />
                                            </button>
                                        </div>
                                    </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1 text-gray-600">Valor Unitário Sugerido/Editável (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={openingUnitCost}
                                        onChange={e => {
                                            setOpeningUnitCost(e.target.value);
                                            setOpeningUnitCostEdited(true);
                                        }}
                                        className="w-full border p-3 rounded-lg text-lg font-bold text-blue-700"
                                        placeholder="Calculado automaticamente"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Referência calculada: {openingUnitCostSuggested > 0 ? formatCurrency(openingUnitCostSuggested) : formatCurrency(0)}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1 text-gray-600">Quantidade de Lanche Normal</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={plannedNormalBurgers}
                                        onChange={e => {
                                            setPlannedNormalBurgers(e.target.value);
                                            setOpeningUnitCostEdited(false);
                                        }}
                                        className="w-full border p-3 rounded-lg"
                                        placeholder="Ex: 80"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1 text-gray-600">Quantidade de Lanche Vegano</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={plannedVeganBurgers}
                                        onChange={e => {
                                            setPlannedVeganBurgers(e.target.value);
                                            setOpeningUnitCostEdited(false);
                                        }}
                                        className="w-full border p-3 rounded-lg"
                                        placeholder="Ex: 20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1 text-gray-600">Quantidade de Lanche para Chefes</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={plannedChefeBurgers}
                                        onChange={e => setPlannedChefeBurgers(e.target.value)}
                                        className={`w-full border p-3 rounded-lg ${chefeExceedsTotal ? 'border-red-400 bg-red-50' : ''}`}
                                        placeholder="Ex: 10"
                                    />
                                    {chefeExceedsTotal && (
                                        <p className="text-xs text-red-600 mt-1">
                                            Não pode exceder o total de lanches ({totalPlannedBurgers}).
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1 text-gray-600">Quantidade Lanche Escoteiros/Extra</label>
                                    <input
                                        type="number"
                                        value={escoteiroExtraBurgers}
                                        readOnly
                                        tabIndex={-1}
                                        className="w-full border p-3 rounded-lg bg-gray-100 text-gray-700 font-bold cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Calculado: (Normal + Vegano) − Chefes
                                    </p>
                                </div>
                            </div>
                            <Button onClick={handleOpenShift} disabled={isOpeningShift} className="w-full py-4 text-lg shadow-xl">
                                {isOpeningShift ? 'SALVANDO...' : 'ABRIR CAIXA'}
                            </Button>
                        </>
                    )}
                    </div>
                </div>
                {showOpeningCostDetails && (
                    <OpeningCostDetailsModal
                        details={openingCostDetails}
                        onChange={setOpeningCostDetails}
                        onClose={() => setShowOpeningCostDetails(false)}
                        onApply={handleApplyOpeningCostDetails}
                    />
                )}
            </>
        );
    }

    // 2. Main POS Screen
    return (
        <div className="flex flex-col md:flex-row h-screen bg-cooper-canvas overflow-hidden font-sans relative text-cooper-ink">

            {/* --- MOBILE HEADER --- */}
            <div className="md:hidden h-14 bg-cooper-ink text-white flex items-center justify-between px-4 shrink-0 z-30 shadow-md">
                <div className="font-bold text-lg tracking-tight text-cooper-moss">PDV</div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end opacity-70">
                        <span className="text-[10px] font-mono leading-none">{currentShift.terminal_id}</span>
                        <span className="text-[10px] leading-none">{currentShift.staff_name.split(' ')[0]}</span>
                    </div>
                    <button onClick={onExit} className="p-2 bg-cooper-leaf rounded-lg text-white shadow-lift hover:bg-cooper-moss transition-colors" title="Trocar Módulo">
                        <LogOut size={18} className="rotate-180" />
                    </button>
                </div>
            </div>

            {/* --- DESKTOP SIDEBAR --- */}
            <div className="hidden md:flex w-20 bg-cooper-ink text-white flex-col items-center py-4 gap-6 z-30 shadow-xl shrink-0">
                <div className="font-bold text-xl tracking-tight text-cooper-moss">PDV</div>

                <div className="flex flex-col gap-4 w-full px-2">
                    <button
                        className={`p-3 w-full rounded-lg hover:bg-white/10 active:bg-cooper-leaf transition-colors flex justify-center hover:text-white ${
                            posScreen === 'OPENING_ADJUSTMENTS'
                                ? 'bg-cooper-leaf/20 text-cooper-moss ring-1 ring-cooper-moss/40'
                                : 'bg-white/5 text-cooper-moss'
                        }`}
                        onClick={() => {
                            setUiState({ modal: 'NONE' });
                            setPosScreen('OPENING_ADJUSTMENTS');
                        }}
                        title="Ajustar Abertura"
                    >
                        <Settings size={20} />
                    </button>

                    <button
                        className="p-3 w-full bg-white/5 rounded-lg hover:bg-white/10 active:bg-cooper-leaf transition-colors flex justify-center text-green-300 hover:text-white"
                        onClick={() => setUiState({ modal: 'REPORTS' })}
                        title="Relatórios"
                    >
                        <BarChart2 size={20} />
                    </button>

                    <div className="h-px bg-white/10 w-full mx-auto my-2"></div>

                    <button
                        className="p-3 w-full bg-red-950/30 border border-red-900 rounded-lg hover:bg-red-700 hover:text-white text-red-300 transition-all flex justify-center shadow-inner"
                        onClick={handleCloseShift}
                        title="Fechar Turno (Relatório Z)"
                    >
                        <Power size={20} />
                    </button>
                </div>

                <div className="flex-1"></div>

                <button
                    onClick={onExit}
                    className="p-3 w-full bg-white/5 rounded-lg hover:bg-white/10 text-cooper-moss hover:text-white transition-colors mb-4 flex justify-center"
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
                    {posScreen === 'OPENING_ADJUSTMENTS' ? (
                        <OpeningAdjustmentsScreen
                            shift={currentShift}
                            activeTerminals={activeTerminals}
                            onBack={() => setPosScreen('CATALOG')}
                            onSave={handleSaveOpeningAdjustments}
                        />
                    ) : (
                        <ProductGrid
                            products={products}
                            pinnedProducts={shiftFixedProducts}
                            pinnedAvailability={fixedProductAvailability}
                            pinnedSalesSummary={fixedSalesSummary}
                            onAdd={(p) => {
                                if (cart.length >= maxItemsPerOrder) {
                                    alert(`Limite de ${maxItemsPerOrder} itens por pedido atingido.`);
                                    return;
                                }
                                addToCart(p);
                            }}
                            onCreateProduct={addProduct}
                        />
                    )}
                </div>
            </div>

            {/* --- MOBILE BOTTOM NAV --- */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-cooper-surface border-t border-cooper-line flex items-center justify-around z-40 pb-safe">
                <button
                    onClick={() => {
                        setUiState({ modal: 'NONE' });
                        setShowMobileCart(false);
                        setPosScreen('OPENING_ADJUSTMENTS');
                    }}
                    className={`flex flex-col items-center justify-center w-14 h-full active:text-blue-600 ${posScreen === 'OPENING_ADJUSTMENTS' ? 'text-cooper-leaf' : 'text-gray-500'}`}
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
                    className="flex flex-col items-center justify-center -mt-6 w-14 h-14 bg-cooper-leaf rounded-full text-white shadow-lg shadow-cooper-leaf/30 active:scale-95 transition-transform relative"
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
        fixed inset-0 z-50 bg-cooper-surface transform transition-transform duration-300 md:relative md:transform-none md:inset-auto md:z-10
        ${showMobileCart ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        w-full md:w-[400px] flex flex-col shadow-2xl
      `}>
                {/* Mobile Header for Cart */}
                <div className="md:hidden flex justify-between items-center p-4 bg-cooper-ink text-white">
                    <h2 className="font-bold text-lg">Carrinho ({cart.length})</h2>
                    <button onClick={() => setShowMobileCart(false)} className="p-2 bg-white/10 rounded-full">
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
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="order-identifier" className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1">
                                Senha / Pager / Identificador (opcional)
                            </label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                                <input
                                    id="order-identifier"
                                    value={orderIdentifier}
                                    onChange={(event) => setOrderIdentifier(event.target.value.toUpperCase())}
                                    disabled={cart.length === 0}
                                    className="w-full rounded-lg border border-cooper-line bg-cooper-panel py-2.5 pl-10 pr-3 text-sm font-bold uppercase text-cooper-ink outline-none focus:border-cooper-leaf focus:bg-white disabled:opacity-50"
                                    placeholder="Ex: A23, 10, JOÃO"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                data-testid="pay-pix"
                                onClick={handlePixPayment}
                                disabled={cart.length === 0}
                                className="min-h-16 rounded-xl bg-cooper-leaf text-white px-3 py-3 flex items-center justify-center gap-2 font-black text-lg shadow-lift hover:bg-cooper-leafDark active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <QrCode size={24} />
                                PIX
                            </button>
                            <button
                                data-testid="pay-cash"
                                onClick={handleCashPayment}
                                disabled={cart.length === 0}
                                className="min-h-16 rounded-xl bg-cooper-ink text-white px-3 py-3 flex items-center justify-center gap-2 font-black text-lg shadow-lift hover:bg-black active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Banknote size={24} />
                                Dinheiro
                            </button>
                        </div>

                        <Button variant="danger" className="w-full py-2" onClick={handleCancelCart} disabled={cart.length === 0}>
                            Cancelar pedido
                        </Button>
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
            {uiState.modal === 'CASH_PAYMENT' && (
                <CashPaymentModal
                    total={cartTotals.total}
                    onCancel={() => {
                        setUiState({ modal: 'NONE' });
                        setShowMobileCart(true);
                    }}
                    onConfirm={(paidAmount) => handlePaymentConfirm(
                        PaymentMethod.CASH,
                        paidAmount,
                        orderIdentifier.trim()
                    )}
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
                    onConfirmClose={async (payload: any) => {
                        if (isClosingShift) return;
                        try {
                            setIsClosingShift(true);
                            await closeShift(payload);
                            setUiState({ modal: 'NONE' });
                        } catch (error) {
                            console.error('Falha ao fechar caixa:', error);
                            alert('Não foi possível fechar o caixa no banco de dados. O caixa permanece aberto para nova tentativa.');
                        } finally {
                            setIsClosingShift(false);
                        }
                    }}
                />
            )}

            {uiState.modal === 'REPORTS' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-cooper-surface w-full max-w-sm rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 border border-cooper-line">
                        <div className="bg-cooper-ink text-white p-5 flex justify-between items-center">
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
                                className="w-full flex items-center justify-between p-4 bg-cooper-panel hover:bg-cooper-surface border border-cooper-line rounded-lg transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-cooper-leaf/10 text-cooper-leaf rounded-lg flex items-center justify-center group-hover:bg-cooper-leaf/15 transition-colors">
                                        <FileText size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-gray-800 text-sm">Fechamento de Caixa</div>
                                        <div className="text-xs text-gray-500">Resumo de vendas e movimentações do turno</div>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-gray-400 group-hover:text-cooper-leaf" />
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
