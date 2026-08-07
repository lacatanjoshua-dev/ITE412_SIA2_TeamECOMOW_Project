// instant.schema.ts
import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    // Users entity - managed by Instant
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    
    // Notifications entity
    notifications: i.entity({
      userId: i.string().indexed(),
      type: i.string(),
      title: i.string(),
      description: i.string(),
      createdAt: i.number().indexed(),
      read: i.boolean(),
    }),
  },
  links: {
    // Optional: Link notifications to users
    notificationUser: {
      forward: {
        on: "notifications",
        has: "one",
        label: "user",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "notifications",
      },
    },
  },
});

// This helps TypeScript display better intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;