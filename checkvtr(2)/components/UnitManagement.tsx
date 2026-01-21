
import React, { useState, useMemo } from 'react';
import { User, Vehicle, UserRole, Unit, VehicleStatus, CheckRecord, TransferRequest, TransferStatus } from '../types';

interface UnitManagementProps {
  currentUser: User;
  vehicles: Vehicle[];
  users: User[];
  units: Unit[];
  allRecords: CheckRecord[];
  onSwitchUnit: (unit: string) => void;
  currentSelectedUnit: string;
  onAddUnit: (name: string) => void;
  onDeleteUnit: (id: string) => void;
  onUpdateUnit: (id: string, data: Partial<Unit>) => void;
  onAddVehicle: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onUpdateStatus: (id: string, status: VehicleStatus) => void;
  onAddUser: () => void;
  onUpdateUser: (user: User) => void;
  onTransferUser: (user: User, targetUnit: string) => void;
  onTransferVehicle: (vehicle: Vehicle, targetUnit: string) => void;
  activeRole: UserRole;
  transferRequests: TransferRequest[];
  onResolveTransfer: (id: string, action: 'accepted' | 'rejected') => void;
}

const UnitManagement: React.FC<UnitManagementProps> = ({
  vehicles, users, units, onAddUnit, onDeleteUnit, onSwitchUnit, onEditVehicle, onDeleteVehicle, onUpdateUser, onTransferUser, onTransferVehicle
}) => {
  const [selectedUnitName, setSelectedUnitName] = useState<string | null>(null);
  const [showAddBase, setShowAddBase] = useState(false);
  const [newBaseName, setNewBaseName] = useState('');
  const [activeTab, setActiveTab] = useState<'frota' | 'efetivo'>('frota');

  const unitVehicles = useMemo(() => 
    vehicles.filter(v => v.unit === selectedUnitName), 
  [vehicles, selectedUnitName]);

  const unitUsers = useMemo(() => 
    users.filter(u => u.unit === selectedUnitName), 
  [users, selectedUnitName]);

  if (selectedUnitName) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0a0a0a] p-8 rounded-[40px] border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-5">
            <button onClick={() => setSelectedUnitName(null)} className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 flex items-center justify-center transition-all shadow-lg active:scale-95">
               <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
            <div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedUnitName}</h2>
              <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1">Gestão Direta de Base</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex bg-black/40 border border-slate-800 p-1.5 rounded-[24px]">
              <button onClick={() => setActiveTab('frota')} className={`px-6 py-3 rounded-[20px] text-[10px] font-black uppercase transition-all ${activeTab === 'frota' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Frota</button>
              <button onClick={() => setActiveTab('efetivo')} className={`px-6 py-3 rounded-[20px] text-[10px] font-black uppercase transition-all ${activeTab === 'efetivo' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Efetivo</button>
            </div>
            <button onClick={() => onSwitchUnit(selectedUnitName)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all active:scale-95 tracking-widest">Acessar Base Operational ➔</button>
          </div>
        </div>

        {activeTab === 'frota' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {unitVehicles.map(v => (
              <div key={v.id} className="bg-[#0a0a0a] border border-slate-800 rounded-[36px] p-6 tactical-glow group">
                <div className="flex gap-6 mb-6">
                  <div className="w-20 h-20 rounded-[24px] overflow-hidden bg-slate-900 border border-slate-800">
                    <img src={v.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono font-black text-rose-500 mb-1">{v.plate}</div>
                    <h5 className="text-lg font-black text-white uppercase italic truncate">{v.model}</h5>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{v.category === 'VTR' ? 'Viatura' : 'Moto'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => onEditVehicle(v)} className="py-4 bg-slate-900 text-slate-400 border border-slate-800 rounded-xl text-[8px] font-black uppercase hover:text-white">Ajustar</button>
                  <button onClick={() => { const t = prompt("Transferir para qual base?", v.unit); if(t && t !== v.unit) onTransferVehicle(v, t.toUpperCase()); }} className="py-4 bg-rose-900/10 text-rose-400 border border-rose-500/20 rounded-xl text-[8px] font-black uppercase">Transferir</button>
                  <button onClick={() => onDeleteVehicle(v.id)} className="py-4 bg-rose-600/10 text-rose-600 border border-rose-600/20 rounded-xl text-[8px] font-black uppercase">Excluir</button>
                </div>
              </div>
            ))}
            {unitVehicles.length === 0 && (
              <div className="col-span-full py-20 text-center bg-[#0a0a0a] rounded-[44px] border border-dashed border-slate-800 text-slate-600 uppercase font-black text-[10px] tracking-widest">Base sem veículos no momento</div>
            )}
          </div>
        )}

        {activeTab === 'efetivo' && (
          <div className="bg-[#0a0a0a] rounded-[40px] border border-slate-800 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-[#0f172a] text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <tr><th className="px-8 py-6">Nome / Matrícula</th><th className="px-8 py-6">Perfis</th><th className="px-8 py-6 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {unitUsers.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-8 py-5">
                      <div className="text-xs font-black text-white uppercase">{u.name}</div>
                      <div className="text-[9px] text-slate-500 font-mono">{u.registration}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.map(r => <span key={r} className="text-[7px] font-black bg-rose-600/20 text-rose-500 px-1.5 py-0.5 rounded uppercase">{r}</span>)}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                         <button onClick={() => { const t = prompt("Mudar Policial para Base:", u.unit); if(t && t !== u.unit) onTransferUser(u, t.toUpperCase()); }} className="px-4 py-2 bg-rose-600/10 text-rose-500 rounded-xl text-[8px] font-black uppercase border border-rose-500/20">Relotar</button>
                         <button onClick={() => onUpdateUser(u)} className="p-2 bg-slate-900 text-slate-500 rounded-lg border border-slate-800 hover:text-white">✏️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 px-2">
        <div>
          <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] mb-3 border-l-2 border-rose-600 pl-4">Estrutura Governamental</h3>
          <p className="text-xl text-slate-500 font-bold uppercase tracking-widest italic">Unidades Operacionais do Estado</p>
        </div>
        <button onClick={() => setShowAddBase(true)} className="bg-rose-600 hover:bg-rose-500 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all active:scale-95 tracking-[0.2em] shadow-rose-600/20">+ ATIVAR NOVA BASE</button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
        {units.map(u => {
          const vCount = vehicles.filter(v => v.unit === u.name).length;
          const uCount = users.filter(usr => usr.unit === u.name).length;
          return (
            <div key={u.id} className="bg-[#0a0a0a] border-2 border-slate-800 rounded-[44px] p-8 flex flex-col hover:border-rose-500/40 transition-all shadow-2xl relative overflow-hidden group">
              <h4 className="text-2xl font-black text-white truncate mb-4 uppercase italic tracking-tighter">{u.name}</h4>
              <div className="flex gap-4 mb-8">
                 <div className="flex flex-col"><span className="text-[8px] font-black text-slate-600 uppercase">Frota</span><span className="text-sm font-black text-rose-500">{vCount}</span></div>
                 <div className="flex flex-col"><span className="text-[8px] font-black text-slate-600 uppercase">Efetivo</span><span className="text-sm font-black text-white">{uCount}</span></div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => setSelectedUnitName(u.name)} className="w-full py-4.5 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all shadow-lg min-h-[56px]">Gerenciar Ativos ⚙️</button>
                <button onClick={() => onSwitchUnit(u.name)} className="w-full py-4.5 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all min-h-[56px]">Acessar Modo Operational ➔</button>
                <button onClick={() => onDeleteUnit(u.id)} className="text-[8px] font-black text-slate-700 uppercase mt-4 hover:text-rose-500 transition-colors">Remover Estrutura</button>
              </div>
            </div>
          );
        })}
      </div>

      {showAddBase && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[3000] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-rose-500/30 rounded-[48px] p-8 md:p-12 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h4 className="text-3xl font-black text-white uppercase mb-4 italic tracking-tighter">Ativar Base</h4>
            <p className="text-[9px] text-slate-500 font-black uppercase mb-10 tracking-widest">Nova unidade operacional para controle de frota</p>
            <input type="text" value={newBaseName} onChange={(e) => setNewBaseName(e.target.value.toUpperCase())} placeholder="NOME DA UNIDADE (EX: SOBRAL)" className="w-full px-6 py-5 rounded-[24px] bg-black border-2 border-slate-800 text-white font-black uppercase outline-none focus:border-rose-500 mb-8 shadow-inner" />
            <div className="flex gap-4">
              <button onClick={() => setShowAddBase(false)} className="flex-1 py-5 bg-slate-900 text-slate-500 font-black rounded-2xl text-[10px] uppercase">Cancelar</button>
              <button onClick={() => { onAddUnit(newBaseName); setShowAddBase(false); setNewBaseName(''); }} disabled={!newBaseName} className="flex-[2] py-5 bg-rose-600 text-white font-black rounded-2xl text-[10px] uppercase shadow-xl active:scale-95 transition-all">Ativar Unidade</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitManagement;
