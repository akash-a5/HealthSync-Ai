import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Import initial data and types
import { getInitialMedicines, getInitialBeds, getInitialDoctors, getInitialPatients, mockPHCs } from './src/utils/mockData.js';
import { Medicine, Bed, Doctor, Patient } from './src/types.js';

dotenv.config();

// ES module path resolution support
let currentFilename = '';
try {
  currentFilename = fileURLToPath(import.meta.url);
} catch (error) {
  currentFilename = __filename;
}
const currentDirname = path.dirname(currentFilename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Local File Database
const dbDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dbDir, 'database.json');

interface DatabaseSchema {
  medicines: Medicine[];
  beds: Bed[];
  doctors: Doctor[];
  patients: Patient[];
}

function initializeDatabase() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    const defaultDb: DatabaseSchema = {
      medicines: getInitialMedicines(),
      beds: getInitialBeds(),
      doctors: getInitialDoctors(),
      patients: getInitialPatients(),
    };
    fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2), 'utf-8');
    console.log('Database initialized with seed data.');
  }
}

initializeDatabase();

function readDatabase(): DatabaseSchema {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file, returning defaults.', error);
    return { medicines: [], beds: [], doctors: [], patients: [] };
  }
}

function writeDatabase(data: DatabaseSchema) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to database file.', error);
  }
}

// Instantiate Gemini API Client (Lazy load / Safe check)
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('WARNING: GEMINI_API_KEY is not defined. AI features will fallback to deterministic predictions.');
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// --- REST API ENDPOINTS ---

// 1. Get Connected PHCs
app.get('/api/phcs', (req, res) => {
  res.json(mockPHCs);
});

// 2. Get All Records
app.get('/api/data', (req, res) => {
  const db = readDatabase();
  const { phcId } = req.query;

  if (phcId && phcId !== 'all') {
    res.json({
      medicines: db.medicines.filter(m => m.phcId === phcId),
      beds: db.beds.filter(b => b.phcId === phcId),
      doctors: db.doctors.filter(d => d.phcId === phcId),
      patients: db.patients.filter(p => p.phcId === phcId),
    });
  } else {
    res.json(db);
  }
});

// 3. Medicine Endpoints (Add / Edit / Delete)
app.post('/api/medicines', (req, res) => {
  const db = readDatabase();
  const medicine: Medicine = req.body;

  if (!medicine.id) {
    // Add new
    medicine.id = 'med_' + Math.random().toString(36).substr(2, 9);
    db.medicines.push(medicine);
  } else {
    // Edit existing
    const idx = db.medicines.findIndex(m => m.id === medicine.id);
    if (idx !== -1) {
      db.medicines[idx] = { ...db.medicines[idx], ...medicine };
    } else {
      db.medicines.push(medicine);
    }
  }

  writeDatabase(db);
  res.json({ success: true, medicine });
});

app.delete('/api/medicines/:id', (req, res) => {
  const db = readDatabase();
  const { id } = req.params;
  db.medicines = db.medicines.filter(m => m.id !== id);
  writeDatabase(db);
  res.json({ success: true });
});

// 4. Bed Endpoints (Update bed status / Assign patient)
app.post('/api/beds', (req, res) => {
  const db = readDatabase();
  const { id, status, patientId, patientName } = req.body;

  const idx = db.beds.findIndex(b => b.id === id);
  if (idx !== -1) {
    db.beds[idx].status = status;
    if (status === 'Occupied') {
      db.beds[idx].patientId = patientId;
      db.beds[idx].patientName = patientName;
      db.beds[idx].admittedDate = new Date().toISOString().split('T')[0];
    } else {
      delete db.beds[idx].patientId;
      delete db.beds[idx].patientName;
      delete db.beds[idx].admittedDate;
    }
    writeDatabase(db);
    res.json({ success: true, bed: db.beds[idx] });
  } else {
    res.status(404).json({ error: 'Bed not found' });
  }
});

// 5. Doctor Endpoints (Add / Schedule / Log Attendance)
app.post('/api/doctors', (req, res) => {
  const db = readDatabase();
  const doctor: Doctor = req.body;

  if (!doctor.id) {
    doctor.id = 'doc_' + Math.random().toString(36).substr(2, 9);
    doctor.attendance = [];
    db.doctors.push(doctor);
  } else {
    const idx = db.doctors.findIndex(d => d.id === doctor.id);
    if (idx !== -1) {
      db.doctors[idx] = { ...db.doctors[idx], ...doctor };
    } else {
      db.doctors.push(doctor);
    }
  }

  writeDatabase(db);
  res.json({ success: true, doctor });
});

app.post('/api/doctors/:id/attendance', (req, res) => {
  const db = readDatabase();
  const { id } = req.params;
  const { date, present } = req.body;

  const idx = db.doctors.findIndex(d => d.id === id);
  if (idx !== -1) {
    const attIdx = db.doctors[idx].attendance.findIndex(a => a.date === date);
    if (attIdx !== -1) {
      db.doctors[idx].attendance[attIdx].present = present;
    } else {
      db.doctors[idx].attendance.push({ date, present });
    }
    writeDatabase(db);
    res.json({ success: true, doctor: db.doctors[idx] });
  } else {
    res.status(404).json({ error: 'Doctor not found' });
  }
});

// 6. Patient Endpoints (Register Patient / Diagnose / Book Appointment)
app.post('/api/patients', (req, res) => {
  const db = readDatabase();
  const patient: Patient = req.body;

  if (!patient.id) {
    patient.id = 'pat_' + Math.random().toString(36).substr(2, 9);
    patient.registrationDate = new Date().toISOString().split('T')[0];
    patient.history = patient.history || [];
    patient.appointments = patient.appointments || [];
    db.patients.push(patient);
  } else {
    const idx = db.patients.findIndex(p => p.id === patient.id);
    if (idx !== -1) {
      db.patients[idx] = { ...db.patients[idx], ...patient };
    } else {
      db.patients.push(patient);
    }
  }

  writeDatabase(db);
  res.json({ success: true, patient });
});

app.post('/api/patients/:id/diagnose', (req, res) => {
  const db = readDatabase();
  const { id } = req.params;
  const { diagnosis, treatment, doctorName } = req.body;

  const idx = db.patients.findIndex(p => p.id === id);
  if (idx !== -1) {
    const diagnosisRecord = {
      id: 'diag_' + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      diagnosis,
      treatment,
      doctorName,
    };
    db.patients[idx].history.push(diagnosisRecord);
    writeDatabase(db);
    res.json({ success: true, patient: db.patients[idx] });
  } else {
    res.status(404).json({ error: 'Patient not found' });
  }
});

app.post('/api/appointments', (req, res) => {
  const db = readDatabase();
  const { patientId, doctorId, date, time } = req.body;

  const pIdx = db.patients.findIndex(p => p.id === patientId);
  const dIdx = db.doctors.findIndex(d => d.id === doctorId);

  if (pIdx !== -1 && dIdx !== -1) {
    const doctor = db.doctors[dIdx];
    const appointment = {
      id: 'apt_' + Math.random().toString(36).substr(2, 9),
      date,
      time,
      doctorId,
      doctorName: doctor.name,
      status: 'Scheduled' as const,
    };

    db.patients[pIdx].appointments.push(appointment);
    writeDatabase(db);
    res.json({ success: true, patient: db.patients[pIdx] });
  } else {
    res.status(404).json({ error: 'Patient or Doctor not found' });
  }
});

app.post('/api/appointments/:aptId/status', (req, res) => {
  const db = readDatabase();
  const { aptId } = req.params;
  const { status, patientId } = req.body; // 'Scheduled' | 'Completed' | 'Cancelled'

  const pIdx = db.patients.findIndex(p => p.id === patientId);
  if (pIdx !== -1) {
    const aptIdx = db.patients[pIdx].appointments.findIndex(a => a.id === aptId);
    if (aptIdx !== -1) {
      db.patients[pIdx].appointments[aptIdx].status = status;
      writeDatabase(db);
      res.json({ success: true, patient: db.patients[pIdx] });
      return;
    }
  }
  res.status(404).json({ error: 'Appointment not found' });
});


// --- 7. GOOGLE GEMINI AI PREDICTIONS & ANALYSIS ---
app.post('/api/ai/predictions', async (req, res) => {
  const db = readDatabase();
  const { phcId } = req.body;

  // Compile full system context to supply to Gemini
  const activePHC = mockPHCs.find(p => p.id === phcId) || mockPHCs[0];
  const allBeds = db.beds;
  const allMedicines = db.medicines;
  const allDoctors = db.doctors;
  const allPatients = db.patients;

  const systemContextPrompt = `
You are the central AI coordinator for Karnataka State Public Health Centers.
The current active center is: ${activePHC.name} (${activePHC.type} located in ${activePHC.location}).
All connected health centers are: ${JSON.stringify(mockPHCs)}.

Current Database State:
1. MEDICINE INVENTORY:
${JSON.stringify(allMedicines.map(m => ({ id: m.id, name: m.name, category: m.category, stock: m.stock, minStock: m.minStock, expiryDate: m.expiryDate, usageRatePerDay: m.usageRatePerDay, unit: m.unit, phcId: m.phcId })))}

2. BED MANAGEMENT:
${JSON.stringify(allBeds.map(b => ({ id: b.id, type: b.type, status: b.status, phcId: b.phcId })))}

3. DOCTORS SCHEDULES & ATTENDANCE:
${JSON.stringify(allDoctors.map(d => ({ id: d.id, name: d.name, department: d.department, status: d.status, shift: d.shift, phcId: d.phcId })))}

4. RECENT PATIENTS:
${JSON.stringify(allPatients.map(p => ({ name: p.name, age: p.age, gender: p.gender, phcId: p.phcId, registrationDate: p.registrationDate, history: p.history, appointments: p.appointments })))}

Analyze this exact health data and return predictions and action recommendations:
- "shortages": Predict which medicines are at risk of running out in the next 30 days based on (stock / usageRatePerDay) and expiry dates.
- "footfall": Forecast the expected patient footfall count for the next 7 days based on recent appointments/registrations. Supply dates in 'YYYY-MM-DD' format starting from June 28, 2026.
- "transfers": Identify surplus medicines or beds at some centers and recommend transferring them to centers facing high demand (e.g., Indiranagar PHC is extremely low on Amoxicillin and Cetirizine, whereas Jayanagar CHC has substantial excess. Whitefield also has low stock. Suggest specific medicine transfer requests!).
- "insights": Generate 4 actionable high-level healthcare operational insights to improve delivery, scheduling, or cost savings.

You MUST respond strictly with a valid JSON object matching this schema structure:
{
  "shortages": [
    {
      "medicineId": "string",
      "medicineName": "string",
      "daysRemaining": number,
      "severity": "High" | "Medium" | "Low",
      "recommendation": "string"
    }
  ],
  "footfall": [
    {
      "date": "string (YYYY-MM-DD)",
      "predictedCount": number,
      "trend": "Rising" | "Stable" | "Falling",
      "reason": "string"
    }
  ],
  "transfers": [
    {
      "medicineName": "string",
      "sourcePHC": "string (PHC Name)",
      "destinationPHC": "string (PHC Name)",
      "quantity": number,
      "reason": "string"
    }
  ],
  "insights": [
    "string"
  ]
}
`;

  const ai = getGeminiClient();
  if (!ai) {
    // Deterministic Mock AI Fallback if Gemini key is missing
    const shortages = allMedicines
      .filter(m => m.phcId === phcId && (m.stock <= m.minStock || new Date(m.expiryDate) < new Date('2026-11-01')))
      .map(m => {
        const days = m.usageRatePerDay > 0 ? Math.floor(m.stock / m.usageRatePerDay) : 90;
        return {
          medicineId: m.id,
          medicineName: m.name,
          daysRemaining: days,
          severity: (days < 5 ? 'High' : days < 15 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
          recommendation: `Request transfer of ${m.name} from Jayanagar CHC, which holds a surplus supply.`,
        };
      });

    const footfall = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date('2026-06-28');
      d.setDate(d.getDate() + i);
      const day = d.getDay();
      const count = day === 0 ? 8 : day === 1 ? 32 : 18 + Math.floor(Math.random() * 10); // Higher on Mondays
      return {
        date: d.toISOString().split('T')[0],
        predictedCount: count,
        trend: (day === 1 ? 'Rising' : day === 2 ? 'Falling' : 'Stable') as 'Rising' | 'Stable' | 'Falling',
        reason: day === 1 ? 'Typical Monday outpatient surge.' : 'Mid-week stabilization.',
      };
    });

    const transfers = [
      {
        medicineName: 'Amoxicillin 250mg',
        sourcePHC: 'Jayanagar CHC',
        destinationPHC: activePHC.name,
        quantity: 400,
        reason: `${activePHC.name} is running critically low (stock: ${allMedicines.find(m => m.name === 'Amoxicillin 250mg' && m.phcId === phcId)?.stock || 150} units), while Jayanagar CHC has excess storage (1400 units).`
      },
      {
        medicineName: 'Cetirizine 10mg',
        sourcePHC: 'Jayanagar CHC',
        destinationPHC: activePHC.name,
        quantity: 200,
        reason: `${activePHC.name} is facing a severe seasonal allergy deficit.`
      }
    ];

    const insights = [
      'Seasonal fluctuations indicate a potential 15% increase in pediatric asthma cases next week; prepare nebulizer kits.',
      'Amlodipine stocks are high and healthy, sufficient for the next 45 days.',
      'Bed Occupancy is currently at 50% across ICU units; general beds are well balanced.',
      'Doctor attendance rates are strong, though Dr. Priya Sharma is covering extra shifts due to general surgeon leaves.'
    ];

    return res.json({ shortages, footfall, transfers, insights });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: systemContextPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shortages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  medicineId: { type: Type.STRING },
                  medicineName: { type: Type.STRING },
                  daysRemaining: { type: Type.INTEGER },
                  severity: { type: Type.STRING, description: "Must be 'High', 'Medium', or 'Low'" },
                  recommendation: { type: Type.STRING }
                },
                required: ["medicineId", "medicineName", "daysRemaining", "severity", "recommendation"]
              }
            },
            footfall: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  predictedCount: { type: Type.INTEGER },
                  trend: { type: Type.STRING, description: "Must be 'Rising', 'Stable', or 'Falling'" },
                  reason: { type: Type.STRING }
                },
                required: ["date", "predictedCount", "trend", "reason"]
              }
            },
            transfers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  medicineName: { type: Type.STRING },
                  sourcePHC: { type: Type.STRING },
                  destinationPHC: { type: Type.STRING },
                  quantity: { type: Type.INTEGER },
                  reason: { type: Type.STRING }
                },
                required: ["medicineName", "sourcePHC", "destinationPHC", "quantity", "reason"]
              }
            },
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["shortages", "footfall", "transfers", "insights"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || '{}');
    res.json(parsedData);
  } catch (error) {
    console.error('Gemini prediction API failed, falling back.', error);
    res.status(500).json({ error: 'Failed to generate AI predictions' });
  }
});

// --- 8. GOOGLE GEMINI AI HEALTH ASSISTANT CHAT ---
app.post('/api/ai/chat', async (req, res) => {
  const { message, phcId, history } = req.body;
  const db = readDatabase();

  const activePHC = mockPHCs.find(p => p.id === phcId) || mockPHCs[0];
  const activeMeds = db.medicines.filter(m => m.phcId === phcId);
  const activeBeds = db.beds.filter(b => b.phcId === phcId);
  const activeDocs = db.doctors.filter(d => d.phcId === phcId);

  const contextPrompt = `
You are the HealthSync AI Co-Pilot, an intelligent, empathetic, and highly resourceful operational and clinical assistant designed for Primary Health Centers.
You are chatting with a healthcare professional (admin, doctor, or inventory manager) at ${activePHC.name}.

The current center state of ${activePHC.name} is:
- Medicine Stock: ${activeMeds.length} tracked formulations. Low stock items: ${activeMeds.filter(m => m.stock <= m.minStock).map(m => `${m.name} (${m.stock} units left)`).join(', ') || 'None'}.
- Bed Capacity: ICU Available: ${activeBeds.filter(b => b.type === 'ICU' && b.status === 'Available').length}/${activeBeds.filter(b => b.type === 'ICU').length}, General Available: ${activeBeds.filter(b => b.type === 'General' && b.status === 'Available').length}/${activeBeds.filter(b => b.type === 'General').length}.
- Active Doctors: ${activeDocs.filter(d => d.status === 'Active').map(d => `${d.name} (${d.department})`).join(', ') || 'No doctors active'}.

Please help answer the user query professionally, accurately, and aligned with standard medical guidelines and efficient supply chain practices. If they ask for clinical advice, formulate structured responses but always advise verifying with an attending physician. Keep your tone concise, supportive, and action-oriented.
`;

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      text: `Hello! I am HealthSync AI, running in diagnostic mode because the GEMINI_API_KEY environment variable is not set. 

Based on the local database for **${activePHC.name}**, here is an instant update:
- **Low Stock alert**: We have critical stock levels for medicines. You should look into procuring more capsules of antibiotics.
- **Beds**: We currently have ${activeBeds.filter(b => b.status === 'Available').length} vacant beds ready for admission.
- **Doctors**: Dr. Aarav Mehta and Dr. Priya Sharma are presently active in general outpatient rooms.

How can I assist you with clinical guidelines, inventory reordering, or booking shifts today?`
    });
  }

  try {
    const formattedContents = [
      { role: 'user', parts: [{ text: contextPrompt }] }
    ];

    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        formattedContents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });
    }

    formattedContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: formattedContents,
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error('Gemini Chat API failed.', error);
    res.status(500).json({ error: 'AI Assistant failed to generate response.' });
  }
});


// --- VITE DEV SERVER OR STATIC ASSETS ROUTING ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware integrated.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static build.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HealthSync AI server booted on host 0.0.0.0, port ${PORT}`);
  });
}

startServer();
