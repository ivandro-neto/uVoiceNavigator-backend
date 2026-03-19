import { Injectable, NotFoundException } from '@nestjs/common';
import { createPaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PrismaService } from '../../database/prisma.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { QueryInteractionsDto } from './dto/query-interactions.dto';

@Injectable()
export class InteractionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryInteractionsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      recordType,
      agentName,
      campaign,
      status,
      dateFrom,
      dateTo,
      orderBy = 'date',
      orderDir = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (recordType) {
      where.recordType = recordType;
    }

    if (agentName) {
      where.agentName = { contains: agentName, mode: 'insensitive' };
    }

    if (campaign) {
      where.campaign = { contains: campaign, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { agentName: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { callId: { contains: search, mode: 'insensitive' } },
        { campaign: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedOrderFields = [
      'date', 'agentName', 'campaign', 'customerName', 'talkTime',
      'handleTime', 'status', 'createdAt',
    ];
    const orderField = allowedOrderFields.includes(orderBy) ? orderBy : 'date';

    const [interactions, total] = await Promise.all([
      this.prisma.interaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: orderDir },
      }),
      this.prisma.interaction.count({ where }),
    ]);

    return createPaginatedResult(interactions, total, page, limit);
  }

  async findOne(id: string) {
    const interaction = await this.prisma.interaction.findUnique({ where: { id } });

    if (!interaction) {
      throw new NotFoundException(`Interaction with ID ${id} not found`);
    }

    return interaction;
  }

  async getStatistics(dateFrom?: string, dateTo?: string) {
    const where: any = {};

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [total, inbound, outbound, abandoned, evaluated, pending, processed, error] =
      await Promise.all([
        this.prisma.interaction.count({ where }),
        this.prisma.interaction.count({ where: { ...where, recordType: 'inbound' } }),
        this.prisma.interaction.count({ where: { ...where, recordType: 'outbound' } }),
        this.prisma.interaction.count({ where: { ...where, abandoned: true } }),
        this.prisma.interaction.count({ where: { ...where, evaluated: true } }),
        this.prisma.interaction.count({ where: { ...where, status: 'pending' } }),
        this.prisma.interaction.count({ where: { ...where, status: 'processed' } }),
        this.prisma.interaction.count({ where: { ...where, status: 'error' } }),
      ]);

    const timesAgg = await this.prisma.interaction.aggregate({
      where,
      _avg: {
        talkTime: true,
        handleTime: true,
        holdTime: true,
        waitTime: true,
        wrapTime: true,
      },
      _sum: {
        talkTime: true,
        handleTime: true,
      },
    });

    const abandonRate = total > 0 ? (abandoned / total) * 100 : 0;
    const evaluationRate = total > 0 ? (evaluated / total) * 100 : 0;
    const processingRate = total > 0 ? (processed / total) * 100 : 0;

    return {
      totalInteractions: total,
      totalInbound: inbound,
      totalOutbound: outbound,
      totalAbandoned: abandoned,
      totalEvaluated: evaluated,
      totalPending: pending,
      totalProcessed: processed,
      totalErrors: error,
      abandonRate: Math.round(abandonRate * 100) / 100,
      evaluationRate: Math.round(evaluationRate * 100) / 100,
      processingRate: Math.round(processingRate * 100) / 100,
      averageTalkTime: Math.round(timesAgg._avg.talkTime || 0),
      averageHandleTime: Math.round(timesAgg._avg.handleTime || 0),
      averageHoldTime: Math.round(timesAgg._avg.holdTime || 0),
      averageWaitTime: Math.round(timesAgg._avg.waitTime || 0),
      averageWrapTime: Math.round(timesAgg._avg.wrapTime || 0),
      totalTalkTime: timesAgg._sum.talkTime || 0,
      totalHandleTime: timesAgg._sum.handleTime || 0,
    };
  }

  async create(dto: CreateInteractionDto) {
    return this.prisma.interaction.create({
      data: {
        recordType:         dto.recordType,
        callId:             dto.callId,
        date:               new Date(dto.date),
        agentName:          dto.agentName,
        agentId:            dto.agentId,
        campaign:           dto.campaign,
        campaignType:       dto.campaignType,
        skill:              dto.skill,
        customerName:       dto.customerName,
        customerEmail:      dto.customerEmail      ?? '',
        customerPhone:      dto.customerPhone,
        ani:                dto.ani                ?? '',
        dnis:               dto.dnis               ?? '',
        segment:            dto.segment            ?? '',
        list:               dto.list               ?? '',
        contactId:          dto.contactId          ?? '',
        talkTime:           dto.talkTime,
        handleTime:         dto.handleTime,
        holdTime:           dto.holdTime           ?? 0,
        ivrTime:            dto.ivrTime            ?? 0,
        waitTime:           dto.waitTime           ?? 0,
        wrapTime:           dto.wrapTime           ?? 0,
        disposition:        dto.disposition,
        dispositionGroupA:  dto.dispositionGroupA  ?? '',
        dispositionGroupB:  dto.dispositionGroupB  ?? '',
        dispositionGroupC:  dto.dispositionGroupC  ?? '',
        dialResult:         dto.dialResult         ?? '',
        abandoned:          dto.abandoned          ?? false,
        callCount:          dto.callCount          ?? 1,
        suspensionCount:    dto.suspensionCount     ?? 0,
        ivrContact:         dto.ivrContact         ?? '',
        ivrNif:             dto.ivrNif             ?? '',
        ivrAccountNumber:   dto.ivrAccountNumber   ?? '',
        businessMonth:      dto.businessMonth,
        businessDayOfWeek:  dto.businessDayOfWeek,
        businessDayOfMonth: dto.businessDayOfMonth,
        businessHour:       dto.businessHour,
        evaluated:          dto.evaluated          ?? false,
        status:             dto.status             ?? 'pending',
      },
    });
  }

  async update(id: string, dto: Partial<CreateInteractionDto>) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};

    if (dto.recordType        !== undefined) data.recordType        = dto.recordType;
    if (dto.callId            !== undefined) data.callId            = dto.callId;
    if (dto.date              !== undefined) data.date              = new Date(dto.date);
    if (dto.agentName         !== undefined) data.agentName         = dto.agentName;
    if (dto.agentId           !== undefined) data.agentId           = dto.agentId;
    if (dto.campaign          !== undefined) data.campaign          = dto.campaign;
    if (dto.campaignType      !== undefined) data.campaignType      = dto.campaignType;
    if (dto.skill             !== undefined) data.skill             = dto.skill;
    if (dto.customerName      !== undefined) data.customerName      = dto.customerName;
    if (dto.customerEmail     !== undefined) data.customerEmail     = dto.customerEmail;
    if (dto.customerPhone     !== undefined) data.customerPhone     = dto.customerPhone;
    if (dto.ani               !== undefined) data.ani               = dto.ani;
    if (dto.dnis              !== undefined) data.dnis              = dto.dnis;
    if (dto.segment           !== undefined) data.segment           = dto.segment;
    if (dto.list              !== undefined) data.list              = dto.list;
    if (dto.contactId         !== undefined) data.contactId         = dto.contactId;
    if (dto.talkTime          !== undefined) data.talkTime          = dto.talkTime;
    if (dto.handleTime        !== undefined) data.handleTime        = dto.handleTime;
    if (dto.holdTime          !== undefined) data.holdTime          = dto.holdTime;
    if (dto.ivrTime           !== undefined) data.ivrTime           = dto.ivrTime;
    if (dto.waitTime          !== undefined) data.waitTime          = dto.waitTime;
    if (dto.wrapTime          !== undefined) data.wrapTime          = dto.wrapTime;
    if (dto.disposition       !== undefined) data.disposition       = dto.disposition;
    if (dto.dispositionGroupA !== undefined) data.dispositionGroupA = dto.dispositionGroupA;
    if (dto.dispositionGroupB !== undefined) data.dispositionGroupB = dto.dispositionGroupB;
    if (dto.dispositionGroupC !== undefined) data.dispositionGroupC = dto.dispositionGroupC;
    if (dto.dialResult        !== undefined) data.dialResult        = dto.dialResult;
    if (dto.abandoned         !== undefined) data.abandoned         = dto.abandoned;
    if (dto.callCount         !== undefined) data.callCount         = dto.callCount;
    if (dto.suspensionCount   !== undefined) data.suspensionCount   = dto.suspensionCount;
    if (dto.ivrContact        !== undefined) data.ivrContact        = dto.ivrContact;
    if (dto.ivrNif            !== undefined) data.ivrNif            = dto.ivrNif;
    if (dto.ivrAccountNumber  !== undefined) data.ivrAccountNumber  = dto.ivrAccountNumber;
    if (dto.businessMonth     !== undefined) data.businessMonth     = dto.businessMonth;
    if (dto.businessDayOfWeek !== undefined) data.businessDayOfWeek = dto.businessDayOfWeek;
    if (dto.businessDayOfMonth!== undefined) data.businessDayOfMonth= dto.businessDayOfMonth;
    if (dto.businessHour      !== undefined) data.businessHour      = dto.businessHour;
    if (dto.evaluated         !== undefined) data.evaluated         = dto.evaluated;
    if (dto.status            !== undefined) data.status            = dto.status;

    return this.prisma.interaction.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.interaction.delete({ where: { id } });
    return { message: `Interaction ${id} deleted successfully` };
  }
}
