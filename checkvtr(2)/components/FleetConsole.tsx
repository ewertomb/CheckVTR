
import React, { useState, useMemo } from 'react';
import { Vehicle, VehicleStatus, UserRole, User, TransferRequest, TransferStatus } from '../types';

interface FleetConsoleProps {
  vehicles: Vehicle[];
  units: string[];
  currentUser: User;
  activeRole: UserRole;
  onAddClick: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onTransferVehicle: (vehicleId: string, targetUnit: string) => void;
  transferRequests: TransferRequest[];
  onAcceptTransfer: (transferId: string) => void;
  onRejectTransfer: (transferId: string) => void;
}

const FleetConsole: React.FC<FleetConsoleProps> = ({ 
  vehicles, 
  units,
  currentUser,
  activeRole,
  onAddClick, 
  onEditVehicle, 
  onDeleteVehicle,
  onTransferVehicle,
  transferRequests,
  onAcceptTransfer,
  onRejectTransfer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'frota' | 'transferencias'>('frota');

  const isProgrammer = activeRole === UserRole.PROGRAMMER;

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const belongsToUnit = isProgrammer ? (unitFilter === 'all' || v.unit === unitFilter) : (v.unit === currentUser.unit);
      const matchesSearch = v.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            v.model.toLowerCase().includes(searchTerm.toLowerCase());
      return belongsToUnit && matchesSearch;
    }).sort((a, b) => a.plate.localeCompare(b.plate));
  }, [vehicles, searchTerm, unitFilter, isProgrammer, currentUser.unit]);

  // Transferências que exigem ação da minha unidade
  const pendingIncoming = useMemo(() => {
    return transferRequests.filter(t => t.status === TransferStatus.PENDING && (t.toUnit === currentUser.unit || isProgrammer));
  }, [transferRequests, currentUser.unit, isProgrammer]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Console de Frota</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">
            {isProgrammer ? 'Gestão Global de Ativos (Nível Master)' : `Gestão de Ativos • ${currentUser.unit}`}
          </p>
        </div>
        
        <div className="flex bg-[#0a0a0a] border border-slate-800 p-1.5 rounded-2xl w-full lg:w-auto">
          <button onClick={() => setActiveTab('frota')} className={`flex-1 lg:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'frota' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Ativos</button>
          <button onClick={() => setActiveTab('transferencias')} className={`flex-1 lg:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'transferencias' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
            Transferências
            {pendingIncoming.length > 0 && <span className="ml-2 px-1.5 bg-rose-600 text-[8px] rounded-full animate-pulse">{pendingIncoming.length}</span>}
          </button>
        </div>
      </div>

      {activeTab === 'frota' ? (
        <>
          <div className="bg-[#0a0a0a] border border-slate-800 p-8 rounded-[44px] flex flex-col md:flex-row gap-6 items-center tactical-glow">
            <div className="flex-grow w-full relative">
               <input 
                 type="text" 
                 placeholder="BUSCAR POR PLACA OU PREFIXO..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                 className="w-full pl-14 pr-6 py-5 rounded-3xl bg-slate-900 border-2 border-slate-800 text-white font-black placeholder:text-slate-700 outline-none focus:border-blue-500 transition-all"
               />
               <svg className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            
            {isProgrammer && (
              <div className="w-full md:w-80">
                <select 
                  value={unitFilter}
                  onChange={(e) => setUnitFilter(e.target.value)}
                  className="w-full px-6 py-5 rounded-3xl bg-slate-900 border-2 border-slate-800 text-white font-black uppercase text-sm outline-none focus:border-blue-500 appearance-none"
                >
                  <option value="all">TODAS AS BASES (GLOBAL)</option>
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            )}
            
            <button onClick={onAddClick} className="w-full md:w-auto px-10 py-5 bg-blue-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl">Novo Veículo</button>
          </div>

          <div className="bg-[#0a0a0a] rounded-[48px] border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#0f172a] text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-800">
                    <th className="px-8 py-6">Recurso</th>
                    <th className="px-8 py-6">Lotação Atual</th>
                    <th className="px-8 py-6">Estado</th>
                    <th className="px-8 py-6">Odômetro</th>
                    <th className="px-8 py-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredVehicles.map(v => (
                    <tr key={v.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0 shadow-2xl">
                            <img src={v.image} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div>
                            <div className="text-sm font-black text-white uppercase tracking-tight">{v.model}</div>
                            <div className="text-[10px] font-mono font-black text-blue-500 mt-1 uppercase tracking-widest">{v.plate}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase">{v.unit}</span>
                           <div className="relative">
                              <select 
                                value={v.unit}
                                onChange={(e) => onTransferVehicle(v.id, e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-xl text-[8px] font-black text-blue-500 uppercase outline-none appearance-none"
                              >
                                <option value={v.unit}>SOLICITAR TRANSFERÊNCIA ➔</option>
                                {units.filter(u => u !== v.unit).map(u => (
                                  <option key={u} value={u} className="bg-slate-950 text-white">{u}</option>
                                ))}
                              </select>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                          v.status === VehicleStatus.AVAILABLE ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          v.status === VehicleStatus.IN_USE ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-xs font-black text-slate-400">{(v.lastMaintenanceKm || 0).toLocaleString()} <span className="text-[8px] text-slate-600">KM</span></div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEditVehicle(v)} className="p-3 bg-slate-900 text-blue-500 hover:text-white hover:bg-blue-600 rounded-xl transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2"/></svg>
                          </button>
                          <button onClick={() => onDeleteVehicle(v.id)} className="p-3 bg-slate-900 text-rose-500 hover:text-white hover:bg-rose-600 rounded-xl transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
           {pendingIncoming.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {pendingIncoming.map(t => (
                 <div key={t.id} className="bg-[#0a0a0a] border border-blue-500/20 rounded-[32px] p-8 space-y-6 tactical-glow">
                    <div className="flex justify-between items-start">
                       <div>
                          <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">PEDIDO DE TRANSFERÊNCIA</div>
                          {/* Fix: Changed t.vehiclePlate and t.vehicleModel to t.itemName as TransferRequest uses itemName to store plate/description */}
                          <h4 className="text-xl font-black text-white uppercase tracking-tight">{t.itemName}</h4>
                          <p className="text-[10px] text-slate-500 uppercase font-black">Transferência de Recurso</p>
                       </div>
                       <span className="text-2xl">🚛</span>
                    </div>
                    
                    <div className="bg-black/40 p-4 rounded-2xl border border-slate-800 space-y-3">
                       <div>
                          <p className="text-[8px] font-black text-slate-600 uppercase">DE:</p>
                          <p className="text-xs font-black text-white uppercase">{t.fromUnit}</p>
                       </div>
                       <div className="w-full h-px bg-slate-800"></div>
                       <div>
                          <p className="text-[8px] font-black text-blue-500 uppercase">PARA:</p>
                          <p className="text-xs font-black text-white uppercase">{t.toUnit}</p>
                       </div>
                    </div>
                    
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-l-2 border-slate-800 pl-4 py-1">
                       Solicitado por: {t.requesterName}<br/>
                       Em: {new Date(t.createdAt).toLocaleDateString()}
                    </div>

                    <div className="flex gap-3 pt-4">
                       <button onClick={() => onRejectTransfer(t.id)} className="flex-1 py-4 bg-slate-900 text-rose-500 text-[9px] font-black rounded-xl uppercase border border-slate-800">Recusar</button>
                       <button onClick={() => onAcceptTransfer(t.id)} className="flex-[2] py-4 bg-emerald-600 text-white text-[9px] font-black rounded-xl uppercase shadow-lg shadow-emerald-500/10">Aceitar Recurso</button>
                    </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="py-24 text-center bg-[#0a0a0a] rounded-[48px] border border-dashed border-slate-800">
                <div className="text-5xl mb-6 opacity-10">📥</div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Sem transferências pendentes para sua base</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default FleetConsole;
