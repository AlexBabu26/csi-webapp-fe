import React, { useState } from 'react';
import { Card, Badge, Button } from '../../../components/ui';
import { Plus, Edit2, Trash2, X, Tag, AlertCircle, DollarSign, Database } from 'lucide-react';
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
  useDeleteRegistrationFee
} from '../../../hooks/queries';

type TabType = 'categories' | 'registration-fees';

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

  // ============ RENDER ============
  const hasError = activeTab === 'categories' ? categoriesError : feesError;
  
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
          <p className="mt-1 text-sm text-textMuted">Manage categories and registration fees for Kalamela events</p>
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => activeTab === 'categories' ? openCategoryModal('add') : openFeeModal('add')}
        >
          <Plus className="w-4 h-4 mr-2" />
          {activeTab === 'categories' ? 'Add Category' : 'Add Fee'}
        </Button>
      </div>

      {/* Tabs */}
      <Card className="p-1 inline-flex gap-1">
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
      ) : (
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
      )}

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

