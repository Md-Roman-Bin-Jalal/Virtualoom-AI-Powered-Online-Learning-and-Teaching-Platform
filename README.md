# Virtualoom : AI-Powered Online Learning & Teaching Platform

A comprehensive learning and communication platform with integrated AI-powered assessment tools.

## Overview

Virtualoom is a modern web application that combines real-time communication capabilities with powerful assessment tools. The platform enables users to create channels, share files, generate different types of assessments (quizzes, coding challenges, writing tasks), and evaluate performance through an intuitive interface.

## Key Features

- **Channel-based Communication System**
  - Create main channels and subchannels
  - Real-time messaging with Socket.IO
  - Role-based permissions (creator, admin, moderator, newbie)
  - File sharing with comments and bookmarks

- **AI-Powered Assessment Tools**
  - **Quiz Assessments**: Multiple-choice questions with automatic grading
  - **Coding Assessments**: Programming challenges with customizable test cases
  - **Writing Assessments**: Essay and writing prompts with evaluation tools
  - AI-assisted content generation for all assessment types

- **User Management**
  - User authentication and authorization
  - Online status tracking
  - Role management within channels

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Real-time Communication**: Socket.IO
- **Frontend**: React
- **AI Services**: Google Gemini API, OpenRouter API

## Project Structure

```
Virtualoom/
├── backend/           # Express server
│   ├── controllers/   # API route controllers
│   ├── models/        # MongoDB models
│   ├── routes/        # API route definitions
│   ├── middlewares/   # Custom middleware functions
│   ├── utils/         # Utility functions
│   ├── .env           # Environment variables (not in repo)
│   └── server.js      # Main server file
├── frontend/          # React client
│   ├── public/        # Static files
│   ├── src/           # React components and logic
│   │   ├── components/  # UI components
│   │   ├── contexts/    # React contexts
│   │   └── utils/       # Helper functions
│   └── .env           # Frontend environment variables (not in repo)
└── README.md          # Project documentation
```

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- MongoDB (v4.4+)
- NPM or Yarn

### Backend Setup
1. Navigate to the backend directory
   ```
   cd backend
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   # Database
   MONGODB_URI=mongodb://localhost:27017/your-database-name

   # API Keys (replace with your own)
   GEMINI_API_KEY=your_gemini_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key

   # Server
   PORT=5000
   ```

4. Start the server
   ```
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory
   ```
   cd ../frontend
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm start
   ```

## API Security

This project uses API keys for services like Google Gemini and OpenRouter. Keep these secure by:

1. Never committing `.env` files to Git
2. Using environment variables for all API keys
3. Implementing proper error handling when API keys are missing
4. Setting appropriate CORS restrictions

## Component Features

### Authentication System
- User registration and login
- Password recovery
- Profile management
- Role-based authorization

### Channel Management
- Create, edit, and delete channels
- Add and remove members with different roles
- Create nested subchannels for organization
- File upload and management
- Real-time chat and notifications

### Assessment System
- Create manual or AI-generated assessments
- Distribute to channels or specific users
- Set time limits and attempt restrictions
- Generate statistics and reports

### Virtual Meeting
- Join virtual classrooms
- Real-time chat during meetings
- User presence indicators
- Private messaging

## Future Enhancements
- Mobile application support
- Advanced analytics dashboard
- Integration with LMS platforms
- Video conferencing capabilities
- Collaborative document editing

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Security Considerations

- All API keys are stored in environment variables
- CORS is properly configured to limit access
- User authentication uses secure protocols
- Input validation on all forms
- Rate limiting for API endpoints

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Express.js](https://expressjs.com/) - Web framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Socket.IO](https://socket.io/) - Real-time communication
- [React](https://reactjs.org/) - Frontend library
- [Google Gemini](https://ai.google.dev/docs/gemini_api) - AI capabilities
- [OpenRouter](https://openrouter.ai/) - Quiz generation

## Additional Technical Details

### Real-Time Communication Architecture
The application implements a comprehensive real-time communication system using Socket.IO. Key features include:
- Separate socket rooms for channels and subchannels
- Presence detection and online status tracking
- Typing indicators and read receipts
- Efficient event broadcasting to minimize network overhead

### AI Integration
The platform leverages multiple AI models for different purposes:
- **Google Gemini**: Powers chatbot interactions and writing assessment generation
- **OpenRouter**: Used for quiz generation with configurable difficulty levels
- **Custom Evaluation Models**: Trained for specific assessment types

### Database Schema
The MongoDB database uses a well-structured schema with relationships between:
- Users and their roles
- Channels and their members
- Messages and their metadata
- Assessment types and their distributions
- Evaluation criteria and results

### Security Implementation
- JWT-based authentication with refresh tokens
- Password hashing using bcrypt
- Role-based access control for all operations
- Rate limiting on sensitive endpoints
- Input sanitization to prevent injection attacks

## Getting Started for Developers

### Development Environment Setup
```bash
# Clone the repository
git clone https://github.com/your-username/my-repo-name.git

# Install all dependencies (both backend and frontend)
cd your-folder-name
npm run install-all

# Start development servers
npm run dev
```

### Environment Setup
The application requires several environment variables to function properly:
- API keys for AI services
- Database connection strings
- JWT secrets
- CORS configuration

See the `.env.example` files in both backend and frontend directories for required variables.

### Deployment Options
- **Docker**: Containerized deployment using Docker Compose
- **Kubernetes**: For scaled deployments with multiple services
- **Traditional Hosting**: Step-by-step instructions in the deployment guide

### Testing
The project includes comprehensive test suites:
- Unit tests for core functionality
- Integration tests for API endpoints
- Socket.IO event testing
- React component testing using Jest and React Testing Library

## Repository Setup for GitHub

If you're uploading this project to GitHub, follow these steps to ensure API keys and sensitive data remain secure:

1. Create `.gitignore` files in both frontend and backend directories:

**Backend .gitignore:**
```
# Environment variables
.env
.env.local
.env.development
.env.test
.env.production

# Dependency directories
node_modules/

# Log files
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Mac files
.DS_Store

# Coverage directory
coverage/
```

**Frontend .gitignore:**
```
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor directories and files
.idea
.vscode
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Optional npm cache & logs
.npm
.eslintcache

# Local env files
.env
.env.local
.env.development
.env.test
.env.production
```

2. Create an `.env.example` file in both directories to guide other developers on required environment variables without revealing sensitive values.

3. Add GitHub Actions workflows for automated testing and deployment if needed.

4. Configure branch protection rules to prevent direct commits to main/master branch.

## Screenshots

![Home Page](public/home.png)
![Create Channel](public/createChannel.png)
![Browse Channels](public/browseChannel.png)
![Assessment](public/assesment.png)
![Evaluation](public/evaluation.png)
![Meeting](public/meeting.png)

## Contact

If you have questions or want to contribute, please reach out through GitHub issues or contact the maintainers directly.

---

**Note:** This project uses AI services that require API keys and possibly billing accounts. Make sure to obtain your own API keys for development and production environments.

