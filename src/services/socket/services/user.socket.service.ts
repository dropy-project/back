import client from '@/client';
import { User } from '@prisma/client';

export async function incrementUserEnergy(user: User, energyModification: number): Promise<void> {
  await client.user.update({
    where: { id: user.id },
    data: {
      energy: {
        increment: energyModification,
      },
    },
  });
  user.energy += energyModification;
}
