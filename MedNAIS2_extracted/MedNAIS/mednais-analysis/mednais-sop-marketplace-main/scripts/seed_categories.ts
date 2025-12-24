import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  {
    name: 'Food & Cooking',
    description: 'Recipes, cooking techniques, and kitchen workflows',
    subcategories: [
      'Recipes',
      'Baking techniques',
      'Meal prep & planning',
      'Kitchen workflows',
      'Professional kitchen SOPs',
      'Food safety procedures',
      'Beverage & bar techniques',
      'Dietary / special needs cooking',
    ],
  },
  {
    name: 'Business & Management',
    description: 'Business operations, management, and organizational procedures',
    subcategories: [
      'Project management',
      'HR & hiring workflows',
      'Leadership & team operations',
      'Customer service SOPs',
      'Sales processes',
      'Financial procedures',
      'Procurement & vendor management',
      'Office administration',
      'Crisis management procedures',
    ],
  },
  {
    name: 'Marketing & Digital Growth',
    description: 'Marketing strategies, digital growth, and content workflows',
    subcategories: [
      'Social media content workflows',
      'SEO procedures',
      'Campaign setup processes',
      'Email marketing workflows',
      'Branding & design guidelines',
      'Lead generation funnels',
      'Advertising setup (Meta, Google, TikTok)',
      'Influencer marketing playbooks',
    ],
  },
  {
    name: 'IT, Software & Development',
    description: 'Software development, IT operations, and technical procedures',
    subcategories: [
      'Coding workflows (backend / frontend / full-stack)',
      'DevOps pipelines',
      'Deployment procedures',
      'Git & version control',
      'Testing (QA/QC)',
      'Data analysis workflows',
      'UX/UI design processes',
      'Cloud infrastructure setup',
      'Cybersecurity SOPs',
    ],
  },
  {
    name: 'Health, Laboratory & Medical SOPs',
    description: 'Medical procedures, laboratory workflows, and healthcare operations',
    subcategories: [
      'Pre-analytical workflows',
      'Laboratory testing SOPs',
      'Medical office procedures',
      'Clinical checklists',
      'Hygiene & safety protocols',
      'Equipment operation',
      'Emergency procedures',
    ],
  },
  {
    name: 'Home, DIY & Maintenance',
    description: 'Home improvement, repairs, and maintenance procedures',
    subcategories: [
      'Home repair',
      'Carpentry & woodworking',
      'Plumbing basics',
      'Electrical basics',
      'Home organization workflows',
      'Gardening SOPs',
      'Car maintenance',
      'Cleaning & hygiene routines',
    ],
  },
  {
    name: 'Creative Skills & Hobbies',
    description: 'Creative workflows, artistic processes, and hobby guides',
    subcategories: [
      'Photography workflows',
      'Video production',
      'Music recording & mixing',
      'Drawing & digital art',
      'Writing & storytelling',
      'Crafts & handmade',
      'Game creation (Roblox, Unity, etc.)',
    ],
  },
  {
    name: 'Personal Development & Coaching',
    description: 'Personal growth, productivity, and self-improvement workflows',
    subcategories: [
      'Productivity workflows',
      'Time management systems',
      'Goal-setting frameworks',
      'Coaching programs',
      'Mindfulness & meditation routines',
      'Study techniques',
      'Career development processes',
    ],
  },
  {
    name: 'Finance & Money Management',
    description: 'Financial planning, investment strategies, and money management',
    subcategories: [
      'Personal budgeting',
      'Investment workflows',
      'Crypto & trading procedures',
      'Small business accounting',
      'Tax preparation workflows',
      'Financial modeling processes',
    ],
  },
  {
    name: 'Logistics & Operations',
    description: 'Supply chain, logistics, and operational procedures',
    subcategories: [
      'Warehouse processes',
      'Delivery optimization',
      'Inventory management',
      'Manufacturing SOPs',
    ],
  },
  {
    name: 'Legal & Compliance',
    description: 'Legal procedures, compliance workflows, and documentation',
    subcategories: [
      'Contract workflows',
      'Documentation procedures',
      'Internal compliance',
      'Audit checklists',
    ],
  },
  {
    name: 'Education & Teaching',
    description: 'Teaching methods, course creation, and educational workflows',
    subcategories: [
      'Lesson plans',
      'Course creation workflows',
      'Classroom management',
      'Assessment procedures',
    ],
  },
];

async function main() {
  console.log('🌱 Seeding categories...');

  // Clear existing categories
  await prisma.category.deleteMany({});
  console.log('✅ Cleared existing categories');

  for (const categoryData of categories) {
    // Create parent category
    const parentCategory = await prisma.category.create({
      data: {
        name: categoryData.name,
        description: categoryData.description,
      },
    });

    console.log(`✅ Created category: ${categoryData.name}`);

    // Create subcategories
    for (const subName of categoryData.subcategories) {
      await prisma.category.create({
        data: {
          name: `${categoryData.name} - ${subName}`,
          parentId: parentCategory.id,
        },
      });
    }

    console.log(`   📁 Added ${categoryData.subcategories.length} subcategories`);
  }

  // Count results
  const totalCategories = await prisma.category.count();
  const parentCategories = await prisma.category.count({
    where: { parentId: null },
  });
  const subcategories = await prisma.category.count({
    where: { parentId: { not: null } },
  });

  console.log('\n✨ Seeding complete!');
  console.log(`📊 Total categories: ${totalCategories}`);
  console.log(`📁 Parent categories: ${parentCategories}`);
  console.log(`🗂️  Subcategories: ${subcategories}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
