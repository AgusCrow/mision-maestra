"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import WellnessTracker from "@/components/wellness-tracker";
import { 
  User, 
  Mail, 
  Calendar, 
  Trophy, 
  Star,
  Settings,
  ArrowLeft,
  Edit,
  Save,
  Camera,
  Zap,
  Target,
  Users,
  Award
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  totalXP: number;
  level: number;
  socialBattery: number;
  mood?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    avatar: "",
    socialBattery: 50,
    mood: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchUserProfile();
    }
  }, [status, router]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setEditForm({
          name: data.user.name || "",
          avatar: data.user.avatar || "",
          socialBattery: data.user.socialBattery,
          mood: data.user.mood || "",
        });
      } else {
        setError("Error al cargar el perfil");
      }
    } catch (error) {
      setError("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setShowEditProfile(false);
        setSuccess("Perfil actualizado exitosamente");
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Error al actualizar el perfil");
      }
    } catch (error) {
      setError("Error al actualizar el perfil");
    }
  };

  const getNextLevelXP = (level: number) => level * 100;
  const getProgressToNextLevel = (totalXP: number, level: number) => {
    const currentLevelXP = (level - 1) * 100;
    const nextLevelXP = level * 100;
    return ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">No se pudo cargar el perfil</p>
            <Button onClick={() => router.push("/dashboard")} className="mt-4">
              Volver al Dashboard
            </Button>
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
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold">Mi Perfil</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Información Personal
                  </CardTitle>
                  <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Perfil</DialogTitle>
                        <DialogDescription>
                          Actualiza tu información personal
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={updateProfile} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Nombre</Label>
                          <Input
                            id="name"
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="avatar">URL del Avatar</Label>
                          <Input
                            id="avatar"
                            value={editForm.avatar}
                            onChange={(e) => setEditForm(prev => ({ ...prev, avatar: e.target.value }))}
                            placeholder="https://ejemplo.com/avatar.jpg"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={user.email}
                            disabled
                            className="bg-gray-50"
                          />
                          <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
                        </div>
                        {error && (
                          <Alert className="border-red-200 bg-red-50 text-red-800">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowEditProfile(false)}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit">
                            <Save className="h-4 w-4 mr-2" />
                            Guardar Cambios
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-2xl">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-0 h-8 w-8 rounded-full p-0"
                      onClick={() => setShowEditProfile(true)}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-gray-600">{user.email}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Miembro desde</span>
                    </div>
                    <span className="text-sm font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Level Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  Progreso de Nivel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-yellow-600 mb-1">
                    Nivel {user.level}
                  </div>
                  <div className="text-sm text-gray-600">
                    {user.totalXP} XP Total
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso al nivel {user.level + 1}</span>
                    <span>{getNextLevelXP(user.level) - user.totalXP} XP restantes</span>
                  </div>
                  <Progress 
                    value={getProgressToNextLevel(user.totalXP, user.level)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Wellness and Stats */}
          <div className="lg:col-span-2">
            {/* Wellness Tracker */}
            <WellnessTracker />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{user.totalXP}</div>
                  <div className="text-sm text-gray-600">XP Total</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{user.level}</div>
                  <div className="text-sm text-gray-600">Nivel Actual</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl mb-2">
                    {user.mood || "😐"}
                  </div>
                  <div className="text-sm font-medium mb-1">
                    {user.mood ? "Registrado" : "No registrado"}
                  </div>
                  <div className="text-sm text-gray-600">Estado de Ánimo</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}