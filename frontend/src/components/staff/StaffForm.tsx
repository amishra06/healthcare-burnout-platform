import React, { useState, useEffect } from 'react';
import { Staff } from '../../types';
import { staffAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface StaffFormProps {
  staff?: Staff | null;
  onSave: (staff: Staff) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  email: string;
  department: 'ICU' | 'Emergency' | 'General' | '';
  role: string;
  hire_date: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  department?: string;
  role?: string;
  hire_date?: string;
}

const StaffForm: React.FC<StaffFormProps> = ({ staff, onSave, onCancel }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    department: '',
    role: '',
    hire_date: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const departments = [
    { value: 'ICU', label: 'ICU' },
    { value: 'Emergency', label: 'Emergency' },
    { value: 'General', label: 'General' }
  ];

  const commonRoles = [
    'Registered Nurse',
    'Licensed Practical Nurse',
    'Nurse Practitioner',
    'Physician',
    'Resident',
    'Physician Assistant',
    'Medical Technician',
    'Respiratory Therapist',
    'Physical Therapist',
    'Pharmacist',
    'Other'
  ];

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name,
        email: staff.email,
        department: staff.department,
        role: staff.role,
        hire_date: staff.hire_date
      });
    }
  }, [staff]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Department validation
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    // Role validation
    if (!formData.role.trim()) {
      newErrors.role = 'Role is required';
    }

    // Hire date validation
    if (!formData.hire_date) {
      newErrors.hire_date = 'Hire date is required';
    } else {
      const hireDate = new Date(formData.hire_date);
      const today = new Date();
      if (hireDate > today) {
        newErrors.hire_date = 'Hire date cannot be in the future';
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
      let response;
      
      if (staff) {
        // Update existing staff
        response = await staffAPI.update(staff.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          department: formData.department as 'ICU' | 'Emergency' | 'General',
          role: formData.role.trim()
        });
      } else {
        // Create new staff
        response = await staffAPI.create({
          name: formData.name.trim(),
          email: formData.email.trim(),
          department: formData.department as 'ICU' | 'Emergency' | 'General',
          role: formData.role.trim(),
          hire_date: formData.hire_date
        });
      }

      if (response.data.success) {
        showToast(
          staff ? 'Staff member updated successfully' : 'Staff member created successfully',
          'success'
        );
        onSave(response.data.data.staff);
      } else {
        throw new Error(response.data.error?.message || 'Failed to save staff member');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to save staff member';
      showToast(errorMessage, 'error');
      
      // Handle specific validation errors from backend
      if (err.response?.data?.error?.code === 'EMAIL_EXISTS') {
        setErrors({ email: 'A staff member with this email already exists' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
              Department *
            </label>
            <select
              id="department"
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.department ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
            {errors.department && (
              <p className="mt-1 text-sm text-red-600">{errors.department}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role *
            </label>
            <input
              type="text"
              id="role"
              list="roles"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.role ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter role or select from suggestions"
            />
            <datalist id="roles">
              {commonRoles.map((role) => (
                <option key={role} value={role} />
              ))}
            </datalist>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
          </div>

          {/* Hire Date */}
          <div>
            <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700">
              Hire Date *
            </label>
            <input
              type="date"
              id="hire_date"
              value={formData.hire_date}
              onChange={(e) => handleInputChange('hire_date', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.hire_date ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.hire_date && (
              <p className="mt-1 text-sm text-red-600">{errors.hire_date}</p>
            )}
          </div>

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
              {loading ? 'Saving...' : (staff ? 'Update Staff' : 'Add Staff')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffForm;