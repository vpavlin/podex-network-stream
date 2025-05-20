
import { Dispatcher } from "waku-dispatcher";

// Define content announcement interface
interface ContentAnnouncement {
  cid: string;
  title: string;
  description: string;
  type: 'audio' | 'video';
  publisher: string;
  publishedAt: number;
}

// Create Waku Dispatcher with required parameters
const wakuDispatcher = new Dispatcher(
  "podex", // Application name
  "content-sharing", // Content topic
  "1", // Protocol version
  true // Debug mode
);

// Initialize Waku - this should be called during app startup
export const initWaku = async () => {
  try {
    console.log("Initializing Waku...");
    // The Dispatcher is initialized on creation, no need for separate init() call
    console.log("Waku initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize Waku:", error);
    return false;
  }
};

// Publish content announcement to the network
export const announceContent = async (contentData: ContentAnnouncement): Promise<boolean> => {
  try {
    // Create the content announcement message
    const message = {
      type: "content-announcement",
      data: contentData,
      timestamp: Date.now()
    };
    
    // Convert to JSON and publish to Waku
    console.log("Publishing content announcement to Waku:", message);
    await wakuDispatcher.publish(JSON.stringify(message));
    console.log("Content announcement published successfully");
    return true;
  } catch (error) {
    console.error("Failed to announce content:", error);
    return false;
  }
};

// Subscribe to content announcements
export const subscribeToContentAnnouncements = async (
  callback: (announcement: ContentAnnouncement) => void
) => {
  try {
    console.log("Subscribing to content announcements...");
    
    // Setup subscription handler
    wakuDispatcher.onMessage((wakuMessage: string) => {
      try {
        const message = JSON.parse(wakuMessage);
        if (message.type === "content-announcement") {
          console.log("Received content announcement:", message.data);
          callback(message.data);
        }
      } catch (error) {
        console.error("Error processing content announcement:", error);
      }
    });
    
    return true;
  } catch (error) {
    console.error("Failed to subscribe to content announcements:", error);
    return false;
  }
};
