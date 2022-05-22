import { DropyDTO } from '@/dtos/dropy.dto';
import { HttpException } from '@/exceptions/HttpException';
import { Dropy, MediaType, PrismaClient } from '@prisma/client';
import { UploadedFile } from 'express-fileupload';

class DropyService {
  public dropies = new PrismaClient().dropy;

  public async createDropy(dropyData: DropyDTO): Promise<Dropy> {
    const dropy = this.dropies.create({ data: { ...dropyData } });
    return dropy;
  }

  public async getDropies(): Promise<Dropy[]> {
    const dropies = await this.dropies.findMany();
    return dropies;
  }

  public async createDropyMedia(dropyId: number, mediaPayload: UploadedFile | string, mediaType: MediaType) {
    const dropy = await this.dropies.findUnique({ where: { id: dropyId } });

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
      await this.dropies.update({
        where: { id: dropyId },
        data: { filePath: filePath, mediaType: mediaType },
      });
    } else {
      await this.dropies.update({
        where: { id: dropyId },
        data: { mediaData: mediaPayload as string, mediaType: mediaType },
      });
    }
  }
}
export default DropyService;
