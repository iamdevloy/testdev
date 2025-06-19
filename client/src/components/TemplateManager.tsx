import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Settings, Users, Globe } from 'lucide-react';

interface WeddingTemplate {
  id: number;
  templateId: string;
  name: string;
  slug: string;
  createdBy: number;
  isActive: boolean;
  profileImage?: string;
  description?: string;
  customization?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateManagerProps {
  isDarkMode: boolean;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ isDarkMode }) => {
  const [templates, setTemplates] = useState<WeddingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WeddingTemplate | null>(null);

  // Form state for creating/editing templates
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    profileImage: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/templates');
      const data = await response.json();
      if (response.ok) {
        setTemplates(data.templates);
      } else {
        console.error('Error loading templates:', data.error);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadTemplates();
        setShowCreateModal(false);
        setFormData({ name: '', slug: '', description: '', profileImage: '' });
      } else {
        const data = await response.json();
        console.error('Error creating template:', data.error);
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTemplate) return;

    try {
      const response = await fetch(`/api/admin/templates/${editingTemplate.templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadTemplates();
        setEditingTemplate(null);
        setFormData({ name: '', slug: '', description: '', profileImage: '' });
      } else {
        const data = await response.json();
        console.error('Error updating template:', data.error);
      }
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie dieses Template löschen möchten?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadTemplates();
      } else {
        const data = await response.json();
        console.error('Error deleting template:', data.error);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const openEditModal = (template: WeddingTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      slug: template.slug,
      description: template.description || '',
      profileImage: template.profileImage || ''
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[äöü]/g, (char) => {
        const map: { [key: string]: string } = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' };
        return map[char] || char;
      })
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Template Verwaltung</h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Verwalten Sie alle Hochzeits-Templates und deren Einstellungen
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Neues Template
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`p-6 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              } hover:shadow-lg transition-shadow`}
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {template.profileImage && (
                    <img
                      src={template.profileImage}
                      alt={template.name}
                      className="w-12 h-12 rounded-full object-cover mb-3"
                    />
                  )}
                  <h3 className="text-lg font-semibold mb-1">{template.name}</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    /{template.slug}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  template.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {template.isActive ? 'Aktiv' : 'Inaktiv'}
                </div>
              </div>

              {/* Template Description */}
              {template.description && (
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {template.description}
                </p>
              )}

              {/* Template Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Users className="w-4 h-4" />
                  <span>0 Gäste</span>
                </div>
                <div className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Globe className="w-4 h-4" />
                  <span>0 Medien</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`/template/${template.slug}`, '_blank')}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Ansehen
                </button>
                <button
                  onClick={() => openEditModal(template)}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Bearbeiten
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.templateId)}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Löschen
                </button>
              </div>

              {/* Created Date */}
              <div className={`mt-3 pt-3 border-t text-xs ${
                isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'
              }`}>
                Erstellt: {new Date(template.createdAt).toLocaleDateString('de-DE')}
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className={`text-gray-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Noch keine Templates vorhanden</p>
                <p className="text-sm">Erstellen Sie Ihr erstes Hochzeits-Template</p>
              </div>
            </div>
          )}
        </div>

        {/* Create Template Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`max-w-md w-full rounded-lg p-6 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h2 className="text-xl font-bold mb-4">Neues Template erstellen</h2>
              <form onSubmit={handleCreateTemplate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Template Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">URL Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL: /template/{formData.slug}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Beschreibung</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Profilbild URL</label>
                    <input
                      type="url"
                      value={formData.profileImage}
                      onChange={(e) => setFormData(prev => ({ ...prev, profileImage: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className={`flex-1 px-4 py-2 border rounded-md ${
                      isDarkMode
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    Erstellen
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Template Modal */}
        {editingTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`max-w-md w-full rounded-lg p-6 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h2 className="text-xl font-bold mb-4">Template bearbeiten</h2>
              <form onSubmit={handleUpdateTemplate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Template Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">URL Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Beschreibung</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Profilbild URL</label>
                    <input
                      type="url"
                      value={formData.profileImage}
                      onChange={(e) => setFormData(prev => ({ ...prev, profileImage: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className={`flex-1 px-4 py-2 border rounded-md ${
                      isDarkMode
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    Speichern
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};