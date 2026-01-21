
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  onStartSetup: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [identification, setIdentification] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let emailToAuth = identification.trim();

      if (!identification.includes('@')) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('registration', identification.toUpperCase())
          .single();

        if (profileError || !profile) {
          throw new Error('Matrícula não encontrada no sistema.');
        }
        emailToAuth = profile.email;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToAuth,
        password,
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          throw new Error('Credenciais inválidas. Verifique sua senha.');
        }
        throw authError;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      onLoginSuccess(profileData || data.user);
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/20 via-transparent to-blue-900/10 pointer-events-none"></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-[28px] mb-4 shadow-2xl border-4 border-blue-400/20">
            <span className="text-white text-4xl font-black">⚡</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Check<span className="text-blue-500">VTR</span></h1>
          <p className="text-blue-400 font-black text-[10px] uppercase tracking-widest mt-1 italic">Acesso Restrito ao Efetivo</p>
        </div>

        <div className="bg-[#0a0a0a] rounded-[40px] p-8 md:p-10 border border-slate-800 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Matrícula ou E-mail</label>
              <input 
                type="text" 
                value={identification}
                onChange={(e) => setIdentification(e.target.value)}
                placeholder="IDENTIFICAÇÃO"
                className="w-full px-5 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-white font-bold outline-none focus:border-blue-500 transition-all"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-white font-bold outline-none focus:border-blue-500 transition-all"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 text-rose-500 text-[10px] font-black rounded-xl border border-rose-500/20 uppercase text-center italic">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl text-xs uppercase tracking-[0.2em] active:scale-95"
            >
              {isLoading ? 'VERIFICANDO...' : 'ENTRAR NO SISTEMA'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600 font-bold text-[9px] uppercase tracking-widest">
              Esqueceu sua senha? Procure o P4 da sua unidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
