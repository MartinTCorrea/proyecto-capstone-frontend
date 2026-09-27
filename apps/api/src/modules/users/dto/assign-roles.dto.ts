import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsEnum } from 'class-validator';
import { RoleName } from '@prisma/client';

export class AssignRolesDto {
  @ApiProperty({
    enum: RoleName,
    isArray: true,
    example: [RoleName.ARBITRO],
    description:
      'Lista de roles asignados al usuario (RF02). Árbitro y Oficial de Mesa son roles independientes; un usuario puede tener uno, el otro o ambos.',
  })
  @IsArray({ message: 'Los roles deben proporcionarse como una lista' })
  @ArrayNotEmpty({ message: 'Debe especificar al menos un rol para el usuario' })
  @IsEnum(RoleName, {
    each: true,
    message: 'Cada rol debe ser un valor válido: ADMIN_COMISION_TECNICA, ARBITRO, OFICIAL_MESA',
  })
  roles!: RoleName[];
}
