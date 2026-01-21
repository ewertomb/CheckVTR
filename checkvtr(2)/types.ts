
export enum VehicleStatus {
  AVAILABLE = 'Disponível',
  IN_USE = 'Em Uso',
  MAINTENANCE = 'Manutenção',
  DEFECTIVE = 'Com Defeito',
  RETIRED = 'Baixada'
}

export enum RecordType {
  CHECK_OUT = 'Saída',
  CHECK_IN = 'Retorno'
}

export enum UserRole {
  PROGRAMMER = 'PROGRAMADOR',
  ADMIN = 'ADMIN',
  PERMANENTE = 'PERMANENTE',
  USER = 'OPERACIONAL'
}

export enum TransferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export interface User {
  id: string;
  name: string;
  email: string;
  registration: string;
  password?: string;
  raw_password?: string;
  unit: string;
  roles: UserRole[];
}

export interface Unit {
  id: string;
  name: string;
  expiresAt: string;
  createdAt: string;
  status?: 'active' | 'blocked';
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  category: 'VTR' | 'MR';
  image: string;
  unit: string;
  status: VehicleStatus;
  currentDriver: string | null;
  lastKmOil: number;
  lastKmRevision: number;
  lastKmFrontTire: number;
  lastKmRearTire: number;
  lastKmFrontBrake: number;
  lastKmRearBrake: number;
  lastKmAlignment: number;
  lastKmBrakeFluid: number;
  lastKmTransmission: number;
  intOil: number;
  lastMaintenanceKm: number;
  pendingServices?: string[];
}

export interface CheckRecord {
  id: string;
  vehicleId: string;
  driverName: string;
  recordedByName?: string;
  kmReading: number;
  type: RecordType;
  timestamp: string;
  photos: string[];
  notes: string;
  isResolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  unit: string;
  reason?: string;
  aiAnalysis?: string;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  driverName: string;
  date: string;
  liters: number;
  totalValue: number;
  remainingBalance: number;
  kmAtRefueling: number;
  unit: string;
}

export interface TransferRequest {
  id: string;
  type: 'USER' | 'VEHICLE';
  itemId: string;
  itemName?: string;
  fromUnit: string;
  toUnit: string;
  requesterId: string;
  requesterName: string;
  status: TransferStatus;
  createdAt: string;
}

// Fix: Added missing TireRecord interface used in MaintenanceManagement
export interface TireRecord {
  id: string;
  vehicleId: string;
  tireType: 'FRONT' | 'REAR';
  prevRequestKm: number;
  requestKm: number;
  officeKm: number;
  requestDate: string;
  requestStatus: string;
  actualChangeKm: number;
  changeDate: string;
  createdAt: string;
  nextRequestKm?: number;
  nextChangeKm?: number;
}

// Fix: Added missing AppState interface used in DatabaseManager
export interface AppState {
  units: Unit[];
  vehicles: Vehicle[];
  users: User[];
  records: CheckRecord[];
  fuelRecords: FuelRecord[];
  transferRequests: TransferRequest[];
  tireRecords?: TireRecord[];
}
