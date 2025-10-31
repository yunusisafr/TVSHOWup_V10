import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, Eye, Megaphone } from 'lucide-react';
import { adminAdService, AdUnit } from '../../lib/adminAdService';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/admin/PageHeader';
import LoadingSpinner from '../../components/admin/LoadingSpinner';
import EmptyState from '../../components/admin/EmptyState';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import AdUnitModal from '../../components/admin/AdUnitModal';

const AdManagement: React.FC = () => {
  const { user } = useAuth();
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAdUnit, setSelectedAdUnit] = useState<AdUnit | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adUnitToDelete, setAdUnitToDelete] = useState<AdUnit | null>(null);
  const [showPreview, setShowPreview] = useState<AdUnit | null>(null);

  useEffect(() => {
    loadAdUnits();
  }, []);

  const loadAdUnits = async () => {
    setLoading(true);
    try {
      const data = await adminAdService.getAllAdUnits();
      setAdUnits(data);
    } catch (error) {
      console.error('Error loading ad units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedAdUnit(null);
    setShowModal(true);
  };

  const handleEdit = (adUnit: AdUnit) => {
    setSelectedAdUnit(adUnit);
    setShowModal(true);
  };

  const handleDeleteClick = (adUnit: AdUnit) => {
    setAdUnitToDelete(adUnit);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!adUnitToDelete) return;

    try {
      await adminAdService.deleteAdUnit(adUnitToDelete.id);
      await loadAdUnits();
      setShowDeleteConfirm(false);
      setAdUnitToDelete(null);
    } catch (error) {
      console.error('Error deleting ad unit:', error);
    }
  };

  const handleToggleStatus = async (adUnit: AdUnit) => {
    if (!user) return;

    try {
      await adminAdService.toggleAdUnitStatus(adUnit.id, !adUnit.is_active, user.id);
      await loadAdUnits();
    } catch (error) {
      console.error('Error toggling ad unit status:', error);
    }
  };

  const handlePreview = (adUnit: AdUnit) => {
    setShowPreview(adUnit);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <PageHeader
        title="Ad Management"
        description="Manage Google AdSense and other ad codes"
        action={{
          label: 'New Ad Unit',
          onClick: handleCreate,
          icon: Plus,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {adUnits.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No ad units yet"
            description="Create your first ad unit to get started"
            action={{
              label: 'New Ad Unit',
              onClick: handleCreate
            }}
          />
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {adUnits.map((adUnit) => (
                    <tr key={adUnit.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {adUnit.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-900/30 text-blue-400 rounded">
                          {adminAdService.getPositionLabel(adUnit.position)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(adUnit)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            adUnit.is_active
                              ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          <Power size={12} />
                          {adUnit.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(adUnit.created_at).toLocaleDateString('en-US')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePreview(adUnit)}
                            className="text-blue-400 hover:text-blue-300 transition-colors p-2"
                            title="Preview"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(adUnit)}
                            className="text-yellow-400 hover:text-yellow-300 transition-colors p-2"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(adUnit)}
                            className="text-red-400 hover:text-red-300 transition-colors p-2"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AdUnitModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={loadAdUnits}
        adUnit={selectedAdUnit}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Ad Unit"
        message={`Are you sure you want to delete the ad unit "${adUnitToDelete?.name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setAdUnitToDelete(null);
        }}
        variant="danger"
      />

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">
                Ad Preview: {showPreview.name}
              </h2>
              <button
                onClick={() => setShowPreview(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Position:</p>
                <span className="px-3 py-1 text-sm font-medium bg-blue-900/30 text-blue-400 rounded">
                  {adminAdService.getPositionLabel(showPreview.position)}
                </span>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Ad Code:</p>
                <pre className="bg-gray-900 p-4 rounded-lg text-xs text-gray-300 overflow-x-auto">
                  {showPreview.ad_code}
                </pre>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Preview:</p>
                <div
                  className="bg-gray-900 p-4 rounded-lg border border-gray-700"
                  dangerouslySetInnerHTML={{ __html: showPreview.ad_code }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdManagement;
