import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ConfirmSignUpDto {
  @ApiProperty({
    example: 'arbitro@sgaob.cl',
    description: 'Correo electrónico del usuario registrado',
  })
  @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  email!: string;

  @ApiProperty({
    example: '947249',
    description: 'Código de confirmación de 6 dígitos recibido por correo electrónico',
  })
  @IsString({ message: 'El código de confirmación debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El código de confirmación es obligatorio' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  confirmationCode!: string;
}

