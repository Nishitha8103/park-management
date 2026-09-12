import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu, TreePine } from 'lucide-react';
import './MainLayout.css';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="app-layout">
      <header className="main-topbar">
        <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle navigation menu">
          <Menu size={26} color="white" />
        </button>
        <div className="topbar-logo">
          <TreePine size={24} color="white" />
          <span className="logo-text">Parks Monitoring</span>
        </div>
      </header>
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
