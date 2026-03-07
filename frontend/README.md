# 🎥 Civil Intelligent Sensing System - Demo

A high-fidelity UI demo for a Video Management System (VMS) with AI-powered surveillance capabilities. This demo showcases a modern, dark-themed interface for real-time camera monitoring, event detection, and system management.

**⚠️ Note:** This is a **UI-only demo** with mocked data (no backend). All data is hardcoded in JSON format for demonstration purposes.

---

## 🚀 Quick Start

### Prerequisites

Before running this demo, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **yarn**

Check your versions:
```bash
node --version
npm --version
```

If you don't have Node.js installed, download it from: https://nodejs.org/

---

## 📦 Installation

### Step 1: Navigate to the demo folder

```bash
cd /mnt/sdb1/hoang/AI_challenge/demo
```

### Step 2: Install dependencies

```bash
npm install
```

This will install all required packages including:
- React 19.2.0
- Vite (build tool)
- Tailwind CSS (styling)
- Ant Design (UI components)
- React Router DOM (routing)
- Recharts (data visualization)
- Lucide React (icons)

**Note:** Installation may take 2-5 minutes depending on your internet connection.

---

## 🎬 Running the Demo

### Development Server (Recommended)

Start the development server with hot module replacement (HMR):

```bash
npm run dev
```

**Output:**
```
VITE v7.3.1  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**Open your browser and navigate to:** http://localhost:5173/

The app will automatically reload when you make changes to the code.

### Build for Production (Optional)

To create an optimized production build:

```bash
npm run build
```

Output will be in the `dist/` folder.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

---

## 🎯 Features Overview

### 1. **Main Menu** 📋
- **Route:** `/main-menu`
- **Description:** Icon-based navigation dashboard
- **Features:** 
  - Quick access to all system modules
  - Clean grid layout with icon cards
  - Dark-themed modern design

### 2. **Live Monitor** 📹
- **Route:** `/monitor`
- **Description:** Real-time camera monitoring interface
- **Features:**
  - Multiple layout options (1×1, 2×2, 3×3, 4×4)
  - Camera tree organization (groups, locations)
  - PTZ controls for compatible cameras
  - AI Chat interface for prompts
  - View controls and overlays
  - Camera pagination (Previous/Next)
  - **Double-click to toggle view** (1×1 ⟷ previous layout)
  - No scroll bars (fixed viewport)

### 3. **Dashboard** 📊
- **Route:** `/dashboard`
- **Description:** System overview and statistics
- **Features:**
  - Real-time metrics (Total Cameras, Active Alerts, etc.)
  - Event timeline charts
  - Recent alerts sidebar
  - Visual analytics

### 4. **Event History** 📜
- **Route:** `/events`
- **Description:** Historical event logs and analysis
- **Features:**
  - Filterable event table
  - Date/time filters
  - Event type categorization
  - Export capabilities (planned)

### 5. **Device Manager** 🎛️
- **Route:** `/cameras`
- **Description:** Camera management interface
- **Features:**
  - Camera list with status indicators
  - Add/Edit/Delete cameras
  - Camera configuration forms
  - Status monitoring (online/offline)

### 6. **System Configuration** ⚙️
- **Route:** `/settings`
- **Description:** System settings and preferences
- **Features:**
  - User management
  - System preferences
  - Network settings
  - AI model configuration

---

## 🗂️ Project Structure

```
demo/
├── public/                  # Static assets
│   ├── logo-hanet.png      # HANET logo
│   └── vite.svg            # Vite logo
│
├── src/
│   ├── components/         # Reusable components
│   │   └── monitor/        # Live monitor components
│   │       ├── CameraPlayer.jsx       # Individual camera feed
│   │       ├── VideoGrid.jsx          # Grid layout manager
│   │       ├── LeftControlPanel.jsx   # Sidebar (Camera/Chat/View/PTZ)
│   │       ├── BottomBar.jsx          # Layout selector & pagination
│   │       └── PTZControl.jsx         # PTZ control panel
│   │
│   ├── layouts/            # Layout components
│   │   └── TopBar.jsx      # Main navigation bar
│   │
│   ├── pages/              # Page components
│   │   ├── MainMenu.jsx            # Main menu page
│   │   ├── LiveMonitor.jsx         # Live view page
│   │   ├── Dashboard.jsx           # Dashboard page
│   │   ├── EventHistory.jsx        # Events page
│   │   ├── CameraManagement.jsx    # Camera management page
│   │   └── Settings.jsx            # Settings page
│   │
│   ├── mock/               # Mock data
│   │   └── data.js         # Hardcoded JSON data
│   │
│   ├── App.jsx             # Main app component & routing
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles (Tailwind)
│
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── eslint.config.js        # ESLint configuration
│
├── README.md               # This file
└── *.md                    # Documentation files
```

---

## 🛠️ Tech Stack

### Core Technologies:
- **React 19.2** - UI library
- **Vite 7.3** - Build tool & dev server
- **React Router DOM 7.13** - Client-side routing
- **JavaScript (ES6+)** - Programming language

### UI & Styling:
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Ant Design 6.3** - UI component library
- **Lucide React 0.563** - Icon library

### Data Visualization:
- **Recharts 3.7** - Charting library

### Development Tools:
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

---

## 🎨 Design Features

### Dark Theme
- Background: `#1a1a1a` (main), `#2d2d2d` (secondary)
- Accent: Cyan (`#00ffff`)
- Text: Gray scale for hierarchy

### Responsive Layout
- Flexbox & CSS Grid
- Dynamic viewport sizing
- No scroll bars (fixed viewport)

### Interactions
- Hover effects
- Selection states
- Double-click to toggle view
- Smooth transitions

---

## 🔍 Usage Guide

### Navigating the Demo:

1. **Start at Main Menu:**
   - Click any icon card to navigate to that module
   - Use the home icon in top bar to return

2. **Live Monitor:**
   - Select cameras from the left sidebar tree
   - Choose layout (1×1, 2×2, 3×3, 4×4) from bottom bar
   - Use Previous/Next buttons to paginate through cameras
   - **Double-click any camera** to maximize (1×1 view)
   - **Double-click again** to return to previous layout
   - Chat with AI in the collapsible "AI Chat" panel
   - Control PTZ cameras in the "PTZ Control" panel (if applicable)

3. **Dashboard:**
   - View system statistics in stat cards
   - Analyze event trends in the timeline chart
   - Check recent alerts in the sidebar

4. **Event History:**
   - Browse historical events in the table
   - Filter by date, type, or severity
   - Click rows for details

5. **Device Manager:**
   - View all cameras in a sortable table
   - Click "Add Camera" to open the add form
   - Edit or delete existing cameras
   - Monitor online/offline status

---

## 🐛 Troubleshooting

### Issue: Port 5173 already in use

**Error:**
```
Error: Port 5173 is already in use
```

**Solution:**
```bash
# Find and kill the process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### Issue: Module not found

**Error:**
```
Error: Cannot find module 'antd'
```

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: Tailwind styles not loading

**Error:** No styles applied, plain HTML visible

**Solution:**
```bash
# Rebuild Tailwind
npm run build

# Restart dev server
npm run dev
```

### Issue: Hot reload not working

**Solution:**
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

### Issue: Cannot access from network

**Solution:**
```bash
# Expose to network
npm run dev -- --host
```

Then access via: `http://<your-ip>:5173/`

---

## 📝 Development Notes

### Mock Data Location:
All mock data is in `/src/mock/data.js`. Modify this file to change:
- Camera list
- Event history
- Alert notifications
- Statistics

### Adding New Pages:
1. Create component in `/src/pages/`
2. Add route in `/src/App.jsx`
3. Add navigation link in `MainMenu.jsx` or `TopBar.jsx`

### Customizing Theme:
- Edit colors in `tailwind.config.js`
- Modify Ant Design theme in component files
- Update global styles in `src/index.css`

---

## 📚 Additional Documentation

- **`VMS_SYSTEM_SUMMARY.md`** - System architecture overview
- **`TEMPLATE_REVISION_SUMMARY.md`** - Template matching notes
- **`LAYOUT_OPTIMIZATION.md`** - Layout improvement details
- **`VIEWPORT_FIX_SUMMARY.md`** - Viewport & scroll fixes
- **`SCROLL_FIX_AND_TOGGLE.md`** - Latest scroll bar removal & toggle feature

---

## 🚧 Known Limitations

Since this is a **UI-only demo**:
- ❌ No real video streams (using gradients as placeholders)
- ❌ No backend API integration
- ❌ No database connectivity
- ❌ No user authentication
- ❌ No real-time event detection
- ❌ No actual PTZ camera control

**All data is mocked/hardcoded for demo purposes.**

---

## 🎯 Demo Checklist

Before presenting to your supervisor:

- [ ] Run `npm install` successfully
- [ ] Start dev server with `npm run dev`
- [ ] Navigate to all pages (Main Menu, Live Monitor, Dashboard, etc.)
- [ ] Test Live Monitor features:
  - [ ] Switch between layouts (1×1, 2×2, 3×3, 4×4)
  - [ ] Double-click to toggle view
  - [ ] Use Previous/Next pagination
  - [ ] Expand/collapse AI Chat panel
  - [ ] Select cameras from tree
  - [ ] Test PTZ controls (mock)
- [ ] Verify no scroll bars appear
- [ ] Check responsive behavior (resize browser)
- [ ] Test all navigation links
- [ ] Verify dark theme consistency

---

## 🏆 5-Day Development Plan Status

### ✅ Day 1: Skeleton & Navigation (COMPLETED)
- [x] Setup Tailwind and Ant Design
- [x] Implement MainLayout (TopBar + MainMenu)
- [x] Setup React Router with all routes
- [x] Create placeholder pages

### ✅ Day 2: Live Monitor (COMPLETED)
- [x] Create VideoGrid component (1×1, 2×2, 3×3, 4×4 layouts)
- [x] Create CameraPlayer component
- [x] Implement Control Toolbar
- [x] Add Mock PTZ Control
- [x] **BONUS:** Template matching & design overhaul
- [x] **BONUS:** Layout optimization (PTZ to sidebar)
- [x] **BONUS:** AI Chat panel integration
- [x] **BONUS:** Camera pagination
- [x] **BONUS:** Viewport fix (no scroll bars)
- [x] **BONUS:** Double-click toggle feature

### 🔄 Day 3: Dashboard & Visualization (PENDING)
- [ ] Create StatCard component
- [ ] Implement Recharts for event timeline
- [ ] Create Recent Alerts sidebar

### 🔄 Day 4: Management & Forms (PENDING)
- [ ] Implement CameraTable with search/filter
- [ ] Create AddCameraModal with form validation
- [ ] Implement EventHistory page with filters

### 🔄 Day 5: Polish & Demo Prep (PENDING)
- [ ] Add Toast Notifications (success/error messages)
- [ ] Implement Loading states (spinners)
- [ ] Final responsiveness check
- [ ] Code cleanup & documentation

---

## 📞 Support

### Need Help?

1. **Check Documentation:** Read the `.md` files in this folder
2. **Check Terminal Output:** Look for error messages in the console
3. **Clear Cache:** Try `rm -rf node_modules/.vite && npm run dev`
4. **Reinstall:** `rm -rf node_modules && npm install`

### Common Commands:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

---

## 🎉 Ready to Demo!

Your demo is ready to present! Just run:

```bash
cd /mnt/sdb1/hoang/AI_challenge/demo
npm run dev
```

Then open: **http://localhost:5173/**

**Good luck with your presentation! 🚀**

---

## 📄 License

This is a demo project for educational/presentation purposes.

---

## 👨‍💻 Author

**Civil Intelligent Sensing System Team**

Built with ❤️ using React, Vite, and Tailwind CSS.

---

**Last Updated:** February 11, 2026
**Version:** Demo v1.0 (Day 1 & 2 Complete)
