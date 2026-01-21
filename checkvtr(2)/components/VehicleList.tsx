
import React, { useState, useMemo } from 'react';
import { Vehicle, VehicleStatus, User, UserRole, CheckRecord, FuelRecord } from '../types';

interface VehicleListProps {
  vehicles: Vehicle[];
  fuelRecords: FuelRecord[];
  initialStatusFilter?: VehicleStatus | 'all';
  onSelectVehicle: (vehicle: Vehicle) => void;
  onFuelAction: (vehicle: Vehicle) => void;
  onAddClick: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onCloneVehicle?: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onUpdateStatus: (id: string, status: VehicleStatus) => void;
  onTransferVehicle: (vehicle: Vehicle, targetUnit: string) => void;
  currentUser: User;
  allRecords: CheckRecord[];
  activeRole: UserRole;
  units?: string[];
}

const VehicleList: React.FC<VehicleListProps> = ({ 
  vehicles, onSelectVehicle, onFuelAction, onAddClick, onEditVehicle, onCloneVehicle, onDeleteVehicle, onTransferVehicle, onUpdateStatus, currentUser, activeRole, units = []
}) => {
  const isProgrammer = activeRole === UserRole.PROGRAMMER;
  const isAdmin = activeRole === UserRole.ADMIN || isProgrammer;
  const isManager = isAdmin || activeRole === UserRole.PERMANENTE;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [transferringId, setTransferringId] = useState<string | null>(null);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => 
      !searchTerm.trim() || 
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.plate.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vehicles, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-[#0a0a0a] p-6 md:p-8 rounded-[40px] border border-slate-800 shadow-xl flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-grow w-full">
          <input type="text" placeholder="Buscar placa ou prefixo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toUpperCase())} className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-900 border-2 border-slate-800 text-white font-bold placeholder:text-slate-700 focus:border-blue-500 outline-none" />
          <svg className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        {isAdmin && (
          <button onClick={onAddClick} className="w-full md:w-auto px-8 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase text-[11px] tracking-widest">+ Novo Veículo</button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVehicles.map(v => {
          const isCurrentUserUsing = v.status === VehicleStatus.IN_USE && v.currentDriver === currentUser.name;
          
          return (
            <div key={v.id} className={`bg-[#0a0a0a] rounded-[44px] border overflow-hidden shadow-2xl flex flex-col transition-all relative group tactical-glow ${v.status === VehicleStatus.AVAILABLE ? 'border-emerald-500/30' : v.status === VehicleStatus.IN_USE ? 'border-yellow-500/30' : 'border-slate-800'}`}>
              <div className="relative h-56 md:h-64 overflow-hidden">
                <img src={v.image} alt={v.model} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute top-5 left-5">
                   <span className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase bg-blue-600 text-white border border-blue-400 shadow-2xl">{v.unit}</span>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/95 to-transparent">
                  <div className="text-[10px] font-mono font-bold text-blue-400 tracking-widest uppercase mb-1">{v.plate}</div>
                  <h4 className="font-black text-white text-xl uppercase tracking-tighter">{v.model}</h4>
                </div>
              </div>
              
              <div className="p-6 space-y-4 flex-grow">
                {isManager && (
                  <div className="space-y-2 mb-2">
                     <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest ml-1">Classificar Estado</p>
                     <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/40 rounded-xl border border-slate-800">
                        <button onClick={() => onUpdateStatus(v.id, VehicleStatus.AVAILABLE)} className={`py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${v.status === VehicleStatus.AVAILABLE ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-800'}`}>Pronto</button>
                        <button onClick={() => onUpdateStatus(v.id, VehicleStatus.IN_USE)} className={`py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${v.status === VehicleStatus.IN_USE ? 'bg-yellow-500 text-black shadow-lg' : 'text-slate-600 hover:bg-slate-800'}`}>Uso</button>
                        <button onClick={() => onUpdateStatus(v.id, VehicleStatus.MAINTENANCE)} className={`py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${v.status === VehicleStatus.MAINTENANCE ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-800'}`}>Ofic</button>
                        <button onClick={() => onUpdateStatus(v.id, VehicleStatus.DEFECTIVE)} className={`py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${v.status === VehicleStatus.DEFECTIVE ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-800'}`}>Avar</button>
                     </div>
                  </div>
                )}

                <div className="flex justify-between items-center px-1">
                   <span className={`text-[9px] font-black uppercase tracking-widest ${v.status === VehicleStatus.AVAILABLE ? 'text-emerald-500' : v.status === VehicleStatus.IN_USE ? 'text-yellow-400' : 'text-slate-500'}`}>{v.status}</span>
                   <span className="text-[9px] font-black text-slate-600">{(v.lastMaintenanceKm || 0).toLocaleString()} KM</span>
                </div>

                <button 
                  onClick={() => onSelectVehicle(v)} 
                  disabled={v.status === VehicleStatus.IN_USE && !isCurrentUserUsing && !isManager}
                  className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl ${v.status === VehicleStatus.AVAILABLE ? 'bg-blue-600 text-white shadow-blue-500/20' : isCurrentUserUsing || isManager ? 'bg-yellow-400 text-slate-950 shadow-yellow-400/20' : 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed'}`}
                >
                  {v.status === VehicleStatus.AVAILABLE ? `Assumir ${v.category}` : 'Realizar Devolução'}
                </button>

                <div className="flex gap-2">
                   <button onClick={() => onFuelAction(v)} className="flex-1 py-4 bg-slate-900 text-slate-300 border border-slate-800 rounded-2xl text-[9px] font-black uppercase hover:bg-slate-800 transition-all">Abastecer</button>
                   {isAdmin && (
                     <div className="flex gap-1">
                        <button onClick={() => onEditVehicle(v)} className="w-11 h-12 flex items-center justify-center bg-slate-900 text-slate-500 border border-slate-800 rounded-xl hover:text-white" title="Editar">✏️</button>
                        <button onClick={() => onDeleteVehicle(v.id)} className="w-11 h-12 flex items-center justify-center bg-rose-900/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-600 hover:text-white transition-all" title="Excluir">🗑️</button>
                        <button onClick={() => onCloneVehicle?.(v)} className="w-11 h-12 flex items-center justify-center bg-slate-900 text-slate-500 border border-slate-800 rounded-xl hover:text-white" title="Clonar">📋</button>
                     </div>
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VehicleList;
