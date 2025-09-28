# HokiePath Frontend

A React-based frontend for the HokiePath course discovery platform at Virginia Tech.

## Features

- **User Authentication**: Google OAuth integration for Virginia Tech students
- **Course Discovery**: Browse and search courses with advanced filtering
- **Course Details**: Comprehensive course information with reviews and statistics
- **AI Chat**: Intelligent course advisor powered by AI
- **Responsive Design**: Mobile-friendly interface with Virginia Tech branding

## Tech Stack

- **React 18** - Frontend framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API communication
- **Lucide React** - Icon library
- **Framer Motion** - Animation library
- **React Hot Toast** - Toast notifications
- **CSS3** - Styling with custom properties

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend API running on port 8000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure environment variables:
```env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── CourseCard.js    # Course card component
│   ├── CourseModal.js   # Course detail modal
│   └── ProtectedRoute.js # Authentication guard
├── contexts/            # React contexts
│   └── AuthContext.js   # Authentication state
├── pages/               # Page components
│   ├── SignupPage.js    # User signup/login
│   ├── CoursesPage.js   # Course listing
│   └── AIChatPage.js    # AI chat interface
├── services/            # API services
│   └── api.js          # Backend API client
├── App.js              # Main app component
├── App.css             # Global styles
├── index.js            # App entry point
└── index.css           # Base styles
```

## Features Overview

### 1. Signup Page
- Google OAuth simulation
- User profile creation
- Virginia Tech branding
- Responsive design

### 2. Courses Page
- Course grid with search and filtering
- Subject-based filtering
- Course cards with key information
- Detailed course modal with reviews
- Statistics dashboard

### 3. AI Chat Page
- Conversational AI interface
- Course search integration
- Academic planning assistance
- Real-time messaging
- Suggestion chips for common queries

## API Integration

The frontend communicates with the backend through the following endpoints:

- `GET /api/v1/courses` - List courses with filters
- `GET /api/v1/courses/:code` - Course details
- `GET /api/v1/courses/:id/reviews` - Course reviews
- `GET /api/v1/courses/:id/recommendations` - Course recommendations
- `GET /api/stream-course-summary` - AI course summaries

## Styling

The application uses a custom CSS system with Virginia Tech colors:

- **Chicago Maroon**: `#861F41` - Primary brand color
- **Burnt Orange**: `#E5751F` - Secondary accent color
- **Hokie Stone**: `#75787b` - Neutral gray
- **White**: `#FFFFFF` - Background and text

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Code Style

- ES6+ JavaScript
- Functional components with hooks
- CSS modules for component styling
- Responsive design principles

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `build` folder to your hosting service

3. Configure environment variables for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

