import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { MatchPlatform } from '@sgaob/shared';

export class SyncMatchesDto {
  @ApiPropertyOptional({
    description: 'Plataforma específica a sincronizar (si se omite, se sincronizan las plataformas activas)',
    enum: MatchPlatform,
    default: MatchPlatform.SWISH,
  })
  @IsOptional()
  @IsEnum(MatchPlatform)
  platform?: MatchPlatform;

  @ApiPropertyOptional({
    description: 'Forzar modo mock / simulación incluso si hay credenciales configuradas',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  mock?: boolean;
}
