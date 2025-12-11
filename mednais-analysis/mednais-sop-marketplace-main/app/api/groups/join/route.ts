
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
// Auth handled by getCurrentUser
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const joinGroupSchema = z.object({
  inviteCode: z.string().min(8, "Invalid invite code").max(8, "Invalid invite code"),
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
    const { inviteCode } = joinGroupSchema.parse(body);

    // Find group by invite code
    const group = await prisma.group.findUnique({
      where: { inviteCode },
      include: { admin: true }
    });

    if (!group) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    // Check if user is already a member
    const existingMembership = await prisma.groupMembership.findFirst({
      where: {
        groupId: group.id,
        userId: user.id
      }
    });

    if (existingMembership) {
      if (existingMembership.status === 'APPROVED') {
        return NextResponse.json({ 
          message: "Already a member", 
          status: 'APPROVED',
          groupId: group.id 
        });
      } else if (existingMembership.status === 'PENDING') {
        return NextResponse.json({ 
          message: "Request already pending", 
          status: 'PENDING',
          groupId: group.id 
        });
      } else {
        // Update rejected membership to pending
        const updatedMembership = await prisma.groupMembership.update({
          where: { id: existingMembership.id },
          data: { status: 'PENDING' }
        });
        
        return NextResponse.json({ 
          message: "Request sent", 
          status: 'PENDING',
          groupId: group.id 
        });
      }
    }

    // Create new membership request
    const membership = await prisma.groupMembership.create({
      data: {
        groupId: group.id,
        userId: user.id,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ 
      message: "Request sent", 
      status: 'PENDING',
      groupId: group.id 
    });

  } catch (error) {
    console.error("Join group error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    );
  }
}
