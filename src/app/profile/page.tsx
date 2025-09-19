"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Loader2, 
  User, 
  Heart, 
  Smile, 
  ArrowLeft, 
  Settings,
  Zap,
  Star,
  TrendingUp,
  Calendar,
  Save,
  Battery
} from "lucide-react";
import Link from "next/link";

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

interface WellnessMetric {
  id: string;
  date: string;
  socialBattery: number;
  mood?: string;
  notes?: string;
}

const moodEmojis = [
  { emoji: "😊", label: "Feliz" },
  { emoji: "😌", label: "Relajado" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😔", label: "Triste" },
  { emoji: "😰", label: "Estresado" },
  { emoji: "😴", label: "Cansado" },
  { emoji: "🤔", label: "Pensativo" },
  { emoji: "😤", label: "Frustrado" },
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wellnessMetrics, setWellnessMetrics] = useState<WellnessMetric[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    avatar: "",
    socialBattery: 50,
    mood: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }

    if (status === "authenticated") {
      fetchUserData();
      fetchWellnessMetrics();
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        setFormData(prev => ({
          ...prev,
          name: data.user.name || "",
          avatar: data.user.avatar || "",
          socialBattery: data.user.socialBattery,
          mood: data.user.mood || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWellnessMetrics = async () => {
    try {
      const response = await fetch("/api/wellness");
      if (response.ok) {
        const data = await response.json();
        setWellnessMetrics(data.wellnessMetrics);
      }
    } catch (error) {
      console.error("Error fetching wellness metrics:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSocialBatteryChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      socialBattery: value
    }));
  };

  const handleMoodSelect = (mood: string) => {
    setFormData(prev => ({
      ...prev,
      mood
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      // Update profile
      const profileResponse = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          avatar: formData.avatar,
          socialBattery: formData.socialBattery,
          mood: formData.mood,
        }),
      });

      if (!profileResponse.ok) {
        throw new Error("Error al actualizar perfil");
      }

      // Update wellness metrics
      const wellnessResponse = await fetch("/api/wellness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          socialBattery: formData.socialBattery,
          mood: formData.mood,
          notes: formData.notes,
        }),
      });

      if (!wellnessResponse.ok) {
        throw new Error("Error al actualizar métricas de bienestar");
      }

      setSuccess("Perfil actualizado exitosamente");
      // Refresh data
      fetchUserData();
      fetchWellnessMetrics();
    } catch (error) {
      setError("Error al actualizar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
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
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Mi Perfil
            </h1>
            <p className="text-gray-600">
              Gestiona tu información y monitorea tu bienestar
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Información Personal
                  </CardTitle>
                  <CardDescription>
                    Actualiza tus datos personales y preferencias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {success && (
                      <Alert className="border-green-200 bg-green-50 text-green-800">
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={userProfile.avatar} />
                        <AvatarFallback className="text-lg">
                          {userProfile.name?.charAt(0) || userProfile.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{userProfile.name || "Sin nombre"}</h3>
                        <p className="text-sm text-gray-600">{userProfile.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary">
                            <Star className="h-3 w-3 mr-1" />
                            Nivel {userProfile.level}
                          </Badge>
                          <Badge variant="outline">
                            <Zap className="h-3 w-3 mr-1" />
                            {userProfile.totalXP} XP
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Tu nombre"
                          disabled={isSaving}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="avatar">URL del Avatar</Label>
                        <Input
                          id="avatar"
                          name="avatar"
                          type="url"
                          value={formData.avatar}
                          onChange={handleChange}
                          placeholder="https://ejemplo.com/avatar.jpg"
                          disabled={isSaving}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">Batería Social</Label>
                        <p className="text-sm text-gray-600 mb-3">
                          ¿Cuánta energía tienes para interactuar con tu equipo?
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Battery className="h-5 w-5 text-red-600" />
                            <Progress value={formData.socialBattery} className="flex-1" />
                            <span className="text-sm font-medium min-w-[3rem]">{formData.socialBattery}%</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>0% - Sin energía</span>
                            <span>100% - Lleno de energía</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={formData.socialBattery}
                            onChange={(e) => handleSocialBatteryChange(parseInt(e.target.value))}
                            className="w-full"
                            disabled={isSaving}
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-base font-medium">Estado de Ánimo</Label>
                        <p className="text-sm text-gray-600 mb-3">
                          ¿Cómo te sientes hoy?
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {moodEmojis.map((mood) => (
                            <button
                              key={mood.emoji}
                              type="button"
                              onClick={() => handleMoodSelect(mood.emoji)}
                              disabled={isSaving}
                              className={`p-3 rounded-lg border-2 transition-colors ${
                                formData.mood === mood.emoji
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="text-2xl mb-1">{mood.emoji}</div>
                              <div className="text-xs text-gray-600">{mood.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notas del Día</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          placeholder="¿Cómo ha sido tu día? ¿Algo importante que mencionar?"
                          disabled={isSaving}
                          rows={3}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Wellness Stats */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2" />
                    Bienestar
                  </CardTitle>
                  <CardDescription>
                    Tu estado actual y tendencias
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {userProfile.mood || "😊"}
                    </div>
                    <p className="text-sm text-gray-600">
                      Estado de ánimo actual
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Batería Social</span>
                      <span className="text-sm text-gray-600">{userProfile.socialBattery}%</span>
                    </div>
                    <Progress value={userProfile.socialBattery} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{wellnessMetrics.length}</div>
                      <div className="text-xs text-gray-600">Registros</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {wellnessMetrics.length > 0 
                          ? Math.round(wellnessMetrics.reduce((sum, m) => sum + m.socialBattery, 0) / wellnessMetrics.length)
                          : 0
                        }%
                      </div>
                      <div className="text-xs text-gray-600">Promedio</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Últimos registros</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {wellnessMetrics.slice(0, 5).map((metric) => (
                        <div key={metric.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <span>{metric.mood || "😊"}</span>
                            <span className="text-gray-600">
                              {new Date(metric.date).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="font-medium">{metric.socialBattery}%</span>
                        </div>
                      ))}
                      {wellnessMetrics.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No hay registros anteriores
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}