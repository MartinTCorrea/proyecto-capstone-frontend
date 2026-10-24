import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'MiContrasenaActual123!',
    description: 'Contraseña actual del usuario autenticado',
  })
  @IsString({ message: 'La contraseña actual debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria' })
  currentPassword!: string;

  @ApiProperty({
    example: 'MiNuevaContrasenaSegura2026!',
    description: 'Nueva contraseña que se establecerá (mínimo 8 caracteres)',
  })
  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La nueva contraseña debe contener al menos 8 caracteres' })
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
  newPassword!: string;
}

