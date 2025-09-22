'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Crown, 
  Sword, 
  Shield, 
  Plus,
  Map,
  Target,
  Coins,
  Star,
  Activity
} from 'lucide-react'
import { TeamMembersPanel } from '@/components/team/TeamMembersPanel'
import { MemberStatusControls } from '@/components/team/MemberStatusControls'
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'
import { TaskList } from '@/components/tasks/TaskList'
import { useSocket } from '@/hooks/useSocket'

interface Team {
  id: string
  name: string
  description: string
  level: number
  totalCoins: number
  totalExperience: number
  memberCount: number
  maxMembers: number
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
  level: number
  role: 'owner' | 'admin' | 'member'
  coins: number
  experience: number
}

export default function TeamPage() {
  const [team, setTeam] = useState<Team | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const { socket } = useSocket()

  useEffect(() => {
    // Obtener información del equipo y usuario
    const fetchTeamData = async () => {
      try {
        const [teamResponse, userResponse] = await Promise.all([
          fetch('/api/teams/current'),
          fetch('/api/users/me')
        ])

        if (teamResponse.ok) {
          const teamData = await teamResponse.json()
          setTeam(teamData)
        }

        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData)
        }
      } catch (error) {
        console.error('Error fetching team data:', error)
      }
    }

    fetchTeamData()
  }, [])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return Crown
      case 'admin': return Shield
      default: return Sword
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Líder'
      case 'admin': return 'Administrador'
      default: return 'Miembro'
    }
  }

  if (!team || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Cargando información del equipo...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header del Equipo */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Map className="h-8 w-8" />
                  {team.name}
                </CardTitle>
                <p className="text-purple-200 mt-1">{team.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-white font-semibold">Nivel {team.level}</div>
                  <div className="text-sm text-purple-200">Guilda</div>
                </div>
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`/api/placeholder/team/${team.id}`} />
                  <AvatarFallback className="text-2xl">
                    {team.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-yellow-400">
                  <Coins className="h-5 w-5" />
                  <span className="text-2xl font-bold">{team.totalCoins}</span>
                </div>
                <div className="text-sm text-purple-200">Monedas Totales</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <Star className="h-5 w-5" />
                  <span className="text-2xl font-bold">{team.totalExperience}</span>
                </div>
                <div className="text-sm text-purple-200">Experiencia</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <Users className="h-5 w-5" />
                  <span className="text-2xl font-bold">{team.memberCount}/{team.maxMembers}</span>
                </div>
                <div className="text-sm text-purple-200">Miembros</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-purple-400">
                  <Target className="h-5 w-5" />
                  <span className="text-2xl font-bold">{user.level}</span>
                </div>
                <div className="text-sm text-purple-200">Tu Nivel</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs principales */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10">
            <TabsTrigger value="dashboard" className="text-white data-[state=active]:bg-purple-600">
              Panel del Equipo
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-white data-[state=active]:bg-purple-600">
              Misiones
            </TabsTrigger>
            <TabsTrigger value="members" className="text-white data-[state=active]:bg-purple-600">
              Miembros
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <TeamMembersPanel teamId={team.id} currentUserId={user.id} />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Target className="h-6 w-6" />
                Misiones del Equipo
              </h2>
              <Button 
                onClick={() => setShowCreateTask(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Misión
              </Button>
            </div>
            <TaskList teamId={team.id} userId={user.id} />
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="h-6 w-6" />
              Todos los Miembros
            </h2>
            <TeamMembersPanel teamId={team.id} currentUserId={user.id} />
          </TabsContent>
        </Tabs>

        {/* Modal para crear tareas */}
        {showCreateTask && (
          <CreateTaskModal
            teamId={team.id}
            userId={user.id}
            onClose={() => setShowCreateTask(false)}
            onSuccess={() => {
              setShowCreateTask(false)
              // Aquí podrías recargar la lista de tareas
            }}
          />
        )}
      </div>
    </div>
  )
}