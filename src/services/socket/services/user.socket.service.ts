import client from '@/client';
import { User } from '@prisma/client';

export async function incrementUserEnergy(user: User, energyModification: number): Promise<void> {
  if (user.energy + energyModification >= 90) {
    user.energy = 90;
  } else if (user.energy + energyModification <= 0) {
    user.energy = 0;
  } else {
    user.energy += energyModification;
  }
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
