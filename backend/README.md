# Mision Maestra Backend API

## Overview

This is the C# backend API for the Mision Maestra gamified team task management application. It provides RESTful API endpoints and real-time communication using SignalR.

## Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **Team Management**: Create teams, invite members, manage roles
- **Task Management**: Create, assign, and track tasks with XP rewards
- **Real-time Communication**: SignalR for live updates and notifications
- **Admin Dashboard**: Server monitoring and logging
- **Gamification**: XP system, levels, and achievements

## Technology Stack

- **Framework**: ASP.NET Core 8.0
- **Database**: SQLite with Entity Framework Core
- **Authentication**: JWT Bearer Tokens
- **Real-time**: SignalR
- **Logging**: Serilog
- **Security**: BCrypt for password hashing

## Getting Started

### Prerequisites

- .NET 8.0 SDK
- SQLite

### Installation

1. Clone the repository
2. Navigate to the backend directory
3. Restore dependencies:
   ```bash
   dotnet restore
   ```

### Configuration

Update `appsettings.json` with your configuration:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=mision-maestra.db"
  },
  "Jwt": {
    "Issuer": "MisionMaestra",
    "Audience": "MisionMaestraApp",
    "Key": "your-super-secret-jwt-key-that-should-be-at-least-32-characters-long"
  }
}
```

### Running the Application

1. Build the application:
   ```bash
   dotnet build
   ```

2. Run the application:
   ```bash
   dotnet run
   ```

The API will be available at `https://localhost:5001` (or `http://localhost:5000`).

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile

### Users

- `GET /api/users` - Get all users
- `GET /api/users/{userId}` - Get user by ID
- `GET /api/users/online` - Get online users
- `GET /api/users/search?searchTerm={term}` - Search users
- `PUT /api/users/{userId}` - Update user
- `DELETE /api/users/{userId}` - Delete user

### Teams

- `POST /api/teams` - Create a new team
- `GET /api/teams/{teamId}` - Get team by ID
- `GET /api/teams/my-teams` - Get current user's teams
- `GET /api/teams` - Get all teams
- `PUT /api/teams/{teamId}` - Update team
- `DELETE /api/teams/{teamId}` - Delete team
- `POST /api/teams/{teamId}/invite` - Invite user to team
- `GET /api/teams/invitations` - Get user's invitations
- `PUT /api/teams/invitations/{invitationId}/respond` - Respond to invitation
- `POST /api/teams/{teamId}/leave` - Leave team
- `DELETE /api/teams/{teamId}/members/{memberId}` - Remove team member

### Tasks

- `POST /api/tasks` - Create a new task
- `GET /api/tasks/{taskId}` - Get task by ID
- `GET /api/tasks/my-tasks` - Get current user's tasks
- `GET /api/tasks/team/{teamId}` - Get team tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/status/{status}` - Get tasks by status
- `GET /api/tasks/priority/{priority}` - Get tasks by priority
- `PUT /api/tasks/{taskId}` - Update task
- `DELETE /api/tasks/{taskId}` - Delete task
- `POST /api/tasks/{taskId}/complete` - Complete task
- `POST /api/tasks/{taskId}/assign` - Assign task to users

### Admin (Requires Admin Role)

- `GET /api/admin/stats` - Get server statistics
- `GET /api/admin/logs` - Get server logs
- `POST /api/admin/logs/cleanup` - Clean up old logs
- `GET /api/admin/users` - Get all users
- `GET /api/admin/teams` - Get all teams
- `GET /api/admin/tasks` - Get all tasks
- `GET /api/admin/online-users` - Get online users
- `POST /api/admin/system/shutdown` - Shutdown system
- `POST /api/admin/system/restart` - Restart system

## SignalR Hub

The application uses SignalR for real-time communication. The hub is available at `/hub/mision-maestra`.

### Hub Methods

- `UpdateUserStatus` - Update user's social battery and mood
- `JoinTeam` - Join a team group
- `LeaveTeam` - Leave a team group
- `SendTeamMessage` - Send message to team
- `TaskUpdated` - Notify about task updates
- `TaskCompleted` - Notify about task completion
- `TeamInvitationSent` - Notify about team invitation
- `KeepAlive` - Keep connection alive

### Client Events

- `UserConnected` - User connected
- `UserDisconnected` - User disconnected
- `UserStatusUpdated` - User status updated
- `TeamMessageReceived` - Team message received
- `TaskUpdated` - Task updated
- `TaskCompleted` - Task completed
- `TeamInvitationReceived` - Team invitation received

## Database Schema

The application uses the following main entities:

- **Users**: User accounts with XP, level, and social battery
- **Teams**: Team groups with leaders and members
- **TeamMembers**: Team membership with roles
- **Tasks**: Tasks with XP, priority, and status
- **TaskAssignments**: Task assignments to users
- **TeamInvitations**: Team invitations with status
- **Achievements**: Gamification achievements
- **UserAchievements**: User's earned achievements
- **ServerLogs**: Application logging
- **OnlineUsers**: Online user tracking

## Security

- Passwords are hashed using BCrypt
- JWT tokens for authentication
- CORS configuration
- Input validation
- Role-based authorization for admin endpoints

## Logging

The application uses Serilog for logging with the following features:

- Console logging
- File logging with daily rotation
- Database logging for audit trails
- Different log levels and categories

## Development

### Adding New Endpoints

1. Create the service interface in `Services/I[ServiceName].cs`
2. Implement the service in `Services/[ServiceName].cs`
3. Create the controller in `Controllers/[ControllerName]Controller.cs`
4. Add the controller to the dependency injection in `Program.cs`

### Database Migrations

The application uses SQLite with EF Core. To create migrations:

```bash
dotnet ef migrations add [MigrationName]
dotnet ef database update
```

## Testing

The API can be tested using:

- Swagger UI available at `/swagger`
- Postman or similar API client
- Integration tests (to be implemented)

## Deployment

The application can be deployed to:

- Azure App Service
- AWS Elastic Beanstalk
- Docker containers
- Any .NET 8 compatible hosting environment