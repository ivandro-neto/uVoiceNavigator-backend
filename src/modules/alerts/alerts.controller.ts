import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions, Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @Permissions('alerts:read')
  @ApiOperation({ summary: 'List all email alert configurations' })
  @ApiResponse({ status: 200, description: 'List of alert configurations.' })
  findAll() {
    return this.alertsService.findAll();
  }

  @Post()
  @Permissions('alerts:manage')
  @ApiOperation({ summary: 'Create a new email alert configuration' })
  @ApiResponse({ status: 201, description: 'Alert created.' })
  create(@Body() createAlertDto: CreateAlertDto) {
    return this.alertsService.create(createAlertDto);
  }

  @Get(':id')
  @Permissions('alerts:read')
  @ApiOperation({ summary: 'Get alert configuration by ID' })
  @ApiParam({ name: 'id', description: 'Alert UUID' })
  @ApiResponse({ status: 200, description: 'Alert found.' })
  @ApiResponse({ status: 404, description: 'Alert not found.' })
  findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }

  @Put(':id')
  @Permissions('alerts:manage')
  @ApiOperation({ summary: 'Update alert configuration (enable/disable, change schedule)' })
  @ApiParam({ name: 'id', description: 'Alert UUID' })
  @ApiResponse({ status: 200, description: 'Alert updated.' })
  @ApiResponse({ status: 404, description: 'Alert not found.' })
  update(@Param('id') id: string, @Body() updateAlertDto: UpdateAlertDto) {
    return this.alertsService.update(id, updateAlertDto);
  }

  @Delete(':id')
  @Permissions('alerts:manage')
  @ApiOperation({ summary: 'Delete alert configuration' })
  @ApiParam({ name: 'id', description: 'Alert UUID' })
  @ApiResponse({ status: 200, description: 'Alert deleted.' })
  @ApiResponse({ status: 404, description: 'Alert not found.' })
  remove(@Param('id') id: string) {
    return this.alertsService.remove(id);
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  @Permissions('alerts:manage')
  @ApiOperation({ summary: 'Send a test email immediately for this alert configuration' })
  @ApiParam({ name: 'id', description: 'Alert UUID' })
  @ApiResponse({ status: 200, description: 'Test email sent.' })
  @ApiResponse({ status: 404, description: 'Alert not found.' })
  sendTest(@Param('id') id: string) {
    return this.alertsService.sendTestEmail(id);
  }
}
