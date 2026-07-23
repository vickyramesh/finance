const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'crediflow.db');
const JSON_DB_FILE = path.join(__dirname, 'database.json');

// Default Seed Data
const DEFAULT_USERS = [
    { username: 'admin', password: 'admin123', name: 'System Administrator', email: 'admin@crediflow.com', role: 'admin' },
    { username: 'vendor1', password: 'vendor123', name: 'Globex Logistics', email: 'billing@globexlogistics.com', role: 'vendor' },
    { username: 'vendor2', password: 'vendor223', name: 'Apex Electronics Ltd', email: 'finance@apexelectronics.com', role: 'vendor' },
    { username: 'vendor3', password: 'vendor323', name: 'Zenith Apparel', email: 'accounts@zenithapparel.com', role: 'vendor' }
];

const DEFAULT_LOANS = [
    {
        id: 'LN-7891',
        vendorUsername: 'vendor1',
        requestedAmount: 30000,
        approvedAmount: 30000,
        requestedTerm: 24,
        approvedTerm: 24,
        interestRate: 7.5,
        purpose: 'Fleet Expansion (2 Delivery Trucks)',
        status: 'Repaying',
        requestDate: '2026-02-15',
        approveDate: '2026-02-18',
        monthlyEMI: 1437.50,
        remainingTerm: 14,
        totalRepayable: 34500,
        totalPaid: 14375,
        outstandingAmount: 20125
    },
    {
        id: 'LN-9823',
        vendorUsername: 'vendor2',
        requestedAmount: 50000,
        approvedAmount: 0,
        requestedTerm: 18,
        approvedTerm: 18,
        interestRate: 8.5,
        purpose: 'Bulk Semiconductor Inventory Procurement',
        status: 'Pending',
        requestDate: '2026-05-20',
        approveDate: null,
        monthlyEMI: 3131.94,
        remainingTerm: 18,
        totalRepayable: 56375,
        totalPaid: 0,
        outstandingAmount: 56375
    },
    {
        id: 'LN-4321',
        vendorUsername: 'vendor3',
        requestedAmount: 10000,
        approvedAmount: 10000,
        requestedTerm: 6,
        approvedTerm: 6,
        interestRate: 9.0,
        purpose: 'Textile Raw Materials',
        status: 'Completed',
        requestDate: '2025-11-01',
        approveDate: '2025-11-03',
        monthlyEMI: 1741.67,
        remainingTerm: 0,
        totalRepayable: 10450,
        totalPaid: 10450,
        outstandingAmount: 0
    }
];

let dbEngine = null; // 'sqlite' or 'json'
let sqliteDb = null;
let jsonDbState = { users: [], loans: [] };

// Helper to check if SQLite is available
function tryLoadSqlite() {
    try {
        const sqlite3 = require('sqlite3').verbose();
        return sqlite3;
    } catch (e) {
        console.warn("SQLITE3 native module not available. Falling back to JSON file database.");
        return null;
    }
}

const sqlite3Module = tryLoadSqlite();

// --- JSON FILE DATABASE CONTROLLER ---
function loadJsonDb() {
    if (fs.existsSync(JSON_DB_FILE)) {
        try {
            const data = fs.readFileSync(JSON_DB_FILE, 'utf8');
            jsonDbState = JSON.parse(data);
        } catch (e) {
            console.error("Corrupted database.json. Resetting data.", e);
            resetJsonDb();
        }
    } else {
        resetJsonDb();
    }
}

function saveJsonDb() {
    fs.writeFileSync(JSON_DB_FILE, JSON.stringify(jsonDbState, null, 2), 'utf8');
}

function resetJsonDb() {
    jsonDbState = {
        users: [...DEFAULT_USERS],
        loans: [...DEFAULT_LOANS]
    };
    saveJsonDb();
}

// --- INITIALIZE DATABASE ---
function initDb() {
    return new Promise((resolve, reject) => {
        if (sqlite3Module) {
            sqliteDb = new sqlite3Module.Database(DB_FILE, (err) => {
                if (err) {
                    console.error("Failed to connect to SQLite database. Using JSON DB instead.", err);
                    dbEngine = 'json';
                    loadJsonDb();
                    resolve('json');
                } else {
                    dbEngine = 'sqlite';
                    console.log("Connected to SQLite database at " + DB_FILE);
                    
                    // Create Tables
                    sqliteDb.serialize(() => {
                        sqliteDb.run(`
                            CREATE TABLE IF NOT EXISTS users (
                                username TEXT PRIMARY KEY,
                                password TEXT,
                                name TEXT,
                                email TEXT,
                                role TEXT
                            )
                        `);

                        sqliteDb.run(`
                            CREATE TABLE IF NOT EXISTS loans (
                                id TEXT PRIMARY KEY,
                                vendorUsername TEXT,
                                requestedAmount REAL,
                                approvedAmount REAL,
                                requestedTerm INTEGER,
                                approvedTerm INTEGER,
                                interestRate REAL,
                                purpose TEXT,
                                status TEXT,
                                requestDate TEXT,
                                approveDate TEXT,
                                monthlyEMI REAL,
                                remainingTerm INTEGER,
                                totalRepayable REAL,
                                totalPaid REAL,
                                outstandingAmount REAL,
                                FOREIGN KEY(vendorUsername) REFERENCES users(username)
                            )
                        `);

                        // Check if users table is empty to seed
                        sqliteDb.get("SELECT COUNT(*) as count FROM users", (err, row) => {
                            if (!err && row.count === 0) {
                                console.log("Seeding default users and loans in SQLite...");
                                const userStmt = sqliteDb.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?)");
                                DEFAULT_USERS.forEach(u => userStmt.run(u.username, u.password, u.name, u.email, u.role));
                                userStmt.finalize();

                                const loanStmt = sqliteDb.prepare(`
                                    INSERT INTO loans VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `);
                                DEFAULT_LOANS.forEach(l => {
                                    loanStmt.run(
                                        l.id, l.vendorUsername, l.requestedAmount, l.approvedAmount,
                                        l.requestedTerm, l.approvedTerm, l.interestRate, l.purpose,
                                        l.status, l.requestDate, l.approveDate, l.monthlyEMI,
                                        l.remainingTerm, l.totalRepayable, l.totalPaid, l.outstandingAmount
                                    );
                                });
                                loanStmt.finalize();
                            }
                            resolve('sqlite');
                        });
                    });
                }
            });
        } else {
            dbEngine = 'json';
            loadJsonDb();
            resolve('json');
        }
    });
}

// --- DATABASE PUBLIC API INTERFACES ---

// User Methods
function getUsers() {
    return new Promise((resolve, reject) => {
        if (dbEngine === 'sqlite') {
            sqliteDb.all("SELECT * FROM users", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        } else {
            resolve(jsonDbState.users);
        }
    });
}

function getUser(username) {
    return new Promise((resolve, reject) => {
        if (dbEngine === 'sqlite') {
            sqliteDb.get("SELECT * FROM users WHERE username = ?", [username.toLowerCase()], (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        } else {
            const user = jsonDbState.users.find(u => u.username.toLowerCase() === username.toLowerCase());
            resolve(user || null);
        }
    });
}

function createUser(user) {
    return new Promise((resolve, reject) => {
        const cleanUser = {
            username: user.username.toLowerCase(),
            password: user.password,
            name: user.name,
            email: user.email,
            role: user.role
        };

        if (dbEngine === 'sqlite') {
            sqliteDb.run(
                "INSERT INTO users (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)",
                [cleanUser.username, cleanUser.password, cleanUser.name, cleanUser.email, cleanUser.role],
                function(err) {
                    if (err) reject(err);
                    else resolve(cleanUser);
                }
            );
        } else {
            if (jsonDbState.users.some(u => u.username.toLowerCase() === cleanUser.username)) {
                reject(new Error("Username already exists"));
            } else {
                jsonDbState.users.push(cleanUser);
                saveJsonDb();
                resolve(cleanUser);
            }
        }
    });
}

// Loan Methods
function getLoans() {
    return new Promise((resolve, reject) => {
        if (dbEngine === 'sqlite') {
            sqliteDb.all("SELECT * FROM loans", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        } else {
            resolve(jsonDbState.loans);
        }
    });
}

function getLoansByVendor(vendorUsername) {
    return new Promise((resolve, reject) => {
        if (dbEngine === 'sqlite') {
            sqliteDb.all("SELECT * FROM loans WHERE vendorUsername = ?", [vendorUsername], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        } else {
            const loans = jsonDbState.loans.filter(l => l.vendorUsername === vendorUsername);
            resolve(loans);
        }
    });
}

function getLoanById(id) {
    return new Promise((resolve, reject) => {
        if (dbEngine === 'sqlite') {
            sqliteDb.get("SELECT * FROM loans WHERE id = ?", [id], (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        } else {
            const loan = jsonDbState.loans.find(l => l.id === id);
            resolve(loan || null);
        }
    });
}

function createLoan(loan) {
    return new Promise((resolve, reject) => {
        if (dbEngine === 'sqlite') {
            sqliteDb.run(`
                INSERT INTO loans (
                    id, vendorUsername, requestedAmount, approvedAmount, requestedTerm, approvedTerm,
                    interestRate, purpose, status, requestDate, approveDate, monthlyEMI, remainingTerm,
                    totalRepayable, totalPaid, outstandingAmount
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                loan.id, loan.vendorUsername, loan.requestedAmount, loan.approvedAmount,
                loan.requestedTerm, loan.approvedTerm, loan.interestRate, loan.purpose,
                loan.status, loan.requestDate, loan.approveDate, loan.monthlyEMI,
                loan.remainingTerm, loan.totalRepayable, loan.totalPaid, loan.outstandingAmount
            ], function(err) {
                if (err) reject(err);
                else resolve(loan);
            });
        } else {
            jsonDbState.loans.push(loan);
            saveJsonDb();
            resolve(loan);
        }
    });
}

function updateLoan(id, updates) {
    return new Promise((resolve, reject) => {
        if (dbEngine === 'sqlite') {
            const keys = Object.keys(updates);
            const values = Object.values(updates);
            if (keys.length === 0) {
                resolve();
                return;
            }
            const setClause = keys.map(k => `${k} = ?`).join(', ');
            values.push(id);

            sqliteDb.run(`UPDATE loans SET ${setClause} WHERE id = ?`, values, function(err) {
                if (err) reject(err);
                else resolve();
            });
        } else {
            const index = jsonDbState.loans.findIndex(l => l.id === id);
            if (index !== -1) {
                jsonDbState.loans[index] = { ...jsonDbState.loans[index], ...updates };
                saveJsonDb();
                resolve();
            } else {
                reject(new Error("Loan not found"));
            }
        }
    });
}

module.exports = {
    initDb,
    getUsers,
    getUser,
    createUser,
    getLoans,
    getLoansByVendor,
    getLoanById,
    createLoan,
    updateLoan,
    getDbEngine: () => dbEngine
};
