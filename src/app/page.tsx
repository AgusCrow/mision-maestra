"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { 
  Rocket, 
  Users, 
  Trophy, 
  Target, 
  Heart, 
  Star, 
  CheckCircle,
  Zap,
  Award,
  MessageCircle,
  Calendar,
  TrendingUp
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: <Users className="h-6 w-6 text-blue-600" />,
      title: "Equipos Colaborativos",
      description: "Crea equipos, asigna roles y colabora en misiones grupales para alcanzar objetivos comunes."
    },
    {
      icon: <Target className="h-6 w-6 text-green-600" />,
      title: "Gestión de Tareas",
      description: "Organiza tareas personales y de equipo con prioridades, fechas límite y categorías personalizadas."
    },
    {
      icon: <Trophy className="h-6 w-6 text-yellow-600" />,
      title: "Gamificación",
      description: "Gana XP, sube de nivel y desbloquea recompensas mientras completas tus tareas."
    },
    {
      icon: <Heart className="h-6 w-6 text-red-600" />,
      title: "Bienestar",
      description: "Monitorea tu batería social y estado de ánimo para mantener un equilibrio saludable."
    },
    {
      icon: <Award className="h-6 w-6 text-purple-600" />,
      title: "Logros y Medallas",
      description: "Desbloquea logros especiales y medallas por tus contribuciones al equipo."
    },
    {
      icon: <Star className="h-6 w-6 text-indigo-600" />,
      title: "Personalización",
      description: "Personaliza tu avatar con items especiales comprados con tus puntos de experiencia."
    }
  ];

  const stats = [
    { label: "Usuarios Activos", value: "2,847", icon: <Users className="h-4 w-4" /> },
    { label: "Tareas Completadas", value: "15,239", icon: <CheckCircle className="h-4 w-4" /> },
    { label: "Equipos Creados", value: "486", icon: <Rocket className="h-4 w-4" /> },
    { label: "XP Total Ganado", value: "1.2M", icon: <Zap className="h-4 w-4" /> }
  ];

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
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
              Características
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">
              Cómo Funciona
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
              Precios
            </a>
          </nav>
          <div className="flex items-center space-x-3">
            <Link href="/auth/signin">
              <Button variant="outline" className="hidden md:inline-flex">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Registrarse Gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            <Rocket className="h-4 w-4 mr-2" />
            Transforma tu productividad
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Gestión de Tareas con Gamificación
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Convierte las tareas aburridas en emocionantes misiones. Colabora con tu equipo, 
            gana puntos, sube de nivel y desbloquea recompensas mientras alcanzas tus objetivos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3">
                <Rocket className="h-5 w-5 mr-2" />
                Comenzar Misión
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              <MessageCircle className="h-5 w-5 mr-2" />
              Ver Demo
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-2 text-blue-600">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Características Principales</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Todo lo que necesitas para transformar la productividad de tu equipo
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  {feature.icon}
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-gradient-to-r from-blue-50 to-purple-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Cómo Funciona</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comienza a transformar tu productividad en pocos pasos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Crea tu Equipo",
                description: "Invita a tus compañeros y crea tu primer equipo. Define roles y establece objetivos comunes."
              },
              {
                step: "2", 
                title: "Crea Misiones",
                description: "Transforma tus tareas en misiones emocionantes con XP, prioridades y fechas límite."
              },
              {
                step: "3",
                title: "Colabora y Gana",
                description: "Completa misiones, colabora con tu equipo, gana XP y sube de nivel desbloqueando recompensas."
              }
            ].map((item, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">¿Listo para comenzar tu misión?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Únete a miles de equipos que ya están transformando su productividad con Misión Maestra.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3">
              <Rocket className="h-5 w-5 mr-2" />
              Comenzar Gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="relative w-8 h-8">
                <img
                  src="/logo-mision-maestra.png"
                  alt="Misión Maestra Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold">Misión Maestra</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">
                © 2024 Misión Maestra. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}