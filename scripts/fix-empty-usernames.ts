import { PrismaClient } from '@prisma/client';
import { uniqueNamesGenerator, adjectives, animals, Config } from 'unique-names-generator';

const prisma = new PrismaClient();

async function generateUniqueUsername(): Promise<string> {
  const customConfig: Config = {
    dictionaries: [adjectives, animals],
    separator: '-',
    length: 2,
  };
  
  let finalUsername: string;
  let attempts = 0;
  
  do {
    finalUsername = uniqueNamesGenerator(customConfig);
    attempts++;
    // Fallback to timestamp if too many attempts
    if (attempts > 10) {
      finalUsername = `user-${Date.now()}`;
      break;
    }
  } while (await prisma.user.findUnique({ where: { username: finalUsername } }));
  
  return finalUsername;
}

async function fixEmptyUsernames() {
  try {
    console.log('Starting to fix users with empty usernames...');
    
    // Find all users with null or empty usernames
    const usersWithEmptyUsernames = await prisma.user.findMany({
      where: {
        OR: [
          { username: null },
          { username: '' }
        ]
      }
    });
    
    console.log(`Found ${usersWithEmptyUsernames.length} users with empty usernames`);
    
    for (const user of usersWithEmptyUsernames) {
      const newUsername = await generateUniqueUsername();
      
      await prisma.user.update({
        where: { id: user.id },
        data: { username: newUsername }
      });
      
      console.log(`Updated user ${user.id} (${user.email}) with username: ${newUsername}`);
    }
    
    console.log('Finished fixing empty usernames');
  } catch (error) {
    console.error('Error fixing empty usernames:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixEmptyUsernames();