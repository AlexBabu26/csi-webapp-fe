import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  IndianRupee,
  UserPlus,
  FileText
} from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../../components/ui';
import { api } from '../../services/api';
import { ConferenceOfficialView } from '../../types';
import { useToast } from '../../components/Toast';

interface ConferenceContext {
  conferenceData: ConferenceOfficialView | null;
  loading: boolean;
  refreshData: () => void;
}

export const ConferenceOfficialHome: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const context = useOutletContext<ConferenceContext>();
  const [localData, setLocalData] = useState<ConferenceOfficialView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (context?.conferenceData) {
      setLocalData(context.conferenceData);
      setLoading(context.loading);
    } else {
      loadData();
    }
  }, [context]);

  const loadData = async () => {
    try {
      const data = await api.getConferenceOfficialView();
      setLocalData(data);
    } catch (error: any) {
      addToast(error.message || 'Failed to load conference data', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!localData) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Active Conference</h3>
        <p className="text-gray-600">There is no active conference at the moment. Please check back later.</p>
      </Card>
    );
  }

  const { conference, unit_delegates, unit_payment, registration_open, available_members } = localData;
  
  const totalDelegates = unit_delegates?.length || 0;
  const confirmedDelegates = unit_delegates?.filter(d => d.status === 'confirmed').length || 0;
  const totalAmount = totalDelegates * (conference?.registration_fee || 0);
  const paidAmount = unit_payment?.status === 'verified' ? unit_payment.amount : 0;
  const pendingAmount = totalAmount - paidAmount;

  const getPaymentStatusBadge = () => {
    if (!unit_payment) return <Badge variant="warning">No Payment</Badge>;
    switch (unit_payment.status) {
      case 'verified': return <Badge variant="success">Verified</Badge>;
      case 'submitted': return <Badge variant="info">Under Review</Badge>;
      case 'rejected': return <Badge variant="danger">Rejected</Badge>;
      default: return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{conference.title}</h1>
        <p className="text-orange-100 mb-4">{conference.description}</p>
        
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center bg-white/20 rounded-full px-3 py-1">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date(conference.start_date).toLocaleDateString()} - {new Date(conference.end_date).toLocaleDateString()}
          </div>
          {conference.venue && (
            <div className="flex items-center bg-white/20 rounded-full px-3 py-1">
              <MapPin className="w-4 h-4 mr-2" />
              {conference.venue}
            </div>
          )}
          <div className="flex items-center bg-white/20 rounded-full px-3 py-1">
            <IndianRupee className="w-4 h-4 mr-2" />
            ₹{conference.registration_fee} per delegate
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Registered Delegates</p>
              <p className="text-3xl font-bold text-gray-800">{totalDelegates}</p>
              <p className="text-xs text-gray-400 mt-1">
                {confirmedDelegates} confirmed
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Available Members</p>
              <p className="text-3xl font-bold text-gray-800">{available_members?.length || 0}</p>
              <p className="text-xs text-gray-400 mt-1">
                Can be added as delegates
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <UserPlus className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Payment Status</p>
              <div className="mt-1 mb-2">{getPaymentStatusBadge()}</div>
              <p className="text-xs text-gray-400">
                ₹{paidAmount} / ₹{totalAmount}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/conference/official/delegates')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Manage Delegates</h3>
                <p className="text-sm text-gray-500">Add or remove delegates from your district</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>

        <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/conference/official/payment')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Submit Payment</h3>
                <p className="text-sm text-gray-500">Upload payment proof for registration</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Recent Delegates */}
      {unit_delegates && unit_delegates.length > 0 && (
        <Card>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Recent Delegates</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/conference/official/delegates')}>
              View All
            </Button>
          </div>
          <div className="divide-y divide-gray-100">
            {unit_delegates.slice(0, 5).map((delegate) => (
              <div key={delegate.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {delegate.member_name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{delegate.member_name}</p>
                    <p className="text-xs text-gray-500">{delegate.member_phone || 'No phone'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {delegate.food_preference && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      delegate.food_preference === 'veg' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {delegate.food_preference === 'veg' ? '🥬 Veg' : '🍖 Non-Veg'}
                    </span>
                  )}
                  <Badge variant={delegate.status === 'confirmed' ? 'success' : 'warning'}>
                    {delegate.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Registration Status Alert */}
      {!registration_open && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Registration Closed</h4>
              <p className="text-sm text-yellow-700 mt-1">
                The registration period for this conference has ended. You can still view your delegates and payment status.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

