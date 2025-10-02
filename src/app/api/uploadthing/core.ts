import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

const f = createUploadthing();

export const ourFileRouter = {
  // define routes for different upload types
  postImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      // this code runs on your server before upload
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");

      // whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        // Log the upload in our system
        await prisma.systemLog.create({
          data: {
            method: 'POST',
            path: '/api/uploadthing',
            statusCode: 200,
            duration: 0, // Duration is not available in this context
            userAgent: 'UploadThing',
            ipAddress: '0.0.0.0', // IP is not available in this context
            level: 'INFO',
            message: 'File uploaded successfully',
            metadata: {
              fileUrl: file.url,
              fileName: file.name,
              fileSize: file.size,
              userId: metadata.userId
            },
            userId: metadata.userId
          }
        });

        return { fileUrl: file.url };
      } catch (error) {
        console.error("Error in onUploadComplete:", error);
        
        // Log the error
        await prisma.systemLog.create({
          data: {
            method: 'POST',
            path: '/api/uploadthing',
            statusCode: 500,
            duration: 0,
            userAgent: 'UploadThing',
            ipAddress: '0.0.0.0',
            level: 'ERROR',
            message: 'File upload failed',
            metadata: {
              error: error instanceof Error ? error.message : 'Unknown error',
              userId: metadata.userId
            },
            userId: metadata.userId
          }
        });

        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
