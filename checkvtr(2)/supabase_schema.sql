
-- 0. HABILITAR EXTENSÃO DE UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE UNIDADES (BASES)
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '100 years'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active'
);

-- 2. TABELA DE CONFIGURAÇÕES
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE PERFIS (POLICIAIS)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
    name TEXT NOT NULL,
    registration TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    raw_password TEXT,
    unit TEXT REFERENCES public.units(name) ON DELETE SET NULL,
    roles TEXT[] DEFAULT '{OPERACIONAL}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE VEÍCULOS (FROTA)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate TEXT UNIQUE NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    category TEXT CHECK (category IN ('VTR', 'MR')),
    image TEXT,
    unit TEXT REFERENCES public.units(name) ON DELETE CASCADE,
    status TEXT DEFAULT 'Disponível',
    current_driver TEXT,
    last_km_oil INTEGER DEFAULT 0,
    last_km_revision INTEGER DEFAULT 0,
    last_km_front_tire INTEGER DEFAULT 0,
    last_km_rear_tire INTEGER DEFAULT 0,
    last_km_front_brake INTEGER DEFAULT 0,
    last_km_rear_brake INTEGER DEFAULT 0,
    last_km_alignment INTEGER DEFAULT 0,
    last_km_brake_fluid INTEGER DEFAULT 0,
    last_km_transmission INTEGER DEFAULT 0,
    int_oil INTEGER DEFAULT 10000,
    last_maintenance_km INTEGER DEFAULT 0,
    pending_services TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE SOLICITAÇÕES DE TRANSFERÊNCIA
CREATE TABLE IF NOT EXISTS public.transfer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('USER', 'VEHICLE')),
    item_id UUID NOT NULL,
    item_name TEXT, 
    from_unit TEXT REFERENCES public.units(name) ON DELETE CASCADE,
    to_unit TEXT REFERENCES public.units(name) ON DELETE CASCADE,
    requester_id UUID REFERENCES public.profiles(id),
    requester_name TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE REGISTROS (CHECKLISTS)
CREATE TABLE IF NOT EXISTS public.check_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    driver_name TEXT NOT NULL,
    recorded_by_name TEXT,
    km_reading INTEGER NOT NULL,
    type TEXT CHECK (type IN ('Saída', 'Retorno')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    photos TEXT[] DEFAULT '{}',
    notes TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    unit TEXT REFERENCES public.units(name) ON DELETE CASCADE,
    reason TEXT,
    ai_analysis TEXT,
    checklist JSONB DEFAULT '{}'
);

-- 7. TABELA DE ABASTECIMENTOS
CREATE TABLE IF NOT EXISTS public.fuel_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    driver_name TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    liters DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(10,2) NOT NULL,
    remaining_balance DECIMAL(10,2) NOT NULL,
    km_at_refueling INTEGER NOT NULL,
    unit TEXT REFERENCES public.units(name) ON DELETE CASCADE
);

-- 8. POLÍTICAS DE SEGURANÇA (RLS)
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas para evitar erro 42710
DROP POLICY IF EXISTS "Allow all public" ON public.units;
DROP POLICY IF EXISTS "Allow all public" ON public.profiles;
DROP POLICY IF EXISTS "Allow all public" ON public.vehicles;
DROP POLICY IF EXISTS "Allow all public" ON public.check_records;
DROP POLICY IF EXISTS "Allow all public" ON public.fuel_records;
DROP POLICY IF EXISTS "Allow all public" ON public.transfer_requests;
DROP POLICY IF EXISTS "Allow all public" ON public.system_settings;

-- Recriação das políticas
CREATE POLICY "Allow all public" ON public.units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public" ON public.check_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public" ON public.fuel_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public" ON public.transfer_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- 9. HABILITAR REALTIME
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.units, 
    public.profiles, 
    public.vehicles, 
    public.check_records,
    public.fuel_records,
    public.transfer_requests,
    public.system_settings;
COMMIT;
