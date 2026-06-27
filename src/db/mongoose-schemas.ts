// @ts-nocheck
/**
 * HealthSync AI - Mongoose Schemas for MongoDB (Production Database)
 * These models define the database structure for production deployment.
 */

import mongoose, { Schema, Document } from 'mongoose';

// 1. PHC Center Schema
export interface IPHCCenter extends Document {
  name: string;
  location: string;
  type: 'PHC' | 'CHC';
  distanceKm: number;
}

export const PHCCenterSchema: Schema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, enum: ['PHC', 'CHC'], required: true },
  distanceKm: { type: Number, default: 0 }
}, { timestamps: true });


// 2. Medicine Schema
export interface IMedicine extends Document {
  name: string;
  category: string;
  batchNumber: string;
  stock: number;
  minStock: number;
  expiryDate: Date;
  usageRatePerDay: number;
  unit: string;
  phcId: mongoose.Types.ObjectId;
}

export const MedicineSchema: Schema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  batchNumber: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 },
  minStock: { type: Number, required: true, default: 100 },
  expiryDate: { type: Date, required: true },
  usageRatePerDay: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true, default: 'Tablets' },
  phcId: { type: Schema.Types.ObjectId, ref: 'PHCCenter', required: true }
}, { timestamps: true });


// 3. Bed Schema
export interface IBed extends Document {
  type: 'ICU' | 'General';
  status: 'Available' | 'Occupied';
  patientId?: mongoose.Types.ObjectId;
  patientName?: string;
  admittedDate?: Date;
  phcId: mongoose.Types.ObjectId;
}

export const BedSchema: Schema = new Schema({
  type: { type: String, enum: ['ICU', 'General'], required: true },
  status: { type: String, enum: ['Available', 'Occupied'], required: true, default: 'Available' },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
  patientName: { type: String },
  admittedDate: { type: Date },
  phcId: { type: Schema.Types.ObjectId, ref: 'PHCCenter', required: true }
}, { timestamps: true });


// 4. Doctor Schema
export interface IDoctor extends Document {
  name: string;
  department: string;
  status: 'Active' | 'On Leave' | 'Off Duty';
  shift: 'Morning' | 'Evening' | 'Night';
  contact: string;
  attendance: {
    date: Date;
    present: boolean;
  }[];
  phcId: mongoose.Types.ObjectId;
}

export const DoctorSchema: Schema = new Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  status: { type: String, enum: ['Active', 'On Leave', 'Off Duty'], required: true, default: 'Active' },
  shift: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
  contact: { type: String, required: true },
  attendance: [{
    date: { type: Date, required: true },
    present: { type: Boolean, required: true }
  }],
  phcId: { type: Schema.Types.ObjectId, ref: 'PHCCenter', required: true }
}, { timestamps: true });


// 5. Patient Schema
export interface IPatient extends Document {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  bloodGroup?: string;
  history: {
    date: Date;
    diagnosis: string;
    treatment: string;
    doctorName: string;
  }[];
  appointments: {
    date: Date;
    time: string;
    doctorId: mongoose.Types.ObjectId;
    doctorName: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
  }[];
  registrationDate: Date;
  phcId: mongoose.Types.ObjectId;
}

export const PatientSchema: Schema = new Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  contact: { type: String, required: true },
  bloodGroup: { type: String },
  history: [{
    date: { type: Date, default: Date.now },
    diagnosis: { type: String, required: true },
    treatment: { type: String, required: true },
    doctorName: { type: String, required: true }
  }],
  appointments: [{
    date: { type: Date, required: true },
    time: { type: String, required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    doctorName: { type: String, required: true },
    status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' }
  }],
  registrationDate: { type: Date, default: Date.now },
  phcId: { type: Schema.Types.ObjectId, ref: 'PHCCenter', required: true }
}, { timestamps: true });

// Export Compiled Models (Optional if utilizing MongoDB inside Node backend)
export const PHCCenterModel = mongoose.models.PHCCenter || mongoose.model<IPHCCenter>('PHCCenter', PHCCenterSchema);
export const MedicineModel = mongoose.models.Medicine || mongoose.model<IMedicine>('Medicine', MedicineSchema);
export const BedModel = mongoose.models.Bed || mongoose.model<IBed>('Bed', BedSchema);
export const DoctorModel = mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema);
export const PatientModel = mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);
