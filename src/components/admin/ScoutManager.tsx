import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { Scout } from '../../types';
import { generateUUID } from '../../utils';
import { Button, Card } from '../ui';
import { Plus, Edit2, Trash2, Upload, X, Search, FileSpreadsheet } from 'lucide-react';

export const ScoutManager = () => {
    const { scouts, addScout, updateScout, deleteScout, importScouts, fetchScouts } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch scouts on mount to ensure fresh data
    useEffect(() => {
        void fetchScouts();
    }, []);

    // Form State
    const [name, setName] = useState('');
    const [branch, setBranch] = useState('');
    const [patrol, setPatrol] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleOpenAdd = () => {
        setEditingId(null);
        setName('');
        setBranch('');
        setPatrol('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (s: Scout) => {
        setEditingId(s.id);
        setName(s.name);
        setBranch(s.branch);
        setPatrol(s.patrol);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!name || !branch) {
            alert("Nome e Ramo são obrigatórios");
            return;
        }

        if (editingId) {
            updateScout(editingId, { name, branch, patrol });
        } else {
            addScout({
                id: generateUUID(),
                name,
                branch,
                patrol
            });
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm("Tem certeza que deseja excluir este escoteiro?")) {
            deleteScout(id);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            // Simple CSV Parser
            // Assumes format: Name,Branch,Patrol
            // Handles both comma and semicolon
            const lines = text.split(/\r?\n/);
            const newScouts: Scout[] = [];
            
            // Skip header if it looks like a header
            let startIndex = 0;
            if (lines[0].toLowerCase().includes('nome') || lines[0].toLowerCase().includes('name')) {
                startIndex = 1;
            }

            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Try comma then semicolon
                let parts = line.split(',');
                if (parts.length < 2) parts = line.split(';');
                
                if (parts.length >= 2) {
                    newScouts.push({
                        id: generateUUID(),
                        name: parts[0].trim(),
                        branch: parts[1].trim(),
                        patrol: parts[2]?.trim() || ''
                    });
                }
            }

            if (newScouts.length > 0) {
                importScouts(newScouts);
                alert(`${newScouts.length} escoteiros importados com sucesso!`);
            } else {
                alert("Nenhum dado válido encontrado. Verifique o formato do arquivo (Nome, Ramo, Patrulha).");
            }
            
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const filteredScouts = scouts.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.patrol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-2xl font-bold">Gerenciamento de Escoteiros</h2>
                <div className="flex gap-3">
                    <input 
                        type="file" 
                        accept=".csv,.txt" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
                        <Upload size={16} className="mr-2"/> Importar CSV
                    </Button>
                    <Button onClick={handleOpenAdd}>
                        <Plus size={16} className="mr-2"/> Novo Escoteiro
                    </Button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center gap-3">
                <Search className="text-gray-400" />
                <input 
                    className="flex-1 outline-none"
                    placeholder="Buscar por nome ou patrulha..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">Nome do Escoteiro</th>
                            <th className="p-4">Ramo</th>
                            <th className="p-4">Patrulha / Matilha</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredScouts.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    Nenhum escoteiro encontrado.
                                </td>
                            </tr>
                        ) : (
                            filteredScouts.map(s => (
                                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50 group">
                                    <td className="p-4 font-bold text-gray-800">{s.name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            s.branch.toLowerCase().includes('castor') ? 'bg-orange-100 text-orange-800' :
                                            s.branch.toLowerCase().includes('lobinho') ? 'bg-yellow-100 text-yellow-800' :
                                            s.branch.toLowerCase().includes('escoteiro') ? 'bg-green-100 text-green-800' :
                                            s.branch.toLowerCase().includes('sênior') ? 'bg-red-100 text-red-800' :
                                            s.branch.toLowerCase().includes('pioneiro') ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {s.branch}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">{s.patrol || '-'}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Helper Card */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800 text-sm flex gap-3">
                <FileSpreadsheet className="shrink-0" />
                <div>
                    <p className="font-bold">Como importar dados?</p>
                    <p className="mt-1 opacity-80">
                        Crie uma planilha e salve como <strong>.CSV</strong> com as colunas: 
                        <code className="bg-white px-1 py-0.5 rounded mx-1 border">Nome, Ramo, Patrulha</code>.
                        <br/>
                        Exemplo: <em>João Silva, Escoteiro, Lobo</em>
                    </p>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Escoteiro' : 'Novo Escoteiro'}</h3>
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
                                    placeholder="Ex: João Silva"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Ramo de Atividade</label>
                                <select 
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={branch}
                                    onChange={e => setBranch(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Castor">Castor</option>
                                    <option value="Lobinho">Lobinho</option>
                                    <option value="Escoteiro">Escoteiro</option>
                                    <option value="Sênior">Sênior</option>
                                    <option value="Pioneiro">Pioneiro</option>
                                    <option value="Chefe/Voluntário">Chefe/Voluntário</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Patrulha / Matilha</label>
                                <input 
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={patrol}
                                    onChange={e => setPatrol(e.target.value)}
                                    placeholder="Ex: Lobo, Vermelha, Everest"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex gap-3">
                            <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button variant="primary" className="flex-1" onClick={handleSave}>Salvar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
