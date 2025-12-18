import React, { useEffect, useState } from 'react';
import { Card, Badge } from '../../components/ui';
import { RequestStatusBadge } from '../../components/RequestStatusBadge';
import { FileText, ArrowRightLeft, Users, Shield, UserCheck, UserPlus } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';

interface MyRequestsData {
  transfers: any[];
  memberInfoChanges: any[];
  officialsChanges: any[];
  councilorChanges: any[];
  memberAdds: any[];
}

export const ViewMyRequests: React.FC = () => {
  const { addToast } = useToast();
  const [requests, setRequests] = useState<MyRequestsData>({
    transfers: [],
    memberInfoChanges: [],
    officialsChanges: [],
    councilorChanges: [],
    memberAdds: [],
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Mock unit ID - in real app, get from auth context
  const unitId = 1;

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.getMyRequests(unitId);
      setRequests(response.data);
    } catch (err) {
      console.error("Failed to load requests", err);
      addToast("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const filterByStatus = (items: any[]) => {
    if (filterStatus === 'ALL') return items;
    return items.filter(item => item.status === filterStatus);
  };

  const getTotalCount = () => {
    return (
      requests.transfers.length +
      requests.memberInfoChanges.length +
      requests.officialsChanges.length +
      requests.councilorChanges.length +
      requests.memberAdds.length
    );
  };

  const getPendingCount = () => {
    return (
      requests.transfers.filter(r => r.status === 'PENDING').length +
      requests.memberInfoChanges.filter(r => r.status === 'PENDING').length +
      requests.officialsChanges.filter(r => r.status === 'PENDING').length +
      requests.councilorChanges.filter(r => r.status === 'PENDING').length +
      requests.memberAdds.filter(r => r.status === 'PENDING').length
    );
  };

  const getApprovedCount = () => {
    return (
      requests.transfers.filter(r => r.status === 'APPROVED').length +
      requests.memberInfoChanges.filter(r => r.status === 'APPROVED').length +
      requests.officialsChanges.filter(r => r.status === 'APPROVED').length +
      requests.councilorChanges.filter(r => r.status === 'APPROVED').length +
      requests.memberAdds.filter(r => r.status === 'APPROVED').length
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <Card className="h-48 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">My Requests</h1>
        <p className="mt-1 text-sm text-textMuted">View and track all your submitted requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <dt className="text-sm font-medium text-textMuted">Total Requests</dt>
          <dd className="mt-2 text-3xl font-bold text-textDark">{getTotalCount()}</dd>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <dt className="text-sm font-medium text-textMuted">Pending</dt>
          <dd className="mt-2 text-3xl font-bold text-warning">{getPendingCount()}</dd>
        </Card>
        <Card className="border-l-4 border-l-success">
          <dt className="text-sm font-medium text-textMuted">Approved</dt>
          <dd className="mt-2 text-3xl font-bold text-success">{getApprovedCount()}</dd>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-textMuted">Filter by status:</span>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-primary text-white'
                  : 'bg-bgLight text-textMuted hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </Card>

      {/* Transfer Requests */}
      {filterByStatus(requests.transfers).length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-textDark">Transfer Requests</h3>
            <Badge variant="light">{filterByStatus(requests.transfers).length}</Badge>
          </div>
          <div className="space-y-3">
            {filterByStatus(requests.transfers).map((request) => (
              <div key={request.id} className="p-4 border border-borderColor rounded-lg hover:bg-bgLight transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-textDark">{request.memberName}</p>
                    <p className="text-sm text-textMuted mt-1">
                      {request.currentUnitName} → {request.destinationUnitName}
                    </p>
                    <p className="text-xs text-textMuted mt-1">
                      Submitted: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <RequestStatusBadge status={request.status} timestamp={request.createdAt} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Member Info Change Requests */}
      {filterByStatus(requests.memberInfoChanges).length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-textDark">Member Info Changes</h3>
            <Badge variant="light">{filterByStatus(requests.memberInfoChanges).length}</Badge>
          </div>
          <div className="space-y-3">
            {filterByStatus(requests.memberInfoChanges).map((request) => (
              <div key={request.id} className="p-4 border border-borderColor rounded-lg hover:bg-bgLight transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-textDark">{request.memberName}</p>
                    <p className="text-sm text-textMuted mt-1">{request.reason}</p>
                    <p className="text-xs text-textMuted mt-1">
                      Submitted: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <RequestStatusBadge status={request.status} timestamp={request.createdAt} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Officials Change Requests */}
      {filterByStatus(requests.officialsChanges).length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-textDark">Officials Changes</h3>
            <Badge variant="light">{filterByStatus(requests.officialsChanges).length}</Badge>
          </div>
          <div className="space-y-3">
            {filterByStatus(requests.officialsChanges).map((request) => (
              <div key={request.id} className="p-4 border border-borderColor rounded-lg hover:bg-bgLight transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-textDark">{request.unitName}</p>
                    <p className="text-sm text-textMuted mt-1">{request.reason}</p>
                    <p className="text-xs text-textMuted mt-1">
                      Submitted: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <RequestStatusBadge status={request.status} timestamp={request.createdAt} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Councilor Change Requests */}
      {filterByStatus(requests.councilorChanges).length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-textDark">Councilor Changes</h3>
            <Badge variant="light">{filterByStatus(requests.councilorChanges).length}</Badge>
          </div>
          <div className="space-y-3">
            {filterByStatus(requests.councilorChanges).map((request) => (
              <div key={request.id} className="p-4 border border-borderColor rounded-lg hover:bg-bgLight transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-textDark">{request.unitName}</p>
                    <p className="text-sm text-textMuted mt-1">
                      {request.originalMemberName} → {request.newMemberName || 'Not selected'}
                    </p>
                    <p className="text-xs text-textMuted mt-1">
                      Submitted: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <RequestStatusBadge status={request.status} timestamp={request.createdAt} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Member Add Requests */}
      {filterByStatus(requests.memberAdds).length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-textDark">Member Add Requests</h3>
            <Badge variant="light">{filterByStatus(requests.memberAdds).length}</Badge>
          </div>
          <div className="space-y-3">
            {filterByStatus(requests.memberAdds).map((request) => (
              <div key={request.id} className="p-4 border border-borderColor rounded-lg hover:bg-bgLight transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-textDark">{request.name}</p>
                    <p className="text-sm text-textMuted mt-1">{request.unitName}</p>
                    <p className="text-xs text-textMuted mt-1">
                      Submitted: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <RequestStatusBadge status={request.status} timestamp={request.createdAt} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {getTotalCount() === 0 && (
        <Card className="text-center py-12">
          <FileText className="w-16 h-16 text-textMuted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-textDark mb-2">No Requests Found</h3>
          <p className="text-textMuted">You haven't submitted any requests yet.</p>
        </Card>
      )}
    </div>
  );
};


