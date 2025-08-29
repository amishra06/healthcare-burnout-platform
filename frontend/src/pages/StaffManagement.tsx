import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { StaffList, StaffForm, StaffDetail } from '../components/staff';
import { Staff } from '../types';
import { staffAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

type ViewMode = 'list' | 'add' | 'edit' | 'detail';

const StaffManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Staff | null>(null);
  const { showToast } = useToast();

  const handleAddStaff = () => {
    setSelectedStaff(null);
    setViewMode('add');
  };

  const handleEditStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setViewMode('edit');
  };

  const handleViewStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setViewMode('detail');
  };

  const handleDeleteStaff = (staff: Staff) => {
    setShowDeleteConfirm(staff);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;

    try {
      const response = await staffAPI.delete(showDeleteConfirm.id);
      
      if (response.data.success) {
        showToast('Staff member deleted successfully', 'success');
        setRefreshTrigger(prev => prev + 1);
      } else {
        throw new Error(response.data.error?.message || 'Failed to delete staff member');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to delete staff member';
      showToast(errorMessage, 'error');
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleStaffSaved = (staff: Staff) => {
    setViewMode('list');
    setSelectedStaff(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedStaff(null);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedStaff(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage staff information and work hours
            </p>
          </div>
          {viewMode === 'list' && (
            <button
              onClick={handleAddStaff}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add New Staff
            </button>
          )}
        </div>

        {/* Content */}
        {viewMode === 'list' && (
          <StaffList
            onSelectStaff={handleViewStaff}
            onEditStaff={handleEditStaff}
            onDeleteStaff={handleDeleteStaff}
            refreshTrigger={refreshTrigger}
          />
        )}

        {(viewMode === 'add' || viewMode === 'edit') && (
          <StaffForm
            staff={selectedStaff}
            onSave={handleStaffSaved}
            onCancel={handleCancel}
          />
        )}

        {viewMode === 'detail' && selectedStaff && (
          <StaffDetail
            staffId={selectedStaff.id}
            onBack={handleBackToList}
            onEdit={handleEditStaff}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Staff Member</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>?
                    This action cannot be undone and will also delete all associated work hours and risk data.
                  </p>
                </div>
                <div className="flex justify-center space-x-3 mt-4">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StaffManagement;