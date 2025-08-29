# Dashboard Components

This directory contains all the dashboard-related components for the Healthcare Burnout Prevention Platform.

## Components

### DashboardStats
Displays key statistics in card format:
- Total Staff
- High Risk Staff Count
- Medium Risk Staff Count  
- Low Risk Staff Count
- Active Alerts Count

### RiskDistributionChart
Chart.js powered component showing:
- Overall risk distribution (doughnut chart)
- Risk distribution by department (bar chart)
- Responsive design with proper legends and tooltips

### TopRiskStaff
List component displaying:
- Top 5 highest risk staff members
- Risk scores and levels
- Risk factor breakdowns
- Click handlers for navigation

### AlertNotifications
Alert management component featuring:
- Active alert display
- Alert resolution functionality
- Time-based formatting
- Empty state handling

### RiskTrendChart
Time-series chart showing:
- Average risk scores over time
- High-risk staff count trends
- Dual y-axis for different metrics
- Configurable time periods

## Usage

```tsx
import {
  DashboardStats,
  RiskDistributionChart,
  TopRiskStaff,
  AlertNotifications,
  RiskTrendChart
} from '../components/dashboard';

// Use in dashboard page with proper data props
```

## Dependencies

- Chart.js 4.4.0
- react-chartjs-2 5.2.0
- Tailwind CSS for styling

## Features

- Fully responsive design
- Loading states and error handling
- Interactive charts with tooltips
- Accessibility compliant
- TypeScript support