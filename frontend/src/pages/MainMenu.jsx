import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Bell, 
  Play, 
  FileText, 
  Camera,
  Settings,
  RefreshCw,
  User,
  Cog,
  Monitor
} from 'lucide-react';

/**
 * MainMenu Component - Template's main dashboard with icon cards
 * 
 * Shows three sections:
 * - Operation (Smart Monitor)
 * - Search (Playback, Log)
 * - Configuration (Device Manager, Event Config, Tour & Task, User, System, Device Config)
 */
function MainMenu() {
  const navigate = useNavigate();

  // Card data matching template
  const sections = [
    {
      title: 'Operation',
      cards: [
        {
          icon: <Video size={54} className="text-cyan-400" />,
          label: 'Smart Monitor',
          route: '/monitor',
          gradient: 'from-cyan-500 to-blue-600'
        },
      ]
    },
    {
      title: 'Search',
      cards: [
        {
          icon: <Play size={54} className="text-orange-400" />,
          label: 'Playback',
          route: '/playback',
          gradient: 'from-orange-500 to-amber-600'
        },
        {
          icon: <FileText size={54} className="text-yellow-400" />,
          label: 'Log',
          route: '/log',
          gradient: 'from-yellow-500 to-orange-500'
        }
      ]
    },
    {
      title: 'Configuration',
      cards: [
        {
          icon: <Camera size={54} className="text-gray-400" />,
          label: 'Device Manager',
          route: '/cameras',
          gradient: 'from-gray-600 to-gray-700'
        },
        {
          icon: <Bell size={54} className="text-pink-400" />,
          label: 'Event Configuration',
          route: '/event-config',
          gradient: 'from-pink-500 to-purple-600'
        },
        {
          icon: <User size={54} className="text-blue-400" />,
          label: 'User',
          route: '/user',
          gradient: 'from-blue-500 to-indigo-600'
        },
        {
          icon: <Settings size={54} className="text-amber-400" />,
          label: 'System Configuration',
          route: '/settings',
          gradient: 'from-amber-500 to-orange-600'
        },
        {
          icon: <Monitor size={54} className="text-gray-400" />,
          label: 'Device Configuration',
          route: '/device-config',
          gradient: 'from-gray-500 to-gray-600'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-8">
      {/* Sections */}
      {sections.map((section, sectionIdx) => (
        <div key={sectionIdx} className="mb-12">
          {/* Section Title */}
          <h2 className="text-yellow-500 text-lg font-semibold mb-6">
            {section.title}
          </h2>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {section.cards.map((card, cardIdx) => (
              <button
                key={cardIdx}
                onClick={() => navigate(card.route)}
                className="group relative bg-[#2d2d2d] hover:bg-[#353535] rounded-2xl p-8 
                         transition-all duration-300 hover:scale-105 hover:shadow-xl
                         border border-gray-700 hover:border-gray-600"
              >
                {/* Card Content */}
                <div className="flex flex-col items-center gap-4">
                  {/* Icon Container */}
                  <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${card.gradient} 
                                flex items-center justify-center
                                group-hover:scale-110 transition-transform duration-300`}>
                    {card.icon}
                  </div>

                  {/* Label */}
                  <span className="text-sm text-gray-200 text-center font-medium">
                    {card.label}
                  </span>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 
                              bg-gradient-to-br from-cyan-500/10 to-transparent 
                              transition-opacity duration-300 pointer-events-none"></div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MainMenu;
