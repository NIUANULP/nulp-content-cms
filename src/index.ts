import axios from 'axios';
import cron from 'node-cron';

/**
 * Environment Variables Required:
 * - COURSE_API_URL: API endpoint for course synchronization
 * - COURSE_API_LIMIT: Number of courses to fetch per sync
 * - GOOD_PRACTICE_API_URL: API endpoint for good practice synchronization (optional, falls back to COURSE_API_URL)
 * - GOOD_PRACTICE_API_LIMIT: Number of good practices to fetch per sync (optional, falls back to COURSE_API_LIMIT)
 * - DISCUSSION_API_URL: API endpoint for discussion synchronization (optional, defaults to https://devnulp.niua.org/discussion-forum/api/popular)
 * - DISCUSSION_API_LIMIT: Number of discussions to fetch per sync (optional, falls back to COURSE_API_LIMIT)
 */

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    // Course synchronization from API
    const syncCourses = async () => {
      // Get configuration from environment variables

      const apiUrl = process.env.COURSE_API_URL;
      const apiLimit = process.env.COURSE_API_LIMIT;

      const payload = {
        request: {
          filters: {
            status: ["Live"],
            primaryCategory: ["Course"],
            visibility: []
          },
          limit: apiLimit,
          sort_by: { lastPublishedOn: "desc" },
          fields: ["name", "identifier", "primaryCategory", "status", "description"]
        }
      };

      try {
        strapi.log.info('🔄 Starting course synchronization from API...');
        strapi.log.info(`📡 API URL: ${apiUrl}`);
        strapi.log.info(`📊 Limit: ${apiLimit} courses`);

        const response = await axios.post(apiUrl, payload);
        const courses = response.data.result.content;

        if (!courses || !Array.isArray(courses)) {
          strapi.log.warn('No courses found in API response');
          return;
        }

        // Get all existing courses from Strapi database
        const existingCourses = await strapi.db.query('api::course.course').findMany({
          select: ['id', 'identifier', 'name']
        });

        // Create a map of API course identifiers for quick lookup
        const apiCourseIdentifiers = new Set(courses.map(course => course.identifier));

        let syncedCount = 0;
        let skippedCount = 0;
        let updatedCount = 0;
        let deletedCount = 0;

        // Process courses from API
        for (const course of courses) {
          try {
            // Check if course already exists
            const existingCourse = existingCourses.find(c => c.identifier === course.identifier);

            if (!existingCourse) {
              // Create new course
              await strapi.entityService.create('api::course.course', {
                data: {
                  name: course.name,
                  identifier: course.identifier,
                  course_status: course.status || 'Live',
                  description: course.description || '',
                  publishedAt: new Date(), // Auto-publish
                },
              });
              syncedCount++;
              strapi.log.info(`✅ Created course: ${course.name}`);
            } else {
              // Update existing course if needed
              if (existingCourse.name !== course.name ||
                existingCourse.course_status !== course.status ||
                existingCourse.description !== (course.description || '')) {
                await strapi.entityService.update('api::course.course', existingCourse.id, {
                  data: {
                    name: course.name,
                    course_status: course.status || 'Live',
                    description: course.description || '',
                  },
                });
                updatedCount++;
                strapi.log.info(`🔄 Updated course: ${course.name}`);
              } else {
                skippedCount++;
              }
            }
          } catch (error) {
            strapi.log.error(`❌ Error processing course ${course.name}:`, error);
          }
        }

        // Handle deletions - remove courses that are no longer in the API
        for (const existingCourse of existingCourses) {
          if (!apiCourseIdentifiers.has(existingCourse.identifier)) {
            try {
              await strapi.entityService.delete('api::course.course', existingCourse.id);
              deletedCount++;
              strapi.log.info(`🗑️ Deleted course: ${existingCourse.name} (${existingCourse.identifier})`);
            } catch (error) {
              strapi.log.error(`❌ Error deleting course ${existingCourse.name}:`, error);
            }
          }
        }

        strapi.log.info(`🎉 Course synchronization completed!`);
        strapi.log.info(`   - New courses created: ${syncedCount}`);
        strapi.log.info(`   - Existing courses updated: ${updatedCount}`);
        strapi.log.info(`   - Existing courses skipped: ${skippedCount}`);
        strapi.log.info(`   - Courses deleted: ${deletedCount}`);
        strapi.log.info(`   - Total courses processed: ${courses.length}`);
        strapi.log.info(`   - Total courses in database after sync: ${existingCourses.length - deletedCount + syncedCount}`);

      } catch (error) {
        strapi.log.error('❌ Error fetching courses from API:', error.message);
        if (error.response) {
          strapi.log.error(`   - Status: ${error.response.status}`);
          strapi.log.error(`   - Response: ${JSON.stringify(error.response.data)}`);
        }
      }
    };

    // Good Practice synchronization from API
    const syncGoodPractices = async () => {
      // Get configuration from environment variables
      const apiUrl = process.env.COURSE_API_URL;
      const apiLimit = process.env.COURSE_API_LIMIT;

      const payload = {
        request: {
          filters: {
            status: ["Live"],
            primaryCategory: ["Good Practices"],
            visibility: []
          },
          limit: apiLimit,
          sort_by: { lastPublishedOn: "desc" },
          fields: ["name", "identifier", "primaryCategory", "status", "lastUpdatedAt", "lastPublishedOn"],
          facets: ["channel", "gradeLevel", "subject", "medium"],
          offset: 0
        }
      };

      try {
        strapi.log.info('🔄 Starting good practice synchronization from API...');
        strapi.log.info(`📡 API URL: ${apiUrl}`);
        strapi.log.info(`📊 Limit: ${apiLimit} good practices`);

        const response = await axios.post(apiUrl, payload);
        const goodPractices = response.data.result.content;

        if (!goodPractices || !Array.isArray(goodPractices)) {
          strapi.log.warn('No good practices found in API response');
          return;
        }

        // Get all existing good practices from Strapi database
        const existingGoodPractices = await strapi.db.query('api::good-practice.good-practice').findMany({
          select: ['id', 'identifier', 'name']
        });

        // Create a map of API good practice identifiers for quick lookup
        const apiGoodPracticeIdentifiers = new Set(goodPractices.map(gp => gp.identifier));

        let syncedCount = 0;
        let skippedCount = 0;
        let updatedCount = 0;
        let deletedCount = 0;

        // Process good practices from API
        for (const goodPractice of goodPractices) {
          try {
            // Check if good practice already exists
            const existingGoodPractice = existingGoodPractices.find(gp => gp.identifier === goodPractice.identifier);

            if (!existingGoodPractice) {
              // Create new good practice
              await strapi.entityService.create('api::good-practice.good-practice', {
                data: {
                  name: goodPractice.name,
                  identifier: goodPractice.identifier,
                  course_status: goodPractice.status || 'Live',
                  description: goodPractice.description || '',
                  publishedAt: new Date(), // Auto-publish
                },
              });
              syncedCount++;
              strapi.log.info(`✅ Created good practice: ${goodPractice.name}`);
            } else {
              // Update existing good practice if needed
              if (existingGoodPractice.name !== goodPractice.name ||
                existingGoodPractice.course_status !== goodPractice.status ||
                existingGoodPractice.description !== (goodPractice.description || '')) {
                await strapi.entityService.update('api::good-practice.good-practice', existingGoodPractice.id, {
                  data: {
                    name: goodPractice.name,
                    course_status: goodPractice.status || 'Live',
                    description: goodPractice.description || '',
                  },
                });
                updatedCount++;
                strapi.log.info(`🔄 Updated good practice: ${goodPractice.name}`);
              } else {
                skippedCount++;
              }
            }
          } catch (error) {
            strapi.log.error(`❌ Error processing good practice ${goodPractice.name}:`, error);
          }
        }

        // Handle deletions - remove good practices that are no longer in the API
        for (const existingGoodPractice of existingGoodPractices) {
          if (!apiGoodPracticeIdentifiers.has(existingGoodPractice.identifier)) {
            try {
              await strapi.entityService.delete('api::good-practice.good-practice', existingGoodPractice.id);
              deletedCount++;
              strapi.log.info(`🗑️ Deleted good practice: ${existingGoodPractice.name} (${existingGoodPractice.identifier})`);
            } catch (error) {
              strapi.log.error(`❌ Error deleting good practice ${existingGoodPractice.name}:`, error);
            }
          }
        }

        strapi.log.info(`🎉 Good practice synchronization completed!`);
        strapi.log.info(`   - New good practices created: ${syncedCount}`);
        strapi.log.info(`   - Existing good practices updated: ${updatedCount}`);
        strapi.log.info(`   - Existing good practices skipped: ${skippedCount}`);
        strapi.log.info(`   - Good practices deleted: ${deletedCount}`);
        strapi.log.info(`   - Total good practices processed: ${goodPractices.length}`);
        strapi.log.info(`   - Total good practices in database after sync: ${existingGoodPractices.length - deletedCount + syncedCount}`);

      } catch (error) {
        strapi.log.error('❌ Error fetching good practices from API:', error.message);
        if (error.response) {
          strapi.log.error(`   - Status: ${error.response.status}`);
          strapi.log.error(`   - Response: ${JSON.stringify(error.response.data)}`);
        }
      }
    };

    // Discussion synchronization from API
    const syncDiscussions = async () => {
      // Get configuration from environment variables
      const apiUrl = process.env.DISCUSSION_API_URL;
      const apiLimit = process.env.DISCUSSION_API_LIMIT || process.env.COURSE_API_LIMIT;

      try {
        strapi.log.info('🔄 Starting discussion synchronization from API...');
        strapi.log.info(`📡 API URL: ${apiUrl}`);
        strapi.log.info(`📊 Limit: ${apiLimit} discussions`);

        const response = await axios.get(apiUrl, {
          headers: {
            Accept: '*/*',
            'Content-Type': 'application/json',
          }
        });

        // Handle discussion API response structure
        let discussions = [];
        if (response.data && response.data.topics && Array.isArray(response.data.topics)) {
          discussions = response.data.topics;
          strapi.log.info(`📊 Found ${discussions.length} discussions (total: ${response.data.topicCount})`);
        } else if (response.data && response.data.title && response.data.title.includes('404')) {
          strapi.log.warn('Discussion API returned 404 - endpoint may require authentication or different URL');
          strapi.log.info('Response:', JSON.stringify(response.data, null, 2));
          return;
        } else {
          strapi.log.warn('No discussions found in API response or unexpected response structure');
          strapi.log.info('Response structure:', JSON.stringify(response.data, null, 2));
          return;
        }

        if (discussions.length === 0) {
          strapi.log.warn('No discussions found in API response');
          return;
        }

        // Get all existing discussions from Strapi database
        const existingDiscussions = await strapi.db.query('api::discussion.discussion').findMany({
          select: ['id', 'tid', 'slug', 'title']
        });

        // Create a map of API discussion identifiers for quick lookup (using tid as primary key)
        const apiDiscussionIdentifiers = new Set();
        discussions.forEach(discussion => {
          if (discussion.tid) {
            apiDiscussionIdentifiers.add(discussion.tid);
          }
          if (discussion.slug) {
            apiDiscussionIdentifiers.add(discussion.slug);
          }
        });

        let syncedCount = 0;
        let skippedCount = 0;
        let updatedCount = 0;
        let deletedCount = 0;

        // Process discussions from API
        for (const discussion of discussions) {
          try {
            // Extract discussion data from the API response structure
            const title = discussion.title || 'Untitled Discussion';
            const slug = discussion.slug || '';
            const tid = discussion.tid || null;

            // Check if discussion already exists by tid or slug
            const existingDiscussion = existingDiscussions.find(d => 
              (tid && d.tid === tid) || (slug && d.slug === slug)
            );

            if (!existingDiscussion) {
              // Create new discussion
              await strapi.entityService.create('api::discussion.discussion', {
                data: {
                  title: title,
                  slug: slug,
                  tid: tid,
                  publishedAt: new Date(), // Auto-publish
                },
              });
              syncedCount++;
              strapi.log.info(`✅ Created discussion: ${title}`);
            } else {
              // Update existing discussion if needed
              if (existingDiscussion.title !== title ||
                existingDiscussion.slug !== slug ||
                existingDiscussion.tid !== tid) {
                await strapi.entityService.update('api::discussion.discussion', existingDiscussion.id, {
                  data: {
                    title: title,
                    slug: slug,
                    tid: tid,
                  },
                });
                updatedCount++;
                strapi.log.info(`🔄 Updated discussion: ${title}`);
              } else {
                skippedCount++;
              }
            }
          } catch (error) {
            strapi.log.error(`❌ Error processing discussion ${discussion.title || 'Unknown'}:`, error);
          }
        }

        // Handle deletions - remove discussions that are no longer in the API
        for (const existingDiscussion of existingDiscussions) {
          const isInApi = (existingDiscussion.tid && apiDiscussionIdentifiers.has(existingDiscussion.tid)) ||
                         (existingDiscussion.slug && apiDiscussionIdentifiers.has(existingDiscussion.slug));
          
          if (!isInApi) {
            try {
              await strapi.entityService.delete('api::discussion.discussion', existingDiscussion.id);
              deletedCount++;
              strapi.log.info(`🗑️ Deleted discussion: ${existingDiscussion.title} (${existingDiscussion.tid || existingDiscussion.slug})`);
            } catch (error) {
              strapi.log.error(`❌ Error deleting discussion ${existingDiscussion.title}:`, error);
            }
          }
        }

        strapi.log.info(`🎉 Discussion synchronization completed!`);
        strapi.log.info(`   - New discussions created: ${syncedCount}`);
        strapi.log.info(`   - Existing discussions updated: ${updatedCount}`);
        strapi.log.info(`   - Existing discussions skipped: ${skippedCount}`);
        strapi.log.info(`   - Discussions deleted: ${deletedCount}`);
        strapi.log.info(`   - Total discussions processed: ${discussions.length}`);
        strapi.log.info(`   - Total discussions in database after sync: ${existingDiscussions.length - deletedCount + syncedCount}`);

      } catch (error) {
        strapi.log.error('❌ Error fetching discussions from API:', error.message);
        if (error.response) {
          strapi.log.error(`   - Status: ${error.response.status}`);
          strapi.log.error(`   - Response: ${JSON.stringify(error.response.data)}`);
        }
      }
    };

    // Run initial synchronization on startup
    strapi.log.info('🚀 Running initial synchronization...');
    await syncCourses();
    await syncGoodPractices();
    await syncDiscussions();

    // Set up hourly cron jobs for synchronization
    strapi.log.info('⏰ Setting up hourly synchronization cron jobs...');
    
    // Course synchronization - runs every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      strapi.log.info('🔄 [CRON] Starting hourly course synchronization...');
      try {
        await syncCourses();
        strapi.log.info('✅ [CRON] Course synchronization completed successfully');
      } catch (error) {
        strapi.log.error('❌ [CRON] Course synchronization failed:', error);
      }
    }, {
      timezone: "UTC"
    });

    // Good Practice synchronization - runs every hour at minute 5
    cron.schedule('5 * * * *', async () => {
      strapi.log.info('🔄 [CRON] Starting hourly good practice synchronization...');
      try {
        await syncGoodPractices();
        strapi.log.info('✅ [CRON] Good practice synchronization completed successfully');
      } catch (error) {
        strapi.log.error('❌ [CRON] Good practice synchronization failed:', error);
      }
    }, {
      timezone: "UTC"
    });

    // Discussion synchronization - runs every hour at minute 10
    cron.schedule('10 * * * *', async () => {
      strapi.log.info('🔄 [CRON] Starting hourly discussion synchronization...');
      try {
        await syncDiscussions();
        strapi.log.info('✅ [CRON] Discussion synchronization completed successfully');
      } catch (error) {
        strapi.log.error('❌ [CRON] Discussion synchronization failed:', error);
      }
    }, {
      timezone: "UTC"
    });

    strapi.log.info('✅ All cron jobs scheduled successfully!');
    strapi.log.info('   - Course sync: Every hour at :00 minutes');
    strapi.log.info('   - Good Practice sync: Every hour at :05 minutes');
    strapi.log.info('   - Discussion sync: Every hour at :10 minutes');
  },
};
