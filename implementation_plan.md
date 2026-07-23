# Implementation Plan - CrediFlow Vendor Loan Dashboard

Develop a premium, modern, and highly interactive finance application (`CrediFlow`) built using vanilla HTML5, CSS3, and JavaScript (ES6+). The application will feature distinct portals for **Vendors** (to request loans, view outstanding details, simulate repayments) and **Admins** (to view all vendors, approve/reject loans, and monitor loan metrics).

The application will use a dark glassmorphism theme, smooth animations, and interactive charts.

## User Review Required

> [!NOTE]
> **Data Persistence:** The application will use `localStorage` for data persistence. This allows you to refresh the page, close the browser, and even simulate transactions, with all state (vendors, loans, payments) saved locally.
>
> **Demo Accounts:** To make testing easier, the application will provide clickable pre-fill buttons for both Admin and Vendor credentials.
>
> **Interactive Features:** A "Pay Installment" simulation will be included on the Vendor dashboard to allow testing of the repayment flow and see the metrics update in real-time.

## Proposed Changes

We will create a single-page application (SPA) with a component-based structure, all styled with a modern design system.

### Frontend Component

#### [NEW] [index.html](file:///c:/Users/Pc/Desktop/finance%20app/index.html)
The main entry point containing:
- Meta tags for SEO and responsive design.
- Google Fonts (`Plus Jakarta Sans`) and Lucide Icons (via CDN).
- Chart.js (via CDN) for data visualizations.
- Modular structural layout (App Header, Login Screen, Admin Dashboard, Vendor Dashboard).

#### [NEW] [styles.css](file:///c:/Users/Pc/Desktop/finance%20app/styles.css)
The design system and styles:
- **Design Tokens:** Dark/Glassmorphism colors, custom gradients (violet to cyan), typography scales, blur values, and drop shadows.
- **Components:** Glass cards, interactive inputs, sliders, status badges, data tables, custom scrollbars, toast notifications, and modal dialogues.
- **Animations:** Floating cards, keyframe pulse effects, list-reveal transitions, and interactive button active states.

#### [NEW] [app.js](file:///c:/Users/Pc/Desktop/finance%20app/app.js)
The core application logic, comprising:
- **State Management:** A robust central state object initialized with default seed data (mock vendors and loans) and syncs with `localStorage`.
- **Router:** Page switching logic to handle transitions between Login, Admin, and Vendor views.
- **Calculators:** Real-time loan repayment calculator for the loan application form (EMI, total interest, total payable).
- **Vendor Controller:** Methods for requesting loans, making mock payments, and updating charts.
- **Admin Controller:** Methods for approving/rejecting loans, updating custom interest rates/terms upon approval, and compiling vendor directory list.
- **UI Renderer:** Dynamic rendering of data tables, badge colors, and Chart.js metrics.

## Verification Plan

### Automated/Tool Verification
- Verify HTML, CSS, and JS files build and load correctly.
- Test in a headless browser via the `browser_subagent` to ensure no console errors are thrown and views load.

### Manual Verification
1. **Authentication Flow:**
   - Click "Login as Admin" demo button -> Verify redirect to Admin Dashboard.
   - Click "Logout" -> Verify redirect to login.
   - Click "Login as Vendor" demo button -> Verify redirect to Vendor Dashboard.
2. **Vendor Loan Request:**
   - Navigate to Vendor Dashboard -> Use the loan calculator sliders -> Apply for a loan.
   - Verify that a new loan entry is added with status `Pending`.
3. **Admin Loan Processing:**
   - Log in as Admin -> Find the pending loan in the approval list.
   - Approve the loan (with custom interest rate adjustability).
   - Check the Vendor Directory in Admin to verify that the vendor's total outstanding and interest rate are updated.
4. **Repayment Flow:**
   - Log back in as the Vendor -> Verify loan status is now `Active/Repaying`.
   - Click "Pay Installment" -> Verify that remaining balance decreases, next payment date advances, and the repayment progress chart updates.
