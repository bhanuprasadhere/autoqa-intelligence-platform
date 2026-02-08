import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  const mockQueue = {
    add: jest.fn(),
  };

  const mockPrisma = {
    profile: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    scan: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: getQueueToken('scan-jobs'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('URL Validation', () => {
    it('should reject localhost URLs', () => {
      const result = service['validateUrl']('http://localhost:3000');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('localhost');
    });

    it('should reject 127.0.0.1', () => {
      const result = service['validateUrl']('http://127.0.0.1:8080');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('localhost');
    });

    it('should reject .local domains', () => {
      const result = service['validateUrl']('http://myserver.local');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('localhost');
    });

    it('should reject private IP 10.x.x.x', () => {
      const result = service['validateUrl']('http://10.0.0.1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('private IP');
    });

    it('should reject private IP 192.168.x.x', () => {
      const result = service['validateUrl']('http://192.168.1.1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('private IP');
    });

    it('should reject private IP 172.16-31.x.x', () => {
      const result = service['validateUrl']('http://172.16.0.1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('private IP');
    });

    it('should reject non-HTTP protocols', () => {
      const result = service['validateUrl']('ftp://example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('HTTP');
    });

    it('should accept valid HTTP URLs', () => {
      const result = service['validateUrl']('http://example.com');
      expect(result.valid).toBe(true);
    });

    it('should accept valid HTTPS URLs', () => {
      const result = service['validateUrl']('https://example.com');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const result = service['validateUrl']('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid URL format');
    });

    it('should accept public IPs', () => {
      const result = service['validateUrl']('http://8.8.8.8');
      expect(result.valid).toBe(true);
    });
  });

  describe('create', () => {
    it('should throw error for invalid URL', async () => {
      await expect(
        service.create({
          name: 'Test',
          baseUrl: 'localhost:3000',
          userId: '123',
        })
      ).rejects.toThrow('Only HTTP and HTTPS protocols are supported');
    });

    it('should create project with valid URL', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({ id: '123' });
      mockPrisma.project.create.mockResolvedValue({
        id: 'proj-123',
        name: 'Test',
        baseUrl: 'https://example.com',
        userId: '123',
      });
      mockPrisma.scan.create.mockResolvedValue({
        id: 'scan-123',
        projectId: 'proj-123',
      });

      const result = await service.create({
        name: 'Test',
        baseUrl: 'https://example.com',
        userId: '123',
      });

      expect(result).toHaveProperty('id', 'proj-123');
      expect(result).toHaveProperty('scanId', 'scan-123');
      expect(mockQueue.add).toHaveBeenCalled();
    });
  });
});
