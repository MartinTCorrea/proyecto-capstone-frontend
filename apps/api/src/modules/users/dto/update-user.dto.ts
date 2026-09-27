import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Juan Carlos',
    description: 'Nombres actualizados del usuario',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Pérez Silva',
    description: 'Apellidos actualizados del usuario',
  })
  @IsOptional()
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  lastName?: string;

  @ApiPropertyOptional({
    example: '+56987654321',
    description: 'Teléfono de contacto actualizado',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
