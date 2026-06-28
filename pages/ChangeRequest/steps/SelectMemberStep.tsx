import React, { useMemo, useState } from 'react';
import { Card, Button, Skeleton } from '../../../components/ui';
import { Search, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import { UnitMember } from '../../../types';
import { ChangeRequestTypeOption } from '../utils';

interface SelectMemberStepProps {
  members: UnitMember[];
  isLoading: boolean;
  selectedMemberId: number | null;
  requestType: ChangeRequestTypeOption;
  onSelectMember: (memberId: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export const SelectMemberStep: React.FC<SelectMemberStepProps> = ({
  members,
  isLoading,
  selectedMemberId,
  requestType,
  onSelectMember,
  onPrevious,
  onNext,
}) => {
  const [search, setSearch] = useState('');

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.number.includes(query),
    );
  }, [members, search]);

  const selectedMember = members.find((m) => m.id === selectedMemberId) ?? null;

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-primary/5 border-primary/20">
        <p className="text-sm text-textMuted">Request type</p>
        <p className="text-lg font-bold text-textDark mt-0.5">{requestType.title}</p>
        <p className="text-sm text-textMuted mt-1">{requestType.description}</p>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-primary shrink-0" />
          <h3 className="text-lg font-bold text-textDark">Select Active Member</h3>
        </div>
        <p className="text-sm text-textMuted mb-4">
          Choose the active member from your unit that this {requestType.title.toLowerCase()}{' '}
          request applies to.
        </p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {filteredMembers.length === 0 ? (
          <p className="text-sm text-textMuted py-6 text-center">
            {members.length === 0
              ? 'No eligible members found for this request type.'
              : 'No members match your search.'}
          </p>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredMembers.map((member) => {
              const isSelected = member.id === selectedMemberId;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => onSelectMember(member.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-borderColor hover:border-primary/40 hover:bg-bgLight'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-textDark truncate">{member.name}</p>
                      <p className="text-sm text-textMuted mt-0.5">
                        +91 {member.number}
                        {member.qualification ? ` • ${member.qualification}` : ''}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary' : 'border-borderColor'
                      }`}
                    >
                      {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {selectedMember && (
        <Card className="bg-primary/5 border-primary/20">
          <h4 className="text-sm font-semibold text-textDark mb-2">Selected Member</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-textMuted">Name:</span>{' '}
              <span className="font-medium">{selectedMember.name}</span>
            </div>
            <div>
              <span className="text-textMuted">Phone:</span>{' '}
              <span className="font-medium">+91 {selectedMember.number}</span>
            </div>
            <div>
              <span className="text-textMuted">Gender:</span>{' '}
              <span className="font-medium">
                {selectedMember.gender === 'M' || selectedMember.gender === 'Male' ? 'Male' : 'Female'}
              </span>
            </div>
            <div>
              <span className="text-textMuted">Age:</span>{' '}
              <span className="font-medium">{selectedMember.age} years</span>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button type="button" onClick={onNext} disabled={!selectedMemberId}>
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
