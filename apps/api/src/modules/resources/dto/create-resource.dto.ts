import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceType, ResourceVisibility } from '@sgaob/shared';

export class CreateResourceDto {
  @ApiProperty({
    description: 'Tipo de recurso gestionable (RF17, RF18, RF19)',
    enum: ResourceType,
    example: ResourceType.DOCUMENTO,
  })
  @IsEnum(ResourceType, {
    message: 'El tipo debe ser DOCUMENTO, CREDENCIAL o COMUNICADO',
  })
  @IsNotEmpty({ message: 'El tipo de recurso es obligatorio' })
  type!: ResourceType;

  @ApiProperty({
    description: 'Título del documento, credencial o comunicado',
    example: 'Reglamento Oficial FIBA 2026',
    minLength: 3,
  })
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  title!: string;

  @ApiPropertyOptional({
    description: 'Descripción breve o resumen del recurso',
    example: 'Protocolo oficial de arbitraje actualizado para torneos nacionales.',
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description?: string;

  @ApiPropertyOptional({
    description: 'URL del archivo adjunto o enlace externo',
    example: 'https://storage.sgaob.cl/documentos/fiba-reglamento-2026.pdf',
  })
  @IsOptional()
  @IsUrl({}, { message: 'fileUrl debe ser una URL válida' })
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'Contenido en texto plano o markdown (especialmente para comunicados o credenciales)',
    example: 'Se informa a todo el personal arbitral que la reunión técnica se efectuará vía Teams.',
  })
  @IsOptional()
  @IsString({ message: 'El contenido debe ser una cadena de texto' })
  content?: string;

  @ApiPropertyOptional({
    description:
      'Nivel de visibilidad del recurso (PUBLIC, AUTHENTICATED, ADMIN). Nota: si type = CREDENCIAL, el sistema forzará automáticamente ADMIN (Anexo A.5).',
    enum: ResourceVisibility,
    default: ResourceVisibility.AUTHENTICATED,
    example: ResourceVisibility.AUTHENTICATED,
  })
  @IsOptional()
  @IsEnum(ResourceVisibility, {
    message: 'La visibilidad debe ser PUBLIC, AUTHENTICATED o ADMIN',
  })
  visibility?: ResourceVisibility;
}
