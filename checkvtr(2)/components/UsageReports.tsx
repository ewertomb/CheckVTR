
import React, { useState, useMemo } from 'react';
import { CheckRecord, Vehicle, RecordType, User, UserRole, FuelRecord } from '../types';

interface UsageSession {
  driverName: string;
  startDate: string;
  endDate?: string;
  startKm: number;
  endKm?: number;
  distance?: number;
  reason?: string;
  status: 'Concluído' | 'Em Trânsito';
  startNotes?: string;
  endNotes?: string;
}

interface UsageReportsProps {
  records: CheckRecord[];
  vehicles: Vehicle[];
  fuelRecords: FuelRecord[];
  currentUser: User;
}

const UsageReports: React.FC<UsageReportsProps> = ({ records, vehicles, fuelRecords, currentUser }) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  const sessions = useMemo(() => {
    if (!selectedVehicleId) return [];
    const vehicleRecords = [...records]
      .filter(r => r.vehicleId === selectedVehicleId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const result: UsageSession[] = [];
    let currentSession: Partial<UsageSession> | null = null;

    vehicleRecords.forEach(record => {
      if (record.type === RecordType.CHECK_OUT) {
        if (currentSession) result.unshift(currentSession as UsageSession);
        currentSession = { 
          driverName: record.driverName, 
          startDate: record.timestamp, 
          startKm: record.kmReading || 0, 
          reason: record.reason, 
          startNotes: record.notes, 
          status: 'Em Trânsito' 
        };
      } else if (record.type === RecordType.CHECK_IN && currentSession) {
        const endKm = record.kmReading || 0;
        const startKm = currentSession.startKm || 0;
        result.unshift({ 
          ...currentSession as UsageSession, 
          endDate: record.timestamp, 
          endKm: endKm, 
          distance: Math.max(0, endKm - startKm), 
          endNotes: record.notes, 
          status: 'Concluído' 
        });
        currentSession = null;
      }
    });

    if (currentSession) result.unshift(currentSession as UsageSession);
    return result;
  }, [records, selectedVehicleId]);

  const fuelInfo = useMemo(() => {
    if (!selectedVehicleId) return { balance: null, isCritical: false };
    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!vehicle) return { balance: null, isCritical: false };
    const vFuels = fuelRecords.filter(f => f.vehicleId === selectedVehicleId);
    if (vFuels.length === 0) return { balance: null, isCritical: false };
    const balance = vFuels.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].remainingBalance;
    const isCritical = (vehicle.category === 'VTR' && balance < 500) || (vehicle.category === 'MR' && balance < 100);
    return { balance, isCritical };
  }, [fuelRecords, selectedVehicleId, vehicles]);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-[#0a0a0a] p-5 md:p-8 rounded-[36px] border border-slate-800 shadow-xl">
        <label className="block text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1 ml-1">Central de Auditoria</label>
        <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x mt-4">
          {vehicles.map(v => (
            <button key={v.id} onClick={() => setSelectedVehicleId(v.id)} className={`p-4 rounded-2xl border-2 transition-all text-left flex-shrink-0 w-40 md:w-48 snap-start ${selectedVehicleId === v.id ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'border-slate-800 bg-slate-900 text-slate-500 hover:border-slate-700'}`}>
              <div className={`text-[8px] font-mono font-bold uppercase mb-1 ${selectedVehicleId === v.id ? 'text-white/70' : 'text-blue-500'}`}>{v.plate}</div>
              <div className="font-black text-xs truncate uppercase tracking-tighter">{v.model}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedVehicleId ? (
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] p-6 rounded-[32px] border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-[24px] bg-black border border-slate-800 overflow-hidden flex-shrink-0 shadow-2xl">
              <img src={selectedVehicle?.image} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex-grow text-center sm:text-left">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-1">{selectedVehicle?.model}</h3>
              <p className="text-[10px] text-blue-500 font-mono font-bold tracking-widest uppercase mb-4">{selectedVehicle?.plate}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex flex-col"><span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">KM Atual</span><span className="text-xs font-black text-white">{(selectedVehicle?.lastMaintenanceKm || 0).toLocaleString()}</span></div>
                <div className={`px-3 py-1.5 rounded-xl border flex flex-col transition-all ${fuelInfo.isCritical ? 'bg-rose-950/40 border-rose-500/50 animate-pulse' : 'bg-emerald-900/10 border-emerald-500/20'}`}>
                   <span className={`text-[7px] font-black uppercase tracking-widest ${fuelInfo.isCritical ? 'text-rose-500' : 'text-emerald-500'}`}>Saldo Cartão</span>
                   <span className={`text-xs font-black ${fuelInfo.isCritical ? 'text-rose-400' : 'text-white'}`}>{fuelInfo.balance !== null ? `R$ ${fuelInfo.balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
             <div className="flex items-center gap-3 px-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Histórico de Utilização Detalhado</h4>
             </div>
             
             {sessions.map((s, i) => (
               <div key={i} className="bg-[#0a0a0a] border border-slate-800 rounded-[32px] p-6 space-y-6 tactical-glow group hover:border-blue-500/30 transition-all">
                  <div className="flex justify-between items-start">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-xl shadow-inner">👮</div>
                        <div>
                          <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Operador Responsável</div>
                          <div className="text-lg font-black text-white uppercase leading-none">{s.driverName}</div>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className={`inline-block px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border tracking-widest mb-2 ${s.status === 'Concluído' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse'}`}>{s.status}</span>
                        <div className="text-[9px] font-bold text-slate-600 uppercase">{new Date(s.startDate).toLocaleDateString()}</div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-black/40 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-center">
                       <p className="text-[8px] font-black text-slate-600 uppercase mb-2">Saída</p>
                       <p className="text-base font-mono font-black text-white">{s.startKm.toLocaleString()} KM</p>
                       <p className="text-[9px] font-bold text-slate-500 mt-1">{new Date(s.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <div className="bg-black/40 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-center">
                       <p className="text-[8px] font-black text-slate-600 uppercase mb-2">Retorno</p>
                       <p className="text-base font-mono font-black text-blue-400">{s.endKm ? `${s.endKm.toLocaleString()} KM` : '---'}</p>
                       <p className="text-[9px] font-bold text-slate-500 mt-1">{s.endDate ? new Date(s.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'EM CURSO'}</p>
                    </div>
                    
                    {/* CÁLCULO DE KM RODADO */}
                    <div className={`p-5 rounded-2xl border flex flex-col justify-center transition-all ${s.status === 'Concluído' ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-900/50 border-slate-800 opacity-50'}`}>
                       <div className="flex justify-between items-start mb-2">
                          <p className={`text-[8px] font-black uppercase ${s.status === 'Concluído' ? 'text-blue-400' : 'text-slate-500'}`}>Total Rodado</p>
                          <span className="text-lg">🛣️</span>
                       </div>
                       <div className="flex items-baseline gap-1">
                          <p className={`text-2xl font-black ${s.status === 'Concluído' ? 'text-white' : 'text-slate-600'}`}>
                            {s.distance !== undefined ? s.distance.toLocaleString() : '---'}
                          </p>
                          <span className={`text-[10px] font-black ${s.status === 'Concluído' ? 'text-blue-500' : 'text-slate-700'}`}>KM</span>
                       </div>
                    </div>
                  </div>

                  {s.startNotes && (
                    <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                       <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Observações de Missão</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase italic">"{s.startNotes}"</p>
                    </div>
                  )}
               </div>
             ))}

             {sessions.length === 0 && (
                <div className="py-32 text-center bg-[#0a0a0a] rounded-[44px] border border-dashed border-slate-800">
                   <div className="text-4xl mb-4 opacity-10">📋</div>
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Sem registros de utilização para este prefixo</p>
                </div>
             )}
          </div>
        </div>
      ) : (
        <div className="p-32 text-center bg-[#0a0a0a] rounded-[44px] border-2 border-slate-800 border-dashed animate-pulse">
           <div className="text-5xl mb-6 opacity-20">🚓</div>
           <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Selecione um veículo na barra superior para auditar</p>
        </div>
      )}
    </div>
  );
};

export default UsageReports;
