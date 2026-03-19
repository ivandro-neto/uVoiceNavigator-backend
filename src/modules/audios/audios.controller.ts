import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
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
import { AudiosService } from './audios.service';
import { CreateAudioDto } from './dto/create-audio.dto';
import { QueryAudiosDto } from './dto/query-audios.dto';

@ApiTags('audios')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('audios')
export class AudiosController {
  constructor(private readonly audiosService: AudiosService) {}

  @Get()
  @Permissions('audios:read')
  @ApiOperation({ summary: 'List audio files with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of audio files.' })
  findAll(@Query() query: QueryAudiosDto) {
    return this.audiosService.findAll(query);
  }

  @Get('dashboard-stats')
  @Permissions('audios:read')
  @ApiOperation({ summary: 'Get dashboard statistics for audio files and interactions' })
  @ApiResponse({ status: 200, description: 'Dashboard stats.' })
  getDashboardStats() {
    return this.audiosService.getDashboardStats();
  }

  @Get(':id')
  @Permissions('audios:read')
  @ApiOperation({ summary: 'Get audio file by ID' })
  @ApiParam({ name: 'id', description: 'Audio UUID' })
  @ApiResponse({ status: 200, description: 'Audio file found.' })
  @ApiResponse({ status: 404, description: 'Audio file not found.' })
  findOne(@Param('id') id: string) {
    return this.audiosService.findOne(id);
  }

  @Post()
  @Roles('admin', 'supervisor')
  @Permissions('audios:write')
  @ApiOperation({ summary: 'Register a new audio file' })
  @ApiResponse({ status: 201, description: 'Audio file registered.' })
  create(@Body() createAudioDto: CreateAudioDto) {
    return this.audiosService.create(createAudioDto);
  }

  @Put(':id')
  @Roles('admin', 'supervisor')
  @Permissions('audios:write')
  @ApiOperation({ summary: 'Update audio file status or metadata' })
  @ApiParam({ name: 'id', description: 'Audio UUID' })
  @ApiResponse({ status: 200, description: 'Audio file updated.' })
  @ApiResponse({ status: 404, description: 'Audio file not found.' })
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateAudioDto>,
  ) {
    return this.audiosService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('admin')
  @Permissions('audios:delete')
  @ApiOperation({ summary: 'Delete an audio file' })
  @ApiParam({ name: 'id', description: 'Audio UUID' })
  @ApiResponse({ status: 200, description: 'Audio file deleted.' })
  @ApiResponse({ status: 404, description: 'Audio file not found.' })
  remove(@Param('id') id: string) {
    return this.audiosService.remove(id);
  }
}
