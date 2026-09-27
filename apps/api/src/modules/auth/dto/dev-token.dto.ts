import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray, IsEnum } from 'class-validator';
import { RoleName } from '@prisma/client';

export class DevTokenDto {
  @ApiProperty({
    example: 'admin@sgaob.cl',
    description: 'Correo electrónico del usuario para generar token de desarrollo',
  })
  @IsEmail({}, { message: 'El correo electrónico debe ser una dirección válida' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email!: string;

  @ApiPropertyOptional({
    example: 'Juan',
    description: 'Nombre del usuario',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Pérez',
    description: 'Apellido del usuario',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    enum: RoleName,
    isArray: true,
    example: [RoleName.ADMIN_COMISION_TECNICA],
    description: 'Roles asignados para el token de prueba',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(RoleName, { each: true, message: 'Cada rol debe ser un RoleName válido' })
  roles?: RoleName[];
}
