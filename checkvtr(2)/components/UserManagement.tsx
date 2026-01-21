
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, TransferRequest, TransferStatus } from '../types';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'> & { password?: string }) => Promise<void>;
  onUpdateUser: (user: User) => Promise<void>;
  onDeleteUser: (id: string) => void;
  onTransferUser: (user: User, targetUnit: string) => void;
  currentUser: User;
  activeRole: UserRole;
  units: string[];
  transferRequests: TransferRequest[];
  onResolveTransfer: (id: string, action: 'accepted' | 'rejected') => void;
  forceShowForm?: boolean;
  onCloseForm?: () => void;
  initialEditingUser?: User | null;
  onEditUser?: (user: User) => void;
}

const ROLE_LABELS: Record<UserRole, { label: string, color: string }> = {
  [UserRole.PROGRAMMER]: { label: 'Programador', color: 'bg-rose-600' },
  [UserRole.ADMIN]: { label: 'Administrador', color: 'bg-indigo-600' },
  [UserRole.PERMANENTE]: { label: 'Permanência', color: 'bg-yellow-500' },
  [UserRole.USER]: { label: 'Operacional', color: 'bg-blue-600' }
};

const UserManagement: React.FC<UserManagementProps> = ({ 
  users, onAddUser, onUpdateUser, onDeleteUser, onTransferUser, currentUser, activeRole, units, transferRequests, onResolveTransfer,
  forceShowForm = false, onCloseForm, initialEditingUser = null, onEditUser
}) => {
  const [showForm, setShowForm] = useState(forceShowForm);
  const [editingUser, setEditingUser] = useState<User | null>(initialEditingUser);
  const [activeTab, setActiveTab] = useState<'efetivo' | 'transferencias'>('efetivo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isProgrammer = activeRole === UserRole.PROGRAMMER;
  const isManager = activeRole === UserRole.ADMIN || isProgrammer;
  
  const [name, setName] = useState('');
  const [registration, setRegistration] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<UserRole[]>([UserRole.USER]);

  const pendingIncoming = useMemo(() => {
    return transferRequests.filter(t => t.status === TransferStatus.PENDING && t.toUnit === currentUser.unit);
  }, [transferRequests, currentUser.unit]);

  useEffect(() => {
    setShowForm(forceShowForm);
    setEditingUser(initialEditingUser);
  }, [forceShowForm, initialEditingUser]);

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name);
      setRegistration(editingUser.registration);
      setEmail(editingUser.email || '');
      setRoles(editingUser.roles || [UserRole.USER]);
      setPassword('');
      setShowForm(true);
    } else if (showForm) {
      setName(''); 
      setRegistration(''); 
      setEmail('');
      setPassword('');
      setRoles([UserRole.USER]);
    }
  }, [editingUser, showForm]);

  const toggleRole = (role: UserRole) => {
    if (role === UserRole.PROGRAMMER && !isProgrammer) return;
    setRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role) 
        : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !registration.trim() || !email.trim()) return alert("Preencha os campos obrigatórios.");
    if (roles.length === 0) return alert("Selecione ao menos um perfil de acesso.");
    
    setIsSubmitting(true);
    try {
      if (editingUser) {
        await onUpdateUser({ 
          ...editingUser, 
          name: name.toUpperCase().trim(), 
          registration: registration.toUpperCase().trim(), 
          email: email.toLowerCase().trim(), 
          roles, 
          unit: currentUser.unit 
        });
      } else {
        await onAddUser({ 
          name: name.toUpperCase().trim(), 
          registration: registration.toUpperCase().trim(), 
          email: email.toLowerCase().trim(), 
          roles, 
          unit: currentUser.unit, 
          password 
        });
      }
      handleCancel();
    } catch (err) {
      console.error("Erro no formulário:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    if (onCloseForm) onCloseForm();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {!forceShowForm && (
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic">Gestão de Efetivo</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
              Base: {currentUser.unit} {isProgrammer ? ' (Acesso Master)' : ''}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="flex bg-[#0a0a0a] border border-slate-800 p-1.5 rounded-2xl w-full sm:w-auto shadow-xl">
              <button onClick={() => setActiveTab('efetivo')} className={`flex-1 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'efetivo' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Tropa</button>
              <button onClick={() => setActiveTab('transferencias')} className={`flex-1 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'transferencias' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                Pedidos
                {pendingIncoming.length > 0 && <span className="ml-2 w-4 h-4 bg-rose-600 text-white text-[7px] rounded-full flex items-center justify-center animate-pulse">{pendingIncoming.length}</span>}
              </button>
            </div>

            <button onClick={() => setShowForm(true)} className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-[9px] font-black uppercase rounded-xl shadow-xl hover:bg-blue-500 transition-all min-h-[48px]">+ Policial</button>
          </div>
        </div>
      )}

      {activeTab === 'efetivo' && (
        <div className="space-y-4">
          <div className="bg-[#0a0a0a] rounded-[40px] border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0f172a] text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-6">Nome / Matrícula</th>
                    <th className="px-8 py-6">E-mail Operacional</th>
                    <th className="px-8 py-6">Perfis Ativos</th>
                    <th className="px-8 py-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs uppercase border bg-slate-900 border-slate-800 text-blue-500">
                            {u.name?.charAt(0) || '?'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase text-white">{u.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono font-bold">{u.registration}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-[10px] font-bold text-slate-400 lowercase">{u.email}</td>
                      <td className="px-8 py-5">
                        <div className="flex flex-wrap gap-1">
                          {(u.roles || []).map(r => (
                            <span key={r} className={`text-[7px] font-black uppercase px-2 py-0.5 rounded border ${ROLE_LABELS[r]?.color || 'bg-slate-700'} bg-opacity-20 text-opacity-90 border-opacity-30`}>
                              {ROLE_LABELS[r]?.label || r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { if(onEditUser) onEditUser(u); else setEditingUser(u); }} className="p-3 bg-slate-900 text-slate-500 hover:text-white rounded-xl border border-slate-800 transition-all shadow-inner">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-600 font-black uppercase text-[10px] tracking-[0.4em]">Nenhum policial vinculado a esta base</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0a0a0a] border border-blue-900/30 rounded-t-[40px] sm:rounded-[48px] p-8 sm:p-10 w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 flex flex-col max-h-[96vh]">
            <h4 className="text-2xl font-black text-white uppercase mb-8 italic flex-shrink-0">
              {editingUser ? 'Ajustar Prontuário' : 'Integrar ao Efetivo'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto custom-scrollbar pr-2 flex-grow">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome de Guerra</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className="w-full px-6 py-4 rounded-2xl bg-black border border-slate-800 text-white font-black uppercase outline-none focus:border-blue-500 min-h-[56px] shadow-inner" required disabled={isSubmitting} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Matrícula / RG</label>
                  <input type="text" value={registration} onChange={(e) => setRegistration(e.target.value.toUpperCase())} className="w-full px-6 py-4 rounded-2xl bg-black border border-slate-800 text-white font-black outline-none focus:border-blue-500 min-h-[56px] shadow-inner" required disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unidade</label>
                  <div className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-slate-800 text-blue-500 font-black text-[10px] uppercase min-h-[56px] flex items-center shadow-inner">
                    {currentUser.unit}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Operacional</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value.toLowerCase())} className="w-full px-6 py-4 rounded-2xl bg-black border border-slate-800 text-white font-black outline-none focus:border-blue-500 min-h-[56px] shadow-inner" required disabled={isSubmitting} />
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-900">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Atribuição de Funções</label>
                <div className="grid grid-cols-2 gap-2">
                   {Object.values(UserRole).map((role) => {
                     const isAssigned = roles.includes(role);
                     const labelInfo = ROLE_LABELS[role];
                     const isDisabled = role === UserRole.PROGRAMMER && !isProgrammer;
                     return (
                       <button key={role} type="button" disabled={isDisabled} onClick={() => toggleRole(role)} className={`px-4 py-3 rounded-xl border-2 text-[8px] font-black uppercase transition-all flex items-center justify-between gap-2 ${isAssigned ? `${labelInfo.color} border-white/20 text-white shadow-lg` : 'bg-slate-900 border-slate-800 text-slate-600'} ${isDisabled ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-[1.02]'}`}>
                         <span>{labelInfo.label}</span>
                         {isAssigned && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                       </button>
                     );
                   })}
                </div>
              </div>
              {!editingUser && (
                <div className="space-y-2 pt-4 border-t border-slate-900">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha Inicial</label>
                  <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-black border border-slate-800 text-white font-black outline-none focus:border-blue-500 min-h-[56px] shadow-inner" placeholder="SENHA DE ACESSO" minLength={6} required disabled={isSubmitting} />
                </div>
              )}
              <div className="flex gap-4 pt-8 flex-shrink-0">
                <button type="button" onClick={handleCancel} className="flex-1 py-4 bg-slate-900 text-slate-500 font-black rounded-2xl uppercase text-[10px] min-h-[56px]" disabled={isSubmitting}>Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl min-h-[56px] active:scale-95 flex items-center justify-center gap-2" disabled={isSubmitting}>
                  {isSubmitting ? <div className="loader !w-4 !h-4"></div> : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
