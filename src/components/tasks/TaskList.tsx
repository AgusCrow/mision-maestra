'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Target, 
  Star, 
  Coins, 
  Calendar,
  User,
  CheckCircle,
  Circle,
  Clock,
  MapPin,
  Crown,
  Shield,
  Sword
} from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  difficulty: 1 | 2 | 3 | 4 | 5
  assignedTo?: {
    id: string
    name: string
    email: string
    role: 'owner' | 'admin' | 'member'
  }
  createdBy: {
    id: string
    name: string
    email: string
    role: 'owner' | 'admin' | 'member'
  }
  dueDate?: string
  teamId: string
  createdAt: string
  updatedAt: string
  estimatedCoins: number
  estimatedExperience: number
  estimatedPoints: number
}

interface TaskListProps {
  teamId: string
  userId: string
}

export function TaskList({ teamId, userId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')
  const { socket } = useSocket()

  useEffect(() => {
    fetchTasks()
  }, [teamId])

  useEffect(() => {
    if (!socket) return

    const handleTaskUpdate = (updatedTask: Task) => {
      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ))
    }

    const handleTaskCreated = (newTask: Task) => {
      setTasks(prev => [newTask, ...prev])
    }

    socket.on('task-updated', handleTaskUpdate)
    socket.on('task-created', handleTaskCreated)

    return () => {
      socket.off('task-updated', handleTaskUpdate)
      socket.off('task-created', handleTaskCreated)
    }
  }, [socket])

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?teamId=${teamId}`)
      if (response.ok) {
        const tasksData = await response.json()
        setTasks(tasksData)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        const updatedTask = await response.json()
        setTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ))
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Alta'
      case 'medium': return 'Media'
      case 'low': return 'Baja'
      default: return priority
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'pending': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completada'
      case 'in_progress': return 'En Progreso'
      case 'pending': return 'Pendiente'
      default: return status
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return Crown
      case 'admin': return Shield
      default: return Sword
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    return task.status === filter
  })

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todas ({tasks.length})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pendientes ({tasks.filter(t => t.status === 'pending').length})
        </Button>
        <Button
          variant={filter === 'in_progress' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('in_progress')}
        >
          En Progreso ({tasks.filter(t => t.status === 'in_progress').length})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completadas ({tasks.filter(t => t.status === 'completed').length})
        </Button>
      </div>

      {/* Lista de Tareas */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay misiones para mostrar</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card 
              key={task.id} 
              className={`transition-all ${
                task.status === 'completed' ? 'opacity-75' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => {
                          const newStatus = task.status === 'completed' ? 'pending' : 
                                          task.status === 'pending' ? 'in_progress' : 'completed'
                          updateTaskStatus(task.id, newStatus)
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <CardTitle className={`text-lg ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${getPriorityColor(task.priority)} text-white`}>
                        {getPriorityLabel(task.priority)}
                      </Badge>
                      <Badge className={`${getStatusColor(task.status)} text-white`}>
                        {getStatusLabel(task.status)}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= task.difficulty ? 'text-yellow-500 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {task.dueDate && isOverdue(task.dueDate) && task.status !== 'completed' && (
                        <Badge variant="destructive">
                          <Clock className="h-3 w-3 mr-1" />
                          Vencida
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-yellow-600">
                      <Coins className="h-4 w-4" />
                      {task.estimatedCoins}
                    </div>
                    <div className="text-xs text-gray-500">
                      {task.estimatedExperience} EXP
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {task.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {task.description}
                  </p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {/* Asignado a */}
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Asignado a:</span>
                    </div>
                    {task.assignedTo ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {task.assignedTo.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-1">
                          <span>{task.assignedTo.name}</span>
                          {(() => {
                            const RoleIcon = getRoleIcon(task.assignedTo.role)
                            return <RoleIcon className="h-3 w-3 text-gray-500" />
                          })()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Sin asignar</span>
                    )}
                  </div>

                  {/* Creado por */}
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Creado por:</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {task.createdBy.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-1">
                        <span>{task.createdBy.name}</span>
                        {(() => {
                          const RoleIcon = getRoleIcon(task.createdBy.role)
                          return <RoleIcon className="h-3 w-3 text-gray-500" />
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Fecha límite */}
                  {task.dueDate && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Fecha límite:</span>
                      </div>
                      <span className={`mt-1 block ${isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-red-500' : ''}`}>
                        {new Date(task.dueDate).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}