import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Ingredient, Product, PromotionType, User, Station, Promotion, MenuCatalog } from '../../types';
import { generateUUID } from '../../utils';
import { Button, Card, formatCurrency } from '../ui';
import { Edit2, Trash2, Plus, AlertTriangle, Package, Check, X, Calendar, Clock, Target, Layers, Save, ArrowLeft, Zap, TrendingDown, TrendingUp, History, Upload, Image as ImageIcon, FileText, Wallet, Users, Printer } from 'lucide-react';

// --- Inventory Manager ---
export const InventoryManager = () => {
    const { ingredients, stockLogs, updateStock, addIngredient } = useStore();
    
    // Adjust Modal State
    const [adjustingItem, setAdjustingItem] = useState<Ingredient | null>(null);
    const [adjustType, setAdjustType] = useState<'RECEIVE' | 'ADJUST' | 'WASTE'>('ADJUST');
    const [adjustQty, setAdjustQty] = useState('');
    const [adjustNote, setAdjustNote] = useState('');

    // Add Ingredient Modal State
    const [isAddingIngredient, setIsAddingIngredient] = useState(false);
    const [newIngName, setNewIngName] = useState('');
    const [newIngUnit, setNewIngUnit] = useState('un');
    const [newIngCost, setNewIngCost] = useState('');
    const [newIngStock, setNewIngStock] = useState('');

    const openAdjustModal = (item: Ingredient, type: 'RECEIVE' | 'ADJUST' | 'WASTE') => {
        setAdjustingItem(item);
        setAdjustType(type);
        setAdjustQty('');
        setAdjustNote('');
    };

    const handleConfirmAdjust = () => {
        if (!adjustingItem || !adjustQty) return;
        
        let qty = parseFloat(adjustQty);
        if (isNaN(qty) || qty === 0) {
            alert("Quantidade inválida");
            return;
        }

        // Logic enforcement
        if (adjustType === 'WASTE') {
            qty = -Math.abs(qty); // Ensure negative
        } else if (adjustType === 'RECEIVE') {
            qty = Math.abs(qty); // Ensure positive
        }
        // ADJUST allows both positive and negative as typed

        updateStock(adjustingItem.id, qty, adjustType, adjustNote || 'Ajuste Manual');
        setAdjustingItem(null);
    };

    const handleAddIngredient = () => {
        if (!newIngName || !newIngCost) {
            alert("Preencha os campos obrigatórios");
            return;
        }

        const newIngredient: Ingredient = {
            id: generateUUID(),
            name: newIngName,
            unit: newIngUnit,
            cost_per_unit: parseFloat(newIngCost),
            current_stock: parseFloat(newIngStock) || 0,
            min_stock: 10,
            supplier: 'Fornecedor Geral'
        };

        addIngredient(newIngredient);
        setIsAddingIngredient(false);
        setNewIngName('');
        setNewIngCost('');
        setNewIngStock('');
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">Estoque & Ingredientes</h2>
                <Button onClick={() => setIsAddingIngredient(true)}>
                    <Plus size={16} className="mr-2"/> Novo Ingrediente
                </Button>
            </div>
            
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">Nome</th>
                            <th className="p-4">Fornecedor</th>
                            <th className="p-4">Custo/Unid</th>
                            <th className="p-4">Nível Estoque</th>
                            <th className="p-4">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ingredients.map(ing => {
                            const isLow = ing.current_stock <= ing.min_stock;
                            return (
                                <tr key={ing.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-4 font-medium">
                                        {ing.name}
                                        {isLow && <span className="block text-xs text-red-500 font-bold mt-1">Estoque Baixo!</span>}
                                    </td>
                                    <td className="p-4 text-gray-500">{ing.supplier}</td>
                                    <td className="p-4">{formatCurrency(ing.cost_per_unit)} / {ing.unit}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold text-lg ${isLow ? 'text-red-600' : 'text-green-600'}`}>
                                                {ing.current_stock}
                                            </span>
                                            <span className="text-gray-400 text-sm">{ing.unit}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => openAdjustModal(ing, 'RECEIVE')}
                                                className="px-3 py-1.5 text-xs font-bold bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1 transition-colors"
                                                title="Registrar Entrada"
                                            >
                                                <Plus size={12} /> Entrada
                                            </button>
                                            <button 
                                                onClick={() => openAdjustModal(ing, 'ADJUST')}
                                                className="px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1 transition-colors"
                                                title="Ajuste / Correção / Perda"
                                            >
                                                <Edit2 size={12} /> Ajuste
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Stock History */}
            <div className="mt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
                    <History size={20} /> Histórico de Movimentações Recentes
                </h3>
                <div className="bg-gray-50 rounded-lg border p-4 max-h-64 overflow-y-auto">
                    {stockLogs.length === 0 ? (
                        <p className="text-gray-400 text-center italic">Nenhuma movimentação registrada.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 border-b border-gray-200">
                                    <th className="pb-2 text-left">Data/Hora</th>
                                    <th className="pb-2 text-left">Item</th>
                                    <th className="pb-2 text-left">Tipo</th>
                                    <th className="pb-2 text-right">Qtd</th>
                                    <th className="pb-2 text-right">Nota</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockLogs.slice().reverse().map(log => {
                                    const ingName = ingredients.find(i => i.id === log.ingredient_id)?.name || 'Item Removido';
                                    return (
                                        <tr key={log.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-100">
                                            <td className="py-2 text-gray-500">{new Date(log.date).toLocaleString()}</td>
                                            <td className="py-2 font-medium">{ingName}</td>
                                            <td className="py-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                    log.type === 'RECEIVE' ? 'bg-green-100 text-green-700' :
                                                    log.type === 'WASTE' ? 'bg-red-100 text-red-700' :
                                                    log.type === 'SALE' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-200 text-gray-700'
                                                }`}>
                                                    {log.type}
                                                </span>
                                            </td>
                                            <td className={`py-2 text-right font-mono ${log.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {log.change > 0 ? '+' : ''}{log.change}
                                            </td>
                                            <td className="py-2 text-right text-gray-500 italic max-w-[150px] truncate">{log.notes}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Adjust Stock Modal */}
            {adjustingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Movimentar Estoque</h3>
                                <p className="text-sm text-gray-500">{adjustingItem.name}</p>
                            </div>
                            <button onClick={() => setAdjustingItem(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Tabs */}
                            <div className="grid grid-cols-3 bg-gray-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setAdjustType('RECEIVE')}
                                    className={`py-2 text-sm font-bold rounded-md transition-all ${adjustType === 'RECEIVE' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Entrada
                                </button>
                                <button 
                                    onClick={() => setAdjustType('ADJUST')}
                                    className={`py-2 text-sm font-bold rounded-md transition-all ${adjustType === 'ADJUST' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Correção
                                </button>
                                <button 
                                    onClick={() => setAdjustType('WASTE')}
                                    className={`py-2 text-sm font-bold rounded-md transition-all ${adjustType === 'WASTE' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Perda/Quebra
                                </button>
                            </div>

                            {/* Dynamic Icon & Context */}
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                                    adjustType === 'RECEIVE' ? 'bg-green-100 text-green-600' :
                                    adjustType === 'WASTE' ? 'bg-red-100 text-red-600' :
                                    'bg-blue-100 text-blue-600'
                                }`}>
                                    {adjustType === 'RECEIVE' && <TrendingUp size={32} />}
                                    {adjustType === 'WASTE' && <TrendingDown size={32} />}
                                    {adjustType === 'ADJUST' && <History size={32} />}
                                </div>
                                <p className="text-sm text-gray-600 px-8">
                                    {adjustType === 'RECEIVE' && "Adicionar itens ao estoque provenientes de compras ou fornecedores."}
                                    {adjustType === 'WASTE' && "Registrar itens descartados, vencidos ou impróprios para consumo."}
                                    {adjustType === 'ADJUST' && "Corrigir divergências na contagem física do estoque (Inventário)."}
                                </p>
                            </div>

                            {/* Inputs */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Quantidade ({adjustingItem.unit})
                                    </label>
                                    <input 
                                        type="number" 
                                        autoFocus
                                        value={adjustQty}
                                        onChange={e => setAdjustQty(e.target.value)}
                                        className="w-full border-2 border-gray-200 p-3 rounded-lg text-2xl font-bold focus:border-blue-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Observação / Motivo
                                    </label>
                                    <input 
                                        type="text" 
                                        value={adjustNote}
                                        onChange={e => setAdjustNote(e.target.value)}
                                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder={adjustType === 'RECEIVE' ? "Ex: NF-1234" : "Ex: Contagem mensal"}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex gap-3">
                            <Button variant="secondary" className="flex-1" onClick={() => setAdjustingItem(null)}>Cancelar</Button>
                            <Button 
                                variant={adjustType === 'WASTE' ? 'danger' : adjustType === 'RECEIVE' ? 'success' : 'primary'} 
                                className="flex-1" 
                                onClick={handleConfirmAdjust}
                            >
                                Confirmar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Ingredient Modal */}
            {isAddingIngredient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Cadastrar Ingrediente</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nome do Item</label>
                                <input 
                                    className="w-full border p-2 rounded"
                                    value={newIngName}
                                    onChange={e => setNewIngName(e.target.value)}
                                    placeholder="Ex: Queijo Prato"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Unidade</label>
                                    <select 
                                        className="w-full border p-2 rounded"
                                        value={newIngUnit}
                                        onChange={e => setNewIngUnit(e.target.value)}
                                    >
                                        <option value="un">Unidade</option>
                                        <option value="kg">Quilo (kg)</option>
                                        <option value="g">Grama (g)</option>
                                        <option value="l">Litro (l)</option>
                                        <option value="ml">Mililitro (ml)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Custo Unit.</label>
                                    <input 
                                        type="number"
                                        className="w-full border p-2 rounded"
                                        value={newIngCost}
                                        onChange={e => setNewIngCost(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Estoque Inicial</label>
                                <input 
                                    type="number"
                                    className="w-full border p-2 rounded"
                                    value={newIngStock}
                                    onChange={e => setNewIngStock(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex gap-3">
                            <Button variant="secondary" className="flex-1" onClick={() => setIsAddingIngredient(false)}>Cancelar</Button>
                            <Button variant="primary" className="flex-1" onClick={handleAddIngredient}>Salvar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Product Manager ---
export const ProductManager = () => {
    const { products, deleteProduct, addProduct, updateProduct } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Form State
    const [newProdName, setNewProdName] = useState('');
    const [newProdPrice, setNewProdPrice] = useState('');
    const [newProdCategory, setNewProdCategory] = useState('Lanches');
    const [newProdStation, setNewProdStation] = useState<Station>('GRILL');
    const [newProdImage, setNewProdImage] = useState('');
    const [newProdAvailable, setNewProdAvailable] = useState(true);

    // Derived Categories from existing products
    const categories = Array.from(new Set(['Lanches', 'Bebidas', 'Acomp.', 'Sobremesas', ...products.map(p => p.category)]));

    const handleOpenAddModal = () => {
        setEditingId(null);
        setNewProdName('');
        setNewProdPrice('');
        setNewProdCategory('Lanches');
        setNewProdStation('GRILL');
        setNewProdImage('');
        setNewProdAvailable(true);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (p: Product) => {
        setEditingId(p.id);
        setNewProdName(p.name);
        setNewProdPrice(p.price.toString());
        setNewProdCategory(p.category);
        setNewProdStation(p.station);
        setNewProdImage(p.image || '');
        setNewProdAvailable(p.is_available);
        setIsModalOpen(true);
    };

    const handleSaveProduct = () => {
        if (!newProdName || !newProdPrice) {
            alert("Nome e Preço são obrigatórios");
            return;
        }

        const productData = {
            name: newProdName,
            price: parseFloat(newProdPrice),
            category: newProdCategory,
            station: newProdStation,
            image: newProdImage || `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`,
            is_available: newProdAvailable
        };

        if (editingId) {
            // Edit Mode
            updateProduct(editingId, productData);
        } else {
            // Add Mode
            const newProduct: Product = {
                id: generateUUID(),
                ...productData,
                modifiers: [],
                recipe: []
            };
            addProduct(newProduct);
        }

        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">Produtos do Cardápio</h2>
                <Button onClick={handleOpenAddModal}>
                    <Plus size={16} className="mr-2"/> Novo Produto
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => (
                    <Card key={p.id} className="flex gap-4 group">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            {p.image && <img src={p.image} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold">{p.name}</h3>
                                <span className={`text-xs px-2 py-1 rounded ${p.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {p.is_available ? 'Ativo' : 'Oculto'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">{p.category} • {p.station}</p>
                            <p className="font-bold text-red-600 mt-1">{formatCurrency(p.price)}</p>
                            
                            <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleOpenEditModal(p)}
                                    className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                    <Edit2 size={12}/> Editar
                                </button>
                                <button 
                                    onClick={() => deleteProduct(p.id)}
                                    className="text-xs flex items-center gap-1 text-red-600 hover:underline"
                                >
                                    <Trash2 size={12}/> Excluir
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Add/Edit Product Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nome do Produto</label>
                                <input 
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newProdName}
                                    onChange={e => setNewProdName(e.target.value)}
                                    placeholder="Ex: Mega Burger"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Preço (R$)</label>
                                    <input 
                                        type="number"
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newProdPrice}
                                        onChange={e => setNewProdPrice(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Categoria</label>
                                    <input 
                                        list="admin-categories"
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newProdCategory}
                                        onChange={e => setNewProdCategory(e.target.value)}
                                    />
                                    <datalist id="admin-categories">
                                        {categories.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Estação de Preparo</label>
                                <select 
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={newProdStation}
                                    onChange={e => setNewProdStation(e.target.value as Station)}
                                >
                                    <option value="GRILL">GRILL (Chapa)</option>
                                    <option value="FRYER">FRYER (Fritadeira)</option>
                                    <option value="DRINKS">DRINKS (Bebidas)</option>
                                    <option value="ASSEMBLY">ASSEMBLY (Montagem)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">URL da Imagem (Opcional)</label>
                                <div className="flex gap-2">
                                    <input 
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        value={newProdImage}
                                        onChange={e => setNewProdImage(e.target.value)}
                                        placeholder="https://..."
                                    />
                                    <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center shrink-0">
                                        {newProdImage ? <img src={newProdImage} className="w-full h-full object-cover rounded" /> : <ImageIcon size={16} className="text-gray-400"/>}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={newProdAvailable}
                                        onChange={e => setNewProdAvailable(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                                <div>
                                    <span className="block text-sm font-bold text-gray-800">Produto Ativo</span>
                                    <span className="block text-xs text-gray-500">Se desativado, não aparecerá no cardápio</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex gap-3">
                            <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button variant="primary" className="flex-1" onClick={handleSaveProduct}>
                                {editingId ? 'Salvar Alterações' : 'Criar Produto'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Promotion Builder (Visual) ---
const PromotionBuilder = ({ 
    products, 
    categories, 
    initialData,
    onSave, 
    onCancel 
}: { 
    products: Product[], 
    categories: string[], 
    initialData?: Promotion,
    onSave: (p: Promotion) => void, 
    onCancel: () => void 
}) => {
    // Local state for the form
    const [form, setForm] = useState<Partial<Promotion>>(initialData || {
        name: 'Nova Promoção',
        type: PromotionType.FIXED_PRICE_BUNDLE,
        value: 0,
        priority: 1,
        rules: { min_quantity: 1 },
        valid_days: [0, 1, 2, 3, 4, 5, 6],
        channels: ['POS', 'KIOSK', 'DELIVERY'],
        valid_hours_start: '00:00',
        valid_hours_end: '23:59'
    });

    const updateForm = (key: keyof Promotion, val: any) => setForm(prev => ({ ...prev, [key]: val }));
    const updateRule = (key: string, val: any) => setForm(prev => ({ ...prev, rules: { ...prev.rules!, [key]: val } }));

    const handleSave = () => {
        if (!form.name || form.value === undefined) return alert("Por favor preencha nome e valor");
        // Preserve ID if editing, otherwise generate new
        onSave({ ...form, id: form.id || generateUUID() } as Promotion);
    };

    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-4 border-b pb-4">
                <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={24}/></button>
                <h2 className="text-2xl font-bold">Criar Promoção</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Configuration */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* 1. Basic Info */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-gray-800">
                                <Zap className="text-yellow-500"/> <h3 className="font-bold text-lg">Lógica e Tipo</h3>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-lg border">
                                <input 
                                    type="checkbox" 
                                    checked={form.rules?.active !== false} 
                                    onChange={(e) => updateRule('active', e.target.checked)}
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Promoção Ativa</span>
                            </label>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nome Interno</label>
                                <input 
                                    className="w-full border p-2 rounded" 
                                    value={form.name} 
                                    onChange={e => updateForm('name', e.target.value)}
                                    placeholder="ex: Combo Verão"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { id: PromotionType.FIXED_PRICE_BUNDLE, label: 'Preço Fixo', icon: '🎁' },
                                    { id: PromotionType.PERCENTAGE_OFF, label: '% Desconto', icon: '✂️' },
                                    { id: PromotionType.BOGO, label: 'Leve+ Pague-', icon: '👯' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => updateForm('type', t.id)}
                                        className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                                            form.type === t.id ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                    >
                                        <span className="text-2xl">{t.icon}</span>
                                        <span className="font-bold text-sm">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-1">
                                        {form.type === PromotionType.PERCENTAGE_OFF ? 'Desconto (0.1 = 10%)' : 'Valor (R$)'}
                                    </label>
                                    <input 
                                        type="number" 
                                        className="w-full border p-2 rounded font-mono text-lg font-bold" 
                                        value={form.value} 
                                        onChange={e => updateForm('value', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-sm font-medium mb-1">Prioridade</label>
                                    <input 
                                        type="number" 
                                        className="w-full border p-2 rounded" 
                                        value={form.priority} 
                                        onChange={e => updateForm('priority', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* 2. Targeting */}
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-4 text-gray-800">
                            <Target className="text-red-500"/> <h3 className="font-bold text-lg">Regras de Alvo</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Aplicar na Categoria</label>
                                <select 
                                    className="w-full border p-2 rounded"
                                    value={form.rules?.category_id || ''}
                                    onChange={e => {
                                        updateRule('category_id', e.target.value);
                                        updateRule('product_id', undefined);
                                    }}
                                >
                                    <option value="">-- Qualquer / Nenhum --</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Ou Produto Específico</label>
                                <select 
                                    className="w-full border p-2 rounded"
                                    value={form.rules?.product_id || ''}
                                    onChange={e => {
                                        updateRule('product_id', e.target.value);
                                        updateRule('category_id', undefined);
                                    }}
                                >
                                    <option value="">-- Qualquer / Nenhum --</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Qtd Mínima</label>
                                <input 
                                    type="number" 
                                    className="w-full border p-2 rounded" 
                                    value={form.rules?.min_quantity} 
                                    onChange={e => updateRule('min_quantity', parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* 3. Constraints */}
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-4 text-gray-800">
                            <Calendar className="text-blue-500"/> <h3 className="font-bold text-lg">Disponibilidade</h3>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Dias Válidos</label>
                            <div className="flex gap-2">
                                {days.map((d, i) => {
                                    const isActive = form.valid_days?.includes(i);
                                    return (
                                        <button
                                            key={d}
                                            onClick={() => {
                                                const newDays = isActive 
                                                    ? form.valid_days?.filter(x => x !== i) 
                                                    : [...(form.valid_days || []), i];
                                                updateForm('valid_days', newDays);
                                            }}
                                            className={`flex-1 py-2 rounded text-sm font-bold ${
                                                isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                                            }`}
                                        >
                                            {d}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Hora Início</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                                    <input 
                                        type="time" 
                                        className="w-full border p-2 pl-10 rounded" 
                                        value={form.valid_hours_start} 
                                        onChange={e => updateForm('valid_hours_start', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Hora Fim</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                                    <input 
                                        type="time" 
                                        className="w-full border p-2 pl-10 rounded" 
                                        value={form.valid_hours_end} 
                                        onChange={e => updateForm('valid_hours_end', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Canais</label>
                            <div className="flex gap-3">
                                {(['POS', 'KIOSK', 'DELIVERY'] as const).map(c => (
                                    <label key={c} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded border hover:bg-gray-100">
                                        <input 
                                            type="checkbox" 
                                            checked={form.channels?.includes(c) ?? false} 
                                            onChange={e => {
                                                const currentChannels = form.channels || [];
                                                const newCh = e.target.checked 
                                                    ? [...currentChannels, c] 
                                                    : currentChannels.filter((x) => x !== c);
                                                updateForm('channels', newCh);
                                            }}
                                        />
                                        <span className="text-sm font-bold text-gray-700">{c}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Preview & Action */}
                <div className="space-y-6">
                    <div className="sticky top-6">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Prévia</h3>
                        <Card className="border-l-4 border-l-purple-500 shadow-xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{form.name}</h3>
                                    <div className="text-sm text-gray-500 mt-2 space-y-1">
                                        <p className="flex items-center gap-2"><Layers size={14}/> {form.type}</p>
                                        <p className="flex items-center gap-2"><Target size={14}/> {form.rules?.category_id || form.rules?.product_id || 'Todos Itens'}</p>
                                        <p className="flex items-center gap-2"><Clock size={14}/> {form.valid_hours_start} - {form.valid_hours_end}</p>
                                    </div>
                                    <div className="flex gap-1 mt-3">
                                        {form.channels?.map(c => <span key={c} className="text-[10px] bg-gray-100 border px-1 rounded text-gray-600">{c}</span>)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-purple-600">
                                        {form.type === PromotionType.FIXED_PRICE_BUNDLE ? formatCurrency(form.value || 0) : `-${(form.value || 0) * 100}%`}
                                    </div>
                                    <span className="text-xs text-gray-400">Valor</span>
                                </div>
                            </div>
                        </Card>

                        <div className="mt-8 space-y-3">
                            <Button onClick={handleSave} className="w-full py-4 text-lg bg-green-600 hover:bg-green-700 shadow-green-200">
                                <Save size={20} className="inline mr-2"/> Salvar Promoção
                            </Button>
                            <Button onClick={onCancel} variant="secondary" className="w-full">
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Menu Catalog Manager ---
export const MenuCatalogManager = () => {
    const { menuCatalogs, addMenuCatalog, updateMenuCatalog, deleteMenuCatalog } = useStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [observations, setObservations] = useState('');
    const [isActive, setIsActive] = useState(true);

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setObservations('');
        setIsActive(true);
    };

    const handleOpenAdd = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (menu: MenuCatalog) => {
        setEditingId(menu.id);
        setName(menu.name);
        setObservations(menu.observations || menu.description || '');
        setIsActive(menu.is_active);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!name.trim()) {
            alert('Informe o nome do cardápio.');
            return;
        }
        if (editingId) {
            updateMenuCatalog(editingId, {
                name: name.trim(),
                observations: observations.trim() || undefined,
                description: observations.trim() || undefined,
                is_active: isActive
            });
        } else {
            addMenuCatalog({
                name: name.trim(),
                observations: observations.trim() || undefined,
                description: observations.trim() || undefined,
                is_active: isActive
            });
        }
        setIsModalOpen(false);
        resetForm();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Administração de Cardápios</h2>
                    <p className="text-sm text-gray-500">Crie os nomes de cardápio para uso no fechamento de caixa em "Cardápio do Lanche".</p>
                </div>
                <Button onClick={handleOpenAdd}>
                    <Plus size={16} className="mr-2" /> Novo Cardápio
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">Nome</th>
                            <th className="p-4">Observações</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {menuCatalogs.map((menu) => (
                            <tr key={menu.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4 font-bold text-gray-800">{menu.name}</td>
                                <td className="p-4 text-gray-500">{menu.observations || menu.description || '-'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${menu.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {menu.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenEdit(menu)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(`Excluir o cardápio "${menu.name}"?`)) {
                                                    deleteMenuCatalog(menu.id);
                                                }
                                            }}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {menuCatalogs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    Nenhum cardápio cadastrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Cardápio' : 'Novo Cardápio'}</h3>
                                <p className="text-sm text-gray-500">Esse cadastro será usado no campo "Cardápio do Lanche" do fechamento de caixa.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nome do Cardápio</label>
                                    <input
                                        type="text"
                                        className="w-full border p-2 rounded"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ex: Cardápio Festa Junina"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Observações</label>
                                    <textarea
                                        className="w-full border p-2 rounded min-h-[100px]"
                                        value={observations}
                                        onChange={(e) => setObservations(e.target.value)}
                                        placeholder="Opcional"
                                    />
                                </div>

                                <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                    />
                                    Cardápio ativo
                                </label>
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex gap-3">
                            <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button className="flex-1" onClick={handleSave}>
                                <Save size={16} className="mr-2" /> Salvar Cardápio
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Terminal Manager ---
export const TerminalManager = () => {
    const { terminals, addTerminal, updateTerminal, deleteTerminal } = useStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [observations, setObservations] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [operationDate, setOperationDate] = useState('');

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setObservations('');
        setIsActive(true);
        setOperationDate('');
    };

    const handleOpenAdd = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (terminal: { id: string; name: string; operation_date: string; observations?: string; is_active?: boolean }) => {
        setEditingId(terminal.id);
        setName(terminal.name);
        setObservations(terminal.observations || '');
        setIsActive(terminal.is_active ?? true);
        setOperationDate(terminal.operation_date);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!name.trim()) {
            alert('Informe o nome do terminal.');
            return;
        }
        if (!operationDate) {
            alert('Informe a data prevista da operação.');
            return;
        }

        if (editingId) {
            updateTerminal(editingId, {
                name: name.trim(),
                observations: observations.trim() || undefined,
                is_active: isActive,
                operation_date: operationDate
            });
        } else {
            addTerminal({
                name: name.trim(),
                observations: observations.trim() || undefined,
                is_active: isActive,
                operation_date: operationDate
            });
        }

        setIsModalOpen(false);
        resetForm();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Cadastro de Terminais (ID)</h2>
                    <p className="text-sm text-gray-500">Cadastre os terminais com nome de operação e data prevista.</p>
                </div>
                <Button onClick={handleOpenAdd}>
                    <Plus size={16} className="mr-2" /> Novo Terminal
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">Nome do Terminal</th>
                            <th className="p-4">Observações</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Data Prevista da Operação</th>
                            <th className="p-4">Última Atualização</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {terminals.map((terminal) => (
                            <tr key={terminal.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4 font-bold text-gray-800">{terminal.name}</td>
                                <td className="p-4 text-gray-500">{terminal.observations || '-'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${terminal.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {terminal.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-700">{new Date(`${terminal.operation_date}T00:00:00`).toLocaleDateString('pt-BR')}</td>
                                <td className="p-4 text-gray-500 text-sm">{new Date(terminal.updated_at).toLocaleString('pt-BR')}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenEdit(terminal)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(`Excluir o terminal "${terminal.name}"?`)) {
                                                    deleteTerminal(terminal.id);
                                                }
                                            }}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {terminals.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    Nenhum terminal cadastrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Terminal' : 'Novo Terminal'}</h3>
                                <p className="text-sm text-gray-500">Informe nome do terminal e data prevista da operação.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nome do Terminal</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: PDV-01"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Observações</label>
                                <textarea
                                    className="w-full border p-2 rounded min-h-[90px]"
                                    value={observations}
                                    onChange={(e) => setObservations(e.target.value)}
                                    placeholder="Opcional"
                                />
                            </div>
                            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                Terminal ativo
                            </label>
                            <div>
                                <label className="block text-sm font-medium mb-1">Data prevista da operação</label>
                                <input
                                    type="date"
                                    className="w-full border p-2 rounded"
                                    value={operationDate}
                                    onChange={(e) => setOperationDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex gap-3">
                            <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button className="flex-1" onClick={handleSave}>
                                <Save size={16} className="mr-2" /> Salvar Terminal
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Promotion Manager (Main Switcher) ---
export const PromotionManager = () => {
    const { promotions, products, addPromotion, updatePromotion, deletePromotion } = useStore();
    const [view, setView] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
    const [editingPromo, setEditingPromo] = useState<Promotion | undefined>(undefined);

    // Derived Categories
    const categories: string[] = Array.from(new Set(products.map(p => p.category)));

    const handleEdit = (p: Promotion, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingPromo(p);
        setView('EDIT');
    };

    const handleToggleActive = (promo: Promotion, e: React.MouseEvent) => {
        e.stopPropagation();
        const isActive = promo.rules.active !== false; // default true
        const updatedPromo = {
            ...promo,
            rules: {
                ...promo.rules,
                active: !isActive
            }
        };
        updatePromotion(promo.id, updatedPromo);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Tem certeza que deseja excluir esta promoção?")) {
            deletePromotion(id);
        }
    };

    if (view === 'CREATE' || view === 'EDIT') {
        return (
            <PromotionBuilder 
                products={products}
                categories={categories}
                initialData={editingPromo}
                onSave={(p) => {
                    if (view === 'EDIT') {
                        updatePromotion(p.id, p);
                    } else {
                        addPromotion(p);
                    }
                    setView('LIST');
                    setEditingPromo(undefined);
                }}
                onCancel={() => {
                    setView('LIST');
                    setEditingPromo(undefined);
                }}
            />
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">Motor de Promoções</h2>
                <Button onClick={() => { setEditingPromo(undefined); setView('CREATE'); }}>
                    <Plus size={16} className="mr-2"/> Nova Regra
                </Button>
            </div>

            <div className="space-y-4">
                {promotions.map(promo => {
                    const isActive = promo.rules.active !== false;
                    return (
                    <Card key={promo.id} className={`relative overflow-hidden border-l-4 group hover:shadow-md transition-shadow ${isActive ? 'border-l-purple-500' : 'border-l-gray-300 opacity-75'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h3 className={`text-xl font-bold ${isActive ? 'text-gray-800' : 'text-gray-500 line-through'}`}>{promo.name}</h3>
                                    <button 
                                        onClick={(e) => handleToggleActive(promo, e)}
                                        className={`px-2 py-1 text-xs font-bold rounded-full transition-colors ${isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                        title={isActive ? "Clique para desativar" : "Clique para ativar"}
                                    >
                                        {isActive ? 'ATIVO' : 'INATIVO'}
                                    </button>
                                </div>
                                <div className="text-sm text-gray-500 mt-1 space-y-1">
                                    <p className="flex items-center gap-1"><Layers size={14}/> {promo.type}</p>
                                    <p className="flex items-center gap-1"><Zap size={14} className="text-yellow-500"/> Prioridade: {promo.priority}</p>
                                    {promo.rules.category_id && <p className="bg-gray-100 inline-block px-1 rounded">Categoria: {promo.rules.category_id}</p>}
                                    {promo.rules.min_quantity > 0 && <p className="bg-gray-100 inline-block px-1 rounded ml-2">Qtd Mín: {promo.rules.min_quantity}</p>}
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <div className="text-2xl font-bold text-purple-600">
                                    {promo.type === PromotionType.FIXED_PRICE_BUNDLE ? formatCurrency(promo.value) : `-${promo.value * 100}%`}
                                </div>
                                <div className="flex gap-1">
                                    {promo.channels?.map(c => <span key={c} className="text-xs border px-1 rounded bg-gray-50">{c}</span>)}
                                </div>
                                <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => handleEdit(promo, e)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDelete(promo.id, e)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>
                    );
                })}
            </div>
        </div>
    );
};

// --- UserManager ---
export const UserManager = () => {
    const { dbUsers, addDbUser, updateDbUser, deleteDbUser } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [role, setRole] = useState<User['role']>('CASHIER');
    const [pin, setPin] = useState('');

    const handleOpenAdd = () => {
        setEditingId(null);
        setName('');
        setRole('CASHIER');
        setPin('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (u: User) => {
        setEditingId(u.id);
        setName(u.name);
        setRole(u.role);
        setPin(u.pin || '');
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!name || !pin || pin.length !== 4) {
            alert("Nome obrigatório e PIN deve ter 4 dígitos");
            return;
        }

        if (editingId) {
            updateDbUser(editingId, { name, role, pin });
        } else {
            addDbUser({
                id: generateUUID(),
                name,
                role,
                pin
            });
        }
        setIsModalOpen(false);
    };

    const handleDelete = (u: User) => {
        if (confirm(`Tem certeza que deseja excluir ${u.name}?`)) {
            deleteDbUser(u.id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">Equipe & Permissões (Banco de Dados)</h2>
                <Button onClick={handleOpenAdd}><Plus size={16} className="mr-2"/> Novo Usuário</Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">Nome</th>
                            <th className="p-4">Cargo</th>
                            <th className="p-4">Nível de Acesso</th>
                            <th className="p-4">PIN</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dbUsers.map(u => (
                            <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50 group">
                                <td className="p-4 font-bold">{u.name}</td>
                                <td className="p-4">
                                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                        u.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {u.role === 'ADMIN' ? 'ADMIN' : u.role === 'MANAGER' ? 'GERENTE' : u.role === 'CASHIER' ? 'CAIXA' : 'COZINHA'}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    {u.role === 'ADMIN' && 'Acesso Total'}
                                    {u.role === 'MANAGER' && 'PDV, Relatórios, Autorizações'}
                                    {u.role === 'CASHIER' && 'Apenas Vendas'}
                                    {u.role === 'KITCHEN' && 'Apenas KDS'}
                                </td>
                                <td className="p-4 font-mono text-gray-400 group-hover:text-gray-800 transition-colors">
                                    {u.role === 'ADMIN' ? '****' : (u.pin || '----')}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleOpenEdit(u)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        {u.role !== 'ADMIN' && (
                                            <button 
                                                onClick={() => handleDelete(u)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nome Completo</label>
                                <input 
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Ex: Maria Silva"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Cargo / Função</label>
                                <select 
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={role}
                                    onChange={e => setRole(e.target.value as User['role'])}
                                >
                                    <option value="CASHIER">Operador de Caixa (PDV)</option>
                                    <option value="MANAGER">Gerente de Loja</option>
                                    <option value="KITCHEN">Cozinha / Produção</option>
                                    <option value="ADMIN">Administrador (Total)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">PIN de Acesso (4 dígitos)</label>
                                <input 
                                    type="text"
                                    maxLength={4}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center tracking-widest text-lg"
                                    value={pin}
                                    onChange={e => setPin(e.target.value.replace(/\D/g,''))}
                                    placeholder="0000"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex gap-3">
                            <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button variant="primary" className="flex-1" onClick={handleSave}>
                                {editingId ? 'Salvar Alterações' : 'Criar Usuário'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Reports Manager ---
export const ReportsManager = () => {
    const [reportData, setReportData] = useState<{shifts: any[], orders: any[]} | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedShift, setSelectedShift] = useState<any | null>(null);
    const { backend, products, scouts } = useStore();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await backend.fetchReports();
            setReportData(data);
        } catch (e) {
            console.error(e);
            alert("Erro ao carregar relatórios");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Carregando dados...</div>;
    if (!reportData || reportData.shifts.length === 0) return <div className="p-8 text-center text-gray-500">Nenhum registro de caixa encontrado.</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">Relatório de Fechamento de Caixa</h2>
                <Button onClick={loadData} variant="secondary"><History size={16} className="mr-2"/> Atualizar</Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">Data/Hora</th>
                            <th className="p-4">Operador / Terminal (ID)</th>
                            <th className="p-4 text-center">Itens Vendidos</th>
                            <th className="p-4 text-center">Qtd Pedidos</th>
                            <th className="p-4 text-right">Fundo Abertura</th>
                            <th className="p-4 text-right">Faturamento</th>
                            <th className="p-4 text-right">Movimentações</th>
                            <th className="p-4 text-right">Saldo Final</th>
                            <th className="p-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.shifts.map((shift, index) => {
                            const shiftOrders = reportData.orders.filter(o => o.shift_id === shift.id);
                            
                            // Calculate total items sold and details by product
                            const productStats: Record<string, { name: string, count: number, promoCount: number }> = {};
                            let productCount = 0;

                            shiftOrders.forEach(o => {
                                if (o.status === 'CANCELLED') return;
                                const items = Array.isArray(o.items) 
                                    ? o.items 
                                    : typeof o.items === 'string' 
                                        ? JSON.parse(o.items) 
                                        : [];
                                
                                items.forEach((i: any) => {
                                    const qty = i.quantity || 1;
                                    const isPromo = i.price < (products.find((p: any) => p.id === i.id)?.price || 0) || i.price === 0; // Simple heuristic for promo: if price is lower than base price or 0
                                    
                                    productCount += qty;
                                    if (!productStats[i.id]) {
                                        productStats[i.id] = { name: i.name, count: 0, promoCount: 0 };
                                    }
                                    productStats[i.id].count += qty;
                                    
                                    // If we can determine it was sold via promotion, we add to promoCount
                                    // A more robust way would be if CartItem had a 'promotion_id' field, but we can check if it has a discount applied or price altered
                                    // For now, let's look at the order's overall discount or if the item itself has a lower price.
                                    // Another way is to check if 'isPromo' is passed. Since we don't have item-level promo flags easily accessible here without complex matching, 
                                    // let's use a simpler approach: if the item's recorded price is less than its catalog price, it was discounted.
                                    
                                    // Actually, looking at the code, promotions are applied at the Cart level and the discount is stored on the Order.
                                    // But we need item level. Let's see if we can deduce it.
                                    // If the order has a discount, we can assume some items were promotional.
                                    // To be accurate, we'd need to know exactly which items triggered the promo.
                                    // Since we don't have that, maybe we just count items in orders that had a discount?
                                    // Or better, let's assume if there's a discount, the whole order is part of a promo.
                                    if (o.discount && o.discount > 0) {
                                        productStats[i.id].promoCount += qty;
                                    }
                                });
                            });
                            
                            // Calculate total orders (not cancelled)
                            const orderCount = shiftOrders.filter(o => o.status !== 'CANCELLED').length;

                            // Calculate totals by payment method from Orders (Count and Value)
                            const paymentStats = shiftOrders.reduce((acc: any, o: any) => {
                                if (o.status === 'CANCELLED') return acc;
                                
                                if (!acc[o.payment_method]) {
                                    acc[o.payment_method] = { count: 0, total: 0 };
                                }
                                
                                acc[o.payment_method].count += 1;
                                acc[o.payment_method].total += o.total;
                                
                                return acc;
                            }, {});

                            const totalRevenue = Object.values(paymentStats).reduce((a: any, b: any) => a + b.total, 0) as number;
                            
                            // Calculate Refunds & Drops from Shift Transactions
                            // Ensure transactions is an array (it might be JSON in Supabase response)
                            const transactions = Array.isArray(shift.transactions) 
                                ? shift.transactions 
                                : typeof shift.transactions === 'string' 
                                    ? JSON.parse(shift.transactions) 
                                    : [];

                            const refunds = transactions
                                .filter((t: any) => t.type === 'REIMBURSEMENT')
                                .reduce((acc: number, t: any) => acc + t.amount, 0);

                            const drops = transactions
                                .filter((t: any) => t.type === 'DROP')
                                .reduce((acc: number, t: any) => acc + t.amount, 0);

                            const entries = transactions
                                .filter((t: any) => t.type === 'ADD')
                                .reduce((acc: number, t: any) => acc + t.amount, 0);
                                
                            // O Saldo Final Real deve ser = Fundo Inicial + Faturamento - Sangrias - Reembolsos + Suprimentos
                            const calculatedFinalCash = shift.start_cash + totalRevenue - drops - refunds + entries;
                            const isLastRows = index >= reportData.shifts.length - 2;

                            return (
                                <tr key={shift.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800">{new Date(shift.opened_at).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500">Início: {new Date(shift.opened_at).toLocaleTimeString().slice(0, 5)}</div>
                                        {shift.closed_at && (
                                            <div className="text-xs text-gray-500">Fim: {new Date(shift.closed_at).toLocaleTimeString().slice(0, 5)}</div>
                                        )}
                                        {shift.status === 'OPEN' && <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded font-bold">ABERTO</span>}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-800">{shift.staff_name}</div>
                                        <div className="text-xs text-gray-500 font-mono">{shift.terminal_id || 'Não informado'}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center gap-1 group relative z-10">
                                            <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-xs font-bold cursor-help">
                                                {productCount} un
                                            </span>
                                            {/* Tooltip with product breakdown */}
                                            {Object.keys(productStats).length > 0 && (
                                                <div className={`absolute left-1/2 -translate-x-1/2 w-56 bg-gray-900 text-white p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-left text-xs pointer-events-none ${isLastRows ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                                                    {/* Triangle pointer */}
                                                    <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 ${isLastRows ? '-bottom-1' : '-top-1'}`}></div>
                                                    <div className="font-bold mb-2 pb-1 border-b border-gray-700">Por Produto:</div>
                                                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                                        {Object.values(productStats).sort((a, b) => b.count - a.count).map(p => (
                                                            <div key={p.name} className="flex justify-between gap-2 items-center">
                                                                <span className="truncate">{p.name}</span>
                                                                <div className="flex items-center gap-2">
                                                                    {p.promoCount > 0 && (
                                                                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded" title="Quantidade vendida em promoção">
                                                                            {p.promoCount} promo
                                                                        </span>
                                                                    )}
                                                                    <span className="font-bold text-blue-300 shrink-0">{p.count}x</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="bg-purple-100 text-purple-700 py-1 px-3 rounded-full text-xs font-bold">
                                            {orderCount}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-mono text-gray-600">
                                        {formatCurrency(shift.start_cash)}
                                    </td>
                                    <td className="p-4 text-right font-bold text-green-700">
                                        {formatCurrency(totalRevenue)}
                                    </td>
                                    <td className="p-4 text-right font-mono text-sm">
                                        {entries > 0 && (
                                            <div className="text-green-600 font-bold flex justify-end items-center gap-1">
                                                +{formatCurrency(entries)} <span className="text-[10px] bg-green-100 px-1 rounded uppercase">Suprimento</span>
                                            </div>
                                        )}
                                        {drops > 0 && (
                                            <div className="text-orange-600 font-bold flex justify-end items-center gap-1">
                                                -{formatCurrency(drops)} <span className="text-[10px] bg-orange-100 px-1 rounded uppercase">Sangria</span>
                                            </div>
                                        )}
                                        {refunds > 0 && (
                                            <div className="text-red-600 font-bold flex justify-end items-center gap-1">
                                                -{formatCurrency(refunds)} <span className="text-[10px] bg-red-100 px-1 rounded uppercase">Devolução</span>
                                            </div>
                                        )}
                                        {entries === 0 && drops === 0 && refunds === 0 && <span className="text-gray-300">-</span>}
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-gray-800">
                                        {formatCurrency(calculatedFinalCash)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <Button 
                                            variant="secondary" 
                                            className="text-xs py-1 px-3 border-blue-200 text-blue-700 hover:bg-blue-50 whitespace-nowrap"
                                            onClick={() => setSelectedShift({
                                                shift,
                                                shiftOrders,
                                                productStats,
                                                productCount,
                                                orderCount,
                                                paymentStats,
                                                totalRevenue,
                                                transactions,
                                                refunds,
                                                drops,
                                                entries,
                                                calculatedFinalCash
                                            })}
                                        >
                                            <FileText size={14} className="mr-1 inline" /> Ver Detalhes
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal de Detalhamento do Turno */}
            {selectedShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="p-6 bg-gray-900 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-bold">Relatório Detalhado do Turno</h2>
                                <p className="text-sm text-gray-400">ID: {selectedShift.shift.id}</p>
                            </div>
                            <button onClick={() => setSelectedShift(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50">
                            {/* Cabeçalho do Relatório */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-lg border shadow-sm">
                                <div>
                                    <p className="text-sm text-gray-500 font-bold uppercase mb-1">Operador / Terminal (ID)</p>
                                    <p className="text-lg font-bold text-gray-800">
                                        {selectedShift.shift.staff_name} / {selectedShift.shift.terminal_id || 'Não informado'}
                                    </p>
                                    {selectedShift.shift.closer_name && (
                                        <p className="text-xs text-gray-500 mt-1">Fechado por: <span className="font-semibold">{selectedShift.shift.closer_name}</span></p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-bold uppercase mb-1">Data / Hora de Abertura</p>
                                    <p className="text-lg font-bold text-gray-800">{new Date(selectedShift.shift.opened_at).toLocaleString()}</p>
                                    {selectedShift.shift.menu_name && (
                                        <p className="text-xs text-gray-500 mt-1">Cardápio: <span className="font-semibold text-blue-600">{selectedShift.shift.menu_name}</span></p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Coluna Esquerda: Métricas e Finanças */}
                                <div className="space-y-6">
                                    <div className="bg-white p-5 rounded-lg border shadow-sm">
                                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                            <Wallet size={18} className="text-blue-500"/> Resumo Financeiro
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Total Vendas PIX</span>
                                                <span className="font-bold">{formatCurrency(selectedShift.paymentStats['PIX']?.total || 0)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Total Vendas Dinheiro</span>
                                                <span className="font-bold">{formatCurrency(selectedShift.paymentStats['CASH']?.total || 0)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Total Outros (Cartões)</span>
                                                <span className="font-bold">
                                                    {formatCurrency(
                                                        Object.entries(selectedShift.paymentStats)
                                                            .filter(([k]) => k !== 'PIX' && k !== 'CASH')
                                                            .reduce((acc: number, [_, v]: any) => acc + v.total, 0)
                                                    )}
                                                </span>
                                            </div>
                                            <div className="pt-2 border-t flex justify-between items-center">
                                                <span className="text-gray-600">Fundo de Abertura</span>
                                                <span className="font-bold">{formatCurrency(selectedShift.shift.start_cash)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Movimentações Extras (Sup/Sang/Reemb)</span>
                                                <span className={`font-bold ${selectedShift.entries - selectedShift.drops - selectedShift.refunds >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {selectedShift.entries - selectedShift.drops - selectedShift.refunds >= 0 ? '+' : ''}
                                                    {formatCurrency(selectedShift.entries - selectedShift.drops - selectedShift.refunds)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-lg">
                                                <span className="font-bold text-gray-800">Faturamento</span>
                                                <span className="font-black text-green-600">{formatCurrency(selectedShift.totalRevenue)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-lg">
                                                <span className="font-bold text-gray-800">Saldo Final</span>
                                                <span className="font-black text-blue-600">{formatCurrency(selectedShift.calculatedFinalCash)}</span>
                                            </div>
                                            <div className="pt-2 border-t flex justify-between items-center text-lg">
                                                <span className="font-bold text-gray-800">Lucro Final</span>
                                                <span className="font-black text-purple-600">
                                                    {formatCurrency(selectedShift.calculatedFinalCash - selectedShift.shift.start_cash)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-lg border shadow-sm">
                                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                            <FileText size={18} className="text-red-500"/> Reembolsos Registrados
                                        </h3>
                                        {selectedShift.transactions.filter((t: any) => t.type === 'REIMBURSEMENT').length > 0 ? (
                                            <div className="space-y-3">
                                                {selectedShift.transactions.filter((t: any) => t.type === 'REIMBURSEMENT').map((r: any) => (
                                                    <div key={r.id} className="flex justify-between items-center text-sm p-2 bg-red-50 rounded border border-red-100">
                                                        <div>
                                                            <div className="font-bold text-red-800">{r.payee || 'Não informado'}</div>
                                                            <div className="text-xs text-red-600">{new Date(r.time).toLocaleTimeString()}</div>
                                                        </div>
                                                        <span className="font-bold text-red-700">-{formatCurrency(r.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">Nenhum reembolso registrado neste turno.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Coluna Direita: Produção e Estoque */}
                                <div className="space-y-6">
                                    <div className="bg-white p-5 rounded-lg border shadow-sm">
                                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                            <Layers size={18} className="text-orange-500"/> Produção e Estoque
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Litros de Bebida (Saída)</span>
                                                <span className="font-bold">{selectedShift.shift.drinks_liters ?? '-'} L</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Preço de Custo (Informado)</span>
                                                <span className="font-bold">{selectedShift.shift.burger_cost ? formatCurrency(selectedShift.shift.burger_cost) : '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Total Produzido</span>
                                                <span className="font-bold">{selectedShift.shift.burgers_produced ?? '-'} un</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Total Vendido (Sistema)</span>
                                                <span className="font-bold">{selectedShift.productCount} un</span>
                                            </div>
                                            <div className="flex justify-between items-center text-red-600 bg-red-50 p-2 rounded">
                                                <span className="font-bold">Sobras (Não Venderam)</span>
                                                <span className="font-bold">
                                                    {selectedShift.shift.burgers_produced !== undefined && selectedShift.shift.burgers_produced > 0
                                                        ? (selectedShift.shift.burgers_produced - selectedShift.productCount)
                                                        : (selectedShift.shift.burgers_unsold ?? '-')} un
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-lg border shadow-sm">
                                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                            <Users size={18} className="text-purple-500"/> Detalhamento de Vendas
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            {/* Dynamic Product List */}
                                            {Object.values(selectedShift.productStats)
                                                .sort((a: any, b: any) => b.count - a.count)
                                                .map((p: any) => (
                                                    <div key={p.name} className="flex justify-between items-center">
                                                        <span className="text-gray-600">{p.name}</span>
                                                        <span className="font-bold">{p.count} un</span>
                                                    </div>
                                            ))}
                                            
                                            {/* Promo Section */}
                                            <div className="flex justify-between items-center bg-purple-50 p-2 rounded text-purple-800 mt-4 border-t border-purple-100">
                                                <span className="font-bold">Qtd. na Promoção</span>
                                                <span className="font-bold">
                                                    {Object.values(selectedShift.productStats).reduce((acc: number, p: any) => acc + (p.promoCount || 0), 0)} un
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center bg-purple-50 p-2 rounded text-purple-800 mt-1">
                                                <span className="font-bold">Desconto Total (Promoções)</span>
                                                <span className="font-bold">
                                                    {formatCurrency(
                                                        selectedShift.shiftOrders.reduce((sum: number, o: any) => sum + (o.discount || 0), 0)
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Feedback Section */}
                            {selectedShift.shift.feedback && (
                                <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-lg shadow-sm">
                                    <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                                        <FileText size={18}/> Feedback / Observações do Turno
                                    </h3>
                                    <p className="text-gray-700 whitespace-pre-wrap text-sm italic">"{selectedShift.shift.feedback}"</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-gray-100 border-t flex justify-between shrink-0">
                            <Button 
                                variant="secondary" 
                                className="flex gap-2 items-center text-gray-700 bg-white hover:bg-gray-50 border-gray-300"
                                onClick={() => {
                                    const reportContent = [
                                        "================================",
                                        "      RELATÓRIO DE FECHAMENTO   ",
                                        "             REDUÇÃO Z          ",
                                        "================================",
                                        `LOJA: MATRIZ - TERM: ${selectedShift.shift.terminal_id || 'N/A'}`,
                                        `DATA ABERTURA: ${new Date(selectedShift.shift.opened_at).toLocaleString()}`,
                                        `OPERADOR: ${selectedShift.shift.staff_name}`,
                                        selectedShift.shift.closer_name ? `FECHADO POR: ${selectedShift.shift.closer_name}` : null,
                                        selectedShift.shift.menu_name ? `CARDAPIO: ${selectedShift.shift.menu_name}` : null,
                                        "--------------------------------",
                                        "RESUMO FINANCEIRO:",
                                        `VENDAS PIX:       ${formatCurrency(selectedShift.paymentStats['PIX']?.total || 0)}`,
                                        `VENDAS DINHEIRO:  ${formatCurrency(selectedShift.paymentStats['CASH']?.total || 0)}`,
                                        `VENDAS OUTROS:    ${formatCurrency(
                                            Object.entries(selectedShift.paymentStats)
                                                .filter(([k]) => k !== 'PIX' && k !== 'CASH')
                                                .reduce((acc: number, [_, v]: any) => acc + v.total, 0)
                                        )}`,
                                        `VENDAS TOTAIS:    ${formatCurrency(selectedShift.totalRevenue)}`,
                                        `QTD PEDIDOS:      ${selectedShift.orderCount}`,
                                        "--------------------------------",
                                        "MOVIMENTACAO DE CAIXA:",
                                        `SALDO INICIAL:    ${formatCurrency(selectedShift.shift.start_cash)}`,
                                        `SUPRIMENTOS:     +${formatCurrency(selectedShift.entries)}`,
                                        `SANGRIAS:        -${formatCurrency(selectedShift.drops)}`,
                                        `REEMBOLSOS:      -${formatCurrency(selectedShift.refunds)}`,
                                        `SALDO FINAL:      ${formatCurrency(selectedShift.calculatedFinalCash)}`,
                                        `LUCRO FINAL:      ${formatCurrency(selectedShift.calculatedFinalCash - selectedShift.shift.start_cash)}`,
                                        "--------------------------------",
                                        "PRODUCAO E ESTOQUE:",
                                        `BEBIDAS (SAIDA):  ${selectedShift.shift.drinks_liters ?? '-'} L`,
                                        `CUSTO LANCHE:     ${selectedShift.shift.burger_cost ? formatCurrency(selectedShift.shift.burger_cost) : '-'}`,
                                        `TOTAL PRODUZIDO:  ${selectedShift.shift.burgers_produced ?? '-'} un`,
                                        `TOTAL VENDIDO:    ${selectedShift.productCount} un`,
                                        `SOBRAS:           ${selectedShift.shift.burgers_produced !== undefined && selectedShift.shift.burgers_produced > 0
                                            ? (selectedShift.shift.burgers_produced - selectedShift.productCount)
                                            : (selectedShift.shift.burgers_unsold ?? '-')} un`,
                                        "--------------------------------",
                                        "DETALHAMENTO DE VENDAS:",
                                        ...Object.values(selectedShift.productStats)
                                            .sort((a: any, b: any) => b.count - a.count)
                                            .map((p: any) => `${p.name.padEnd(20).substring(0,20)} ${String(p.count).padStart(5)} un`),
                                        "",
                                        `QTD. PROMOCOES:   ${Object.values(selectedShift.productStats).reduce((acc: number, p: any) => acc + (p.promoCount || 0), 0)} un`,
                                        `DESCONTO PROMO:   ${formatCurrency(selectedShift.shiftOrders.reduce((sum: number, o: any) => sum + (o.discount || 0), 0))}`,
                                        "--------------------------------",
                                        "REEMBOLSOS REGISTRADOS:",
                                        ...(selectedShift.transactions.filter((t: any) => t.type === 'REIMBURSEMENT').length > 0 
                                            ? selectedShift.transactions.filter((t: any) => t.type === 'REIMBURSEMENT').map((r: any) => 
                                                `${(r.payee || 'Nao informado').padEnd(18).substring(0,18)} -${formatCurrency(r.amount)}`
                                              )
                                            : ["Nenhum reembolso registrado"]),
                                        selectedShift.shift.feedback ? "--------------------------------" : null,
                                        selectedShift.shift.feedback ? "FEEDBACK / OBSERVACOES:" : null,
                                        selectedShift.shift.feedback ? selectedShift.shift.feedback : null,
                                        "================================",
                                        "        FIM DO RELATÓRIO        "
                                    ].filter(Boolean).join('\n');
                                    
                                    const printWindow = window.open('', '', 'width=400,height=600');
                                    if (printWindow) {
                                        printWindow.document.write(`
                                            <html>
                                                <head>
                                                    <title>Relatório Z - ${selectedShift.shift.id}</title>
                                                    <style>
                                                        body { font-family: monospace; white-space: pre; margin: 20px; font-size: 14px; color: #000; }
                                                        @media print { body { margin: 0; } @page { margin: 0; } }
                                                    </style>
                                                </head>
                                                <body>${reportContent}</body>
                                            </html>
                                        `);
                                        printWindow.document.close();
                                        printWindow.focus();
                                        setTimeout(() => {
                                            printWindow.print();
                                            printWindow.close();
                                        }, 500);
                                    }
                                }}
                            >
                                <Printer size={18} /> Imprimir Relatório
                            </Button>
                            <Button variant="secondary" onClick={() => setSelectedShift(null)}>Fechar Relatório</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
