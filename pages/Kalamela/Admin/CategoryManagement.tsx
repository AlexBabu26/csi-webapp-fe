import React, { useState } from 'react';
import { Card, Badge, Button } from '../../../components/ui';
import { Plus, Edit2, Trash2, X, Tag, AlertCircle } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import { KalamelaCategory } from '../../../types';
import { Portal } from '../../../components/Portal';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { 
  useKalamelaCategories,
  useCreateKalamelaCategory,
  useUpdateKalamelaCategory,
  useDeleteKalamelaCategory
} from '../../../hooks/queries';

export const CategoryManagement: React.FC = () => {
  const { addToast } = useToast();
  
  // Use TanStack Query
  const { data: categoriesData, isLoading: loading, error } = useKalamelaCategories();
  const categories = categoriesData ?? [];
  
  // Mutations
  const createMutation = useCreateKalamelaCategory();
  const updateMutation = useUpdateKalamelaCategory();
  const deleteMutation = useDeleteKalamelaCategory();
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedCategory, setSelectedCategory] = useState<KalamelaCategory | null>(null);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<KalamelaCategory | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const openModal = (type: 'add' | 'edit', category?: KalamelaCategory) => {
    setModalType(type);
    setSelectedCategory(category || null);
    
    if (type === 'edit' && category) {
      setFormData({
        name: category.name,
        description: category.description || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      addToast('Category name is required', 'error');
      return;
    }
    
    if (modalType === 'add') {
      createMutation.mutate(
        {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        },
        { onSuccess: closeModal }
      );
    } else if (modalType === 'edit' && selectedCategory) {
      updateMutation.mutate(
        { 
          categoryId: selectedCategory.id, 
          data: {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
          }
        },
        { onSuccess: closeModal }
      );
    }
  };

  const handleDeleteClick = (category: KalamelaCategory) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id, {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          setCategoryToDelete(null);
        },
        onError: (error: any) => {
          // Error toast is already shown by the hook
          setShowDeleteConfirm(false);
          setCategoryToDelete(null);
        }
      });
    }
  };

  if (error) {
    return (
      <div className="space-y-6 animate-slide-in">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-lg font-bold text-textDark mb-2">Failed to load categories</h2>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Event Categories</h1>
          <p className="mt-1 text-sm text-textMuted">Manage categories for individual events</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => openModal('add')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
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
            <Button variant="primary" size="sm" onClick={() => openModal('add')}>
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
                <Button variant="warning" size="sm" onClick={() => openModal('edit', category)}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => handleDeleteClick(category)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/35 backdrop-blur z-[100] transition-opacity" onClick={closeModal} aria-hidden="true" />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full pointer-events-auto animate-slide-in" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-borderColor">
                <h3 className="text-xl font-bold text-textDark">
                  {modalType === 'add' ? 'Add New Category' : `Edit ${selectedCategory?.name}`}
                </h3>
                <button onClick={closeModal} className="p-1 rounded hover:bg-bgLight">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      Category Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g., Literary, Music, Dance"
                      maxLength={255}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                      rows={3}
                      placeholder="Enter category description..."
                      maxLength={1000}
                    />
                    <p className="text-xs text-textMuted mt-1">{formData.description.length}/1000 characters</p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={closeModal}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {(createMutation.isPending || updateMutation.isPending) 
                        ? 'Saving...' 
                        : modalType === 'add' ? 'Create Category' : 'Update Category'
                      }
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone. Categories in use by events cannot be deleted.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setCategoryToDelete(null);
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

