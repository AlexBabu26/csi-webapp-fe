import React, { useState } from 'react';
import { Card, Badge, Button } from '../../../components/ui';
import { Plus, Edit2, Trash2, X, Tag, AlertCircle, DollarSign, Database, Settings, Save, Calendar, Users, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import { KalamelaCategory, RegistrationFee } from '../../../types';
import { Portal } from '../../../components/Portal';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { 
  useKalamelaCategories,
  useCreateKalamelaCategory,
  useUpdateKalamelaCategory,
  useDeleteKalamelaCategory,
  useRegistrationFees,
  useCreateRegistrationFee,
  useUpdateRegistrationFee,
  useDeleteRegistrationFee,
  useKalamelaRules,
  useUpdateKalamelaRule
} from '../../../hooks/queries';
import { getRuleCategoryDisplayName, getRuleInputType } from '../../../utils/kalamelaValidation';

type TabType = 'categories' | 'registration-fees' | 'rules';

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

export const MasterData: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  
  // ============ CATEGORIES STATE ============
  const { data: categoriesData, isLoading: loadingCategories, error: categoriesError } = useKalamelaCategories();
  const categories = categoriesData ?? [];
  
  const createCategoryMutation = useCreateKalamelaCategory();
  const updateCategoryMutation = useUpdateKalamelaCategory();
  const deleteCategoryMutation = useDeleteKalamelaCategory();
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalType, setCategoryModalType] = useState<'add' | 'edit'>('add');
  const [selectedCategory, setSelectedCategory] = useState<KalamelaCategory | null>(null);
  const [showCategoryDeleteConfirm, setShowCategoryDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<KalamelaCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '' });

  // ============ REGISTRATION FEES STATE ============
  const { data: feesData, isLoading: loadingFees, error: feesError } = useRegistrationFees();
  const fees = feesData ?? [];
  
  const createFeeMutation = useCreateRegistrationFee();
  const updateFeeMutation = useUpdateRegistrationFee();
  const deleteFeeMutation = useDeleteRegistrationFee();
  
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeModalType, setFeeModalType] = useState<'add' | 'edit'>('add');
  const [selectedFee, setSelectedFee] = useState<RegistrationFee | null>(null);
  const [showFeeDeleteConfirm, setShowFeeDeleteConfirm] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<RegistrationFee | null>(null);
  const [feeFormData, setFeeFormData] = useState({ 
    name: '', 
    event_type: 'individual' as 'individual' | 'group', 
    amount: 0 
  });

  // ============ RULES STATE ============
  const { data: rulesData, isLoading: loadingRules, error: rulesError, refetch: refetchRules } = useKalamelaRules();
  const rules = rulesData ?? [];
  const updateRuleMutation = useUpdateKalamelaRule();
  
  const [editingRule, setEditingRule] = useState<number | null>(null);
  const [editRuleValue, setEditRuleValue] = useState<string>('');
  const [editRuleDisplayName, setEditRuleDisplayName] = useState<string>('');
  const [editRuleDescription, setEditRuleDescription] = useState<string>('');

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

  // ============ CATEGORY HANDLERS ============
  const openCategoryModal = (type: 'add' | 'edit', category?: KalamelaCategory) => {
    setCategoryModalType(type);
    setSelectedCategory(category || null);
    if (type === 'edit' && category) {
      setCategoryFormData({ name: category.name, description: category.description || '' });
    } else {
      setCategoryFormData({ name: '', description: '' });
    }
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setSelectedCategory(null);
    setCategoryFormData({ name: '', description: '' });
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      addToast('Category name is required', 'error');
      return;
    }
    
    if (categoryModalType === 'add') {
      createCategoryMutation.mutate(
        { name: categoryFormData.name.trim(), description: categoryFormData.description.trim() || undefined },
        { onSuccess: closeCategoryModal }
      );
    } else if (selectedCategory) {
      updateCategoryMutation.mutate(
        { categoryId: selectedCategory.id, data: { name: categoryFormData.name.trim(), description: categoryFormData.description.trim() || undefined } },
        { onSuccess: closeCategoryModal }
      );
    }
  };

  const handleCategoryDeleteClick = (category: KalamelaCategory) => {
    setCategoryToDelete(category);
    setShowCategoryDeleteConfirm(true);
  };

  const handleCategoryDeleteConfirm = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete.id, {
        onSuccess: () => { setShowCategoryDeleteConfirm(false); setCategoryToDelete(null); },
        onError: () => { setShowCategoryDeleteConfirm(false); setCategoryToDelete(null); }
      });
    }
  };

  // ============ REGISTRATION FEE HANDLERS ============
  const openFeeModal = (type: 'add' | 'edit', fee?: RegistrationFee) => {
    setFeeModalType(type);
    setSelectedFee(fee || null);
    if (type === 'edit' && fee) {
      setFeeFormData({ name: fee.name, event_type: fee.event_type, amount: fee.amount });
    } else {
      setFeeFormData({ name: '', event_type: 'individual', amount: 0 });
    }
    setShowFeeModal(true);
  };

  const closeFeeModal = () => {
    setShowFeeModal(false);
    setSelectedFee(null);
    setFeeFormData({ name: '', event_type: 'individual', amount: 0 });
  };

  const handleFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeFormData.name.trim()) {
      addToast('Fee name is required', 'error');
      return;
    }
    if (feeFormData.amount < 0) {
      addToast('Amount cannot be negative', 'error');
      return;
    }
    
    if (feeModalType === 'add') {
      createFeeMutation.mutate(
        { name: feeFormData.name.trim(), event_type: feeFormData.event_type, amount: feeFormData.amount },
        { onSuccess: closeFeeModal }
      );
    } else if (selectedFee) {
      updateFeeMutation.mutate(
        { feeId: selectedFee.id, data: { name: feeFormData.name.trim(), event_type: feeFormData.event_type, amount: feeFormData.amount } },
        { onSuccess: closeFeeModal }
      );
    }
  };

  const handleFeeDeleteClick = (fee: RegistrationFee) => {
    setFeeToDelete(fee);
    setShowFeeDeleteConfirm(true);
  };

  const handleFeeDeleteConfirm = () => {
    if (feeToDelete) {
      deleteFeeMutation.mutate(feeToDelete.id, {
        onSuccess: () => { setShowFeeDeleteConfirm(false); setFeeToDelete(null); },
        onError: () => { setShowFeeDeleteConfirm(false); setFeeToDelete(null); }
      });
    }
  };

  // ============ RULE HANDLERS ============
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

  const handleStartRuleEdit = (rule: KalamelaRule) => {
    setEditingRule(rule.id);
    setEditRuleValue(rule.rule_value);
    setEditRuleDisplayName(rule.display_name);
    setEditRuleDescription(rule.description || '');
  };

  const handleCancelRuleEdit = () => {
    setEditingRule(null);
    setEditRuleValue('');
    setEditRuleDisplayName('');
    setEditRuleDescription('');
  };

  const handleSaveRuleEdit = async (ruleId: number) => {
    if (!editRuleValue.trim()) {
      addToast('Rule value cannot be empty', 'error');
      return;
    }

    updateRuleMutation.mutate(
      {
        ruleId,
        data: {
          rule_value: editRuleValue,
          display_name: editRuleDisplayName,
          description: editRuleDescription || undefined,
        },
      },
      {
        onSuccess: () => {
          handleCancelRuleEdit();
          refetchRules();
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

  // ============ RENDER ============
  const hasError = activeTab === 'categories' ? categoriesError : activeTab === 'registration-fees' ? feesError : rulesError;
  
  if (hasError) {
    return (
      <div className="space-y-6 animate-slide-in">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-lg font-bold text-textDark mb-2">Failed to load data</h2>
          <p className="text-textMuted">Please try again later or contact support.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight flex items-center gap-2">
            <Database className="w-7 h-7 text-primary" />
            Master Data
          </h1>
          <p className="mt-1 text-sm text-textMuted">Manage categories, registration fees, and rules for Kalamela events</p>
        </div>
        {activeTab !== 'rules' && (
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => activeTab === 'categories' ? openCategoryModal('add') : openFeeModal('add')}
          >
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'categories' ? 'Add Category' : 'Add Fee'}
          </Button>
        )}
        {activeTab === 'rules' && (
          <Button variant="outline" size="sm" onClick={() => refetchRules()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Card className="p-1 inline-flex gap-1 flex-wrap">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'bg-primary text-white'
              : 'text-textMuted hover:bg-bgLight'
          }`}
        >
          <Tag className="w-4 h-4" />
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('registration-fees')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'registration-fees'
              ? 'bg-primary text-white'
              : 'text-textMuted hover:bg-bgLight'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Registration Fees ({fees.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'bg-primary text-white'
              : 'text-textMuted hover:bg-bgLight'
          }`}
        >
          <Settings className="w-4 h-4" />
          Rules ({rules.length})
        </button>
      </Card>

      {/* Content based on active tab */}
      {activeTab === 'categories' ? (
        // ============ CATEGORIES TAB ============
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingCategories ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </Card>
            ))
          ) : categories.length === 0 ? (
            <Card className="col-span-full text-center py-12">
              <Tag className="w-12 h-12 text-textMuted mx-auto mb-4" />
              <p className="text-textMuted mb-4">No categories found</p>
              <Button variant="primary" size="sm" onClick={() => openCategoryModal('add')}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Category
              </Button>
            </Card>
          ) : (
            categories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-textDark">{category.name}</h3>
                  </div>
                  <Badge variant="light">ID: {category.id}</Badge>
                </div>
                <p className="text-sm text-textMuted mb-4 line-clamp-2">
                  {category.description || 'No description'}
                </p>
                <div className="text-xs text-textMuted mb-4">
                  Created: {new Date(category.created_on).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button variant="warning" size="sm" onClick={() => openCategoryModal('edit', category)}>
                    <Edit2 className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleCategoryDeleteClick(category)}
                    disabled={deleteCategoryMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : activeTab === 'fees' ? (
        // ============ REGISTRATION FEES TAB ============
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingFees ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </Card>
            ))
          ) : fees.length === 0 ? (
            <Card className="col-span-full text-center py-12">
              <DollarSign className="w-12 h-12 text-textMuted mx-auto mb-4" />
              <p className="text-textMuted mb-4">No registration fees found</p>
              <Button variant="primary" size="sm" onClick={() => openFeeModal('add')}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Fee
              </Button>
            </Card>
          ) : (
            fees.map((fee) => (
              <Card key={fee.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-success" />
                    <h3 className="font-bold text-textDark">{fee.name}</h3>
                  </div>
                  <Badge variant={fee.event_type === 'individual' ? 'primary' : 'warning'}>
                    {fee.event_type}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-primary mb-3">
                  ₹{fee.amount.toLocaleString()}
                </div>
                <div className="text-xs text-textMuted mb-4">
                  Created: {new Date(fee.created_on).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button variant="warning" size="sm" onClick={() => openFeeModal('edit', fee)}>
                    <Edit2 className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleFeeDeleteClick(fee)}
                    disabled={deleteFeeMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : activeTab === 'rules' ? (
        // ============ RULES TAB ============
        <div className="space-y-6">
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

          {loadingRules ? (
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
          ) : rules.length === 0 ? (
            <Card className="text-center py-12">
              <Settings className="w-12 h-12 text-textMuted mx-auto mb-4" />
              <p className="text-textMuted">No rules configured yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Object.entries(groupedRules).map(([category, categoryRules]) => (
                <Card key={category} className="h-fit">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-borderColor">
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
                                value={editRuleDisplayName}
                                onChange={(e) => setEditRuleDisplayName(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-textMuted mb-1">
                                Value
                              </label>
                              <input
                                type={getRuleInputType(rule.rule_key)}
                                value={editRuleValue}
                                onChange={(e) => setEditRuleValue(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-textMuted mb-1">
                                Description (optional)
                              </label>
                              <textarea
                                value={editRuleDescription}
                                onChange={(e) => setEditRuleDescription(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleSaveRuleEdit(rule.id)}
                                disabled={updateRuleMutation.isPending}
                              >
                                <Save className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelRuleEdit}
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
                                onClick={() => handleStartRuleEdit(rule)}
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
          )}

          {/* Rules Summary */}
          {rules.length > 0 && (
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
      ) : null}

      {/* Category Modal */}
      {showCategoryModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/35 backdrop-blur z-[100] transition-opacity" onClick={closeCategoryModal} aria-hidden="true" />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full pointer-events-auto animate-slide-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-borderColor">
                <h3 className="text-xl font-bold text-textDark">
                  {categoryModalType === 'add' ? 'Add New Category' : `Edit ${selectedCategory?.name}`}
                </h3>
                <button onClick={closeCategoryModal} className="p-1 rounded hover:bg-bgLight">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      Category Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g., Literary, Music, Dance"
                      maxLength={255}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">Description</label>
                    <textarea
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                      rows={3}
                      placeholder="Enter category description..."
                      maxLength={1000}
                    />
                    <p className="text-xs text-textMuted mt-1">{categoryFormData.description.length}/1000 characters</p>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={closeCategoryModal}>Cancel</Button>
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    >
                      {(createCategoryMutation.isPending || updateCategoryMutation.isPending) 
                        ? 'Saving...' 
                        : categoryModalType === 'add' ? 'Create Category' : 'Update Category'
                      }
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Registration Fee Modal */}
      {showFeeModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/35 backdrop-blur z-[100] transition-opacity" onClick={closeFeeModal} aria-hidden="true" />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full pointer-events-auto animate-slide-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-borderColor">
                <h3 className="text-xl font-bold text-textDark">
                  {feeModalType === 'add' ? 'Add New Registration Fee' : `Edit ${selectedFee?.name}`}
                </h3>
                <button onClick={closeFeeModal} className="p-1 rounded hover:bg-bgLight">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleFeeSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      Fee Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={feeFormData.name}
                      onChange={(e) => setFeeFormData({ ...feeFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g., Individual Event Fee, Group Event Fee"
                      maxLength={255}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      Event Type <span className="text-danger">*</span>
                    </label>
                    <select
                      value={feeFormData.event_type}
                      onChange={(e) => setFeeFormData({ ...feeFormData, event_type: e.target.value as 'individual' | 'group' })}
                      className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                      required
                    >
                      <option value="individual">Individual</option>
                      <option value="group">Group</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      Amount (₹) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      value={feeFormData.amount}
                      onChange={(e) => setFeeFormData({ ...feeFormData, amount: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter amount"
                      min={0}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={closeFeeModal}>Cancel</Button>
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={createFeeMutation.isPending || updateFeeMutation.isPending}
                    >
                      {(createFeeMutation.isPending || updateFeeMutation.isPending) 
                        ? 'Saving...' 
                        : feeModalType === 'add' ? 'Create Fee' : 'Update Fee'
                      }
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Category Delete Confirmation */}
      <ConfirmDialog
        isOpen={showCategoryDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone. Categories in use by events cannot be deleted.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleCategoryDeleteConfirm}
        onCancel={() => { setShowCategoryDeleteConfirm(false); setCategoryToDelete(null); }}
        isLoading={deleteCategoryMutation.isPending}
      />

      {/* Fee Delete Confirmation */}
      <ConfirmDialog
        isOpen={showFeeDeleteConfirm}
        title="Delete Registration Fee"
        message={`Are you sure you want to delete "${feeToDelete?.name}"? This action cannot be undone. Fees in use by events cannot be deleted.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleFeeDeleteConfirm}
        onCancel={() => { setShowFeeDeleteConfirm(false); setFeeToDelete(null); }}
        isLoading={deleteFeeMutation.isPending}
      />
    </div>
  );
};

