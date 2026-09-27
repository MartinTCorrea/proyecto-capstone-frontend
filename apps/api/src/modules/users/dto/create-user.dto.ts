import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { RoleName, UserStatus } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    example: 'juan.perez@asociacion.cl',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email!: string;

  @ApiProperty({
    example: 'Juan',
    description: 'Nombres del usuario',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  firstName!: string;

  @ApiProperty({
    example: 'Pérez',
    description: 'Apellidos del usuario',
  })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  lastName!: string;

  @ApiPropertyOptional({
    example: '+56912345678',
    description: 'Teléfono de contacto',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    enum: RoleName,
    isArray: true,
    example: [RoleName.ARBITRO],
    description: 'Roles iniciales asignados al usuario (RF02)',
  })
  @IsOptional()
  @IsArray({ message: 'Los roles deben enviarse como una lista' })
  @IsEnum(RoleName, { each: true, message: 'Cada rol debe ser un RoleName válido (ADMIN_COMISION_TECNICA, ARBITRO, OFICIAL_MESA)' })
  roles?: RoleName[];

  @ApiPropertyOptional({
    enum: UserStatus,
    default: UserStatus.PENDING_ROLE,
    description: 'Estado inicial del usuario en el sistema',
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'El estado debe ser ACTIVE, INACTIVE o PENDING_ROLE' })
  status?: UserStatus;
}
