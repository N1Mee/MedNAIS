"""
Seed categories and subcategories for MedNAIS™ SOP Marketplace
"""
import asyncio
from prisma import Prisma

CATEGORIES = [
    {
        "name": "Food & Cooking",
        "slug": "food_cooking",
        "subcategories": [
            "Recipes",
            "Baking techniques",
            "Meal prep & planning",
            "Kitchen workflows",
            "Professional kitchen SOPs",
            "Food safety procedures",
            "Beverage & bar techniques",
            "Dietary / special needs cooking"
        ]
    },
    {
        "name": "Business & Management",
        "slug": "business_management",
        "subcategories": [
            "Project management",
            "HR & hiring workflows",
            "Leadership & team operations",
            "Customer service SOPs",
            "Sales processes",
            "Financial procedures",
            "Procurement & vendor management",
            "Office administration",
            "Crisis management procedures"
        ]
    },
    {
        "name": "Marketing & Digital Growth",
        "slug": "marketing_digital_growth",
        "subcategories": [
            "Social media content workflows",
            "SEO procedures",
            "Campaign setup processes",
            "Email marketing workflows",
            "Branding & design guidelines",
            "Lead generation funnels",
            "Advertising setup (Meta, Google, TikTok)",
            "Influencer marketing playbooks"
        ]
    },
    {
        "name": "IT, Software & Development",
        "slug": "it_software_development",
        "subcategories": [
            "Coding workflows (backend / frontend / full-stack)",
            "DevOps pipelines",
            "Deployment procedures",
            "Git & version control",
            "Testing (QA/QC)",
            "Data analysis workflows",
            "UX/UI design processes",
            "Cloud infrastructure setup",
            "Cybersecurity SOPs"
        ]
    },
    {
        "name": "Health, Laboratory & Medical",
        "slug": "health_lab_medical",
        "subcategories": [
            "Pre-analytical workflows",
            "Laboratory testing SOPs",
            "Medical office procedures",
            "Clinical checklists",
            "Hygiene & safety protocols",
            "Equipment operation",
            "Emergency procedures"
        ]
    },
    {
        "name": "Home, DIY & Maintenance",
        "slug": "home_diy_maintenance",
        "subcategories": [
            "Home repair",
            "Carpentry & woodworking",
            "Plumbing basics",
            "Electrical basics",
            "Home organization workflows",
            "Gardening SOPs",
            "Car maintenance",
            "Cleaning & hygiene routines"
        ]
    },
    {
        "name": "Creative Skills & Hobbies",
        "slug": "creative_skills_hobbies",
        "subcategories": [
            "Photography workflows",
            "Video production",
            "Music recording & mixing",
            "Drawing & digital art",
            "Writing & storytelling",
            "Crafts & handmade",
            "Game creation (Roblox, Unity, etc.)"
        ]
    },
    {
        "name": "Personal Development & Coaching",
        "slug": "personal_development_coaching",
        "subcategories": [
            "Productivity workflows",
            "Time management systems",
            "Goal-setting frameworks",
            "Coaching programs",
            "Mindfulness & meditation routines",
            "Study techniques",
            "Career development processes"
        ]
    },
    {
        "name": "Finance & Money Management",
        "slug": "finance_money_management",
        "subcategories": [
            "Personal budgeting",
            "Investment workflows",
            "Crypto & trading procedures",
            "Small business accounting",
            "Tax preparation workflows",
            "Financial modeling processes"
        ]
    },
    {
        "name": "Logistics & Operations",
        "slug": "logistics_operations",
        "subcategories": [
            "Warehouse processes",
            "Delivery optimization",
            "Inventory management",
            "Manufacturing SOPs"
        ]
    },
    {
        "name": "Legal & Compliance",
        "slug": "legal_compliance",
        "subcategories": [
            "Contract workflows",
            "Documentation procedures",
            "Internal compliance",
            "Audit checklists"
        ]
    },
    {
        "name": "Education & Teaching",
        "slug": "education_teaching",
        "subcategories": [
            "Lesson plans",
            "Course creation workflows",
            "Classroom management",
            "Assessment procedures"
        ]
    }
]


async def main():
    prisma = Prisma()
    await prisma.connect()
    
    print("🌱 Seeding categories...")
    
    total_categories = 0
    total_subcategories = 0
    
    for category_data in CATEGORIES:
        # Check if category already exists
        existing = await prisma.category.find_first(
            where={"name": category_data["name"]}
        )
        
        if existing:
            print(f"⏭️  Category '{category_data['name']}' already exists, skipping...")
            continue
        
        # Create parent category
        category = await prisma.category.create(
            data={
                "name": category_data["name"]
            }
        )
        
        total_categories += 1
        print(f"✅ Created category: {category.name}")
        
        # Create subcategories
        for subcategory_name in category_data["subcategories"]:
            subcategory = await prisma.category.create(
                data={
                    "name": subcategory_name,
                    "parentId": category.id
                }
            )
            total_subcategories += 1
            print(f"  ✅ Created subcategory: {subcategory.name}")
    
    print(f"\n🎉 Seeding complete!")
    print(f"   Categories: {total_categories}")
    print(f"   Subcategories: {total_subcategories}")
    
    await prisma.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
