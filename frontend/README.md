# Healthcare Burnout Prevention - Frontend

React TypeScript application for managing healthcare worker burnout prevention.

## Features Implemented

### Authentication System
- JWT-based authentication with secure token storage
- Login form with validation and error handling
- Protected routes that require authentication
- Automatic token verification on app load
- Logout functionality with token cleanup

### Components Structure
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx          # Login form component
│   │   └── ProtectedRoute.tsx     # Route protection wrapper
│   ├── common/
│   │   ├── ErrorBoundary.tsx      # Error boundary for React errors
│   │   ├── LoadingSpinner.tsx     # Reusable loading spinner
│   │   └── Toast.tsx              # Toast notification component
│   └── layout/
│       ├── Layout.tsx             # Main layout wrapper
│       └── Navigation.tsx         # Navigation bar
├── contexts/
│   ├── AuthContext.tsx            # Authentication state management
│   └── ToastContext.tsx           # Toast notifications management
├── pages/
│   ├── Dashboard.tsx              # Dashboard page (placeholder)
│   ├── StaffManagement.tsx        # Staff management page (placeholder)
│   └── NotFound.tsx               # 404 error page
└── services/
    └── api.ts                     # API service layer with Axios
```

### API Integration
- Axios-based API service with interceptors
- Automatic token attachment to requests
- Error handling with automatic logout on 401
- Organized API methods by feature (auth, staff, dashboard, etc.)

### Styling
- Tailwind CSS for responsive design
- Custom color palette for healthcare theme
- Consistent component styling
- Mobile-responsive design

### Error Handling
- React Error Boundary for component errors
- Toast notifications for user feedback
- Form validation with error messages
- API error handling with user-friendly messages

## Environment Variables
```
REACT_APP_API_URL=http://localhost:5000
```

## Demo Credentials
- Email: manager@hospital.com
- Password: password123

## Next Steps
The following components are ready for implementation in subsequent tasks:
- Dashboard with risk visualization
- Staff management with CRUD operations
- Work hours entry forms
- Alert system integration