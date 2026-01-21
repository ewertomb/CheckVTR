
import React, { useState, useMemo, useEffect } from 'react';
import { Vehicle, CheckRecord, FuelRecord, RecordType, UserRole, TireRecord, VehicleStatus, User } from '../types';
import RecordHistory from './RecordHistory';

interface MaintenanceManagementProps {
  vehicles: Vehicle[];
  records: CheckRecord[];
  fuelRecords: FuelRecord[];
  tireRecords: TireRecord[];
  onUpdateMaintenance: (vehicleId: string, componentKey: string, km: number, interval: number, alert: number, date: string) => void;
  onUpdateTire: (tireData: any) => void;
  onResolveObservations: (recordIds: string[]) => void;
  onUpdateObservation: (recordId: string, newNotes: string) => void;
  onDeletePhoto?: (recordId: string, photoUrl: string) => void;
  activeRole: UserRole;
  currentUser: User;
}

const MaintenanceManagement: React.FC<MaintenanceManagementProps> = ({ 
  vehicles, records, fuelRecords, tireRecords, onUpdateMaintenance, onUpdateTire, onResolveObservations, onUpdateObservation, onDeletePhoto, activeRole, currentUser 
}) => {
  const [activeTab, setActiveTab] = useState<'prontuario' | 'avarias' | 'historico'>('prontuario');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeComp, setActiveComp] = useState<{key: string, label: string, intKey: string, alertKey: string, dateKey: string} | null>(null);
  const [modalMode, setModalMode] = useState<'summary' | 'edit' | 'tire'>('summary');
  const [viewHistoryVehicle, setViewHistoryVehicle] = useState<Vehicle | null>(null);
  
  const isAdmin = activeRole === UserRole.ADMIN || activeRole === UserRole.PROGRAMMER;

  // Estados para Manutenção
  const [tireForm, setTireForm] = useState<Partial<TireRecord>>({
    prevRequestKm: 0,
    requestKm: 0,
    officeKm: 0,
    requestDate: new Date().toISOString(),
    requestStatus: 'OK',
    actualChangeKm: 0,
    changeDate: new Date().toISOString(),
  });

  const [serviceKm, setServiceKm] = useState<number>(0);
  const [selectedInterval, setSelectedInterval] = useState<number>(10000);
  const [serviceDate, setServiceDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const pendingObservations = useMemo(() => {
    return records
      .filter(r => r.notes && r.notes.trim() !== '' && !r.isResolved)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [records]);

  const getStatus = (currentKm: number, lastKm: number | undefined, interval: number, alertThreshold: number = 1000) => {
    const safeLast = lastKm || 0;
    const driven = currentKm - safeLast;
    const remaining = interval - driven;
    
    if (remaining <= 0) return { 
      color: 'bg-rose-600/10 text-rose-500 border-rose-500/50', 
      bgActive: 'bg-rose-600 text-white',
      textMain: 'text-rose-500',
      label: 'VENCIDO', 
      critical: true,
      driven
    };
    if (remaining <= alertThreshold) return { 
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/50', 
      bgActive: 'bg-amber-500 text-black',
      textMain: 'text-amber-400', 
      label: 'ALERTA', 
      critical: false,
      driven
    };
    return { 
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50', 
      bgActive: 'bg-emerald-500 text-white',
      textMain: 'text-emerald-400', 
      label: 'OK', 
      critical: false,
      driven
    };
  };

  const components = [
    { key: 'lastKmOil', dateKey: 'lastDateOil', label: 'Óleo', intKey: 'intOil', alertKey: 'alertOil' },
    { key: 'lastKmRevision', dateKey: 'lastDateRevision', label: 'Revisão', intKey: 'intRevision', alertKey: 'alertRevision' },
    { key: 'lastKmFrontTire', dateKey: 'lastDateFrontTire', label: 'Pneu D', intKey: 'intFrontTire', alertKey: 'alertFrontTire' },
    { key: 'lastKmRearTire', dateKey: 'lastDateRearTire', label: 'Pneu T', intKey: 'intRearTire', alertKey: 'alertRearTire' },
    { key: 'lastKmFrontBrake', dateKey: 'lastDateFrontBrake', label: 'Past. D', intKey: 'intFrontBrake', alertKey: 'alertFrontBrake' },
    { key: 'lastKmRearBrake', dateKey: 'lastDateRearBrake', label: 'Past. T', intKey: 'intRearBrake', alertKey: 'alertRearBrake' },
    { key: 'lastKmAlignment', dateKey: 'lastDateAlignment', label: 'Alinh.', intKey: 'intAlignment', alertKey: 'alertAlignment' },
    { key: 'lastKmBrakeFluid', dateKey: 'lastDateBrakeFluid', label: 'Fluido F.', intKey: 'intBrakeFluid', alertKey: 'alertBrakeFluid' },
    { key: 'lastKmTransmission', dateKey: 'lastDateTransmission', label: 'Câmbio', intKey: 'intTransmission', alertKey: 'alertTransmission' }
  ];

  const handleOpenSummary = (v: Vehicle, comp: typeof components[0]) => {
    setSelectedVehicle(v);
    setActiveComp(comp);
    
    if (comp.label.includes('Pneu')) {
      const type = comp.label.includes('D') ? 'FRONT' : 'REAR';
      const lastRec = (tireRecords || []).filter(t => t.vehicleId === v.id && t.tireType === type).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      if (lastRec) {
        setTireForm({ ...lastRec });
      } else {
        setTireForm({
          vehicleId: v.id,
          tireType: type,
          prevRequestKm: 0,
          requestKm: v.lastMaintenanceKm || 0,
          officeKm: 0,
          requestDate: new Date().toISOString(),
          requestStatus: 'OK',
          actualChangeKm: 0,
          changeDate: '',
        });
      }
      setModalMode('tire');
    } else {
      setModalMode('summary');
    }
    
    setServiceKm(v.lastMaintenanceKm || 0);
    setSelectedInterval((v as any)[comp.intKey] || (v.category === 'VTR' ? 10000 : 3000));
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setServiceDate(now.toISOString().slice(0, 16));
  };

  const handleSaveTire = () => {
    if (!selectedVehicle || !activeComp) return;
    const interval = selectedVehicle.category === 'VTR' ? 15000 : 8000;
    const finalData = {
      ...tireForm,
      nextRequestKm: (tireForm.requestKm || 0) + interval,
      nextChangeKm: (tireForm.actualChangeKm || 0) + interval
    };
    onUpdateTire(finalData);
    onUpdateMaintenance(selectedVehicle.id, activeComp.key, tireForm.actualChangeKm || tireForm.requestKm || 0, interval, 1000, tireForm.changeDate || tireForm.requestDate || '');
    setSelectedVehicle(null);
  };

  const vehicleHistory = useMemo(() => {
    if (!viewHistoryVehicle) return [];
    return records.filter(r => r.vehicleId === viewHistoryVehicle.id)
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [viewHistoryVehicle, records]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      {/* HEADER E TABS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none italic">Controle de Oficina</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 italic">Monitoramento técnico e gestão de fotos</p>
        </div>
        
        <div className="flex bg-[#0a0a0a] border border-slate-800 p-1.5 rounded-2xl shadow-xl w-full md:w-auto">
          <button onClick={() => setActiveTab('prontuario')} className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'prontuario' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Prontuário</button>
          <button onClick={() => setActiveTab('avarias')} className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'avarias' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>
            Vícios
            {pendingObservations.length > 0 && <span className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-amber-500 text-slate-950 font-black text-[8px] rounded-full animate-pulse">{pendingObservations.length}</span>}
          </button>
          <button onClick={() => setActiveTab('historico')} className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'historico' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Fotos</button>
        </div>
      </div>

      {activeTab === 'prontuario' && (
        <div className="space-y-8">
          <div className="hidden lg:block bg-[#0a0a0a] rounded-[44px] border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-center border-collapse">
                <thead className="bg-[#0f172a] text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-6 text-left sticky left-0 z-20 bg-[#0f172a] border-r border-slate-800">Viatura</th>
                    {components.map(c => <th key={c.key} className="px-2 py-6 uppercase">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {vehicles.map(v => (
                    <tr key={v.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5 text-left sticky left-0 z-10 bg-[#0a0a0a] group-hover:bg-[#0f172a] border-r border-slate-800">
                        <div className="flex items-center gap-4">
                          <div className="font-black text-white text-xs uppercase">{v.model}</div>
                          <div className="text-[10px] font-mono font-black text-blue-500 uppercase">{v.plate}</div>
                        </div>
                      </td>
                      {components.map(comp => {
                        const lastKmValue = (v as any)[comp.key] || 0;
                        const interval = (v as any)[comp.intKey] || (v.category === 'VTR' ? 10000 : 3000);
                        const status = getStatus(v.lastMaintenanceKm || 0, lastKmValue, interval);
                        return (
                          <td key={comp.key} className="p-2">
                            <button onClick={() => handleOpenSummary(v, comp)} className={`w-full p-4 rounded-[24px] border transition-all hover:scale-105 active:scale-95 text-center flex flex-col items-center justify-center gap-1 ${status.color}`}>
                              <span className="text-[10px] font-bold text-white mb-1">{(lastKmValue || 0).toLocaleString()}</span>
                              <div className={`px-2 py-0.5 rounded text-[8px] font-black ${status.textMain} bg-black/20`}>{status.label}</div>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'avarias' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {pendingObservations.length > 0 ? pendingObservations.map(obs => (
             <div key={obs.id} className="bg-[#0a0a0a] border border-slate-800 rounded-[32px] p-8 space-y-6 tactical-glow">
                <div className="flex justify-between items-start">
                   <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{obs.driverName}</div>
                   <div className="text-[9px] font-black text-slate-600 uppercase">{new Date(obs.timestamp).toLocaleDateString()}</div>
                </div>
                <p className="text-sm font-bold text-slate-300 uppercase italic">"{obs.notes}"</p>
                {isAdmin && <button onClick={() => onResolveObservations([obs.id])} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl text-[9px] uppercase tracking-widest shadow-xl">Baixa Técnica</button>}
             </div>
           )) : (
             <div className="col-span-full py-20 text-center bg-[#0a0a0a] rounded-[44px] border border-dashed border-slate-800">
                <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.4em]">Nenhuma avaria pendente</p>
             </div>
           )}
        </div>
      )}

      {activeTab === 'historico' && (
        <RecordHistory 
          records={records} 
          vehicles={vehicles} 
          currentUser={currentUser} 
          activeRole={activeRole} 
          onDeletePhoto={onDeletePhoto}
        />
      )}

      {/* MODAL Manutenção Comum */}
      {selectedVehicle && activeComp && modalMode === 'summary' && (
         <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[1000] flex items-center justify-center p-4">
           <div className="bg-[#0a0a0a] border border-blue-900/30 rounded-[48px] p-8 md:p-12 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300">
              <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 italic">Operação: {activeComp.label}</h4>
              <p className="text-[10px] text-slate-500 font-black uppercase mb-8">REFERÊNCIA: {((selectedVehicle as any)[activeComp.key] || 0).toLocaleString()} KM</p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Odômetro da Troca</label>
                  <input type="number" value={serviceKm || ''} onChange={e => setServiceKm(Number(e.target.value))} className="w-full px-6 py-5 rounded-2xl bg-black border border-slate-800 text-white font-black text-2xl outline-none focus:border-blue-500" />
                </div>
                <button 
                  onClick={() => { onUpdateMaintenance(selectedVehicle.id, activeComp.key, serviceKm, selectedInterval, 1000, serviceDate); setSelectedVehicle(null); }}
                  className="w-full py-6 bg-blue-600 text-white font-black rounded-[32px] uppercase text-[12px] shadow-2xl active:scale-95 transition-all"
                >
                  Registrar Prontuário
                </button>
                <button onClick={() => setSelectedVehicle(null)} className="w-full py-4 text-slate-500 font-black uppercase text-[10px]">Voltar</button>
              </div>
           </div>
         </div>
      )}
    </div>
  );
};

export default MaintenanceManagement;
