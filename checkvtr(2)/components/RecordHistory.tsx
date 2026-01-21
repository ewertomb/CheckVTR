
import React, { useState, useMemo } from 'react';
import { CheckRecord, Vehicle, RecordType, User, UserRole } from '../types';
import ImageGalleryModal from './ImageGalleryModal';

interface RecordHistoryProps {
  records: CheckRecord[];
  vehicles: Vehicle[];
  currentUser: User;
  activeRole: UserRole;
  onResolveObservations?: (recordIds: string[]) => void;
  onDeletePhoto?: (recordId: string, photoUrl: string) => void;
}

const RecordHistory: React.FC<RecordHistoryProps> = ({ 
  records, 
  vehicles, 
  currentUser,
  activeRole,
  onResolveObservations,
  onDeletePhoto
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'issues'>('all');
  const [galleryState, setGalleryState] = useState<{ photos: string[], index: number } | null>(null);
  
  const isAdmin = activeRole === UserRole.ADMIN || activeRole === UserRole.PROGRAMMER;
  const isPermanente = activeRole === UserRole.PERMANENTE;
  const canManagePhotos = isAdmin || isPermanente;

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesVehicle = selectedVehicleId === 'all' || r.vehicleId === selectedVehicleId;
      const matchesIssues = filterType === 'all' || (r.notes && r.notes.trim() !== '');
      return matchesVehicle && matchesIssues;
    });
  }, [records, selectedVehicleId, filterType]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      {galleryState && <ImageGalleryModal photos={galleryState.photos} initialIndex={galleryState.index} onClose={() => setGalleryState(null)} />}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none italic">Histórico de Inspeções</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Fotos de Estado e Laudos de IA</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Seletor de Veículo */}
          <div className="relative flex-grow sm:w-64">
            <select 
              value={selectedVehicleId} 
              onChange={e => setSelectedVehicleId(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-800 text-white font-black uppercase text-[10px] py-4 px-6 rounded-2xl outline-none appearance-none focus:border-blue-500 transition-all"
            >
              <option value="all">Todos os Recursos</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
            </select>
          </div>

          {/* Filtro de Avarias */}
          <div className="flex bg-[#0a0a0a] border border-slate-800 p-1.5 rounded-2xl">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterType === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              Ver Tudo
            </button>
            <button 
              onClick={() => setFilterType('issues')}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterType === 'issues' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              Avarias
            </button>
          </div>
        </div>
      </div>

      {filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredRecords.map(r => {
            const v = vehicles.find(veh => veh.id === r.vehicleId);
            const isDelegated = r.recordedByName && r.driverName && r.recordedByName !== r.driverName;
            const hasNotes = r.notes && r.notes.trim() !== '';
            
            return (
              <div key={r.id} className={`bg-[#0a0a0a] border-2 rounded-[44px] p-8 space-y-6 shadow-2xl relative group transition-all ${hasNotes && !r.isResolved ? 'border-amber-500/40' : isDelegated ? 'border-blue-500/20' : 'border-slate-800'}`}>
                
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0">
                         <img src={v?.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-white uppercase leading-none">{v?.model || 'Desconhecido'}</h4>
                         <p className="text-[9px] font-mono font-black text-blue-500 uppercase mt-1">{v?.plate}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${r.type === RecordType.CHECK_OUT ? 'bg-blue-600' : 'bg-emerald-600'}`}>{r.type}</span>
                      <p className="text-[8px] font-black text-slate-600 uppercase mt-2">{new Date(r.timestamp).toLocaleString()}</p>
                   </div>
                </div>

                <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800 relative">
                   <p className="text-[8px] font-black text-slate-600 uppercase mb-2">Responsável: {r.driverName}</p>
                   {r.notes && <p className="text-xs text-slate-300 font-bold uppercase italic leading-relaxed">"{r.notes}"</p>}
                   {!r.notes && <p className="text-[9px] text-slate-700 font-bold uppercase italic">Sem observações relatadas.</p>}
                </div>

                {r.photos && r.photos.length > 0 && (
                   <div className="grid grid-cols-2 gap-3">
                     {r.photos.map((p, i) => (
                       <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 group/img shadow-lg">
                         <img src={p} className="w-full h-full object-cover cursor-zoom-in" alt="" onClick={() => setGalleryState({ photos: r.photos, index: i })} />
                         
                         {/* BOTÕES DE GESTÃO DE IMAGEM */}
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDownload(p, `INSPEC_${v?.plate}_${i}.jpg`); }}
                              className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-xl hover:bg-blue-500"
                              title="Arquivar/Download"
                            >
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                            
                            {isAdmin && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); if(confirm("Deseja apagar esta evidência para liberar espaço?")) onDeletePhoto?.(r.id, p); }}
                                className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-xl hover:bg-rose-500"
                                title="Apagar do Sistema"
                              >
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </button>
                            )}
                         </div>
                       </div>
                     ))}
                   </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-slate-900">
                   <div className="text-[9px] font-black text-slate-600 uppercase">KM: {r.kmReading.toLocaleString()}</div>
                   {isAdmin && r.notes && !r.isResolved && (
                     <button onClick={() => onResolveObservations?.([r.id])} className="px-4 py-2 bg-emerald-600 text-white font-black rounded-xl text-[8px] uppercase shadow-lg">Baixar Avaria</button>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-40 text-center bg-[#0a0a0a] rounded-[48px] border-2 border-dashed border-slate-800">
           <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.4em]">Nenhum registro encontrado</p>
        </div>
      )}
    </div>
  );
};

export default RecordHistory;
