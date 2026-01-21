
import React, { useState, useEffect, useRef } from 'react';
import { Vehicle, User, UserRole } from '../types';
import { DEFAULT_VEHICLE_IMAGES } from '../assets';

interface VehicleFormProps {
  onSubmit: (vehicle: Omit<Vehicle, 'id' | 'status'>) => void;
  onCancel: () => void;
  initialData?: Vehicle;
  isCloneMode?: boolean;
  units?: string[];
  currentUser: User;
  activeRole: UserRole;
  isSyncing?: boolean;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ 
  onSubmit, 
  onCancel, 
  initialData, 
  isCloneMode = false,
  currentUser, 
  isSyncing = false
}) => {
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [category, setCategory] = useState<'VTR' | 'MR'>('VTR');
  const [image, setImage] = useState('');
  const [hasCustomImage, setHasCustomImage] = useState(false);
  
  const [lastKmOil, setLastKmOil] = useState<number>(0);
  const [lastKmRevision, setLastKmRevision] = useState<number>(0);
  const [lastKmFrontTire, setLastKmFrontTire] = useState<number>(0);
  const [lastKmRearTire, setLastKmRearTire] = useState<number>(0);
  const [lastKmFrontBrake, setLastKmFrontBrake] = useState<number>(0);
  const [lastKmRearBrake, setLastKmRearBrake] = useState<number>(0);
  const [lastKmAlignment, setLastKmAlignment] = useState<number>(0);
  const [lastKmBrakeFluid, setLastKmBrakeFluid] = useState<number>(0);
  const [lastKmTransmission, setLastKmTransmission] = useState<number>(0);
  const [lastMaintenanceKm, setLastMaintenanceKm] = useState<number>(0);
  const [intOil, setIntOil] = useState<number>(10000);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setModel(initialData.model || '');
      setPlate(isCloneMode ? '' : (initialData.plate || '')); 
      setYear(initialData.year || new Date().getFullYear());
      setCategory(initialData.category || 'VTR');
      
      const currentImg = initialData.image || '';
      setImage(currentImg);
      
      const isDefaultVtr = currentImg.includes('vtr.jpg');
      const isDefaultMr = currentImg.includes('mr.jpg');
      setHasCustomImage(!isDefaultVtr && !isDefaultMr && currentImg.length > 50);

      setLastKmOil(initialData.lastKmOil || 0);
      setLastKmRevision(initialData.lastKmRevision || 0);
      setLastKmFrontTire(initialData.lastKmFrontTire || 0);
      setLastKmRearTire(initialData.lastKmRearTire || 0);
      setLastKmFrontBrake(initialData.lastKmFrontBrake || 0);
      setLastKmRearBrake(initialData.lastKmRearBrake || 0);
      setLastKmAlignment(initialData.lastKmAlignment || 0);
      setLastKmBrakeFluid(initialData.lastKmBrakeFluid || 0);
      setLastKmTransmission(initialData.lastKmTransmission || 0);
      setLastMaintenanceKm(initialData.lastMaintenanceKm || 0);
      setIntOil(initialData.intOil || 10000);
    } else {
      setImage(DEFAULT_VEHICLE_IMAGES.VTR);
      setHasCustomImage(false);
    }
  }, [initialData, isCloneMode]);

  const handleCategoryChange = (newCat: 'VTR' | 'MR') => {
    setCategory(newCat);
    if (!hasCustomImage) {
      setImage(DEFAULT_VEHICLE_IMAGES[newCat]);
    }
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      setImage(compressed);
      setHasCustomImage(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const resetToDefault = () => {
    setImage(DEFAULT_VEHICLE_IMAGES[category]);
    setHasCustomImage(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSyncing) return;
    
    const cleanModel = model.trim().toUpperCase();
    const cleanPlate = plate.trim().toUpperCase().replace(/\s/g, '');

    if (!cleanModel || !cleanPlate) return alert('Prefixo e Placa são obrigatórios.');
    
    onSubmit({
      model: cleanModel,
      plate: cleanPlate,
      year: Number(year),
      category, 
      image: image || DEFAULT_VEHICLE_IMAGES[category],
      unit: initialData?.unit || currentUser.unit,
      currentDriver: initialData?.currentDriver || null, 
      intOil: Number(intOil),
      lastKmOil: Number(lastKmOil),
      lastKmRevision: Number(lastKmRevision),
      lastKmFrontTire: Number(lastKmFrontTire),
      lastKmRearTire: Number(lastKmRearTire),
      lastKmFrontBrake: Number(lastKmFrontBrake),
      lastKmRearBrake: Number(lastKmRearBrake),
      lastKmAlignment: Number(lastKmAlignment),
      lastKmBrakeFluid: Number(lastKmBrakeFluid),
      lastKmTransmission: Number(lastKmTransmission),
      lastMaintenanceKm: Number(lastMaintenanceKm)
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-[#0a0a0a] rounded-[48px] shadow-2xl overflow-hidden border border-slate-800 animate-in fade-in duration-500">
      <div className="bg-slate-900 p-8 md:p-12 text-white flex justify-between items-center">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter">
            {isCloneMode ? 'Clonar Recurso' : initialData ? 'Ajustar Cadastro' : 'Novo Recurso'}
          </h3>
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Prontuário de Frota • {initialData?.unit || currentUser.unit}</p>
        </div>
        <div className="text-5xl opacity-20">{category === 'VTR' ? '🚓' : '🏍️'}</div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-2 border-blue-600 pl-4">1. Identificação Visual</h4>
                {hasCustomImage && (
                  <button type="button" onClick={resetToDefault} className="text-[8px] font-black text-rose-500 uppercase hover:underline">Remover Foto Personalizada</button>
                )}
              </div>
              <div className="relative group aspect-video rounded-[32px] bg-slate-900 border-2 border-slate-800 overflow-hidden tactical-glow">
                <img src={image} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                   <button type="button" onClick={() => cameraInputRef.current?.click()} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Câmera</button>
                   <button type="button" onClick={() => galleryInputRef.current?.click()} className="bg-slate-800 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Galeria</button>
                </div>
                <input type="file" ref={cameraInputRef} onChange={handleImageUpload} accept="image/*" capture="environment" className="hidden" />
                <input type="file" ref={galleryInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              </div>
              <p className="text-[8px] text-slate-600 font-bold uppercase ml-2 tracking-widest italic">
                {hasCustomImage ? "* Foto personalizada ativa." : `* Usando imagem padrão (${category === 'VTR' ? 'vtr.jpg' : 'mr.jpg'}).`}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-2 border-blue-600 pl-4">2. Categoria</h4>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => handleCategoryChange('VTR')} className={`py-6 rounded-3xl font-black text-[11px] uppercase transition-all border-2 flex flex-col items-center gap-2 ${category === 'VTR' ? 'bg-blue-600 border-blue-400 text-white shadow-xl' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  <span className="text-2xl">🚓</span> Viatura (VTR)
                </button>
                <button type="button" onClick={() => handleCategoryChange('MR')} className={`py-6 rounded-3xl font-black text-[11px] uppercase transition-all border-2 flex flex-col items-center gap-2 ${category === 'MR' ? 'bg-blue-600 border-blue-400 text-white shadow-xl' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  <span className="text-2xl">🏍️</span> Moto (MR)
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-2 border-blue-600 pl-4">3. Dados Operacionais</h4>
              <div className="space-y-4">
                 <input type="text" value={model} onChange={(e) => setModel(e.target.value.toUpperCase())} placeholder="PREFIXO (EX: RAIO-01)" className="w-full px-6 py-4 rounded-2xl bg-black border-2 border-slate-800 text-white font-black uppercase outline-none focus:border-blue-500 shadow-inner" required />
                 <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="PLACA" className={`w-full px-6 py-4 rounded-2xl bg-black border-2 font-black outline-none transition-all ${isCloneMode && !plate ? 'border-amber-500/50 text-amber-500' : 'border-slate-800 text-white focus:border-blue-500'} shadow-inner`} required />
                    <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full px-6 py-4 rounded-2xl bg-black border-2 border-slate-800 text-white font-black outline-none focus:border-blue-500 shadow-inner" required />
                 </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-2 border-blue-600 pl-4">4. Parâmetros Atuais</h4>
              <div className="p-6 bg-blue-900/10 rounded-[32px] border border-blue-500/20">
                 <label className="block text-[10px] font-black text-blue-500 uppercase mb-2 ml-1">Quilometragem (KM)</label>
                 <input type="number" value={lastMaintenanceKm || ''} onChange={(e) => setLastMaintenanceKm(Number(e.target.value))} className="w-full bg-transparent text-4xl font-black text-white outline-none placeholder:text-blue-900" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                 <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Lotação Vinculada</label>
                 <div className="p-4 bg-black/40 rounded-xl border border-slate-800 text-sm font-black text-blue-400 uppercase">{initialData?.unit || currentUser.unit}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 flex flex-col sm:flex-row gap-4 border-t border-slate-900">
          <button type="button" onClick={onCancel} className="flex-1 py-5 bg-slate-900 text-slate-500 font-black rounded-2xl uppercase text-[10px]">Cancelar</button>
          <button 
            type="submit" 
            disabled={isSyncing}
            className={`flex-[2] py-5 font-black rounded-2xl shadow-xl uppercase text-[10px] active:scale-95 transition-all flex items-center justify-center gap-3 ${isCloneMode ? 'bg-amber-600 text-black' : 'bg-blue-600 text-white'} ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSyncing ? (
              <>
                <div className="loader !w-3 !h-3"></div>
                Salvando...
              </>
            ) : (
              initialData && !isCloneMode ? 'Salvar Alterações' : 'Confirmar Registro'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;
