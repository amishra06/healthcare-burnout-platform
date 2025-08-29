# Staff Management Components

This directory contains all components related to staff management functionality for the Healthcare Burnout Prevention Platform.

## Components

### StaffList.tsx
- Displays paginated list of all staff members
- Supports filtering by department (ICU, Emergency, General)
- Shows staff basic information with department badges
- Provides actions for viewing details, editing, and deleting staff
- Implements proper error handling and loading states
- Responsive design with mobile-friendly pagination

### StaffForm.tsx
- Handles both creating new staff and editing existing staff
- Comprehensive form validation including:
  - Name validation (required, minimum length)
  - Email validation (required, proper format, uniqueness)
  - Department validation (required, valid options)
  - Role validation (required, with common role suggestions)
  - Hire date validation (required, not in future)
- Real-time error feedback and form state management
- Supports role suggestions via datalist for better UX

### StaffDetail.tsx
- Displays comprehensive staff information and risk breakdown
- Shows current burnout risk score with factor breakdown
- Displays recent work statistics (last 7 days)
- Lists recent work hours in tabular format
- Provides quick access to add work hours and edit staff
- Integrates with risk calculation system

### WorkHourEntry.tsx
- Modal form for entering daily work hours
- Date picker with validation (no future dates, max 30 days past)
- Separate fields for regular and overtime hours
- Comprehensive validation:
  - Hours in 15-minute increments
  - Maximum 24 hours per day total
  - Reasonable overtime limits
- Real-time total hours calculation
- Prevents duplicate entries for same date

## Features Implemented

### Requirements Coverage
- **7.3**: Staff list view with department filtering and pagination ✓
- **7.4**: Add/edit staff functionality with comprehensive validation ✓
- **6.1**: Staff detail pages with comprehensive information display ✓
- **6.2**: Risk breakdown showing current score and contributing factors ✓
- **3.1**: Work hour entry with date picker and validation ✓
- **3.3**: Overtime tracking with separate fields ✓
- **3.4**: Form validation with real-time feedback ✓

### Validation Features
- Email format and uniqueness validation
- Department selection from predefined options
- Date validation (no future dates, reasonable past limits)
- Hours validation (0-24 range, 15-minute increments)
- Total hours validation (regular + overtime ≤ 24)
- Required field validation with clear error messages

### User Experience Features
- Loading spinners during API calls
- Toast notifications for success/error feedback
- Responsive design for mobile and desktop
- Intuitive navigation between list, detail, and form views
- Confirmation dialogs for destructive actions
- Real-time form validation with immediate feedback

### Integration Features
- Seamless integration with backend APIs
- Automatic risk score updates when work hours are added
- Real-time data refresh after operations
- Error handling with user-friendly messages
- Proper authentication token handling

## Usage

```typescript
import { StaffList, StaffForm, StaffDetail, WorkHourEntry } from '../components/staff';

// Use in StaffManagement page with proper state management
// See StaffManagement.tsx for complete implementation example
```

## API Integration

All components integrate with the following API endpoints:
- `GET /api/staff` - List staff with filtering and pagination
- `GET /api/staff/:id` - Get staff details with work hours and risk history
- `POST /api/staff` - Create new staff member
- `PUT /api/staff/:id` - Update existing staff member
- `DELETE /api/staff/:id` - Delete staff member
- `POST /api/work-hours` - Record work hours
- `GET /api/work-hours/:staff_id` - Get work hours for staff member

## Error Handling

- Network errors with retry options
- Validation errors with field-specific messages
- Authentication errors with automatic redirect
- Server errors with user-friendly messages
- Loading states with proper spinners
- Empty states with helpful messages