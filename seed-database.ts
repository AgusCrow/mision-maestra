import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a test user
  const user = await prisma.user.create({
    data: {
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: '$2b$10$examplehash', // This should be a real hash in production
      displayName: 'Test User',
      level: 1,
      experience: 0,
      points: 0,
      coins: 100,
      isOnline: true,
      currentActivity: 'Trabajando',
      mood: 'happy',
      socialBattery: 80,
    },
  })

  console.log('✅ Created user:', user.username)

  // Create a test team
  const team = await prisma.team.create({
    data: {
      name: 'Equipo de Prueba',
      description: 'Un equipo para probar la aplicación',
      creatorId: user.id,
      level: 1,
      score: 0,
    },
  })

  console.log('✅ Created team:', team.name)

  // Add user to team
  const teamMember = await prisma.teamMember.create({
    data: {
      userId: user.id,
      teamId: team.id,
      role: 'OWNER',
    },
  })

  console.log('✅ Added user to team as owner')

  // Create some test tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Tarea de prueba 1',
      description: 'Esta es una tarea de prueba para el sistema',
      status: 'PENDING',
      priority: 'MEDIUM',
      difficulty: 3,
      points: 10,
      coins: 5,
      experience: 25,
      creatorId: user.id,
      assigneeId: user.id,
      teamId: team.id,
    },
  })

  const task2 = await prisma.task.create({
    data: {
      title: 'Tarea de prueba 2',
      description: 'Otra tarea de prueba',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      difficulty: 4,
      points: 15,
      coins: 10,
      experience: 40,
      creatorId: user.id,
      assigneeId: user.id,
      teamId: team.id,
    },
  })

  console.log('✅ Created test tasks')

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })