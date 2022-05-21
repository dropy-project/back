import { DropyDTO } from '@/dtos/dropy.dto';
import { Dropy, PrismaClient } from '@prisma/client';
import UserService from './users.service';

class DropyService {
  public dropies = new PrismaClient().dropy;
  public users = new UserService();

  public async createDropy(dropyData: DropyDTO): Promise<Dropy> {
    const dropy = this.dropies.create({ data: { ...dropyData } });
    return dropy;
  }

  public async getDropies(): Promise<Dropy[]> {
    const dropies = await this.dropies.findMany();
    return dropies;
  }

  public async createDropyMedia(dropyId: number, mediaData: DropyDTO): Promise<Dropy> {
    const dropy = await this.dropies.update({
      where: { id: dropyId },
      data: { ...mediaData },
    });
    return dropy;
  }
}
export default DropyService;
