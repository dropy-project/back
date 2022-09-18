import client from '@/client';
import { User } from '@prisma/client';

export async function incrementUserEnergy(user: User, energyIncrement: number): Promise<void> {
  let newEnergyValue = 0;
  if (user.energy + energyIncrement >= 90) {
    newEnergyValue = 90;
  } else if (user.energy + energyIncrement <= 0) {
    newEnergyValue = 0;
  } else {
    newEnergyValue += energyIncrement;
  }
  await client.user.update({
    where: { id: user.id },
    data: {
      energy: newEnergyValue,
    },
  });
  user.energy = newEnergyValue;
}
