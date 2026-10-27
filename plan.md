# InstaLite Implementation Plan

## Goal

Build a complete React + Prisma + Express version of InstaLite that implements:

- A React frontend for the specified API workflows
- An Express API with the MVC structure requested by the labs
- A Prisma-backed database with `User`, `Post`, and `Like` models
- CRUD, seeding, pagination, sorting, filtering, relations, likes, and cascading deletes
- A test pass covering the exact status codes and response shapes in all three problem files

This plan assumes the workspace is currently empty except for the three problem files.

## Proposed Project Layout

```txt
/
  package.json
  prisma.config.js
  prisma/
    schema.prisma
    migrations/
    seed-data.js
    seed.js
  src/
    index.js
    db.js
    routes/
      users.routes.js
      posts.routes.js
    controllers/
      users.controller.js
      posts.controller.js
      likes.controller.js
    services/
      users.service.js
      posts.service.js
      likes.service.js
    utils/
      pagination.js
  client/
    package.json
    src/
      components/
      pages/
      services/
      App.jsx
      main.jsx
```

The backend structure will follow the lab's final MVC layout. Database and server configuration names will be aligned with the installed Prisma version.

## Phase 1: Backend Foundation and Prisma Setup

1. Initialize the Node project and install Express, Prisma, the appropriate Prisma driver adapter, dotenv support, and React tooling.
2. Create the Prisma schema for `User` and `Post`, matching the base schema used by all three labs. Reduce the schema to 3NF Form.
3. Create and run the initial migration.
4. Create `src/db.js` with one shared Prisma Client and a default export.
5. Create `src/index.js` with JSON parsing, CORS if needed, the `/health` route, and port `3000`.
6. Generate Prisma Client and verify a database connection.

## Phase 2: User and Post CRUD

1. Implement the Express routes:
   - `POST`, `GET`, `GET /:id`, `PATCH /:id`, and `DELETE /:id` for users
   - the matching five routes for posts
2. Keep the controller/service/route separation consistently:
   - routes map methods and paths to controller functions
   - controllers read request input and format responses
   - services contain only Prisma queries and domain operations
3. Whitelist accepted and editable fields. Silently ignore protected fields.
4. Implement exact `400`, `404`, `409`, `201`, `200`, `204`, and `500` behavior required by the labs.
5. Verify CRUD with direct API requests before adding query features.

## Phase 3: Seed Data

1. Create `prisma/seed-data.js` with the exact 12 users and 24 posts from the second and third labs.
2. Create `prisma/seed.js` to delete existing child rows first and use bulk create operations.
3. Register `prisma db seed` in the Prisma configuration and add the `"seed"` npm script.
4. Make seeding idempotent and deterministic at the row-count level.
5. Verify repeated seeds still produce 12 users and 24 posts.

## Phase 4: Pagination, Sorting, and Filtering

1. Update user and post list services to return `{ data, meta }`.
2. Add shared pagination parsing in `src/utils/pagination.js`.
3. Validate `page`, `limit`, `sortBy`, `order`, and the lab-specific filters in controllers.
4. Cap `limit` at `50`.
5. Fetch list rows and total counts in one Prisma transaction for users and posts.
6. Implement:
   - user sorting by `createdAt`, `username`, or `fullname`
   - user filtering by `isPrivate` and case-insensitive username/fullname search
   - post sorting by `createdAt`, `updatedAt`, or likes
   - post filtering by case-insensitive location, case-insensitive caption search, and date ranges
7. Preserve exact validation error messages.

## Phase 5: Relations and Seeded Likes

1. Add a required `Post.authorId`, the `User.posts` relation, and post cascade deletion.
2. Create a migration named `add_post_author`.
3. Wipe and rebuild the database with `migrate reset`, then reapply migrations.
4. Add the explicit `Like` model with a composite primary key and cascade relations.
5. Create a migration named `add_likes`.
6. Update seed data with post authors and 29 likes.
7. Resolve usernames and `insta##` post keys to real IDs in `seed.js`.
8. Regenerate Prisma Client and verify 12 users, 24 posts, and 29 likes.

## Phase 6: Related Reads and Writes

1. Require `authorId` on post creation and validate missing fields and nonexistent authors.
2. Prevent `authorId` changes through post updates.
3. Add user summaries and like counts to post reads using Prisma `select` and `_count`.
4. Add post and like counts to user reads.
5. Implement `hasPosts` relation filtering.
6. Add:
   - `GET /users/:id/posts`
   - `GET /posts/:id/likes`
   - `POST /posts/:id/likes`
   - `DELETE /posts/:id/likes/:userId`
   - `GET /users/:id/liked-posts`
7. Sort like totals by likes with newer posts as the tie-breaker.
8. Catch Prisma `P2002` for duplicate likes and return `409`.
9. Return exact not-found and validation responses.

## Phase 7: React Frontend

Create a React UI with a clean, responsive experience focused on the core workflows:

1. Navigation and health/status feedback.
2. A users page with search, privacy filtering, sorting, pagination, and user detail views.
3. A posts feed with author summaries, like counts, location/date/search filtering, sorting, and pagination.
4. Create and edit forms for users and posts.
5. Like/unlike controls and the liked-users list.
6. Loading, empty, not-found, and API error states.
7. Frontend API calls isolated in a small client service module.

The backend remains the source of truth for validation and authorization behavior.

## Phase 8: Verification

Run verification in stages:

1. `npx prisma generate`
2. `npx prisma migrate dev`
3. `npm run seed`
4. Start the Express server and test `/health`
5. Run the exact user CRUD, post CRUD, pagination, sorting, filtering, relation, and like tests from the problem files
6. Re-seed before relation and cascade tests, and re-seed after destructive cascade tests
7. Run a React production build
8. Review all response shapes and exact error strings

## Key Decisions to Confirm

- Use a separate `client/` React application and an Express backend in the same repository.
- Use JavaScript for both backend and React, matching the lab examples.
- Use SQLite or the project's existing Prisma database configuration if one is present. No database provider is specified in the problem files.
- Build the full set of bonus and relation features, not only the minimum CRUD endpoints.
- Preserve the exact seeded data and expected test outcomes.
- Performance is not the priority. Simplicity and Ease to understand is priority

