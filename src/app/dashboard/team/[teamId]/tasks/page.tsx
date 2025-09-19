"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Target, 
  Trophy, 
  Calendar, 
  Clock,
  User,
  Users,
  CheckCircle,
  Circle,
  AlertTriangle,
  MessageCircle,
  Paperclip,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowLeft
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  xp: number;
  dueDate?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  category?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  creator: {
    id: string;
    name: string;
    avatar?: string;
  };
  team?: {
    id: string;
    name: string;
  };
  assignments: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
    completed: boolean;
  }>;
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  comments: Array<{
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
    createdAt: string;
  }>;
  createdAt: string;
}

interface TeamMember {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  role: "LEADER" | "MEMBER";
}

export default function TeamTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    xp: 10,
    dueDate: "",
    priority: "MEDIUM" as const,
    category: "",
    assignedUserIds: [] as string[],
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && teamId) {
      fetchTasks();
      fetchTeamMembers();
    }
  }, [status, router, teamId]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      } else {
        setError("Error al cargar las tareas");
      }
    } catch (error) {
      setError("Error al cargar las tareas");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/teams`);
      if (response.ok) {
        const data = await response.json();
        const currentTeam = data.teams.find((team: any) => team.id === teamId);
        if (currentTeam) {
          setTeamMembers(currentTeam.members);
        }
      }
    } catch (error) {
      console.error("Error al cargar miembros del equipo:", error);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newTask,
          teamId,
          isPersonal: false,
        }),
      });

      if (response.ok) {
        setShowCreateTask(false);
        setNewTask({
          title: "",
          description: "",
          xp: 10,
          dueDate: "",
          priority: "MEDIUM",
          category: "",
          assignedUserIds: [],
        });
        fetchTasks();
      } else {
        const data = await response.json();
        setError(data.error || "Error al crear la tarea");
      }
    } catch (error) {
      setError("Error al crear la tarea");
    }
  };

  const updateTask = async (taskId: string, updates: any) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchTasks();
      } else {
        const data = await response.json();
        setError(data.error || "Error al actualizar la tarea");
      }
    } catch (error) {
      setError("Error al actualizar la tarea");
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTasks();
      } else {
        const data = await response.json();
        setError(data.error || "Error al eliminar la tarea");
      }
    } catch (error) {
      setError("Error al eliminar la tarea");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-red-100 text-red-800";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800";
      case "LOW": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tareas...</p>
        </div>
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
            <h1 className="text-2xl font-bold">Tareas del Equipo</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Tarea
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Tarea</DialogTitle>
                  <DialogDescription>
                    Crea una nueva tarea para tu equipo
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={createTask} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={newTask.title}
                        onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Título de la tarea"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="xp">Puntos de Experiencia</Label>
                      <Input
                        id="xp"
                        type="number"
                        min="1"
                        max="1000"
                        value={newTask.xp}
                        onChange={(e) => setNewTask(prev => ({ ...prev, xp: parseInt(e.target.value) || 10 }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descripción de la tarea..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="priority">Prioridad</Label>
                      <Select value={newTask.priority} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}>
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
                    <div>
                      <Label htmlFor="category">Categoría</Label>
                      <Input
                        id="category"
                        value={newTask.category}
                        onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="Ej: Frontend, Diseño"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dueDate">Fecha Límite</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Asignar a miembros</Label>
                    <div className="space-y-2 mt-2">
                      {teamMembers.map((member) => (
                        <div key={member.user.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`member-${member.user.id}`}
                            checked={newTask.assignedUserIds.includes(member.user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewTask(prev => ({
                                  ...prev,
                                  assignedUserIds: [...prev.assignedUserIds, member.user.id]
                                }));
                              } else {
                                setNewTask(prev => ({
                                  ...prev,
                                  assignedUserIds: prev.assignedUserIds.filter(id => id !== member.user.id)
                                }));
                              }
                            }}
                          />
                          <label htmlFor={`member-${member.user.id}`} className="flex items-center space-x-2 cursor-pointer">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member.user.avatar} />
                              <AvatarFallback className="text-xs">
                                {member.user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{member.user.name}</span>
                            {member.role === "LEADER" && (
                              <Badge variant="secondary" className="text-xs">Líder</Badge>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
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
                      onClick={() => setShowCreateTask(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={!newTask.title.trim()}
                    >
                      Crear Tarea
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tasks Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{tasks.length}</div>
              <div className="text-sm text-gray-600">Total Tareas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {tasks.filter(t => t.status === "COMPLETED").length}
              </div>
              <div className="text-sm text-gray-600">Completadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {tasks.filter(t => t.status === "IN_PROGRESS").length}
              </div>
              <div className="text-sm text-gray-600">En Progreso</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {tasks.reduce((sum, task) => sum + task.xp, 0)}
              </div>
              <div className="text-sm text-gray-600">XP Total</div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <Card className="text-center p-8">
              <CardContent>
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay tareas aún</h3>
                <p className="text-gray-600 mb-4">
                  Crea la primera tarea para tu equipo
                </p>
                <Button onClick={() => setShowCreateTask(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Tarea
                </Button>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <button
                          onClick={() => updateTask(task.id, { 
                            status: task.status === "COMPLETED" ? "PENDING" : "COMPLETED" 
                          })}
                          className="flex-shrink-0"
                        >
                          {task.status === "COMPLETED" ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                        <div className="flex-1">
                          <h3 className={`text-lg font-medium ${task.status === "COMPLETED" ? "line-through text-gray-500" : ""}`}>
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority === "HIGH" ? "Alta" : task.priority === "MEDIUM" ? "Media" : "Baja"}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status === "COMPLETED" ? "Completada" : 
                           task.status === "IN_PROGRESS" ? "En Progreso" :
                           task.status === "CANCELLED" ? "Cancelada" : "Pendiente"}
                        </Badge>
                        {task.category && (
                          <Badge variant="outline">{task.category}</Badge>
                        )}
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Trophy className="h-4 w-4" />
                          <span>{task.xp} XP</span>
                        </div>
                        {task.dueDate && (
                          <div className={`flex items-center space-x-1 text-sm ${isOverdue(task.dueDate) ? "text-red-600" : "text-gray-600"}`}>
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            {isOverdue(task.dueDate) && <AlertTriangle className="h-4 w-4" />}
                          </div>
                        )}
                      </div>

                      {/* Assignments */}
                      {task.assignments.length > 0 && (
                        <div className="flex items-center space-x-2 mb-3">
                          <Users className="h-4 w-4 text-gray-500" />
                          <div className="flex -space-x-2">
                            {task.assignments.map((assignment) => (
                              <Avatar key={assignment.id} className="h-6 w-6 border-2 border-white">
                                <AvatarImage src={assignment.user.avatar} />
                                <AvatarFallback className="text-xs">
                                  {assignment.user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Subtasks */}
                      {task.subtasks.length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm text-gray-600 mb-1">
                            Subtareas ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
                          </div>
                          <div className="space-y-1">
                            {task.subtasks.slice(0, 3).map((subtask) => (
                              <div key={subtask.id} className="flex items-center space-x-2 text-sm">
                                <Checkbox checked={subtask.completed} readOnly />
                                <span className={subtask.completed ? "line-through text-gray-500" : ""}>
                                  {subtask.title}
                                </span>
                              </div>
                            ))}
                            {task.subtasks.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{task.subtasks.length - 3} más...
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Comments */}
                      {task.comments.length > 0 && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MessageCircle className="h-4 w-4" />
                          <span>{task.comments.length} comentario{task.comments.length !== 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingTask(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.creator.avatar} />
                        <AvatarFallback className="text-xs">
                          {task.creator.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>Creado por {task.creator.name}</span>
                      <span>•</span>
                      <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}