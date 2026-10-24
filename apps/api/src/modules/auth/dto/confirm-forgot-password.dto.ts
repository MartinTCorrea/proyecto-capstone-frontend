import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class ConfirmForgotPasswordDto {
  @ApiProperty({
    example: 'arbitro@sgaob.cl',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  email!: string;

  @ApiProperty({
    example: '123456',
    description: 'Código de confirmación de 6 dígitos enviado por correo',
  })
  @IsString({ message: 'El código de confirmación debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El código de confirmación es obligatorio' })
  confirmationCode!: string;

  @ApiProperty({
    example: 'NuevaContrasena2026!',
    description: 'Nueva contraseña que reemplazará la anterior (mínimo 8 caracteres)',
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La nueva contraseña debe contener al menos 8 caracteres' })
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
  newPassword!: string;
}

