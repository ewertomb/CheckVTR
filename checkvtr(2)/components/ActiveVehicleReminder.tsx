
import React from 'react';
import { Vehicle } from '../types';

interface ActiveVehicleReminderProps {
  vehicle: Vehicle;
  onReturn: (vehicle: Vehicle) => void;
  onDismiss: () => void;
}

const ActiveVehicleReminder: React.FC<ActiveVehicleReminderProps> = ({ vehicle, onReturn, onDismiss }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-lg max-h-[90vh] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 flex flex-col">
        <div className="bg-orange-500 p-6 text-white text-center relative flex-shrink-0">
          <div className="absolute top-4 right-4">
            <button onClick={onDismiss} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-xl font-bold uppercase tracking-tight">Utilização em Aberto</h3>
          <p className="text-orange-100 text-sm">Identificamos que você ainda possui um veículo vinculado.</p>
        </div>
        
        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-grow">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 shadow-sm">
              <img src={vehicle.image} className="w-full h-full object-cover" alt={vehicle.model} />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800">{vehicle.model}</div>
              <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">{vehicle.plate}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-[10px] font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                Status: Em Uso por Você
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-500 leading-relaxed italic text-center px-4">
            "Para manter o controle de frota atualizado, recomendamos realizar a devolução assim que encerrar o trajeto."
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => onReturn(vehicle)}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
            >
              <span>REALIZAR DEVOLUÇÃO AGORA</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
            <button 
              onClick={onDismiss}
              className="w-full py-3 text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors uppercase tracking-widest"
            >
              Continuar navegando no sistema
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveVehicleReminder;
