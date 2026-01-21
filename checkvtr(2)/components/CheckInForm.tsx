
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Vehicle, RecordType, VehicleStatus, User, UserRole, CheckRecord } from '../types';
import ImageGalleryModal from './ImageGalleryModal';
import { analyzeVehicleCondition } from '../geminiService';

interface CheckInFormProps {
  vehicle: Vehicle;
  onSubmit: (record: any) => void;
  onCancel: () => void;
  lastRecord: CheckRecord | null | undefined;
  users: User[];
  currentUser: User;
  activeRole: UserRole;
  allRecords: CheckRecord[];
  fuelRecords: any[];
}

const REASON_OPTIONS = [
  { id: 'OPERACIONAL', label: 'Operacional', icon: '👮', desc: 'Patrulhamento e Missões' },
  { id: 'MANUTENÇÃO', label: 'Manutenção', icon: '🔧', desc: 'Oficina ou Reparos' },
  { id: 'DESLOCAMENTO', label: 'Deslocamento', icon: '🛣️', desc: 'Viagens Administrativas' },
  { id: 'ACAUTELADO', label: 'Acautelado', icon: '🏠', desc: 'Uso em Residência' },
];

const VTR_CHECKLIST_ITEMS = [
  "Farol Esq.", "Farol Dir.", "Lanterna Esq.", "Lanterna Dir.", "Retrovisor Esq.", "Retrovisor Dir.", 
  "Retrovisor Interno", "Vidros Laterais", "Intermitentes", "Sinais Sonoros", "Para-brisa Dianteiro", 
  "Para-brisa Traseiro", "Limpador de Para-brisas", "Placa Dianteira/Traseira", "Cartão de Abastecimento", 
  "Limpeza Interior", "Limpeza Exterior", "Estofamento Bancos", "Macaco e alongadores", 
  "Chave de Roda original", "Estepe", "Triângulo", "Rádio Comunicação", "Nível de Óleo Motor", 
  "Nível de óleo Freios", "Água limp. para-brisa", "Ar condicionado", "Antena", "Chave de roda extra", 
  "Chave de roda em cruz", "Mão de força", "Chupeta"
];

const CheckInForm: React.FC<CheckInFormProps> = ({ 
  vehicle, onSubmit, onCancel, lastRecord, users, currentUser, activeRole, allRecords 
}) => {
  const isCheckout = vehicle.status === VehicleStatus.AVAILABLE || vehicle.status === VehicleStatus.DEFECTIVE;
  const isAdmin = activeRole === UserRole.ADMIN || activeRole === UserRole.PROGRAMMER;
  const isPermanente = activeRole === UserRole.PERMANENTE;
  const isVTR = vehicle.category === 'VTR';
  
  const canDelegate = isPermanente || isAdmin;

  const [showBriefing, setShowBriefing] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [galleryState, setGalleryState] = useState<{ photos: string[], index: number } | null>(null);

  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState(isCheckout ? 'OPERACIONAL' : (lastRecord?.reason || ''));
  
  // A quilometragem base é sempre o maior valor registrado no veículo (lastMaintenanceKm centraliza isso)
  const [kmReading, setKmReading] = useState<number>(vehicle.lastMaintenanceKm || 0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [isForSelf, setIsForSelf] = useState(true);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(currentUser.id);
  const [manualDriverName, setManualDriverName] = useState('');
  const [isManualDriver, setIsManualDriver] = useState(false);

  // Estados do Checklist
  const [checklistResults, setChecklistResults] = useState<Record<string, 'ok' | 'issue'>>({});
  const [skipChecklist, setSkipChecklist] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);

  const unitUsers = useMemo(() => {
    return users
      .filter(u => u.unit === currentUser.unit)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, currentUser.unit]);

  const activeObservations = useMemo(() => {
    return allRecords
      .filter(r => r.vehicleId === vehicle.id && r.notes && !r.isResolved)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allRecords, vehicle.id]);

  // Busca as últimas fotos registradas para este veículo (geralmente do último retorno)
  const lastKnownPhotos = useMemo(() => {
    const lastWithPhotos = allRecords
      .filter(r => r.vehicleId === vehicle.id && r.photos && r.photos.length > 0)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    return lastWithPhotos?.photos || [];
  }, [allRecords, vehicle.id]);

  useEffect(() => {
    if (isCheckout && activeObservations.length > 0) setShowBriefing(true);
  }, [isCheckout, activeObservations.length]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { if (photos.length < 4) setPhotos(prev => [...prev, reader.result as string]); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const runAiAnalysis = async () => {
    if (photos.length === 0) return;
    setIsAnalyzing(true);
    const result = await analyzeVehicleCondition(photos);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const getFinalDriverName = () => {
    if (!canDelegate || isForSelf) return currentUser.name;
    if (isManualDriver) return manualDriverName.trim().toUpperCase();
    const found = users.find(u => u.id === selectedDriverId);
    return found ? found.name : currentUser.name;
  };

  const finalDriverName = getFinalDriverName();

  const isKmInvalid = kmReading < (vehicle.lastMaintenanceKm || 0);
  const isChecklistComplete = Object.keys(checklistResults).length === VTR_CHECKLIST_ITEMS.length;
  const hasIssueInChecklist = Object.values(checklistResults).includes('issue');
  
  const vtrChecklistValid = !isVTR || !isCheckout || isChecklistComplete || skipChecklist;
  const notesRequiredForIssues = hasIssueInChecklist ? notes.trim().length > 5 : true;
  
  // A inspeção visual agora é opcional conforme solicitado
  const canSubmit = !isKmInvalid && 
                     vtrChecklistValid && 
                     notesRequiredForIssues &&
                     (isCheckout ? (reason.trim() !== '' && finalDriverName !== '') : true);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      vehicleId: vehicle.id,
      driverName: finalDriverName,
      recordedByName: currentUser.name,
      type: isCheckout ? RecordType.CHECK_OUT : RecordType.CHECK_IN,
      photos,
      notes,
      aiAnalysis,
      kmReading,
      reason: isCheckout ? reason : (lastRecord?.reason || 'RETORNO'),
      checklist: isVTR && isCheckout ? checklistResults : null
    });
  };

  const handleChecklistItem = (item: string, status: 'ok' | 'issue') => {
    setChecklistResults(prev => ({ ...prev, [item]: status }));
  };

  return (
    <div className="relative animate-in fade-in duration-500 pb-20">
      {galleryState && <ImageGalleryModal photos={galleryState.photos} initialIndex={galleryState.index} onClose={() => setGalleryState(null)} />}
      
      {showChecklistModal && (
        <div className="fixed inset-0 bg-slate-950 z-[4000] flex flex-col p-4 md:p-8 animate-in slide-in-from-bottom duration-300">
           <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Inspeção Interna de Material</h3>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">
                      Progresso: {Object.keys(checklistResults).length} / {VTR_CHECKLIST_ITEMS.length}
                    </p>
                 </div>
                 <button onClick={() => setShowChecklistModal(false)} className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-white flex items-center justify-center">✕</button>
              </div>

              <div className="flex-grow overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-3 pr-2 pb-10">
                 {VTR_CHECKLIST_ITEMS.map((item) => {
                    const status = checklistResults[item];
                    return (
                      <div key={item} className={`p-4 rounded-[28px] border-2 flex items-center justify-between transition-all ${status ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-900/20 border-slate-900'}`}>
                         <span className={`text-[11px] font-black uppercase tracking-tight ${status === 'issue' ? 'text-rose-500' : 'text-slate-200'}`}>{item}</span>
                         <div className="flex gap-2">
                            <button 
                              type="button" 
                              onClick={() => handleChecklistItem(item, 'ok')} 
                              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${status === 'ok' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-600'}`}
                            >👍</button>
                            <button 
                              type="button" 
                              onClick={() => handleChecklistItem(item, 'issue')} 
                              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${status === 'issue' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-800 text-slate-600'}`}
                            >👎</button>
                         </div>
                      </div>
                    );
                 })}
              </div>

              <button 
                onClick={() => { setShowChecklistModal(false); setSkipChecklist(false); }} 
                disabled={!isChecklistComplete}
                className={`w-full py-6 rounded-[32px] font-black uppercase text-[12px] tracking-widest shadow-2xl transition-all mb-4 ${isChecklistComplete ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
              >
                Confirmar Checklist Técnico
              </button>
           </div>
        </div>
      )}

      {showBriefing && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[3000] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border-2 border-amber-500/30 rounded-[48px] p-8 md:p-12 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
             <div className="flex items-center gap-6 mb-10">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-4xl">⚠️</div>
                <div>
                   <h4 className="text-3xl font-black text-white uppercase tracking-tighter">Atenção ao Recurso</h4>
                   <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest mt-2">Avarias Não Sanadas • {vehicle.plate}</p>
                </div>
             </div>
             <div className="flex-grow overflow-y-auto custom-scrollbar space-y-6">
                {activeObservations.map((obs, idx) => (
                  <div key={idx} className="bg-slate-900/50 border border-slate-800 p-6 rounded-[32px]">
                    <p className="text-[9px] font-black text-blue-500 uppercase mb-2">Relato de {obs.driverName} ({new Date(obs.timestamp).toLocaleDateString()})</p>
                    <p className="text-sm text-slate-300 italic uppercase">"{obs.notes}"</p>
                  </div>
                ))}
             </div>
             <button onClick={() => setShowBriefing(false)} className="w-full py-6 mt-8 bg-amber-500 text-slate-950 font-black rounded-[32px] uppercase text-[12px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Ciente das Avarias</button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto bg-[#0a0a0a] rounded-[48px] shadow-2xl overflow-hidden border border-slate-800">
        <div className={`p-8 md:p-12 text-white border-b border-slate-800 ${isCheckout ? 'bg-blue-900/20' : 'bg-emerald-900/10'}`}>
            <div className="flex justify-between items-start">
               <div>
                  <span className={`inline-block text-[9px] uppercase font-black tracking-[0.3em] px-4 py-1.5 rounded-xl shadow-lg mb-4 ${isCheckout ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                    {isCheckout ? 'Assumir Veículo' : 'Retorno à Base'}
                  </span>
                  <h3 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none italic">{vehicle.plate} <span className="text-slate-500">/ {vehicle.model}</span></h3>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Último KM Registrado</p>
                  <p className="text-2xl font-black text-white">{(vehicle.lastMaintenanceKm || 0).toLocaleString()}</p>
               </div>
            </div>
        </div>
        
        <form onSubmit={handleFormSubmit} className="p-8 md:p-12 space-y-12">
          {/* VISUALIZAÇÃO DO ESTADO ATUAL (PARA CIÊNCIA DO OPERADOR) */}
          {isCheckout && lastKnownPhotos.length > 0 && (
            <div className="space-y-6">
               <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] border-l-2 border-blue-600 pl-4">Estado Visual do Recurso (Prontuário)</h4>
               <p className="text-[9px] text-slate-500 font-bold ml-4 uppercase">Verifique as fotos do último registro de entrada antes de assumir.</p>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {lastKnownPhotos.map((p, idx) => (
                    <div key={idx} className="aspect-video rounded-2xl overflow-hidden border border-slate-800 hover:border-blue-500 transition-all cursor-zoom-in group relative" onClick={() => setGalleryState({ photos: lastKnownPhotos, index: idx })}>
                       <img src={p} className="w-full h-full object-cover grayscale group-hover:grayscale-0" alt="" />
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[8px] font-black text-white uppercase bg-blue-600 px-2 py-1 rounded">VER DETALHES</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* IDENTIFICAÇÃO DO CONDUTOR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-6">
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] border-l-2 border-blue-600 pl-4">1. Identificação do Condutor</h4>
                
                {canDelegate && isCheckout ? (
                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => { setIsForSelf(true); setIsManualDriver(false); }} className={`py-4 rounded-xl font-black text-[10px] uppercase transition-all border-2 ${isForSelf ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>Eu Mesmo</button>
                        <button type="button" onClick={() => setIsForSelf(false)} className={`py-4 rounded-xl font-black text-[10px] uppercase transition-all border-2 ${!isForSelf ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>Outro Policial</button>
                     </div>
                     
                     {!isForSelf && (
                       <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                          <select 
                            value={isManualDriver ? 'MANUAL' : selectedDriverId} 
                            onChange={(e) => {
                               if (e.target.value === 'MANUAL') {
                                 setIsManualDriver(true);
                               } else {
                                 setIsManualDriver(false);
                                 setSelectedDriverId(e.target.value);
                               }
                            }} 
                            className="w-full px-4 py-4 rounded-xl bg-slate-900 border border-slate-800 text-white font-black uppercase text-[10px] outline-none focus:border-blue-500"
                          >
                             <option value="" disabled>SELECIONE O CONDUTOR...</option>
                             {unitUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                             <option value="MANUAL" className="text-blue-500">➕ OUTRO CONDUTOR (NÃO LISTADO)</option>
                          </select>

                          {isManualDriver && (
                            <input 
                              type="text" 
                              value={manualDriverName} 
                              onChange={(e) => setManualDriverName(e.target.value.toUpperCase())}
                              placeholder="DIGITE O NOME DO CONDUTOR"
                              className="w-full px-6 py-4 rounded-xl bg-black border-2 border-blue-500/30 text-white font-black uppercase text-xs outline-none focus:border-blue-500 animate-in zoom-in-95"
                              required
                            />
                          )}
                       </div>
                     )}
                  </div>
                ) : (
                  <div className="px-6 py-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                    <div>
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Vínculo Automático</p>
                       <p className="text-sm font-black text-blue-400 uppercase tracking-tight">
                         {isCheckout ? currentUser.name : (lastRecord?.driverName || 'CONDUTOR')}
                       </p>
                    </div>
                    <span className="text-xl">🛡️</span>
                  </div>
                )}
             </div>

             <div className="space-y-6">
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] border-l-2 border-blue-600 pl-4">2. Registro de Odômetro</h4>
                <div className="space-y-4">
                  <input 
                    type="number" 
                    value={kmReading || ''} 
                    onChange={e => setKmReading(Number(e.target.value))} 
                    className={`w-full px-6 py-5 rounded-2xl bg-black border-2 font-black text-white text-3xl ${isKmInvalid ? 'border-rose-600 animate-shake' : 'border-slate-800 focus:border-blue-500'}`} 
                    placeholder="ODÔMETRO" 
                    required 
                  />
                  {isKmInvalid && (
                    <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest ml-2 animate-pulse">KM inferior ao último registro (Máx: {vehicle.lastMaintenanceKm?.toLocaleString()})</p>
                  )}
                </div>
             </div>
          </div>

          {/* FINALIDADE DO USO - CARDS TÁTICOS */}
          {isCheckout && (
            <div className="space-y-8 pt-8 border-t border-slate-900">
               <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] border-l-2 border-blue-600 pl-4">3. Finalidade do Uso</h4>
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {REASON_OPTIONS.map((opt) => {
                    const isActive = reason === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setReason(opt.id)}
                        className={`p-6 rounded-[32px] border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 relative group overflow-hidden ${
                          isActive 
                            ? 'bg-blue-600 border-blue-400 tactical-glow scale-105 z-10' 
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                         <span className={`text-4xl transition-transform ${isActive ? 'scale-125' : 'group-hover:scale-110'}`}>{opt.icon}</span>
                         <div className="text-center">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-400'}`}>{opt.label}</p>
                            <p className={`text-[7px] font-bold uppercase mt-1 opacity-60 ${isActive ? 'text-blue-100' : 'text-slate-600'}`}>{opt.desc}</p>
                         </div>
                         {isActive && <div className="absolute top-2 right-4 text-[8px] font-black text-white/50">SELECIONADO</div>}
                      </button>
                    );
                  })}
               </div>
            </div>
          )}

          {/* CHECKLIST DA VIATURA (EXCLUSIVO VTR) */}
          {isVTR && isCheckout && (
            <div className="space-y-6 pt-8 border-t border-slate-900">
               <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] border-l-2 border-blue-600 pl-4">4. Inspeção de Itens (VTR)</h4>
               <div className="bg-slate-900/30 p-8 rounded-[40px] border border-slate-800 flex flex-col items-center gap-6">
                  <div className="text-center">
                     <p className="text-[11px] font-black text-white uppercase mb-2">Checklist Tático do Recurso</p>
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">Verificação obrigatória dos 32 itens de prontidão.</p>
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={() => setShowChecklistModal(true)}
                    className={`px-10 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all ${isChecklistComplete ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white shadow-xl animate-pulse'}`}
                  >
                    {isChecklistComplete ? '✅ Checklist Concluído' : '📋 FAZER CHECK LIST DA VTR'}
                  </button>

                  <div className="flex items-center gap-3 mt-4">
                     <input 
                       type="checkbox" 
                       id="skipChecklist" 
                       checked={skipChecklist} 
                       onChange={(e) => {
                          setSkipChecklist(e.target.checked);
                          if(e.target.checked) setChecklistResults({});
                       }}
                       className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                     />
                     <label htmlFor="skipChecklist" className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                       Assumir sem realizar check list
                     </label>
                  </div>
               </div>
            </div>
          )}

          {/* EVIDÊNCIAS E IA - OPCIONAL AGORA */}
          <div className="space-y-8 pt-8 border-t border-slate-900">
             <div className="flex justify-between items-end">
                <div>
                   <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] border-l-2 border-blue-600 pl-4">{isCheckout ? (isVTR ? '5.' : '4.') : '3.'} Inspeção Visual (Opcional 📸)</h4>
                   <p className="text-[9px] text-slate-500 font-bold mt-1 ml-4 italic">Fotos auxiliam no registro histórico de avarias.</p>
                </div>
                {photos.length > 0 && !aiAnalysis && (
                  <button type="button" onClick={runAiAnalysis} disabled={isAnalyzing} className="px-4 py-2 bg-blue-600/10 text-blue-500 border border-blue-500/30 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                    {isAnalyzing ? 'Processando IA...' : 'Analisar Estado com IA 🤖'}
                  </button>
                )}
             </div>

             {aiAnalysis && (
               <div className="bg-blue-600/5 border border-blue-500/20 p-6 rounded-[32px] animate-in slide-in-from-top-4">
                  <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    Laudo Técnico Inteligente
                  </p>
                  <p className="text-xs font-bold text-slate-300 uppercase leading-relaxed italic">"{aiAnalysis}"</p>
                  <button type="button" onClick={() => setAiAnalysis(null)} className="text-[7px] font-black text-rose-500 uppercase mt-4 hover:underline">Descartar Análise</button>
               </div>
             )}

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative aspect-video rounded-3xl overflow-hidden border-2 border-slate-800 group">
                    <img src={p} className="w-full h-full object-cover" alt="" onClick={() => setGalleryState({ photos, index: idx })} />
                    <button type="button" onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 bg-rose-600 p-1.5 rounded-lg text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ))}
                {photos.length < 4 && (
                  <button type="button" onClick={() => cameraInputRef.current?.click()} className={`aspect-video border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 transition-all bg-slate-900/30 border-slate-800 text-slate-500 hover:border-blue-500/50`}>
                    <span className="text-3xl">📸</span>
                    <span className="text-[8px] font-black uppercase tracking-widest">Adicionar Foto</span>
                  </button>
                )}
             </div>
             <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Notas Suplementares</label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value.toUpperCase())} 
              placeholder={hasIssueInChecklist ? "DESCREVA O PROBLEMA ENCONTRADO NO CHECKLIST (OBRIGATÓRIO)..." : "DESCREVA AVARIAS OU OBSERVAÇÕES MANUAIS..."} 
              className={`w-full px-6 py-5 rounded-[32px] bg-black border-2 font-bold text-sm h-32 outline-none transition-all uppercase ${hasIssueInChecklist && notes.trim().length < 5 ? 'border-rose-600 animate-shake' : 'border-slate-800 focus:border-blue-500'}`} 
            />
            {hasIssueInChecklist && notes.trim().length < 5 && (
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-4 animate-pulse">Relate o problema detectado no checklist para prosseguir.</p>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-12 border-t border-slate-900">
            <button type="button" onClick={onCancel} className="flex-1 py-6 bg-slate-900 text-slate-500 font-black rounded-2xl uppercase text-[11px] tracking-widest">Cancelar</button>
            <button 
              type="submit" 
              disabled={!canSubmit} 
              className={`flex-[2] py-6 text-white font-black rounded-2xl uppercase text-[11px] tracking-widest shadow-2xl transition-all ${canSubmit ? (isCheckout ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500') : 'bg-slate-800 opacity-50 cursor-not-allowed'}`}
            >
              {isCheckout ? 'Validar Saída' : 'Finalizar Retorno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckInForm;
