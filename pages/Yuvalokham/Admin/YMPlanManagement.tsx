import React, { useState } from 'react';
import { Plus, Pencil, X, AlertTriangle } from 'lucide-react';
import { Card, Badge, Button, Input, Skeleton } from '../../../components/ui';
import {
  useYMAdminPlans,
  useYMAdminCreatePlan,
  useYMAdminUpdatePlan,
  useYMAdminTogglePlan,
} from '../../../hooks/queries';
import { useToast } from '../../../components/Toast';
import { YMPlan, YMPlanForm } from '../../../types';

const emptyForm: YMPlanForm = { name: '', duration_months: 12, price: 0, description: '' };

export const YMPlanManagement: React.FC = () => {
  const { addToast } = useToast();
  const { data: plans, isLoading, error } = useYMAdminPlans();
  const createPlan = useYMAdminCreatePlan();
  const updatePlan = useYMAdminUpdatePlan();
  const togglePlan = useYMAdminTogglePlan();

  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<YMPlan | null>(null);
  const [form, setForm] = useState<YMPlanForm>(emptyForm);

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (plan: YMPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      duration_months: plan.duration_months,
      price: Number(plan.price),
      description: plan.description ?? '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPlan(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.price <= 0 || form.duration_months <= 0) {
      addToast('Please fill all required fields correctly', 'warning');
      return;
    }

    if (editingPlan) {
      updatePlan.mutate(
        { id: editingPlan.id, data: form },
        {
          onSuccess: () => { addToast('Plan updated', 'success'); closeForm(); },
          onError: () => addToast('Failed to update plan', 'error'),
        }
      );
    } else {
      createPlan.mutate(form, {
        onSuccess: () => { addToast('Plan created', 'success'); closeForm(); },
        onError: () => addToast('Failed to create plan', 'error'),
      });
    }
  };

  const handleToggle = (plan: YMPlan) => {
    togglePlan.mutate(plan.id, {
      onSuccess: () => addToast(`Plan ${plan.is_active ? 'deactivated' : 'activated'}`, 'success'),
      onError: () => addToast('Failed to toggle plan', 'error'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textDark">Plan Management</h1>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1.5" /> New Plan
        </Button>
      </div>

      {/* Form modal */}
      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-textDark">
              {editingPlan ? 'Edit Plan' : 'Create Plan'}
            </h2>
            <button onClick={closeForm} className="p-1 rounded-md hover:bg-bgLight text-textMuted">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Plan Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Annual Plan"
            />
            <Input
              label="Duration (months)"
              required
              type="number"
              min={1}
              value={form.duration_months}
              onChange={(e) => setForm({ ...form, duration_months: Number(e.target.value) })}
            />
            <Input
              label="Price (₹)"
              required
              type="number"
              min={1}
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
            <Input
              label="Description"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description"
            />
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={closeForm}>Cancel</Button>
              <Button type="submit" isLoading={createPlan.isPending || updatePlan.isPending}>
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Plans list */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-6 w-32 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          Failed to load plans.
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(plans as YMPlan[]).map((plan) => (
            <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-textDark">{plan.name}</h3>
                  <p className="text-xs text-textMuted mt-0.5">
                    {plan.duration_months} month{plan.duration_months !== 1 ? 's' : ''}
                  </p>
                </div>
                <Badge variant={plan.is_active ? 'success' : 'light'}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <p className="text-2xl font-bold text-primary mb-2">
                ₹{Number(plan.price).toLocaleString('en-IN')}
              </p>

              {plan.description && (
                <p className="text-sm text-textMuted mb-4 line-clamp-2">{plan.description}</p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-borderColor">
                <Button variant="outline" size="sm" onClick={() => openEdit(plan)}>
                  <Pencil size={14} className="mr-1" /> Edit
                </Button>
                <button
                  onClick={() => handleToggle(plan)}
                  disabled={togglePlan.isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    plan.is_active ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      plan.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-center text-sm text-textMuted py-8">No plans found. Create one to get started.</p>
        </Card>
      )}
    </div>
  );
};
