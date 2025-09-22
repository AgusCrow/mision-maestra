'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Smile, 
  Target, 
  Moon, 
  Zap, 
  Brain, 
  Coffee, 
  Battery,
  Activity,
  Plus,
  Minus
} from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

type Mood = 'happy' | 'focused' | 'tired' | 'energetic' | 'stressed' | 'relaxed'

interface MemberStatusControlsProps {
  teamId: string
  userId: string
}

const moodOptions = [
  { value: 'happy' as Mood, label: 'Feliz', icon: Smile, color: 'text-yellow-500' },
  { value: 'focused' as Mood, label: 'Concentrado', icon: Target, color: 'text-blue-500' },
  { value: 'tired' as Mood, label: 'Cansado', icon: Moon, color: 'text-purple-500' },
  { value: 'energetic' as Mood, label: 'Energético', icon: Zap, color: 'text-green-500' },
  { value: 'stressed' as Mood, label: 'Estresado', icon: Brain, color: 'text-red-500' },
  { value: 'relaxed' as Mood, label: 'Relajado', icon: Coffee, color: 'text-teal-500' }
]

const activityPresets = [
  'Trabajando en tareas',
  'En reunión',
  'Pausa activa',
  'Aprendiendo algo nuevo',
  'Planificando',
  'Revisando código',
  'Diseñando',
  'Investigando',
  'Comunicando con el equipo',
  'Tomando un descanso'
]

export function MemberStatusControls({ teamId, userId }: MemberStatusControlsProps) {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)
  const [socialBattery, setSocialBattery] = useState<number>(50)
  const [currentActivity, setCurrentActivity] = useState<string>('')
  const [customActivity, setCustomActivity] = useState<string>('')
  const { socket } = useSocket()

  const updateMood = (mood: Mood) => {
    setSelectedMood(mood)
    socket?.emit('update-member-mood', { teamId, userId, mood })
  }

  const updateSocialBattery = (battery: number) => {
    const newBattery = Math.max(0, Math.min(100, battery))
    setSocialBattery(newBattery)
    socket?.emit('update-social-battery', { teamId, userId, battery: newBattery })
  }

  const updateActivity = (activity: string) => {
    setCurrentActivity(activity)
    socket?.emit('update-member-activity', { teamId, userId, activity })
  }

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
          <Activity className="h-5 w-5" />
          Mi Estado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado de Ánimo */}
        <div>
          <h3 className="text-sm font-medium mb-3">Estado de Ánimo</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {moodOptions.map((mood) => {
              const Icon = mood.icon
              const isSelected = selectedMood === mood.value
              
              return (
                <Button
                  key={mood.value}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateMood(mood.value)}
                  className={`flex flex-col items-center gap-1 h-auto py-3 ${
                    isSelected ? 'bg-purple-600 hover:bg-purple-700' : ''
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : mood.color}`} />
                  <span className="text-xs">{mood.label}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Batería Social */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Batería Social</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSocialBattery(socialBattery - 10)}
                disabled={socialBattery <= 0}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className={`text-sm font-medium ${getBatteryColor(socialBattery)}`}>
                {getBatteryLabel(socialBattery)} ({socialBattery}%)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSocialBattery(socialBattery + 10)}
                disabled={socialBattery >= 100}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Progress 
            value={socialBattery} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Agotado</span>
            <span>Energizado</span>
          </div>
        </div>

        {/* Actividad Actual */}
        <div>
          <h3 className="text-sm font-medium mb-3">Actividad Actual</h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {activityPresets.map((activity) => (
                <Badge
                  key={activity}
                  variant={currentActivity === activity ? "default" : "outline"}
                  className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900"
                  onClick={() => updateActivity(activity)}
                >
                  {activity}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="O especifica una actividad personalizada..."
                value={customActivity}
                onChange={(e) => setCustomActivity(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && customActivity.trim()) {
                    updateActivity(customActivity.trim())
                    setCustomActivity('')
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  if (customActivity.trim()) {
                    updateActivity(customActivity.trim())
                    setCustomActivity('')
                  }
                }}
                disabled={!customActivity.trim()}
              >
                Actualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Resumen Actual */}
        {(selectedMood || currentActivity) && (
          <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="text-sm font-medium mb-2">Tu Estado Actual</h3>
            <div className="space-y-2 text-sm">
              {selectedMood && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Estado de ánimo:</span>
                  <Badge variant="outline">
                    {moodOptions.find(m => m.value === selectedMood)?.label}
                  </Badge>
                </div>
              )}
              {currentActivity && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Actividad:</span>
                  <span>{currentActivity}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400">Batería social:</span>
                <span className={getBatteryColor(socialBattery)}>
                  {getBatteryLabel(socialBattery)} ({socialBattery}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}