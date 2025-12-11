
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
// Auth handled by getCurrentUser
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in database
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        ...(user.name && { name: user.name }),
        ...(user.email && { email: user.email }),
      },
      create: {
        id: user.id,
        name: user.name || null,
        email: user.email || '',
      },
    });

    const body = await req.json();
    const validatedData = createGroupSchema.parse(body);

    // Generate a unique invite code
    const generateInviteCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let inviteCode = generateInviteCode();
    
    // Ensure invite code is unique
    let existingGroup = await prisma.group.findUnique({
      where: { inviteCode }
    });
    
    while (existingGroup) {
      inviteCode = generateInviteCode();
      existingGroup = await prisma.group.findUnique({
        where: { inviteCode }
      });
    }

    // Create group with admin membership
    const group = await prisma.group.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        inviteCode,
        adminId: user.id,
        memberships: {
          create: {
            userId: user.id,
            status: 'APPROVED'
          }
        }
      },
      include: {
        admin: true,
        _count: { 
          select: { 
            memberships: true, 
            sops: true 
          } 
        }
      }
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Create group error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
