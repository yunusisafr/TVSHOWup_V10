import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AdUnit, AdUnitInput, adminAdService } from '../../lib/adminAdService';

interface AdUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  adUnit?: AdUnit | null;
  userId: string;
}

const AdUnitModal: React.FC<AdUnitModalProps> = ({ isOpen, onClose, onSave, adUnit, userId }) => {
  const [formData, setFormData] = useState<AdUnitInput>({
    name: '',
    position: 'home_top',
    ad_code: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (adUnit) {
      setFormData({
        name: adUnit.name,
        position: adUnit.position,
        ad_code: adUnit.ad_code,
        is_active: adUnit.is_active,
      });
    } else {
      setFormData({
        name: '',
        position: 'home_top',
        ad_code: '',
        is_active: true,
      });
    }
    setErrors({});
  }, [adUnit, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ad unit name is required';
    }

    if (!formData.position) {
      newErrors.position = 'Position must be selected';
    }

    if (!formData.ad_code.trim()) {
      newErrors.ad_code = 'Ad code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      if (adUnit) {
        await adminAdService.updateAdUnit(adUnit.id, formData, userId);
      } else {
        await adminAdService.createAdUnit(formData, userId);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving ad unit:', error);
      setErrors({ submit: 'An error occurred while saving the ad unit' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const availablePositions = adminAdService.getAvailablePositions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            {adUnit ? 'Edit Ad Unit' : 'New Ad Unit'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ad Unit Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g., Homepage Top Banner"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Position *
            </label>
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {availablePositions.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
            {errors.position && (
              <p className="mt-1 text-sm text-red-400">{errors.position}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ad Code (HTML) *
            </label>
            <textarea
              value={formData.ad_code}
              onChange={(e) => setFormData({ ...formData, ad_code: e.target.value })}
              rows={10}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
              placeholder="Paste your Google AdSense or other ad code here"
            />
            {errors.ad_code && (
              <p className="mt-1 text-sm text-red-400">{errors.ad_code}</p>
            )}
            <p className="mt-2 text-xs text-gray-400">
              You can paste your Google AdSense code or any HTML ad code here.
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-300">
              Active
            </label>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-sm text-red-400">{errors.submit}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdUnitModal;
