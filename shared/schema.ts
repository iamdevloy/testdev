import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Admin Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wedding Templates Table
export const weddingTemplates = pgTable("wedding_templates", {
  id: serial("id").primaryKey(),
  templateId: text("template_id").notNull().unique(), // unique identifier for each wedding
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // URL-friendly identifier
  createdBy: integer("created_by").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  profileImage: text("profile_image"),
  description: text("description"),
  customization: jsonb("customization"), // stores all custom settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Template-specific Media Items
export const templateMedia = pgTable("template_media", {
  id: serial("id").primaryKey(),
  templateId: text("template_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  deviceId: text("device_id").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  type: text("type").notNull(), // 'image' | 'video' | 'note'
  noteText: text("note_text"),
  isUnavailable: boolean("is_unavailable").default(false),
});

// Template-specific Comments
export const templateComments = pgTable("template_comments", {
  id: serial("id").primaryKey(),
  templateId: text("template_id").notNull(),
  mediaId: integer("media_id").notNull(),
  text: text("text").notNull(),
  userName: text("user_name").notNull(),
  deviceId: text("device_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Template-specific Likes
export const templateLikes = pgTable("template_likes", {
  id: serial("id").primaryKey(),
  templateId: text("template_id").notNull(),
  mediaId: integer("media_id").notNull(),
  userName: text("user_name").notNull(),
  deviceId: text("device_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Template-specific Stories
export const templateStories = pgTable("template_stories", {
  id: serial("id").primaryKey(),
  templateId: text("template_id").notNull(),
  mediaUrl: text("media_url").notNull(),
  mediaType: text("media_type").notNull(), // 'image' | 'video'
  userName: text("user_name").notNull(),
  deviceId: text("device_id").notNull(),
  fileName: text("file_name"),
  views: jsonb("views"), // array of viewer device IDs
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Template-specific Timeline Events
export const templateTimelineEvents = pgTable("template_timeline_events", {
  id: serial("id").primaryKey(),
  templateId: text("template_id").notNull(),
  title: text("title").notNull(),
  customEventName: text("custom_event_name"),
  date: text("date").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  type: text("type").notNull(),
  createdBy: text("created_by").notNull(),
  mediaUrls: jsonb("media_urls"), // array of media URLs
  mediaTypes: jsonb("media_types"), // array of media types
  mediaFileNames: jsonb("media_file_names"), // for deletion from storage
  createdAt: timestamp("created_at").defaultNow(),
});

// Template-specific Live Users
export const templateLiveUsers = pgTable("template_live_users", {
  id: serial("id").primaryKey(),
  templateId: text("template_id").notNull(),
  userName: text("user_name").notNull(),
  deviceId: text("device_id").notNull(),
  lastSeen: timestamp("last_seen").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Template-specific Settings
export const templateSettings = pgTable("template_settings", {
  id: serial("id").primaryKey(),
  templateId: text("template_id").notNull().unique(),
  isUnderConstruction: boolean("is_under_construction").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  updatedBy: text("updated_by").notNull(),
  customSettings: jsonb("custom_settings"), // any additional settings
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  weddingTemplates: many(weddingTemplates),
}));

export const weddingTemplatesRelations = relations(weddingTemplates, ({ one, many }) => ({
  creator: one(users, {
    fields: [weddingTemplates.createdBy],
    references: [users.id],
  }),
  media: many(templateMedia),
  comments: many(templateComments),
  likes: many(templateLikes),
  stories: many(templateStories),
  timelineEvents: many(templateTimelineEvents),
  liveUsers: many(templateLiveUsers),
  settings: one(templateSettings),
}));

export const templateMediaRelations = relations(templateMedia, ({ one, many }) => ({
  template: one(weddingTemplates, {
    fields: [templateMedia.templateId],
    references: [weddingTemplates.templateId],
  }),
  comments: many(templateComments),
  likes: many(templateLikes),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWeddingTemplateSchema = createInsertSchema(weddingTemplates).pick({
  name: true,
  slug: true,
  description: true,
  profileImage: true,
  customization: true,
});

export const insertTemplateMediaSchema = createInsertSchema(templateMedia).pick({
  templateId: true,
  name: true,
  url: true,
  uploadedBy: true,
  deviceId: true,
  type: true,
  noteText: true,
});

export const insertTemplateCommentSchema = createInsertSchema(templateComments).pick({
  templateId: true,
  mediaId: true,
  text: true,
  userName: true,
  deviceId: true,
});

export const insertTemplateLikeSchema = createInsertSchema(templateLikes).pick({
  templateId: true,
  mediaId: true,
  userName: true,
  deviceId: true,
});

export const insertTemplateStorySchema = createInsertSchema(templateStories).pick({
  templateId: true,
  mediaUrl: true,
  mediaType: true,
  userName: true,
  deviceId: true,
  fileName: true,
  views: true,
  expiresAt: true,
});

export const insertTemplateTimelineEventSchema = createInsertSchema(templateTimelineEvents).pick({
  templateId: true,
  title: true,
  customEventName: true,
  date: true,
  description: true,
  location: true,
  type: true,
  createdBy: true,
  mediaUrls: true,
  mediaTypes: true,
  mediaFileNames: true,
});

export const insertTemplateLiveUserSchema = createInsertSchema(templateLiveUsers).pick({
  templateId: true,
  userName: true,
  deviceId: true,
  isActive: true,
});

export const insertTemplateSettingsSchema = createInsertSchema(templateSettings).pick({
  templateId: true,
  isUnderConstruction: true,
  updatedBy: true,
  customSettings: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type WeddingTemplate = typeof weddingTemplates.$inferSelect;
export type InsertWeddingTemplate = z.infer<typeof insertWeddingTemplateSchema>;
export type TemplateMedia = typeof templateMedia.$inferSelect;
export type InsertTemplateMedia = z.infer<typeof insertTemplateMediaSchema>;
export type TemplateComment = typeof templateComments.$inferSelect;
export type InsertTemplateComment = z.infer<typeof insertTemplateCommentSchema>;
export type TemplateLike = typeof templateLikes.$inferSelect;
export type InsertTemplateLike = z.infer<typeof insertTemplateLikeSchema>;
export type TemplateStory = typeof templateStories.$inferSelect;
export type InsertTemplateStory = z.infer<typeof insertTemplateStorySchema>;
export type TemplateTimelineEvent = typeof templateTimelineEvents.$inferSelect;
export type InsertTemplateTimelineEvent = z.infer<typeof insertTemplateTimelineEventSchema>;
export type TemplateLiveUser = typeof templateLiveUsers.$inferSelect;
export type InsertTemplateLiveUser = z.infer<typeof insertTemplateLiveUserSchema>;
export type TemplateSettings = typeof templateSettings.$inferSelect;
export type InsertTemplateSettings = z.infer<typeof insertTemplateSettingsSchema>;
