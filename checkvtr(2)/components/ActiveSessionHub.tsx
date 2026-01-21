
import React, { useMemo, useState, useRef } from 'react';
import { Vehicle, FuelRecord } from '../types';

interface ActiveSessionHubProps {
  vehicle: Vehicle;
  fuelRecords: FuelRecord[];
  onReturn: () => void;
  onFuel: () => void;
  onContinue: () => void;
  onReportIssue: (notes: string, photos: string[]) => void;
}

const ActiveSessionHub: React.FC<ActiveSessionHubProps> = ({ vehicle, fuelRecords, onReturn, onFuel, onContinue, onReportIssue }) => {
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueNotes, setIssueNotes] = useState('');
  const [issuePhotos, setIssuePhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const fuelInfo = useMemo(() => {
    const vFuels = fuelRecords.filter(f => f.vehicleId === vehicle.id);
    if (vFuels.length === 0) return { balance: null, isCritical: false };
    const balance = vFuels.sort((a, b) => b.kmAtRefueling - a.kmAtRefueling)[0].remainingBalance;
    const isCritical = (vehicle.category === 'VTR' && balance < 500) || (vehicle.category === 'MR' && balance < 100);
    return { balance, isCritical };
  }, [fuelRecords, vehicle]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { 
      if (issuePhotos.length < 4) setIssuePhotos(prev => [...prev, reader.result as string]); 
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleIssueSubmit = () => {
    if (!issueNotes.trim()) return;
    setIsSubmitting(true);
    // Simula um pequeno delay para feedback visual
    setTimeout(() => {
      onReportIssue(issueNotes.toUpperCase(), issuePhotos);
      setIssueNotes('');
      setIssuePhotos([]);
      setShowIssueModal(false);
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-2 animate-in fade-in zoom-in-95 duration-500">
      <div className="max-w-xl w-full bg-[#0a0a0a] rounded-[48px] border-2 border-blue-500/30 shadow-2xl overflow-hidden tactical-glow">
        <div className="bg-gradient-to-br from-blue-600 to-blue-900 p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-8xl opacity-10 rotate-12">🚓</div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2 leading-none">Missão em Curso</h2>
            <div className="inline-block bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-blue-100">Controle Ativo de Frota</div>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-10">
          <div className="flex items-center gap-6 p-6 bg-slate-900/50 rounded-[32px] border border-slate-800">
            <div className="w-24 h-24 rounded-[24px] bg-black border border-slate-800 overflow-hidden shadow-2xl flex-shrink-0">
              <img src={vehicle.image} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="overflow-hidden flex-grow">
              <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none truncate">{vehicle.model}</h3>
              <p className="text-blue-500 font-mono font-bold tracking-widest uppercase mt-2">{vehicle.plate}</p>
              
              <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${fuelInfo.isCritical ? 'bg-rose-950/40 border-rose-500/50 animate-pulse' : 'bg-emerald-950/40 border-emerald-500/20'}`}>
                <span className={fuelInfo.isCritical ? 'text-rose-500' : 'text-emerald-500'}>⛽</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${fuelInfo.isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
                  Saldo: {fuelInfo.balance !== null ? `R$ ${fuelInfo.balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'NÃO INFORMADO'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button onClick={onReturn} className="group relative w-full p-8 rounded-[32px] bg-yellow-400 hover:bg-yellow-300 transition-all shadow-xl text-left active:scale-95">
              <div className="relative z-10 flex items-center justify-between">
                <div><h4 className="text-xl font-black text-slate-950 uppercase tracking-tighter mb-1">Encerrar Missão</h4><p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Realizar devolução da VTR/MR</p></div>
                <span className="text-3xl">🏁</span>
              </div>
            </button>
            
            {/* Botão de Relato de Avaria em curso */}
            <button onClick={() => setShowIssueModal(true)} className="group relative w-full p-8 rounded-[32px] bg-rose-600/10 border-2 border-rose-500/30 hover:bg-rose-600/20 transition-all shadow-xl text-left active:scale-95">
              <div className="relative z-10 flex items-center justify-between">
                <div><h4 className="text-xl font-black text-rose-500 uppercase tracking-tighter mb-1">Relatar Avaria</h4><p className="text-[10px] font-bold text-rose-400/70 uppercase tracking-widest">Informar defeito durante o uso</p></div>
                <span className="text-3xl">⚠️</span>
              </div>
            </button>

            <button onClick={onFuel} className="group relative w-full p-8 rounded-[32px] bg-[#1a1a1a] border-2 border-blue-500/20 hover:border-blue-500 transition-all shadow-xl text-left active:scale-95">
              <div className="relative z-10 flex items-center justify-between">
                <div><h4 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Abastecimento</h4><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Registrar consumo de combustível</p></div>
                <span className="text-3xl">⛽</span>
              </div>
            </button>
          </div>
          <div className="pt-6 text-center"><button onClick={onContinue} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.3em]">Ignorar e Ir para o Painel ➔</button></div>
        </div>
      </div>

      {/* Modal de Relato de Avaria */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[4000] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-rose-500/30 rounded-[48px] p-8 md:p-12 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
             <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-4xl shadow-inner">⚠️</div>
                <div>
                   <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Relato de Avaria</h4>
                   <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2">Ocorrência Tática • {vehicle.plate}</p>
                </div>
             </div>

             <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição do Problema</label>
                   <textarea 
                     value={issueNotes} 
                     onChange={(e) => setIssueNotes(e.target.value.toUpperCase())}
                     placeholder="DESCREVA O DEFEITO OU AVARIA CONSTATADA..."
                     className="w-full px-6 py-4 rounded-2xl bg-black border-2 border-slate-800 text-white font-bold text-sm outline-none focus:border-rose-500 transition-all h-32 resize-none uppercase shadow-inner"
                   />
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Evidência Fotográfica ({issuePhotos.length}/4)</label>
                   <div className="grid grid-cols-2 gap-3">
                      {issuePhotos.map((p, idx) => (
                        <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 group">
                           <img src={p} className="w-full h-full object-cover" alt="" />
                           <button onClick={() => setIssuePhotos(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 bg-rose-600 p-1.5 rounded-lg text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3"/></svg>
                           </button>
                        </div>
                      ))}
                      {issuePhotos.length < 4 && (
                        <>
                          <button onClick={() => cameraInputRef.current?.click()} className="aspect-video bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-rose-500/50 transition-all text-slate-500 hover:text-rose-500">
                             <span className="text-xl">📸</span>
                             <span className="text-[8px] font-black uppercase tracking-widest">Câmera</span>
                          </button>
                          <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                        </>
                      )}
                   </div>
                </div>
             </div>

             <div className="pt-8 mt-4 border-t border-slate-800 flex gap-4">
                <button 
                  disabled={isSubmitting}
                  onClick={() => setShowIssueModal(false)} 
                  className="flex-1 py-5 bg-slate-900 text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-widest active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  disabled={isSubmitting || !issueNotes.trim()}
                  onClick={handleIssueSubmit}
                  className={`flex-[2] py-5 font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${issueNotes.trim() ? 'bg-rose-600 text-white shadow-rose-500/20 hover:bg-rose-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ENVIANDO...
                    </>
                  ) : 'REGISTRAR AVARIA'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveSessionHub;
