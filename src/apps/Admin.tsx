import React, { useState } from 'react';
import { useStore } from '../store';
import { PaymentMethod } from '../types';
import { Card, Badge, formatCurrency, Button } from '../components/ui';
import { InventoryManager, ProductManager, PromotionManager, UserManager, ReportsManager } from '../components/admin/AdminComponents';
import { ScoutManager } from '../components/admin/ScoutManager';
import { OrderManager } from '../components/admin/OrderManager';
import { StoreControl } from '../components/admin/StoreControl';
import { BarChart, Users, DollarSign, Activity, Package, ClipboardList, Tag, Settings, LogOut, Percent, ChevronLeft, ChevronRight, Upload, FileText, Trash2, Paperclip, AlertTriangle, Wallet, Save, Building2, FileBarChart, Database, Menu, X, Monitor, Tent } from 'lucide-react';

type AdminTab = 'DASHBOARD' | 'PRODUCTS' | 'INVENTORY' | 'ORDERS' | 'PROMOS' | 'USERS' | 'SETTINGS' | 'REPORTS' | 'SCOUTS';

export const Admin = ({ onExit, onLogout }: { onExit?: () => void; onLogout?: () => void }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Sidebar Navigation Items
    const navItems = [
        { id: 'DASHBOARD', label: 'Dashboard', icon: <Activity size={20} /> },
        { id: 'REPORTS', label: 'Relatórios', icon: <FileBarChart size={20} /> },
        { id: 'ORDERS', label: 'Pedidos', icon: <ClipboardList size={20} /> },
        { id: 'PRODUCTS', label: 'Produtos', icon: <Tag size={20} /> },
        { id: 'INVENTORY', label: 'Estoque', icon: <Package size={20} /> },
        { id: 'PROMOS', label: 'Promoções', icon: <Percent size={20} /> },
        { id: 'USERS', label: 'Usuários', icon: <Users size={20} /> },
        { id: 'SCOUTS', label: 'Escoteiros', icon: <Tent size={20} /> },
        { id: 'SETTINGS', label: 'Configurações', icon: <Settings size={20} /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'PRODUCTS': return <ProductManager />;
            case 'INVENTORY': return <InventoryManager />;
            case 'ORDERS': return <OrderManager />;
            case 'PROMOS': return <PromotionManager />;
            case 'USERS': return <UserManager />;
            case 'SCOUTS': return <ScoutManager />;
            case 'SETTINGS': return <SettingsView />;
            case 'REPORTS': return <ReportsManager />;
            case 'DASHBOARD':
            default: return <DashboardView onNavigate={setActiveTab} />;
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center z-30 shrink-0">
                <h1 className="text-lg font-bold">Lanchonete <span className="text-red-500">Escoteiros</span></h1>
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2">
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
            fixed md:relative inset-y-0 left-0 z-50 bg-gray-900 text-gray-300 flex flex-col shrink-0 transition-transform duration-300
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${isCollapsed ? 'md:w-20' : 'md:w-64'}
            w-64
        `}>

                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="absolute top-4 right-4 md:hidden text-white p-2"
                >
                    <X size={20} />
                </button>

                {/* Toggle Button (Desktop Only) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex absolute -right-3 top-8 bg-blue-600 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-500 transition-colors z-10 border-2 border-gray-100"
                    title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                <div className={`p-6 ${isCollapsed ? 'md:items-center md:flex md:flex-col' : ''} transition-all duration-300`}>
                    {isCollapsed ? (
                        <div className="hidden md:flex w-10 h-10 bg-gradient-to-br from-red-600 to-orange-500 rounded-lg items-center justify-center text-white font-bold text-xl shadow-lg">
                            C
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-300 hidden md:block">
                            <h1 className="text-xl font-bold text-white tracking-tighter truncate">Escoteiros<span className="text-red-500">Cooper</span></h1>
                            <p className="text-xs text-gray-500 mt-1 truncate">Backoffice Suite v1.0</p>
                        </div>
                    )}
                    {/* Mobile Title in Sidebar */}
                    <div className="md:hidden">
                        <h1 className="text-xl font-bold text-white tracking-tighter">Menu Admin</h1>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-x-hidden overflow-y-auto">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id as AdminTab);
                                setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center ${isCollapsed ? 'md:justify-center md:px-0' : 'px-4'} px-4 py-3 rounded-lg transition-all duration-200 group relative ${activeTab === item.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                    : 'hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <div className="shrink-0">{item.icon}</div>

                            <span className={`font-medium ml-3 truncate transition-opacity duration-200 ${isCollapsed ? 'md:hidden' : 'block'}`}>
                                {item.label}
                            </span>

                            {/* Tooltip for collapsed state (Desktop) */}
                            {isCollapsed && (
                                <div className="hidden md:block absolute left-full ml-4 px-3 py-2 bg-gray-800 text-white text-xs font-bold rounded shadow-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                                    {item.label}
                                    {/* Arrow */}
                                    <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-gray-800" />
                                </div>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800 space-y-2">
                    {onExit && (
                        <button
                            onClick={onExit}
                            className={`flex items-center ${isCollapsed ? 'md:justify-center' : 'gap-3'} gap-3 text-blue-400 hover:text-white transition-colors w-full px-4 py-2 rounded-lg hover:bg-gray-800`}
                        >
                            <LogOut size={18} className="rotate-180" />
                            <span className={`${isCollapsed ? 'md:hidden' : 'block'}`}>Trocar Módulo</span>
                        </button>
                    )}

                    <button
                        onClick={onLogout}
                        className={`flex items-center ${isCollapsed ? 'md:justify-center' : 'gap-3'} gap-3 text-gray-400 hover:text-white transition-colors w-full px-4 py-2 rounded-lg hover:bg-gray-800`}
                    >
                        <LogOut size={18} />
                        <span className={`${isCollapsed ? 'md:hidden' : 'block'}`}>Sair</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100 w-full">
                <header className="mb-8 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-500">
                    <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
                        {navItems.find(i => i.id === activeTab)?.label}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <span className="text-xs text-gray-500 block uppercase tracking-wider font-bold">Loja Matriz</span>
                            <span className="text-sm font-bold text-gray-800">São Paulo, SP</span>
                        </div>
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 border-2 border-white shadow-sm">
                            AD
                        </div>
                    </div>
                </header>

                <div className="animate-in fade-in zoom-in-95 duration-300">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

// --- Settings View ---
const SettingsView = () => {
    const {
        currentShift,
        addShiftTransaction,
        taxSettings,
        updateTaxSettings,
        resetDatabase,
        maxItemsPerOrder,
        setMaxItemsPerOrder,
        activePaymentMethodsPOS,
        activePaymentMethodsKiosk,
        togglePaymentMethod,
        printReceiptEnabled,
        setPrintReceiptEnabled
    } = useStore();

    // Reimbursement State
    const [payee, setPayee] = useState('');
    const [amount, setAmount] = useState('');
    const [attachment, setAttachment] = useState<string | null>(null);

    // Business Rules State
    const [localMaxItems, setLocalMaxItems] = useState(maxItemsPerOrder.toString());

    // Tax Settings State
    const [localTaxName, setLocalTaxName] = useState(taxSettings.taxName);
    const [localTaxRate, setLocalTaxRate] = useState(taxSettings.defaultRate.toString());
    const [localTaxId, setLocalTaxId] = useState(taxSettings.taxId);
    const [localExemptions, setLocalExemptions] = useState(taxSettings.exemptCategories.join(', '));

    // Calculate totals from current shift (or 0 if no shift)
    const reimbursements = currentShift?.transactions.filter(t => t.type === 'REIMBURSEMENT') || [];
    const totalReimbursed = reimbursements.reduce((acc, t) => acc + t.amount, 0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachment(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveReimbursement = () => {
        if (!payee || !amount) {
            alert("Por favor, preencha o nome do beneficiário e o valor.");
            return;
        }

        if (!currentShift) {
            alert("Atenção: Não há turno de caixa aberto para registrar esta saída. A operação não pode ser concluída.");
            return;
        }

        addShiftTransaction('REIMBURSEMENT', parseFloat(amount), 'Reembolso Administrativo', {
            payee,
            attachment: attachment || undefined
        });

        // Reset
        setPayee('');
        setAmount('');
        setAttachment(null);
    };

    const handleSaveTaxSettings = () => {
        const rate = parseFloat(localTaxRate);
        if (isNaN(rate) || rate < 0) {
            alert("Taxa inválida.");
            return;
        }

        const exemptArray = localExemptions.split(',').map(s => s.trim()).filter(Boolean);

        updateTaxSettings({
            taxName: localTaxName,
            defaultRate: rate,
            taxId: localTaxId,
            exemptCategories: exemptArray
        });
        alert("Configurações Fiscais Salvas!");
    };

    const handleSaveBusinessRules = () => {
        const val = parseInt(localMaxItems);
        if (isNaN(val) || val < 1) {
            alert("O limite de itens deve ser um número maior que 0.");
            return;
        }
        setMaxItemsPerOrder(val);
        alert("Regras de negócio salvas!");
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">

            {/* SECTION 1: Financeiro */}
            <div>
                <div className="border-b pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Financeiro & Despesas</h2>
                        <p className="text-gray-500 mt-1">Gerencie lançamentos de saídas, reembolsos e anexe comprovantes fiscais.</p>
                    </div>
                    {currentShift && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 self-start md:self-auto">
                            Turno Ativo: {currentShift.staff_name}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Input Form */}
                    <Card className="lg:col-span-1 p-6 h-fit border-l-4 border-l-blue-600 shadow-lg">
                        <div className="flex items-center gap-2 mb-6 border-b pb-4">
                            <Wallet className="text-blue-600" />
                            <h3 className="text-xl font-bold text-gray-800">Novo Reembolso</h3>
                        </div>

                        {!currentShift && (
                            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm flex gap-2 mb-4 border border-yellow-200">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <p>Caixa fechado. Abra um turno no PDV para registrar movimentações financeiras.</p>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Beneficiário (Reembolsado)</label>
                                <input
                                    type="text"
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                    placeholder="Ex: Motoboy, Fornecedor X"
                                    value={payee}
                                    onChange={e => setPayee(e.target.value)}
                                    disabled={!currentShift}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Valor do Reembolso (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-500 font-bold">R$</span>
                                    <input
                                        type="number"
                                        className="w-full border p-3 pl-10 rounded-lg text-lg font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        disabled={!currentShift}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nota Fiscal / Comprovante</label>
                                <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${attachment ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:bg-gray-100'}`}>
                                    <input
                                        type="file"
                                        id="nf-upload"
                                        className="hidden"
                                        accept="image/*,.pdf"
                                        onChange={handleFileChange}
                                        disabled={!currentShift}
                                    />
                                    <label htmlFor="nf-upload" className="cursor-pointer block">
                                        {attachment ? (
                                            <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
                                                <Paperclip size={18} />
                                                <span>Arquivo Anexado</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setAttachment(null);
                                                    }}
                                                    className="ml-2 p-1 hover:bg-green-200 rounded-full"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-gray-500">
                                                <Upload className="mx-auto mb-2 opacity-50" />
                                                <span className="text-xs font-bold uppercase">Clique para anexar NF</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <Button
                                className="w-full py-4 mt-4 shadow-lg shadow-blue-200"
                                onClick={handleSaveReimbursement}
                                disabled={!currentShift}
                            >
                                <Save size={18} className="mr-2 inline" /> Registrar Reembolso
                            </Button>
                        </div>
                    </Card>

                    {/* Summary & List */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Total Card */}
                        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-6 text-white shadow-xl flex justify-between items-center transform transition-transform hover:scale-[1.01]">
                            <div>
                                <p className="text-blue-200 text-sm font-bold uppercase tracking-wider mb-1">Total de Reembolsos (Turno Atual)</p>
                                <h2 className="text-5xl font-black tracking-tight">{formatCurrency(totalReimbursed)}</h2>
                                <p className="text-xs opacity-60 mt-2 font-mono">ID Turno: {currentShift?.id || 'Nenhum'}</p>
                            </div>
                            <div className="h-20 w-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/10">
                                <DollarSign size={40} className="text-white" />
                            </div>
                        </div>

                        {/* History List */}
                        <Card className="flex-1 overflow-hidden flex flex-col min-h-[400px] border-0 shadow-lg">
                            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <FileText size={18} /> Histórico de Lançamentos
                                </h3>
                                <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600 font-bold">{reimbursements.length} registros</span>
                            </div>
                            <div className="flex-1 overflow-auto p-0 bg-white">
                                {reimbursements.length === 0 ? (
                                    <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                                        <FileText size={48} className="mb-4 opacity-20" />
                                        <p>Nenhum reembolso registrado neste turno.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm min-w-[500px]">
                                        <thead className="bg-gray-50 text-gray-500 sticky top-0 uppercase text-xs tracking-wider">
                                            <tr>
                                                <th className="p-4 font-bold">Data/Hora</th>
                                                <th className="p-4 font-bold">Beneficiário</th>
                                                <th className="p-4 font-bold">Comprovante</th>
                                                <th className="p-4 font-bold text-right">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {reimbursements.slice().reverse().map((t) => (
                                                <tr key={t.id} className="hover:bg-blue-50/50 transition-colors">
                                                    <td className="p-4 text-gray-500">
                                                        <span className="font-bold text-gray-700">{new Date(t.time).toLocaleTimeString()}</span>
                                                        <span className="block text-[10px] opacity-60">{new Date(t.time).toLocaleDateString()}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="font-bold text-gray-800 block">{t.payee || 'N/A'}</span>
                                                        <span className="text-xs text-gray-400 font-mono">Ref: {t.id.slice(0, 6)}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        {t.attachment ? (
                                                            <button
                                                                onClick={() => {
                                                                    const w = window.open("");
                                                                    w?.document.write(`<img src="${t.attachment}" style="max-width:100%"/>`);
                                                                }}
                                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-xs font-bold bg-blue-50 px-2 py-1 rounded border border-blue-100"
                                                            >
                                                                <Paperclip size={12} /> Ver Anexo
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-300 italic text-xs">Sem anexo</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right font-bold text-lg text-gray-800">
                                                        {formatCurrency(t.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* SECTION 2: Tax Configuration */}
            <div>
                <div className="border-b border-gray-200 pb-4 mt-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Configuração Fiscal</h2>
                    <p className="text-gray-500 mt-1">Defina as taxas padrão (ICMS, IVA) e categorias de isenção.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="p-6 border-l-4 border-l-purple-600 shadow-md">
                        <div className="flex items-center gap-2 mb-6 border-b pb-4">
                            <Building2 className="text-purple-600" />
                            <h3 className="text-xl font-bold text-gray-800">Parâmetros Fiscais</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={taxSettings.isEnabled}
                                        onChange={(e) => updateTaxSettings({ isEnabled: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                                <span className="font-bold text-gray-700">Habilitar Cálculos Fiscais</span>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Imposto (Sigla)</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        className="w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        placeholder="Ex: ICMS, IVA"
                                        value={localTaxName}
                                        onChange={e => setLocalTaxName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Taxa Padrão (%)</label>
                                <div className="relative">
                                    <Percent className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="number"
                                        className="w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        placeholder="0.00"
                                        value={localTaxRate}
                                        onChange={e => setLocalTaxRate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">CNPJ / ID Fiscal</label>
                                <input
                                    type="text"
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                    placeholder="00.000.000/0001-00"
                                    value={localTaxId}
                                    onChange={e => setLocalTaxId(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 border-l-4 border-l-gray-400 shadow-md flex flex-col">
                        <div className="flex items-center gap-2 mb-6 border-b pb-4">
                            <Tag className="text-gray-600" />
                            <h3 className="text-xl font-bold text-gray-800">Isenções & Exceções</h3>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Categorias Isentas</label>
                                <p className="text-xs text-gray-500 mb-2">Separe as categorias por vírgula.</p>
                                <textarea
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all h-32 resize-none"
                                    placeholder="Ex: Bebidas, Sobremesas..."
                                    value={localExemptions}
                                    onChange={e => setLocalExemptions(e.target.value)}
                                />
                            </div>

                            <div className="bg-purple-50 p-4 rounded-lg text-sm text-purple-800 border border-purple-100">
                                <p className="font-bold flex items-center gap-2"><Settings size={14} /> Nota de Implementação</p>
                                <p className="mt-1 opacity-80">
                                    Ao habilitar, a taxa de <strong>{localTaxRate}%</strong> será aplicada sobre o valor líquido dos produtos, exceto para itens das categorias listadas acima.
                                </p>
                            </div>
                        </div>

                        <Button
                            className="w-full py-4 mt-6 bg-purple-600 hover:bg-purple-700 shadow-purple-200"
                            onClick={handleSaveTaxSettings}
                        >
                            <Save size={18} className="mr-2 inline" /> Salvar Configurações Fiscais
                        </Button>
                    </Card>
                </div>
            </div>

            {/* SECTION: Regras de Negócio & Impressão */}
            <div>
                <div className="border-b border-gray-200 pb-4 mt-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Regras de Negócio & Impressão</h2>
                    <p className="text-gray-500 mt-1">Defina limites, meios de pagamento e comportamentos do sistema.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 border-l-4 border-l-yellow-500 shadow-md">
                        <div className="flex items-center gap-2 mb-6 border-b pb-4">
                            <AlertTriangle className="text-yellow-600" />
                            <h3 className="text-xl font-bold text-gray-800">Limites de Pedido</h3>
                        </div>

                        <div className="max-w-md">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Máximo de Itens por Pedido</label>
                            <p className="text-sm text-gray-500 mb-3">Define quantos produtos podem ser adicionados em uma única venda.</p>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none transition-all font-bold text-lg"
                                    value={localMaxItems}
                                    onChange={e => setLocalMaxItems(e.target.value)}
                                />
                                <span className="text-gray-400 font-bold">itens</span>
                            </div>
                            <Button
                                className="w-full py-4 mt-4 bg-yellow-600 hover:bg-yellow-700 shadow-yellow-200"
                                onClick={handleSaveBusinessRules}
                            >
                                <Save size={18} className="mr-2 inline" /> Salvar Regras
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-6 border-l-4 border-l-blue-400 shadow-md">
                        <div className="flex items-center gap-2 mb-6 border-b pb-4">
                            <FileText className="text-blue-500" />
                            <h3 className="text-xl font-bold text-gray-800">Impressão de Comanda</h3>
                        </div>

                        <div className="max-w-md space-y-4">
                            <p className="text-sm text-gray-500 mb-3">Habilite ou desabilite a impressão automática do cupom/comanda após a venda.</p>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={printReceiptEnabled}
                                        onChange={(e) => setPrintReceiptEnabled(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                                <div>
                                    <span className="block font-bold text-gray-700">Imprimir Comanda</span>
                                    <span className="block text-xs text-gray-500">{printReceiptEnabled ? 'Ativado: Impressão automática.' : 'Desativado: Não será impresso.'}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* --- POS Payment Methods --- */}
                <Card className="p-6 border-l-4 border-l-blue-500 shadow-md mt-6">
                    <div className="flex items-center gap-2 mb-6 border-b pb-4">
                        <Wallet className="text-blue-600" />
                        <h3 className="text-xl font-bold text-gray-800">Meios de Pagamento - PDV (Caixa)</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { id: PaymentMethod.CASH, label: 'Dinheiro' },
                            { id: PaymentMethod.CREDIT_CARD, label: 'Crédito' },
                            { id: PaymentMethod.DEBIT_CARD, label: 'Débito' },
                            { id: PaymentMethod.PIX, label: 'PIX' },
                            { id: PaymentMethod.VOUCHER, label: 'Vale Refeição' },
                            { id: PaymentMethod.ONLINE, label: 'Online' }
                        ].map((m) => {
                            const isActive = activePaymentMethodsPOS.includes(m.id);
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => togglePaymentMethod('POS', m.id)}
                                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${isActive
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                                            : 'border-gray-200 bg-gray-50 text-gray-400 grayscale'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-blue-500' : 'border-gray-300'}`}>
                                        {isActive && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                    </div>
                                    <span className="font-bold text-sm">{m.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </Card>

                {/* --- Kiosk Payment Methods --- */}
                <Card className="p-6 border-l-4 border-l-green-500 shadow-md mt-6">
                    <div className="flex items-center gap-2 mb-6 border-b pb-4">
                        <Monitor className="text-green-600" />
                        <h3 className="text-xl font-bold text-gray-800">Meios de Pagamento - Totem</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { id: PaymentMethod.CASH, label: 'Dinheiro (No Caixa)' },
                            { id: PaymentMethod.CREDIT_CARD, label: 'Crédito' },
                            { id: PaymentMethod.DEBIT_CARD, label: 'Débito' },
                            { id: PaymentMethod.PIX, label: 'PIX' },
                            { id: PaymentMethod.VOUCHER, label: 'Vale Refeição' },
                            { id: PaymentMethod.ONLINE, label: 'Online' }
                        ].map((m) => {
                            const isActive = activePaymentMethodsKiosk.includes(m.id);
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => togglePaymentMethod('KIOSK', m.id)}
                                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${isActive
                                            ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                                            : 'border-gray-200 bg-gray-50 text-gray-400 grayscale'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-green-500' : 'border-gray-300'}`}>
                                        {isActive && <div className="w-2 h-2 rounded-full bg-green-500" />}
                                    </div>
                                    <span className="font-bold text-sm text-center">{m.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {/* SECTION 3: System Maintenance */}
            <div>
                <div className="border-b border-gray-200 pb-4 mt-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Manutenção do Sistema</h2>
                    <p className="text-gray-500 mt-1">Ferramentas de administração e limpeza de dados.</p>
                </div>

                <Card className="p-6 border-l-4 border-l-red-600 shadow-md">
                    <div className="flex items-center gap-2 mb-6 border-b pb-4">
                        <Database className="text-red-600" />
                        <h3 className="text-xl font-bold text-gray-800">Reset de Banco de Dados</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex gap-3">
                            <AlertTriangle className="text-red-600 shrink-0" />
                            <div>
                                <h4 className="font-bold text-red-800">Zona de Perigo</h4>
                                <p className="text-sm text-red-700 mt-1">
                                    Estas ações são irreversíveis. Certifique-se de que você tem backups ou que os dados podem ser perdidos.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-bold text-gray-800 mb-2">Limpeza Operacional</h4>
                                <p className="text-sm text-gray-500 mb-4">
                                    Remove todos os pedidos, turnos, sessões de caixa e logs de estoque. Mantém produtos, ingredientes, usuários e configurações.
                                    Ideal para iniciar um novo dia ou período de testes.
                                </p>
                                <Button
                                    variant="secondary"
                                    className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                                    onClick={async () => {
                                        if (confirm("ATENÇÃO: Isso apagará todo o histórico de vendas e caixas.\n\nDeseja continuar?")) {
                                            try {
                                                await resetDatabase(true);
                                                alert("Dados operacionais limpos com sucesso.");
                                            } catch (e) {
                                                alert("Erro ao limpar dados: " + e);
                                            }
                                        }
                                    }}
                                >
                                    <Trash2 size={16} className="mr-2" /> Limpar Vendas e Turnos
                                </Button>
                            </div>

                            <div className="border-l pl-6 border-gray-200">
                                <h4 className="font-bold text-gray-800 mb-2">Reset de Fábrica (Completo)</h4>
                                <p className="text-sm text-gray-500 mb-4">
                                    APAGA TUDO. Incluindo cardápio, estoque, usuários e promoções. O sistema voltará ao estado inicial (com dados de exemplo se configurado).
                                </p>
                                <Button
                                    className="w-full bg-red-600 hover:bg-red-700 text-white shadow-red-200"
                                    onClick={async () => {
                                        const confirm1 = confirm("PERIGO: ISSO APAGARÁ TODO O BANCO DE DADOS, INCLUINDO CARDÁPIO E USUÁRIOS.\n\nEsta ação não pode ser desfeita.");
                                        if (confirm1) {
                                            const confirm2 = confirm("Tem certeza absoluta? Você precisará reconfigurar toda a loja.");
                                            if (confirm2) {
                                                try {
                                                    await resetDatabase(false);
                                                    alert("Banco de dados resetado completamente.");
                                                    window.location.reload();
                                                } catch (e) {
                                                    alert("Erro ao resetar banco: " + e);
                                                }
                                            }
                                        }
                                    }}
                                >
                                    <AlertTriangle size={16} className="mr-2" /> FORMATAR SISTEMA
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- Dashboard View (Stats) ---
const DashboardView = ({ onNavigate }: { onNavigate: (tab: AdminTab) => void }) => {
    const { orders, products, stockLogs, ingredients } = useStore();
    const totalSales = React.useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders]);
    const totalDiscounts = React.useMemo(() => orders.reduce((sum, o) => sum + (o.discount || 0), 0), [orders]);

    // Calculate simple COGS (Cost of Goods Sold) estimate based on stock logs type 'SALE'
    const estimatedCost = stockLogs
        .filter(l => l.type === 'SALE')
        .reduce((sum, log) => {
            const ingredient = ingredients.find(i => i.id === log.ingredient_id);
            const cost = ingredient ? ingredient.cost_per_unit : 0;
            return sum + (Math.abs(log.change) * cost);
        }, 0);

    // Calculate Product Popularity
    const productSales: Record<string, number> = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            productSales[item.id] = (productSales[item.id] || 0) + 1;
        });
    });

    // Sort products by sales
    const sortedProducts = [...products]
        .map(p => ({ ...p, sales: productSales[p.id] || 0 }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

    const maxSales = sortedProducts.length > 0 ? sortedProducts[0].sales : 1;

    return (
        <div className="space-y-8">
            {/* Store Status Control */}
            <StoreControl />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="flex items-center gap-4 border-l-4 border-l-green-500">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full"><DollarSign /></div>
                    <div>
                        <div className="text-sm text-gray-500">Vendas Líquidas</div>
                        <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 border-l-4 border-l-blue-500">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Activity /></div>
                    <div>
                        <div className="text-sm text-gray-500">Pedidos</div>
                        <div className="text-2xl font-bold">{orders.length}</div>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 border-l-4 border-l-orange-500">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-full"><BarChart /></div>
                    <div>
                        <div className="text-sm text-gray-500">Ticket Médio</div>
                        <div className="text-2xl font-bold">{formatCurrency(orders.length ? totalSales / orders.length : 0)}</div>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 border-l-4 border-l-purple-500">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><Package /></div>
                    <div>
                        <div className="text-sm text-gray-500">Margem Est.</div>
                        <div className="text-2xl font-bold">{(totalSales > 0 ? ((totalSales - estimatedCost) / totalSales * 100).toFixed(1) : 0)}%</div>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 border-l-4 border-l-pink-500">
                    <div className="p-3 bg-pink-100 text-pink-600 rounded-full"><Percent /></div>
                    <div>
                        <div className="text-sm text-gray-500">Descontos</div>
                        <div className="text-2xl font-bold">{formatCurrency(totalDiscounts)}</div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Pedidos Recentes</h3>
                        <Button variant="secondary" className="py-1 text-sm" onClick={() => onNavigate('ORDERS')}>Ver Todos</Button>
                    </div>
                    <div className="space-y-4">
                        {orders.slice(-5).reverse().map(o => (
                            <div key={o.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                                <div>
                                    <div className="font-bold">#{o.order_number} <span className="text-gray-400 font-normal">• {o.customer_name}</span></div>
                                    <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleTimeString()}</div>
                                </div>
                                <div className="text-right">
                                    <Badge status={o.status} />
                                    <div className="text-sm font-bold mt-1">{formatCurrency(o.total)}</div>
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && <div className="text-gray-400 text-center py-8">Nenhum pedido hoje.</div>}
                    </div>
                </Card>

                <Card>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Produtos Populares</h3>
                    </div>
                    <div className="space-y-4">
                        {sortedProducts.map(p => (
                            <div key={p.id} className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                                    {p.image && <img src={p.image} className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">{p.name}</div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${(p.sales / maxSales) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="font-bold text-gray-600">
                                    {p.sales} vendidos
                                </div>
                            </div>
                        ))}
                        {sortedProducts.length === 0 && <div className="text-gray-400 text-center py-8">Sem dados de vendas.</div>}
                    </div>
                </Card>
            </div>
        </div>
    );
};