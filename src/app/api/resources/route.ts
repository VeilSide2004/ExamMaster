import { NextResponse } from 'next/server';
import { readSharedDb } from '@/lib/sharedDb';
import { getAuthenticatedUser } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { Resource, Course } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authUser = getAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const paramCourseId = searchParams.get('course_id');

    let courseId = paramCourseId || authUser?.lockedCourseId || null;

    let dbData = readSharedDb();
    let courses = dbData.courses || [];
    let resources = dbData.resources || [];

    // Try MongoDB fallback if active
    try {
      await dbConnect();
      const mongoCourses = await Course.find({ is_active: true }).lean();
      if (mongoCourses && mongoCourses.length > 0) {
        courses = mongoCourses;
      }
      const mongoResources = await Resource.find({ is_active: true }).lean();
      if (mongoResources && mongoResources.length > 0) {
        resources = mongoResources;
      }
    } catch (e) {
      // Fallback to sharedDb
    }

    if (!courseId && courses.length > 0) {
      courseId = courses[0]._id;
    }

    const matchedCourse = courses.find((c: any) => String(c._id) === String(courseId)) || courses[0] || null;

    // Filter resources by course_id
    const courseResources = resources.filter(
      (r: any) => !courseId || String(r.course_id) === String(courseId)
    );

    return NextResponse.json({
      success: true,
      course: matchedCourse,
      resources: courseResources,
    });
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: 'Failed to load resources' }, { status: 500 });
  }
}
