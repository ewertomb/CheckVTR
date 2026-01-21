
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface SetupFormProps {
  onComplete: (adminId: string, unitName: string) => void;
  onCancel: () => void;
  users: User[];
  units: string[];
}

const SetupForm: React.FC<SetupFormProps> = ({ onComplete, onCancel, users, units }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [registration, setRegistration] = useState('');
  const [password, setPassword] = useState('');
  const [validatedAdmin, setValidatedAdmin] = useState<User | null>(null);
  const [unitName, setUnitName] = useState('');
  const [error, setError] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Fix: Changed u.role to u.roles.includes(UserRole.ADMIN) because the User interface defines 'roles' as an array of UserRole.
    const admin = users.find(u => 
      u.registration === registration.toUpperCase() && 
      u.password === password && 
      u.roles.includes(UserRole.ADMIN)
    );

    if (!admin) {
      setError('Credenciais administrativas não encontradas ou não autorizadas para setup.');
      return;
    }

    if (admin.unit) {
      setError('Este administrador já possui uma unidade configurada.');
      return;
    }

    setValidatedAdmin(admin);
    setStep(2);
    // Se não houver unidades, mostra o campo manual direto
    if (units.length === 0) {
      setShowManualInput(true);
    }
  };

  const handleFinalize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!unitName.trim()) {
      alert('Por favor, defina o nome da unidade.');
      return;
    }
    if (validatedAdmin) {
      onComplete(validatedAdmin.id, unitName.trim());
    }
  };

  const selectExistingUnit = (name: string) => {
    setUnitName(name);
    setShowManualInput(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Setup de Unidade Operacional</h2>
            <p className="text-slate-500 text-sm mt-1">
              {step === 1 ? 'Autentique suas credenciais administrativas pré-cadastradas.' : `Olá, ${validatedAdmin?.name}! Escolha ou crie sua unidade.`}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleValidate} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Matrícula do Administrador</label>
                  <input 
                    type="text" 
                    value={registration}
                    onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                    placeholder="8 dígitos"
                    maxLength={8}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Senha Provisória</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button type="button" onClick={onCancel} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Cancelar</button>
                <button type="submit" className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200">Verificar Acesso</button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {units.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Unidades Existentes</label>
                  <div className="grid grid-cols-1 gap-2">
                    {units.map(u => (
                      <button 
                        key={u}
                        onClick={() => selectExistingUnit(u)}
                        className={`px-4 py-3 rounded-xl border text-left font-bold transition-all flex justify-between items-center ${unitName === u ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-300'}`}
                      >
                        {u}
                        {unitName === u && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                {!showManualInput && units.length > 0 ? (
                  <button 
                    onClick={() => { setShowManualInput(true); setUnitName(''); }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Quero criar uma unidade nova
                  </button>
                ) : (
                  <form onSubmit={handleFinalize} className="bg-blue-50 p-6 rounded-2xl border border-blue-100 animate-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-blue-700 mb-2 uppercase tracking-widest">Nome da Nova Unidade</label>
                    <input 
                      type="text" 
                      value={unitName}
                      onChange={(e) => setUnitName(e.target.value)}
                      placeholder="Ex: 5ª Cia - Centro"
                      className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-slate-800"
                      required
                      autoFocus
                    />
                    {units.length > 0 && (
                      <button 
                        type="button"
                        onClick={() => setShowManualInput(false)}
                        className="mt-3 text-[10px] font-bold text-blue-500 uppercase hover:text-blue-700"
                      >
                        Voltar para unidades existentes
                      </button>
                    )}
                  </form>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">Voltar</button>
                <button 
                  onClick={() => handleFinalize()}
                  disabled={!unitName.trim()}
                  className={`flex-[2] py-4 text-white font-bold rounded-2xl transition-all ${unitName.trim() ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 active:scale-95' : 'bg-slate-300 cursor-not-allowed'}`}
                >
                  Confirmar Acesso à Unidade
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupForm;
