const { PrismaClient } = require('@prisma/client');
const { uniqueNamesGenerator, adjectives, animals } = require('unique-names-generator');

const prisma = new PrismaClient();

async function generateUniqueUsername(existingUsernames) {
  const customConfig = {
    dictionaries: [adjectives, animals],
    separator: '-',
    length: 2,
  };
  
  let finalUsername;
  let attempts = 0;
  
  do {
    finalUsername = uniqueNamesGenerator(customConfig);
    attempts++;
    // Fallback to timestamp if too many attempts
    if (attempts > 10) {
      finalUsername = `user-${Date.now()}`;
      break;
    }
  } while (existingUsernames.has(finalUsername));
  
  existingUsernames.add(finalUsername); // Add to set for next iterations
  return finalUsername;
}

async function fixEmptyUsernames() {
  try {
    console.log('Starting to fix users with empty usernames...');
    
    // Fetch all existing usernames once for efficiency
    const existingUsernames = new Set(
      (await prisma.user.findMany({
        select: { username: true },
        where: { 
          NOT: [
            { username: null }, 
            { username: '' }
          ] 
        }
      })).map(u => u.username).filter(Boolean)
    );
    
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
      const newUsername = await generateUniqueUsername(existingUsernames);
      
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