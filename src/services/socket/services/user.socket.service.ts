import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import client from '@/client';

export async function incrementUserEnergy(socket: AuthenticatedSocket, energyIncrement: number): Promise<number> {
  let newEnergyValue = socket.user.energy + energyIncrement;

  if (newEnergyValue >= 90) {
    newEnergyValue = 90;
  } else if (newEnergyValue <= 0) {
    newEnergyValue = 0;
  }

  const newUser = await client.user.update({
    where: { id: socket.user.id },
    data: {
      energy: newEnergyValue,
    },
  });

  socket.user = newUser;
  return newEnergyValue;
}
