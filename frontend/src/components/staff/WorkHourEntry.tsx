import React, { useState } from 'react';
import { workHoursAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface WorkHourEntryProps {
  staffId: number;
  staffName: string;
  onSave: () => void;
  onCancel: () => void;
}

interface FormData {
  date: string;
  hours_worked: string;
  overtime_hours: string;
}

interface FormErrors {
  date?: string;
  hours_worked?: string;
  overtime_hours?: string;
  general?: string;
}

const WorkHourEntry: React.FC<WorkHourEntryProps> = ({
  staffId,
  staffName,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0], // Today's date
    hours_worked: '',
    overtime_hours: '0'
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Date validation
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (selectedDate > today) {
        newErrors.date = 'Cannot enter work hours for future dates';
      }
      
      // Check if date is too far in the past (more than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (selectedDate < thirtyDaysAgo) {
        newErrors.date = 'Cannot enter work hours more than 30 days in the past';
      }
    }

    // Hours worked validation
    if (!formData.hours_worked) {
      newErrors.hours_worked = 'Hours worked is required';
    } else {
      const hours = parseFloat(formData.hours_worked);
      if (isNaN(hours)) {
        newErrors.hours_worked = 'Please enter a valid number';
      } else if (hours < 0) {
        newErrors.hours_worked = 'Hours worked cannot be negative';
      } else if (hours > 24) {
        newErrors.hours_worked = 'Hours worked cannot exceed 24 hours per day';
      } else if (hours % 0.25 !== 0) {
        newErrors.hours_worked = 'Please enter hours in 15-minute increments (e.g., 8.25, 8.5, 8.75)';
      }
    }

    // Overtime hours validation
    if (formData.overtime_hours) {
      const overtimeHours = parseFloat(formData.overtime_hours);
      if (isNaN(overtimeHours)) {
        newErrors.overtime_hours = 'Please enter a valid number';
      } else if (overtimeHours < 0) {
        newErrors.overtime_hours = 'Overtime hours cannot be negative';
      } else if (overtimeHours > 12) {
        newErrors.overtime_hours = 'Overtime hours cannot exceed 12 hours per day';
      } else if (overtimeHours % 0.25 !== 0) {
        newErrors.overtime_hours = 'Please enter hours in 15-minute increments (e.g., 1.25, 1.5, 1.75)';
      }
    }

    // Total hours validation
    if (!newErrors.hours_worked && !newErrors.overtime_hours) {
      const totalHours = parseFloat(formData.hours_worked) + parseFloat(formData.overtime_hours || '0');
      if (totalHours > 24) {
        newErrors.general = 'Total hours (regular + overtime) cannot exceed 24 hours per day';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await workHoursAPI.create({
        staff_id: staffId,
        date: formData.date,
        hours_worked: parseFloat(formData.hours_worked),
        overtime_hours: parseFloat(formData.overtime_hours || '0')
      });

      if (response.data.success) {
        showToast('Work hours recorded successfully', 'success');
        onSave();
      } else {
        throw new Error(response.data.error?.message || 'Failed to record work hours');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to record work hours';
      
      // Handle specific backend errors
      if (err.response?.data?.error?.code === 'WORK_HOURS_EXIST') {
        setErrors({ date: 'Work hours already recorded for this date' });
      } else {
        setErrors({ general: errorMessage });
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  const getMaxDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMinDate = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return thirtyDaysAgo.toISOString().split('T')[0];
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Add Work Hours</h3>
        <p className="text-sm text-gray-600">Recording work hours for {staffName}</p>
      </div>

      {errors.general && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date *
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            min={getMinDate()}
            max={getMaxDate()}
            className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.date ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            You can enter work hours for up to 30 days in the past
          </p>
        </div>

        {/* Hours Worked */}
        <div>
          <label htmlFor="hours_worked" className="block text-sm font-medium text-gray-700">
            Regular Hours Worked *
          </label>
          <input
            type="number"
            id="hours_worked"
            value={formData.hours_worked}
            onChange={(e) => handleInputChange('hours_worked', e.target.value)}
            min="0"
            max="24"
            step="0.25"
            placeholder="8.0"
            className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.hours_worked ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.hours_worked && (
            <p className="mt-1 text-sm text-red-600">{errors.hours_worked}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Enter hours in 15-minute increments (e.g., 8.25 for 8 hours 15 minutes)
          </p>
        </div>

        {/* Overtime Hours */}
        <div>
          <label htmlFor="overtime_hours" className="block text-sm font-medium text-gray-700">
            Overtime Hours
          </label>
          <input
            type="number"
            id="overtime_hours"
            value={formData.overtime_hours}
            onChange={(e) => handleInputChange('overtime_hours', e.target.value)}
            min="0"
            max="12"
            step="0.25"
            placeholder="0"
            className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.overtime_hours ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.overtime_hours && (
            <p className="mt-1 text-sm text-red-600">{errors.overtime_hours}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Optional. Enter any overtime hours worked beyond regular hours.
          </p>
        </div>

        {/* Total Hours Display */}
        {formData.hours_worked && !errors.hours_worked && !errors.overtime_hours && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Total Hours:</strong> {
                (parseFloat(formData.hours_worked) + parseFloat(formData.overtime_hours || '0')).toFixed(2)
              } hours
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Recording...' : 'Record Hours'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkHourEntry;