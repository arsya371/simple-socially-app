import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { logRoleChange } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { userId, role } = await req.json();
    const adminUser = await currentUser();

    if (!adminUser || !adminUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const admin = await prisma.user.findFirst({
      where: {
        clerkId: adminUser?.id,
        role: "ADMIN",
      },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }


      );
    }

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current user role before update
    const currentUserData = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    // Log the role change
    await logRoleChange(
      userId,
      currentUserData?.role || 'USER',
      role,
      admin.id
    );
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error in admin users role route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { getAuth } from "@clerk/nextjs/server";

// export async function POST(req: Request) {
//   try {
//     const { userId, role } = await req.json();
//     const { userId: adminId } = getAuth(req);

//     if (!adminId) {
//       return NextResponse.json(
//         { error: 'Unauthorized' },
//         { status: 401 }
//       );
//     }

//     // Verify admin role
//     const admin = await prisma.user.findUnique({
//       where: { clerkId: adminId },
//     });

//     if (!admin || admin.role !== 'ADMIN') {
//       return NextResponse.json(
//         { error: 'Forbidden' },
//         { status: 403 }
//       );
//     }

//     if (!userId || !role) {
//       return NextResponse.json(
//         { error: 'Missing required fields' },
//         { status: 400 }
//       );
//     }

//     const user = await prisma.user.update({
//       where: { id: userId },
//       data: { role }
//     });

//     return NextResponse.json({ user });
//   } catch (error) {
//     console.error('Error in admin users role route:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }