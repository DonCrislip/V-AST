export const getDB = async (dbName, storeName, rows, callback) => {
    const isExisting = (await window.indexedDB.databases()).map((db) => db.name).includes(dbName);
    if (isExisting) {
        const req = window.indexedDB.open(dbName);
        req.onerror = (e) => {
            console.log('Database error: ' + e.target.errorCode);
        };
        req.onsuccess = (e) => {
            const db = e.target.result;
            if (db.objectStoreNames.contains(storeName)) {
                // console.log('Data Store Exists');
                const transaction = db.transaction([storeName], 'readwrite');
                const objStore = transaction.objectStore(storeName);
                const objStoreReq = objStore.getAll();
                objStoreReq.onsuccess = () => {
                    // console.log('Data was Successfully Retrieved!!!');
                    rows = objStoreReq.result;
                    // console.log(rows)
                    db.close();
                    if (callback) callback(rows);
                };
            } else {
                // console.log('Data Store doesnt Exist');
                db.close();
            }
        };
    } else {
        // console.log('There is NO Local Data');
        if (callback) callback([]);
    }
}
export const deleteLocalDB = (dbName, rows) => {
    const req = window.indexedDB.deleteDatabase(dbName);
    req.onerror = () => {
        // console.log('Error deleting database.');
    };
    req.onsuccess = () => {
        // console.log('Database deleted successfully');
        rows = [];
    };
}
export const getDbVersion = (dbName, storeName, arr) => {
    console.log('Getting DB Version');
    const req = window.indexedDB.open(dbName);
    req.onerror = (e) => {
        console.log('Database error: ' + e.target.errorCode);
    };
    req.onsuccess = async (e) => {
        const db = e.target.result;
        console.log('DB Version is ' + db.version);
        db.close();
        setDataLocally(dbName, storeName, arr, db.version + 1);
    };
}
export const setDataLocally = (dbName, storeName, arr, version) => {
    // console.log('Setting Data in Local DB');
    const req = window.indexedDB.open(dbName, version);
    let dbExists = true;
    req.onerror = (e) => {
        console.log('Database error: ' + e.target.errorCode);
    };
    req.onsuccess = (e) => {
        const db = e.target.result;
        if (db.objectStoreNames.contains(storeName) && dbExists) {
            // console.log('DB Exists and so does ' + storeName);
            const transaction = db.transaction([storeName], 'readwrite');
            const objStore = transaction.objectStore(storeName);
            objStore.clear();
            arr.forEach((obj) => {
                objStore.add(obj);
            });
            db.close();
            getDB(dbName, storeName, arr);
        } else if (dbExists) {
            // console.log('DB Exists BUT ' + storeName + ' does not');
            db.close();
            setDataLocally(dbName, storeName, arr, db.version + 1);
        } else {
            // console.log('DB was Updated and ' + storeName + ' exists');
            db.close();
            getDB(dbName, storeName, arr);
        }
    };
    req.onupgradeneeded = (e) => {
        dbExists = false;
        const db = e.target.result;
        // console.log('Updating DB');
        if (!db.objectStoreNames.contains(storeName)) {
            const objStore = db.createObjectStore(storeName, { autoIncrement: true });
            // console.log('New Store Created');
            arr.forEach((obj) => {
                objStore.add(obj);
            });
            // console.log('Data Added to Store');
        }
    };
}