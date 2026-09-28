import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CognitoLoginDto {
  @ApiProperty({
    description: 'Correo electrónico registrado en AWS Cognito',
    example: 'arbitro@sgaob.cl',
  })
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email!: string;

  @ApiProperty({
    description: 'Contraseña del usuario en AWS Cognito',
    example: 'Temporal123!',
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;
}
