import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  History,
  Camera,
  Settings,
  Bell,
} from 'lucide-react';

const { Header, Content, Sider } = Layout;

/**
 * MainLayout Component
 * 
 * This is the main application shell that wraps all pages.
 * Similar to a "base frame" in traditional desktop apps.
 * 
 * Key React Concepts:
 * 1. useState: Creates a piece of state (like a class member variable)
 * 2. Outlet: From react-router - this is where child routes render
 * 3. useLocation: Hook to get current URL path
 */
function MainLayout() {
  // STATE: Track if sidebar is collapsed (useState creates reactive state)
  const [collapsed, setCollapsed] = useState(false);
  
  // Get current URL path to highlight active menu item
  const location = useLocation();
  
  // Ant Design's theme tokens (like CSS variables)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Menu items configuration
  // 'key' must match the route path for auto-highlighting
  const menuItems = [
    {
      key: '/dashboard',
      icon: <LayoutDashboard size={20} />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    {
      key: '/monitor',
      icon: <Video size={20} />,
      label: <Link to="/monitor">Live Monitor</Link>,
    },
    {
      key: '/events',
      icon: <History size={20} />,
      label: <Link to="/events">Event History</Link>,
    },
    {
      key: '/cameras',
      icon: <Camera size={20} />,
      label: <Link to="/cameras">Cameras</Link>,
    },
    {
      key: '/settings',
      icon: <Settings size={20} />,
      label: <Link to="/settings">Settings</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* SIDEBAR */}
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        {/* Logo/Title Area */}
        <div className="flex items-center justify-center h-16 bg-blue-600">
          <Camera className="text-white" size={collapsed ? 24 : 32} />
          {!collapsed && (
            <span className="ml-3 text-white font-bold text-lg">
              VMS System
            </span>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="mt-4"
        />
      </Sider>

      {/* MAIN CONTENT AREA */}
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
        {/* HEADER */}
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h2 className="text-xl font-semibold m-0">
            Civil Intelligent Sensing System
          </h2>
          
          {/* Right side of header */}
          <div className="flex items-center gap-4">
            <Bell className="cursor-pointer hover:text-blue-600 transition-colors" size={20} />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                A
              </div>
              <span className="text-sm">Admin</span>
            </div>
          </div>
        </Header>

        {/* CONTENT AREA - Where pages render */}
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {/* This Outlet is where child routes (pages) will render */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
