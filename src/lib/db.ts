import { 
  collection, 
  onSnapshot, 
  addDoc, 
  setDoc,
  doc, 
  query, 
  orderBy, 
  getDocs,
  getDocsFromServer,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Building, 
  Floor, 
  Unit, 
  Tenant, 
  Lease, 
  Payment, 
  Document, 
  AuditLog, 
  ApprovalWorkflow, 
  Notification 
} from '../types';
import { 
  sampleBuildings, 
  sampleFloors, 
  sampleUnits, 
  sampleTenants, 
  sampleLeases, 
  samplePayments, 
  sampleDocuments, 
  sampleAuditLogs, 
  sampleWorkflows, 
  sampleNotifications 
} from './seed';

export type CollectionName = 
  | "buildings" 
  | "floors" 
  | "units" 
  | "tenants" 
  | "leases" 
  | "payments" 
  | "documents" 
  | "auditLogs" 
  | "approvalWorkflows" 
  | "notifications";

export type DbMode = "firebase" | "sandbox";

// Retrieve the current DB mode
export function getDbMode(): DbMode {
  const stored = localStorage.getItem("db_mode");
  if (stored === "firebase" || stored === "sandbox") {
    return stored;
  }
  
  // Default to 'sandbox' for safety & immediate usability
  return "sandbox";
}

// Update the DB mode
export function setDbMode(mode: DbMode) {
  localStorage.setItem("db_mode", mode);
}

// Local sandbox in-memory and localStorage cache
const localData: {
  buildings: Building[];
  floors: Floor[];
  units: Unit[];
  tenants: Tenant[];
  leases: Lease[];
  payments: Payment[];
  documents: Document[];
  auditLogs: AuditLog[];
  approvalWorkflows: ApprovalWorkflow[];
  notifications: Notification[];
} = {
  buildings: [],
  floors: [],
  units: [],
  tenants: [],
  leases: [],
  payments: [],
  documents: [],
  auditLogs: [],
  approvalWorkflows: [],
  notifications: []
};

// Listeners list for the local sandbox reactive sync
type Listener<T> = (data: T[]) => void;
const listeners: { [key in CollectionName]: Listener<any>[] } = {
  buildings: [],
  floors: [],
  units: [],
  tenants: [],
  leases: [],
  payments: [],
  documents: [],
  auditLogs: [],
  approvalWorkflows: [],
  notifications: []
};

// Initialize sandbox data from localStorage or seed fallback
function initSandbox() {
  const getOrSeed = <T>(key: CollectionName, fallback: T[]): T[] => {
    const val = localStorage.getItem(`sandbox_${key}`);
    if (val) {
      try {
        return JSON.parse(val);
      } catch (e) {
        console.error(`Error parsing sandbox_${key}, resetting to seed`, e);
      }
    }
    localStorage.setItem(`sandbox_${key}`, JSON.stringify(fallback));
    return fallback;
  };

  localData.buildings = getOrSeed("buildings", sampleBuildings);
  localData.floors = getOrSeed("floors", sampleFloors);
  localData.units = getOrSeed("units", sampleUnits);
  localData.tenants = getOrSeed("tenants", sampleTenants);
  localData.leases = getOrSeed("leases", sampleLeases);
  localData.payments = getOrSeed("payments", samplePayments);
  localData.documents = getOrSeed("documents", sampleDocuments);
  localData.auditLogs = getOrSeed("auditLogs", sampleAuditLogs);
  localData.approvalWorkflows = getOrSeed("approvalWorkflows", sampleWorkflows);
  localData.notifications = getOrSeed("notifications", sampleNotifications);
}

// Run initializer
initSandbox();

// Save sandbox collection and trigger subscribers
function saveAndNotify(key: CollectionName) {
  localStorage.setItem(`sandbox_${key}`, JSON.stringify(localData[key]));
  listeners[key].forEach(cb => cb([...localData[key]]));
}

/**
 * Universal Subscription Helper
 * Dynamically switches between onSnapshot for Firestore and a reactive observer for Local Sandbox.
 */
export function subscribeToCollection<T>(collectionName: CollectionName, callback: (data: T[]) => void): () => void {
  const mode = getDbMode();

  if (mode === "firebase") {
    const q = query(collection(db, collectionName));
    return onSnapshot(q, (snapshot) => {
      const list: T[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as T);
      });
      callback(list);
    }, (err) => {
      console.error(`Firebase error subscribing to ${collectionName}:`, err);
    });
  } else {
    // Sandbox Observer
    if (!listeners[collectionName]) {
      listeners[collectionName] = [];
    }
    listeners[collectionName].push(callback);
    callback([...localData[collectionName]] as T[]);

    return () => {
      listeners[collectionName] = listeners[collectionName].filter(cb => cb !== callback);
    };
  }
}

/**
 * Universal Write Helper
 * Dynamically adds/records a new document to either Firestore or Local Sandbox.
 */
export async function addDocument(collectionName: CollectionName, data: any): Promise<void> {
  const mode = getDbMode();

  // Log audit action
  const logEntry: AuditLog = {
    id: `log-${Date.now()}`,
    action: `${collectionName.slice(0, -1).toUpperCase()}_ADD`,
    user: "User TPMS Enterprise",
    module: collectionName.toUpperCase(),
    timestamp: new Date().toISOString(),
    details: `Menambahkan data baru pada modul ${collectionName}: ${data.name || data.companyName || data.tenantName || data.title || "Record"}`
  };

  if (mode === "firebase") {
    try {
      await addDoc(collection(db, collectionName), data);
      await addDoc(collection(db, "auditLogs"), logEntry);
    } catch (error) {
      console.error(`Firebase write error on collection ${collectionName}:`, error);
      throw error;
    }
  } else {
    const item = { ...data };
    if (!item.id) {
      item.id = `${collectionName.slice(0, 3)}-${Date.now()}`;
    }
    
    (localData[collectionName] as any[]).unshift(item);
    saveAndNotify(collectionName);

    // Save audit log too
    localData.auditLogs.unshift(logEntry);
    saveAndNotify("auditLogs");
  }
}

/**
 * Universal Update Helper
 */
export async function updateDocument(collectionName: CollectionName, id: string, data: any): Promise<void> {
  const mode = getDbMode();

  // Log audit action
  const logEntry: AuditLog = {
    id: `log-${Date.now()}`,
    action: `${collectionName.slice(0, -1).toUpperCase()}_UPDATE`,
    user: "User TPMS Enterprise",
    module: collectionName.toUpperCase(),
    timestamp: new Date().toISOString(),
    details: `Memperbarui data id ${id} pada ${collectionName}`
  };

  if (mode === "firebase") {
    try {
      await setDoc(doc(db, collectionName, id), data, { merge: true });
      await addDoc(collection(db, "auditLogs"), logEntry);
    } catch (error) {
      console.error(`Firebase update error on ${collectionName}:`, error);
      throw error;
    }
  } else {
    localData[collectionName] = (localData[collectionName] as any[]).map(item => 
      item.id === id ? { ...item, ...data } : item
    );
    saveAndNotify(collectionName);

    // Save audit log too
    localData.auditLogs.unshift(logEntry);
    saveAndNotify("auditLogs");
  }
}

/**
 * Universal Delete Helper
 * Dynamically deletes a document from either Firestore or Local Sandbox.
 */
export async function deleteDocument(collectionName: CollectionName, id: string): Promise<void> {
  const mode = getDbMode();

  // Log audit action
  const logEntry: AuditLog = {
    id: `log-${Date.now()}`,
    action: `${collectionName.slice(0, -1).toUpperCase()}_DELETE`,
    user: "User TPMS Enterprise",
    module: collectionName.toUpperCase(),
    timestamp: new Date().toISOString(),
    details: `Menghapus data id ${id} dari ${collectionName}`
  };

  if (mode === "firebase") {
    try {
      await deleteDoc(doc(db, collectionName, id));
      await addDoc(collection(db, "auditLogs"), logEntry);
    } catch (error) {
      console.error(`Firebase delete error on ${collectionName}:`, error);
      throw error;
    }
  } else {
    localData[collectionName] = (localData[collectionName] as any[]).filter(item => item.id !== id);
    saveAndNotify(collectionName);

    // Save audit log too
    localData.auditLogs.unshift(logEntry);
    saveAndNotify("auditLogs");
  }
}

/**
 * Clear all local sandbox data to start blank
 */
export function clearAllSandboxData() {
  localData.buildings = [];
  localData.floors = [];
  localData.units = [];
  localData.tenants = [];
  localData.leases = [];
  localData.payments = [];
  localData.documents = [];
  localData.auditLogs = [];
  localData.approvalWorkflows = [];
  localData.notifications = [];

  localStorage.setItem("sandbox_buildings", JSON.stringify([]));
  localStorage.setItem("sandbox_floors", JSON.stringify([]));
  localStorage.setItem("sandbox_units", JSON.stringify([]));
  localStorage.setItem("sandbox_tenants", JSON.stringify([]));
  localStorage.setItem("sandbox_leases", JSON.stringify([]));
  localStorage.setItem("sandbox_payments", JSON.stringify([]));
  localStorage.setItem("sandbox_documents", JSON.stringify([]));
  localStorage.setItem("sandbox_auditLogs", JSON.stringify([]));
  localStorage.setItem("sandbox_approvalWorkflows", JSON.stringify([]));
  localStorage.setItem("sandbox_notifications", JSON.stringify([]));

  saveAndNotify("buildings");
  saveAndNotify("floors");
  saveAndNotify("units");
  saveAndNotify("tenants");
  saveAndNotify("leases");
  saveAndNotify("payments");
  saveAndNotify("documents");
  saveAndNotify("auditLogs");
  saveAndNotify("approvalWorkflows");
  saveAndNotify("notifications");
}

/**
 * Restore sample data to sandbox
 */
export function restoreSampleSandboxData() {
  localData.buildings = sampleBuildings;
  localData.floors = sampleFloors;
  localData.units = sampleUnits;
  localData.tenants = sampleTenants;
  localData.leases = sampleLeases;
  localData.payments = samplePayments;
  localData.documents = sampleDocuments;
  localData.auditLogs = sampleAuditLogs;
  localData.approvalWorkflows = sampleWorkflows;
  localData.notifications = sampleNotifications;

  localStorage.setItem("sandbox_buildings", JSON.stringify(sampleBuildings));
  localStorage.setItem("sandbox_floors", JSON.stringify(sampleFloors));
  localStorage.setItem("sandbox_units", JSON.stringify(sampleUnits));
  localStorage.setItem("sandbox_tenants", JSON.stringify(sampleTenants));
  localStorage.setItem("sandbox_leases", JSON.stringify(sampleLeases));
  localStorage.setItem("sandbox_payments", JSON.stringify(samplePayments));
  localStorage.setItem("sandbox_documents", JSON.stringify(sampleDocuments));
  localStorage.setItem("sandbox_auditLogs", JSON.stringify(sampleAuditLogs));
  localStorage.setItem("sandbox_approvalWorkflows", JSON.stringify(sampleWorkflows));
  localStorage.setItem("sandbox_notifications", JSON.stringify(sampleNotifications));

  saveAndNotify("buildings");
  saveAndNotify("floors");
  saveAndNotify("units");
  saveAndNotify("tenants");
  saveAndNotify("leases");
  saveAndNotify("payments");
  saveAndNotify("documents");
  saveAndNotify("auditLogs");
  saveAndNotify("approvalWorkflows");
  saveAndNotify("notifications");
}

/**
 * Seed Firestore from sampleData if empty
 */
export async function seedFirestoreIfEmpty() {
  try {
    const q = query(collection(db, "buildings"));
    const fetchPromise = getDocsFromServer(q);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Koneksi ke Firestore timeout (4 detik)")), 4000)
    );
    
    const snap = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (snap.empty) {
      console.log("Firestore is empty, seeding from local assets...");
      for (const b of sampleBuildings) {
        await setDoc(doc(db, "buildings", b.id), b);
      }
      for (const f of sampleFloors) {
        await setDoc(doc(db, "floors", f.id), f);
      }
      for (const u of sampleUnits) {
        await setDoc(doc(db, "units", u.id), u);
      }
      for (const t of sampleTenants) {
        await setDoc(doc(db, "tenants", t.id), t);
      }
      for (const l of sampleLeases) {
        await setDoc(doc(db, "leases", l.id), l);
      }
      for (const pay of samplePayments) {
        await setDoc(doc(db, "payments", pay.id), pay);
      }
      for (const docObj of sampleDocuments) {
        await setDoc(doc(db, "documents", docObj.id), docObj);
      }
      for (const audit of sampleAuditLogs) {
        await setDoc(doc(db, "auditLogs", audit.id), audit);
      }
      for (const wf of sampleWorkflows) {
        await setDoc(doc(db, "approvalWorkflows", wf.id), wf);
      }
      for (const notif of sampleNotifications) {
        await setDoc(doc(db, "notifications", notif.id), notif);
      }
    }
  } catch (error) {
    console.error("Firestore seeding failed or timed out:", error);
    throw error;
  }
}
