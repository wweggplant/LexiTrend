const DB_NAME = 'LexiTrendDB';
const DB_VERSION = 2; // Incremented version to ensure schema update

let db: IDBDatabase | null = null;

const dbPromise: Promise<IDBDatabase> = new Promise((resolve, reject) => {
  if (db) {
    return resolve(db);
  }

  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onerror = (event) => {
    console.error('IndexedDB error:', (event.target as any).errorCode);
    reject('Error opening IndexedDB');
  };

  request.onsuccess = (event) => {
    db = (event.target as IDBOpenDBRequest).result;
    resolve(db);
  };

  request.onupgradeneeded = (event) => {
    const database = (event.target as IDBOpenDBRequest).result;
    
    // Create cache store if it doesn't exist
    if (!database.objectStoreNames.contains('lexitrend-cache')) {
      database.createObjectStore('lexitrend-cache', { keyPath: 'key' });
    }
    
    // NOTE: You can add other stores for future features here
    // e.g., for user settings, history, etc.
    // if (!database.objectStoreNames.contains('user-settings')) {
    //   database.createObjectStore('user-settings', { keyPath: 'id' });
    // }
  };
});

function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}

export { dbPromise, closeDB }; 