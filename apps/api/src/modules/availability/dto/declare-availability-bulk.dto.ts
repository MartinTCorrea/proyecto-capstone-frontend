import { IsISO8601, IsNotEmpty, IsEnum, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AvailabilityBlock } from '@prisma/client';

export class DailyAvailabilityItemDto {
  @ApiProperty({ example: '2026-10-03', description: 'Fecha en formato YYYY-MM-DD' })
  @IsISO8601()
  @IsNotEmpty({ message: 'La fecha es obligatoria' })
  date!: string;

  @ApiProperty({
    enum: AvailabilityBlock,
    example: AvailabilityBlock.FULL,
    description: 'Bloque horario disponible: HORARIO_1, HORARIO_2, FULL, NO',
  })
  @IsEnum(AvailabilityBlock, { message: 'Bloque de disponibilidad inválido' })
  @IsNotEmpty({ message: 'El bloque es obligatorio' })
  block!: AvailabilityBlock;
}

export class DeclareAvailabilityBulkDto {
  @ApiProperty({
    type: [DailyAvailabilityItemDto],
    description: 'Listado de declaraciones de disponibilidad por fecha',
  })
  @IsArray({ message: 'availabilities debe ser un arreglo de declaraciones' })
  @ArrayMinSize(1, { message: 'Debe enviar al menos una fecha de disponibilidad' })
  @ValidateNested({ each: true })
  @Type(() => DailyAvailabilityItemDto)
  availabilities!: DailyAvailabilityItemDto[];
}
