/**
 * Debit Credit - Finance Loan Application Core JavaScript
 * Handles State, Router, Calculations, Renderers, and Interactivity.
 */

// 1. GLOBAL STATE & SEED DATA
const DEFAULT_STATE = {
    users: [
        { username: 'admin', password: 'admin123', name: 'System Administrator', email: 'admin@debitcredit.com', role: 'admin' },
        { username: 'vendor1', password: 'vendor123', name: 'Globex Logistics', email: 'billing@globexlogistics.com', role: 'vendor' },
        { username: 'vendor2', password: 'vendor223', name: 'Apex Electronics Ltd', email: 'finance@apexelectronics.com', role: 'vendor' },
        { username: 'vendor3', password: 'vendor323', name: 'Zenith Apparel', email: 'accounts@zenithapparel.com', role: 'vendor' }
    ],
    loans: [
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
    ],
    currentUser: null
};

class DebitCreditApp {
    constructor() {
        this.state = this.loadState();
        this.charts = {};
        
        // Dom Elements Cache
        this.dom = {
            // Sections
            loginSection: document.getElementById('login-section'),
            vendorDashboard: document.getElementById('vendor-dashboard'),
            adminDashboard: document.getElementById('admin-dashboard'),
            userProfileMenu: document.getElementById('user-profile-menu'),
            
            // Header Profile details
            profileName: document.getElementById('profile-name'),
            profileRole: document.getElementById('profile-role'),
            userInitials: document.getElementById('user-initials'),
            logoButton: document.getElementById('logo-button'),
            logoutBtn: document.getElementById('logout-btn'),
            
            // Login Forms
            loginForm: document.getElementById('login-form'),
            loginUsernameInput: document.getElementById('login-username'),
            loginPasswordInput: document.getElementById('login-password'),
            tabVendor: document.getElementById('tab-vendor'),
            tabAdmin: document.getElementById('tab-admin'),
            demoVendorBtn: document.getElementById('demo-vendor-btn'),
            demoAdminBtn: document.getElementById('demo-admin-btn'),
            
            // Vendor Metrics
            vendorWelcomeSubtitle: document.getElementById('vendor-welcome-subtitle'),
            vendorOutstandingVal: document.getElementById('vendor-outstanding-val'),
            vendorNextInstallmentVal: document.getElementById('vendor-next-installment-val'),
            vendorNextInstallmentDate: document.getElementById('vendor-next-installment-date'),
            vendorInterestRateVal: document.getElementById('vendor-interest-rate-val'),
            vendorRemainingTermVal: document.getElementById('vendor-remaining-term-val'),
            vendorTermRepaid: document.getElementById('vendor-term-repaid'),
            
            // Vendor Actions & Tables
            vendorLoanRepayActions: document.getElementById('vendor-loan-repay-actions'),
            btnVendorRepayInstallment: document.getElementById('btn-vendor-repay-installment'),
            vendorLoanBreakdownList: document.getElementById('vendor-loan-breakdown-list'),
            vendorLoanHistoryTbody: document.getElementById('vendor-loan-history-tbody'),
            
            // Vendor Loan Application Forms & Sliders (Dashboard Quick Apply)
            quickLoanForm: document.getElementById('quick-loan-form'),
            loanAmountSlider: document.getElementById('loan-amount-slider'),
            amountSliderVal: document.getElementById('amount-slider-val'),
            loanTermSlider: document.getElementById('loan-term-slider'),
            termSliderVal: document.getElementById('term-slider-val'),
            loanPurposeInput: document.getElementById('loan-purpose-input'),
            calcInterestRate: document.getElementById('calc-interest-rate'),
            calcMonthlyEmi: document.getElementById('calc-monthly-emi'),
            calcTotalPayable: document.getElementById('calc-total-payable'),
            
            // Vendor Loan Modal
            loanRequestModal: document.getElementById('loan-request-modal'),
            btnRequestLoanModal: document.getElementById('btn-request-loan-modal'),
            btnCloseLoanModal: document.getElementById('btn-close-loan-modal'),
            btnCancelLoanModal: document.getElementById('btn-cancel-loan-modal'),
            modalLoanForm: document.getElementById('modal-loan-form'),
            modalAmountSlider: document.getElementById('modal-amount-slider'),
            modalAmountVal: document.getElementById('modal-amount-val'),
            modalTermSlider: document.getElementById('modal-term-slider'),
            modalTermVal: document.getElementById('modal-term-val'),
            modalPurposeInput: document.getElementById('modal-purpose-input'),
            modalCalcInterest: document.getElementById('modal-calc-interest'),
            modalCalcEmi: document.getElementById('modal-calc-emi'),
            modalCalcTotal: document.getElementById('modal-calc-total'),
            
            // Admin Metrics
            adminTotalCapitalVal: document.getElementById('admin-total-capital-val'),
            adminActiveLoansCount: document.getElementById('admin-active-loans-count'),
            adminOutstandingVal: document.getElementById('admin-outstanding-val'),
            adminTotalRepaidPercentage: document.getElementById('admin-total-repaid-percentage'),
            adminInterestGeneratedVal: document.getElementById('admin-interest-generated-val'),
            adminActiveBorrowersVal: document.getElementById('admin-active-borrowers-val'),
            adminTotalVendorsRegistered: document.getElementById('admin-total-vendors-registered'),
            adminPendingApprovalsCount: document.getElementById('admin-pending-approvals-count'),
            
            // Admin Actions & Tables
            adminApprovalsTbody: document.getElementById('admin-approvals-tbody'),
            adminVendorDirectoryTbody: document.getElementById('admin-vendor-directory-tbody'),
            adminVendorSearch: document.getElementById('admin-vendor-search'),
            
            // Admin Process Approval Modal
            adminApprovalModal: document.getElementById('admin-approval-modal'),
            btnCloseApprovalModal: document.getElementById('btn-close-approval-modal'),
            adminApproveForm: document.getElementById('admin-approve-form'),
            adminModalLoanId: document.getElementById('admin-modal-loan-id'),
            adminModalVendorName: document.getElementById('admin-modal-vendor-name'),
            adminModalReqAmt: document.getElementById('admin-modal-req-amt'),
            adminModalReqTerm: document.getElementById('admin-modal-req-term'),
            adminModalReqPurpose: document.getElementById('admin-modal-req-purpose'),
            adminModalRateInput: document.getElementById('admin-modal-rate-input'),
            adminModalTermInput: document.getElementById('admin-modal-term-input'),
            adminModalCalcEmi: document.getElementById('admin-modal-calc-emi'),
            adminModalCalcTotal: document.getElementById('admin-modal-calc-total'),
            btnRejectLoanFromModal: document.getElementById('btn-reject-loan-from-modal'),
            
            // Vendor Details Modal
            vendorDetailsModal: document.getElementById('vendor-details-modal'),
            btnCloseDetailsModal: document.getElementById('btn-close-details-modal'),
            detailsVendorInitials: document.getElementById('details-vendor-initials'),
            detailsVendorName: document.getElementById('details-vendor-name'),
            detailsVendorEmail: document.getElementById('details-vendor-email'),
            detailsVendorHistoryTbody: document.getElementById('details-vendor-history-tbody'),
            
            // Toasts Container
            toastContainer: document.getElementById('toast-container'),

            // User Registration Modal
            registerUserModal: document.getElementById('register-user-modal'),
            btnRegisterUserModal: document.getElementById('btn-register-user-modal'),
            btnCloseRegisterModal: document.getElementById('btn-close-register-modal'),
            btnCancelRegisterModal: document.getElementById('btn-cancel-register-modal'),
            registerUserForm: document.getElementById('register-user-form'),
            registerNameInput: document.getElementById('register-name'),
            registerEmailInput: document.getElementById('register-email'),
            registerUsernameInput: document.getElementById('register-username'),
            registerPasswordInput: document.getElementById('register-password'),
            registerRoleSelect: document.getElementById('register-role')
        };
        
        this.activeLoginTab = 'vendor'; // Default role select tab
        this.init();
    }

    // 2. LIFECYCLE & STORAGE MANAGEMENT
    loadState() {
        const savedUser = sessionStorage.getItem('debitcredit_user');
        return {
            users: [],
            loans: [],
            currentUser: savedUser ? JSON.parse(savedUser) : null
        };
    }

    saveState() {
        if (this.state.currentUser) {
            sessionStorage.setItem('debitcredit_user', JSON.stringify(this.state.currentUser));
        } else {
            sessionStorage.removeItem('debitcredit_user');
        }
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'X-User-Username': this.state.currentUser ? this.state.currentUser.username : '',
            'X-User-Role': this.state.currentUser ? this.state.currentUser.role : ''
        };
    }

    async syncStateFromServer() {
        if (!this.state.currentUser) return;
        try {
            const headers = this.getHeaders();
            const loansRes = await fetch('http://localhost:8080/api/loans', { headers });
            if (loansRes.ok) {
                this.state.loans = await loansRes.json();
            }

            if (this.state.currentUser.role === 'admin') {
                const usersRes = await fetch('http://localhost:8080/api/users', { headers });
                if (usersRes.ok) {
                    this.state.users = await usersRes.json();
                }
            }
        } catch (e) {
            console.error("Error syncing state from server:", e);
        }
    }

    async init() {
        this.registerEventListeners();
        lucide.createIcons(); // Initialize icons
        
        if (this.state.currentUser) {
            await this.syncStateFromServer();
            this.navigateTo(this.state.currentUser.role);
        } else {
            this.showToast('System ready. Synchronized with server database.', 'info');
            this.switchLoginTab('vendor');
        }

        // Periodically poll for updates to keep Admin and Vendor in sync in real-time
        setInterval(async () => {
            if (this.state.currentUser) {
                await this.syncStateFromServer();
                if (this.state.currentUser.role === 'admin' && !this.dom.adminDashboard.classList.contains('hidden')) {
                    this.renderAdminPortal();
                } else if (this.state.currentUser.role === 'vendor' && !this.dom.vendorDashboard.classList.contains('hidden')) {
                    this.renderVendorPortal();
                }
            }
        }, 5000);
    }

    // 3. ROUTER / DYNAMIC SECTION ROUTING
    async navigateTo(section, pushState = true) {
        if (pushState) {
            window.history.pushState({ section }, '', '#' + section);
        }

        // Hide all screens
        this.dom.loginSection.classList.add('hidden');
        this.dom.vendorDashboard.classList.add('hidden');
        this.dom.adminDashboard.classList.add('hidden');
        
        if (section === 'login') {
            document.body.classList.add('login-bg');
            this.dom.loginSection.classList.remove('hidden');
            this.dom.userProfileMenu.classList.add('hidden');
            this.state.currentUser = null;
            this.saveState();
        } else {
            document.body.classList.remove('login-bg');
            await this.syncStateFromServer();
            if (section === 'vendor') {
                this.dom.vendorDashboard.classList.remove('hidden');
                this.dom.userProfileMenu.classList.remove('hidden');
                this.updateHeaderProfile();
                this.renderVendorPortal();
            } else if (section === 'admin') {
                this.dom.adminDashboard.classList.remove('hidden');
                this.dom.userProfileMenu.classList.remove('hidden');
                this.updateHeaderProfile();
                this.renderAdminPortal();
            }
        }
        
        // Always refresh Lucide icons
        lucide.createIcons();
    }

    updateHeaderProfile() {
        const user = this.state.currentUser;
        if (!user) return;
        this.dom.profileName.textContent = user.name;
        this.dom.profileRole.textContent = user.role.toUpperCase();
        this.dom.userInitials.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        // Setup Badge Class
        this.dom.profileRole.className = 'user-role badge';
        this.dom.profileRole.classList.add(user.role === 'admin' ? 'badge-primary' : 'badge-info');
    }

    // 4. LOAN ENGINE CALCULATIONS (Simple Interest Model)
    calculateLoanMetrics(principal, termMonths, annualRate = null) {
        // Simple Interest logic with basic tiered rating structure based on amount/term
        const rate = annualRate !== null ? annualRate : this.getProjectedRate(principal, termMonths);
        const decimalRate = rate / 100;
        const years = termMonths / 12;
        
        const totalInterest = principal * decimalRate * years;
        const totalPayable = principal + totalInterest;
        const monthlyEMI = totalPayable / termMonths;
        
        return {
            rate: parseFloat(rate.toFixed(2)),
            monthlyEMI: parseFloat(monthlyEMI.toFixed(2)),
            totalInterest: parseFloat(totalInterest.toFixed(2)),
            totalPayable: parseFloat(totalPayable.toFixed(2))
        };
    }

    getProjectedRate(principal, termMonths) {
        // Determine default rates depending on size and credit term length
        let rate = 8.5; // Baseline interest rate
        
        if (principal > 50000) {
            rate -= 1.0; // Volume discount
        } else if (principal < 10000) {
            rate += 0.5; // Small ticket surcharge
        }

        if (termMonths > 24) {
            rate += 1.0; // Term premium
        } else if (termMonths <= 6) {
            rate -= 0.5; // Short term concession
        }

        return Math.max(3.0, rate); // Min 3%
    }

    // 5. RENDERING - VENDOR PORTAL
    renderVendorPortal() {
        const user = this.state.currentUser;
        if (!user || user.role !== 'vendor') return;

        this.dom.vendorWelcomeSubtitle.textContent = `Welcome back, ${user.name}`;
        
        // Find active repaying loan for calculations
        const loans = this.state.loans.filter(l => l.vendorUsername === user.username);
        const activeLoan = loans.find(l => l.status === 'Repaying');
        
        if (activeLoan) {
            // Update Metrics Cards with active loan stats
            this.dom.vendorOutstandingVal.textContent = this.formatCurrency(activeLoan.outstandingAmount);
            this.dom.vendorNextInstallmentVal.textContent = this.formatCurrency(activeLoan.monthlyEMI);
            
            // Calculate next pay date (e.g. 1 month from today)
            const date = new Date();
            date.setMonth(date.getMonth() + 1);
            this.dom.vendorNextInstallmentDate.textContent = `Due Date: ${date.toLocaleDateString()}`;
            
            this.dom.vendorInterestRateVal.textContent = `${activeLoan.interestRate.toFixed(2)}%`;
            this.dom.vendorRemainingTermVal.textContent = `${activeLoan.remainingTerm} / ${activeLoan.approvedTerm} months`;
            this.dom.vendorTermRepaid.textContent = `${activeLoan.approvedTerm - activeLoan.remainingTerm} months repaid`;
            
            // Render active loan breakdown text
            document.getElementById('breakdown-orig-amt').textContent = this.formatCurrency(activeLoan.approvedAmount);
            document.getElementById('breakdown-total-interest').textContent = this.formatCurrency(activeLoan.totalRepayable - activeLoan.approvedAmount);
            document.getElementById('breakdown-total-repay').textContent = this.formatCurrency(activeLoan.totalRepayable);
            document.getElementById('breakdown-total-paid').textContent = this.formatCurrency(activeLoan.totalPaid);
            document.getElementById('breakdown-purpose').textContent = activeLoan.purpose;

            // Show active pay button
            this.dom.vendorLoanRepayActions.classList.remove('hidden');
            this.dom.vendorLoanBreakdownList.classList.remove('hidden');
            
            // Render repayment visual progress chart
            this.renderVendorChart(activeLoan);
        } else {
            // Clear / Show default values for metrics
            this.dom.vendorOutstandingVal.textContent = this.formatCurrency(0);
            this.dom.vendorNextInstallmentVal.textContent = this.formatCurrency(0);
            this.dom.vendorNextInstallmentDate.textContent = 'Due Date: -';
            this.dom.vendorInterestRateVal.textContent = '0.0%';
            this.dom.vendorRemainingTermVal.textContent = '0 months';
            this.dom.vendorTermRepaid.textContent = 'No active loan';
            
            // Repay action state
            this.dom.vendorLoanRepayActions.classList.add('hidden');
            
            // Replace chart with placeholder/empty notice
            this.renderEmptyVendorChart();
            
            // Reset breakdown fields
            document.getElementById('breakdown-orig-amt').textContent = '₹0.00';
            document.getElementById('breakdown-total-interest').textContent = '₹0.00';
            document.getElementById('breakdown-total-repay').textContent = '₹0.00';
            document.getElementById('breakdown-total-paid').textContent = '₹0.00';
            document.getElementById('breakdown-purpose').textContent = 'No current active loan.';
        }

        // Render loan history table
        const tbody = this.dom.vendorLoanHistoryTbody;
        tbody.innerHTML = '';
        
        if (loans.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-secondary">No loan requests found</td></tr>`;
        } else {
            // Sort by request date descending
            const sortedLoans = [...loans].sort((a,b) => new Date(b.requestDate) - new Date(a.requestDate));
            sortedLoans.forEach(loan => {
                const tr = document.createElement('tr');
                
                const emiText = loan.status === 'Pending' || loan.status === 'Rejected' ? 
                    'Estimated' : this.formatCurrency(loan.monthlyEMI);
                
                const outstandingText = loan.status === 'Pending' || loan.status === 'Rejected' ?
                    '-' : this.formatCurrency(loan.outstandingAmount);
                
                const displayRate = loan.status === 'Pending' ? 
                    `${this.getProjectedRate(loan.requestedAmount, loan.requestedTerm).toFixed(2)}%` : 
                    `${loan.interestRate.toFixed(2)}%`;
                
                const statusBadge = this.getStatusBadge(loan.status);
                
                tr.innerHTML = `
                    <td class="text-bold">${loan.id}</td>
                    <td>${this.formatCurrency(loan.requestedAmount)}</td>
                    <td>${loan.approvedTerm || loan.requestedTerm} months</td>
                    <td>${displayRate}</td>
                    <td>${emiText}</td>
                    <td>${outstandingText}</td>
                    <td>${statusBadge}</td>
                    <td>${loan.requestDate}</td>
                    <td class="text-secondary" title="${loan.purpose}">${this.truncateString(loan.purpose, 25)}</td>
                `;
                tbody.appendChild(tr);
            });
        }
        
        // Refresh slider preview inputs in calculator card
        this.updateVendorSliders();
    }

    renderVendorChart(loan) {
        const ctx = document.getElementById('vendorRepaymentChart').getContext('2d');
        
        // Destroy existing chart to prevent memory issues
        if (this.charts.vendorRepay) {
            this.charts.vendorRepay.destroy();
        }

        this.charts.vendorRepay = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Amount Paid', 'Remaining Balance'],
                datasets: [{
                    data: [loan.totalPaid, loan.outstandingAmount],
                    backgroundColor: ['#10b981', 'rgba(255, 255, 255, 0.08)'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
                    }
                },
                cutout: '75%'
            }
        });
    }

    renderEmptyVendorChart() {
        const ctx = document.getElementById('vendorRepaymentChart').getContext('2d');
        
        if (this.charts.vendorRepay) {
            this.charts.vendorRepay.destroy();
        }

        this.charts.vendorRepay = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No Active Loan'],
                datasets: [{
                    data: [100],
                    backgroundColor: ['rgba(255, 255, 255, 0.03)'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
                    }
                },
                cutout: '75%'
            }
        });
    }

    // 6. RENDERING - ADMIN PORTAL
    renderAdminPortal() {
        const user = this.state.currentUser;
        if (!user || user.role !== 'admin') return;

        // Calculate global admin metrics
        const loans = this.state.loans;
        const activeLoans = loans.filter(l => l.status === 'Repaying');
        const pendingLoans = loans.filter(l => l.status === 'Pending');
        const vendors = this.state.users.filter(u => u.role === 'vendor');
        
        const totalCapitalDisbursed = activeLoans.reduce((sum, l) => sum + l.approvedAmount, 0);
        const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstandingAmount, 0);
        const totalPaid = activeLoans.reduce((sum, l) => sum + l.totalPaid, 0);
        
        const totalRepayable = activeLoans.reduce((sum, l) => sum + l.totalRepayable, 0);
        const totalInterestGenerated = totalRepayable - totalCapitalDisbursed;
        
        const repaymentPercentage = totalCapitalDisbursed > 0 ? 
            Math.round((totalPaid / totalCapitalDisbursed) * 100) : 0;
            
        const uniqueActiveBorrowers = new Set(activeLoans.map(l => l.vendorUsername)).size;

        // Update Admin Metrics Cards
        this.dom.adminTotalCapitalVal.textContent = this.formatCurrency(totalCapitalDisbursed);
        this.dom.adminActiveLoansCount.textContent = `${activeLoans.length} active business loans`;
        
        this.dom.adminOutstandingVal.textContent = this.formatCurrency(totalOutstanding);
        this.dom.adminTotalRepaidPercentage.textContent = `${repaymentPercentage}% of principal paid`;
        
        this.dom.adminInterestGeneratedVal.textContent = this.formatCurrency(totalInterestGenerated);
        
        this.dom.adminActiveBorrowersVal.textContent = uniqueActiveBorrowers;
        this.dom.adminTotalVendorsRegistered.textContent = `${vendors.length} vendors registered`;
        
        this.dom.adminPendingApprovalsCount.textContent = `${pendingLoans.length} requests`;

        // Render Pending Approvals table
        const approvalsTbody = this.dom.adminApprovalsTbody;
        approvalsTbody.innerHTML = '';
        
        if (pendingLoans.length === 0) {
            approvalsTbody.innerHTML = `<tr><td colspan="7" class="text-center text-secondary">No pending requests to process</td></tr>`;
        } else {
            pendingLoans.forEach(loan => {
                const vendorUser = this.state.users.find(u => u.username === loan.vendorUsername);
                const vendorName = vendorUser ? vendorUser.name : loan.vendorUsername;
                
                // Get pre-calculated metrics using simple-interest estimator
                const metrics = this.calculateLoanMetrics(loan.requestedAmount, loan.requestedTerm);
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="text-bold">${vendorName}</td>
                    <td class="text-bold">${this.formatCurrency(loan.requestedAmount)}</td>
                    <td>${loan.requestedTerm} months</td>
                    <td>${this.formatCurrency(metrics.monthlyEMI)}</td>
                    <td class="text-secondary">${this.truncateString(loan.purpose, 30)}</td>
                    <td class="text-success">${metrics.rate.toFixed(2)}%</td>
                    <td class="text-right">
                        <button class="btn btn-sm btn-outline btn-approve-modal" data-loan-id="${loan.id}">
                            <i data-lucide="edit-3"></i> Process Request
                        </button>
                    </td>
                `;
                approvalsTbody.appendChild(tr);
            });
            
            // Attach triggers to approvals button
            document.querySelectorAll('.btn-approve-modal').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const btnTarget = e.currentTarget;
                    const loanId = btnTarget.getAttribute('data-loan-id');
                    this.openAdminApprovalModal(loanId);
                });
            });
        }

        // Render Vendor Directory Table (Primary Requirement)
        this.renderVendorDirectoryTable();
    }

    renderVendorDirectoryTable() {
        const query = this.dom.adminVendorSearch.value.toLowerCase().trim();
        const tbody = this.dom.adminVendorDirectoryTbody;
        tbody.innerHTML = '';

        const vendors = this.state.users.filter(u => u.role === 'vendor');
        const matchedVendors = vendors.filter(v => {
            return v.name.toLowerCase().includes(query) || v.username.toLowerCase().includes(query) || v.email.toLowerCase().includes(query);
        });

        if (matchedVendors.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-secondary">No vendors found matching criteria</td></tr>`;
            return;
        }

        matchedVendors.forEach(vendor => {
            const vendorLoans = this.state.loans.filter(l => l.vendorUsername === vendor.username);
            const activeLoan = vendorLoans.find(l => l.status === 'Repaying');
            
            const totalLoansCount = vendorLoans.length;
            const totalOutstanding = activeLoan ? activeLoan.outstandingAmount : 0;
            const totalLent = activeLoan ? activeLoan.approvedAmount : 0;
            const interestRate = activeLoan ? `${activeLoan.interestRate.toFixed(2)}%` : '-';
            const remainingTerm = activeLoan ? `${activeLoan.remainingTerm} mo` : '-';
            
            // Repayment Progress Bar Calculations
            let progressHtml = '-';
            if (activeLoan && activeLoan.totalRepayable > 0) {
                const repPct = Math.round((activeLoan.totalPaid / activeLoan.totalRepayable) * 100);
                progressHtml = `
                    <div class="table-progress-container">
                        <div class="table-progress-bar-bg">
                            <div class="table-progress-bar-fill" style="width: ${repPct}%"></div>
                        </div>
                        <span class="text-secondary">${repPct}%</span>
                    </div>
                `;
            }

            const nextInstallment = activeLoan ? this.formatCurrency(activeLoan.monthlyEMI) : '-';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="text-bold">${vendor.name}</div>
                    <div class="text-muted" style="font-size: 11px">${vendor.email}</div>
                </td>
                <td class="text-center"><span class="badge badge-info">${totalLoansCount}</span></td>
                <td>${totalLent > 0 ? this.formatCurrency(totalLent) : '-'}</td>
                <td class="text-bold ${totalOutstanding > 0 ? 'text-warning' : 'text-secondary'}">
                    ${totalOutstanding > 0 ? this.formatCurrency(totalOutstanding) : '₹0.00'}
                </td>
                <td class="text-bold text-success">${interestRate}</td>
                <td>${remainingTerm}</td>
                <td>${progressHtml}</td>
                <td>${nextInstallment}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline btn-view-vendor-details" data-username="${vendor.username}">
                        <i data-lucide="eye"></i> View History
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Attach event listeners to eye icons
        document.querySelectorAll('.btn-view-vendor-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.currentTarget.getAttribute('data-username');
                this.openVendorDetailsModal(username);
            });
        });
        
        lucide.createIcons();
    }

    // 7. ACTION PROCESSES
    // Login execution
    async handleLogin(e) {
        e.preventDefault();
        const username = this.dom.loginUsernameInput.value.trim();
        const password = this.dom.loginPasswordInput.value;

        if (this.activeLoginTab === 'vendor' && username.toLowerCase() === 'admin') {
            this.showToast("Admin account must log in via Admin Console.", "warning");
            return;
        }

        try {
            const res = await fetch('http://localhost:8080/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                const user = await res.json();
                
                // Verify access control role aligns with tabs
                if (this.activeLoginTab !== user.role) {
                    this.showToast(`Invalid credential matching for ${this.activeLoginTab.toUpperCase()} Portal.`, 'danger');
                    return;
                }

                this.state.currentUser = user;
                this.saveState();
                
                // Clear inputs
                this.dom.loginUsernameInput.value = '';
                this.dom.loginPasswordInput.value = '';
                
                this.showToast(`Success. Welcome, ${user.name}!`, 'success');
                await this.navigateTo(user.role);
            } else {
                const err = await res.json();
                this.showToast(err.error || 'Authentication failed. Check credentials.', 'danger');
            }
        } catch (err) {
            console.error(err);
            this.showToast('Network error during login.', 'danger');
        }
    }

    // Request Loan submit (Dashboard Panel and Modal form)
    async handleLoanRequest(e, amount, term, purpose, isModal = false) {
        e.preventDefault();
        
        const user = this.state.currentUser;
        if (!user || user.role !== 'vendor') return;

        // Check if user already has an active loan of type repaying
        const hasActive = this.state.loans.some(l => l.vendorUsername === user.username && l.status === 'Repaying');
        if (hasActive) {
            this.showToast('Submission error. You must fully pay off your active loan before requesting another.', 'danger');
            if (isModal) this.closeLoanModal();
            return;
        }

        const newId = 'LN-' + Math.floor(1000 + Math.random() * 9000);
        const estRate = this.getProjectedRate(amount, term);
        const metrics = this.calculateLoanMetrics(amount, term, estRate);

        const loanBody = {
            id: newId,
            requestedAmount: amount,
            requestedTerm: term,
            interestRate: estRate,
            purpose: purpose,
            monthlyEMI: metrics.monthlyEMI,
            totalRepayable: metrics.totalPayable
        };

        try {
            const res = await fetch('http://localhost:8080/api/loans', {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(loanBody)
            });

            if (res.ok) {
                const createdLoan = await res.json();
                this.state.loans.push(createdLoan);
                this.showToast(`Loan application ${newId} submitted. Awaiting Admin Approval.`, 'warning');
                
                // Reset forms
                if (isModal) {
                    this.dom.modalPurposeInput.value = '';
                    this.closeLoanModal();
                } else {
                    this.dom.loanPurposeInput.value = '';
                }
                
                await this.syncStateFromServer();
                this.renderVendorPortal();
            } else {
                const err = await res.json();
                this.showToast(err.error || 'Failed to submit loan request.', 'danger');
            }
        } catch (err) {
            console.error(err);
            this.showToast('Network error during loan request.', 'danger');
        }
    }

    // Repay installment execution
    async handleRepayInstallment() {
        const user = this.state.currentUser;
        if (!user || user.role !== 'vendor') return;

        try {
            const res = await fetch('http://localhost:8080/api/loans/repay', {
                method: 'POST',
                headers: this.getHeaders()
            });

            if (res.ok) {
                const data = await res.json();
                if (data.updates.status === 'Completed') {
                    this.showToast(`Congratulations! Your active loan has been fully paid off.`, 'success');
                } else {
                    this.showToast(`Payment of ${this.formatCurrency(data.payAmount)} received. Remaining term: ${data.updates.remainingTerm} months.`, 'success');
                }
                
                await this.syncStateFromServer();
                this.renderVendorPortal();
            } else {
                const err = await res.json();
                this.showToast(err.error || 'Failed to process repayment.', 'danger');
            }
        } catch (err) {
            console.error(err);
            this.showToast('Network error during payment.', 'danger');
        }
    }

    // Process approval modal inputs
    openAdminApprovalModal(loanId) {
        const loan = this.state.loans.find(l => l.id === loanId);
        if (!loan) return;

        const vendorUser = this.state.users.find(u => u.username === loan.vendorUsername);
        const vendorName = vendorUser ? vendorUser.name : loan.vendorUsername;

        this.dom.adminModalLoanId.value = loan.id;
        this.dom.adminModalVendorName.textContent = vendorName;
        this.dom.adminModalReqAmt.textContent = this.formatCurrency(loan.requestedAmount);
        this.dom.adminModalReqTerm.textContent = `${loan.requestedTerm} mo`;
        this.dom.adminModalReqPurpose.textContent = loan.purpose;

        // Set inputs to requested settings
        const projectedRate = this.getProjectedRate(loan.requestedAmount, loan.requestedTerm);
        this.dom.adminModalRateInput.value = projectedRate.toFixed(1);
        this.dom.adminModalTermInput.value = loan.requestedTerm;

        this.updateAdminRecalcPreview();
        this.dom.adminApprovalModal.classList.remove('hidden');
    }

    closeAdminApprovalModal() {
        this.dom.adminApprovalModal.classList.add('hidden');
    }

    updateAdminRecalcPreview() {
        const principal = parseFloat(this.dom.adminModalReqAmt.textContent.replace(/[^0-9.]/g, ''));
        const rate = parseFloat(this.dom.adminModalRateInput.value) || 0;
        const term = parseInt(this.dom.adminModalTermInput.value) || 0;

        if (principal > 0 && term > 0) {
            const metrics = this.calculateLoanMetrics(principal, term, rate);
            this.dom.adminModalCalcEmi.textContent = this.formatCurrency(metrics.monthlyEMI);
            this.dom.adminModalCalcTotal.textContent = this.formatCurrency(metrics.totalPayable);
        } else {
            this.dom.adminModalCalcEmi.textContent = '₹0.00';
            this.dom.adminModalCalcTotal.textContent = '₹0.00';
        }
    }

    // Execute loan decision (Approve/Reject)
    async handleAdminLoanDecision(status) {
        const loanId = this.dom.adminModalLoanId.value;
        const loan = this.state.loans.find(l => l.id === loanId);
        if (!loan) return;

        let decisionBody = { loanId, status };

        if (status === 'Approved') {
            const approvedRate = parseFloat(this.dom.adminModalRateInput.value);
            const approvedTerm = parseInt(this.dom.adminModalTermInput.value);
            const metrics = this.calculateLoanMetrics(loan.requestedAmount, approvedTerm, approvedRate);

            decisionBody.approvedTerm = approvedTerm;
            decisionBody.interestRate = approvedRate;
            decisionBody.monthlyEMI = metrics.monthlyEMI;
            decisionBody.totalRepayable = metrics.totalPayable;
        }

        try {
            const res = await fetch('http://localhost:8080/api/loans/decision', {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(decisionBody)
            });

            if (res.ok) {
                if (status === 'Approved') {
                    this.showToast(`Loan ${loanId} approved successfully.`, 'success');
                } else {
                    this.showToast(`Loan ${loanId} has been rejected.`, 'warning');
                }
                this.closeAdminApprovalModal();
                await this.syncStateFromServer();
                this.renderAdminPortal();
            } else {
                const err = await res.json();
                this.showToast(err.error || 'Failed to process decision.', 'danger');
            }
        } catch (err) {
            console.error(err);
            this.showToast('Network error during loan decision.', 'danger');
        }
    }

    // Modal Helpers for User Registration
    openRegisterModal() {
        this.dom.registerNameInput.value = '';
        this.dom.registerEmailInput.value = '';
        this.dom.registerUsernameInput.value = '';
        this.dom.registerPasswordInput.value = '';
        this.dom.registerRoleSelect.value = 'vendor';
        this.dom.registerUserModal.classList.remove('hidden');
    }

    closeRegisterModal() {
        this.dom.registerUserModal.classList.add('hidden');
    }

    async handleUserRegistration(e) {
        e.preventDefault();
        
        const name = this.dom.registerNameInput.value.trim();
        const email = this.dom.registerEmailInput.value.trim();
        const username = this.dom.registerUsernameInput.value.trim();
        const password = this.dom.registerPasswordInput.value;
        const role = this.dom.registerRoleSelect.value;

        const requestBody = { name, email, username, password, role };

        try {
            const res = await fetch('http://localhost:8080/api/users/register', {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(requestBody)
            });

            if (res.ok) {
                this.showToast(`User account for "${name}" registered successfully.`, 'success');
                this.closeRegisterModal();
                await this.syncStateFromServer();
                this.renderAdminPortal();
            } else {
                const err = await res.json();
                this.showToast(err.error || 'Failed to register new account.', 'danger');
            }
        } catch (err) {
            console.error(err);
            this.showToast('Network error during user registration.', 'danger');
        }
    }

    // View historical details of individual vendor in modal
    openVendorDetailsModal(username) {
        const vendor = this.state.users.find(u => u.username === username);
        if (!vendor) return;

        this.dom.detailsVendorName.textContent = vendor.name;
        this.dom.detailsVendorEmail.textContent = vendor.email;
        this.dom.detailsVendorInitials.textContent = vendor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        const vendorLoans = this.state.loans.filter(l => l.vendorUsername === username);
        const tbody = this.dom.detailsVendorHistoryTbody;
        tbody.innerHTML = '';

        if (vendorLoans.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-secondary">No loan records found for this vendor</td></tr>`;
        } else {
            // Sort by request date descending
            const sortedLoans = [...vendorLoans].sort((a,b) => new Date(b.requestDate) - new Date(a.requestDate));
            sortedLoans.forEach(loan => {
                const tr = document.createElement('tr');
                const outText = loan.status === 'Pending' || loan.status === 'Rejected' ? '-' : this.formatCurrency(loan.outstandingAmount);
                const approvedText = loan.approvedAmount > 0 ? this.formatCurrency(loan.approvedAmount) : '-';
                
                tr.innerHTML = `
                    <td class="text-bold">${loan.id}</td>
                    <td class="text-bold">${this.formatCurrency(loan.requestedAmount)}</td>
                    <td>${loan.interestRate.toFixed(2)}%</td>
                    <td>${loan.status === 'Repaying' ? loan.remainingTerm : '-'} / ${loan.approvedTerm || loan.requestedTerm} mo</td>
                    <td>${this.formatCurrency(loan.totalRepayable)}</td>
                    <td class="text-success">${this.formatCurrency(loan.totalPaid)}</td>
                    <td>${outText}</td>
                    <td>${this.getStatusBadge(loan.status)}</td>
                    <td class="text-secondary">${loan.purpose}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        this.dom.vendorDetailsModal.classList.remove('hidden');
        lucide.createIcons();
    }

    closeVendorDetailsModal() {
        this.dom.vendorDetailsModal.classList.add('hidden');
    }

    // 8. FORM SLIDER INTERACTIONS & CALCULATIONS PREVIEW
    updateVendorSliders() {
        const amount = parseInt(this.dom.loanAmountSlider.value);
        const term = parseInt(this.dom.loanTermSlider.value);
        
        this.dom.amountSliderVal.textContent = this.formatCurrency(amount);
        this.dom.termSliderVal.textContent = `${term} mo`;

        const metrics = this.calculateLoanMetrics(amount, term);
        this.dom.calcInterestRate.textContent = `${metrics.rate.toFixed(2)}%`;
        this.dom.calcMonthlyEmi.textContent = this.formatCurrency(metrics.monthlyEMI);
        this.dom.calcTotalPayable.textContent = this.formatCurrency(metrics.totalPayable);
    }

    updateModalSliders() {
        const amount = parseInt(this.dom.modalAmountSlider.value);
        const term = parseInt(this.dom.modalTermSlider.value);
        
        this.dom.modalAmountVal.textContent = this.formatCurrency(amount);
        this.dom.modalTermVal.textContent = `${term} mo`;

        const metrics = this.calculateLoanMetrics(amount, term);
        this.dom.modalCalcInterest.textContent = `${metrics.rate.toFixed(2)}%`;
        this.dom.modalCalcEmi.textContent = this.formatCurrency(metrics.monthlyEMI);
        this.dom.modalCalcTotal.textContent = this.formatCurrency(metrics.totalPayable);
    }

    openLoanModal() {
        // Preset values matching dashboard slider
        this.dom.modalAmountSlider.value = 10000;
        this.dom.modalTermSlider.value = 12;
        this.updateModalSliders();
        this.dom.loanRequestModal.classList.remove('hidden');
    }

    closeLoanModal() {
        this.dom.loanRequestModal.classList.add('hidden');
    }

    // Tab switching in login
    switchLoginTab(role) {
        this.activeLoginTab = role;
        if (role === 'vendor') {
            this.dom.tabVendor.classList.add('active');
            this.dom.tabAdmin.classList.remove('active');
            this.dom.loginUsernameInput.placeholder = 'Enter vendor username (e.g. vendor1)...';
        } else {
            this.dom.tabAdmin.classList.add('active');
            this.dom.tabVendor.classList.remove('active');
            this.dom.loginUsernameInput.placeholder = 'Enter admin username (e.g. admin)...';
        }
    }

    // 9. EVENT REGISTRATION SYSTEM
    registerEventListeners() {
        // Handle Browser Back/Forward buttons
        window.addEventListener('popstate', (e) => {
            const section = e.state ? e.state.section : 'login';
            this.navigateTo(section, false);
        });

        // App Nav Title Return
        this.dom.logoButton.addEventListener('click', () => {
            if (this.state.currentUser) {
                this.navigateTo(this.state.currentUser.role);
            } else {
                this.navigateTo('login');
            }
        });

        // Logout
        this.dom.logoutBtn.addEventListener('click', () => {
            this.navigateTo('login');
            this.showToast('You have successfully logged out.', 'info');
        });

        // Login tabs
        this.dom.tabVendor.addEventListener('click', () => this.switchLoginTab('vendor'));
        this.dom.tabAdmin.addEventListener('click', () => this.switchLoginTab('admin'));

        // Demo autofills
        this.dom.demoVendorBtn.addEventListener('click', () => {
            this.switchLoginTab('vendor');
            this.dom.loginUsernameInput.value = 'vendor1';
            this.dom.loginPasswordInput.value = 'vendor123';
        });
        
        this.dom.demoAdminBtn.addEventListener('click', () => {
            this.switchLoginTab('admin');
            this.dom.loginUsernameInput.value = 'admin';
            this.dom.loginPasswordInput.value = 'admin123';
        });

        // Sign-in execution
        this.dom.loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Slider changes
        this.dom.loanAmountSlider.addEventListener('input', () => this.updateVendorSliders());
        this.dom.loanTermSlider.addEventListener('input', () => this.updateVendorSliders());

        // Quick Apply submission
        this.dom.quickLoanForm.addEventListener('submit', (e) => {
            const amount = parseInt(this.dom.loanAmountSlider.value);
            const term = parseInt(this.dom.loanTermSlider.value);
            const purpose = this.dom.loanPurposeInput.value.trim();
            this.handleLoanRequest(e, amount, term, purpose, false);
        });

        // Repayment simulation
        this.dom.btnVendorRepayInstallment.addEventListener('click', () => this.handleRepayInstallment());

        // Modal triggers
        this.dom.btnRequestLoanModal.addEventListener('click', () => this.openLoanModal());
        this.dom.btnCloseLoanModal.addEventListener('click', () => this.closeLoanModal());
        this.dom.btnCancelLoanModal.addEventListener('click', () => this.closeLoanModal());
        
        this.dom.modalAmountSlider.addEventListener('input', () => this.updateModalSliders());
        this.dom.modalTermSlider.addEventListener('input', () => this.updateModalSliders());

        this.dom.modalLoanForm.addEventListener('submit', (e) => {
            const amount = parseInt(this.dom.modalAmountSlider.value);
            const term = parseInt(this.dom.modalTermSlider.value);
            const purpose = this.dom.modalPurposeInput.value.trim();
            this.handleLoanRequest(e, amount, term, purpose, true);
        });

        // Modal - Admin Approvals recalculations on field edit
        this.dom.adminModalRateInput.addEventListener('input', () => this.updateAdminRecalcPreview());
        this.dom.adminModalTermInput.addEventListener('input', () => this.updateAdminRecalcPreview());
        
        // Modal - Admin Approval click actions
        this.dom.btnCloseApprovalModal.addEventListener('click', () => this.closeAdminApprovalModal());
        
        this.dom.adminApproveForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdminLoanDecision('Approved');
        });
        
        this.dom.btnRejectLoanFromModal.addEventListener('click', () => {
            this.handleAdminLoanDecision('Rejected');
        });

        // Close details modal
        this.dom.btnCloseDetailsModal.addEventListener('click', () => this.closeVendorDetailsModal());

        // User registration triggers
        this.dom.btnRegisterUserModal.addEventListener('click', () => this.openRegisterModal());
        this.dom.btnCloseRegisterModal.addEventListener('click', () => this.closeRegisterModal());
        this.dom.btnCancelRegisterModal.addEventListener('click', () => this.closeRegisterModal());
        this.dom.registerUserForm.addEventListener('submit', (e) => this.handleUserRegistration(e));

        // Search trigger
        this.dom.adminVendorSearch.addEventListener('input', () => this.renderVendorDirectoryTable());
        
        // Click outside modal overlays to close them
        window.addEventListener('click', (e) => {
            if (e.target === this.dom.loanRequestModal) this.closeLoanModal();
            if (e.target === this.dom.adminApprovalModal) this.closeAdminApprovalModal();
            if (e.target === this.dom.vendorDetailsModal) this.closeVendorDetailsModal();
            if (e.target === this.dom.registerUserModal) this.closeRegisterModal();
        });
    }

    // 10. UTILITY FORMATTERS
    formatCurrency(val) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(val);
    }

    getStatusBadge(status) {
        switch (status) {
            case 'Pending': return `<span class="badge badge-warning">Pending Approval</span>`;
            case 'Approved': return `<span class="badge badge-info">Approved</span>`;
            case 'Repaying': return `<span class="badge badge-primary">Active Repaying</span>`;
            case 'Completed': return `<span class="badge badge-success">Completed</span>`;
            case 'Rejected': return `<span class="badge badge-danger">Rejected</span>`;
            default: return `<span class="badge text-secondary">${status}</span>`;
        }
    }

    truncateString(str, num) {
        if (!str) return '-';
        if (str.length <= num) return str;
        return str.slice(0, num) + '...';
    }

    // Floating Notification Engine
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'info';
        if (type === 'success') icon = 'check-circle';
        if (type === 'warning') icon = 'alert-triangle';
        if (type === 'danger') icon = 'x-circle';

        toast.innerHTML = `
            <i data-lucide="${icon}" class="toast-icon"></i>
            <span class="toast-message">${message}</span>
        `;
        
        this.dom.toastContainer.appendChild(toast);
        lucide.createIcons();

        // Self destroy
        setTimeout(() => {
            toast.style.animation = 'slideInToast 0.3s reverse ease-in-out';
            setTimeout(() => toast.remove(), 280);
        }, 3500);
    }
}

// Instantiate application on window mount
window.addEventListener('DOMContentLoaded', () => {
    window.cfApp = new DebitCreditApp();
});
