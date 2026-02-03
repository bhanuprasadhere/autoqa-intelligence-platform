export class CreateProjectDto {
    name: string;
    baseUrl: string;
    userId: string; // Temporary: passed manually until Auth is fully integrated
}
