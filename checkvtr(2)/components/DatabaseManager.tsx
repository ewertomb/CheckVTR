
import React, { useState, useMemo } from 'react';
import { AppState } from '../types';

interface DatabaseManagerProps {
  state: AppState;
  onImport: (newState: AppState) => void;
  onSyncManual: () => void;
  isSyncing: boolean;
}

const DatabaseManager: React.FC<DatabaseManagerProps> = ({ state, onImport, onSyncManual, isSyncing }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [showJson, setShowJson] = useState(false);

  const handleExport = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      version: "1.0",
      description: "Snapshot de Desenvolvimento CheckVTR",
      timestamp: new Date().toISOString(),
      data: state
    }, null, 2));
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `CheckVTR_BACKUP_${timestamp}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const dataToImport = parsed.data || parsed; // Suporta tanto o wrapper de snapshot quanto o JSON direto

      if (dataToImport.vehicles && dataToImport.users && dataToImport.units) {
        if (window.confirm("ATENÇÃO: A restauração de dados é uma operação crítica. Deseja processar este snapshot agora?")) {
          onImport(dataToImport);
          setJsonInput('');
        }
      } else {
        alert("FORMATO INVÁLIDO: O arquivo deve conter entidades de 'units', 'vehicles' e 'users'.");
      }
    } catch (e) {
      alert("ERRO DE SINTAXE: Verifique se o conteúdo colado é um JSON válido.");
    }
  };

  const entitiesCount = useMemo(() => ({
    units: state.units.length,
    vehicles: state.vehicles.length,
    users: state.users.length,
    records: state.records.length,
    fuel: state.fuelRecords.length
  }), [state]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Console de Dados</h2>
           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Snapshot de Segurança e Restauração Universal</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <button 
             onClick={onSyncManual}
             disabled={isSyncing}
             className="flex-1 md:flex-none px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
           >
             {isSyncing ? <div className="loader !w-3 !h-3"></div> : 'Sincronizar Cloud'}
           </button>
           <button 
             onClick={handleExport}
             className="flex-1 md:flex-none px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
           >
             📦 Baixar Snapshot
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <EntityCard label="Unidades" value={entitiesCount.units} icon="🏢" color="text-indigo-500" />
        <EntityCard label="Patrimônio" value={entitiesCount.vehicles} icon="🚓" color="text-blue-500" />
        <EntityCard label="Efetivo" value={entitiesCount.users} icon="👮" color="text-emerald-500" />
        <EntityCard label="Inspeções" value={entitiesCount.records} icon="📋" color="text-amber-500" />
        <EntityCard label="Consumo" value={entitiesCount.fuel} icon="⛽" color="text-rose-500" />
      </div>

      <div className="bg-[#0a0a0a] border border-slate-800 rounded-[44px] p-8 md:p-12 space-y-10 tactical-glow">
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
           <div>
              <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Snapshots e Backups</h4>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">Ferramenta de recuperação de desastres para desenvolvimento</p>
           </div>
           <button onClick={() => setShowJson(!showJson)} className="px-4 py-2 bg-slate-900 text-slate-500 border border-slate-800 rounded-xl text-[8px] font-black uppercase hover:text-white">
              {showJson ? 'Ocultar Raw JSON' : 'Inspecionar JSON'}
           </button>
        </div>

        {showJson && (
          <div className="animate-in slide-in-from-top-4 duration-300">
             <div className="flex items-center gap-2 mb-3 px-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Estado Atual em Tempo Real (Read Only)</span>
             </div>
             <pre className="bg-black/80 p-8 rounded-[32px] text-[10px] font-mono text-emerald-400 overflow-auto max-h-[400px] border border-slate-800 custom-scrollbar shadow-inner leading-relaxed">
               {JSON.stringify(state, null, 2)}
             </pre>
          </div>
        )}

        <div className="space-y-6">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-500 border border-blue-500/20">📥</div>
              <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">Restaurar Estado do Sistema</h5>
           </div>
           
           <textarea 
             value={jsonInput}
             onChange={(e) => setJsonInput(e.target.value)}
             placeholder="COLE AQUI O CONTEÚDO DO ARQUIVO JSON DE BACKUP PARA INICIAR A RESTAURAÇÃO..."
             className="w-full h-48 bg-black border-2 border-slate-800 rounded-[32px] p-6 font-mono text-xs text-slate-400 outline-none focus:border-blue-500 transition-all custom-scrollbar placeholder:text-slate-800 shadow-inner"
           />
           
           <button 
             onClick={handleImport}
             disabled={!jsonInput}
             className={`w-full py-6 rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl ${jsonInput ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-50'}`}
           >
             Processar e Restaurar Banco de Dados
           </button>
        </div>
      </div>
      
      <div className="bg-rose-950/20 border border-rose-500/20 p-8 rounded-[40px] flex items-start gap-6">
         <div className="text-3xl">⚠️</div>
         <div className="space-y-2">
            <h6 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Protocolo de Segurança</h6>
            <p className="text-xs text-slate-500 font-bold uppercase leading-relaxed italic">
              A restauração via snapshot substitui a lógica local. Use esta ferramenta apenas em ambiente de desenvolvimento ou após validação técnica. Em caso de dúvidas, realize um novo backup antes de prosseguir.
            </p>
         </div>
      </div>
    </div>
  );
};

const EntityCard: React.FC<{ label: string, value: number, icon: string, color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-[#0a0a0a] border border-slate-800 rounded-[32px] p-6 shadow-xl flex flex-col items-center justify-center gap-2 tactical-glow">
     <span className="text-2xl">{icon}</span>
     <div className={`text-2xl font-black text-white`}>{value}</div>
     <div className={`text-[8px] font-black ${color} uppercase tracking-widest`}>{label}</div>
  </div>
);

export default DatabaseManager;
