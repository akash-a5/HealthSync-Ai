export interface PHCCenter {
  id: string;
  name: string;
  location: string;
  type: 'PHC' | 'CHC';
  distanceKm: number; // Distance from current center for transfers
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  batchNumber: string;
  stock: number;
  minStock: number;
  expiryDate: string;
  usageRatePerDay: number; // Used for predicting shortage
  unit: string;
  phcId: string;
}

export interface Bed {
  id: string;
  type: 'ICU' | 'General';
  status: 'Available' | 'Occupied';
  patientId?: string;
  patientName?: string;
  admittedDate?: string;
  phcId: string;
}

export interface Doctor {
  id: string;
  name: string;
  department: string;
  status: 'Active' | 'On Leave' | 'Off Duty';
  shift: 'Morning' | 'Evening' | 'Night';
  contact: string;
  attendance: {
    date: string;
    present: boolean;
  }[];
  phcId: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  bloodGroup?: string;
  history: {
    id: string;
    date: string;
    diagnosis: string;
    treatment: string;
    doctorName: string;
  }[];
  appointments: {
    id: string;
    date: string;
    time: string;
    doctorId: string;
    doctorName: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
  }[];
  registrationDate: string;
  phcId: string;
}

export interface User {
  id: string;
  username: string;
  role: 'Admin' | 'Doctor' | 'InventoryManager';
  name: string;
  phcId: string;
}

export interface AIAnalysisResult {
  shortages: {
    medicineId: string;
    medicineName: string;
    daysRemaining: number;
    severity: 'High' | 'Medium' | 'Low';
    recommendation: string;
  }[];
  footfall: {
    date: string;
    predictedCount: number;
    trend: 'Rising' | 'Stable' | 'Falling';
    reason: string;
  }[];
  transfers: {
    medicineName: string;
    sourcePHC: string;
    destinationPHC: string;
    quantity: number;
    reason: string;
  }[];
  insights: string[];
}
