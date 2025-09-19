"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Plus, 
  Target, 
  Calendar, 
  Zap, 
  Users, 
  Clock,
  Loader2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

interface Team {
  id: string;
  name: string;
  userRole: string;
}

interface Goal {
  id: string;
  title: string;
  targetXP: number;
  currentXP: number;
}

export default function CreateTaskPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
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
    goalId: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchTeams();
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedTeam) {
      fetchGoals(selectedTeam);
    } else {
      setGoals([]);
    }
  }, [selectedTeam]);

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

  const fetchGoals = async (teamId: string) => {
    try {
      const response = await fetch(`/api/goals?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        teamId: selectedTeam || undefined,
        goalId: formData.goalId || undefined,
      };

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(selectedTeam ? `/dashboard/team/${selectedTeam}/tasks` : "/dashboard");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error al crear la tarea");
      }
    } catch (error) {
      setError("Error al crear la tarea");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Crear Nueva Misión</h1>
          <p className="text-gray-600">Transforma tu tarea en una misión emocionante</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Detalles de la Misión</span>
            </CardTitle>
            <CardDescription>
              Completa los campos para crear tu nueva misión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="title">Título de la Misión *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Ej: Completar informe trimestral"
                  required
                  disabled={loading}
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe los detalles de tu misión..."
                  rows={3}
                  disabled={loading}
                />
              </div>

              {/* Tipo de Tarea */}
              <div className="space-y-2">
                <Label>Tipo de Misión</Label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={formData.isPersonal}
                      onCheckedChange={(checked) => handleInputChange("isPersonal", checked)}
                      disabled={loading}
                    />
                    <span>Personal</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={!formData.isPersonal}
                      onCheckedChange={(checked) => handleInputChange("isPersonal", !checked)}
                      disabled={loading}
                    />
                    <span>De Equipo</span>
                  </label>
                </div>
              </div>

              {/* Equipo (solo para tareas de equipo) */}
              {!formData.isPersonal && (
                <div className="space-y-2">
                  <Label htmlFor="team">Equipo</Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un equipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>{team.name}</span>
                            <Badge variant={team.userRole === "LEADER" ? "default" : "secondary"}>
                              {team.userRole === "LEADER" ? "Líder" : "Miembro"}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* XP y Prioridad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="xp">Puntos de Experiencia (XP)</Label>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    <Input
                      id="xp"
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.xp}
                      onChange={(e) => handleInputChange("xp", parseInt(e.target.value))}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Baja</SelectItem>
                      <SelectItem value="MEDIUM">Media</SelectItem>
                      <SelectItem value="HIGH">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fecha Límite */}
              <div className="space-y-2">
                <Label htmlFor="dueDate">Fecha Límite</Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange("dueDate", e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Categoría */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  placeholder="Ej: Trabajo, Personal, Estudio..."
                  disabled={loading}
                />
              </div>

              {/* Tarea Recurrente */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={formData.isRecurring}
                    onCheckedChange={(checked) => handleInputChange("isRecurring", checked)}
                    disabled={loading}
                  />
                  <span>Misión Recurrente</span>
                </label>
              </div>

              {formData.isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="recurringInterval">Intervalo</Label>
                  <Select value={formData.recurringInterval} onValueChange={(value) => handleInputChange("recurringInterval", value)} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el intervalo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Objetivo (solo para tareas de equipo) */}
              {selectedTeam && goals.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="goal">Vincular a Objetivo</Label>
                  <Select value={formData.goalId} onValueChange={(value) => handleInputChange("goalId", value)} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un objetivo (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {goals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{goal.title}</span>
                            <span className="text-xs text-gray-500">{goal.currentXP}/{goal.targetXP} XP</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Botón de Envío */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading || !formData.title.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando Misión...
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
  );
}