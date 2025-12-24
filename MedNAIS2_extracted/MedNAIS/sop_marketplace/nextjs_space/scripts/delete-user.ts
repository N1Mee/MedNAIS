import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUser(email: string) {
  try {
    console.log(`🔍 Searching for user with email: ${email}`);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        sops: true,
        purchases: true,
        sessions: true,
        ratings: true,
        comments: true,
        cartItems: true,
      },
    });

    if (!user) {
      console.log(`❌ User with email ${email} not found in the database.`);
      return;
    }

    console.log(`✅ User found:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Name: ${user.name || 'N/A'}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Created: ${user.createdAt}`);
    console.log(`\n📊 Related data:`);
    console.log(`   - SOPs: ${user.sops.length}`);
    console.log(`   - Purchases: ${user.purchases.length}`);
    console.log(`   - Sessions: ${user.sessions.length}`);
    console.log(`   - Ratings: ${user.ratings.length}`);
    console.log(`   - Comments: ${user.comments.length}`);
    console.log(`   - Cart Items: ${user.cartItems.length}`);

    console.log(`\n🗑️  Deleting user and all related data...`);

    // Delete the user (cascade deletes will handle related records)
    await prisma.user.delete({
      where: { email },
    });

    console.log(`✅ User ${email} and all related data have been successfully deleted!`);

    // Verify deletion
    const verifyUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!verifyUser) {
      console.log(`✅ Deletion verified: User ${email} no longer exists in the database.`);
    } else {
      console.log(`⚠️  Warning: User still exists after deletion attempt.`);
    }

  } catch (error) {
    console.error(`❌ Error deleting user:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'wildmaker228@gmail.com';

deleteUser(email)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
