
import React, { useState } from 'react';
import { Vehicle, CheckRecord, FuelRecord, VehicleStatus, User } from '../types';
import { getFleetBriefing } from '../geminiService';

interface DashboardProps {
  vehicles: Vehicle[];
  records: CheckRecord[];
  fuelRecords: FuelRecord[];
  currentUser: User;
  onQuickAction: (vehicle: Vehicle) => void;
  onFuelAction: (vehicle: Vehicle) => void;
  onStatsClick: (status: VehicleStatus | 'all') => void;
  onAddVehicle?: () => void;
  isAdmin?: boolean;
  pendingUsersCount?: number; 
  onNotifyClick?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  vehicles, records, fuelRecords, currentUser, onQuickAction, onFuelAction, onStatsClick, onAddVehicle, isAdmin = false, pendingUsersCount = 0, onNotifyClick 
}) => {
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const isGlobalMode = currentUser.unit === 'GLOBAL';

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length,
    inUse: vehicles.filter(v => v.status === VehicleStatus.IN_USE).length,
    maintenance: vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length,
    defective: vehicles.filter(v => v.status === VehicleStatus.DEFECTIVE).length,
  };

  const generateBriefing = async () => {
    setIsAiLoading(true);
    try {
      const briefing = await getFleetBriefing(vehicles, records);
      setAiBriefing(briefing);
    } catch (e) {
      setAiBriefing("Erro ao gerar briefing via IA.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
      {/* HUB DE MISSÃO ATIVA */}
      {pendingUsersCount > 0 && (
        <div 
          onClick={onNotifyClick}
          className="bg-blue-600/10 border-2 border-blue-500/30 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer hover:bg-blue-600/20 transition-all group shadow-xl"
        >
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0 animate-pulse">⚡</div>
            <div>
              <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">Você está em serviço</h4>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Acesse o hub de missão para relatar avarias ou abastecer.</p>
            </div>
          </div>
          <button className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl tracking-widest group-hover:scale-105 transition-transform min-h-[52px]">
             Abrir Hub de Missão
          </button>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between gap-8 items-start xl:items-end">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <span className={`text-[8px] font-black text-white px-3 py-1.5 rounded-xl uppercase tracking-[0.2em] shadow-lg ${isGlobalMode ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                {isGlobalMode ? '🌐 ESTADO (GLOBAL)' : `📍 ${currentUser.unit}`}
              </span>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-500"></span>
           </div>
           <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none italic">Status <span className="text-blue-500">Real</span></h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 bg-[#0a0a0a] border border-blue-900/30 p-2 rounded-[28px] md:rounded-[32px] tactical-glow w-full xl:max-w-3xl shadow-2xl">
           <StatCard label="PRONTOS" value={stats.available} color="text-emerald-500" onClick={() => onStatsClick(VehicleStatus.AVAILABLE)} />
           <StatCard label="EM USO" value={stats.inUse} color="text-yellow-400" onClick={() => onStatsClick(VehicleStatus.IN_USE)} />
           <StatCard label="OFICINA" value={stats.maintenance} color="text-slate-400" onClick={() => onStatsClick(VehicleStatus.MAINTENANCE)} />
           <StatCard label="AVARIAS" value={stats.defective} color="text-rose-500" onClick={() => onStatsClick(VehicleStatus.DEFECTIVE)} />
        </div>
      </div>

      <div className="bg-[#0f172a]/50 border-2 border-blue-500/10 rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 text-6xl md:text-8xl opacity-5 rotate-12 group-hover:rotate-0 transition-transform">🤖</div>
         <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex-grow w-full">
               <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3 italic">Briefing Inteligente</h3>
               {aiBriefing ? (
                 <div className="mt-6 p-6 bg-black/40 rounded-[28px] border border-blue-500/20 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs md:text-sm font-bold text-blue-100/90 leading-relaxed uppercase whitespace-pre-wrap italic">{aiBriefing}</p>
                 </div>
               ) : (
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Gere uma análise operacional automatizada da frota ativa.</p>
               )}
            </div>
            <button 
              onClick={generateBriefing}
              disabled={isAiLoading}
              className="w-full lg:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[24px] text-[10px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-3 min-h-[56px]"
            >
              {isAiLoading ? <><div className="loader !w-3 !h-3"></div> Sincronizando...</> : 'Solicitar Briefing IA'}
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-10">
        <div className="xl:col-span-2 space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Disponíveis</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).slice(0, 4).map(v => (
                <QuickVehicleCard key={v.id} vehicle={v} action={() => onQuickAction(v)} btnLabel={`Assumir ${v.category}`} />
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Ativos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.filter(v => v.status === VehicleStatus.IN_USE).slice(0, 4).map(v => (
                <QuickVehicleCard key={v.id} vehicle={v} action={() => onQuickAction(v)} btnLabel="Finalizar" fuelAction={() => onFuelAction(v)} />
              ))}
            </div>
          </section>
        </div>

        <div className="bg-[#0a0a0a] border border-slate-800 rounded-[32px] md:rounded-[40px] p-8 flex flex-col shadow-2xl">
           <div className="mb-8">
              <h4 className="text-xl font-black text-white italic mb-2 tracking-tighter uppercase leading-none">Movimentações</h4>
              <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Tempo Real.</p>
           </div>
           <div className="space-y-4">
              {records.slice(0, 6).map(r => (
                <div key={r.id} className="text-[9px] font-black border-l-2 border-blue-600/40 pl-4 py-2 hover:bg-white/5 transition-all rounded-r-xl">
                   <div className="text-slate-200 uppercase">{r.driverName}</div>
                   <div className="text-blue-500/80 flex justify-between mt-1">
                     <span>{new Date(r.timestamp).toLocaleDateString()}</span>
                     <span className="opacity-60">{r.type}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: number, color: string, onClick: () => void }> = ({ label, value, color, onClick }) => (
  <button onClick={onClick} className="px-3 py-5 text-center hover:bg-white/5 transition-all rounded-2xl min-h-[80px] flex flex-col justify-center">
    <div className={`text-2xl md:text-3xl font-black ${color}`}>{value}</div>
    <div className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase mt-1 tracking-widest">{label}</div>
  </button>
);

const QuickVehicleCard: React.FC<{ vehicle: Vehicle, action: () => void, btnLabel: string, fuelAction?: () => void }> = ({ vehicle, action, btnLabel, fuelAction }) => (
  <div className="bg-[#0a0a0a] p-5 rounded-[28px] border border-slate-800 flex flex-col gap-5 shadow-xl hover:border-blue-500/30 transition-all group">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden border border-slate-800 flex-shrink-0 shadow-inner">
        <img src={vehicle.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
      </div>
      <div className="min-w-0">
        <div className="font-black text-white text-xs md:text-sm uppercase leading-none truncate">{vehicle.model}</div>
        <div className="text-[9px] text-blue-500 font-mono font-black mt-1 uppercase flex items-center gap-2">{vehicle.plate}</div>
      </div>
    </div>
    <div className="flex gap-2">
       <button onClick={action} className="flex-[4] py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg min-h-[48px] active:scale-95 transition-all">{btnLabel}</button>
       {fuelAction && (
         <button onClick={fuelAction} className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 hover:bg-slate-800 min-h-[48px] flex items-center justify-center">⛽</button>
       )}
    </div>
  </div>
);

export default Dashboard;
