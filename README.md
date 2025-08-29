# Healthcare Worker Burnout Prevention Platform

A web application designed to help healthcare managers proactively monitor staff workload and prevent burnout through automated risk assessment and early intervention alerts.

## Project Structure

```
healthcare-burnout-prevention/
├── frontend/                 # React TypeScript frontend
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   └── package.json
├── backend/                 # Node.js Express backend
│   ├── config/             # Configuration files
│   ├── middleware/         # Express middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   └── package.json
└── package.json            # Root package.json for scripts
```

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Chart.js for data visualization
- React Router for navigation
- Axios for API communication

### Backend
- Node.js with Express.js
- SQLite with better-sqlite3
- JWT for authentication
- bcryptjs for password hashing
- Nodemailer for email notifications

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
```bash
# Copy example environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Update the environment variables in the `.env` files as needed.

### Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

Or start them individually:
```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

### Production Build

Build the frontend for production:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Endpoints

The backend API will be available at `http://localhost:5000` with the following base structure:

- `GET /health` - Health check endpoint
- `/api/*` - All API endpoints (to be implemented)

## Development Status

This project is currently in the setup phase. The basic project structure and configuration have been completed. Subsequent tasks will implement:

1. Database schema and sample data
2. Authentication system
3. Risk calculation engine
4. Frontend components and pages
5. Dashboard and visualizations
6. Staff management features
7. Alert system

## Contributing

This project follows a task-driven development approach. Each feature is implemented according to the specifications in the `.kiro/specs/healthcare-burnout-prevention/` directory.