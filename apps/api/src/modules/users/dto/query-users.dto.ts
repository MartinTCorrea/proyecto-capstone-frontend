import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleName, UserStatus } from '@prisma/client';

export class QueryUsersDto {
  @ApiPropertyOptional({
    default: 1,
    description: 'Número de página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    default: 10,
    description: 'Cantidad de registros por página (máx. 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo es 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: RoleName,
    description: 'Filtrar usuarios que posean este rol específico',
  })
  @IsOptional()
  @IsEnum(RoleName, { message: 'El rol de filtro debe ser válido' })
  role?: RoleName;

  @ApiPropertyOptional({
    enum: UserStatus,
    description: 'Filtrar usuarios por estado (ACTIVE, INACTIVE, PENDING_ROLE)',
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'El estado de filtro debe ser válido' })
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Búsqueda por texto (nombre, apellido o correo electrónico)',
  })
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser un texto' })
  search?: string;
}
