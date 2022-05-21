import { DropyDTO } from '@/dtos/dropy.dto';
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

  public async createDropyMedia(dropyId: number, file: UploadedFile, mediaType: MediaType) {
    // TODO :
    // - récup le dropy et check si il existe
    // - check si le mediaType est valide (Correspond au type de fichier)
    // - ajouter le media dans le dropy
  }
}
export default DropyService;
