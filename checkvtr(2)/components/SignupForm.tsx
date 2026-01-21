
import React, { useState } from 'react';

interface SignupFormProps {
  units: string[];
  onSignup: (data: { registration: string; email: string; password: string; unit: string; name: string }) => Promise<void>;
  onCancel: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ units, onSignup, onCancel }) => {
  const [name, setName] = useState('');
  const [registration, setRegistration] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration || !email || !password || !selectedUnit || !name) {
      alert("Preencha todos os campos operacionais.");
      return;
    }
    setLoading(true);
    try {
      await onSignup({ 
        name: name.toUpperCase(),
        registration: registration.toUpperCase(), 
        email: email.toLowerCase().trim(), 
        password, 
        unit: selectedUnit 
      });
      setSuccess(true);
    } catch (err) {
      // Erro tratado via notificação no App.tsx
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-emerald-500/30 rounded-[40px] p-12 shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(16,185,129,0.3)] border-4 border-emerald-400/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Alistamento Enviado</h2>
          <p className="text-slate-400 font-bold text-sm uppercase leading-relaxed mb-10">
            Sua conta foi criada com sucesso. <br/><br/> Se você já possuía um convite do seu comando, seu acesso já deve estar liberado. Caso contrário, aguarde a ativação pelo P4 da sua unidade.
          </p>
          <button onClick={onCancel} className="w-full py-5 bg-emerald-600 text-white font-black rounded-[24px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg">IR PARA LOGIN</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Novo Prontuário</h1>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Cadastro de Efetivo BPRAIO</p>
        </div>

        <div className="bg-[#0a0a0a] rounded-[40px] p-10 border border-blue-900/30 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome de Guerra</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} placeholder="EX: SD RODRIGUES" className="w-full px-6 py-4 rounded-2xl bg-slate-900 border border-blue-900/40 text-white font-bold outline-none focus:border-blue-500 transition-all" required />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Pessoal</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="policial@email.com" className="w-full px-6 py-4 rounded-2xl bg-slate-900 border border-blue-900/40 text-white font-bold outline-none focus:border-blue-500 transition-all" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Matrícula (RG)</label>
                <input type="text" value={registration} onChange={(e) => setRegistration(e.target.value.toUpperCase())} placeholder="RG" className="w-full px-6 py-4 rounded-2xl bg-slate-900 border border-blue-900/40 text-white font-bold outline-none focus:border-blue-500 transition-all" required />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unidade</label>
                <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-900 border border-blue-900/40 text-white font-bold outline-none focus:border-blue-500 appearance-none uppercase" required>
                  <option value="" disabled>SELECIONE</option>
                  {units.map(u => <option key={u} value={u} className="bg-[#0a0a0a] text-white">{u}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Criar Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="NO MÍNIMO 6 DÍGITOS" className="w-full px-6 py-4 rounded-2xl bg-slate-900 border border-blue-900/40 text-white font-bold outline-none focus:border-blue-500 transition-all" required minLength={6} />
            </div>

            <div className="pt-4 flex flex-col gap-4">
              <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white font-black rounded-[24px] hover:bg-blue-700 transition-all shadow-xl text-sm uppercase tracking-[0.2em]">
                {loading ? 'PROCESSANDO...' : 'FINALIZAR CADASTRO'}
              </button>
              <button type="button" onClick={onCancel} className="w-full py-4 text-slate-600 font-black rounded-[24px] hover:text-white transition-all text-[10px] uppercase tracking-[0.2em]">Já tenho conta / Voltar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
