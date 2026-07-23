const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Helper for security authorization check
function requireAdmin(req, res, next) {
    const role = req.headers['x-user-role'];
    const username = req.headers['x-user-username'];
    if (role === 'admin' && username) {
        next();
    } else {
        res.status(403).json({ error: "Access denied. Admin authorization required." });
    }
}

function requireVendor(req, res, next) {
    const role = req.headers['x-user-role'];
    const username = req.headers['x-user-username'];
    if (role === 'vendor' && username) {
        next();
    } else {
        res.status(403).json({ error: "Access denied. Vendor authorization required." });
    }
}

function requireAuth(req, res, next) {
    const username = req.headers['x-user-username'];
    if (username) {
        next();
    } else {
        res.status(401).json({ error: "Authentication required." });
    }
}

// 1. Authenticate user
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const user = await db.getUser(username);
        if (user && user.password === password) {
            // Do not send password back to the client
            const cleanUser = { ...user };
            delete cleanUser.password;
            res.json(cleanUser);
        } else {
            res.status(401).json({ error: "Invalid username or password" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// 2. Register user (Admin only)
app.post('/api/users/register', requireAdmin, async (req, res) => {
    const { username, password, name, email, role } = req.body;
    if (!username || !password || !name || !email || !role) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const existing = await db.getUser(username);
        if (existing) {
            return res.status(400).json({ error: "Username already exists" });
        }

        const newUser = await db.createUser({ username, password, name, email, role });
        const cleanUser = { ...newUser };
        delete cleanUser.password;
        res.status(201).json(cleanUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to register user" });
    }
});

// 3. Get list of users (Admin only)
app.get('/api/users', requireAdmin, async (req, res) => {
    try {
        const users = await db.getUsers();
        // Hide passwords
        const cleanUsers = users.map(u => {
            const clean = { ...u };
            delete clean.password;
            return clean;
        });
        res.json(cleanUsers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to retrieve users" });
    }
});

// 4. Get all loans or user specific loans
app.get('/api/loans', requireAuth, async (req, res) => {
    const role = req.headers['x-user-role'];
    const username = req.headers['x-user-username'];

    try {
        if (role === 'admin') {
            const loans = await db.getLoans();
            res.json(loans);
        } else {
            const loans = await db.getLoansByVendor(username);
            res.json(loans);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to retrieve loans" });
    }
});

// 5. Submit a new loan request (Vendor only)
app.post('/api/loans', requireVendor, async (req, res) => {
    const { id, requestedAmount, requestedTerm, interestRate, purpose, monthlyEMI, totalRepayable } = req.body;
    const username = req.headers['x-user-username'];

    if (!id || !requestedAmount || !requestedTerm || !purpose) {
        return res.status(400).json({ error: "Invalid loan request details" });
    }

    try {
        // Double check active loans
        const loans = await db.getLoansByVendor(username);
        const hasActive = loans.some(l => l.status === 'Repaying');
        if (hasActive) {
            return res.status(400).json({ error: "Vendor already has an active loan in repayment." });
        }

        const newLoan = {
            id,
            vendorUsername: username,
            requestedAmount: parseFloat(requestedAmount),
            approvedAmount: 0,
            requestedTerm: parseInt(requestedTerm),
            approvedTerm: parseInt(requestedTerm),
            interestRate: parseFloat(interestRate),
            purpose,
            status: 'Pending',
            requestDate: new Date().toISOString().split('T')[0],
            approveDate: null,
            monthlyEMI: parseFloat(monthlyEMI),
            remainingTerm: parseInt(requestedTerm),
            totalRepayable: parseFloat(totalRepayable),
            totalPaid: 0,
            outstandingAmount: parseFloat(totalRepayable)
        };

        const createdLoan = await db.createLoan(newLoan);
        res.status(201).json(createdLoan);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to submit loan request" });
    }
});

// 6. Repay installment (Vendor only)
app.post('/api/loans/repay', requireVendor, async (req, res) => {
    const username = req.headers['x-user-username'];

    try {
        const loans = await db.getLoansByVendor(username);
        const activeLoan = loans.find(l => l.status === 'Repaying');
        
        if (!activeLoan) {
            return res.status(400).json({ error: "No active loan found to repay" });
        }

        const payAmount = Math.min(activeLoan.monthlyEMI, activeLoan.outstandingAmount);
        
        const totalPaid = parseFloat((activeLoan.totalPaid + payAmount).toFixed(2));
        let outstandingAmount = parseFloat((activeLoan.outstandingAmount - payAmount).toFixed(2));
        let remainingTerm = Math.max(0, activeLoan.remainingTerm - 1);
        let status = activeLoan.status;

        if (outstandingAmount <= 0.05 || remainingTerm === 0) {
            status = 'Completed';
            outstandingAmount = 0;
            remainingTerm = 0;
        }

        const updates = {
            totalPaid,
            outstandingAmount,
            remainingTerm,
            status
        };

        await db.updateLoan(activeLoan.id, updates);
        res.json({ message: "Repayment successful", updates, payAmount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to process repayment" });
    }
});

// 7. Approve / Reject Loan request (Admin only)
app.post('/api/loans/decision', requireAdmin, async (req, res) => {
    const { loanId, status, approvedTerm, interestRate, monthlyEMI, totalRepayable } = req.body;

    if (!loanId || !status || !['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid decision inputs" });
    }

    try {
        const loan = await db.getLoanById(loanId);
        if (!loan) {
            return res.status(404).json({ error: "Loan request not found" });
        }

        if (loan.status !== 'Pending') {
            return res.status(400).json({ error: "This loan has already been processed" });
        }

        if (status === 'Approved') {
            // Verify vendor doesn't have another active loan
            const vendorLoans = await db.getLoansByVendor(loan.vendorUsername);
            const hasActive = vendorLoans.some(l => l.status === 'Repaying');
            if (hasActive) {
                return res.status(400).json({ error: "This vendor already has an active loan in repayment." });
            }

            const updates = {
                status: 'Repaying',
                approvedAmount: loan.requestedAmount,
                approvedTerm: parseInt(approvedTerm),
                interestRate: parseFloat(interestRate),
                monthlyEMI: parseFloat(monthlyEMI),
                remainingTerm: parseInt(approvedTerm),
                totalRepayable: parseFloat(totalRepayable),
                totalPaid: 0,
                outstandingAmount: parseFloat(totalRepayable),
                approveDate: new Date().toISOString().split('T')[0]
            };

            await db.updateLoan(loanId, updates);
            res.json({ message: "Loan approved successfully" });
        } else {
            const updates = {
                status: 'Rejected'
            };
            await db.updateLoan(loanId, updates);
            res.json({ message: "Loan rejected successfully" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to process loan decision" });
    }
});

// Fallback to serve index.html for undefined frontend routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Database and then Web Server
db.initDb().then((engine) => {
    console.log(`Database initialized using engine: [${engine}]`);
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}/`);
    });
}).catch(err => {
    console.error("Database initialization failed:", err);
});
