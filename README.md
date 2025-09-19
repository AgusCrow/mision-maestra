# Misión Maestra 🚀

Un sistema de gestión de tareas gamificado que transforma la productividad del equipo a través de la gamificación. Completa misiones, gana puntos, sube de nivel y colabora con tu equipo mientras alcanzas tus objetivos.

## Características Principales

### 🎮 Gamificación
- **Sistema de XP**: Gana puntos de experiencia al completar tareas
- **Niveles y Progresión**: Sube de nivel y desbloquea nuevas habilidades
- **Logros y Medallas**: Obtén reconocimientos por tus contribuciones
- **Avatar Personalizable**: Compra y equipa items para tu avatar

### 👥 Colaboración en Equipo
- **Gestión de Equipos**: Crea equipos, asigna roles (Líder/Miembro)
- **Misiones Grupales**: Colabora en tareas y objetivos comunes
- **Sistema de Invitaciones**: Invita a nuevos miembros a tu equipo
- **Objetivos de Equipo**: Establece metas colaborativas con recompensas

### 📊 Gestión de Tareas
- **Tareas Personales y de Equipo**: Organiza tu trabajo individual y grupal
- **Prioridades y Categorías**: Clasifica tus tareas por importancia y tipo
- **Fechas Límite**: Establece plazos para tus misiones
- **Tareas Recurrentes**: Configura tareas que se repiten automáticamente

### 🧠 Bienestar y Salud
- **Batería Social**: Monitorea tu energía social (0-100%)
- **Registro de Estado de Ánimo**: Anota cómo te sientes con emojis
- **Historial de Métricas**: Seguimiento de tu bienestar a lo largo del tiempo

## Tecnologías Utilizadas

### Frontend
- **Next.js 15** - Framework de React con App Router
- **TypeScript** - Tipado estático para mayor seguridad
- **Tailwind CSS** - Framework de CSS utility-first
- **shadcn/ui** - Componentes UI de alta calidad
- **Lucide React** - Iconos modernos y consistentes

### Backend
- **Next.js API Routes** - Endpoints RESTful
- **Prisma ORM** - Mapeo Objeto-Relacional
- **SQLite** - Base de datos ligera
- **NextAuth.js** - Autenticación de usuarios
- **bcryptjs** - Hashing de contraseñas

### Desarrollo
- **ESLint** - Calidad de código
- **Prettier** - Formateo de código
- **Husky** - Git hooks
- **Node.js** - Entorno de ejecución

## Instalación

### Requisitos Previos
- Node.js 18+ 
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/AgusCrow/mision-maestra.git
   cd mision-maestra
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Editar el archivo `.env` con tus configuraciones:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="tu_secreto_aqui"
   ```

4. **Inicializar la base de datos**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

6. **Abrir la aplicación**
   Visita [http://localhost:3000](http://localhost:3000) en tu navegador.

## Uso

### Para Usuarios Nuevos

1. **Crear una cuenta**: Regístrate con tu email y contraseña
2. **Completar tu perfil**: Agrega tu nombre y avatar
3. **Crear o unirte a un equipo**: 
   - Crea tu propio equipo como Líder
   - Espera una invitación para unirte a un equipo existente
4. **Comenzar a crear misiones**: Transforma tus tareas en misiones emocionantes
5. **Colaborar y ganar XP**: Completa tareas y sube de nivel

### Para Desarrolladores

#### Estructura del Proyecto
```
src/
├── app/                    # App Router de Next.js
│   ├── api/               # Rutas API
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/         # Dashboard principal
│   └── ...                # Otras páginas
├── components/            # Componentes React
│   ├── ui/                # Componentes shadcn/ui
│   └── providers.tsx      # Proveedores de contexto
├── lib/                   # Utilidades y configuración
│   ├── auth.ts           # Configuración de NextAuth
│   ├── db.ts             # Cliente Prisma
│   └── ...               # Otras utilidades
└── prisma/                # Esquema de base de datos
```

#### Comandos Útiles
```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Construir para producción
npm run start        # Iniciar servidor de producción
npm run lint         # Ejecutar ESLint

# Base de datos
npx prisma studio    # Abrir Prisma Studio
npx prisma generate  # Generar cliente Prisma
npx prisma db push   # Sincronizar esquema con BD
```

## Contribuir

¡Las contribuciones son bienvenidas! Por favor, sigue estos pasos:

1. **Hacer un Fork** del repositorio
2. **Crear una rama** para tu feature (`git checkout -b feature/amazing-feature`)
3. **Hacer Commit** de tus cambios (`git commit -m 'Add amazing feature'`)
4. **Hacer Push** a la rama (`git push origin feature/amazing-feature`)
5. **Abrir un Pull Request**

## Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para detalles.

## Contacto

Agus Crow - [@AgusCrow](https://github.com/AgusCrow)

Link del Proyecto: [https://github.com/AgusCrow/mision-maestra](https://github.com/AgusCrow/mision-maestra)

---

⭐ Si este proyecto te fue útil, ¡por favor dale una estrella!