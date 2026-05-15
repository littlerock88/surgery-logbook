import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyBB3IMRMHwhILOElQRPb003eFq32_mtyH8",
  authDomain:        "y6-surgery-logbook.firebaseapp.com",
  projectId:         "y6-surgery-logbook",
  messagingSenderId: "261279317921",
  appId:             "1:261279317921:web:b6aace5c8c13fed8b355e0",
}

const app = initializeApp(firebaseConfig)
const db  = getFirestore(app)

const procedures = [
  { name: 'Arterial puncture for blood gas analysis',         level: '1',   requiredCount: 2, isRequired: true,  roleDesc: 'Performed independently' },
  { name: 'Focused Assessment with Sonography in Trauma (FAST)', level: '1', requiredCount: 2, isRequired: true, roleDesc: 'Performed independently' },
  { name: 'Intercostal drainage',                             level: '1',   requiredCount: 2, isRequired: true,  roleDesc: 'Performed independently' },
  { name: 'Pleural paracentesis',                             level: '2.1', requiredCount: 1, isRequired: true,  roleDesc: 'Under supervision / assisted' },
  { name: 'Abdominal paracentesis',                           level: '2.1', requiredCount: 1, isRequired: true,  roleDesc: 'Under supervision / assisted' },
  { name: 'Venesection or central venous catheterization',    level: '2.1', requiredCount: 1, isRequired: true,  roleDesc: 'Under supervision / assisted' },
  { name: 'Biopsy of skin, superficial mass',                 level: '2.1', requiredCount: 1, isRequired: true,  roleDesc: 'Under supervision / assisted' },
  { name: 'Appendectomy',                                     level: '2.2', requiredCount: 1, isRequired: true,  roleDesc: 'Under supervision / assisted' },
  { name: 'Needle biopsy of breast',                          level: '2.2', requiredCount: 1, isRequired: true,  roleDesc: 'Under supervision / assisted' },
  { name: 'Circumcision',                                     level: '3',   requiredCount: 0, isRequired: false, roleDesc: 'Observed or assisted (optional)' },
  { name: 'Suprapubic tap',                                   level: '3',   requiredCount: 0, isRequired: false, roleDesc: 'Observed or assisted (optional)' },
  { name: 'Tracheostomy',                                     level: '3',   requiredCount: 0, isRequired: false, roleDesc: 'Observed or assisted (optional)' },
  { name: 'Major OR',                                         level: '5',   requiredCount: 4, isRequired: true,  roleDesc: 'Observed or assisted' },
]

for (const p of procedures) {
  await addDoc(collection(db, 'procedure_catalog'), p)
  console.log('Added:', p.name)
}

console.log('Done!')