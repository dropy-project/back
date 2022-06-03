import client from '@/client';
import { DropyDTO } from '@/dtos/dropy.dto';
import { HttpException } from '@/exceptions/HttpException';
import { DropyAround } from '@/interfaces/dropy.interface';
import { Dropy, MediaType } from '@prisma/client';
import { UploadedFile } from 'express-fileupload';

const DISTANCE_FILTER_RADIUS = 0.004; // Environ 300m

class DropyService {
  public async createDropy(dropyData: DropyDTO): Promise<Dropy> {
    const user = await client.user.findUnique({ where: { id: dropyData.emitterId } });

    if (user == undefined) {
      throw new HttpException(404, `User with emitterid ${dropyData.emitterId} not found`);
    }

    const dropy = client.dropy.create({ data: { ...dropyData } });
    return dropy;
  }

  public async getDropies(): Promise<Dropy[]> {
    const dropies = await client.dropy.findMany();
    return dropies;
  }

  public async createDropyMedia(dropyId: number, mediaPayload: UploadedFile | string, mediaType: MediaType) {
    const dropy = await client.dropy.findUnique({ where: { id: dropyId } });

    if (dropy == undefined) {
      throw new HttpException(404, `Dropy with id ${dropyId} not found`);
    }

    if (dropy.mediaType !== MediaType.NONE) {
      throw new HttpException(409, `Dropy with id ${dropyId} has already a linked media`);
    }

    const isFile = (mediaPayload as UploadedFile).data != undefined;

    if (isFile) {
      if (mediaType == MediaType.TEXT || mediaType == MediaType.MUSIC) {
        throw new HttpException(406, `MediaType ${mediaType} cannot have a text or music ressource as media`);
      }
    } else {
      if (mediaType == MediaType.PICTURE || mediaType == MediaType.VIDEO) {
        throw new HttpException(406, `MediaType ${mediaType} cannot have a file as media`);
      }
    }

    if (isFile) {
      const file = mediaPayload as UploadedFile;
      const filePath = `${process.cwd()}/public/dropiesMedias/${dropyId}`;
      file.mv(filePath);
      await client.dropy.update({
        where: { id: dropyId },
        data: { filePath: filePath, mediaType: mediaType },
      });
    } else {
      await client.dropy.update({
        where: { id: dropyId },
        data: { mediaData: mediaPayload as string, mediaType: mediaType },
      });
    }
  }

  public findAround = async (userId: number, latitude: number, longitude: number): Promise<DropyAround[]> => {
    const user = await client.user.findUnique({ where: { id: userId } });

    if (user == undefined) {
      throw new HttpException(404, `User with id ${userId} not found`);
    }

    const dropies = await client.dropy.findMany({
      where: {
        AND: [
          {
            latitude: {
              gt: latitude - DISTANCE_FILTER_RADIUS,
              lt: latitude + DISTANCE_FILTER_RADIUS,
            },
          },
          {
            longitude: {
              gt: longitude - DISTANCE_FILTER_RADIUS,
              lt: longitude + DISTANCE_FILTER_RADIUS,
            },
          },
          {
            mediaType: {
              not: MediaType.NONE,
            },
          },
          {
            receiver: {
              is: undefined,
            },
          },
        ],
      },
    });

    const dropyAround = dropies.map(dropy => {
      return {
        id: dropy.id,
        creationDate: dropy.creationDate,
        latitude: dropy.latitude,
        longitude: dropy.longitude,
        isUserDropy: dropy.emitterId == userId,
      };
    });

    return dropyAround;
  };

  public retrieveDropy = async()
}
export default DropyService;
