"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRealTime } from "@/lib/realtime-context";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Target, 
  Trophy, 
  Heart, 
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Star,
  Zap,
  MessageSquare,
  Bell
} from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description?: string;
  xp: number;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  dueDate?: string;
  createdAt: string;
  creator: {
    id: string;
    name?: string;
    email: string;
  };
  team?: {
    id: string;
    name: string;
  };
}

interface Team {
  id: string;
  name: string;
  description?: string;
  totalXP: number;
  createdAt: string;
  leader: {
    id: string;
    name?: string;
    email: string;
  };
  members: Array<{
    id: string;
    role: "LEADER" | "MEMBER";
    user: {
      id: string;
      name?: string;
      email: string;
      avatar?: string;
    };
  }>;
}

interface TeamInvitation {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  message?: string;
  createdAt: string;
  team: {
    id: string;
    name: string;
  };
  sender: {
    id: string;
    name?: string;
    email: string;
  };
}

export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isConnected, onlineUsers, teamMessages, taskCompletions, teamInvitations } = useRealTime();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    fetchUserTasks();
    fetchUserTeams();
    fetchUserInvitations();
  }, [isAuthenticated, user]);

  const fetchUserTasks = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks/my-tasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const fetchUserTeams = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/teams/my-teams`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeams(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const fetchUserInvitations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/teams/invitations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToInvitation = async (invitationId: string, accept: boolean) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/teams/invitations/${invitationId}/respond`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accept })
      });
      
      if (response.ok) {
        fetchUserInvitations();
        fetchUserTeams();
      }
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingTasks = tasks.filter(task => task.status !== 'COMPLETED');
  const completedTasks = tasks.filter(task => task.status === 'COMPLETED');
  const pendingInvitations = invitations.filter(inv => inv.status === 'PENDING');

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Acceso Requerido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">
              Debes iniciar sesión para acceder al dashboard.
            </p>
            <div className="flex flex-col space-y-2">
              <Link href="/auth/signin">
                <Button className="w-full">Iniciar Sesión</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">Volver al Inicio</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-8 h-8">
              <img
                src="/logo-mision-maestra.png"
                alt="Misión Maestra Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl font-bold">Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm text-gray-600">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
              {pendingInvitations.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingInvitations.length}
                </span>
              )}
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user.name || user.email}</p>
                <p className="text-xs text-gray-500">Nivel {user.level}</p>
              </div>
            </div>

            <Button variant="outline" onClick={logout}>Cerrar Sesión</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ¡Bienvenido de vuelta, {user.name || user.email}!
          </h1>
          <p className="text-xl text-gray-600">
            Sigue completando misiones para subir de nivel y desbloquear nuevos logros.
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nivel</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.level}</div>
              <Progress value={(user.totalXP % 100)} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {user.totalXP % 100}/100 XP para siguiente nivel
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">XP Total</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.totalXP}</div>
              <p className="text-xs text-muted-foreground">
                Puntos de experiencia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Batería Social</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.socialBattery}%</div>
              <Progress value={user.socialBattery} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Nivel de energía social
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground">
                {completedTasks.length} completadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tasks Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Mis Tareas</h2>
              <Link href="/tasks/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Tarea
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {pendingTasks.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <p className="text-gray-600">¡No tienes tareas pendientes!</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Crea una nueva tarea para empezar a ganar XP.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                pendingTasks.slice(0, 5).map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          +{task.xp} XP
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Creada: {new Date(task.createdAt).toLocaleDateString()}</span>
                        {task.dueDate && (
                          <span>Vence: {new Date(task.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {pendingTasks.length > 5 && (
              <div className="text-center">
                <Link href="/tasks">
                  <Button variant="outline">Ver todas las tareas</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Teams */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Mis Equipos</CardTitle>
                  <Link href="/teams/create">
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {teams.length === 0 ? (
                  <p className="text-sm text-gray-600 text-center py-4">
                    No perteneces a ningún equipo aún.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {teams.map((team) => (
                      <div key={team.id} className="flex items-center space-x-3 p-2 rounded-lg border">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {team.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{team.name}</p>
                          <p className="text-xs text-gray-500">
                            {team.members.length} miembros
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invitations */}
            {pendingInvitations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Invitaciones Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingInvitations.map((invitation) => (
                      <div key={invitation.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{invitation.team.name}</p>
                          <Badge variant="outline">Pendiente</Badge>
                        </div>
                        {invitation.message && (
                          <p className="text-xs text-gray-600 mb-3">{invitation.message}</p>
                        )}
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleRespondToInvitation(invitation.id, true)}
                          >
                            Aceptar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRespondToInvitation(invitation.id, false)}
                          >
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Online Users */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usuarios en Línea</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {onlineUsers.slice(0, 8).map((onlineUser) => (
                    <div key={onlineUser.id} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 truncate">
                        {onlineUser.user?.name || onlineUser.user?.email || 'Usuario'}
                      </span>
                    </div>
                  ))}
                </div>
                {onlineUsers.length > 8 && (
                  <p className="text-xs text-gray-500 mt-2">
                    y {onlineUsers.length - 8} más...
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Admin Link */}
            {user.level >= 10 && (
              <Card>
                <CardContent className="pt-6">
                  <Link href="/admin">
                    <Button variant="outline" className="w-full">
                      Panel de Administración
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}