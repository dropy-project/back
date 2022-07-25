import client from '@/prisma/client';

export async function displayNameToUsername(displayName: string): Promise<string> {
  const username: string = displayName.toLowerCase().trim().normalize('NFD');
  const cleanedUsername = username
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s/g, '_')
    .replace(/[^\w\s]/gi, '');

  let count = 0;
  let uniqueUsername = cleanedUsername;
  while (await client.user.findUnique({ where: { username: uniqueUsername } })) {
    uniqueUsername = username + count.toString();
    count++;
  }
  return uniqueUsername;
}
