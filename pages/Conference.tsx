import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, Clock, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Footer } from '../components/Footer';

// Conference dates
const CONFERENCE_DATE = new Date('2025-02-14T09:00:00');

const calculateTimeLeft = () => {
  const difference = +CONFERENCE_DATE - +new Date();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

export const Conference: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const scheduleItems = [
    { day: 'Day 1 - Feb 14', events: ['Registration & Welcome', 'Inauguration Ceremony', 'Keynote Session', 'Group Discussions'] },
    { day: 'Day 2 - Feb 15', events: ['Morning Worship', 'Workshop Sessions', 'Cultural Programs', 'Youth Rally'] },
    { day: 'Day 3 - Feb 16', events: ['Bible Study', 'Closing Ceremony', 'Felicitations', 'Departure'] },
  ];

  return (
    <div className="min-h-screen bg-bgLight flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center text-textMuted hover:text-primary transition-colors mr-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-textDark">Youth <span className="text-orange-500 font-normal">Conference</span></h1>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
            Official Login
          </Button>
        </div>
      </header>

      {/* Hero Section with Background Pattern */}
      <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 pb-20 pt-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 text-white text-sm font-medium mb-6">
            CSI MKD Youth Movement Presents
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Youth Conference 2025
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            "Arise, Shine, for your light has come" - Isaiah 60:1
          </p>

          {/* Countdown Timer */}
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto mb-8">
            {[
              { value: timeLeft.days, label: 'Days' },
              { value: timeLeft.hours, label: 'Hours' },
              { value: timeLeft.minutes, label: 'Minutes' },
              { value: timeLeft.seconds, label: 'Seconds' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="text-3xl md:text-4xl font-bold text-white">{String(item.value).padStart(2, '0')}</div>
                <div className="text-xs text-orange-100 uppercase tracking-wider">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Event Details */}
          <div className="flex flex-wrap justify-center gap-6 text-white">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              <span>February 14-16, 2025</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              <span>CSI Convention Centre, Kottayam</span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              <span>500+ Expected Delegates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 -mt-10 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Registration Card */}
          <div className="bg-white rounded-lg shadow-lg border border-borderColor p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-bold text-textDark mb-1">Registration Open!</h3>
                <p className="text-textMuted">Early bird discount available until January 31st</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={() => alert('Registration details coming soon!')}>
                  View Details
                </Button>
                <Button variant="primary" onClick={() => alert('Registration form coming soon!')}>
                  Register Now
                </Button>
              </div>
            </div>
            
            {/* Registration Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-borderColor">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">₹500</div>
                <div className="text-xs text-textMuted">Early Bird</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-textDark">₹750</div>
                <div className="text-xs text-textMuted">Regular</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">324</div>
                <div className="text-xs text-textMuted">Registered</div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-lg shadow-sm border border-borderColor p-6 mb-8">
            <h3 className="text-xl font-bold text-textDark mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-500" />
              Conference Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {scheduleItems.map((day, idx) => (
                <div key={idx} className="bg-bgLight rounded-lg p-4">
                  <h4 className="font-bold text-textDark mb-3 pb-2 border-b border-borderColor">{day.day}</h4>
                  <ul className="space-y-2">
                    {day.events.map((event, eventIdx) => (
                      <li key={eventIdx} className="flex items-start text-sm text-textMuted">
                        <CheckCircle className="w-4 h-4 mr-2 text-success flex-shrink-0 mt-0.5" />
                        {event}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Venue Info */}
          <div className="bg-white rounded-lg shadow-sm border border-borderColor p-6">
            <h3 className="text-xl font-bold text-textDark mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-orange-500" />
              Venue Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-textDark mb-2">CSI Convention Centre</h4>
                <p className="text-sm text-textMuted mb-4">
                  Baker Junction, Kottayam<br />
                  Kerala, India - 686001
                </p>
                <Button variant="outline" size="sm" onClick={() => window.open('https://maps.google.com', '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Map
                </Button>
              </div>
              <div className="bg-bgLight rounded-lg p-4">
                <h4 className="font-semibold text-textDark mb-2">Facilities Available</h4>
                <ul className="text-sm text-textMuted space-y-1">
                  <li>• Air-conditioned auditorium (1000 capacity)</li>
                  <li>• Accommodation for outstation delegates</li>
                  <li>• Cafeteria with vegetarian meals</li>
                  <li>• Ample parking space</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

