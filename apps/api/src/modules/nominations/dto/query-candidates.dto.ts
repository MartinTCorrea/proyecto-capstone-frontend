import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum } from 'class-validator';
import { MatchRole } from '@sgaob/shared';

export class QueryCandidatesDto {
  @ApiProperty({
    description: 'ID único del partido para el cual se buscan candidatos (UUID)',
    example: 'a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsUUID('4', { message: 'El matchId debe ser un UUID válido' })
  matchId!: string;

  @ApiProperty({
    description: 'Rol arbitral o de mesa requerido (determina el filtro estricto de acreditación Anexo A.1)',
    enum: MatchRole,
    example: MatchRole.ARBITRO_PRINCIPAL,
  })
  @IsEnum(MatchRole, { message: 'Rol de partido inválido' })
  matchRole!: MatchRole;
}
