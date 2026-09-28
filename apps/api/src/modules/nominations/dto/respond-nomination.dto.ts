import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { NominationStatus } from '@sgaob/shared';

export class RespondNominationDto {
  @ApiProperty({
    description: 'Respuesta formal del usuario ante la nominación (RF15)',
    enum: [NominationStatus.CONFIRMED, NominationStatus.REJECTED],
    example: NominationStatus.CONFIRMED,
  })
  @IsEnum(NominationStatus, { message: 'El estado debe ser CONFIRMED o REJECTED' })
  status!: NominationStatus;

  @ApiPropertyOptional({
    description: 'Motivo explicativo obligatorio en caso de rechazar la nominación (RF15)',
    example: 'Imposibilidad de traslado por motivos laborales fuera de Santiago.',
  })
  @ValidateIf((o) => o.status === NominationStatus.REJECTED)
  @IsString({ message: 'El motivo de rechazo es obligatorio al rechazar una nominación' })
  @MaxLength(300)
  rejectionReason?: string;
}
