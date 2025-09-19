"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Heart, 
  Battery, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Smile,
  Frown,
  Meh,
  Calendar,
  Activity,
  Plus
} from "lucide-react";

interface WellnessMetric {
  id: string;
  date: string;
  socialBattery: number;
  mood?: string;
  notes?: string;
}

interface CurrentWellness {
  socialBattery: number;
  mood?: string;
}

interface WellnessStats {
  averageSocialBattery: number;
  totalEntries: number;
  trend: "improving" | "declining" | "stable";
}

const moodEmojis = {
  "😊": "Feliz",
  "😔": "Triste",
  "😰": "Ansioso",
  "😴": "Cansado",
  "😡": "Enojado",
  "🤗": "Agradecido",
  "😎": "Confidente",
  "🤔": "Pensativo",
  "😌": "Relajado",
  "🤯": "Abrumado"
};

export default function WellnessTracker() {
  const [currentWellness, setCurrentWellness] = useState<CurrentWellness>({ socialBattery: 50 });
  const [metrics, setMetrics] = useState<WellnessMetric[]>([]);
  const [stats, setStats] = useState<WellnessStats>({ averageSocialBattery: 50, totalEntries: 0, trend: "stable" });
  const [loading, setLoading] = useState(true);
  const [showLogWellness, setShowLogWellness] = useState(false);
  const [newMetric, setNewMetric] = useState({
    socialBattery: 50,
    mood: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchWellnessData();
  }, []);

  const fetchWellnessData = async () => {
    try {
      const response = await fetch("/api/wellness?days=30");
      if (response.ok) {
        const data = await response.json();
        setCurrentWellness(data.currentWellness);
        setMetrics(data.metrics);
        setStats(data.stats);
      } else {
        setError("Error al cargar datos de bienestar");
      }
    } catch (error) {
      setError("Error al cargar datos de bienestar");
    } finally {
      setLoading(false);
    }
  };

  const logWellness = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/wellness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMetric),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentWellness(data.currentWellness);
        setMetrics(prev => [data.metric, ...prev]);
        setShowLogWellness(false);
        setNewMetric({ socialBattery: 50, mood: "", notes: "" });
        setSuccess("Métrica de bienestar guardada exitosamente");
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Error al guardar métrica");
      }
    } catch (error) {
      setError("Error al guardar métrica");
    }
  };

  const getBatteryColor = (level: number) => {
    if (level >= 70) return "text-green-600";
    if (level >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getBatteryIcon = (level: number) => {
    if (level >= 70) return "🔋";
    if (level >= 40) return "🔋";
    return "🪫";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "declining": return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case "improving": return "Mejorando";
      case "declining": return "Disminuyendo";
      default: return "Estable";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="h-5 w-5 mr-2 text-red-500" />
            Bienestar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Cargando datos de bienestar...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Wellness Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Heart className="h-5 w-5 mr-2 text-red-500" />
              <CardTitle>Mi Bienestar</CardTitle>
            </div>
            <Dialog open={showLogWellness} onOpenChange={setShowLogWellness}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Registrar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Bienestar</DialogTitle>
                  <DialogDescription>
                    Registra cómo te sientes hoy para llevar un seguimiento de tu bienestar
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={logWellness} className="space-y-4">
                  <div>
                    <Label htmlFor="socialBattery">Batería Social ({newMetric.socialBattery}%)</Label>
                    <div className="mt-2">
                      <Slider
                        id="socialBattery"
                        min={0}
                        max={100}
                        step={5}
                        value={[newMetric.socialBattery]}
                        onValueChange={(value) => setNewMetric(prev => ({ ...prev, socialBattery: value[0] }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="mood">Estado de Ánimo</Label>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {Object.entries(moodEmojis).map(([emoji, label]) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewMetric(prev => ({ ...prev, mood: emoji }))}
                          className={`p-2 text-2xl rounded-lg border-2 transition-colors ${
                            newMetric.mood === emoji 
                              ? "border-blue-500 bg-blue-50" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          title={label}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notas (opcional)</Label>
                    <Textarea
                      id="notes"
                      value={newMetric.notes}
                      onChange={(e) => setNewMetric(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="¿Cómo te sientes hoy? ¿Algo importante que mencionar?"
                      rows={3}
                    />
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50 text-red-800">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50 text-green-800">
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowLogWellness(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Guardar Registro
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Social Battery */}
            <div className="text-center">
              <div className={`text-4xl mb-2 ${getBatteryColor(currentWellness.socialBattery)}`}>
                {getBatteryIcon(currentWellness.socialBattery)}
              </div>
              <div className="text-2xl font-bold mb-1">{currentWellness.socialBattery}%</div>
              <div className="text-sm text-gray-600">Batería Social</div>
              <Progress value={currentWellness.socialBattery} className="mt-2" />
            </div>

            {/* Current Mood */}
            <div className="text-center">
              <div className="text-4xl mb-2">
                {currentWellness.mood || "😐"}
              </div>
              <div className="text-lg font-medium mb-1">
                {currentWellness.mood ? moodEmojis[currentWellness.mood as keyof typeof moodEmojis] : "No registrado"}
              </div>
              <div className="text-sm text-gray-600">Estado de Ánimo</div>
            </div>

            {/* Wellness Stats */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {getTrendIcon(stats.trend)}
              </div>
              <div className="text-lg font-medium mb-1">{getTrendText(stats.trend)}</div>
              <div className="text-sm text-gray-600">Tendencia</div>
              <div className="text-xs text-gray-500 mt-1">
                Promedio: {stats.averageSocialBattery}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wellness History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-500" />
            Historial de Bienestar
          </CardTitle>
          <CardDescription>
            Últimos {Math.min(metrics.length, 7)} días
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay registros aún</h3>
              <p className="text-gray-600 mb-4">
                Comienza a registrar tu bienestar para ver tu progreso
              </p>
              <Button onClick={() => setShowLogWellness(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Primer Registro
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.slice(0, 7).map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {metric.mood || "😐"}
                    </div>
                    <div>
                      <div className="font-medium">
                        {new Date(metric.date).toLocaleDateString()}
                      </div>
                      {metric.notes && (
                        <div className="text-sm text-gray-600 mt-1">{metric.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`text-lg font-semibold ${getBatteryColor(metric.socialBattery)}`}>
                      {metric.socialBattery}%
                    </div>
                    <div className="w-16">
                      <Progress value={metric.socialBattery} size="sm" />
                    </div>
                  </div>
                </div>
              ))}
              {metrics.length > 7 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    Ver todos los registros ({metrics.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}