import { TranslationUnit } from '../types';

const DB_NAME = 'LinguaSyncTM';
const DB_VERSION = 1;
const STORE_NAME = 'translationUnits';

let db: IDBDatabase;

export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                const store = dbInstance.createObjectStore(STORE_NAME, { autoIncrement: true });
                store.createIndex('source', 'source', { unique: false });
                store.createIndex('source_target', ['source', 'target'], { unique: true });
            }
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
            reject('Error opening IndexedDB.');
        };
    });
};

export const addUnit = async (unit: TranslationUnit): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(unit);
        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            // Ignore constraint errors (duplicate entries)
            if ((event.target as IDBRequest).error?.name === 'ConstraintError') {
                resolve();
            } else {
                reject((event.target as IDBRequest).error);
            }
        };
    });
};

export const bulkAddUnits = async (units: TranslationUnit[]): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        let completed = 0;
        units.forEach(unit => {
            const request = store.add(unit);
            request.onsuccess = () => {
                completed++;
                if (completed === units.length) {
                    resolve();
                }
            };
            request.onerror = (event) => {
                 if ((event.target as IDBRequest).error?.name !== 'ConstraintError') {
                    console.warn('Could not add TU to IndexedDB:', (event.target as IDBRequest).error);
                 }
                completed++;
                if (completed === units.length) {
                    resolve(); // Resolve even if some fail, especially duplicates
                }
            };
        });

        if (units.length === 0) {
            resolve();
        }
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getAllUnits = async (): Promise<TranslationUnit[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const clearAllUnits = async (): Promise<void> => {
     const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
