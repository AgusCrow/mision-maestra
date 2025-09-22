'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  Target
} from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

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

export function TeamMembersPanel({ teamId, currentUserId }: TeamMembersPanelProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
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

    socket.on('team-members-update', handleMembersUpdate)
    socket.on('member-activity-update', handleMemberActivity)
    socket.on('member-mood-update', handleMemberMood)
    socket.on('social-battery-update', handleSocialBattery)

    // Solicitar miembros iniciales
    socket.emit('get-team-members', teamId)

    return () => {
      socket.off('team-members-update', handleMembersUpdate)
      socket.off('member-activity-update', handleMemberActivity)
      socket.off('member-mood-update', handleMemberMood)
      socket.off('social-battery-update', handleSocialBattery)
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Miembros del Equipo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => {
            const RoleIcon = roleIcons[member.role]
            const MoodIcon = member.mood ? moodIcons[member.mood] : null
            const isCurrentUser = member.id === currentUserId

            return (
              <div
                key={member.id}
                className={`p-4 rounded-lg border transition-all ${
                  isCurrentUser 
                    ? 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800' 
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                } ${member.isOnline ? 'opacity-100' : 'opacity-60'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`/api/placeholder/avatar/${member.id}`} />
                        <AvatarFallback>
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${
                        member.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isCurrentUser ? 'text-purple-600 dark:text-purple-400' : ''}`}>
                          {member.name}
                          {isCurrentUser && <span className="text-xs">(Tú)</span>}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <RoleIcon className="h-3 w-3" />
                          {roleLabels[member.role]}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Nivel {member.level} • {member.coins} monedas
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.mood && MoodIcon && (
                      <div className={`p-1 rounded-full ${moodColors[member.mood]} bg-opacity-20`}>
                        <MoodIcon className="h-4 w-4" />
                      </div>
                    )}
                    <Badge variant={member.isOnline ? "default" : "secondary"}>
                      {member.isOnline ? 'En línea' : 'Ausente'}
                    </Badge>
                  </div>
                </div>

                {/* Actividad Actual */}
                {member.currentActivity && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Activity className="h-4 w-4" />
                      <span className="font-medium">Actividad actual:</span>
                      <span>{member.currentActivity}</span>
                    </div>
                  </div>
                )}

                {/* Estado de Ánimo */}
                {member.mood && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Estado de ánimo:</span>
                      <Badge variant="outline" className="text-xs">
                        {moodLabels[member.mood]}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Batería Social */}
                {member.socialBattery !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Battery className="h-4 w-4" />
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          Batería Social:
                        </span>
                        <span className={`text-xs font-medium ${getBatteryColor(member.socialBattery)}`}>
                          {getBatteryLabel(member.socialBattery)} ({member.socialBattery}%)
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={member.socialBattery} 
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}