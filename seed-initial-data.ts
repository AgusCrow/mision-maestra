import { db } from "./src/lib/db";

async function seedInitialData() {
  try {
    // Create achievements
    const achievements = await Promise.all([
      db.achievement.create({
        data: {
          name: "Primeros Pasos",
          description: "Completa tu primera tarea",
          icon: "🎯",
          xpThreshold: 10,
          category: "Tareas",
        },
      }),
      db.achievement.create({
        data: {
          name: "Trabajador Incansable",
          description: "Completa 10 tareas",
          icon: "💪",
          xpThreshold: 100,
          category: "Tareas",
        },
      }),
      db.achievement.create({
        data: {
          name: "Líder Nato",
          description: "Crea tu primer equipo",
          icon: "👑",
          xpThreshold: 0,
          category: "Equipos",
        },
      }),
      db.achievement.create({
        data: {
          name: "Colaborador Élite",
          description: "Completa 25 tareas en equipo",
          icon: "🤝",
          xpThreshold: 250,
          category: "Equipos",
        },
      }),
      db.achievement.create({
        data: {
          name: "Maestro del Bienestar",
          description: "Registra tu estado de ánimo 7 días seguidos",
          icon: "🧘",
          xpThreshold: 70,
          category: "Bienestar",
        },
      }),
      db.achievement.create({
        data: {
          name: "Cazador de Logros",
          description: "Desbloquea 5 logros",
          icon: "🏆",
          xpThreshold: 500,
          category: "General",
        },
      }),
    ]);

    // Create avatar items
    const avatarItems = await Promise.all([
      // Hair items
      db.avatarItem.create({
        data: {
          name: "Cabello Clásico",
          description: "Un estilo clásico y elegante",
          type: "HAIR",
          icon: "💇",
          xpCost: 50,
        },
      }),
      db.avatarItem.create({
        data: {
          name: "Cabello Rebelde",
          description: "Para los aventureros",
          type: "HAIR",
          icon: "🌟",
          xpCost: 100,
        },
      }),
      db.avatarItem.create({
        data: {
          name: "Cabello Profesional",
          description: "Perfecto para reuniones importantes",
          type: "HAIR",
          icon: "🎩",
          xpCost: 150,
        },
      }),
      // Clothing items
      db.avatarItem.create({
        data: {
          name: "Ropa Casual",
          description: "Cómoda y relajada",
          type: "CLOTHING",
          icon: "👕",
          xpCost: 75,
        },
      }),
      db.avatarItem.create({
        data: {
          name: "Traje Ejecutivo",
          description: "Para impresionar en el trabajo",
          type: "CLOTHING",
          icon: "👔",
          xpCost: 200,
        },
      }),
      db.avatarItem.create({
        data: {
          name: "Ropa Deportiva",
          description: "Para mantenerse activo",
          type: "CLOTHING",
          icon: "🏃",
          xpCost: 125,
        },
      }),
      // Accessories
      db.avatarItem.create({
        data: {
          name: "Gafas de Sol",
          description: "Para un look cool",
          type: "ACCESSORY",
          icon: "🕶️",
          xpCost: 60,
        },
      }),
      db.avatarItem.create({
        data: {
          name: "Reloj Elegante",
          description: "Siempre puntual",
          type: "ACCESSORY",
          icon: "⌚",
          xpCost: 90,
        },
      }),
      db.avatarItem.create({
        data: {
          name: "Corbata de Poder",
          description: "Símbolo de autoridad",
          type: "ACCESSORY",
          icon: "👔",
          xpCost: 110,
        },
      }),
      // Backgrounds
      db.avatarItem.create({
        data: {
          name: "Fondo Oficina",
          description: "Un entorno profesional",
          type: "BACKGROUND",
          icon: "🏢",
          xpCost: 80,
        },
      }),
      db.avatarItem.create({
        data: {
          name: "Fondo Naturaleza",
          description: "Relájate con la naturaleza",
          type: "BACKGROUND",
          icon: "🌳",
          xpCost: 120,
        },
      }),
      db.avatarItem.create({
        data: {
          name: "Fondo Espacial",
          description: "Alcanza las estrellas",
          type: "BACKGROUND",
          icon: "🚀",
          xpCost: 180,
        },
      }),
    ]);

    console.log("✅ Datos iniciales creados exitosamente:");
    console.log(`- ${achievements.length} logros creados`);
    console.log(`- ${avatarItems.length} items de avatar creados`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al crear datos iniciales:", error);
    process.exit(1);
  }
}

seedInitialData();