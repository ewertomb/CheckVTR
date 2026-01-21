
import React from 'react';
import { User, UserRole } from '../types';

interface FunctionSelectionProps {
  user: User;
  onSelect: (role: UserRole) => void;
  onBackToApp?: () => void;
  onLogout: () => void;
}

const ROLE_INFO: Record<UserRole, { icon: string, label: string, desc: string, color: string, glow: string }> = {
  [UserRole.PROGRAMMER]: {
    icon: '👨‍💻',
    label: 'Programador',
    desc: 'Acesso total, depuração de dados e ferramentas de sistema.',
    color: 'bg-rose-600',
    glow: 'hover:border-rose-500 hover:shadow-[0_0_50px_rgba(225,29,72,0.15)]'
  },
  [UserRole.ADMIN]: {
    icon: '⚖️',
    label: 'Administrador',
    desc: 'Gestão de efetivo, criação de bases e auditoria geral.',
    color: 'bg-indigo-600',
    glow: 'hover:border-indigo-500 hover:shadow-[0_0_50px_rgba(79,70,229,0.15)]'
  },
  [UserRole.PERMANENTE]: {
    icon: '🖥️',
    label: 'Permanência',
    desc: 'Monitoramento em tempo real e controle de manutenção.',
    color: 'bg-yellow-500',
    glow: 'hover:border-yellow-500 hover:shadow-[0_0_50px_rgba(234,179,8,0.15)]'
  },
  [UserRole.USER]: {
    icon: '🛡️',
    label: 'Operacional',
    desc: 'Patrulhamento, check-out de viaturas e missões.',
    color: 'bg-blue-600',
    glow: 'hover:border-blue-500 hover:shadow-[0_0_50px_rgba(37,99,235,0.15)]'
  }
};

const FunctionSelection: React.FC<FunctionSelectionProps> = ({ user, onSelect, onLogout }) => {
  const isProgrammer = user.roles.includes(UserRole.PROGRAMMER);
  // Se for programador, mostra todas as opções, senão mostra apenas as atribuídas
  const displayRoles = isProgrammer ? Object.values(UserRole) : user.roles;

  return (
    <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 to-transparent pointer-events-none"></div>
      
      <div className="max-w-5xl w-full relative z-10 text-center">
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6 shadow-2xl">
             <span className="text-3xl">⚡</span>
          </div>
          <h2 className="text-xs font-black text-blue-500 uppercase tracking-[0.4em] mb-4">Módulo de Autenticação Tática</h2>
          <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic leading-none">
            Comando, <span className="text-blue-500">{user.name}</span>
          </h3>
          <p className="text-slate-500 font-bold mt-4 uppercase tracking-widest text-[10px] italic">
            ID: {user.registration} • Unidade de Origem: {user.unit || 'NÃO ATRIBUÍDA'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-1000">
          {displayRoles.map((role) => {
            const info = ROLE_INFO[role];
            return (
              <button 
                key={role}
                onClick={() => onSelect(role)}
                className={`group relative bg-[#0a0a0a] border-2 border-slate-800 rounded-[40px] p-8 text-left transition-all active:scale-95 overflow-hidden ${info.glow}`}
              >
                <div className="relative z-10">
                  <div className={`w-14 h-14 ${info.color} rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/20 transition-all group-hover:scale-110`}>
                    <span className="text-2xl">{info.icon}</span>
                  </div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2 italic">
                    {info.label}
                  </h4>
                  <p className="text-slate-500 text-[9px] font-bold leading-relaxed uppercase opacity-70 group-hover:opacity-100">
                    {info.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-16">
           <button 
             onClick={onLogout}
             className="px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] bg-rose-600/10 text-rose-500 border border-rose-500/20 shadow-xl hover:bg-rose-600 hover:text-white transition-all active:scale-95"
           >
             Encerrar Sessão
           </button>
        </div>
      </div>
    </div>
  );
};

export default FunctionSelection;
