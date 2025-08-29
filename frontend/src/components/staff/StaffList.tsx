import React, { useState, useEffect } from 'react';
import { Staff, StaffListResponse } from '../../types';
import { staffAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../common/LoadingSpinner';

interface StaffListProps {
  onSelectStaff: (staff: Staff) => void;
  onEditStaff: (staff: Staff) => void;
  onDeleteStaff: (staff: Staff) => void;
  refreshTrigger?: number;
}

const StaffList: React.FC<StaffListProps> = ({
  onSelectStaff,
  onEditStaff,
  onDeleteStaff,
  refreshTrigger
}) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const { showToast } = useToast();

  const departments = ['ICU', 'Emergency', 'General'];

  const fetchStaff = async (page = 1, department = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = { page, limit: 10 };
      if (department) {
        params.department = department;
      }

      const response = await staffAPI.getAll(params);
      
      if (response.data.success) {
        setStaff(response.data.data.staff);
        setPagination(response.data.data.pagination);
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch staff');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to load staff';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff(currentPage, selectedDepartment);
  }, [currentPage, selectedDepartment, refreshTrigger]);

  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getRiskLevelColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'High':
        return 'text-red-600 bg-red-100';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'Low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'ICU':
        return 'text-purple-600 bg-purple-100';
      case 'Emergency':
        return 'text-red-600 bg-red-100';
      case 'General':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading staff</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => fetchStaff(currentPage, selectedDepartment)}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Department Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleDepartmentChange('')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedDepartment === ''
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Departments
        </button>
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => handleDepartmentChange(dept)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedDepartment === dept
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Staff List */}
      {staff.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {selectedDepartment 
              ? `No staff found in ${selectedDepartment} department`
              : 'No staff found'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {staff.map((member) => (
              <li key={member.id}>
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {member.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.role}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDepartmentColor(member.department)}`}>
                        {member.department}
                      </span>
                      <span className="text-xs text-gray-500">
                        Hired: {new Date(member.hire_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onSelectStaff(member)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => onEditStaff(member)}
                      className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteStaff(member)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNext}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(currentPage - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pagination.limit, pagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffList;