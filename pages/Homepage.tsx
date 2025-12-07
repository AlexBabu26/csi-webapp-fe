import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, ChevronRight } from 'lucide-react';

const announcements = [
  { id: 1, urgent: true, text: 'Kalamela 2024 Registration closes on December 31st.' },
  { id: 2, urgent: false, text: 'Unit Presidents meeting scheduled for next Saturday at 10 AM.' },
  { id: 3, urgent: false, text: 'Youth Conference 2025 dates announced - February 14-16.' },
];

const galleryImages = [
  'https://picsum.photos/seed/csi1/150/150',
  'https://picsum.photos/seed/csi2/150/150',
  'https://picsum.photos/seed/csi3/150/150',
];

export const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-bg-alt flex flex-col">
      {/* Announcement Banner */}
      <div className="bg-primary text-white py-2 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-3 animate-fade-in" key={currentAnnouncement}>
            {announcements[currentAnnouncement].urgent && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded uppercase">
                Urgent
              </span>
            )}
            <span>{announcements[currentAnnouncement].text}</span>
          </div>
          <span className="text-blue-200">•</span>
          <span className="text-blue-100 hidden md:inline">
            {announcements[(currentAnnouncement + 1) % announcements.length].text}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Organization Info */}
            <div className="space-y-8">
              {/* Image Gallery */}
              <div className="flex items-center space-x-4">
                {galleryImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg"
                  >
                    <img
                      src={img}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Title */}
              <div>
                <h1 className="text-4xl font-extrabold text-primary leading-tight">
                  CSI MKD YOUTH<br />MOVEMENT
                </h1>
                <p className="text-lg text-secondary mt-2">CSI Madhya Kerala Diocese</p>
              </div>

              {/* About Us */}
              <div className="border-l-4 border-primary pl-6 py-2">
                <h2 className="text-xl font-bold text-dark mb-3">About Us</h2>
                <p className="text-secondary leading-relaxed">
                  Founded in 1916, the CSI Madhya Kerala Diocese Youth Movement has been a beacon 
                  of faith and fellowship for over a century. We aim to empower youth through 
                  spiritual growth, social service, and cultural engagement.
                </p>
              </div>
            </div>

            {/* Right Column - Portal Card */}
            <div className="space-y-6">
              {/* Unit Portal Card */}
              <div className="bg-white rounded-xl shadow-card border border-border-color p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-dark">Unit Portal</h2>
                  <p className="text-secondary mt-1">Access your unit dashboard</p>
                </div>

                <div className="space-y-4">
                  <button
                    disabled
                    className="w-full py-3 px-6 rounded-lg border-2 border-border-color text-secondary font-medium cursor-not-allowed opacity-60"
                  >
                    Unit Registration (Closed)
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-3 px-6 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors"
                  >
                    Unit Login
                  </button>
                </div>
              </div>

              {/* Event Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Kalamela Card */}
                <button
                  onClick={() => navigate('/kalamela')}
                  className="bg-white rounded-xl shadow-card border border-border-color p-6 hover:shadow-card-hover transition-all text-center group"
                >
                  <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-100 transition-colors">
                    <Trophy className="w-7 h-7 text-amber-500" />
                  </div>
                  <h3 className="font-bold text-dark">Kalamela</h3>
                </button>

                {/* Conference Card */}
                <button
                  onClick={() => navigate('/conference')}
                  className="bg-white rounded-xl shadow-card border border-border-color p-6 hover:shadow-card-hover transition-all text-center group"
                >
                  <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-100 transition-colors">
                    <Users className="w-7 h-7 text-orange-500" />
                  </div>
                  <h3 className="font-bold text-dark">Conference</h3>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border-color py-6 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-secondary">
          <p>© 2024 CSI Madhya Kerala Diocese Youth Movement. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

