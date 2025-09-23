# Misión Maestra - Gamified Team Task Management

A comprehensive gamified team task management application built with a split architecture: C# backend API and Next.js frontend.

## 🎯 Project Overview

Misión Maestra transforms ordinary task management into an engaging gamified experience where users can:
- Create and join teams
- Collaborate on tasks and missions
- Earn XP and level up
- Monitor social wellness
- Track real-time progress

## 🏗️ Architecture

### Backend (C# ASP.NET Core)
- **Framework**: ASP.NET Core 8.0 Web API
- **Database**: SQLite with Entity Framework Core
- **Real-time**: SignalR for live updates
- **Authentication**: JWT Bearer Tokens
- **Security**: BCrypt password hashing, CORS, input validation
- **Logging**: Serilog with file and database persistence

### Frontend (Next.js)
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Real-time**: SignalR client for live updates
- **State Management**: React Context API
- **Authentication**: JWT token management
- **UI Components**: Responsive design with modern UI

## 🚀 Features

### Core Features
- ✅ User registration and authentication
- ✅ Team creation and management
- ✅ Task creation, assignment, and tracking
- ✅ Real-time notifications and updates
- ✅ Gamification (XP, levels, achievements)
- ✅ Social wellness monitoring
- ✅ Team invitations and member management

### Advanced Features
- ✅ Admin dashboard with server monitoring
- ✅ Comprehensive logging and audit trails
- ✅ Real-time online user tracking
- ✅ Task prioritization and due dates
- ✅ Team collaboration features
- ✅ Responsive design for all devices

### Real-time Features
- ✅ Live user connection status
- ✅ Real-time task updates
- ✅ Team messaging
- ✅ Instant notifications
- ✅ Live server statistics

## 📁 Project Structure

```
mision-maestra/
├── backend/                          # C# ASP.NET Core API
│   ├── Controllers/                   # API controllers
│   │   ├── AuthController.cs
│   │   ├── UsersController.cs
│   │   ├── TeamsController.cs
│   │   ├── TasksController.cs
│   │   └── AdminController.cs
│   ├── DTOs/                         # Data Transfer Objects
│   ├── Hubs/                         # SignalR hubs
│   ├── Models/                       # Entity Framework models
│   ├── Services/                     # Business logic services
│   └── MisionMaestra.API.csproj      # Project file
├── src/                              # Next.js frontend
│   ├── app/                          # Next.js app directory
│   │   ├── admin/                   # Admin dashboard
│   │   ├── auth/                    # Authentication pages
│   │   ├── dashboard/               # User dashboard
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Home page
│   ├── components/                  # React components
│   ├── lib/                        # Utilities and contexts
│   │   ├── api/                    # API client and SignalR
│   │   ├── auth-context.tsx        # Authentication context
│   │   └── realtime-context.tsx    # Real-time context
│   └── ...
├── package.json                     # Frontend dependencies
└── README.md                       # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Restore dependencies:
```bash
dotnet restore
```

3. Configure the application:
   - Update `appsettings.json` with your JWT secret key
   - Configure database connection string if needed

4. Run the backend:
```bash
dotnet run
```

The API will be available at `https://localhost:5001` (or `http://localhost:5000`)

### Frontend Setup

1. Navigate to the root directory:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Create a `.env.local` file in the root directory
   - Add the following environment variables:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_SIGNALR_URL=http://localhost:5000/hub/mision-maestra
   ```

4. Run the frontend:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🔧 Configuration

### Backend Configuration

Update `backend/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=mision-maestra.db"
  },
  "Jwt": {
    "Issuer": "MisionMaestra",
    "Audience": "MisionMaestraApp",
    "Key": "your-super-secret-jwt-key-that-should-be-at-least-32-characters-long"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

### Frontend Configuration

Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SIGNALR_URL=http://localhost:5000/hub/mision-maestra
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update user profile |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/{id}` | Get user by ID |
| GET | `/api/users/online` | Get online users |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user |

### Team Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/teams` | Create team |
| GET | `/api/teams/{id}` | Get team by ID |
| GET | `/api/teams/my-teams` | Get user's teams |
| PUT | `/api/teams/{id}` | Update team |
| DELETE | `/api/teams/{id}` | Delete team |
| POST | `/api/teams/{id}/invite` | Invite user to team |
| PUT | `/api/teams/invitations/{id}/respond` | Respond to invitation |

### Task Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/{id}` | Get task by ID |
| GET | `/api/tasks/my-tasks` | Get user's tasks |
| GET | `/api/tasks/team/{id}` | Get team tasks |
| PUT | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |
| POST | `/api/tasks/{id}/complete` | Complete task |
| POST | `/api/tasks/{id}/assign` | Assign task to users |

### Admin Endpoints (Requires Admin Role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Get server statistics |
| GET | `/api/admin/logs` | Get server logs |
| POST | `/api/admin/logs/cleanup` | Clean up old logs |
| GET | `/api/admin/users` | Get all users |
| GET | `/api/admin/teams` | Get all teams |
| GET | `/api/admin/tasks` | Get all tasks |

## 🔌 SignalR Real-time Features

### Hub Connection
- **URL**: `/hub/mision-maestra`
- **Protocol**: WebSocket

### Client Events
- `UserConnected` - User connected to the hub
- `UserDisconnected` - User disconnected from the hub
- `UserStatusUpdated` - User's social battery or mood updated
- `TeamMessageReceived` - New team message received
- `TaskUpdated` - Task status updated
- `TaskCompleted` - Task completed
- `TeamInvitationReceived` - New team invitation received

### Hub Methods
- `UpdateUserStatus` - Update user's social battery and mood
- `JoinTeam` - Join a team group
- `LeaveTeam` - Leave a team group
- `SendTeamMessage` - Send message to team
- `TaskUpdated` - Notify about task update
- `TaskCompleted` - Notify about task completion
- `TeamInvitationSent` - Notify about team invitation
- `KeepAlive` - Keep connection alive

## 🎮 Gamification System

### Experience Points (XP)
- Users earn XP by completing tasks
- Each task has an XP value based on complexity
- XP contributes to user level progression

### Levels
- Users start at Level 1
- Each level requires 100 XP
- Level formula: `Level = (TotalXP / 100) + 1`

### Social Battery
- Represents user's social energy (0-100%)
- Can be updated by user
- Affects collaboration recommendations

### Achievements
- Predefined achievements for various milestones
- Users unlock achievements based on their actions
- Visible on user profiles

## 🔒 Security Features

### Authentication
- JWT-based authentication
- Secure password hashing with BCrypt
- Token expiration and refresh
- Role-based access control

### API Security
- CORS configuration
- Input validation
- Rate limiting ready
- HTTPS enforcement
- SQL injection prevention

### Data Protection
- Sensitive data encryption
- Secure token storage
- Audit logging
- User privacy controls

## 🚀 Deployment

### Backend Deployment

The backend can be deployed to various platforms:

#### Azure App Service
```bash
# Build the application
dotnet publish -c Release -o ./publish

# Deploy to Azure
az webapp up --resource-group myResourceGroup --name mision-maestra-api --location eastus --runtime "DOTNETCORE:8.0"
```

#### Docker
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["backend/MisionMaestra.API.csproj", "backend/"]
RUN dotnet restore "backend/MisionMaestra.API.csproj"
COPY . .
WORKDIR "/src/backend"
RUN dotnet build "MisionMaestra.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MisionMaestra.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MisionMaestra.API.dll"]
```

### Frontend Deployment

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Netlify
```bash
# Build the application
npm run build

# Deploy to Netlify
netlify deploy --prod
```

#### Docker
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

### Backend Testing
```bash
# Run unit tests
dotnet test

# Run integration tests
dotnet test --filter "Category=Integration"
```

### Frontend Testing
```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

## 📊 Monitoring & Logging

### Application Logging
- **Backend**: Serilog with file and database logging
- **Frontend**: Console logging with error tracking
- **Categories**: Authentication, Teams, Tasks, Users, System, Security

### Performance Monitoring
- Response time tracking
- Error rate monitoring
- User activity logging
- Server resource utilization

### Admin Dashboard
- Real-time server statistics
- Live user monitoring
- Application logs viewer
- System management tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Workflow
1. Clone the repository
2. Set up both backend and frontend
3. Create a feature branch
4. Implement your changes
5. Test thoroughly
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **ASP.NET Core Team** for the excellent framework
- **Next.js Team** for the amazing React framework
- **Tailwind CSS** for the utility-first CSS framework
- **shadcn/ui** for the beautiful component library
- **SignalR** for real-time web functionality

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Contact the development team

---

**Built with ❤️ using modern web technologies**