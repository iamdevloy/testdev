import { 
  users, 
  weddingTemplates, 
  templateMedia,
  templateComments,
  templateLikes,
  templateStories,
  templateTimelineEvents,
  templateLiveUsers,
  templateSettings,
  type User, 
  type InsertUser,
  type WeddingTemplate,
  type InsertWeddingTemplate,
  type TemplateMedia,
  type InsertTemplateMedia,
  type TemplateComment,
  type InsertTemplateComment,
  type TemplateLike,
  type InsertTemplateLike,
  type TemplateStory,
  type InsertTemplateStory,
  type TemplateTimelineEvent,
  type InsertTemplateTimelineEvent,
  type TemplateLiveUser,
  type InsertTemplateLiveUser,
  type TemplateSettings,
  type InsertTemplateSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Wedding template management
  createWeddingTemplate(template: InsertWeddingTemplate & { createdBy: number }): Promise<WeddingTemplate>;
  getWeddingTemplate(templateId: string): Promise<WeddingTemplate | undefined>;
  getWeddingTemplateBySlug(slug: string): Promise<WeddingTemplate | undefined>;
  getAllWeddingTemplates(): Promise<WeddingTemplate[]>;
  updateWeddingTemplate(templateId: string, updates: Partial<InsertWeddingTemplate>): Promise<WeddingTemplate | undefined>;
  deleteWeddingTemplate(templateId: string): Promise<boolean>;
  
  // Template media management
  createTemplateMedia(media: InsertTemplateMedia): Promise<TemplateMedia>;
  getTemplateMedia(templateId: string): Promise<TemplateMedia[]>;
  deleteTemplateMedia(templateId: string, mediaId: number): Promise<boolean>;
  updateTemplateMedia(templateId: string, mediaId: number, updates: Partial<InsertTemplateMedia>): Promise<TemplateMedia | undefined>;
  
  // Template comments management
  createTemplateComment(comment: InsertTemplateComment): Promise<TemplateComment>;
  getTemplateComments(templateId: string): Promise<TemplateComment[]>;
  deleteTemplateComment(templateId: string, commentId: number): Promise<boolean>;
  
  // Template likes management
  createTemplateLike(like: InsertTemplateLike): Promise<TemplateLike>;
  getTemplateLikes(templateId: string): Promise<TemplateLike[]>;
  deleteTemplateLike(templateId: string, likeId: number): Promise<boolean>;
  toggleTemplateLike(templateId: string, mediaId: number, userName: string, deviceId: string): Promise<{ action: 'added' | 'removed', like?: TemplateLike }>;
  
  // Template stories management
  createTemplateStory(story: InsertTemplateStory): Promise<TemplateStory>;
  getTemplateStories(templateId: string): Promise<TemplateStory[]>;
  deleteTemplateStory(templateId: string, storyId: number): Promise<boolean>;
  cleanupExpiredStories(templateId: string): Promise<number>;
  
  // Template timeline events management
  createTemplateTimelineEvent(event: InsertTemplateTimelineEvent): Promise<TemplateTimelineEvent>;
  getTemplateTimelineEvents(templateId: string): Promise<TemplateTimelineEvent[]>;
  updateTemplateTimelineEvent(templateId: string, eventId: number, updates: Partial<InsertTemplateTimelineEvent>): Promise<TemplateTimelineEvent | undefined>;
  deleteTemplateTimelineEvent(templateId: string, eventId: number): Promise<boolean>;
  
  // Template live users management
  upsertTemplateLiveUser(user: InsertTemplateLiveUser): Promise<TemplateLiveUser>;
  getTemplateLiveUsers(templateId: string): Promise<TemplateLiveUser[]>;
  updateTemplateLiveUserStatus(templateId: string, deviceId: string, isActive: boolean): Promise<boolean>;
  cleanupInactiveUsers(templateId: string, beforeDate: Date): Promise<number>;
  
  // Template settings management
  createTemplateSettings(settings: InsertTemplateSettings): Promise<TemplateSettings>;
  getTemplateSettings(templateId: string): Promise<TemplateSettings | undefined>;
  updateTemplateSettings(templateId: string, updates: Partial<InsertTemplateSettings>): Promise<TemplateSettings | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: 'admin',
        createdAt: new Date()
      })
      .returning();
    return user;
  }

  // Wedding template management
  async createWeddingTemplate(template: InsertWeddingTemplate & { createdBy: number }): Promise<WeddingTemplate> {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [newTemplate] = await db
      .insert(weddingTemplates)
      .values({
        ...template,
        templateId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Create default settings for the template
    await this.createTemplateSettings({
      templateId,
      isUnderConstruction: true,
      updatedBy: 'system'
    });
    
    return newTemplate;
  }

  async getWeddingTemplate(templateId: string): Promise<WeddingTemplate | undefined> {
    const [template] = await db
      .select()
      .from(weddingTemplates)
      .where(eq(weddingTemplates.templateId, templateId));
    return template || undefined;
  }

  async getWeddingTemplateBySlug(slug: string): Promise<WeddingTemplate | undefined> {
    const [template] = await db
      .select()
      .from(weddingTemplates)
      .where(eq(weddingTemplates.slug, slug));
    return template || undefined;
  }

  async getAllWeddingTemplates(): Promise<WeddingTemplate[]> {
    return await db
      .select()
      .from(weddingTemplates)
      .where(eq(weddingTemplates.isActive, true))
      .orderBy(desc(weddingTemplates.createdAt));
  }

  async updateWeddingTemplate(templateId: string, updates: Partial<InsertWeddingTemplate>): Promise<WeddingTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(weddingTemplates)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(weddingTemplates.templateId, templateId))
      .returning();
    return updatedTemplate || undefined;
  }

  async deleteWeddingTemplate(templateId: string): Promise<boolean> {
    const result = await db
      .update(weddingTemplates)
      .set({ isActive: false })
      .where(eq(weddingTemplates.templateId, templateId));
    return (result.rowCount ?? 0) > 0;
  }

  // Template media management
  async createTemplateMedia(media: InsertTemplateMedia): Promise<TemplateMedia> {
    const [newMedia] = await db
      .insert(templateMedia)
      .values({
        ...media,
        uploadedAt: new Date()
      })
      .returning();
    return newMedia;
  }

  async getTemplateMedia(templateId: string): Promise<TemplateMedia[]> {
    return await db
      .select()
      .from(templateMedia)
      .where(eq(templateMedia.templateId, templateId))
      .orderBy(desc(templateMedia.uploadedAt));
  }

  async deleteTemplateMedia(templateId: string, mediaId: number): Promise<boolean> {
    const result = await db
      .delete(templateMedia)
      .where(and(
        eq(templateMedia.templateId, templateId),
        eq(templateMedia.id, mediaId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async updateTemplateMedia(templateId: string, mediaId: number, updates: Partial<InsertTemplateMedia>): Promise<TemplateMedia | undefined> {
    const [updatedMedia] = await db
      .update(templateMedia)
      .set(updates)
      .where(and(
        eq(templateMedia.templateId, templateId),
        eq(templateMedia.id, mediaId)
      ))
      .returning();
    return updatedMedia || undefined;
  }

  // Template comments management
  async createTemplateComment(comment: InsertTemplateComment): Promise<TemplateComment> {
    const [newComment] = await db
      .insert(templateComments)
      .values({
        ...comment,
        createdAt: new Date()
      })
      .returning();
    return newComment;
  }

  async getTemplateComments(templateId: string): Promise<TemplateComment[]> {
    return await db
      .select()
      .from(templateComments)
      .where(eq(templateComments.templateId, templateId))
      .orderBy(desc(templateComments.createdAt));
  }

  async deleteTemplateComment(templateId: string, commentId: number): Promise<boolean> {
    const result = await db
      .delete(templateComments)
      .where(and(
        eq(templateComments.templateId, templateId),
        eq(templateComments.id, commentId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  // Template likes management
  async createTemplateLike(like: InsertTemplateLike): Promise<TemplateLike> {
    const [newLike] = await db
      .insert(templateLikes)
      .values({
        ...like,
        createdAt: new Date()
      })
      .returning();
    return newLike;
  }

  async getTemplateLikes(templateId: string): Promise<TemplateLike[]> {
    return await db
      .select()
      .from(templateLikes)
      .where(eq(templateLikes.templateId, templateId))
      .orderBy(desc(templateLikes.createdAt));
  }

  async deleteTemplateLike(templateId: string, likeId: number): Promise<boolean> {
    const result = await db
      .delete(templateLikes)
      .where(and(
        eq(templateLikes.templateId, templateId),
        eq(templateLikes.id, likeId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async toggleTemplateLike(templateId: string, mediaId: number, userName: string, deviceId: string): Promise<{ action: 'added' | 'removed', like?: TemplateLike }> {
    // Check if like already exists
    const [existingLike] = await db
      .select()
      .from(templateLikes)
      .where(and(
        eq(templateLikes.templateId, templateId),
        eq(templateLikes.mediaId, mediaId),
        eq(templateLikes.deviceId, deviceId)
      ));

    if (existingLike) {
      // Remove like
      await db
        .delete(templateLikes)
        .where(eq(templateLikes.id, existingLike.id));
      return { action: 'removed' };
    } else {
      // Add like
      const like = await this.createTemplateLike({
        templateId,
        mediaId,
        userName,
        deviceId
      });
      return { action: 'added', like };
    }
  }

  // Template stories management
  async createTemplateStory(story: InsertTemplateStory): Promise<TemplateStory> {
    const [newStory] = await db
      .insert(templateStories)
      .values({
        ...story,
        createdAt: new Date()
      })
      .returning();
    return newStory;
  }

  async getTemplateStories(templateId: string): Promise<TemplateStory[]> {
    const now = new Date();
    return await db
      .select()
      .from(templateStories)
      .where(and(
        eq(templateStories.templateId, templateId),
        gte(templateStories.expiresAt, now)
      ))
      .orderBy(desc(templateStories.createdAt));
  }

  async deleteTemplateStory(templateId: string, storyId: number): Promise<boolean> {
    const result = await db
      .delete(templateStories)
      .where(and(
        eq(templateStories.templateId, templateId),
        eq(templateStories.id, storyId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async cleanupExpiredStories(templateId: string): Promise<number> {
    const now = new Date();
    const result = await db
      .delete(templateStories)
      .where(and(
        eq(templateStories.templateId, templateId),
        gte(templateStories.expiresAt, now)
      ));
    return result.rowCount ?? 0;
  }

  // Template timeline events management
  async createTemplateTimelineEvent(event: InsertTemplateTimelineEvent): Promise<TemplateTimelineEvent> {
    const [newEvent] = await db
      .insert(templateTimelineEvents)
      .values({
        ...event,
        createdAt: new Date()
      })
      .returning();
    return newEvent;
  }

  async getTemplateTimelineEvents(templateId: string): Promise<TemplateTimelineEvent[]> {
    return await db
      .select()
      .from(templateTimelineEvents)
      .where(eq(templateTimelineEvents.templateId, templateId))
      .orderBy(templateTimelineEvents.date);
  }

  async updateTemplateTimelineEvent(templateId: string, eventId: number, updates: Partial<InsertTemplateTimelineEvent>): Promise<TemplateTimelineEvent | undefined> {
    const [updatedEvent] = await db
      .update(templateTimelineEvents)
      .set(updates)
      .where(and(
        eq(templateTimelineEvents.templateId, templateId),
        eq(templateTimelineEvents.id, eventId)
      ))
      .returning();
    return updatedEvent || undefined;
  }

  async deleteTemplateTimelineEvent(templateId: string, eventId: number): Promise<boolean> {
    const result = await db
      .delete(templateTimelineEvents)
      .where(and(
        eq(templateTimelineEvents.templateId, templateId),
        eq(templateTimelineEvents.id, eventId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  // Template live users management
  async upsertTemplateLiveUser(user: InsertTemplateLiveUser): Promise<TemplateLiveUser> {
    // Try to update existing user first
    const [existingUser] = await db
      .select()
      .from(templateLiveUsers)
      .where(and(
        eq(templateLiveUsers.templateId, user.templateId),
        eq(templateLiveUsers.deviceId, user.deviceId)
      ));

    if (existingUser) {
      const [updatedUser] = await db
        .update(templateLiveUsers)
        .set({
          userName: user.userName,
          lastSeen: new Date(),
          isActive: user.isActive ?? true
        })
        .where(eq(templateLiveUsers.id, existingUser.id))
        .returning();
      return updatedUser;
    } else {
      const [newUser] = await db
        .insert(templateLiveUsers)
        .values({
          ...user,
          lastSeen: new Date()
        })
        .returning();
      return newUser;
    }
  }

  async getTemplateLiveUsers(templateId: string): Promise<TemplateLiveUser[]> {
    return await db
      .select()
      .from(templateLiveUsers)
      .where(eq(templateLiveUsers.templateId, templateId))
      .orderBy(desc(templateLiveUsers.lastSeen));
  }

  async updateTemplateLiveUserStatus(templateId: string, deviceId: string, isActive: boolean): Promise<boolean> {
    const result = await db
      .update(templateLiveUsers)
      .set({
        isActive,
        lastSeen: new Date()
      })
      .where(and(
        eq(templateLiveUsers.templateId, templateId),
        eq(templateLiveUsers.deviceId, deviceId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async cleanupInactiveUsers(templateId: string, beforeDate: Date): Promise<number> {
    const result = await db
      .delete(templateLiveUsers)
      .where(and(
        eq(templateLiveUsers.templateId, templateId),
        gte(templateLiveUsers.lastSeen, beforeDate)
      ));
    return result.rowCount ?? 0;
  }

  // Template settings management
  async createTemplateSettings(settings: InsertTemplateSettings): Promise<TemplateSettings> {
    const [newSettings] = await db
      .insert(templateSettings)
      .values({
        ...settings,
        lastUpdated: new Date()
      })
      .returning();
    return newSettings;
  }

  async getTemplateSettings(templateId: string): Promise<TemplateSettings | undefined> {
    const [settings] = await db
      .select()
      .from(templateSettings)
      .where(eq(templateSettings.templateId, templateId));
    return settings || undefined;
  }

  async updateTemplateSettings(templateId: string, updates: Partial<InsertTemplateSettings>): Promise<TemplateSettings | undefined> {
    const [updatedSettings] = await db
      .update(templateSettings)
      .set({
        ...updates,
        lastUpdated: new Date()
      })
      .where(eq(templateSettings.templateId, templateId))
      .returning();
    return updatedSettings || undefined;
  }
}

export const storage = new DatabaseStorage();
