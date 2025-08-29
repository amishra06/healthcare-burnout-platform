import React, { useState, useEffect } from 'react';
import { Staff, StaffDetail as StaffDetailType, WorkHour, RiskScore } from '../../types';
import { staffAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../common/LoadingSpinner';
import WorkHourEntry from './WorkHourEntry';

interface StaffDetailProps {
  staffId: number;
  onBack: () => void;
  onEdit: (staff: Staff) => void;
}

const StaffDetail: React.FC<StaffDetailProps> = ({ staffId, onBack, onEdit }) => {
  const [staffDetail, setStaffDetail] = useState<StaffDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWorkHourEntry, setShowWorkHourEntry] = useState(false);
  const { showToast } = useToast();

  const fetchStaffDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await staffAPI.getById(staffId);
      
      if (response.data.success && response.data.data) {
        // Handle both possible response structures
        const staffData = response.data.data.staff || response.data.data;
        setStaffDetail(staffData);
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch staff details');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to load staff details';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffDetail();
  }, [staffId]);

  const handleWorkHourAdded = () => {
    setShowWorkHourEntry(false);
    fetchStaffDetail(); // Refresh data to show new work hours and updated risk score
    showToast('Work hours added successfully', 'success');
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'Low':
        return 'text-green-600 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCurrentRiskScore = (): RiskScore | null => {
    if (!staffDetail?.riskHistory || staffDetail.riskHistory.length === 0) {
      return null;
    }
    return staffDetail.riskHistory[0]; // Most recent risk score
  };

  const getRecentWorkHours = (): WorkHour[] => {
    if (!staffDetail?.workHours) return [];
    return staffDetail.workHours.slice(0, 7); // Last 7 days
  };

  const calculateWorkStats = () => {
    if (!staffDetail?.workHours) return null;
    
    const recentHours = staffDetail.workHours.slice(0, 7);
    const totalHours = recentHours.reduce((sum, wh) => sum + wh.hours_worked, 0);
    const totalOvertime = recentHours.reduce((sum, wh) => sum + (wh.overtime_hours || 0), 0);
    const averageDaily = recentHours.length > 0 ? totalHours / recentHours.length : 0;
    
    return {
      totalHours: Math.round(totalHours * 100) / 100,
      totalOvertime: Math.round(totalOvertime * 100) / 100,
      averageDaily: Math.round(averageDaily * 100) / 100,
      daysWorked: recentHours.length
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !staffDetail || !staffDetail.name) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading staff details</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error || 'Staff member not found or invalid data received'}</p>
              {staffDetail && !staffDetail.name && (
                <p className="mt-1 text-xs">Debug: Staff data received but missing required fields</p>
              )}
            </div>
            <div className="mt-4 space-x-2">
              <button
                onClick={fetchStaffDetail}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try again
              </button>
              <button
                onClick={onBack}
                className="bg-gray-100 px-3 py-2 rounded-md text-sm font-medium text-gray-800 hover:bg-gray-200"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentRisk = getCurrentRiskScore();
  const recentWorkHours = getRecentWorkHours();
  const workStats = calculateWorkStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Staff List
        </button>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowWorkHourEntry(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Add Work Hours
          </button>
          <button
            onClick={() => onEdit(staffDetail)}
            className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
          >
            Edit Staff
          </button>
        </div>
      </div>

      {/* Staff Info Card */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-xl font-medium text-gray-700">
                  {staffDetail.name ? staffDetail.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??'}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{staffDetail.name || 'Unknown'}</h1>
              <p className="text-gray-600">{staffDetail.email || 'No email'}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDepartmentColor(staffDetail.department || '')}`}>
                  {staffDetail.department || 'Unknown'}
                </span>
                <span className="text-sm text-gray-500">{staffDetail.role || 'Unknown Role'}</span>
                {staffDetail.hire_date && (
                  <span className="text-sm text-gray-500">
                    Hired: {formatDate(staffDetail.hire_date)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Risk Score */}
      {currentRisk && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Burnout Risk</h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-gray-900">{currentRisk.score}</div>
                <div className="text-sm text-gray-500">Risk Score</div>
              </div>
              <div className={`px-4 py-2 rounded-full border ${getRiskLevelColor(currentRisk.risk_level)}`}>
                <span className="font-medium">{currentRisk.risk_level} Risk</span>
              </div>
            </div>
            
            {/* Risk Factors Breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Risk Factors Breakdown:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Score:</span>
                  <span className="font-medium">{currentRisk.factors.baseScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consecutive Days:</span>
                  <span className="font-medium">{currentRisk.factors.consecutiveDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overtime Hours:</span>
                  <span className="font-medium">{currentRisk.factors.overtimeHours}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weekly Hours:</span>
                  <span className="font-medium">{currentRisk.factors.weeklyHours}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weekend Work:</span>
                  <span className="font-medium">{currentRisk.factors.weekendWork}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Work Statistics */}
      {workStats && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Work Statistics (Last 7 Days)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{workStats.totalHours}</div>
                <div className="text-sm text-gray-500">Total Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{workStats.totalOvertime}</div>
                <div className="text-sm text-gray-500">Overtime Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{workStats.averageDaily}</div>
                <div className="text-sm text-gray-500">Avg Daily Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{workStats.daysWorked}</div>
                <div className="text-sm text-gray-500">Days Worked</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Work Hours */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Work Hours</h3>
          {recentWorkHours.length === 0 ? (
            <p className="text-gray-500">No work hours recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Regular Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overtime Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentWorkHours.map((workHour) => (
                    <tr key={workHour.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(workHour.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {workHour.hours_worked}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {workHour.overtime_hours || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {workHour.hours_worked + (workHour.overtime_hours || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Work Hour Entry Modal */}
      {showWorkHourEntry && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <WorkHourEntry
              staffId={staffId}
              staffName={staffDetail.name}
              onSave={handleWorkHourAdded}
              onCancel={() => setShowWorkHourEntry(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDetail;