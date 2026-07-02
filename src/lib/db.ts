import { 
  collection, 
  onSnapshot, 
  addDoc, 
  setDoc,
  doc, 
  query, 
  orderBy, 
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import { Property, Lease, Payment, Compliance } from '../types';
import { sampleProperties, sampleLeases, samplePayments, sampleCompliance } from './seed';

export type CollectionName = "properties" | "leases" | "payments" | "compliance";
export type DbMode = "firebase" | "sandbox";

// Retrieve the current DB mode
export function getDbMode(): DbMode {
  const stored = localStorage.getItem("db_mode");
  if (stored === "firebase" || stored === "sandbox") {
    return stored;
  }
  
  // By default, if the user hasn't explicitly chosen, default to 'sandbox' to guarantee immediate
  // workability out-of-the-box in restricted preview environments, then allow switching to live firebase.
  return "sandbox";
}

// Update the DB mode
export function setDbMode(mode: DbMode) {
  localStorage.setItem("db_mode", mode);
}

// Local sandbox in-memory and localStorage cache
const localData: {
  properties: Property[];
  leases: Lease[];
  payments: Payment[];
  compliance: Compliance[];
} = {
  properties: [],
  leases: [],
  payments: [],
  compliance: []
};

// Listeners list for the local sandbox reactive sync
type Listener<T> = (data: T[]) => void;
const listeners: { [key in CollectionName]: Listener<any>[] } = {
  properties: [],
  leases: [],
  payments: [],
  compliance: []
};

// Initialize sandbox data from localStorage or seed fallback
function initSandbox() {
  // Let's force reset if old property keys exist to prevent mixing data
  const samplePropKeys = localStorage.getItem("sandbox_properties");
  if (samplePropKeys && samplePropKeys.includes("Oakridge Heights")) {
    console.log("Detected older non-Indonesian sample data, resetting sandbox state...");
    localStorage.removeItem("sandbox_properties");
    localStorage.removeItem("sandbox_leases");
    localStorage.removeItem("sandbox_payments");
    localStorage.removeItem("sandbox_compliance");
  }

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

  localData.properties = getOrSeed("properties", sampleProperties);
  localData.leases = getOrSeed("leases", sampleLeases);
  localData.payments = getOrSeed("payments", samplePayments);
  localData.compliance = getOrSeed("compliance", sampleCompliance);
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
    // Firestore Path
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
    listeners[collectionName].push(callback);
    // Fire callback immediately with current sandbox cache
    callback([...localData[collectionName]] as T[]);

    // Return unsubscriber
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

  if (mode === "firebase") {
    // Write to Firebase Firestore
    try {
      await addDoc(collection(db, collectionName), data);
    } catch (error) {
      console.error(`Firebase write error on collection ${collectionName}:`, error);
      throw error;
    }
  } else {
    // Write to Local Storage Sandbox
    const item = { ...data };
    if (!item.id) {
      item.id = `${collectionName.slice(0, 3)}-${Date.now()}`;
    }
    
    // Add to start or end of list based on createdAt
    (localData[collectionName] as any[]).unshift(item);
    saveAndNotify(collectionName);
  }
}

/**
 * Seed Firestore from sampleData if empty
 */
export async function seedFirestoreIfEmpty() {
  try {
    const q = query(collection(db, "properties"));
    const snap = await getDocs(q);
    if (snap.empty) {
      console.log("Firestore is empty, seeding from local assets...");
      for (const p of sampleProperties) {
        await setDoc(doc(db, "properties", p.id), p);
      }
      for (const l of sampleLeases) {
        await setDoc(doc(db, "leases", l.id), l);
      }
      for (const pay of samplePayments) {
        await setDoc(doc(db, "payments", pay.id), pay);
      }
      for (const c of sampleCompliance) {
        await setDoc(doc(db, "compliance", c.id), c);
      }
    }
  } catch (error) {
    console.error("Firestore seeding failed:", error);
  }
}
