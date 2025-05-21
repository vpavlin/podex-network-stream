
import { Dispatcher, DispatchMetadata, Signer, Store } from "waku-dispatcher";
import {
  createLightNode,
  waitForRemotePeer,
  createDecoder,
  LightNode,
  EConnectionStateEvents,
  createEncoder,
} from "@waku/sdk";
import {
  HealthStatus,
  HealthStatusChangeEvents,
  IWaku,
  Protocols
} from "@waku/interfaces"
import { ContentAnnouncement } from "./types";
import { Content, db } from "./db";

const bootstrapNodes: string[] = [
  "/dns4/waku-test.bloxy.one/tcp/8095/wss/p2p/16Uiu2HAmSZbDB7CusdRhgkD81VssRjQV5ZH13FbzCGcdnbbh6VwZ",
  "/dns4/node-01.do-ams3.waku.sandbox.status.im/tcp/8000/wss/p2p/16Uiu2HAmNaeL4p3WEYzC9mgXBmBWSgWjPHRvatZTXnp8Jgv3iKsb",
]

const networkConfig = { clusterId: 42, shards: [0] }
let wakuDispatcher: Dispatcher | undefined
let wakuDispatcherPromise: Promise<Dispatcher>
let initializing = false

// Initialize Waku - this should be called during app startup
export const getDispatcher = async (): Promise<Dispatcher> => {
  if (initializing) return wakuDispatcherPromise
  initializing = true

  wakuDispatcherPromise = new Promise(async (resolve, reject) => {
    try {
      console.log("Initializing Dispatcher instance");
      const node: LightNode = await createLightNode({
        networkConfig: networkConfig,
        defaultBootstrap: false,
        bootstrapPeers: bootstrapNodes,
        numPeersToUse: 3
      });
      
      await node.start();

      const contentTopic = "/podex/1/content-sharing/json"

      // Wait for connection to at least one peer
      await node.waitForPeers([Protocols.Store, Protocols.Filter, Protocols.LightPush]);
      const store = new Store(`podex`)
      
      // Create Waku Dispatcher with required parameters
      wakuDispatcher = new Dispatcher(
        node,
        contentTopic,
        true,
        store
      );
      
      wakuDispatcher.on("announce", async (announcement: ContentAnnouncement, signer: Signer, _3: DispatchMetadata): Promise<void> => {
        console.log("Received new content announcement:", announcement);

        // Check if we already have this content
        const existingContent = await db.getContent(announcement.cid);

        if (!existingContent) {
          // Create a new content object from the announcement
          const newContent: Content = {
            id: announcement.cid,
            title: announcement.title,
            description: announcement.description,
            type: announcement.type,
            url: "", // We don't have the URL yet, it will be fetched when viewing
            cid: announcement.contentCid,
            publisher: announcement.publisher,
            publishedAt: announcement.publishedAt
          };

          // Add to database
          await db.addContent(newContent);

          // @ts-ignore
          const event = new CustomEvent("podex:announce", { detail: newContent })
          console.log(event)
          document.dispatchEvent(event)
        }
      })
      
      await wakuDispatcher.start()
      await wakuDispatcher.dispatchLocalQuery()
      await wakuDispatcher.dispatchQuery()
      
      console.log("Initializing Waku...");
      console.log("Waku initialized successfully");
      resolve(wakuDispatcher);
    } catch (error) {
      console.error("Failed to initialize Waku:", error);
      reject(error);
    }
  });

  return wakuDispatcherPromise;
};

// Publish content announcement to the network
export const announceContent = async (contentData: ContentAnnouncement): Promise<boolean> => {
  try {
    const dispatcher = await getDispatcher();
    
    // Create the content announcement message
    const message = {
      type: "content-announcement",
      data: contentData,
      timestamp: Date.now()
    };

    // Convert to JSON and publish to Waku
    console.log("Publishing content announcement to Waku:", message);
    const result = await dispatcher.emitTo(dispatcher.encoder, "announce", contentData, undefined, false, true);
    
    console.log(result);
    if (result) {
      console.log("Content announcement published successfully");
      return true;
    } else {
      console.log("Failed to publish");
      return false;
    }
  } catch (error) {
    console.error("Failed to announce content:", error);
    return false;
  }
};

// Subscribe to content announcements
export const subscribeToContentAnnouncements = async (
  callback: (announcement: ContentAnnouncement, signer: Signer, _3: DispatchMetadata) => Promise<void>
) => {
  try {
    console.log("Subscribing to content announcements...");
    const dispatcher = await getDispatcher();
    
    // Setup subscription handler
    dispatcher.on("announce", callback);
    
    return true;
  } catch (error) {
    console.error("Failed to subscribe to content announcements:", error);
    return false;
  }
};
