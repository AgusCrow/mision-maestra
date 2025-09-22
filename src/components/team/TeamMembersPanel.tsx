'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  Activity, 
  Smile, 
  Battery, 
  Crown,
  Sword,
  Shield,
  Zap,
  Coffee,
  Moon,
  Sun,
  Heart,
  Brain,
  Target,
  CheckCircle,
  Plus,
  Eye,
  EyeOff,
  Clock,
  BookOpen,
  Code,
  Palette,
  Dumbbell,
  Music,
  Gamepad2,
  Utensils,
  Car,
  Home,
  Briefcase,
  HeartPulse,
  GraduationCap
} from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'

interface TeamMember {
  id: string
  name: string
  email: string
  level: number
  role: 'owner' | 'admin' | 'member'
  isOnline: boolean
  currentActivity?: string
  mood?: 'happy' | 'focused' | 'tired' | 'energetic' | 'stressed' | 'relaxed'
  socialBattery?: number
  coins: number
  experience: number
  showPersonalTasks?: boolean
}

interface Task {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  difficulty: number
  status: 'pending' | 'in_progress' | 'completed'
  assignedToId?: string
  assignedToName?: string
  dueDate?: string
  isPersonal?: boolean
  coins?: number
  experience?: number
}

interface TeamMembersPanelProps {
  teamId: string
  currentUserId: string
}

const moodIcons = {
  happy: Smile,
  focused: Target,
  tired: Moon,
  energetic: Zap,
  stressed: Brain,
  relaxed: Coffee
}

const moodColors = {
  happy: 'text-yellow-500',
  focused: 'text-blue-500',
  tired: 'text-purple-500',
  energetic: 'text-green-500',
  stressed: 'text-red-500',
  relaxed: 'text-teal-500'
}

const moodLabels = {
  happy: 'Feliz',
  focused: 'Concentrado',
  tired: 'Cansado',
  energetic: 'Energético',
  stressed: 'Estresado',
  relaxed: 'Relajado'
}

const moodEmojis = {
  happy: '😊',
  focused: '🎯',
  tired: '😴',
  energetic: '⚡',
  stressed: '😰',
  relaxed: '☕'
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: Sword
}

const roleLabels = {
  owner: 'Líder',
  admin: 'Administrador',
  member: 'Miembro'
}

const activityIcons = {
  'Trabajando': Briefcase,
  'Estudiando': GraduationCap,
  'Ejercicio': Dumbbell,
  'Descansando': HeartPulse,
  'Comiendo': Utensils,
  'Código': Code,
  'Diseño': Palette,
  'Música': Music,
  'Juegos': Gamepad2,
  'Conduciendo': Car,
  'Casa': Home,
  'Reunión': Users,
  'Leyendo': BookOpen,
  'default': Activity
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
}

export function TeamMembersPanel({ teamId, currentUserId }: TeamMembersPanelProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [selectedMemberForTask, setSelectedMemberForTask] = useState<string | null>(null)
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    // Unirse a la sala del equipo
    socket.emit('join-team', teamId)

    // Escuchar actualizaciones de miembros
    const handleMembersUpdate = (updatedMembers: TeamMember[]) => {
      setMembers(updatedMembers)
    }

    const handleMemberActivity = (data: { userId: string; activity: string }) => {
      setMembers(prev => prev.map(member => 
        member.id === data.userId 
          ? { ...member, currentActivity: data.activity }
          : member
      ))
    }

    const handleMemberMood = (data: { userId: string; mood: TeamMember['mood'] }) => {
      setMembers(prev => prev.map(member => 
        member.id === data.userId 
          ? { ...member, mood: data.mood }
          : member
      ))
    }

    const handleSocialBattery = (data: { userId: string; battery: number }) => {
      setMembers(prev => prev.map(member => 
        member.id === data.userId 
          ? { ...member, socialBattery: data.battery }
          : member
      ))
    }

    const handleTaskUpdate = (updatedTasks: Task[]) => {
      setTasks(updatedTasks)
    }

    socket.on('team-members-update', handleMembersUpdate)
    socket.on('member-activity-update', handleMemberActivity)
    socket.on('member-mood-update', handleMemberMood)
    socket.on('social-battery-update', handleSocialBattery)
    socket.on('tasks-update', handleTaskUpdate)

    // Solicitar miembros iniciales y tareas
    socket.emit('get-team-members', teamId)
    socket.emit('get-team-tasks', teamId)

    return () => {
      socket.off('team-members-update', handleMembersUpdate)
      socket.off('member-activity-update', handleMemberActivity)
      socket.off('member-mood-update', handleMemberMood)
      socket.off('social-battery-update', handleSocialBattery)
      socket.off('tasks-update', handleTaskUpdate)
      socket.emit('leave-team', teamId)
    }
  }, [socket, teamId])

  const getBatteryColor = (battery: number) => {
    if (battery >= 70) return 'text-green-500'
    if (battery >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getBatteryLabel = (battery: number) => {
    if (battery >= 70) return 'Alta'
    if (battery >= 40) return 'Media'
    return 'Baja'
  }

  const getActivityIcon = (activity?: string) => {
    if (!activity) return Activity
    return activityIcons[activity as keyof typeof activityIcons] || Activity
  }

  const toggleShowPersonalTasks = (memberId: string) => {
    setMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, showPersonalTasks: !member.showPersonalTasks }
        : member
    ))
  }

  const completeTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        // Emitir actualización a través de socket
        socket?.emit('task-completed', { taskId, teamId })
      }
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  const getMemberTasks = (memberId: string) => {
    return tasks.filter(task => 
      task.assignedToId === memberId && 
      task.status !== 'completed'
    ).sort((a, b) => {
      // Ordenar por prioridad y luego por dificultad
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.difficulty - a.difficulty
    })
  }

  const getVisibleTasks = (memberId: string, showPersonal: boolean) => {
    const memberTasks = getMemberTasks(memberId)
    if (showPersonal) {
      return memberTasks
    }
    return memberTasks.filter(task => !task.isPersonal)
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de crear tarea */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="h-6 w-6" />
          Panel del Equipo
        </h2>
        <Button 
          onClick={() => setShowCreateTask(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {/* Grid de miembros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => {
          const RoleIcon = roleIcons[member.role]
          const MoodIcon = member.mood ? moodIcons[member.mood] : null
          const ActivityIcon = getActivityIcon(member.currentActivity)
          const isCurrentUser = member.id === currentUserId
          const memberTasks = getVisibleTasks(member.id, member.showPersonalTasks || false)

          return (
            <Card 
              key={member.id} 
              className={`bg-white/10 backdrop-blur-sm border-white/20 transition-all ${
                isCurrentUser ? 'ring-2 ring-purple-500' : ''
              } ${member.isOnline ? 'opacity-100' : 'opacity-75'}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`/api/placeholder/avatar/${member.id}`} />
                        <AvatarFallback className="text-lg">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white dark:border-gray-900 ${
                        member.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-white ${isCurrentUser ? 'text-purple-300' : ''}`}>
                          {member.name}
                          {isCurrentUser && <span className="text-xs text-purple-300">(Tú)</span>}
                        </span>
                        <RoleIcon className="h-4 w-4 text-yellow-400" />
                      </div>
                      <div className="text-xs text-purple-200">
                        Nivel {member.level} • {roleLabels[member.role]}
                      </div>
                    </div>
                  </div>
                  <Badge variant={member.isOnline ? "default" : "secondary"} className="text-xs">
                    {member.isOnline ? 'En línea' : 'Ausente'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Actividad Actual con icono grande */}
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="p-4 bg-purple-500/20 rounded-full">
                      <ActivityIcon className="h-8 w-8 text-purple-300" />
                    </div>
                  </div>
                  <div className="text-sm text-purple-200 font-medium">Actividad actual</div>
                  <div className="text-white font-semibold">
                    {member.currentActivity || 'Sin actividad'}
                  </div>
                </div>

                {/* Estado de Ánimo con emoji grande */}
                {member.mood && (
                  <div className="text-center">
                    <div className="text-4xl mb-2">{moodEmojis[member.mood]}</div>
                    <div className="text-sm text-purple-200 font-medium">Estado de ánimo</div>
                    <div className={`font-semibold ${moodColors[member.mood]}`}>
                      {moodLabels[member.mood]}
                    </div>
                  </div>
                )}

                {/* Batería Social */}
                {member.socialBattery !== undefined && (
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <div className="relative">
                        <Battery className="h-8 w-8 text-purple-300" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-xs font-bold ${getBatteryColor(member.socialBattery)}`}>
                            {member.socialBattery}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-purple-200 font-medium">Batería social</div>
                    <Progress 
                      value={member.socialBattery} 
                      className="h-2 mt-2"
                    />
                    <div className={`text-xs font-medium ${getBatteryColor(member.socialBattery)} mt-1`}>
                      {getBatteryLabel(member.socialBattery)}
                    </div>
                  </div>
                )}

                {/* Lista de Pendientes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-purple-200">
                      Pendientes ({memberTasks.length})
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleShowPersonalTasks(member.id)}
                      className="h-6 w-6 p-0 text-purple-300 hover:text-white"
                    >
                      {member.showPersonalTasks ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {memberTasks.length > 0 ? (
                      memberTasks.slice(0, 5).map((task) => (
                        <div 
                          key={task.id} 
                          className="p-2 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">
                                {task.title}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${priorityColors[task.priority]}`}
                                >
                                  {priorityLabels[task.priority]}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span 
                                      key={i} 
                                      className={`text-xs ${
                                        i < task.difficulty ? 'text-yellow-400' : 'text-gray-500'
                                      }`}
                                    >
                                      ⭐
                                    </span>
                                  ))}
                                </div>
                                {task.isPersonal && (
                                  <Badge variant="secondary" className="text-xs">
                                    Personal
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => completeTask(task.id)}
                              className="h-6 w-6 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-purple-300 text-sm py-4">
                        No hay tareas pendientes
                      </div>
                    )}
                  </div>

                  {memberTasks.length > 5 && (
                    <div className="text-center mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-purple-300 hover:text-white"
                      >
                        Ver todas ({memberTasks.length})
                      </Button>
                    </div>
                  )}
                </div>

                {/* Botón para asignar tarea */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedMemberForTask(member.id)
                    setShowCreateTask(true)
                  }}
                  className="w-full border-purple-500 text-purple-300 hover:bg-purple-500 hover:text-white"
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Asignar tarea
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal para crear tarea */}
      {showCreateTask && (
        <CreateTaskModal
          teamId={teamId}
          userId={currentUserId}
          onClose={() => {
            setShowCreateTask(false)
            setSelectedMemberForTask(null)
          }}
          onSuccess={() => {
            setShowCreateTask(false)
            setSelectedMemberForTask(null)
            // Aquí podrías recargar las tareas o emitir un evento socket
            socket?.emit('get-team-tasks', teamId)
          }}
        />
      )}
    </div>
  )
}