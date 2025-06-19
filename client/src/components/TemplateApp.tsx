import React, { useState, useEffect, createContext, useContext } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Sun, Moon } from 'lucide-react';
import { UserNamePrompt } from './UserNamePrompt';
import { UploadSection } from './UploadSection';
import { InstagramGallery } from './InstagramGallery';
import { MediaModal } from './MediaModal';
import { ProfileHeader } from './ProfileHeader';
import { StoriesBar } from './StoriesBar';
import { StoriesViewer } from './StoriesViewer';
import { StoryUploadModal } from './StoryUploadModal';
import { TabNavigation } from './TabNavigation';
import { LiveUserIndicator } from './LiveUserIndicator';
import { MusicWishlist } from './MusicWishlist';
import { Timeline } from './Timeline';
import { useUser } from '../hooks/useUser';
import { useDarkMode } from '../hooks/useDarkMode';

// Template Context for isolated data
interface TemplateContextType {
  templateId: string;
  templateData: any;
  isLoading: boolean;
}

const TemplateContext = createContext<TemplateContextType | null>(null);

export const useTemplate = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplate must be used within TemplateProvider');
  }
  return context;
};

interface TemplateAppProps {
  templateId: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

interface TemplateMediaItem {
  id: number;
  templateId: string;
  name: string;
  url: string;
  uploadedBy: string;
  deviceId: string;
  uploadedAt: string;
  type: 'image' | 'video' | 'note';
  noteText?: string;
  isUnavailable?: boolean;
}

interface TemplateComment {
  id: number;
  templateId: string;
  mediaId: number;
  text: string;
  userName: string;
  deviceId: string;
  createdAt: string;
}

interface TemplateLike {
  id: number;
  templateId: string;
  mediaId: number;
  userName: string;
  deviceId: string;
  createdAt: string;
}

interface TemplateStory {
  id: number;
  templateId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  userName: string;
  deviceId: string;
  fileName?: string;
  views: string[];
  createdAt: string;
  expiresAt: string;
}

export const TemplateApp: React.FC<TemplateAppProps> = ({ templateId, isDarkMode, toggleDarkMode }) => {
  const { userName, deviceId, showNamePrompt, setUserName } = useUser();
  
  // Template-specific state
  const [templateData, setTemplateData] = useState<any>(null);
  const [mediaItems, setMediaItems] = useState<TemplateMediaItem[]>([]);
  const [comments, setComments] = useState<TemplateComment[]>([]);
  const [likes, setLikes] = useState<TemplateLike[]>([]);
  const [stories, setStories] = useState<TemplateStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showStoriesViewer, setShowStoriesViewer] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<'gallery' | 'music' | 'timeline'>('gallery');

  // Load template data and media
  useEffect(() => {
    loadTemplateData();
    loadTemplateMedia();
    loadTemplateComments();
    loadTemplateLikes();
    loadTemplateStories();
  }, [templateId]);

  const loadTemplateData = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplateData(data.template);
      } else {
        console.error('Failed to load template data');
      }
    } catch (error) {
      console.error('Error loading template data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplateMedia = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}/media`);
      if (response.ok) {
        const data = await response.json();
        setMediaItems(data.media);
      }
    } catch (error) {
      console.error('Error loading media:', error);
    }
  };

  const loadTemplateComments = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadTemplateLikes = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}/likes`);
      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes);
      }
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const loadTemplateStories = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}/stories`);
      if (response.ok) {
        const data = await response.json();
        setStories(data.stories);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  };

  const handleUpload = async (files: FileList) => {
    if (!userName || !deviceId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // For each file, upload to Firebase storage and then save metadata to database
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        // Simulate upload progress
        setUploadProgress(((i + 1) / files.length) * 100);

        // TODO: Implement file upload to storage and then save metadata
        const mediaData = {
          name: `${Date.now()}-${file.name}`,
          url: URL.createObjectURL(file), // Temporary - should be actual storage URL
          uploadedBy: userName,
          deviceId: deviceId,
          type: file.type.startsWith('video/') ? 'video' : 'image'
        };

        const response = await fetch(`/api/templates/${templateId}/media`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mediaData),
        });

        if (response.ok) {
          await loadTemplateMedia();
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleVideoUpload = async (videoBlob: Blob) => {
    if (!userName || !deviceId) return;

    setIsUploading(true);
    setUploadProgress(50);

    try {
      // TODO: Upload video blob to storage
      const mediaData = {
        name: `${Date.now()}-recorded-video.webm`,
        url: URL.createObjectURL(videoBlob), // Temporary - should be actual storage URL
        uploadedBy: userName,
        deviceId: deviceId,
        type: 'video'
      };

      const response = await fetch(`/api/templates/${templateId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mediaData),
      });

      if (response.ok) {
        await loadTemplateMedia();
      }

      setUploadProgress(100);
    } catch (error) {
      console.error('Error uploading video:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleNoteSubmit = async (noteText: string) => {
    if (!userName || !deviceId) return;

    try {
      const mediaData = {
        name: `note-${Date.now()}`,
        url: '', // Notes don't have URLs
        uploadedBy: userName,
        deviceId: deviceId,
        type: 'note',
        noteText: noteText
      };

      const response = await fetch(`/api/templates/${templateId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mediaData),
      });

      if (response.ok) {
        await loadTemplateMedia();
      }
    } catch (error) {
      console.error('Error submitting note:', error);
    }
  };

  const handleEditNote = async (item: TemplateMediaItem, newText: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/media/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ noteText: newText }),
      });

      if (response.ok) {
        await loadTemplateMedia();
      }
    } catch (error) {
      console.error('Error editing note:', error);
    }
  };

  const handleDelete = async (item: TemplateMediaItem) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/media/${item.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadTemplateMedia();
      }
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  };

  const handleAddComment = async (mediaId: string, text: string) => {
    if (!userName || !deviceId) return;

    try {
      const response = await fetch(`/api/templates/${templateId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaId: parseInt(mediaId),
          text,
          userName,
          deviceId,
        }),
      });

      if (response.ok) {
        await loadTemplateComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadTemplateComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleToggleLike = async (mediaId: string) => {
    if (!userName || !deviceId) return;

    try {
      const response = await fetch(`/api/templates/${templateId}/likes/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaId: parseInt(mediaId),
          userName,
          deviceId,
        }),
      });

      if (response.ok) {
        await loadTemplateLikes();
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleStoryUpload = async (file: File) => {
    if (!userName || !deviceId) return;

    try {
      // TODO: Upload story to storage
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const storyData = {
        mediaUrl: URL.createObjectURL(file), // Temporary - should be actual storage URL
        mediaType: file.type.startsWith('video/') ? 'video' : 'image',
        userName,
        deviceId,
        fileName: file.name,
        views: [],
        expiresAt: expiresAt.toISOString(),
      };

      const response = await fetch(`/api/templates/${templateId}/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData),
      });

      if (response.ok) {
        await loadTemplateStories();
        setShowStoryUpload(false);
      }
    } catch (error) {
      console.error('Error uploading story:', error);
    }
  };

  const handleViewStory = (storyIndex: number) => {
    setCurrentStoryIndex(storyIndex);
    setShowStoriesViewer(true);
  };

  const handleStoryViewed = async (storyId: string) => {
    // TODO: Mark story as viewed
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/stories/${storyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadTemplateStories();
      }
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!templateData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Template nicht gefunden</h1>
          <p className="text-gray-500">Das angeforderte Template existiert nicht oder ist nicht verfügbar.</p>
        </div>
      </div>
    );
  }

  if (showNamePrompt) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <UserNamePrompt onSubmit={setUserName} isDarkMode={isDarkMode} />
      </div>
    );
  }

  return (
    <TemplateContext.Provider value={{ templateId, templateData, isLoading }}>
      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        {/* Header */}
        <div className="sticky top-0 z-40 backdrop-blur-lg border-b border-opacity-20">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <ProfileHeader isDarkMode={isDarkMode} />
              <div className="flex items-center gap-4">
                <LiveUserIndicator currentUser={userName} isDarkMode={isDarkMode} />
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-full transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                  }`}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stories Bar */}
        <div className="max-w-4xl mx-auto px-4 py-4">
          <StoriesBar
            stories={stories.map(s => ({
              id: s.id.toString(),
              mediaUrl: s.mediaUrl,
              mediaType: s.mediaType,
              userName: s.userName,
              deviceId: s.deviceId,
              createdAt: s.createdAt,
              expiresAt: s.expiresAt,
              views: s.views || [],
              fileName: s.fileName
            }))}
            currentUser={userName}
            onAddStory={() => setShowStoryUpload(true)}
            onViewStory={handleViewStory}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 pb-8">
          {/* Upload Section */}
          <UploadSection
            onUpload={handleUpload}
            onVideoUpload={handleVideoUpload}
            onNoteSubmit={handleNoteSubmit}
            onAddStory={() => setShowStoryUpload(true)}
            isUploading={isUploading}
            progress={uploadProgress}
            isDarkMode={isDarkMode}
          />

          {/* Tab Navigation */}
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isDarkMode={isDarkMode}
          />

          {/* Tab Content */}
          {activeTab === 'gallery' && (
            <InstagramGallery
              items={mediaItems.map(item => ({
                id: item.id.toString(),
                name: item.name,
                url: item.url,
                uploadedBy: item.uploadedBy,
                uploadedAt: item.uploadedAt,
                deviceId: item.deviceId,
                type: item.type,
                noteText: item.noteText,
                isUnavailable: item.isUnavailable
              }))}
              onItemClick={(index) => {
                setCurrentImageIndex(index);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
              onEditNote={handleEditNote}
              isAdmin={false} // Template users are not admin by default
              comments={comments.map(c => ({
                id: c.id.toString(),
                mediaId: c.mediaId.toString(),
                text: c.text,
                userName: c.userName,
                deviceId: c.deviceId,
                createdAt: c.createdAt
              }))}
              likes={likes.map(l => ({
                id: l.id.toString(),
                mediaId: l.mediaId.toString(),
                userName: l.userName,
                deviceId: l.deviceId,
                createdAt: l.createdAt
              }))}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              onToggleLike={handleToggleLike}
              userName={userName}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'music' && (
            <MusicWishlist isDarkMode={isDarkMode} />
          )}

          {activeTab === 'timeline' && (
            <Timeline 
              isDarkMode={isDarkMode} 
              userName={userName} 
              isAdmin={false}
            />
          )}
        </div>

        {/* Modals */}
        {modalOpen && (
          <MediaModal
            isOpen={modalOpen}
            items={mediaItems.map(item => ({
              id: item.id.toString(),
              name: item.name,
              url: item.url,
              uploadedBy: item.uploadedBy,
              uploadedAt: item.uploadedAt,
              deviceId: item.deviceId,
              type: item.type,
              noteText: item.noteText,
              isUnavailable: item.isUnavailable
            }))}
            currentIndex={currentImageIndex}
            onClose={() => setModalOpen(false)}
            onNext={() => setCurrentImageIndex((prev) => (prev + 1) % mediaItems.length)}
            onPrev={() => setCurrentImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)}
            comments={comments.map(c => ({
              id: c.id.toString(),
              mediaId: c.mediaId.toString(),
              text: c.text,
              userName: c.userName,
              deviceId: c.deviceId,
              createdAt: c.createdAt
            }))}
            likes={likes.map(l => ({
              id: l.id.toString(),
              mediaId: l.mediaId.toString(),
              userName: l.userName,
              deviceId: l.deviceId,
              createdAt: l.createdAt
            }))}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            onToggleLike={handleToggleLike}
            userName={userName}
            isAdmin={false}
            isDarkMode={isDarkMode}
          />
        )}

        {showStoriesViewer && (
          <StoriesViewer
            isOpen={showStoriesViewer}
            stories={stories.map(s => ({
              id: s.id.toString(),
              mediaUrl: s.mediaUrl,
              mediaType: s.mediaType,
              userName: s.userName,
              deviceId: s.deviceId,
              createdAt: s.createdAt,
              expiresAt: s.expiresAt,
              views: s.views || [],
              fileName: s.fileName
            }))}
            initialStoryIndex={currentStoryIndex}
            currentUser={userName}
            onClose={() => setShowStoriesViewer(false)}
            onStoryViewed={handleStoryViewed}
            onDeleteStory={handleDeleteStory}
            isAdmin={false}
            isDarkMode={isDarkMode}
          />
        )}

        {showStoryUpload && (
          <StoryUploadModal
            isOpen={showStoryUpload}
            onClose={() => setShowStoryUpload(false)}
            onUpload={handleStoryUpload}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </TemplateContext.Provider>
  );
};