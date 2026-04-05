import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Card, Button, Input } from '../../../components/ui';
import { useYMAdminCreateAdmin } from '../../../hooks/queries';
import { useToast } from '../../../components/Toast';
import { YMAdminCreateForm } from '../../../types';

const emptyForm: YMAdminCreateForm = { name: '', email: '', phone: '', password: '' };

export const YMAdminCreate: React.FC = () => {
  const { addToast } = useToast();
  const createAdmin = useYMAdminCreateAdmin();
  const [form, setForm] = useState<YMAdminCreateForm>(emptyForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim()) {
      addToast('All fields are required', 'warning');
      return;
    }

    if (form.password.length < 6) {
      addToast('Password must be at least 6 characters', 'warning');
      return;
    }

    createAdmin.mutate(form, {
      onSuccess: () => {
        addToast('Admin account created successfully', 'success');
        setForm(emptyForm);
      },
      onError: () => addToast('Failed to create admin account', 'error'),
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textDark">Create Admin Account</h1>

      <div className="max-w-lg">
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserPlus size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-textDark">New Administrator</h2>
              <p className="text-xs text-textMuted">Fill in the details below to create a new admin user</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-0">
            <Input
              label="Full Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter full name"
            />
            <Input
              label="Email"
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@example.com"
            />
            <Input
              label="Phone"
              required
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Enter phone number"
            />
            <Input
              label="Password"
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 6 characters"
              helperText="Password must be at least 6 characters long"
            />
            <div className="pt-2">
              <Button type="submit" isLoading={createAdmin.isPending} className="w-full">
                Create Admin Account
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
