
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user (john@doe.com)
  // const adminPassword = await bcrypt.hash('johndoe123', 10);
  
  // const adminUser = await prisma.user.upsert({
  //   where: { email: 'john@doe.com' },
  //   update: {},
  //   create: {
  //     email: 'john@doe.com',
  //     password: adminPassword,
  //     name: 'John Doe',
  //   },
  // });

  // Create categories
  console.log('Creating categories...');
  
  // const categories = [
  //   { name: 'Cooking', description: 'Recipes and cooking techniques' },
  //   { name: 'Medicine', description: 'Medical procedures and protocols' },
  //   { name: 'Laboratory Diagnostics', description: 'Laboratory tests and analyses' },
  //   { name: 'Manufacturing', description: 'Manufacturing processes and operations' },
  //   { name: 'Education', description: 'Teaching procedures and methods' },
  //   { name: 'IT and Technology', description: 'Technical procedures and instructions' },
  //   { name: 'Business Processes', description: 'Corporate procedures and standards' },
  //   { name: 'Safety', description: 'Safety and occupational health procedures' },
  // ];

  // for (const category of categories) {
  //   await prisma.category.upsert({
  //     where: { name: category.name },
  //     update: {},
  //     create: category,
  //   });
  // }

  // const cookingCategory = await prisma.category.findUnique({ where: { name: 'Cooking' } });
  // const medicalCategory = await prisma.category.findUnique({ where: { name: 'Medicine' } });

  // // Create sample SOPs
  // const cookingSOP = await prisma.sOP.create({
  //   data: {
  //     title: 'Perfect Chocolate Chip Cookies',
  //     description: 'A detailed recipe for baking delicious chocolate chip cookies with precise timing and techniques.',
  //     type: 'MARKETPLACE',
  //     price: 999, // $9.99
  //     creatorId: sampleUser.id,
  //     categoryId: cookingCategory?.id,
  //     steps: {
  //       create: [
  //         {
  //           order: 1,
  //           title: 'Gather Ingredients',
  //           description: 'Collect all necessary ingredients: 2 cups flour, 1 cup butter, 3/4 cup brown sugar, 1/2 cup white sugar, 2 eggs, 2 tsp vanilla, 1 tsp baking soda, 1 tsp salt, 2 cups chocolate chips.',
  //           timerSeconds: 300, // 5 minutes
  //         },
  //         {
  //           order: 2,
  //           title: 'Preheat Oven',
  //           description: 'Preheat your oven to 375°F (190°C). This ensures even baking.',
  //           timerSeconds: 600, // 10 minutes
  //         },
  //         {
  //           order: 3,
  //           title: 'Mix Dry Ingredients',
  //           description: 'In a bowl, whisk together flour, baking soda, and salt. Set aside.',
  //           timerSeconds: 120, // 2 minutes
  //         },
  //         {
  //           order: 4,
  //           title: 'Cream Butter and Sugars',
  //           description: 'In a large mixing bowl, cream together softened butter, brown sugar, and white sugar until light and fluffy.',
  //           timerSeconds: 180, // 3 minutes
  //         },
  //         {
  //           order: 5,
  //           title: 'Add Eggs and Vanilla',
  //           description: 'Beat in eggs one at a time, then add vanilla extract. Mix until well combined.',
  //           timerSeconds: 120, // 2 minutes
  //         },
  //         {
  //           order: 6,
  //           title: 'Combine Wet and Dry',
  //           description: 'Gradually mix in the flour mixture until just combined. Don\'t overmix.',
  //           timerSeconds: 90, // 1.5 minutes
  //         },
  //         {
  //           order: 7,
  //           title: 'Add Chocolate Chips',
  //           description: 'Fold in chocolate chips with a wooden spoon or spatula.',
  //           timerSeconds: 60, // 1 minute
  //         },
  //         {
  //           order: 8,
  //           title: 'Shape and Bake',
  //           description: 'Drop rounded tablespoons of dough onto ungreased baking sheets. Bake for 9-11 minutes until golden brown.',
  //           timerSeconds: 660, // 11 minutes
  //         },
  //         {
  //           order: 9,
  //           title: 'Cool and Enjoy',
  //           description: 'Let cookies cool on baking sheet for 5 minutes, then transfer to wire rack. Enjoy!',
  //           timerSeconds: 300, // 5 minutes
  //         },
  //       ]
  //     }
  //   }
  // });

  // const workflowSOP = await prisma.sOP.create({
  //   data: {
  //     title: 'Morning Coffee Preparation',
  //     description: 'A simple but effective morning routine for preparing the perfect cup of coffee.',
  //     type: 'PERSONAL',
  //     creatorId: adminUser.id,
  //     categoryId: cookingCategory?.id,
  //     steps: {
  //       create: [
  //         {
  //           order: 1,
  //           title: 'Gather Equipment',
  //           description: 'Get your coffee maker, fresh coffee beans, grinder, filter, and measuring tools.',
  //           timerSeconds: 120,
  //         },
  //         {
  //           order: 2,
  //           title: 'Measure and Grind Beans',
  //           description: 'Measure 2 tablespoons of coffee beans per cup. Grind to medium-coarse consistency.',
  //           timerSeconds: 180,
  //         },
  //         {
  //           order: 3,
  //           title: 'Prepare Water',
  //           description: 'Fill coffee maker with fresh, cold water. Use filtered water for best taste.',
  //           timerSeconds: 60,
  //         },
  //         {
  //           order: 4,
  //           title: 'Add Coffee and Brew',
  //           description: 'Place filter in coffee maker, add ground coffee, and start brewing cycle.',
  //           timerSeconds: 300,
  //         },
  //         {
  //           order: 5,
  //           title: 'Serve and Enjoy',
  //           description: 'Pour coffee into your favorite mug and enjoy while hot!',
  //           timerSeconds: 30,
  //         },
  //       ]
  //     }
  //   }
  // });

  // // Create a sample group
  // let group = await prisma.group.findUnique({
  //   where: { inviteCode: 'KITCHEN2024' }
  // });
  
  // if (!group) {
  //   group = await prisma.group.create({
  //     data: {
  //       name: 'Kitchen Team',
  //       description: 'Standardized procedures for our restaurant kitchen operations',
  //       inviteCode: 'KITCHEN2024',
  //       adminId: adminUser.id,
  //       memberships: {
  //         create: [
  //           {
  //             userId: adminUser.id,
  //             status: 'APPROVED',
  //           },
  //           {
  //             userId: sampleUser.id,
  //             status: 'APPROVED',
  //           }
  //         ]
  //       }
  //     }
  //   });
  // }

  // // Create a group SOP
  // const safetyCategory = await prisma.category.findUnique({ where: { name: 'Safety' } });
  
  // const groupSOP = await prisma.sOP.create({
  //   data: {
  //     title: 'Kitchen Opening Checklist',
  //     description: 'Daily opening procedures for the kitchen team to ensure food safety and readiness.',
  //     type: 'GROUP',
  //     creatorId: adminUser.id,
  //     groupId: group.id,
  //     categoryId: safetyCategory?.id,
  //     steps: {
  //       create: [
  //         {
  //           order: 1,
  //           title: 'Check Temperature Logs',
  //           description: 'Verify all refrigerator and freezer temperatures are within safe ranges.',
  //           timerSeconds: 180,
  //         },
  //         {
  //           order: 2,
  //           title: 'Inspect Equipment',
  //           description: 'Check all cooking equipment for proper function and cleanliness.',
  //           timerSeconds: 300,
  //         },
  //         {
  //           order: 3,
  //           title: 'Review Daily Prep List',
  //           description: 'Go through the prep list and assign tasks to team members.',
  //           timerSeconds: 240,
  //         },
  //         {
  //           order: 4,
  //           title: 'Stock Preparation Areas',
  //           description: 'Ensure all stations are stocked with necessary ingredients and tools.',
  //           timerSeconds: 600,
  //         }
  //       ]
  //     }
  //   }
  // });

  // // Create sample executions
  // await prisma.sOPExecution.create({
  //   data: {
  //     userId: adminUser.id,
  //     sopId: workflowSOP.id,
  //     status: 'COMPLETED',
  //     totalTimeSeconds: 690,
  //     completedAt: new Date(Date.now() - 86400000), // Yesterday
  //     stepExecutions: {
  //       create: [
  //         {
  //           stepId: (await prisma.sOPStep.findFirst({ where: { sopId: workflowSOP.id, order: 1 } }))!.id,
  //           timeSeconds: 115,
  //         },
  //         {
  //           stepId: (await prisma.sOPStep.findFirst({ where: { sopId: workflowSOP.id, order: 2 } }))!.id,
  //           timeSeconds: 175,
  //         },
  //         {
  //           stepId: (await prisma.sOPStep.findFirst({ where: { sopId: workflowSOP.id, order: 3 } }))!.id,
  //           timeSeconds: 55,
  //         },
  //         {
  //           stepId: (await prisma.sOPStep.findFirst({ where: { sopId: workflowSOP.id, order: 4 } }))!.id,
  //           timeSeconds: 295,
  //         },
  //         {
  //           stepId: (await prisma.sOPStep.findFirst({ where: { sopId: workflowSOP.id, order: 5 } }))!.id,
  //           timeSeconds: 50,
  //         }
  //       ]
  //     }
  //   }
  // });

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Admin user: john@doe.com / johndoe123`);
  console.log(`👤 Sample user: jane@example.com / password123`);
  console.log(`📋 Created ${await prisma.sOP.count()} SOPs`);
  console.log(`👥 Created ${await prisma.group.count()} groups`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
