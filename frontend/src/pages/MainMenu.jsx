import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Bell, 
  Play, 
  FileText, 
  Camera,
  Settings,
  User,
  Monitor,
  Car,           // Icon cho Giao thông
  Siren,   // Icon cho An ninh/Trật tự
  Leaf,          // Icon cho Môi trường
  UserSearch     // Icon cho Tìm người
} from 'lucide-react';

/**
 * MainMenu Component - Enterprise VMS & AI Analytics UI 
 * (White Text, Blue Glow, Large Icons)
 */
function MainMenu() {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'OPERATION & ANALYTICS',
      cards: [
        {
          icon: <Video size={64} strokeWidth={1.5} />,
          label: 'Smart Monitor',
          route: '/monitor',
        },
        {
          icon: <Car size={64} strokeWidth={1.5} />,
          label: 'Intelligent Traffic',
          route: '/traffic',
        },
        {
          icon: <Siren size={64} strokeWidth={1.5} />,
          label: 'Public Security',
          route: '/security',
        },
        {
          icon: <Leaf size={64} strokeWidth={1.5} />,
          label: 'Environmental',
          route: '/environment',
        }
      ]
    },
    {
      title: 'AI SEARCH & INQUIRY',
      cards: [
        {
          icon: <UserSearch size={64} strokeWidth={1.5} />,
          label: 'Target Tracking',
          route: '/search/person',
        },
        {
          icon: <Play size={64} strokeWidth={1.5} />,
          label: 'Video Playback',
          route: '/playback',
        },
        {
          icon: <FileText size={64} strokeWidth={1.5} />,
          label: 'System Log',
          route: '/log',
        }
      ]
    },
    {
      title: 'CONFIGURATION',
      cards: [
        {
          icon: <Camera size={64} strokeWidth={1.5} />,
          label: 'Device Manager',
          route: '/cameras',
        },
        {
          icon: <Bell size={64} strokeWidth={1.5} />,
          label: 'Event Configuration',
          route: '/event-config',
        },
        {
          icon: <User size={64} strokeWidth={1.5} />,
          label: 'User',
          route: '/user',
        },
        {
          icon: <Settings size={64} strokeWidth={1.5} />,
          label: 'System Configuration',
          route: '/settings',
        },
        {
          icon: <Monitor size={64} strokeWidth={1.5} />,
          label: 'Device Configuration',
          route: '/device-config',
        }
      ]
    }
  ];

  return (
    // Set text-white ở wrapper ngoài cùng để làm màu mặc định
    <div className="min-h-screen bg-[#020617] text-white p-10 font-sans">
      
      <div className="max-w-7xl mx-auto">
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-14">
            
            {/* Section Title - Chữ màu trắng (text-white), size to (text-xl) */}
            <h2 className="text-white text-xl font-bold mb-6 tracking-[0.2em] uppercase">
              {section.title}
            </h2>

            {/* Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {section.cards.map((card, cardIdx) => (
                <button
                  key={cardIdx}
                  onClick={() => navigate(card.route)}
                  className="group relative flex flex-col items-center justify-center gap-5 p-8
                             bg-[#0f172a] rounded-2xl border border-slate-800 
                             transition-all duration-300 ease-out
                             hover:bg-[#1e293b] hover:border-blue-500/40 
                             hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:-translate-y-1"
                >
                  {/* Icon Container - Vẫn giữ màu xanh khi hover để làm điểm nhấn */}
                  <div className="text-white group-hover:text-blue-400 
                                  transition-all duration-300 ease-out
                                  group-hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]
                                  group-hover:scale-105">
                    {card.icon}
                  </div>

                  {/* Label - Chữ màu trắng (text-white) cố định, size to (text-lg) */}
                  <span className="text-lg font-medium text-white tracking-wide">
                    {card.label}
                  </span>
                </button>
              ))}
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}

export default MainMenu;