import React from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';
import { SiteSettings } from '../types';

interface FooterProps {
  siteSettings?: SiteSettings | null;
}

export const Footer: React.FC<FooterProps> = ({ siteSettings }) => {
  const currentYear = new Date().getFullYear();

  // Default values if site settings not available
  const appName = siteSettings?.app_name || 'CSI MKD Youth Movement';
  const appSubtitle = siteSettings?.app_subtitle || 'Empowering youth through faith, fellowship, and service since 1916.';
  const address = siteSettings?.contact?.address || 'CSI Madhya Kerala Diocese, Kottayam, Kerala';
  const email = siteSettings?.contact?.email || 'youth@csimkd.org';
  const phone = siteSettings?.contact?.phone || '+91 481 256 XXXX';
  const socialLinks = siteSettings?.social_links;
  const quickLinks = siteSettings?.quick_links?.filter(link => link.enabled) || [];

  // Split email if multiple emails are provided (comma-separated)
  const emails = email.split(',').map(e => e.trim());

  return (
    <footer className="bg-white border-t border-borderColor mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-sm font-bold text-textDark uppercase tracking-wider mb-4">
              {appName}
            </h3>
            <p className="text-sm text-textMuted leading-relaxed">
              {appSubtitle}
            </p>
            
            {/* Social Links */}
            {socialLinks && (socialLinks.facebook || socialLinks.instagram || socialLinks.youtube) && (
              <div className="flex items-center gap-3 mt-4">
                {socialLinks.facebook && (
                  <a 
                    href={socialLinks.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-textMuted hover:bg-primary hover:text-white transition-all"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {socialLinks.instagram && (
                  <a 
                    href={socialLinks.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-textMuted hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {socialLinks.youtube && (
                  <a 
                    href={socialLinks.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-textMuted hover:bg-red-600 hover:text-white transition-all"
                    aria-label="YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-textDark uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {/* Always show these default links */}
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
              {/* Dynamic quick links from API */}
              {quickLinks.map(link => (
                <li key={link.id}>
                  <a 
                    href={link.url} 
                    target={link.url.startsWith('http') ? '_blank' : undefined}
                    rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-sm text-textMuted hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
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
                <span>{address}</span>
              </li>
              <li className="flex items-start text-sm text-textMuted">
                <Mail className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  {emails.map((emailAddr, idx) => (
                    <a 
                      key={idx}
                      href={`mailto:${emailAddr}`} 
                      className="hover:text-primary transition-colors break-all"
                    >
                      {emailAddr}
                    </a>
                  ))}
                </div>
              </li>
              <li className="flex items-center text-sm text-textMuted">
                <Phone className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-primary transition-colors">
                  {phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-borderColor">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-textMuted">
            <p>© {currentYear} {appName}. All rights reserved.</p>
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
