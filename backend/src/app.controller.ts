import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('api')
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
