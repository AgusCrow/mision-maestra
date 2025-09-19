"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Target, 
  ArrowLeft, 
  Plus, 
  Users, 
  Calendar,
  Zap,
  Star,
  Clock,
  Flag
} from "lucide-react";
import Link from "next/link";

interface Team {
  id: string;
  name: string;
  userRole: string;
}

export default function CreateTaskPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    xp: 10,
    dueDate: "",
    priority: "MEDIUM",
    category: "",
    isPersonal: true,
    isRecurring: false,
    recurringInterval: "",
    teamId: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }

    if (status === "authenticated") {
      fetchTeams();
    }
  }, [status, router]);

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked,
      // Reset team selection if switching to personal
      ...(name === "isPersonal" && checked ? { teamId: "" } : {})
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate || null,
          recurringInterval: formData.isRecurring ? formData.recurringInterval : null,
          teamId: formData.isPersonal ? null : formData.teamId || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("¡Tarea creada exitosamente! Redirigiendo...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setError(data.error || "Error al crear la tarea");
      }
    } catch (error) {
      setError("Error al crear la tarea");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
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
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-12 h-12">
                <img
                  src="/logo-mision-maestra.png"
                  alt="Misión Maestra Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Crear Nueva Misión
            </h1>
            <p className="text-gray-600">
              Transforma tus tareas en misiones emocionantes con recompensas de XP
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Detalles de la Misión
              </CardTitle>
              <CardDescription>
                Define los aspectos de tu nueva tarea gamificada
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título de la Misión *</Label>
                    <Input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Ej: Implementar sistema de login"
                      required
                      disabled={isLoading}
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="xp">Puntos de Experiencia (XP)</Label>
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      <Input
                        id="xp"
                        name="xp"
                        type="number"
                        value={formData.xp}
                        onChange={handleChange}
                        min="1"
                        max="1000"
                        required
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Badge variant="secondary">{formData.xp} XP</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe los detalles y requisitos de la misión..."
                    disabled={isLoading}
                    rows={4}
                    maxLength={1000}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => handleSelectChange("priority", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">
                          <div className="flex items-center space-x-2">
                            <Flag className="h-4 w-4 text-green-600" />
                            <span>Baja</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="MEDIUM">
                          <div className="flex items-center space-x-2">
                            <Flag className="h-4 w-4 text-yellow-600" />
                            <span>Media</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="HIGH">
                          <div className="flex items-center space-x-2">
                            <Flag className="h-4 w-4 text-red-600" />
                            <span>Alta</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Fecha Límite</Label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <Input
                        id="dueDate"
                        name="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Input
                    id="category"
                    name="category"
                    type="text"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="Ej: Desarrollo, Diseño, Marketing, Reunión"
                    disabled={isLoading}
                    maxLength={50}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPersonal"
                      checked={formData.isPersonal}
                      onCheckedChange={(checked) => handleCheckboxChange("isPersonal", checked as boolean)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="isPersonal" className="text-sm font-medium">
                      Misión Personal
                    </Label>
                  </div>

                  {!formData.isPersonal && teams.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="teamId">Equipo</Label>
                      <Select
                        value={formData.teamId}
                        onValueChange={(value) => handleSelectChange("teamId", value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un equipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4" />
                                <span>{team.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {team.userRole === "LEADER" ? "Líder" : "Miembro"}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onCheckedChange={(checked) => handleCheckboxChange("isRecurring", checked as boolean)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="isRecurring" className="text-sm font-medium">
                      Misión Recurrente
                    </Label>
                  </div>

                  {formData.isRecurring && (
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="recurringInterval">Intervalo de Recurrencia</Label>
                      <Select
                        value={formData.recurringInterval}
                        onValueChange={(value) => handleSelectChange("recurringInterval", value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona intervalo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diaria</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Recompensas de la Misión</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <span className="text-blue-800">
                        {formData.xp} XP al completar
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-800">
                        {formData.priority === "HIGH" ? "Alta prioridad" : 
                         formData.priority === "MEDIUM" ? "Prioridad media" : "Baja prioridad"}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isLoading || !formData.title.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando misión...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Misión
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}