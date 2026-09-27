import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, Equals } from 'class-validator';

export class DataConsentDto {
  @ApiProperty({
    example: true,
    description:
      'Consentimiento formal explícito de tratamiento de datos personales bajo la ley 19.628 / normativa vigente (RF01, NFR Privacidad)',
  })
  @IsBoolean({ message: 'El consentimiento debe ser un valor booleano' })
  @Equals(true, {
    message: 'Debe aceptar formalmente el consentimiento de tratamiento de datos personales para continuar.',
  })
  consent!: boolean;
}
