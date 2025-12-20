import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Users, FileText, CreditCard, Trophy, ArrowLeft, LogOut } from 'lucide-react';
import { clearAuthToken } from '../services/auth';

export const KalamelaOfficial: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bgLight">
      {/* Header */}
      <header className="bg-white border-b border-borderColor shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary rounded-md flex items-center justify-center text-white font-bold text-xl">
              K
            </div>
            <div>
              <h1 className="text-xl font-bold text-textDark">Kalamela Official Portal</h1>
              <p className="text-sm text-textMuted">District Official Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-textDark">Welcome to Kalamela Official Portal</h2>
          <p className="text-textMuted mt-2">Manage participant registrations, payments, and event participation.</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary">
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-textDark mb-2">Register Participants</h3>
              <p className="text-sm text-textMuted mb-4">Add individual and group participants</p>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-success">
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-bold text-textDark mb-2">Event Participation</h3>
              <p className="text-sm text-textMuted mb-4">Manage event registrations</p>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-warning">
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="w-8 h-8 text-warning" />
              </div>
              <h3 className="font-bold text-textDark mb-2">Payments</h3>
              <p className="text-sm text-textMuted mb-4">Submit payment proofs</p>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-info">
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-info" />
              </div>
              <h3 className="font-bold text-textDark mb-2">Reports</h3>
              <p className="text-sm text-textMuted mb-4">View participation reports</p>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-textDark mb-2">Official Portal Access</h3>
              <p className="text-textMuted mb-4">
                You are logged in as a District Official. You have access to:
              </p>
              <ul className="list-disc list-inside text-textMuted space-y-1 text-sm">
                <li>Register individual and group participants for Kalamela events</li>
                <li>Manage event participation for your district</li>
                <li>Submit payment proofs and track payment status</li>
                <li>View and download reports</li>
              </ul>
              <p className="text-sm text-primary font-medium mt-4">
                Note: Full functionality coming soon. Contact admin for assistance.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};




