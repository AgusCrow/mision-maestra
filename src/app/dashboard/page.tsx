"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Trophy, 
  Target, 
  Heart, 
  Star, 
  Plus,
  Settings,
  LogOut,
  Rocket,
  Zap,
  Calendar,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

interface Team {
  id: string;
  name: string;
  description?: string;
  userRole: string;
  memberCount: number;
  taskCount: number;
  goalCount: number;
  totalXP: number;
}

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  totalXP: number;
  level: number;
  socialBattery: number;
  mood?: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/auth/signin";
      return;
    }

    if (status === "authenticated") {
      fetchUserData();
      fetchTeams();
    }
  }, [status]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu misión...</p>
        </div>
      </div>
    );
  }

  if (!session || !userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10">
              <img
                src="/logo-mision-maestra.png"
                alt="Misión Maestra Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Misión Maestra
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userProfile.avatar} />
                <AvatarFallback>
                  {userProfile.name?.charAt(0) || userProfile.email.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{userProfile.name || userProfile.email}</p>
                <p className="text-xs text-gray-500">Nivel {userProfile.level}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{userProfile.totalXP}</p>
                  <p className="text-sm text-gray-600">XP Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{userProfile.level}</p>
                  <p className="text-sm text-gray-600">Nivel</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{userProfile.socialBattery}%</p>
                  <p className="text-sm text-gray-600">Batería Social</p>
                </div>
              </div>
              <Progress value={userProfile.socialBattery} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{teams.length}</p>
                  <p className="text-sm text-gray-600">Equipos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teams Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Mis Equipos</h2>
              <Link href="/teams/create">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Equipo
                </Button>
              </Link>
            </div>

            {teams.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Rocket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes equipos aún</h3>
                  <p className="text-gray-600 mb-4">Crea tu primer equipo para comenzar a colaborar</p>
                  <Link href="/teams/create">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Equipo
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teams.map((team) => (
                  <Card key={team.id} className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        <Badge variant={team.userRole === "LEADER" ? "default" : "secondary"}>
                          {team.userRole === "LEADER" ? "Líder" : "Miembro"}
                        </Badge>
                      </div>
                      {team.description && (
                        <CardDescription>{team.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{team.memberCount} miembros</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="h-4 w-4" />
                            <span>{team.taskCount} tareas</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1">
                            <Trophy className="h-4 w-4" />
                            <span>{team.totalXP} XP</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{team.goalCount} objetivos</span>
                          </div>
                        </div>
                        <Button className="w-full mt-4" variant="outline">
                          Ver Equipo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/tasks/create">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Tarea
                  </Button>
                </Link>
                <Link href="/teams/create">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Crear Equipo
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Mood Status */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Estado Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl mb-2">
                    {userProfile.mood || "😊"}
                  </div>
                  <p className="text-sm text-gray-600">
                    {userProfile.mood ? "Estado de ánimo registrado" : "Registra tu estado de ánimo"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}