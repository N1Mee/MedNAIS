
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create categories
  console.log("📁 Creating categories...");
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "medical" },
      update: {},
      create: {
        name: "Medical",
        slug: "medical",
        description:
          "Standard operating procedures for healthcare and medical facilities",
        icon: "🏥",
      },
    }),
    prisma.category.upsert({
      where: { slug: "manufacturing" },
      update: {},
      create: {
        name: "Manufacturing",
        slug: "manufacturing",
        description:
          "SOPs for manufacturing processes and quality control",
        icon: "🏭",
      },
    }),
    prisma.category.upsert({
      where: { slug: "it" },
      update: {},
      create: {
        name: "IT & Technology",
        slug: "it",
        description:
          "Technology and IT infrastructure standard procedures",
        icon: "💻",
      },
    }),
    prisma.category.upsert({
      where: { slug: "restaurant" },
      update: {},
      create: {
        name: "Restaurant & Food Service",
        slug: "restaurant",
        description: "Food service and restaurant operation procedures",
        icon: "🍽️",
      },
    }),
    prisma.category.upsert({
      where: { slug: "business" },
      update: {},
      create: {
        name: "Business Operations",
        slug: "business",
        description: "General business and operational procedures",
        icon: "💼",
      },
    }),
    prisma.category.upsert({
      where: { slug: "education" },
      update: {},
      create: {
        name: "Education",
        slug: "education",
        description: "Educational institution procedures and protocols",
        icon: "📚",
      },
    }),
    prisma.category.upsert({
      where: { slug: "retail" },
      update: {},
      create: {
        name: "Retail",
        slug: "retail",
        description: "Retail operations and customer service procedures",
        icon: "🛍️",
      },
    }),
    prisma.category.upsert({
      where: { slug: "laboratory" },
      update: {},
      create: {
        name: "Laboratory",
        slug: "laboratory",
        description: "Laboratory testing and research procedures",
        icon: "🔬",
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create test users
  console.log("👤 Creating test users...");
  const testUser = await prisma.user.upsert({
    where: { email: "john@doe.com" },
    update: {},
    create: {
      email: "john@doe.com",
      name: "John Doe",
      role: "seller",
      bio: "Experienced professional sharing industry-standard SOPs. Passionate about process optimization and quality assurance.",
      emailVerified: new Date(),
    },
  });

  // Create debug user for testing
  const debugUser = await prisma.user.upsert({
    where: { email: "m@ivdgroup.eu" },
    update: {},
    create: {
      email: "m@ivdgroup.eu",
      name: "Debug User",
      role: "seller",
      bio: "Debug account for testing and development purposes.",
      emailVerified: new Date(),
    },
  });

  // Create MedNAIS test user
  const mednaisUser = await prisma.user.upsert({
    where: { email: "test@mednais.com" },
    update: {},
    create: {
      email: "test@mednais.com",
      name: "MedNAIS Test User",
      role: "seller",
      bio: "MedNAIS test account for development and testing.",
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Created test users: ${testUser.email}, ${debugUser.email}, ${mednaisUser.email}`);

  // Create sample SOPs
  console.log("📄 Creating sample SOPs...");

  const medicalCategory = categories.find((c) => c.slug === "medical");
  const itCategory = categories.find((c) => c.slug === "it");
  const restaurantCategory = categories.find((c) => c.slug === "restaurant");

  const sop1 = await prisma.sOP.create({
    data: {
      title: "Patient Check-In Procedure",
      description:
        "A comprehensive guide for front desk staff on how to properly check in patients, verify insurance, and collect necessary documentation.",
      price: 0,
      visibility: "public",
      categoryId: medicalCategory?.id,
      authorId: testUser.id,
      steps: {
        create: [
          {
            order: 0,
            title: "Greet the Patient",
            description:
              "Welcome the patient warmly and ask for their name and appointment time. Make eye contact and smile to create a welcoming atmosphere.",
            duration: 2,
          },
          {
            order: 1,
            title: "Verify Patient Information",
            description:
              "Check the patient's ID and insurance card. Verify that the information in the system matches their documents.",
            duration: 3,
          },
          {
            order: 2,
            title: "Update Patient Records",
            description:
              "Ask if any contact information, insurance, or medical history has changed since their last visit. Update the records accordingly.",
            duration: 5,
          },
          {
            order: 3,
            title: "Collect Co-payment",
            description:
              "If applicable, collect the co-payment and provide a receipt. Process payment through the billing system.",
            duration: 3,
          },
          {
            order: 4,
            title: "Provide Instructions",
            description:
              "Direct the patient to the waiting area and inform them of the approximate wait time. Let them know they'll be called when the doctor is ready.",
            duration: 2,
          },
        ],
      },
    },
  });

  const sop2 = await prisma.sOP.create({
    data: {
      title: "Software Deployment Checklist",
      description:
        "Step-by-step deployment procedure for production software releases, ensuring zero downtime and proper rollback capabilities.",
      price: 29.99,
      visibility: "public",
      categoryId: itCategory?.id,
      authorId: testUser.id,
      steps: {
        create: [
          {
            order: 0,
            title: "Pre-Deployment Testing",
            description:
              "Run all automated tests in the staging environment. Ensure 100% test coverage passes before proceeding.",
            duration: 30,
          },
          {
            order: 1,
            title: "Backup Current Production",
            description:
              "Create a complete backup of the production database and application files. Verify backup integrity.",
            duration: 15,
          },
          {
            order: 2,
            title: "Enable Maintenance Mode",
            description:
              "Put the application in maintenance mode to prevent user actions during deployment.",
            duration: 2,
          },
          {
            order: 3,
            title: "Deploy New Version",
            description:
              "Deploy the new application version using the automated deployment pipeline. Monitor logs for errors.",
            duration: 10,
          },
          {
            order: 4,
            title: "Run Database Migrations",
            description:
              "Execute database migration scripts. Verify all migrations complete successfully.",
            duration: 5,
          },
          {
            order: 5,
            title: "Smoke Testing",
            description:
              "Perform critical path testing on production to ensure core functionality works as expected.",
            duration: 15,
          },
          {
            order: 6,
            title: "Disable Maintenance Mode",
            description:
              "Remove maintenance mode and restore user access. Monitor error rates and performance metrics.",
            duration: 2,
          },
        ],
      },
    },
  });

  const sop3 = await prisma.sOP.create({
    data: {
      title: "Daily Opening Procedures for Restaurant",
      description:
        "Complete morning checklist for restaurant staff to ensure the establishment is ready for service.",
      price: 9.99,
      visibility: "public",
      categoryId: restaurantCategory?.id,
      authorId: testUser.id,
      steps: {
        create: [
          {
            order: 0,
            title: "Unlock and Disarm Security",
            description:
              "Unlock all entrances and disarm the security system. Note any issues or signs of tampering.",
            duration: 5,
          },
          {
            order: 1,
            title: "Turn On Equipment",
            description:
              "Start all kitchen equipment including ovens, grills, and coffee machines. Allow proper warm-up time.",
            duration: 20,
          },
          {
            order: 2,
            title: "Inspect Dining Area",
            description:
              "Check all tables, chairs, and fixtures. Ensure cleanliness and proper setup. Replace any damaged items.",
            duration: 15,
          },
          {
            order: 3,
            title: "Stock Service Stations",
            description:
              "Fill napkin holders, condiment containers, and beverage stations. Ensure adequate supplies for the day.",
            duration: 15,
          },
          {
            order: 4,
            title: "Prepare Register",
            description:
              "Count starting cash drawer, log the amount, and ensure POS system is operational.",
            duration: 10,
          },
          {
            order: 5,
            title: "Review Reservations",
            description:
              "Check reservation system and prepare special table setups for reserved parties.",
            duration: 10,
          },
          {
            order: 6,
            title: "Staff Briefing",
            description:
              "Conduct brief team meeting to review specials, 86'd items, and any important updates.",
            duration: 10,
          },
        ],
      },
    },
  });

  console.log(`✅ Created ${3} sample SOPs`);

  console.log("✨ Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
