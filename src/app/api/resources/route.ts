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
    let courseResources = resources.filter(
      (r: any) => !courseId || String(r.course_id) === String(courseId)
    );

    // Fallback sample resources if database has no resources for this course yet
    if (courseResources.length === 0 && matchedCourse) {
      courseResources = [
        {
          _id: 'res_sample_1',
          course_id: matchedCourse._id,
          title: `${matchedCourse.name} - Complete Physics Formula Handbook & Quick Revision`,
          description: 'Comprehensive chapter-wise formula sheet, key derivations, vector diagrams, and memory tricks.',
          subject: 'Physics',
          resource_type: 'Formula Sheet',
          file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          file_size: '4.2 MB',
          page_count: 84,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          _id: 'res_sample_2',
          course_id: matchedCourse._id,
          title: `${matchedCourse.name} - Organic Chemistry Mechanisms & Named Reactions Book`,
          description: 'Complete NCERT & Advanced reactions guide with step-by-step electron push mechanisms.',
          subject: 'Chemistry',
          resource_type: 'PDF Book',
          file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          file_size: '18.5 MB',
          page_count: 310,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          _id: 'res_sample_3',
          course_id: matchedCourse._id,
          title: `${matchedCourse.name} - Mathematics Solved Exemplar & Shortcut Strategies`,
          description: 'Calculus, Algebra, and Coordinate Geometry solved masterproblems with speed-solving hacks.',
          subject: 'Mathematics',
          resource_type: 'Study Notes',
          file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          file_size: '9.8 MB',
          page_count: 165,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          _id: 'res_sample_4',
          course_id: matchedCourse._id,
          title: `${matchedCourse.name} - Official Syllabus & Reference Question Compendium`,
          description: 'Curated previous 10 years topic-wise question index with official weightage analysis.',
          subject: 'General',
          resource_type: 'Reference Manual',
          file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          file_size: '6.1 MB',
          page_count: 120,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ];
    }

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
