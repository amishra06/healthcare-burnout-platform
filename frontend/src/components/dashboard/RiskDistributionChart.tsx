import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

interface RiskDistribution {
  Low: number;
  Medium: number;
  High: number;
}

interface RiskDistributionChartProps {
  data: RiskDistribution;
  byDepartment?: Record<string, RiskDistribution>;
  showDepartmentBreakdown?: boolean;
}

const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({
  data,
  byDepartment,
  showDepartmentBreakdown = false,
}) => {
  // Handle empty data
  const totalStaff = (data.Low || 0) + (data.Medium || 0) + (data.High || 0);
  
  if (totalStaff === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Overall Risk Distribution
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No staff data available
        </div>
      </div>
    );
  }
  const doughnutData = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [
      {
        data: [data.Low || 0, data.Medium || 0, data.High || 0],
        backgroundColor: [
          '#10B981', // Green for Low
          '#F59E0B', // Yellow for Medium
          '#EF4444', // Red for High
        ],
        borderColor: [
          '#059669',
          '#D97706',
          '#DC2626',
        ],
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} staff (${percentage}%)`;
          },
        },
      },
    },
  };

  // Prepare department breakdown data
  const departmentData = byDepartment ? {
    labels: Object.keys(byDepartment),
    datasets: [
      {
        label: 'Low Risk',
        data: Object.values(byDepartment).map(dept => dept.Low || 0),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
      },
      {
        label: 'Medium Risk',
        data: Object.values(byDepartment).map(dept => dept.Medium || 0),
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        borderWidth: 1,
      },
      {
        label: 'High Risk',
        data: Object.values(byDepartment).map(dept => dept.High || 0),
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        borderWidth: 1,
      },
    ],
  } : null;

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Overall Risk Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Overall Risk Distribution
        </h3>
        <div className="h-64">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

      {/* Department Breakdown */}
      {showDepartmentBreakdown && departmentData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Risk Distribution by Department
          </h3>
          <div className="h-64">
            <Bar data={departmentData} options={barOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskDistributionChart;