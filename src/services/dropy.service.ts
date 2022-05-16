import { DropyDTO } from '@/dtos/dropy.dto';
import { Dropy, PrismaClient } from '@prisma/client';
import UserService from './users.service';

class DropyService {
  public dropies = new PrismaClient().dropy;
  public users = new UserService();

  public async createDropy(dropyData: DropyDTO): Promise<Dropy> {
    const user = await this.users.findUserById(dropyData.emitterId);
    const dropy = this.dropies.create({ data: { ...dropyData } });
    return dropy;
  }
}
export default DropyService;
