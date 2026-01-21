
import React, { useState, useMemo, useEffect } from 'react';
import { Vehicle, User, FuelRecord, UserRole, CheckRecord } from '../types';

interface FuelFormProps {
  vehicle: Vehicle | null;
  vehicles: Vehicle[];
  users: User[];
  currentUser: User;
  activeRole: UserRole;
  allRecords: CheckRecord[];
  fuelRecords: FuelRecord[];
  initialData?: FuelRecord;
  onSubmit: (record: Omit<FuelRecord, 'id' | 'unit'>) => void;
  onCancel: () => void;
}

const FuelForm: React.FC<FuelFormProps> = ({ vehicle, vehicles, users, currentUser, activeRole, allRecords, fuelRecords, initialData, onSubmit, onCancel }) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialData?.vehicleId || vehicle?.id || '');
  
  const isActivelyManager = activeRole === UserRole.ADMIN || 
                            activeRole === UserRole.PROGRAMMER || 
                            activeRole === UserRole.PERMANENTE;

  const [driverName, setDriverName] = useState(() => {
    if (initialData) return initialData.driverName;
    if (!isActivelyManager) return currentUser.name;
    return vehicle?.currentDriver || currentUser.name;
  });

  const [date, setDate] = useState(() => {
    if (initialData) {
      const d = new Date(initialData.date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    }
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  
  const [liters, setLiters] = useState<number | ''>(initialData?.liters || '');
  const [totalValue, setTotalValue] = useState<number | ''>(initialData?.totalValue || '');
  const [remainingBalance, setRemainingBalance] = useState<number | ''>(initialData?.remainingBalance || '');
  const [kmAtRefueling, setKmAtRefueling] = useState<number | ''>(initialData?.kmAtRefueling || '');

  // Lógica para encontrar o último abastecimento como lembrete
  const lastFuel = useMemo(() => {
    if (!selectedVehicleId) return null;
    return fuelRecords
      .filter(f => f.vehicleId === selectedVehicleId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [selectedVehicleId, fuelRecords]);

  useEffect(() => {
    if (!initialData && selectedVehicleId) {
      // Sugere o KM atual do veículo ou o último de inspeção como ponto de partida
      const lastRec = allRecords
        .filter(r => r.vehicleId === selectedVehicleId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      if (lastRec) {
        setKmAtRefueling(lastRec.kmReading);
      } else {
        const v = vehicles.find(veh => veh.id === selectedVehicleId);
        setKmAtRefueling(v?.lastMaintenanceKm || 0);
      }

      if (isActivelyManager) {
        const v = vehicles.find(veh => veh.id === selectedVehicleId);
        if (v?.currentDriver) setDriverName(v.currentDriver);
      }
    }
  }, [selectedVehicleId, allRecords, isActivelyManager, vehicles, initialData]);
  
  const pricePerLiter = useMemo(() => {
    if (typeof liters === 'number' && typeof totalValue === 'number' && liters > 0) {
      return (totalValue / liters).toFixed(3);
    }
    return '0.000';
  }, [liters, totalValue]);

  // Validação inteligente de KM vs Data Retroativa
  const isKmValid = useMemo(() => {
    if (kmAtRefueling === '' || !lastFuel) return true;
    
    const selectedDate = new Date(date);
    const lastFuelDate = new Date(lastFuel.date);
    
    // Se a data que estou digitando é ANTERIOR à data do último abastecimento no sistema, 
    // então eu DEVO permitir que o KM seja inferior (pois é um registro retroativo esquecido)
    if (selectedDate < lastFuelDate) {
      return true; 
    }
    
    // Se for na mesma data ou posterior, o KM deve ser igual ou maior que o último
    return Number(kmAtRefueling) >= lastFuel.kmAtRefueling;
  }, [kmAtRefueling, date, lastFuel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) return alert("Por favor, selecione um veículo.");
    if (!liters || !totalValue || kmAtRefueling === '') return alert("Preencha todos os campos obrigatórios.");

    if (!isKmValid) {
      const confirmForce = window.confirm(`Atenção: O KM informado (${kmAtRefueling}) é inferior ao último abastecimento registrado (${lastFuel?.kmAtRefueling}). Se este for um registro RETROATIVO, ajuste a data para antes de ${new Date(lastFuel!.date).toLocaleDateString()}. Deseja prosseguir mesmo assim?`);
      if (!confirmForce) return;
    }

    onSubmit({
      vehicleId: selectedVehicleId,
      driverName: driverName,
      date: new Date(date).toISOString(),
      liters: Number(liters),
      totalValue: Number(totalValue),
      remainingBalance: Number(remainingBalance || 0),
      kmAtRefueling: Number(kmAtRefueling)
    });
  };

  return (
    <div className="fixed inset-0 sm:relative sm:inset-auto z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/95 sm:bg-transparent backdrop-blur-xl sm:backdrop-blur-none">
      <div className="w-full max-w-2xl bg-[#0a0a0a] rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden border-t sm:border border-slate-800 animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[92vh]">
        <div className="bg-slate-900 p-6 md:p-10 text-white flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-tight italic">Consumo de VTR</h3>
            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">Lançamento de Abastecimento</p>
          </div>
          <div className="text-3xl md:text-4xl opacity-50">⛽</div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* PAINEL DE LEMBRETE DE ÚLTIMO REGISTRO */}
          {lastFuel && (
            <div className="bg-blue-600/10 border-2 border-blue-500/20 rounded-3xl p-5 mb-4 animate-in fade-in zoom-in-95 duration-500">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Parâmetro de Último Abastecimento</span>
                  <span className="text-[8px] font-black text-slate-500 uppercase">{new Date(lastFuel.date).toLocaleDateString()}</span>
               </div>
               <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-white">{lastFuel.kmAtRefueling.toLocaleString()}</span>
                  <span className="text-[10px] font-black text-blue-500 uppercase mb-1">KM Registrados</span>
               </div>
               <p className="text-[7px] text-slate-500 font-bold uppercase mt-2 italic">* Use este valor como base. Para registros retroativos, altere a data abaixo.</p>
            </div>
          )}

          <div className="space-y-6 pb-6">
            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Viatura / MR</label>
              <select 
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-slate-900 border-2 border-slate-800 text-white font-black outline-none focus:border-blue-500 appearance-none uppercase text-xs min-h-[56px]"
                required
                disabled={!!vehicle || !!initialData}
              >
                <option value="" disabled>-- SELECIONE --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} className="bg-[#0a0a0a] text-white">{v.plate} - {v.model}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Data/Hora</label>
                <input 
                  type="datetime-local" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-900 border-2 border-slate-800 text-white font-black outline-none focus:border-blue-500 text-xs min-h-[56px]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">KM Rodado Atual</label>
                <input 
                  type="number" 
                  value={kmAtRefueling}
                  onChange={(e) => setKmAtRefueling(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="00000"
                  className={`w-full px-5 py-4 rounded-2xl bg-slate-900 border-2 text-white font-black placeholder:text-slate-700 outline-none transition-all text-xs min-h-[56px] ${!isKmValid ? 'border-amber-500 bg-amber-500/5' : 'border-slate-800 focus:border-blue-500'}`}
                  required
                />
                {!isKmValid && (
                  <p className="text-[7px] font-black text-amber-500 uppercase mt-1 animate-pulse">KM Retroativo detectado pela data informada.</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Responsável</label>
              {isActivelyManager ? (
                <select 
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-900 border-2 border-slate-800 text-white font-black outline-none focus:border-blue-500 appearance-none uppercase text-xs min-h-[56px]"
                >
                  <option value={driverName}>{driverName}</option>
                  <optgroup label="EFETIVO DA BASE" className="bg-[#0a0a0a]">
                    {users.filter(u => u.name !== driverName).map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </optgroup>
                </select>
              ) : (
                <div className="relative">
                  <input 
                    type="text" 
                    value={driverName} 
                    readOnly 
                    className="w-full px-5 py-4 rounded-2xl bg-slate-900 border-2 border-slate-900 text-slate-500 font-black cursor-not-allowed uppercase text-xs min-h-[56px]"
                  />
                </div>
              )}
            </div>

            <div className="p-6 md:p-8 bg-blue-900/10 rounded-[32px] border border-blue-500/20 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[8px] font-black text-blue-500/60 uppercase ml-1">Volume (L)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={liters}
                    onChange={(e) => setLiters(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-5 py-4 rounded-xl bg-slate-900 border border-blue-900/40 text-white font-black outline-none focus:border-blue-500 text-xs min-h-[52px]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[8px] font-black text-blue-500/60 uppercase ml-1">Total Pago (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-5 py-4 rounded-xl bg-slate-900 border border-blue-900/40 text-white font-black outline-none focus:border-blue-500 text-xs min-h-[52px]"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-between items-baseline pt-4 border-t border-blue-900/20">
                 <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest italic">KM/L Estimado:</span>
                 <span className="text-2xl font-black text-white">R$ {pricePerLiter}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Novo Saldo Cartão (R$)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-700 text-sm">R$</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={remainingBalance}
                  onChange={(e) => setRemainingBalance(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-900 border-2 border-slate-800 text-white font-black placeholder:text-slate-800 outline-none focus:border-emerald-500 text-sm min-h-[56px]"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <button type="button" onClick={onCancel} className="w-full sm:flex-1 py-4 bg-slate-900 text-slate-500 font-black rounded-2xl uppercase text-[10px] min-h-[56px] order-2 sm:order-1">Cancelar</button>
            <button type="submit" className="w-full sm:flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase text-[10px] min-h-[56px] order-1 sm:order-2 active:scale-95 transition-all">Registrar Consumo</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FuelForm;
