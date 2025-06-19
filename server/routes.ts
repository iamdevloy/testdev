import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertWeddingTemplateSchema,
  insertTemplateMediaSchema,
  insertTemplateCommentSchema,
  insertTemplateLikeSchema,
  insertTemplateStorySchema,
  insertTemplateTimelineEventSchema,
  insertTemplateLiveUserSchema,
  insertTemplateSettingsSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ============= ADMIN ROUTES =============
  
  // Get all wedding templates (admin only)
  app.get("/api/admin/templates", async (req, res) => {
    try {
      const templates = await storage.getAllWeddingTemplates();
      res.json({ templates });
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Create new wedding template (admin only)
  app.post("/api/admin/templates", async (req, res) => {
    try {
      const validatedData = insertWeddingTemplateSchema.parse(req.body);
      const template = await storage.createWeddingTemplate({
        ...validatedData,
        createdBy: 1 // TODO: Get from authenticated admin user
      });
      res.json({ template });
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  // Update wedding template (admin only)
  app.patch("/api/admin/templates/:templateId", async (req, res) => {
    try {
      const { templateId } = req.params;
      const updates = insertWeddingTemplateSchema.partial().parse(req.body);
      const template = await storage.updateWeddingTemplate(templateId, updates);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json({ template });
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  // Delete wedding template (admin only)
  app.delete("/api/admin/templates/:templateId", async (req, res) => {
    try {
      const { templateId } = req.params;
      const success = await storage.deleteWeddingTemplate(templateId);
      
      if (!success) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // ============= TEMPLATE-SPECIFIC ROUTES =============
  
  // Get template info
  app.get("/api/templates/:templateId", async (req, res) => {
    try {
      const { templateId } = req.params;
      const template = await storage.getWeddingTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json({ template });
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  // Get template by slug
  app.get("/api/templates/slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const template = await storage.getWeddingTemplateBySlug(slug);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json({ template });
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  // ============= MEDIA ROUTES =============
  
  // Get template media
  app.get("/api/templates/:templateId/media", async (req, res) => {
    try {
      const { templateId } = req.params;
      const media = await storage.getTemplateMedia(templateId);
      res.json({ media });
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  // Create template media
  app.post("/api/templates/:templateId/media", async (req, res) => {
    try {
      const { templateId } = req.params;
      const validatedData = insertTemplateMediaSchema.parse({
        ...req.body,
        templateId
      });
      const media = await storage.createTemplateMedia(validatedData);
      res.json({ media });
    } catch (error) {
      console.error("Error creating media:", error);
      res.status(500).json({ error: "Failed to create media" });
    }
  });

  // Update template media
  app.patch("/api/templates/:templateId/media/:mediaId", async (req, res) => {
    try {
      const { templateId, mediaId } = req.params;
      const updates = insertTemplateMediaSchema.partial().parse(req.body);
      const media = await storage.updateTemplateMedia(templateId, parseInt(mediaId), updates);
      
      if (!media) {
        return res.status(404).json({ error: "Media not found" });
      }
      
      res.json({ media });
    } catch (error) {
      console.error("Error updating media:", error);
      res.status(500).json({ error: "Failed to update media" });
    }
  });

  // Delete template media
  app.delete("/api/templates/:templateId/media/:mediaId", async (req, res) => {
    try {
      const { templateId, mediaId } = req.params;
      const success = await storage.deleteTemplateMedia(templateId, parseInt(mediaId));
      
      if (!success) {
        return res.status(404).json({ error: "Media not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting media:", error);
      res.status(500).json({ error: "Failed to delete media" });
    }
  });

  // ============= COMMENTS ROUTES =============
  
  // Get template comments
  app.get("/api/templates/:templateId/comments", async (req, res) => {
    try {
      const { templateId } = req.params;
      const comments = await storage.getTemplateComments(templateId);
      res.json({ comments });
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Create template comment
  app.post("/api/templates/:templateId/comments", async (req, res) => {
    try {
      const { templateId } = req.params;
      const validatedData = insertTemplateCommentSchema.parse({
        ...req.body,
        templateId
      });
      const comment = await storage.createTemplateComment(validatedData);
      res.json({ comment });
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Delete template comment
  app.delete("/api/templates/:templateId/comments/:commentId", async (req, res) => {
    try {
      const { templateId, commentId } = req.params;
      const success = await storage.deleteTemplateComment(templateId, parseInt(commentId));
      
      if (!success) {
        return res.status(404).json({ error: "Comment not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // ============= LIKES ROUTES =============
  
  // Get template likes
  app.get("/api/templates/:templateId/likes", async (req, res) => {
    try {
      const { templateId } = req.params;
      const likes = await storage.getTemplateLikes(templateId);
      res.json({ likes });
    } catch (error) {
      console.error("Error fetching likes:", error);
      res.status(500).json({ error: "Failed to fetch likes" });
    }
  });

  // Toggle template like
  app.post("/api/templates/:templateId/likes/toggle", async (req, res) => {
    try {
      const { templateId } = req.params;
      const { mediaId, userName, deviceId } = req.body;
      
      const result = await storage.toggleTemplateLike(templateId, mediaId, userName, deviceId);
      res.json(result);
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  // ============= STORIES ROUTES =============
  
  // Get template stories
  app.get("/api/templates/:templateId/stories", async (req, res) => {
    try {
      const { templateId } = req.params;
      const stories = await storage.getTemplateStories(templateId);
      res.json({ stories });
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  // Create template story
  app.post("/api/templates/:templateId/stories", async (req, res) => {
    try {
      const { templateId } = req.params;
      const validatedData = insertTemplateStorySchema.parse({
        ...req.body,
        templateId
      });
      const story = await storage.createTemplateStory(validatedData);
      res.json({ story });
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({ error: "Failed to create story" });
    }
  });

  // Delete template story
  app.delete("/api/templates/:templateId/stories/:storyId", async (req, res) => {
    try {
      const { templateId, storyId } = req.params;
      const success = await storage.deleteTemplateStory(templateId, parseInt(storyId));
      
      if (!success) {
        return res.status(404).json({ error: "Story not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting story:", error);
      res.status(500).json({ error: "Failed to delete story" });
    }
  });

  // Cleanup expired stories
  app.post("/api/templates/:templateId/stories/cleanup", async (req, res) => {
    try {
      const { templateId } = req.params;
      const deletedCount = await storage.cleanupExpiredStories(templateId);
      res.json({ deletedCount });
    } catch (error) {
      console.error("Error cleaning up stories:", error);
      res.status(500).json({ error: "Failed to cleanup stories" });
    }
  });

  // ============= TIMELINE ROUTES =============
  
  // Get template timeline events
  app.get("/api/templates/:templateId/timeline", async (req, res) => {
    try {
      const { templateId } = req.params;
      const events = await storage.getTemplateTimelineEvents(templateId);
      res.json({ events });
    } catch (error) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({ error: "Failed to fetch timeline" });
    }
  });

  // Create template timeline event
  app.post("/api/templates/:templateId/timeline", async (req, res) => {
    try {
      const { templateId } = req.params;
      const validatedData = insertTemplateTimelineEventSchema.parse({
        ...req.body,
        templateId
      });
      const event = await storage.createTemplateTimelineEvent(validatedData);
      res.json({ event });
    } catch (error) {
      console.error("Error creating timeline event:", error);
      res.status(500).json({ error: "Failed to create timeline event" });
    }
  });

  // Update template timeline event
  app.patch("/api/templates/:templateId/timeline/:eventId", async (req, res) => {
    try {
      const { templateId, eventId } = req.params;
      const updates = insertTemplateTimelineEventSchema.partial().parse(req.body);
      const event = await storage.updateTemplateTimelineEvent(templateId, parseInt(eventId), updates);
      
      if (!event) {
        return res.status(404).json({ error: "Timeline event not found" });
      }
      
      res.json({ event });
    } catch (error) {
      console.error("Error updating timeline event:", error);
      res.status(500).json({ error: "Failed to update timeline event" });
    }
  });

  // Delete template timeline event
  app.delete("/api/templates/:templateId/timeline/:eventId", async (req, res) => {
    try {
      const { templateId, eventId } = req.params;
      const success = await storage.deleteTemplateTimelineEvent(templateId, parseInt(eventId));
      
      if (!success) {
        return res.status(404).json({ error: "Timeline event not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting timeline event:", error);
      res.status(500).json({ error: "Failed to delete timeline event" });
    }
  });

  // ============= LIVE USERS ROUTES =============
  
  // Get template live users
  app.get("/api/templates/:templateId/live-users", async (req, res) => {
    try {
      const { templateId } = req.params;
      const users = await storage.getTemplateLiveUsers(templateId);
      res.json({ users });
    } catch (error) {
      console.error("Error fetching live users:", error);
      res.status(500).json({ error: "Failed to fetch live users" });
    }
  });

  // Update/Create template live user
  app.post("/api/templates/:templateId/live-users", async (req, res) => {
    try {
      const { templateId } = req.params;
      const validatedData = insertTemplateLiveUserSchema.parse({
        ...req.body,
        templateId
      });
      const user = await storage.upsertTemplateLiveUser(validatedData);
      res.json({ user });
    } catch (error) {
      console.error("Error updating live user:", error);
      res.status(500).json({ error: "Failed to update live user" });
    }
  });

  // Update live user status
  app.patch("/api/templates/:templateId/live-users/:deviceId", async (req, res) => {
    try {
      const { templateId, deviceId } = req.params;
      const { isActive } = req.body;
      const success = await storage.updateTemplateLiveUserStatus(templateId, deviceId, isActive);
      
      if (!success) {
        return res.status(404).json({ error: "Live user not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating live user status:", error);
      res.status(500).json({ error: "Failed to update live user status" });
    }
  });

  // ============= SETTINGS ROUTES =============
  
  // Get template settings
  app.get("/api/templates/:templateId/settings", async (req, res) => {
    try {
      const { templateId } = req.params;
      const settings = await storage.getTemplateSettings(templateId);
      
      if (!settings) {
        return res.status(404).json({ error: "Settings not found" });
      }
      
      res.json({ settings });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update template settings
  app.patch("/api/templates/:templateId/settings", async (req, res) => {
    try {
      const { templateId } = req.params;
      const updates = insertTemplateSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateTemplateSettings(templateId, updates);
      
      if (!settings) {
        return res.status(404).json({ error: "Settings not found" });
      }
      
      res.json({ settings });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
