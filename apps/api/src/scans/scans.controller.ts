import { Controller, Get, Param } from '@nestjs/common';
import { ScansService } from './scans.service';

@Controller('scans')
export class ScansController {
    constructor(private readonly scansService: ScansService) { }


    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.scansService.findOne(id);
    }


    @Get(':id/logs')
    async getLogs(@Param('id') id: string) {
        try {
            return await this.scansService.getLogs(id);
        } catch (error) {
            console.error('Error fetching logs:', error);
            // Return error as success to see it
            return {
                status: 'error',
                message: error.message
            };
        }
    }

    @Get(':id/test')
    test(@Param('id') id: string) {
        return { ok: true, id };
    }
}
