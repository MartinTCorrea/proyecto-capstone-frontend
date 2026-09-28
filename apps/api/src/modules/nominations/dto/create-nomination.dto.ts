import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { MatchRole } from '@sgaob/shared';

export class CreateNominationDto {
  @ApiProperty({
    description: 'ID único del partido al cual se asignará el personal (UUID)',
    example: 'a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsUUID('4', { message: 'El matchId debe ser un UUID válido' })
  matchId!: string;

  @ApiProperty({
    description: 'ID único del usuario (árbitro u oficial de mesa) a nominar (UUID)',
    example: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
  })
  @IsUUID('4', { message: 'El userId debe ser un UUID válido' })
  userId!: string;

  @ApiProperty({
    description: 'Rol arbitral o de mesa técnica asignado en el partido (RF13, Anexo A.1, A.2)',
    enum: MatchRole,
    example: MatchRole.ARBITRO_PRINCIPAL,
  })
  @IsEnum(MatchRole, { message: 'Rol de partido inválido' })
  matchRole!: MatchRole;

  @ApiPropertyOptional({
    description: 'Indicador de excepción administrativa por Comisión Técnica si el usuario no tiene disponibilidad declarada (RF12)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  overrideAvailability?: boolean;

  @ApiPropertyOptional({
    description: 'Justificación obligatoria si se aplica excepción de disponibilidad (overrideAvailability = true)',
    example: 'Designación de urgencia por reemplazo de último minuto acordado telefónicamente.',
  })
  @ValidateIf((o) => o.overrideAvailability === true)
  @IsString({ message: 'La justificación de excepción es obligatoria si overrideAvailability es true' })
  @MaxLength(255)
  overrideReason?: string;
}
