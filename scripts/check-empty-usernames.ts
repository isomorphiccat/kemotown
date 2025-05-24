import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEmptyUsernames() {
  try {
    console.log('Checking for users with empty or null usernames...\n');
    
    // Find all users with null or empty usernames
    const usersWithEmptyUsernames = await prisma.user.findMany({
      where: {
        OR: [
          { username: null },
          { username: '' }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        username: true
      }
    });
    
    if (usersWithEmptyUsernames.length === 0) {
      console.log('✅ No users found with empty usernames!');
    } else {
      console.log(`⚠️  Found ${usersWithEmptyUsernames.length} users with empty usernames:\n`);
      
      // Display in a table format
      console.log('ID                                    | Email                    | Name              | Created At');
      console.log('--------------------------------------|--------------------------|--------------------|------------------------');
      
      for (const user of usersWithEmptyUsernames) {
        const id = user.id.padEnd(36);
        
        // Handle long values more elegantly with ellipsis
        const email = (user.email || '');
        const emailDisplay = email.length > 24 ? email.substring(0, 21) + '...' : email.padEnd(24);
        
        const name = (user.name || '');
        const nameDisplay = name.length > 18 ? name.substring(0, 15) + '...' : name.padEnd(18);
        
        const createdAt = user.createdAt.toISOString().substring(0, 19);
        
        console.log(`${id} | ${emailDisplay} | ${nameDisplay} | ${createdAt}`);
      }
      
      console.log('\n\nTo fix these manually, you can run SQL queries like:');
      console.log('UPDATE "User" SET username = \'unique-username\' WHERE id = \'user-id\';');
      console.log('\nOr use the fix:usernames script to automatically assign random usernames.');
    }
    
    // Also show users who already have usernames
    const totalUsers = await prisma.user.count();
    const usersWithUsernames = totalUsers - usersWithEmptyUsernames.length;
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with usernames: ${usersWithUsernames}`);
    console.log(`   Users without usernames: ${usersWithEmptyUsernames.length}`);
    
  } catch (error) {
    console.error('Error checking usernames:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkEmptyUsernames();