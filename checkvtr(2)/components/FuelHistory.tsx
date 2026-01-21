
import React from 'react';
import { FuelRecord, Vehicle } from '../types';

interface FuelHistoryProps {
  records: FuelRecord[];
  vehicles: Vehicle[];
  onAddManual: () => void;
  onEditFuel?: (record: FuelRecord) => void;
  onDeleteFuel?: (id: string) => void;
  isAdmin?: boolean;
}

const FuelHistory: React.FC<FuelHistoryProps> = ({ records, vehicles, onAddManual, onEditFuel, onDeleteFuel, isAdmin = false }) => {
  const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const calculateMedia = (current: FuelRecord) => {
    const sameVehicleRecords = sortedRecords.filter(r => r.vehicleId === current.vehicleId);
    const currentIndex = sameVehicleRecords.findIndex(r => r.id === current.id);
    const nextRecord = sameVehicleRecords[currentIndex + 1];

    if (nextRecord && current.liters > 0) {
      const kmDiff = current.kmAtRefueling - nextRecord.kmAtRefueling;
      if (kmDiff > 0) return (kmDiff / current.liters).toFixed(2);
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Gestão de Consumo</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">BPRAIO - Relatório de Combustíveis</p>
        </div>
        <button 
          onClick={onAddManual}
          className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95"
        >
          ⛽ Novo Registro
        </button>
      </div>

      {/* Mobile View Cards */}
      <div className="grid grid-cols-1 lg:hidden gap-4">
        {sortedRecords.map(r => {
          const v = vehicles.find(veh => veh.id === r.vehicleId);
          const media = calculateMedia(r);
          return (
            <div key={r.id} className="bg-[#0a0a0a] rounded-[32px] border border-slate-800 p-6 tactical-glow relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tight">{v?.model || 'Desconhecido'}</h4>
                    <p className="text-[10px] font-mono font-black text-blue-500 uppercase tracking-widest">{v?.plate || '---'}</p>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <span className="text-[11px] font-black text-emerald-500 bg-emerald-500/5 px-3 py-1 rounded-lg border border-emerald-500/20">R$ {r.totalValue.toLocaleString()}</span>
                    {isAdmin && (
                      <div className="flex gap-2">
                         <button onClick={() => onEditFuel?.(r)} className="p-2 bg-blue-600/10 text-blue-400 rounded-lg border border-blue-500/20"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg></button>
                         <button onClick={() => onDeleteFuel?.(r.id)} className="p-2 bg-rose-600/10 text-rose-500 rounded-lg border border-rose-500/20"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5"/></svg></button>
                      </div>
                    )}
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                 <div className="bg-black/40 p-3 rounded-2xl border border-slate-800">
                    <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Odômetro</p>
                    <p className="text-xs font-black text-white uppercase">{r.kmAtRefueling.toLocaleString()} KM</p>
                 </div>
                 <div className="bg-black/40 p-3 rounded-2xl border border-slate-800">
                    <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Volume</p>
                    <p className="text-xs font-black text-blue-400 uppercase">{r.liters.toLocaleString()} Litros</p>
                 </div>
              </div>

              <div className="flex justify-between items-center text-[8px] font-black text-slate-600 uppercase tracking-widest pt-3 border-t border-slate-900">
                 <span>{new Date(r.date).toLocaleDateString()} {new Date(r.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                 {media && <span className="text-yellow-500">Média: {media} KM/L</span>}
              </div>
            </div>
          );
        })}
        {records.length === 0 && (
           <div className="py-20 text-center bg-[#0a0a0a] rounded-[32px] border border-dashed border-slate-800 text-slate-600 uppercase font-black text-[10px] tracking-widest">Nenhum registro encontrado</div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-[#0a0a0a] rounded-[44px] border border-slate-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-[#0f172a] text-[9px] font-black text-slate-500 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-6">Veículo / Unidade</th>
              <th className="px-8 py-6">Data / Operador</th>
              <th className="px-8 py-6">KM / Média</th>
              <th className="px-8 py-6">Valor / Volume</th>
              <th className="px-8 py-6">Saldo Cartão</th>
              {isAdmin && <th className="px-8 py-6 text-right">Controle P4</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {sortedRecords.map(r => {
              const v = vehicles.find(veh => veh.id === r.vehicleId);
              const media = calculateMedia(r);
              return (
                <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="text-xs font-black text-white uppercase">{v?.model}</div>
                    <div className="text-[9px] font-mono font-black text-blue-500 mt-0.5">{v?.plate}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-[10px] font-black text-white uppercase">{r.driverName}</div>
                    <div className="text-[9px] font-black text-slate-500 mt-0.5 uppercase tracking-widest">{new Date(r.date).toLocaleString()}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-xs font-black text-white uppercase">{r.kmAtRefueling.toLocaleString()} KM</div>
                    {media && <div className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mt-1">Média: {media} KM/L</div>}
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-xs font-black text-emerald-500 uppercase">R$ {r.totalValue.toLocaleString()}</div>
                    <div className="text-[9px] font-black text-slate-500 uppercase mt-0.5 tracking-widest">{r.liters} Litros</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-black text-blue-400">R$ {r.remainingBalance.toLocaleString()}</span>
                  </td>
                  {isAdmin && (
                    <td className="px-8 py-5 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEditFuel?.(r)} className="p-2 bg-slate-900 text-blue-500 hover:text-white rounded-lg border border-slate-800 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg></button>
                          <button onClick={() => onDeleteFuel?.(r.id)} className="p-2 bg-slate-900 text-rose-500 hover:text-white rounded-lg border border-slate-800 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5"/></svg></button>
                       </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FuelHistory;
