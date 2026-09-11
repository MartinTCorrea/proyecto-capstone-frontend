import { PrismaClient, RoleName, DayType, TimeBlockCode } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de datos base para SGAOB...');

  // 1. Roles del sistema (RF02, Anexo A.1)
  const rolesData = [
    {
      name: RoleName.ADMIN_COMISION_TECNICA,
      description: 'Administrador de Comisión Técnica con acceso completo a gestión y nominaciones',
    },
    {
      name: RoleName.ARBITRO,
      description: 'Personal arbitral habilitado para roles de Árbitro Principal, Árbitro 1 y Árbitro 2',
    },
    {
      name: RoleName.OFICIAL_MESA,
      description: 'Oficial de Mesa de Control habilitado para roles de Oficial 1, Oficial 2 y Oficial 3',
    },
  ];

  for (const role of rolesData) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
    console.log(`Rol verificado: ${createdRole.name}`);
  }

  // 2. Configuración de bloques horarios (Anexo A.4)
  const timeBlocksData = [
    {
      dayType: DayType.LABORAL,
      blockCode: TimeBlockCode.HORARIO_1,
      startTime: '15:30',
      endTime: '19:30',
      description: 'Día hábil — Torneos escolares y formativos (15:30 a 19:30)',
      isActive: true,
    },
    {
      dayType: DayType.LABORAL,
      blockCode: TimeBlockCode.HORARIO_2,
      startTime: '19:30',
      endTime: '22:00',
      description: 'Día hábil — Categorías adultas y universitarias (19:30 a 22:00)',
      isActive: true,
    },
    {
      dayType: DayType.FIN_DE_SEMANA,
      blockCode: TimeBlockCode.HORARIO_1,
      startTime: '09:00',
      endTime: '15:00',
      description: 'Fin de semana — Jornada matutina y mediodía (09:00 a 15:00)',
      isActive: true,
    },
    {
      dayType: DayType.FIN_DE_SEMANA,
      blockCode: TimeBlockCode.HORARIO_2,
      startTime: '15:00',
      endTime: '22:00',
      description: 'Fin de semana — Jornada vespertina y nocturna (15:00 a 22:00)',
      isActive: true,
    },
  ];

  for (const block of timeBlocksData) {
    const createdBlock = await prisma.timeBlockConfig.upsert({
      where: {
        dayType_blockCode: {
          dayType: block.dayType,
          blockCode: block.blockCode,
        },
      },
      update: {
        startTime: block.startTime,
        endTime: block.endTime,
        description: block.description,
        isActive: block.isActive,
      },
      create: block,
    });
    console.log(
      `Bloque horario verificado: [${createdBlock.dayType}] ${createdBlock.blockCode} (${createdBlock.startTime} - ${createdBlock.endTime})`,
    );
  }

  console.log('Seed de SGAOB completado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error durante la ejecución del seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
