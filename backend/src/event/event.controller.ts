import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EventService } from './event.service';

@ApiTags('events')
@Controller('api/events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  list() {
    return this.eventService.findAll();
  }

  @Get(':eventId')
  get(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.eventService.findById(eventId);
  }
}
