"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Target, 
  Calendar, 
  Zap, 
  Users, 
  Clock,
  CheckCircle,
  Circle,
  AlertTriangle,
  MessageCircle,
  Plus,
  Send,
  Loader2,
  UserPlus,
  UserMinus
} from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description?: string;
  xp: number;
  dueDate?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  category?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  isPersonal: boolean;
  isRecurring: boolean;
  recurringInterval?: string;
  creator: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  team?: {
    id: string;
    name: string;
  };
  goal?: {
    id: string;
    title: string;
  };
  assignments: Array<{
    id: string;
    user: {
      id: string;
      name?: string;
      email: string;
      avatar?: string;
    };
    completed: boolean;
    completedAt?: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name?: string;
      email: string;
      avatar?: string;
    };
  }>;
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  attachments: Array<{
    id: string;
    filename: string;
    fileUrl: string;
    fileSize?: number;
  }>;
}

interface TeamMember {
  id: string;
  user: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  role: string;
}

export default function TaskDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  useEffect(() => {
    if (session) {
      fetchTask();
    }
  }, [session, taskId]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data.task);
        
        // If it's a team task, fetch team members
        if (data.task.team) {
          fetchTeamMembers(data.task.team.id);
        }
      } else {
        router.push("/tasks");
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      router.push("/tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members`);
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.members);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const updateTaskStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchTask();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setUpdating(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment("");
        await fetchTask();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const assignTask = async (userId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setShowAssignModal(false);
        await fetchTask();
      }
    } catch (error) {
      console.error("Error assigning task:", error);
    }
  };

  const unassignTask = async (userId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign?userId=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchTask();
      }
    } catch (error) {
      console.error("Error unassigning task:", error);
    }
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;

    setAddingSubtask(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newSubtask }),
      });

      if (response.ok) {
        setNewSubtask("");
        await fetchTask();
      }
    } catch (error) {
      console.error("Error adding subtask:", error);
    } finally {
      setAddingSubtask(false);
    }
  };

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        await fetchTask();
      }
    } catch (error) {
      console.error("Error updating subtask:", error);
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta subtarea?")) return;

    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchTask();
      }
    } catch (error) {
      console.error("Error deleting subtask:", error);
    }
  };

  const deleteTask = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta misión?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push(task?.team ? `/dashboard/team/${task.team.id}/tasks` : "/tasks");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "IN_PROGRESS":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "CANCELLED":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isCreator = task?.creator.id === session?.user?.id;
  const isAssigned = task?.assignments.some(a => a.user.id === session?.user?.id);
  const canEdit = isCreator || (task?.team && session?.user?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando misión...</p>
        </div>
      </div>
    );
  }

  if (!task) {
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
          <div className="flex items-center space-x-3">
            <Link href={task.team ? `/dashboard/team/${task.team.id}/tasks` : "/tasks"}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            {canEdit && (
              <>
                <Link href={`/tasks/${task.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={deleteTask}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Detalles principales */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <CardTitle className="text-2xl">{task.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority === "HIGH" ? "Alta" : task.priority === "MEDIUM" ? "Media" : "Baja"}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status === "PENDING" ? "Pendiente" : 
                           task.status === "IN_PROGRESS" ? "En Progreso" : 
                           task.status === "COMPLETED" ? "Completado" : "Cancelado"}
                        </Badge>
                        {task.isRecurring && (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Recurrente
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Selector de estado */}
                  <Select value={task.status} onValueChange={updateTaskStatus} disabled={updating}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pendiente</SelectItem>
                      <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                      <SelectItem value="COMPLETED">Completado</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {task.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Descripción</h3>
                    <p className="text-gray-700">{task.description}</p>
                  </div>
                )}

                {/* Información adicional */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-gray-600">XP</p>
                      <p className="font-semibold">{task.xp}</p>
                    </div>
                  </div>
                  
                  {task.dueDate && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Fecha Límite</p>
                        <p className="font-semibold">{formatDate(task.dueDate)}</p>
                      </div>
                    </div>
                  )}
                  
                  {task.category && (
                    <div className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Categoría</p>
                        <p className="font-semibold">{task.category}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Creador y equipo */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={task.creator.avatar} />
                      <AvatarFallback>
                        {task.creator.name?.charAt(0) || task.creator.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-gray-600">Creado por</p>
                      <p className="font-medium">{task.creator.name || task.creator.email}</p>
                    </div>
                  </div>
                  
                  {task.team && (
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Equipo</p>
                        <p className="font-medium">{task.team.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Asignaciones */}
            {task.team && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Miembros Asignados</span>
                    {canEdit && (
                      <Button size="sm" onClick={() => setShowAssignModal(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Asignar
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {task.assignments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No hay miembros asignados</p>
                  ) : (
                    <div className="space-y-3">
                      {task.assignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={assignment.user.avatar} />
                              <AvatarFallback>
                                {assignment.user.name?.charAt(0) || assignment.user.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{assignment.user.name || assignment.user.email}</p>
                              {assignment.completed && (
                                <p className="text-sm text-green-600">Completado</p>
                              )}
                            </div>
                          </div>
                          {(canEdit || assignment.user.id === session?.user?.id) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => unassignTask(assignment.user.id)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Comentarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Comentarios ({task.comments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nuevo comentario */}
                <div className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.avatar} />
                    <AvatarFallback>
                      {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Añade un comentario..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                    />
                    <Button
                      size="sm"
                      onClick={addComment}
                      disabled={submittingComment || !newComment.trim()}
                    >
                      {submittingComment ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Comentar
                    </Button>
                  </div>
                </div>

                {/* Lista de comentarios */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {task.comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user.avatar} />
                        <AvatarFallback>
                          {comment.user.name?.charAt(0) || comment.user.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{comment.user.name || comment.user.email}</span>
                          <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-gray-700 mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Acciones rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Misión
                </Button>
                {task.team && canEdit && (
                  <Button className="w-full justify-start" variant="outline" onClick={() => setShowAssignModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Asignar Miembros
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Progreso */}
            <Card>
              <CardHeader>
                <CardTitle>Progreso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Estado</span>
                    <span className="font-medium">
                      {task.status === "PENDING" ? "Pendiente" : 
                       task.status === "IN_PROGRESS" ? "En Progreso" : 
                       task.status === "COMPLETED" ? "Completado" : "Cancelado"}
                    </span>
                  </div>
                  
                  {task.assignments.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Asignados</span>
                      <span className="font-medium">{task.assignments.length} miembros</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span>Comentarios</span>
                    <span className="font-medium">{task.comments.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subtareas */}
            <Card>
              <CardHeader>
                <CardTitle>Subtareas ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Nueva subtarea */}
                {canEdit && (
                  <div className="flex space-x-2 mb-4">
                    <Input
                      placeholder="Añadir subtarea..."
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                      disabled={addingSubtask}
                    />
                    <Button
                      size="sm"
                      onClick={addSubtask}
                      disabled={addingSubtask || !newSubtask.trim()}
                    >
                      {addingSubtask ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Lista de subtareas */}
                {task.subtasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    {canEdit ? "Añade subtareas para desglosar esta misión" : "No hay subtareas"}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {task.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center justify-between group">
                        <div className="flex items-center space-x-3 flex-1">
                          <button
                            onClick={() => toggleSubtask(subtask.id, !subtask.completed)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              subtask.completed 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {subtask.completed && <CheckCircle className="h-3 w-3" />}
                          </button>
                          <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                            {subtask.title}
                          </span>
                        </div>
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteSubtask(subtask.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de asignación */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-h-96 overflow-y-auto">
            <CardHeader>
              <CardTitle>Asignar Misión</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teamMembers
                  .filter(member => !task.assignments.some(a => a.user.id === member.user.id))
                  .map((member) => (
                    <Button
                      key={member.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => assignTask(member.user.id)}
                    >
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={member.user.avatar} />
                        <AvatarFallback className="text-xs">
                          {member.user.name?.charAt(0) || member.user.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {member.user.name || member.user.email}
                    </Button>
                  ))}
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}