import { NextFunction, Response } from 'express';
import { MediaType } from '@prisma/client';
import { HttpException } from '@/exceptions/HttpException';
import { AuthenticatedRequest } from '@interfaces/auth.interface';
import * as metricsService from '@services/api/services/metrics.service';
import * as utils from '@utils/controller.utils';

export async function API(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const data = await metricsService.API();
}
