
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { User, UserRole, Unit, Vehicle, CheckRecord, FuelRecord, VehicleStatus, RecordType, TransferRequest, TransferStatus, AppState } from './types';
import { DEFAULT_VEHICLE_IMAGES } from './assets';

// Componentes Ativos
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import VehicleList from './components/VehicleList';
import UserManagement from './components/UserManagement';
import MaintenanceManagement from './components/MaintenanceManagement';
import FuelHistory from './components/FuelHistory';
import UsageReports from './components/UsageReports';
import FunctionSelection from './components/FunctionSelection';
import UnitManagement from './components/UnitManagement';
import VehicleForm from './components/VehicleForm';
import CheckInForm from './components/CheckInForm';
import FuelForm from './components/FuelForm';
import DatabaseManager from './components/DatabaseManager';
import ActiveVehicleReminder from './components/ActiveVehicleReminder';
import ActiveSessionHub from './components/ActiveSessionHub';

export const MASTER_EMAILS = ['admin@checkvtr.com', 'ewertomb@gmail.com'];

type ViewState = 'auth' | 'role_selection' | 'programmer_console' | 'app';
type Section = 'dashboard' | 'fleet' | 'maintenance' | 'fuel' | 'reports' | 'users' | 'database';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('auth');
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasDismissedReminder, setHasDismissedReminder] = useState(false);
  
  // Modais
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showActiveHub, setShowActiveHub] = useState(false);
  
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCloneMode, setIsCloneMode] = useState(false);

  const [units, setUnits] = useState<Unit[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<CheckRecord[]>([]);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);

  const isProgrammer = activeRole === UserRole.PROGRAMMER;
  const isAdmin = activeRole === UserRole.ADMIN || isProgrammer;

  const addNotification = (message: string, type: 'success' | 'error' = 'success') => {
    alert(`${type === 'success' ? '✅' : '❌'} ${message}`);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Erro ao deslogar:", e);
    } finally {
      setCurrentUser(null);
      setActiveRole(null);
      setSelectedUnit('');
      setViewState('auth');
    }
  };

  const loadInitialData = useCallback(async () => {
    try {
      const [vRes, uRes, rRes, fRes, usrRes, tRes] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('units').select('*'),
        supabase.from('check_records').select('*').order('timestamp', { ascending: false }),
        supabase.from('fuel_records').select('*').order('date', { ascending: false }),
        supabase.from('profiles').select('*').order('name', { ascending: true }),
        supabase.from('transfer_requests').select('*').order('created_at', { ascending: false })
      ]);

      if (uRes.data) setUnits(uRes.data.map((u: any) => ({
        id: u.id, name: u.name, expiresAt: u.expires_at, createdAt: u.created_at, status: u.status
      })));

      if (vRes.data) setVehicles(vRes.data.map((v: any) => ({
        id: v.id, plate: v.plate, model: v.model, year: v.year, category: v.category, image: v.image,
        unit: v.unit, status: v.status, currentDriver: v.current_driver, 
        lastKmOil: Number(v.last_km_oil) || 0, 
        lastKmRevision: Number(v.last_km_revision) || 0,
        lastKmFrontTire: Number(v.last_km_front_tire) || 0,
        lastKmRearTire: Number(v.last_km_rear_tire) || 0,
        lastKmFrontBrake: Number(v.last_km_front_brake) || 0,
        lastKmRearBrake: Number(v.last_km_rear_brake) || 0,
        lastKmAlignment: Number(v.last_km_alignment) || 0,
        lastKmBrakeFluid: Number(v.last_km_brake_fluid) || 0,
        lastKmTransmission: Number(v.last_km_transmission) || 0,
        lastMaintenanceKm: Number(v.last_maintenance_km) || 0,
        intOil: Number(v.int_oil) || 10000
      })));
      
      if (rRes.data) setRecords(rRes.data.map((r: any) => ({
        id: r.id, vehicleId: r.vehicle_id, driverName: r.driver_name, recordedByName: r.recorded_by_name,
        kmReading: Number(r.km_reading) || 0, type: r.type as RecordType, timestamp: r.timestamp,
        photos: r.photos || [], notes: r.notes || '', isResolved: r.is_resolved, unit: r.unit, reason: r.reason
      })));

      if (fRes.data) setFuelRecords(fRes.data.map((f: any) => ({
        id: f.id, vehicleId: f.vehicle_id, driverName: f.driver_name, date: f.date, liters: Number(f.liters),
        totalValue: Number(f.total_value), remainingBalance: Number(f.remaining_balance),
        kmAtRefueling: Number(f.km_at_refueling), unit: f.unit
      })));

      if (usrRes.data) setUsers(usrRes.data.map((u: any) => ({
        id: u.id, name: u.name, email: u.email, registration: u.registration, unit: u.unit, roles: u.roles || []
      })));

      if (tRes.data) setTransferRequests(tRes.data.map((t: any) => ({
        id: t.id, type: t.type, item_id: t.item_id, itemName: t.item_name, fromUnit: t.from_unit,
        toUnit: t.to_unit, requesterId: t.requester_id, requesterName: t.requester_name,
        status: t.status as TransferStatus, createdAt: t.created_at
      })));

    } catch (err) {
      console.error("Erro na sincronização:", err);
    }
  }, []);

  const handleLoginSuccess = async (profile: any) => {
    if (!profile) return;
    setIsLoading(true);
    try {
      await loadInitialData();
      const email = (profile.email || "").toLowerCase();
      const isMaster = MASTER_EMAILS.includes(email);
      let roles = profile.roles || [UserRole.USER];
      if (isMaster && !roles.includes(UserRole.PROGRAMMER)) roles = [UserRole.PROGRAMMER, ...roles];

      const user: User = {
        id: profile.id, name: profile.name || "OPERADOR", email: profile.email, registration: profile.registration || "000000",
        unit: profile.unit || "", roles: roles
      };
      
      setCurrentUser(user);
      setViewState('role_selection');
    } catch (e) {
      addNotification("Erro ao carregar perfil.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) handleLoginSuccess(profile);
        else setViewState('auth');
      } else {
        setViewState('auth');
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const userActiveVehicle = useMemo(() => 
    vehicles.find(v => v.status === VehicleStatus.IN_USE && v.currentDriver === currentUser?.name),
  [vehicles, currentUser]);

  const handleSaveVehicle = async (vData: Omit<Vehicle, 'id' | 'status'>) => {
    setIsSyncing(true);
    try {
      // Normalização rigorosa da Unidade
      const unitToSave = (vData.unit || selectedUnit || currentUser?.unit || "").toUpperCase().trim();
      
      // Se a unidade não existe e estamos tentando salvar, tentamos criar a unidade se for admin master
      const unitExists = units.some(u => u.name.toUpperCase() === unitToSave);
      if (!unitExists && unitToSave !== "" && unitToSave !== "GLOBAL") {
        if (isProgrammer) {
          const { error: unitErr } = await supabase.from('units').insert({ name: unitToSave });
          if (unitErr) throw new Error(`Não foi possível criar a base ${unitToSave}.`);
        } else {
          throw new Error(`A base ${unitToSave} não está cadastrada. Contate o administrador.`);
        }
      }

      const finalImage = vData.image || DEFAULT_VEHICLE_IMAGES[vData.category || 'VTR'];

      // Payload sem pending_services para evitar erro de schema cache
      const dbPayload: any = {
        plate: vData.plate.toUpperCase().trim().replace(/\s/g, ''),
        model: vData.model.toUpperCase().trim(),
        year: Number(vData.year),
        category: vData.category,
        image: finalImage,
        unit: unitToSave,
        last_km_oil: Number(vData.lastKmOil) || 0,
        last_km_revision: Number(vData.lastKmRevision) || 0,
        last_km_front_tire: Number(vData.lastKmFrontTire) || 0,
        last_km_rear_tire: Number(vData.lastKmRearTire) || 0,
        last_km_front_brake: Number(vData.lastKmFrontBrake) || 0,
        last_km_rear_brake: Number(vData.lastKmRearBrake) || 0,
        last_km_alignment: Number(vData.lastKmAlignment) || 0,
        last_km_brake_fluid: Number(vData.lastKmBrakeFluid) || 0,
        last_km_transmission: Number(vData.lastKmTransmission) || 0,
        last_maintenance_km: Number(vData.lastMaintenanceKm) || 0,
        int_oil: Number(vData.intOil) || 10000
      };

      if (editingVehicle && !isCloneMode) {
        const { error } = await supabase.from('vehicles').update(dbPayload).eq('id', editingVehicle.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('vehicles').insert({
          ...dbPayload,
          status: VehicleStatus.AVAILABLE,
          current_driver: null
        });
        if (error) throw error;
      }

      addNotification("Dados salvos com sucesso.", "success");
      setShowVehicleForm(false);
      setEditingVehicle(null);
      setIsCloneMode(false);
      await loadInitialData();
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      addNotification(err.message || "Falha na comunicação com o banco de dados.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#020617]"><div className="loader"></div></div>;
  if (viewState === 'auth') return <Login onLoginSuccess={handleLoginSuccess} onStartSetup={() => {}} />;
  
  if (viewState === 'role_selection' && currentUser) {
    return <FunctionSelection 
      user={currentUser} 
      onSelect={(r) => { 
        setActiveRole(r); 
        if (r === UserRole.PROGRAMMER) setViewState('programmer_console');
        else { setSelectedUnit(currentUser.unit); setViewState('app'); }
      }} 
      onLogout={handleLogout} 
    />;
  }

  // CENTRAL DE COMANDO
  if (viewState === 'programmer_console' && currentUser) {
    return (
      <div className="min-h-screen bg-[#020617] p-6 md:p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">Central de <span className="text-rose-500">Comando</span></h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3 italic">Gestão Global de Bases e Patrimônio</p>
            </div>
            <div className="flex gap-4">
               <button onClick={() => setViewState('role_selection')} className="px-6 py-4 bg-slate-900 border border-slate-800 text-slate-500 rounded-2xl text-[9px] font-black uppercase hover:text-white transition-all">Voltar</button>
               <button onClick={handleLogout} className="px-6 py-4 bg-rose-600/10 border border-rose-500/20 text-rose-500 rounded-2xl text-[9px] font-black uppercase hover:bg-rose-600 transition-all">Sair</button>
            </div>
          </div>

          <UnitManagement 
            currentUser={currentUser} 
            vehicles={vehicles} 
            users={users} 
            units={units} 
            allRecords={records} 
            currentSelectedUnit={selectedUnit}
            onSwitchUnit={(unitName) => { setSelectedUnit(unitName); setViewState('app'); }}
            onAddUnit={async (n) => { await supabase.from('units').insert({ name: n }); loadInitialData(); }} 
            onDeleteUnit={async (id) => { if(confirm("EXCLUIR BASE?")) { await supabase.from('units').delete().eq('id', id); loadInitialData(); } }} 
            onUpdateUnit={() => {}} 
            onAddVehicle={() => { setEditingVehicle(null); setIsCloneMode(false); setShowVehicleForm(true); }} 
            onEditVehicle={(v) => { setEditingVehicle(v); setIsCloneMode(false); setShowVehicleForm(true); }} 
            onDeleteVehicle={async (id) => { if(confirm("EXCLUIR VEÍCULO?")) { await supabase.from('vehicles').delete().eq('id', id); loadInitialData(); } }} 
            onUpdateStatus={() => {}} 
            onAddUser={() => {}} 
            onUpdateUser={(u) => { setEditingUser(u); setShowUserForm(true); }} 
            onTransferUser={async (u, t) => { await supabase.from('profiles').update({ unit: t }).eq('id', u.id); loadInitialData(); }} 
            onTransferVehicle={async (v, t) => { await supabase.from('vehicles').update({ unit: t }).eq('id', v.id); loadInitialData(); }} 
            activeRole={activeRole!} 
            transferRequests={transferRequests} 
            onResolveTransfer={() => {}} 
          />
          
          {showVehicleForm && (
            <div className="fixed inset-0 bg-black/80 z-[2000] overflow-y-auto p-4 md:p-12">
               <VehicleForm 
                 isSyncing={isSyncing} 
                 onSubmit={handleSaveVehicle} 
                 onCancel={() => { setShowVehicleForm(false); setEditingVehicle(null); setIsCloneMode(false); }} 
                 initialData={editingVehicle || undefined}
                 isCloneMode={isCloneMode}
                 currentUser={{...currentUser!, unit: selectedUnit}} 
                 activeRole={activeRole!} 
               />
            </div>
          )}
        </div>
      </div>
    );
  }

  // MODO OPERACIONAL
  const displayVehicles = vehicles.filter(v => v.unit === selectedUnit);
  const displayUsers = users.filter(u => u.unit === selectedUnit);

  const NavItem: React.FC<{ id: Section, label: string, icon: string }> = ({ id, label, icon }) => (
    <button onClick={() => { setActiveSection(id); setShowActiveHub(false); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${activeSection === id && !showActiveHub ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
      <span className="text-lg">{icon}</span> {label}
    </button>
  );

  return (
    <div className="h-screen flex bg-[#020617] text-white overflow-hidden">
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45]" onClick={() => setIsMobileMenuOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] border-r border-slate-800 transition-transform lg:relative lg:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-slate-800 flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-xl mb-4">⚡</div>
          <h1 className="text-xl font-black uppercase tracking-tighter">Check<span className="text-blue-500">VTR</span></h1>
        </div>
        <nav className="p-6 space-y-2 flex-grow overflow-y-auto custom-scrollbar">
          <NavItem id="dashboard" label="Painel" icon="📊" />
          <NavItem id="fleet" label="Frota" icon="🚓" />
          {isAdmin && <NavItem id="maintenance" label="Oficina" icon="🔧" />}
          <NavItem id="fuel" label="Consumo" icon="⛽" />
          <NavItem id="reports" label="Auditoria" icon="📋" />
          {isAdmin && <NavItem id="users" label="Efetivo" icon="👮" />}
          {isProgrammer && <NavItem id="database" label="Sistema" icon="💾" />}
        </nav>
        <div className="p-6 border-t border-slate-800 space-y-2">
           <button onClick={() => setViewState(isProgrammer ? 'programmer_console' : 'role_selection')} className="w-full py-3 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase">
             {isProgrammer ? 'Central de Comando' : 'Trocar Função'}
           </button>
           <button onClick={handleLogout} className="w-full py-3 bg-rose-600/10 text-rose-500 border border-rose-500/20 rounded-xl text-[9px] font-black uppercase">Sair</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="p-4 md:p-6 border-b border-slate-800 bg-[#0a0a0a] flex justify-between items-center z-40">
           <div className="flex items-center gap-4">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg></button>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{selectedUnit}</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                 <span className="block text-[10px] font-black uppercase">{currentUser?.name}</span>
                 <span className="block text-[8px] text-slate-500 font-bold">{activeRole}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 font-black">{currentUser?.name?.charAt(0)}</div>
           </div>
        </header>

        <main className="flex-grow overflow-y-auto p-4 md:p-8 lg:p-12 custom-scrollbar">
          {showVehicleForm ? (
            <VehicleForm 
              isSyncing={isSyncing} 
              onSubmit={handleSaveVehicle} 
              onCancel={() => { setShowVehicleForm(false); setEditingVehicle(null); setIsCloneMode(false); }} 
              initialData={editingVehicle || undefined}
              isCloneMode={isCloneMode}
              currentUser={{...currentUser!, unit: selectedUnit}} 
              activeRole={activeRole!} 
            />
          ) : (
            <>
              {activeSection === 'dashboard' && <Dashboard vehicles={displayVehicles} records={records} fuelRecords={fuelRecords} currentUser={{...currentUser!, unit: selectedUnit}} onQuickAction={(v) => { setSelectedVehicle(v); setShowCheckInForm(true); }} onFuelAction={(v) => { setSelectedVehicle(v); setShowFuelForm(true); }} onStatsClick={() => {}} isAdmin={isAdmin} onNotifyClick={() => setShowActiveHub(true)} pendingUsersCount={userActiveVehicle ? 1 : 0} />}
              {activeSection === 'fleet' && <VehicleList vehicles={displayVehicles} fuelRecords={fuelRecords} currentUser={{...currentUser!, unit: selectedUnit}} allRecords={records} activeRole={activeRole!} onSelectVehicle={(v) => { setSelectedVehicle(v); setShowCheckInForm(true); }} onFuelAction={(v) => { setSelectedVehicle(v); setShowFuelForm(true); }} onAddClick={() => { setEditingVehicle(null); setIsCloneMode(false); setShowVehicleForm(true); }} onEditVehicle={(v) => { setEditingVehicle(v); setIsCloneMode(false); setShowVehicleForm(true); }} onCloneVehicle={(v) => { setEditingVehicle(v); setIsCloneMode(true); setShowVehicleForm(true); }} onDeleteVehicle={async (id) => { if(confirm("EXCLUIR?")) { await supabase.from('vehicles').delete().eq('id', id); loadInitialData(); } }} onUpdateStatus={async (id, s) => { await supabase.from('vehicles').update({ status: s }).eq('id', id); loadInitialData(); }} onTransferVehicle={() => {}} />}
              {activeSection === 'maintenance' && isAdmin && <MaintenanceManagement vehicles={displayVehicles} records={records} fuelRecords={fuelRecords} tireRecords={[]} onUpdateMaintenance={async (vid, k, val) => { await supabase.from('vehicles').update({ [k]: val, last_maintenance_km: val }).eq('id', vid); loadInitialData(); }} onUpdateTire={() => {}} onResolveObservations={async (ids) => { await supabase.from('check_records').update({ is_resolved: true }).in('id', ids); loadInitialData(); }} onUpdateObservation={() => {}} activeRole={activeRole!} currentUser={{...currentUser!, unit: selectedUnit}} />}
              {activeSection === 'fuel' && <FuelHistory vehicles={displayVehicles} records={fuelRecords} onAddManual={() => { setSelectedVehicle(null); setShowFuelForm(true); }} isAdmin={isAdmin} />}
              {activeSection === 'reports' && <UsageReports vehicles={displayVehicles} records={records} fuelRecords={fuelRecords} currentUser={{...currentUser!, unit: selectedUnit}} />}
              {activeSection === 'users' && isAdmin && <UserManagement users={displayUsers} currentUser={{...currentUser!, unit: selectedUnit}} activeRole={activeRole!} units={units.map(u => u.name)} onAddUser={async (u) => { await supabase.from('profiles').insert({...u, unit: selectedUnit}); loadInitialData(); }} onUpdateUser={async (u) => { await supabase.from('profiles').update(u).eq('id', u.id); loadInitialData(); }} onDeleteUser={() => {}} transferRequests={[]} onResolveTransfer={() => {}} onTransferUser={() => {}} onEditUser={(u) => { setEditingUser(u); setShowUserForm(true); }} />}
              {activeSection === 'database' && isProgrammer && <DatabaseManager state={{units, vehicles, users, records, fuelRecords, transferRequests}} onImport={() => {}} onSyncManual={loadInitialData} isSyncing={isSyncing} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
