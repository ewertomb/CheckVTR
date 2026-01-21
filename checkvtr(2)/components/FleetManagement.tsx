
import React, { useState } from 'react';
import { Vehicle, VehicleStatus, CheckRecord } from '../types';

interface FleetManagementProps {
  vehicles: Vehicle[];
  allRecords: CheckRecord[];
  onUpdateStatus: (id: string, status: VehicleStatus, notes?: string) => void;
  onDeleteVehicle: (id: string) => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onResolveDefect: (vehicleId: string, notes: string) => void;
  onReturnVehicle: (vehicle: Vehicle) => void;
}

const FleetManagement: React.FC<FleetManagementProps> = ({ 
  vehicles, 
  allRecords, 
  onUpdateStatus, 
  onDeleteVehicle, 
  onEditVehicle,
  onResolveDefect,
  onReturnVehicle
}) => {
  const [defectModal, setDefectModal] = useState<{ vehicleId: string, status: VehicleStatus } | null>(null);
  const [defectNotes, setDefectNotes] = useState('');
  
  const [resolveModal, setResolveModal] = useState<Vehicle | null>(null);
  const [resNotes, setResNotes] = useState('');

  const handleStatusChange = (vehicleId: string, newStatus: VehicleStatus) => {
    if (newStatus === VehicleStatus.DEFECTIVE) {
      setDefectModal({ vehicleId, status: newStatus });
    } else {
      onUpdateStatus(vehicleId, newStatus);
    }
  };

  const confirmDefect = () => {
    if (!defectNotes.trim()) return alert('Descreva o defeito para registro.');
    if (defectModal) {
      onUpdateStatus(defectModal.vehicleId, defectModal.status, defectNotes);
      setDefectModal(null);
      setDefectNotes('');
    }
  };

  const confirmResolve = () => {
    if (!resNotes.trim()) return alert('Descreva o que foi feito para resolver o problema.');
    if (resolveModal) {
      onResolveDefect(resolveModal.id, resNotes);
      setResolveModal(null);
      setResNotes('');
    }
  };

  const getLastObservation = (vehicleId: string) => {
    const lastRec = allRecords
      .filter(r => r.vehicleId === vehicleId && r.notes)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    return lastRec ? lastRec.notes : 'Sem observações recentes';
  };

  const getStatusStyle = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.AVAILABLE: return 'bg-emerald-500 text-white border-emerald-600';
      case VehicleStatus.IN_USE: return 'bg-orange-500 text-white border-orange-600';
      case VehicleStatus.MAINTENANCE: return 'bg-slate-700 text-white border-slate-800';
      case VehicleStatus.DEFECTIVE: return 'bg-red-500 text-white border-red-600';
      default: return 'bg-slate-500 text-white border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">VTR / MR</th>
                <th className="px-6 py-4">Status Atual (Mudar)</th>
                <th className="px-6 py-4">Condutor Atual</th>
                <th className="px-6 py-4">Última Observação</th>
                <th className="px-6 py-4 text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {vehicles.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                        <img src={v.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{v.model}</div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase">{v.plate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative w-44">
                      <select 
                        value={v.status}
                        onChange={(e) => handleStatusChange(v.id, e.target.value as VehicleStatus)}
                        className={`w-full pl-4 pr-10 py-2 rounded-xl text-[11px] font-bold border-2 transition-all cursor-pointer appearance-none outline-none shadow-sm ${getStatusStyle(v.status)}`}
                      >
                        {Object.values(VehicleStatus).map(s => <option key={s} value={s} className="bg-white text-slate-800">{s}</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-80">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {v.currentDriver ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                          {v.currentDriver.charAt(0)}
                        </div>
                        <span className="font-medium text-blue-700">{v.currentDriver}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Nenhum</span>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-xs text-slate-600 line-clamp-2 italic" title={getLastObservation(v.id)}>
                      "{getLastObservation(v.id)}"
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {v.status === VehicleStatus.IN_USE && (
                        <button 
                          onClick={() => onReturnVehicle(v)}
                          className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-600 hover:text-white transition-all group"
                          title="Devolver Manualmente"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                        </button>
                      )}
                      {v.status === VehicleStatus.DEFECTIVE && (
                        <button 
                          onClick={() => setResolveModal(v)}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                          title="Resolver Problema"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </button>
                      )}
                      <button 
                        onClick={() => onEditVehicle(v)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                        title="Editar Veículo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button 
                        onClick={() => onDeleteVehicle(v.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                        title="Excluir Veículo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Relatar Defeito Manual */}
      {defectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] shadow-2xl animate-in zoom-in-95 flex flex-col">
            <div className="p-8 bg-red-50 rounded-t-3xl border-b border-red-100 flex-shrink-0">
              <h4 className="text-xl font-bold text-red-900">Registro Manual de Defeito</h4>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <textarea 
                autoFocus
                value={defectNotes}
                onChange={(e) => setDefectNotes(e.target.value)}
                placeholder="Descreva o motivo da alteração de status para 'Com Defeito'..."
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-red-500 outline-none h-32 resize-none"
              />
            </div>
            <div className="p-8 pt-0 flex gap-3 flex-shrink-0">
              <button onClick={() => setDefectModal(null)} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl">Cancelar</button>
              <button onClick={confirmDefect} className="flex-[2] py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200">Confirmar Alteração</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resolver Defeito */}
      {resolveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] shadow-2xl animate-in zoom-in-95 flex flex-col">
            <div className="p-8 bg-emerald-50 rounded-t-3xl border-b border-emerald-100 flex-shrink-0">
              <h4 className="text-xl font-bold text-emerald-900">Liberação de Veículo</h4>
              <p className="text-xs text-emerald-700 font-bold uppercase tracking-widest">{resolveModal.plate}</p>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <textarea 
                autoFocus
                value={resNotes}
                onChange={(e) => setResNotes(e.target.value)}
                placeholder="Relate o que foi executado para a resolução do problema e liberação do recurso..."
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 outline-none h-32 resize-none"
              />
            </div>
            <div className="p-8 pt-0 flex gap-3 flex-shrink-0">
              <button onClick={() => setResolveModal(null)} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl">Voltar</button>
              <button onClick={confirmResolve} className="flex-[2] py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200">Resolver & Liberar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
