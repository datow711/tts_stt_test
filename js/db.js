// js/db.js

const DB_NAME = 'TTS_STT_DB';
const STORE_NAME = 'results';
const DB_VERSION = 1;

let db;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.errorCode);
            reject('Database error');
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database initialized successfully.');
            resolve(db);
        };
    });
}

function saveData(data) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not initialized');
            return;
        }
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(data);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject('Error saving data:', event.target.error);
    });
}

function deleteData(id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not initialized');
            return;
        }
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject('Error deleting data:', event.target.error);
    });
}

function loadAllData() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not initialized');
            return;
        }
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('Error loading data:', event.target.error);
    });
}