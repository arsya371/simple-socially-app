import { NextRequest, NextResponse } from "next/server";
import { withLogging } from "@/lib/api-wrapper";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export const GET = withLogging(async (req: NextRequest) => {
  try {
    const tasks = await (prisma as any).task.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
});

export const POST = withLogging(async (req: NextRequest) => {
  try {
    const { title, userId } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const task = await (prisma as any).task.create({
      data: {
        title,
        userId,
        completed: false
      },
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
});

export const DELETE = withLogging(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const task = await (prisma as any).task.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: "Task deleted successfully" }
    );
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
});

export const PUT = withLogging(async (req: NextRequest) => {
  try {
    const { id, completed } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const task = await (prisma as any).task.update({
      where: { id },
      data: { completed },
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
});
