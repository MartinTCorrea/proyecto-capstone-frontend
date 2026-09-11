import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar estado de salud de la API' })
  @ApiResponse({ status: 200, description: 'API operativa y respondiendo correctamente' })
  getHealth(): { status: string; timestamp: string; uptime: number } {
    return this.appService.getHealth();
  }
}

