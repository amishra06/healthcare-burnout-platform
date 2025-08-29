import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import DashboardStats from '../components/dashboard/DashboardStats';
import RiskDistributionChart from '../components/dashboard/RiskDistributionChart';
import TopRiskStaff from '../components/dashboard/TopRiskStaff';
import AlertNotifications from '../components/dashboard/AlertNotifications';
import RiskTrendChart from '../components/dashboard/RiskTrendChart';
import { dashboardAPI, alertsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface DashboardData {
  totalStaff: number;
  riskDistribution: {
    Low: number;
    Medium: number;
    High: number;
  };
  topRiskStaff: Array<{
    id: number;
    name: string;
    department: string;
    role: string;
    risk_score: number;
    risk_level: string;
    factors?: any;
  }>;
  activeAlerts: Array<{
    id: number;
    message: string;
    risk_score: number;
    created_at: string;
    staff_id: number;
    staff_name: string;
    department: string;
    resolved: boolean;
  }>;
  summary: {
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    activeAlertsCount: number;
  };
}

interface RiskDistributionData {
  overall: {
    Low: number;
    Medium: number;
    High: number;
  };
  byDepartment: Record<string, {
    Low: number;
    Medium: number;
    High: number;
  }>;
}

interface TrendData {
  date: string;
  avg_score: number;
  staff_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [riskDistributionData, setRiskDistributionData] = useState<RiskDistributionData | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [overviewResponse, riskDistResponse, trendsResponse] = await Promise.all([
        dashboardAPI.getOverview(),
        dashboardAPI.getRiskDistribution(),
        dashboardAPI.getRiskTrends(14), // Last 14 days
      ]);

      setDashboardData(overviewResponse.data.data);
      setRiskDistributionData(riskDistResponse.data.data);
      setTrendData(trendsResponse.data.data.trends || []);

    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: number) => {
    try {
      await alertsAPI.resolve(alertId);
      showToast('Alert resolved successfully', 'success');
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (err: any) {
      console.error('Failed to resolve alert:', err);
      showToast('Failed to resolve alert', 'error');
    }
  };

  const handleStaffClick = (staffId: number) => {
    // Navigate to staff detail page (to be implemented in future tasks)
    console.log('Navigate to staff detail:', staffId);
    showToast('Staff detail page coming soon', 'info');
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Overview of staff burnout risk and alerts
            </p>
          </div>
          
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !dashboardData) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Overview of staff burnout risk and alerts
            </p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading dashboard
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchDashboardData}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Overview of staff burnout risk and alerts
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <DashboardStats
          totalStaff={dashboardData.totalStaff}
          highRiskCount={dashboardData.summary.highRiskCount}
          mediumRiskCount={dashboardData.summary.mediumRiskCount}
          lowRiskCount={dashboardData.summary.lowRiskCount}
          activeAlertsCount={dashboardData.summary.activeAlertsCount}
        />

        {/* Alerts Section */}
        {dashboardData.activeAlerts.length > 0 && (
          <AlertNotifications
            alerts={dashboardData.activeAlerts}
            onResolveAlert={handleResolveAlert}
            showResolveButton={true}
          />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Risk Distribution */}
          <div className="xl:col-span-1">
            {riskDistributionData && (
              <RiskDistributionChart
                data={riskDistributionData.overall}
                byDepartment={riskDistributionData.byDepartment}
                showDepartmentBreakdown={false}
              />
            )}
          </div>

          {/* Top Risk Staff */}
          <div className="xl:col-span-2">
            <TopRiskStaff
              staff={dashboardData.topRiskStaff}
              onStaffClick={handleStaffClick}
            />
          </div>
        </div>

        {/* Risk Trends */}
        <RiskTrendChart data={trendData} days={14} />

        {/* Department Breakdown */}
        {riskDistributionData && (
          <RiskDistributionChart
            data={riskDistributionData.overall}
            byDepartment={riskDistributionData.byDepartment}
            showDepartmentBreakdown={true}
          />
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;