import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    create(@Body() createProjectDto: CreateProjectDto) {
        return this.projectsService.create(createProjectDto);
    }

    @Get()
    findAll() {
        return this.projectsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.projectsService.findOne(id);
    }

    @Get(':id/scans')
    findScans(@Param('id') id: string) {
        return this.projectsService.findScans(id);
    }

    @Post(':id/scans')
    createScan(@Param('id') id: string) {
        return this.projectsService.createScan(id);
    }

    @Post(':projectId/scans/:scanId/stop')
    stopScan(@Param('scanId') scanId: string) {
        return this.projectsService.stopScan(scanId);
    }

    @Get(':projectId/scans/:scanId/logs')
    getLogs(@Param() params: any) {
        console.log('[ProjectsController] Route Params:', params);
        return this.projectsService.getLogs(params.scanId);
    }

    @Post(':id/delete')
    delete(@Param('id') id: string) {
        return this.projectsService.delete(id);
    }
}
