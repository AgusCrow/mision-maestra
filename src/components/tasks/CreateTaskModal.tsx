'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Target, 
  Star, 
  Coins, 
  Calendar,
  MapPin,
  User
} from 'lucide-react'

interface CreateTaskModalProps {
  teamId: string
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export function CreateTaskModal({ teamId, userId, onClose, onSuccess }: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [dueDate, setDueDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          priority,
          difficulty,
          assignedTo: assignedTo || null,
          dueDate: dueDate || null,
          teamId,
          createdById: userId
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        console.error('Error creating task')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Crear Nueva Misión
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
              <Label htmlFor="title">Título de la Misión</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ingresa el título de la misión..."
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe los detalles de la misión..."
                rows={4}
              />
            </div>

            {/* Prioridad y Dificultad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Prioridad</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        Baja
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        Media
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        Alta
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        Urgente
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Dificultad</Label>
                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 cursor-pointer transition-colors ${
                        star <= difficulty ? 'text-yellow-500 fill-current' : 'text-gray-300'
                      }`}
                      onClick={() => setDifficulty(star as 1 | 2 | 3 | 4 | 5)}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    {difficulty} estrella{difficulty !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Asignar y Fecha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedTo">Asignar a</Label>
                <Input
                  id="assignedTo"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="ID del miembro (opcional)"
                />
              </div>

              <div>
                <Label htmlFor="dueDate">Fecha límite</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Vista previa de recompensas */}
            <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Recompensas Estimadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">
                      {difficulty * 10}
                    </div>
                    <div className="text-gray-600">Monedas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {difficulty * 15}
                    </div>
                    <div className="text-gray-600">Experiencia</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {difficulty * 5}
                    </div>
                    <div className="text-gray-600">Puntos</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botones */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !title.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? 'Creando...' : 'Crear Misión'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}