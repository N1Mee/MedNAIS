import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUserPurchases(email: string) {
  try {
    console.log(`\n🔍 Looking for user with email: ${email}`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        purchases: {
          include: {
            revenue: true,
            sop: {
              select: {
                title: true,
                id: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }

    console.log(`\n✅ Found user: ${user.name || 'No name'} (${user.email})`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Total purchases: ${user.purchases.length}`);

    if (user.purchases.length === 0) {
      console.log(`\n✅ User has no purchases to delete.`);
      return;
    }

    // Display purchase details
    console.log(`\n📦 Purchases to delete:`);
    user.purchases.forEach((purchase, index) => {
      console.log(`   ${index + 1}. SOP: ${purchase.sop.title}`);
      console.log(`      Purchase ID: ${purchase.id}`);
      console.log(`      Amount: $${purchase.amount}`);
      console.log(`      Status: ${purchase.status}`);
      console.log(`      Has Revenue: ${purchase.revenue ? 'Yes' : 'No'}`);
      if (purchase.revenue) {
        console.log(`      Revenue ID: ${purchase.revenue.id}`);
      }
    });

    // Count revenues to delete
    const revenueCount = user.purchases.filter(p => p.revenue).length;
    console.log(`\n💰 Total revenues to delete: ${revenueCount}`);

    // Delete revenues first
    console.log(`\n🗑️  Deleting revenues...`);
    const purchaseIds = user.purchases.map(p => p.id);
    
    const deletedRevenues = await prisma.revenue.deleteMany({
      where: {
        purchaseId: {
          in: purchaseIds
        }
      }
    });
    console.log(`   ✅ Deleted ${deletedRevenues.count} revenue records`);

    // Delete purchases
    console.log(`\n🗑️  Deleting purchases...`);
    const deletedPurchases = await prisma.purchase.deleteMany({
      where: {
        userId: user.id
      }
    });
    console.log(`   ✅ Deleted ${deletedPurchases.count} purchase records`);

    // Verify deletion
    console.log(`\n✔️  Verifying deletion...`);
    const remainingPurchases = await prisma.purchase.findMany({
      where: { userId: user.id }
    });
    
    const remainingRevenues = await prisma.revenue.findMany({
      where: {
        purchaseId: {
          in: purchaseIds
        }
      }
    });

    if (remainingPurchases.length === 0 && remainingRevenues.length === 0) {
      console.log(`   ✅ SUCCESS: All purchases and revenues have been deleted`);
      console.log(`   User ${user.email} can now test purchasing again!`);
    } else {
      console.log(`   ⚠️  WARNING: Some records remain:`);
      console.log(`      Remaining purchases: ${remainingPurchases.length}`);
      console.log(`      Remaining revenues: ${remainingRevenues.length}`);
    }

  } catch (error) {
    console.error('❌ Error deleting purchases:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address as argument');
  console.log('Usage: ts-node scripts/delete-user-purchases.ts <email>');
  process.exit(1);
}

// Run the deletion
deleteUserPurchases(email)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
