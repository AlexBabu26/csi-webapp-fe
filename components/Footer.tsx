import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-borderColor mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-sm font-bold text-textDark uppercase tracking-wider mb-4">
              CSI MKD Youth Movement
            </h3>
            <p className="text-sm text-textMuted leading-relaxed">
              Empowering youth through faith, fellowship, and service since 1916.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-textDark uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#/kalamela" className="text-sm text-textMuted hover:text-primary transition-colors">
                  Kalamela 2024
                </a>
              </li>
              <li>
                <a href="#/conference" className="text-sm text-textMuted hover:text-primary transition-colors">
                  Youth Conference
                </a>
              </li>
              <li>
                <a href="#/login" className="text-sm text-textMuted hover:text-primary transition-colors">
                  Official Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-bold text-textDark uppercase tracking-wider mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start text-sm text-textMuted">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                <span>CSI Madhya Kerala Diocese, Kottayam, Kerala</span>
              </li>
              <li className="flex items-center text-sm text-textMuted">
                <Mail className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                <a href="mailto:youth@csimkd.org" className="hover:text-primary transition-colors">
                  youth@csimkd.org
                </a>
              </li>
              <li className="flex items-center text-sm text-textMuted">
                <Phone className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                <span>+91 481 256 XXXX</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-borderColor">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-textMuted">
            <p>© {currentYear} CSI Madhya Kerala Diocese Youth Movement. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

