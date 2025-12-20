import React, { useEffect, useState } from 'react';
import { Card, Button, Badge, IconButton } from '../../components/ui';
import { Settings, Save, Upload, Plus, Trash2, Edit2, GripVertical, ExternalLink, Globe, Phone, Mail, MapPin, Facebook, Instagram, Youtube, Image, Bell, Link2, Info, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { getMediaUrl } from '../../services/http';
import { SiteSettings as SiteSettingsType, SiteSettingsUpdate, Notice, NoticeCreate, QuickLink, QuickLinkCreate } from '../../types';
import { 
  useSiteSettingsData, 
  useUpdateSiteSettings, 
  useUploadLogo, 
  useCreateNotice, 
  useUpdateNotice, 
  useDeleteNotice, 
  useCreateQuickLink, 
  useUpdateQuickLink, 
  useDeleteQuickLink 
} from '../../hooks/queries';

type TabType = 'general' | 'logos' | 'contact' | 'notices' | 'quicklinks';

export const SiteSettings: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  
  // Use TanStack Query
  const { settings, notices, quickLinks, isLoading: loading, refetch } = useSiteSettingsData();
  const updateSettingsMutation = useUpdateSiteSettings();
  const uploadLogoMutation = useUploadLogo();
  const createNoticeMutation = useCreateNotice();
  const updateNoticeMutation = useUpdateNotice();
  const deleteNoticeMutation = useDeleteNotice();
  const createLinkMutation = useCreateQuickLink();
  const updateLinkMutation = useUpdateQuickLink();
  const deleteLinkMutation = useDeleteQuickLink();
  
  // Form states
  const [formData, setFormData] = useState<SiteSettingsUpdate>({});
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [newNotice, setNewNotice] = useState<NoticeCreate>({ text: '', priority: 'normal', is_active: true });
  const [newLink, setNewLink] = useState<QuickLinkCreate>({ label: '', url: '', enabled: true });
  const [showNewNoticeForm, setShowNewNoticeForm] = useState(false);
  const [showNewLinkForm, setShowNewLinkForm] = useState(false);

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        app_name: settings.app_name,
        app_subtitle: settings.app_subtitle || '',
        about_text: settings.about_text || '',
        registration_enabled: settings.registration_enabled,
        registration_closed_message: settings.registration_closed_message || '',
        contact: settings.contact,
        social_links: settings.social_links,
      });
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    updateSettingsMutation.mutate(formData);
  };

  const handleLogoUpload = async (type: 'primary' | 'secondary' | 'tertiary', file: File) => {
    uploadLogoMutation.mutate({ type, file });
  };

  const handleCreateNotice = async () => {
    if (!newNotice.text.trim()) return;
    createNoticeMutation.mutate(newNotice, {
      onSuccess: () => {
        setNewNotice({ text: '', priority: 'normal', is_active: true });
        setShowNewNoticeForm(false);
      },
    });
  };

  const handleUpdateNotice = async (notice: Notice) => {
    updateNoticeMutation.mutate(
      { noticeId: notice.id, data: { text: notice.text, priority: notice.priority, is_active: notice.is_active } },
      { onSuccess: () => setEditingNotice(null) }
    );
  };

  const handleDeleteNotice = async (id: number) => {
    deleteNoticeMutation.mutate(id);
  };

  const handleCreateLink = async () => {
    if (!newLink.label.trim() || !newLink.url.trim()) return;
    createLinkMutation.mutate(newLink, {
      onSuccess: () => {
        setNewLink({ label: '', url: '', enabled: true });
        setShowNewLinkForm(false);
      },
    });
  };

  const handleUpdateLink = async (link: QuickLink) => {
    updateLinkMutation.mutate(
      { linkId: link.id, data: { label: link.label, url: link.url, enabled: link.enabled } },
      { onSuccess: () => setEditingLink(null) }
    );
  };

  const handleDeleteLink = async (id: number) => {
    deleteLinkMutation.mutate(id);
  };

  const saving = updateSettingsMutation.isPending;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Settings size={16} /> },
    { id: 'logos', label: 'Logos', icon: <Image size={16} /> },
    { id: 'contact', label: 'Contact & Social', icon: <Globe size={16} /> },
    { id: 'notices', label: 'Notices', icon: <Bell size={16} /> },
    { id: 'quicklinks', label: 'Quick Links', icon: <Link2 size={16} /> },
  ];

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-textMuted">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Site Settings</h1>
          <p className="mt-1 text-sm text-textMuted">Manage homepage content, logos, and notices</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-borderColor">
        <nav className="flex gap-1 overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-textMuted hover:text-textDark hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <Card>
          <h3 className="text-lg font-bold text-textDark mb-6 flex items-center gap-2">
            <Info size={20} className="text-primary" />
            General Settings
          </h3>
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-textDark mb-1">App Name</label>
              <input
                type="text"
                value={formData.app_name || ''}
                onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                className="w-full px-3 py-2 border border-borderColor rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-1">Subtitle</label>
              <input
                type="text"
                value={formData.app_subtitle || ''}
                onChange={(e) => setFormData({ ...formData, app_subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-borderColor rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-1">About Text</label>
              <textarea
                value={formData.about_text || ''}
                onChange={(e) => setFormData({ ...formData, about_text: e.target.value })}
                rows={5}
                className="w-full px-3 py-2 border border-borderColor rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-textDark">Unit Registration</p>
                <p className="text-sm text-textMuted">Enable or disable unit registration</p>
              </div>
              <button
                onClick={() => setFormData({ ...formData, registration_enabled: !formData.registration_enabled })}
                className={`p-2 rounded-lg transition-colors ${formData.registration_enabled ? 'text-success' : 'text-textMuted'}`}
              >
                {formData.registration_enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>
            {!formData.registration_enabled && (
              <div>
                <label className="block text-sm font-medium text-textDark mb-1">Closed Message</label>
                <input
                  type="text"
                  value={formData.registration_closed_message || ''}
                  onChange={(e) => setFormData({ ...formData, registration_closed_message: e.target.value })}
                  placeholder="Unit Registration (Closed)"
                  className="w-full px-3 py-2 border border-borderColor rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )}
            <Button variant="primary" onClick={handleSaveSettings} isLoading={saving}>
              <Save size={16} className="mr-2" />
              Save Changes
            </Button>
          </div>
        </Card>
      )}

      {/* Logos Tab */}
      {activeTab === 'logos' && (
        <Card>
          <h3 className="text-lg font-bold text-textDark mb-6 flex items-center gap-2">
            <Image size={20} className="text-primary" />
            Logo Management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['primary', 'secondary', 'tertiary'] as const).map((type) => (
              <div key={type} className="border border-borderColor rounded-lg p-4">
                <p className="font-medium text-textDark capitalize mb-3">{type} Logo</p>
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                  {settings?.[`logo_${type}_url` as keyof SiteSettingsType] ? (
                    <img
                      src={getMediaUrl(settings[`logo_${type}_url` as keyof SiteSettingsType] as string)}
                      alt={`${type} logo`}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <Image size={48} className="text-gray-300" />
                  )}
                </div>
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleLogoUpload(type, e.target.files[0])}
                    className="hidden"
                  />
                  <span className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-md cursor-pointer hover:bg-primary-hover transition-colors text-sm">
                    <Upload size={16} />
                    Upload
                  </span>
                </label>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Contact & Social Tab */}
      {activeTab === 'contact' && (
        <Card>
          <h3 className="text-lg font-bold text-textDark mb-6 flex items-center gap-2">
            <Globe size={20} className="text-primary" />
            Contact & Social Links
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
            <div className="space-y-4">
              <h4 className="font-semibold text-textDark flex items-center gap-2">
                <Phone size={16} />
                Contact Information
              </h4>
              <div>
                <label className="block text-sm font-medium text-textDark mb-1">Address</label>
                <textarea
                  value={formData.contact?.address || ''}
                  onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, address: e.target.value } })}
                  rows={2}
                  className="w-full px-3 py-2 border border-borderColor rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-1">Email</label>
                <input
                  type="email"
                  value={formData.contact?.email || ''}
                  onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })}
                  className="w-full px-3 py-2 border border-borderColor rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.contact?.phone || ''}
                  onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, phone: e.target.value } })}
                  className="w-full px-3 py-2 border border-borderColor rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-textDark flex items-center gap-2">
                <Globe size={16} />
                Social Media Links
              </h4>
              <div>
                <label className="block text-sm font-medium text-textDark mb-1 flex items-center gap-2">
                  <Facebook size={14} /> Facebook
                </label>
                <input
                  type="url"
                  value={formData.social_links?.facebook || ''}
                  onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, facebook: e.target.value } })}
                  placeholder="https://facebook.com/..."
                  className="w-full px-3 py-2 border border-borderColor rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-1 flex items-center gap-2">
                  <Instagram size={14} /> Instagram
                </label>
                <input
                  type="url"
                  value={formData.social_links?.instagram || ''}
                  onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, instagram: e.target.value } })}
                  placeholder="https://instagram.com/..."
                  className="w-full px-3 py-2 border border-borderColor rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-1 flex items-center gap-2">
                  <Youtube size={14} /> YouTube
                </label>
                <input
                  type="url"
                  value={formData.social_links?.youtube || ''}
                  onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, youtube: e.target.value } })}
                  placeholder="https://youtube.com/..."
                  className="w-full px-3 py-2 border border-borderColor rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Button variant="primary" onClick={handleSaveSettings} isLoading={saving}>
              <Save size={16} className="mr-2" />
              Save Changes
            </Button>
          </div>
        </Card>
      )}

      {/* Notices Tab */}
      {activeTab === 'notices' && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-textDark flex items-center gap-2">
              <Bell size={20} className="text-primary" />
              Marquee Notices
            </h3>
            <Button variant="primary" size="sm" onClick={() => setShowNewNoticeForm(true)}>
              <Plus size={16} className="mr-1" />
              Add Notice
            </Button>
          </div>

          {showNewNoticeForm && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-textDark mb-3">New Notice</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newNotice.text}
                  onChange={(e) => setNewNotice({ ...newNotice, text: e.target.value })}
                  placeholder="Notice text..."
                  className="w-full px-3 py-2 border border-borderColor rounded-md"
                />
                <div className="flex gap-3">
                  <select
                    value={newNotice.priority}
                    onChange={(e) => setNewNotice({ ...newNotice, priority: e.target.value as 'high' | 'normal' | 'low' })}
                    className="px-3 py-2 border border-borderColor rounded-md"
                  >
                    <option value="high">High Priority</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low Priority</option>
                  </select>
                  <Button variant="primary" size="sm" onClick={handleCreateNotice}>Create</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowNewNoticeForm(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {notices.length === 0 ? (
              <p className="text-textMuted text-center py-8">No notices yet. Add one above.</p>
            ) : (
              notices.map((notice) => (
                <div key={notice.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <GripVertical size={16} className="text-gray-400 cursor-grab" />
                  {editingNotice?.id === notice.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editingNotice.text}
                        onChange={(e) => setEditingNotice({ ...editingNotice, text: e.target.value })}
                        className="flex-1 px-3 py-1 border border-borderColor rounded-md"
                      />
                      <select
                        value={editingNotice.priority}
                        onChange={(e) => setEditingNotice({ ...editingNotice, priority: e.target.value as 'high' | 'normal' | 'low' })}
                        className="px-2 py-1 border border-borderColor rounded-md text-sm"
                      >
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
                      </select>
                      <Button variant="primary" size="sm" onClick={() => handleUpdateNotice(editingNotice)}>Save</Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingNotice(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="text-textDark">{notice.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={notice.priority === 'high' ? 'danger' : notice.priority === 'low' ? 'light' : 'warning'}>
                            {notice.priority}
                          </Badge>
                          <Badge variant={notice.is_active ? 'success' : 'light'}>
                            {notice.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <IconButton icon={<Edit2 size={16} />} tooltip="Edit" variant="info" onClick={() => setEditingNotice(notice)} />
                      <IconButton icon={<Trash2 size={16} />} tooltip="Delete" variant="danger" onClick={() => handleDeleteNotice(notice.id)} />
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Quick Links Tab */}
      {activeTab === 'quicklinks' && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-textDark flex items-center gap-2">
              <Link2 size={20} className="text-primary" />
              Quick Links
            </h3>
            <Button variant="primary" size="sm" onClick={() => setShowNewLinkForm(true)}>
              <Plus size={16} className="mr-1" />
              Add Link
            </Button>
          </div>

          {showNewLinkForm && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-textDark mb-3">New Quick Link</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newLink.label}
                    onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                    placeholder="Label"
                    className="px-3 py-2 border border-borderColor rounded-md"
                  />
                  <input
                    type="text"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    placeholder="URL (e.g., /kalamela)"
                    className="px-3 py-2 border border-borderColor rounded-md"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="primary" size="sm" onClick={handleCreateLink}>Create</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowNewLinkForm(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {quickLinks.length === 0 ? (
              <p className="text-textMuted text-center py-8">No quick links yet. Add one above.</p>
            ) : (
              quickLinks.map((link) => (
                <div key={link.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <GripVertical size={16} className="text-gray-400 cursor-grab" />
                  {editingLink?.id === link.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editingLink.label}
                        onChange={(e) => setEditingLink({ ...editingLink, label: e.target.value })}
                        className="flex-1 px-3 py-1 border border-borderColor rounded-md"
                        placeholder="Label"
                      />
                      <input
                        type="text"
                        value={editingLink.url}
                        onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                        className="flex-1 px-3 py-1 border border-borderColor rounded-md"
                        placeholder="URL"
                      />
                      <Button variant="primary" size="sm" onClick={() => handleUpdateLink(editingLink)}>Save</Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingLink(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="font-medium text-textDark">{link.label}</p>
                        <p className="text-sm text-textMuted flex items-center gap-1">
                          <ExternalLink size={12} />
                          {link.url}
                        </p>
                      </div>
                      <Badge variant={link.enabled ? 'success' : 'light'}>
                        {link.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <IconButton icon={<Edit2 size={16} />} tooltip="Edit" variant="info" onClick={() => setEditingLink(link)} />
                      <IconButton icon={<Trash2 size={16} />} tooltip="Delete" variant="danger" onClick={() => handleDeleteLink(link.id)} />
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

