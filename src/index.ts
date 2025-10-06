import axios from 'axios';

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

        let syncedCount = 0;
        let skippedCount = 0;
        let updatedCount = 0;

        for (const course of courses) {
          try {
            // Check if course already exists
            const existingCourse = await strapi.db.query('api::course.course').findOne({
              where: { identifier: course.identifier }
            });

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

        strapi.log.info(`🎉 Course synchronization completed!`);
        strapi.log.info(`   - New courses created: ${syncedCount}`);
        strapi.log.info(`   - Existing courses updated: ${updatedCount}`);
        strapi.log.info(`   - Existing courses skipped: ${skippedCount}`);
        strapi.log.info(`   - Total courses processed: ${courses.length}`);

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

        let syncedCount = 0;
        let skippedCount = 0;
        let updatedCount = 0;

        for (const goodPractice of goodPractices) {
          try {
            // Check if good practice already exists
            const existingGoodPractice = await strapi.db.query('api::good-practice.good-practice').findOne({
              where: { identifier: goodPractice.identifier }
            });

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

        strapi.log.info(`🎉 Good practice synchronization completed!`);
        strapi.log.info(`   - New good practices created: ${syncedCount}`);
        strapi.log.info(`   - Existing good practices updated: ${updatedCount}`);
        strapi.log.info(`   - Existing good practices skipped: ${skippedCount}`);
        strapi.log.info(`   - Total good practices processed: ${goodPractices.length}`);

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

        let syncedCount = 0;
        let skippedCount = 0;
        let updatedCount = 0;

        for (const discussion of discussions) {
          try {
            // Extract discussion data from the API response structure
            const title = discussion.title || 'Untitled Discussion';
            const slug = discussion.slug || '';
            const tid = discussion.tid || null;

            // Check if discussion already exists by tid or slug
            const existingDiscussion = await strapi.db.query('api::discussion.discussion').findOne({
              where: {
                $or: [
                  { tid: tid },
                  { slug: slug }
                ]
              }
            });

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

        strapi.log.info(`🎉 Discussion synchronization completed!`);
        strapi.log.info(`   - New discussions created: ${syncedCount}`);
        strapi.log.info(`   - Existing discussions updated: ${updatedCount}`);
        strapi.log.info(`   - Existing discussions skipped: ${skippedCount}`);
        strapi.log.info(`   - Total discussions processed: ${discussions.length}`);

      } catch (error) {
        strapi.log.error('❌ Error fetching discussions from API:', error.message);
        if (error.response) {
          strapi.log.error(`   - Status: ${error.response.status}`);
          strapi.log.error(`   - Response: ${JSON.stringify(error.response.data)}`);
        }
      }
    };

    // Run course synchronization
    await syncCourses();

    // Run good practice synchronization
    await syncGoodPractices();

    // Run discussion synchronization
    await syncDiscussions();
  },
};
