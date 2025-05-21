export interface Content {
  id: string;
  title: string;
  description: string;
  type: 'audio' | 'video';
  url: string;
  cid?: string; // Codex Content Identifier
  thumbnail?: string;
  thumbnailCid?: string; // Thumbnail Codex Content Identifier
  publisher: string;
  publishedAt: number;
  metadata?: Record<string, any>;
  signature: string;
}

export interface UserInteraction {
  contentId: string;
  action: 'like' | 'watchLater' | 'viewed';
  timestamp: number;
}

export interface UserContent {
  id: string;
  contentId: string;
  status: 'uploading' | 'processing' | 'published' | 'failed';
  uploadedAt: number;
}

export interface FollowedAddress {
  address: string;
  ensName?: string;
  addedAt: number;
}

class PodexDatabase {
  private db: IDBDatabase | null = null;
  private dbName = 'podex-db';
  private version = 3; // Increase version to trigger onupgradeneeded

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`Opening IndexedDB ${this.dbName} with version ${this.version}`);
        const request = indexedDB.open(this.dbName, this.version);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const oldVersion = event.oldVersion;
          
          console.log(`Database upgrade from version ${oldVersion} to ${this.version}`);

          // Content store - only create if it doesn't exist
          if (!db.objectStoreNames.contains('content')) {
            const contentStore = db.createObjectStore('content', { keyPath: 'id' });
            contentStore.createIndex('type', 'type', { unique: false });
            contentStore.createIndex('publisher', 'publisher', { unique: false });
            contentStore.createIndex('publishedAt', 'publishedAt', { unique: false });
            console.log('Created content store');
          }

          // User interactions store - only create if it doesn't exist
          if (!db.objectStoreNames.contains('interactions')) {
            const interactionsStore = db.createObjectStore('interactions', { keyPath: ['contentId', 'action'] });
            interactionsStore.createIndex('action', 'action', { unique: false });
            interactionsStore.createIndex('timestamp', 'timestamp', { unique: false });
            console.log('Created interactions store');
          }

          // User content store (uploads) - only create if it doesn't exist
          if (!db.objectStoreNames.contains('userContent')) {
            const userContentStore = db.createObjectStore('userContent', { keyPath: 'id' });
            userContentStore.createIndex('contentId', 'contentId', { unique: false });
            userContentStore.createIndex('status', 'status', { unique: false });
            userContentStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
            console.log('Created userContent store');
          }
          
          // Followed addresses store - create or recreate
          try {
            if (db.objectStoreNames.contains('followedAddresses')) {
              db.deleteObjectStore('followedAddresses');
              console.log('Deleted existing followedAddresses store for recreation');
            }
            
            const followedAddressesStore = db.createObjectStore('followedAddresses', { keyPath: 'address' });
            followedAddressesStore.createIndex('addedAt', 'addedAt', { unique: false });
            console.log('Created or recreated followedAddresses store');
          } catch (error) {
            console.error('Error creating followedAddresses store:', error);
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          console.log('PodexDB initialized successfully with version:', this.db.version);
          resolve();
        };

        request.onerror = (event) => {
          console.error('Error initializing PodexDB:', (event.target as IDBOpenDBRequest).error);
          reject((event.target as IDBOpenDBRequest).error);
        };
      } catch (error) {
        console.error('Exception during database initialization:', error);
        reject(error);
      }
    });
  }

  // Content methods
  async addContent(content: Content): Promise<string> {
    await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('content', 'readwrite');
      const store = transaction.objectStore('content');
      const request = store.add(content);

      request.onsuccess = () => resolve(content.id);
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  async getContent(id: string): Promise<Content | null> {
    await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('content', 'readonly');
      const store = transaction.objectStore('content');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  async getAllContent(): Promise<Content[]> {
    await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('content', 'readonly');
      const store = transaction.objectStore('content');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  async getLatestContent(limit: number = 20): Promise<Content[]> {
    await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('content', 'readonly');
      const store = transaction.objectStore('content');
      const index = store.index('publishedAt');
      
      // Get all content sorted by publishedAt in descending order
      const request = index.openCursor(null, 'prev');
      const results: Content[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  // User interactions methods
  async addInteraction(interaction: UserInteraction): Promise<void> {
    await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('interactions', 'readwrite');
      const store = transaction.objectStore('interactions');
      const request = store.put(interaction);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  async removeInteraction(contentId: string, action: UserInteraction['action']): Promise<void> {
    await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('interactions', 'readwrite');
      const store = transaction.objectStore('interactions');
      const request = store.delete([contentId, action]);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  async getInteractionsByAction(action: UserInteraction['action']): Promise<UserInteraction[]> {
    await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('interactions', 'readonly');
      const store = transaction.objectStore('interactions');
      const index = store.index('action');
      const request = index.getAll(action);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  async hasInteraction(contentId: string, action: UserInteraction['action']): Promise<boolean> {
    await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('interactions', 'readonly');
      const store = transaction.objectStore('interactions');
      const request = store.get([contentId, action]);

      request.onsuccess = () => resolve(!!request.result);
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  // User content methods
  async addUserContent(userContent: UserContent): Promise<string> {
    await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('userContent', 'readwrite');
      const store = transaction.objectStore('userContent');
      const request = store.add(userContent);

      request.onsuccess = () => resolve(userContent.id);
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  async updateUserContent(id: string, updates: Partial<UserContent>): Promise<void> {
    await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('userContent', 'readwrite');
      const store = transaction.objectStore('userContent');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        if (!getRequest.result) {
          reject(new Error(`UserContent with ID ${id} not found`));
          return;
        }

        const updatedUserContent = { ...getRequest.result, ...updates };
        const updateRequest = store.put(updatedUserContent);
        
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = (event) => reject((event.target as IDBRequest).error);
      };

      getRequest.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  async getUserContent(): Promise<UserContent[]> {
    await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('userContent', 'readonly');
      const store = transaction.objectStore('userContent');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  async getLikedContent(): Promise<Content[]> {
    await this.ensureDbReady();
    
    const likedInteractions = await this.getInteractionsByAction('like');
    const contentIds = likedInteractions.map(interaction => interaction.contentId);
    
    if (contentIds.length === 0) {
      return [];
    }

    const contentItems: Content[] = [];
    for (const id of contentIds) {
      const content = await this.getContent(id);
      if (content) {
        contentItems.push(content);
      }
    }
    
    return contentItems;
  }

  async getWatchLaterContent(): Promise<Content[]> {
    await this.ensureDbReady();
    
    const watchLaterInteractions = await this.getInteractionsByAction('watchLater');
    const contentIds = watchLaterInteractions.map(interaction => interaction.contentId);
    
    if (contentIds.length === 0) {
      return [];
    }

    const contentItems: Content[] = [];
    for (const id of contentIds) {
      const content = await this.getContent(id);
      if (content) {
        contentItems.push(content);
      }
    }
    
    return contentItems;
  }

  async getViewedContent(): Promise<Content[]> {
    await this.ensureDbReady();
    
    const viewedInteractions = await this.getInteractionsByAction('viewed');
    const contentIds = viewedInteractions.map(interaction => interaction.contentId);
    
    if (contentIds.length === 0) {
      return [];
    }

    const contentItems: Content[] = [];
    for (const id of contentIds) {
      const content = await this.getContent(id);
      if (content) {
        contentItems.push(content);
      }
    }
    
    return contentItems;
  }

  // Followed addresses methods
  async followAddress(address: string, ensName?: string): Promise<void> {
    await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction('followedAddresses', 'readwrite');
        const store = transaction.objectStore('followedAddresses');
        
        const followedAddress: FollowedAddress = {
          address: address.toLowerCase(),
          ensName,
          addedAt: Date.now(),
        };
        
        const request = store.put(followedAddress);

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
          console.error("Error in followAddress:", (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      } catch (error) {
        console.error("Exception in followAddress:", error);
        reject(error);
      }
    });
  }

  async unfollowAddress(address: string): Promise<void> {
    await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction('followedAddresses', 'readwrite');
        const store = transaction.objectStore('followedAddresses');
        const request = store.delete(address.toLowerCase());

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
          console.error("Error in unfollowAddress:", (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      } catch (error) {
        console.error("Exception in unfollowAddress:", error);
        reject(error);
      }
    });
  }

  async getFollowedAddresses(): Promise<FollowedAddress[]> {
    await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction('followedAddresses', 'readonly');
        const store = transaction.objectStore('followedAddresses');
        const request = store.getAll();

        request.onsuccess = () => {
          console.log('Retrieved followed addresses:', request.result);
          resolve(request.result || []);
        };
        request.onerror = (event) => {
          console.error("Error in getFollowedAddresses:", (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      } catch (error) {
        console.error("Exception in getFollowedAddresses:", error);
        // If there's an error (e.g., store doesn't exist yet), return empty array
        resolve([]);
      }
    });
  }

  async isAddressFollowed(address: string): Promise<boolean> {
    await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction('followedAddresses', 'readonly');
        const store = transaction.objectStore('followedAddresses');
        const request = store.get(address.toLowerCase());

        request.onsuccess = () => resolve(!!request.result);
        request.onerror = (event) => {
          console.error("Error in isAddressFollowed:", (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      } catch (error) {
        console.error("Exception in isAddressFollowed:", error);
        // If there's an error (e.g., store doesn't exist yet), return false
        resolve(false);
      }
    });
  }

  async getContentFromFollowedAddresses(): Promise<Content[]> {
    try {
      const followedAddresses = await this.getFollowedAddresses();
      
      if (followedAddresses.length === 0) {
        return [];
      }

      const addressSet = new Set(followedAddresses.map(fa => fa.address.toLowerCase()));
      
      // Get all content and filter by publisher
      const allContent = await this.getAllContent();
      return allContent.filter(content => 
        content.publisher && addressSet.has(content.publisher.toLowerCase())
      ).sort((a, b) => b.publishedAt - a.publishedAt);
    } catch (error) {
      console.error("Error in getContentFromFollowedAddresses:", error);
      return [];
    }
  }

  // Removing the duplicate getContent method that was causing the error

  private async ensureDbReady(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }
}

export const db = new PodexDatabase();
