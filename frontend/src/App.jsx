import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';

// Layout
import TopBar from './layouts/TopBar';

// Pages
import MainMenu from './pages/MainMenu';
import LiveMonitor from './pages/LiveMonitor';
import EventHistory from './pages/EventHistory';
import CameraManagement from './pages/CameraManagement';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';

/**
 * App Component - Completely revised for template design
 * 
 * Changes from original:
 * - NO sidebar menu layout
 * - TopBar with logo + page title + icons
 * - Main menu is the home page with icon cards
 * - Each page is full screen below the top bar
 * - Dark theme throughout
 */
function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm, // Enable dark theme
        token: {
          colorPrimary: '#00d9ff', // Cyan color from template
          borderRadius: 6,
          colorBgContainer: '#2d2d2d',
          colorBgElevated: '#2d2d2d',
        },
      }}
    >
      <BrowserRouter>
        <div className="min-h-screen bg-[#1a1a1a]">
          {/* Top Bar - Always visible */}
          <TopBar />

          {/* Page Content */}
          <Routes>
            {/* Main Menu - Home page with icon cards */}
            <Route path="/" element={<MainMenu />} />
            
            {/* Application Pages */}
            <Route path="/monitor" element={<LiveMonitor />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<EventHistory />} />
            <Route path="/cameras" element={<CameraManagement />} />
            <Route path="/settings" element={<Settings />} />

            {/* Placeholder routes for other menu items */}
            <Route path="/playback" element={<PlaceholderPage title="Playback" />} />
            <Route path="/log" element={<PlaceholderPage title="Log" />} />
            <Route path="/event-config" element={<PlaceholderPage title="Event Configuration" />} />
            <Route path="/tour" element={<PlaceholderPage title="Tour & Task" />} />
            <Route path="/user" element={<PlaceholderPage title="User Management" />} />
            <Route path="/device-config" element={<PlaceholderPage title="Device Configuration" />} />

            {/* Catch all - redirect to main menu */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ConfigProvider>
  );
}

// Simple placeholder component for unimplemented pages
function PlaceholderPage({ title }) {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4 text-cyan-400">{title}</h1>
        <p className="text-gray-400">This page will be implemented in future iterations.</p>
      </div>
    </div>
  );
}

export default App;
