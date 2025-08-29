import React from 'react';

interface StaffMember {
  id: number;
  name: string;
  department: string;
  role: string;
  risk_score: number;
  risk_level: string;
  factors?: {
    baseScore: number;
    consecutiveDays: number;
    overtimeHours: number;
    weeklyHours: number;
    weekendWork: number;
  };
}

interface TopRiskStaffProps {
  staff: StaffMember[];
  onStaffClick?: (staffId: number) => void;
}

const TopRiskStaff: React.FC<TopRiskStaffProps> = ({ staff, onStaffClick }) => {
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 71) return 'text-red-600 font-semibold';
    if (score >= 41) return 'text-yellow-600 font-semibold';
    return 'text-green-600 font-semibold';
  };

  if (!staff || staff.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Top 5 High-Risk Staff
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm">
            No high-risk staff at this time
          </div>
          <div className="text-gray-400 text-xs mt-1">
            All staff are within acceptable risk levels
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Top 5 High-Risk Staff
      </h3>
      <div className="space-y-3">
        {staff.map((member, index) => (
          <div
            key={member.id}
            className={`p-4 border rounded-lg transition-colors ${
              onStaffClick 
                ? 'cursor-pointer hover:bg-gray-50 hover:border-gray-300' 
                : ''
            }`}
            onClick={() => onStaffClick?.(member.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {member.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {member.role} • {member.department}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className={`text-lg font-bold ${getRiskScoreColor(member.risk_score)}`}>
                    {member.risk_score}
                  </div>
                  <div className="text-xs text-gray-500">Risk Score</div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskLevelColor(
                    member.risk_level
                  )}`}
                >
                  {member.risk_level} Risk
                </span>
              </div>
            </div>
            
            {/* Risk factors breakdown (if available) */}
            {member.factors && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  {member.factors.consecutiveDays > 0 && (
                    <div>Consecutive days: +{member.factors.consecutiveDays}</div>
                  )}
                  {member.factors.overtimeHours > 0 && (
                    <div>Overtime: +{member.factors.overtimeHours}</div>
                  )}
                  {member.factors.weeklyHours > 0 && (
                    <div>Weekly hours: +{member.factors.weeklyHours}</div>
                  )}
                  {member.factors.weekendWork > 0 && (
                    <div>Weekend work: +{member.factors.weekendWork}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopRiskStaff;