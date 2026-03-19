import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  private getDateRange(period: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '14d':
        start.setDate(start.getDate() - 14);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }

    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  async getStats(period: string = '7d') {
    const { start, end } = this.getDateRange(period);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrowStart = new Date(today);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const audioWhere = { uploadedAt: { gte: start, lte: end } };
    const interactionWhere = { date: { gte: start, lte: end } };

    const [
      totalAudiosToday,
      totalAudiosYesterday,
      totalInteractions,
      totalInbound,
      totalOutbound,
      totalAbandoned,
      processedAudios,
      totalAudios,
      totalSizeAgg,
    ] = await Promise.all([
      this.prisma.audio.count({ where: { uploadedAt: { gte: today, lt: tomorrowStart } } }),
      this.prisma.audio.count({ where: { uploadedAt: { gte: yesterday, lt: today } } }),
      this.prisma.interaction.count({ where: interactionWhere }),
      this.prisma.interaction.count({ where: { ...interactionWhere, recordType: 'inbound' } }),
      this.prisma.interaction.count({ where: { ...interactionWhere, recordType: 'outbound' } }),
      this.prisma.interaction.count({ where: { ...interactionWhere, abandoned: true } }),
      this.prisma.audio.count({ where: { ...audioWhere, status: 'processed' } }),
      this.prisma.audio.count({ where: audioWhere }),
      this.prisma.audio.aggregate({ _sum: { fileSize: true } }),
    ]);

    const processingRate =
      totalAudios > 0 ? Math.round((processedAudios / totalAudios) * 100) : 0;

    return {
      totalAudiosToday,
      totalAudiosYesterday,
      totalInteractions,
      totalInbound,
      totalOutbound,
      totalAbandoned,
      processingRate,
      storageUsed: totalSizeAgg._sum.fileSize || 0,
    };
  }

  async getTrends(period: string = '7d') {
    const { start, end } = this.getDateRange(period);

    // Calculate number of days
    const diffMs = end.getTime() - start.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const trends = [];

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(start);
      dayStart.setDate(dayStart.getDate() + i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const [audios, interactions, inbound, outbound, abandoned] = await Promise.all([
        this.prisma.audio.count({
          where: { uploadedAt: { gte: dayStart, lt: dayEnd } },
        }),
        this.prisma.interaction.count({
          where: { date: { gte: dayStart, lt: dayEnd } },
        }),
        this.prisma.interaction.count({
          where: { date: { gte: dayStart, lt: dayEnd }, recordType: 'inbound' },
        }),
        this.prisma.interaction.count({
          where: { date: { gte: dayStart, lt: dayEnd }, recordType: 'outbound' },
        }),
        this.prisma.interaction.count({
          where: { date: { gte: dayStart, lt: dayEnd }, abandoned: true },
        }),
      ]);

      trends.push({
        date: dayStart.toISOString().split('T')[0],
        audios,
        interactions,
        inbound,
        outbound,
        abandoned,
      });
    }

    return trends;
  }

  async getHourlyData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(today);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const hourlyData = [];

    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(today);
      hourStart.setHours(hour, 0, 0, 0);

      const hourEnd = new Date(today);
      hourEnd.setHours(hour + 1, 0, 0, 0);

      const [interactions, audios] = await Promise.all([
        this.prisma.interaction.count({
          where: { date: { gte: hourStart, lt: hourEnd } },
        }),
        this.prisma.audio.count({
          where: { uploadedAt: { gte: hourStart, lt: hourEnd } },
        }),
      ]);

      hourlyData.push({
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
        interactions,
        audios,
      });
    }

    return hourlyData;
  }

  async getTopAgents(period: string = '7d', limit: number = 10) {
    const { start, end } = this.getDateRange(period);

    const agents = await this.prisma.interaction.groupBy({
      by: ['agentName', 'agentId'],
      where: { date: { gte: start, lte: end } },
      _count: {
        id: true,
      },
      _avg: {
        talkTime: true,
        handleTime: true,
      },
      _sum: {
        talkTime: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    return agents.map((agent) => ({
      agentName: agent.agentName,
      agentId: agent.agentId,
      totalInteractions: agent._count.id,
      avgTalkTime: Math.round(agent._avg.talkTime || 0),
      avgHandleTime: Math.round(agent._avg.handleTime || 0),
      totalTalkTime: agent._sum.talkTime || 0,
    }));
  }

  async getSourceDistribution() {
    const [goContactCount, five9Count, goContactTotal, five9Total] = await Promise.all([
      this.prisma.audio.count({ where: { source: 'GO_CONTACT' } }),
      this.prisma.audio.count({ where: { source: 'FIVE9' } }),
      this.prisma.audio.aggregate({
        where: { source: 'GO_CONTACT' },
        _sum: { fileSize: true, duration: true },
      }),
      this.prisma.audio.aggregate({
        where: { source: 'FIVE9' },
        _sum: { fileSize: true, duration: true },
      }),
    ]);

    const total = goContactCount + five9Count;

    return {
      total,
      sources: [
        {
          source: 'GO_CONTACT',
          count: goContactCount,
          percentage: total > 0 ? Math.round((goContactCount / total) * 100 * 10) / 10 : 0,
          totalFileSize: goContactTotal._sum.fileSize || 0,
          totalDuration: goContactTotal._sum.duration || 0,
        },
        {
          source: 'FIVE9',
          count: five9Count,
          percentage: total > 0 ? Math.round((five9Count / total) * 100 * 10) / 10 : 0,
          totalFileSize: five9Total._sum.fileSize || 0,
          totalDuration: five9Total._sum.duration || 0,
        },
      ],
    };
  }
}
