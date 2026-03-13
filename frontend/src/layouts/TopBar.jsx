import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Volume2, 
  Bell, 
  User, 
  Settings, 
  Headphones,
  Minimize2,
  Maximize2,
  X
} from 'lucide-react';

/**
 * TopBar Component - Phiên bản đã tối ưu UI
 */
function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  // Cập nhật đồng hồ mỗi giây
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Xác định tiêu đề trang dựa trên route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('monitor')) return 'Smart Monitor';
    if (path.includes('traffic')) return 'Intelligent Traffic';
    if (path.includes('search/person')) return 'Target Tracking';
    if (path.includes('events')) return 'Event Center';
    if (path.includes('cameras')) return 'Device Manager';
    if (path.includes('settings')) return 'System Configuration';
    if (path.includes('playback')) return 'Video Playback';
    if (path.includes('log')) return 'System Log';
    if (path.includes('event-config')) return 'Event Configuration';
    if (path.includes('user')) return 'User Management';
    if (path.includes('system-config')) return 'System Configuration';
    if (path.includes('device-config')) return 'Device Configuration';
    if (path.includes('devices')) return 'Device Manager';
    return 'Civil Intelligent Sensing System';
  };

  const formattedTime = time.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false 
  });

  // Style chung cho các icon button để code sạch hơn
  const iconBtnClass = "p-2 hover:bg-white/10 rounded-md transition-all duration-200 bg-transparent border-none flex items-center justify-center group";
  const iconColorClass = "text-gray-400 group-hover:text-cyan-400 transition-colors";

  return (
    <div className="h-14 bg-[#1a1a1a] flex items-center justify-between px-4 border-b border-white/5 select-none">
      
      {/* Cụm bên trái: Logo + Home + Title */}
      <div className="flex items-center gap-2">
        <div className="flex items-center mr-2">
          <img 
            src="/logo_hanet_cut.png" 
            alt="HANET" 
            className="h-7 w-auto object-contain brightness-0 invert opacity-90"
          />
        </div>

        <div className="h-6 w-px bg-white/10 mx-1"></div>

        <button
          onClick={() => navigate('/')}
          className={iconBtnClass}
          title="Main Menu"
        >
          <Home size={19} className={iconColorClass} />
        </button>

        <div className="text-cyan-500 font-semibold text-lg tracking-wide ml-2 uppercase">
          {getPageTitle()}
        </div>
      </div>

      {/* Cụm bên phải: Time + Actions + Window Controls */}
      <div className="flex items-center gap-1">
        
        {/* Đồng hồ */}
        <div className="px-4 py-1 bg-black/20 rounded mr-2">
          <span className="text-gray-300 text-lg font-mono tracking-widest">
            {formattedTime}
          </span>
        </div>

        {/* Nhóm Action Icons */}
        <div className="flex items-center gap-0.5">
          <button className={iconBtnClass} title="Âm lượng">
            <Volume2 size={18} className={iconColorClass} />
          </button>
          
          <button className={`${iconBtnClass} relative`} title="Thông báo">
            <Bell size={18} className={iconColorClass} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#1a1a1a]"></span>
          </button>
          
          <button className={iconBtnClass} title="Tài khoản">
            <User size={18} className={iconColorClass} />
          </button>
          
          <button className={iconBtnClass} title="Cài đặt">
            <Settings size={18} className={iconColorClass} />
          </button>
          
          <button className={iconBtnClass} title="Âm thanh hệ thống">
            <Headphones size={18} className={iconColorClass} />
          </button>
        </div>

        {/* Phân cách */}
        <div className="h-6 w-px bg-white/10 mx-2"></div>

        {/* Nhóm điều khiển cửa sổ */}
        <div className="flex items-center">
          <button className={iconBtnClass} title="Thu nhỏ">
            <Minimize2 size={16} className="text-gray-500 group-hover:text-white" />
          </button>
          
          <button className={iconBtnClass} title="Phóng to">
            <Maximize2 size={16} className="text-cyan-500 group-hover:text-cyan-300" />
          </button>
          
          <button className="p-2 hover:bg-red-600/80 rounded-md transition-all duration-200 group" title="Đóng">
            <X size={18} className="text-gray-500 group-hover:text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopBar;