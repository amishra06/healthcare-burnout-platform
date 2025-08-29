import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendData {
  date: string;
  avg_score: number;
  staff_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
}

interface RiskTrendChartProps {
  data: TrendData[];
  days?: number;
}

const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ data, days = 30 }) => {
  // Sort data by date and take last N days
  const sortedData = data
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-days);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartData = {
    labels: sortedData.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'Average Risk Score',
        data: sortedData.map(item => Math.round(item.avg_score * 10) / 10),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'High Risk Staff Count',
        data: sortedData.map(item => item.high_risk_count),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            return `Date: ${context[0].label}`;
          },
          label: function(context: any) {
            const datasetLabel = context.dataset.label;
            const value = context.parsed.y;
            
            if (datasetLabel === 'Average Risk Score') {
              return `${datasetLabel}: ${value}`;
            } else {
              return `${datasetLabel}: ${value} staff`;
            }
          },
          afterBody: function(context: any) {
            const dataIndex = context[0].dataIndex;
            const item = sortedData[dataIndex];
            return [
              `Total Staff: ${item.staff_count}`,
              `High Risk: ${item.high_risk_count}`,
              `Medium Risk: ${item.medium_risk_count}`,
              `Low Risk: ${item.low_risk_count}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Average Risk Score',
        },
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'High Risk Staff Count',
        },
        min: 0,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  if (sortedData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Risk Trends (Last {days} Days)
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No trend data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Risk Trends (Last {days} Days)
      </h3>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default RiskTrendChart;