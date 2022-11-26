import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import client from '@/client';
import { User } from '@prisma/client';

export async function incrementUserEnergy(socket: AuthenticatedSocket, energyIncrement: number): Promise<{ newEnergy: number; oldEnergy: number }> {
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

  const oldEnergyValue = socket.user.energy;
  socket.user = newUser;
  return { newEnergy: newUser.energy, oldEnergy: oldEnergyValue };
}

export async function incrementUserBadgeNotification(user: User): Promise<User> {
  const newUser = await client.user.update({
    where: { id: user.id },
    data: {
      notificationBadgeCount: {
        increment: 1,
      },
    },
  });

  return newUser;
}

export async function resetUserBadgeNotification(user: User): Promise<User> {
  const newUser = await client.user.update({
    where: { id: user.id },
    data: {
      notificationBadgeCount: 0,
    },
  });

  return newUser;
}
