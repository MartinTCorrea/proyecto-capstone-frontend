import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from '@prisma/client';

export class UpdateUserStatusDto {
  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    description: 'Nuevo estado de la cuenta del usuario en el sistema (RF03)',
  })
  @IsEnum(UserStatus, { message: 'El estado debe ser ACTIVE, INACTIVE o PENDING_ROLE' })
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  status!: UserStatus;
}
