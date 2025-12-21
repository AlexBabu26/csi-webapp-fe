import React, { useState } from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Edit2, 
  Save, 
  X, 
  AlertCircle,
  CheckCircle,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useKalamelaRules, useUpdateKalamelaRule } from '../../hooks/queries';
import { getRuleCategoryDisplayName, getRuleInputType } from '../../utils/kalamelaValidation';

interface KalamelaRule {
  id: number;
  rule_key: string;
  rule_category: 'age_restriction' | 'participation_limit' | 'fee';
  rule_value: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  created_on: string;
  updated_on: string;
  updated_by_id: number | null;
}

export const KalamelaRulesManagement: React.FC = () => {
  const { addToast } = useToast();
  const { data: rules, isLoading, refetch } = useKalamelaRules();
  const updateRuleMutation = useUpdateKalamelaRule();
  
  const [editingRule, setEditingRule] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editDisplayName, setEditDisplayName] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');

  // Group rules by category
  const groupedRules = React.useMemo(() => {
    if (!rules) return {};
    return rules.reduce((acc, rule) => {
      const category = rule.rule_category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(rule);
      return acc;
    }, {} as Record<string, KalamelaRule[]>);
  }, [rules]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'age_restriction':
        return <Calendar className="w-5 h-5" />;
      case 'participation_limit':
        return <Users className="w-5 h-5" />;
      case 'fee':
        return <DollarSign className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'age_restriction':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'participation_limit':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'fee':
        return 'bg-green-50 border-green-200 text-green-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const handleStartEdit = (rule: KalamelaRule) => {
    setEditingRule(rule.id);
    setEditValue(rule.rule_value);
    setEditDisplayName(rule.display_name);
    setEditDescription(rule.description || '');
  };

  const handleCancelEdit = () => {
    setEditingRule(null);
    setEditValue('');
    setEditDisplayName('');
    setEditDescription('');
  };

  const handleSaveEdit = async (ruleId: number) => {
    if (!editValue.trim()) {
      addToast('Rule value cannot be empty', 'error');
      return;
    }

    updateRuleMutation.mutate(
      {
        ruleId,
        data: {
          rule_value: editValue,
          display_name: editDisplayName,
          description: editDescription || undefined,
        },
      },
      {
        onSuccess: () => {
          handleCancelEdit();
          refetch();
        },
      }
    );
  };

  const formatRuleValue = (rule: KalamelaRule) => {
    const inputType = getRuleInputType(rule.rule_key);
    if (inputType === 'date') {
      const date = new Date(rule.rule_value);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (rule.rule_key.includes('fee')) {
      return `₹${rule.rule_value}`;
    }
    return rule.rule_value;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">
            Kalamela Rules Management
          </h1>
          <p className="mt-1 text-sm text-textMuted">
            Configure age restrictions, participation limits, and fees for Kalamela events
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-800 text-sm mb-1">Important</h3>
            <p className="text-xs text-amber-700">
              Changes to these rules will affect participant eligibility and fee calculations. 
              Make sure to verify the values before saving.
            </p>
          </div>
        </div>
      </Card>

      {/* Rules by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(groupedRules).map(([category, categoryRules]) => (
          <Card key={category} className="h-fit">
            <div className={`flex items-center gap-2 mb-4 pb-3 border-b border-borderColor`}>
              <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                {getCategoryIcon(category)}
              </div>
              <div>
                <h2 className="font-bold text-textDark">{getRuleCategoryDisplayName(category)}</h2>
                <p className="text-xs text-textMuted">{categoryRules.length} rules</p>
              </div>
            </div>

            <div className="space-y-4">
              {categoryRules.map((rule) => (
                <div 
                  key={rule.id} 
                  className={`p-3 rounded-lg border ${
                    editingRule === rule.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-borderColor bg-bgLight hover:border-gray-300'
                  } transition-all`}
                >
                  {editingRule === rule.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-textMuted mb-1">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={editDisplayName}
                          onChange={(e) => setEditDisplayName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-textMuted mb-1">
                          Value
                        </label>
                        <input
                          type={getRuleInputType(rule.rule_key)}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-textMuted mb-1">
                          Description (optional)
                        </label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveEdit(rule.id)}
                          disabled={updateRuleMutation.isPending}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-textDark text-sm">{rule.display_name}</h4>
                          <p className="text-xs text-textMuted mt-0.5">{rule.rule_key}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(rule)}
                          className="p-1 h-auto"
                        >
                          <Edit2 className="w-4 h-4 text-textMuted hover:text-primary" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold ${
                          category === 'fee' ? 'text-green-600' : 
                          category === 'age_restriction' ? 'text-blue-600' : 
                          'text-purple-600'
                        }`}>
                          {formatRuleValue(rule)}
                        </span>
                        <Badge 
                          variant={rule.is_active ? 'success' : 'light'}
                          className="text-xs"
                        >
                          {rule.is_active ? (
                            <><CheckCircle className="w-3 h-3 mr-1" />Active</>
                          ) : (
                            'Inactive'
                          )}
                        </Badge>
                      </div>

                      {rule.description && (
                        <p className="text-xs text-textMuted mt-2 line-clamp-2">
                          {rule.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      {rules && rules.length > 0 && (
        <Card className="bg-gray-50">
          <h3 className="font-semibold text-textDark mb-3">Rules Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-textMuted">Total Rules</p>
              <p className="text-xl font-bold text-textDark">{rules.length}</p>
            </div>
            <div>
              <p className="text-textMuted">Age Restrictions</p>
              <p className="text-xl font-bold text-blue-600">
                {groupedRules['age_restriction']?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-textMuted">Participation Limits</p>
              <p className="text-xl font-bold text-purple-600">
                {groupedRules['participation_limit']?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-textMuted">Fee Rules</p>
              <p className="text-xl font-bold text-green-600">
                {groupedRules['fee']?.length || 0}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

