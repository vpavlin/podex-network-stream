
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
import { wakuPeerExchangeDiscovery } from "@waku/discovery";
import { derivePubsubTopicsFromNetworkConfig } from "@waku/utils"
import { ContentAnnouncement } from "./types";



const bootstrapNodes: string[] = [
  "/dns4/waku-test.bloxy.one/tcp/8095/wss/p2p/16Uiu2HAmSZbDB7CusdRhgkD81VssRjQV5ZH13FbzCGcdnbbh6VwZ",
  "/dns4/node-01.do-ams3.waku.sandbox.status.im/tcp/8000/wss/p2p/16Uiu2HAmNaeL4p3WEYzC9mgXBmBWSgWjPHRvatZTXnp8Jgv3iKsb",
]


const networkConfig =  {clusterId: 42, shards: [0]}

console.log("Initializing Qakulib instance");
const node:LightNode = await createLightNode({            
  networkConfig:networkConfig,
  defaultBootstrap: false,
  bootstrapPeers: bootstrapNodes,
  numPeersToUse: 3,
  // Fix type error by using type assertion for the peer discovery
  libp2p: {
    peerDiscovery: [
      wakuPeerExchangeDiscovery(derivePubsubTopicsFromNetworkConfig(networkConfig)) as any
    ]
  }, });
await node.start();

const contentTopic = "/podex/1/content-sharing/json"

// Wait for connection to at least one peer
await node.waitForPeers([Protocols.Store, Protocols.Filter, Protocols.LightPush]);
const store = new Store(`podex`) 
// Create Waku Dispatcher with required parameters
const wakuDispatcher = new Dispatcher(
  node,
  contentTopic,
  true,
  store
);

// Initialize Waku - this should be called during app startup
export const initWaku = async () => {
  try {
    await wakuDispatcher.start()
    await wakuDispatcher.dispatchLocalQuery()
    await wakuDispatcher.dispatchQuery()
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
    const result = await wakuDispatcher.emitTo(wakuDispatcher.encoder, "announce", contentData, undefined, false, true);
    console.log(result)
    if (result) {
      console.log("Content announcement published successfully");
      return true;
    } else {
      console.log("Failed to publish");
      return false
    }
  } catch (error) {
    console.error("Failed to announce content:", error);
    return false;
  }
};

// Subscribe to content announcements
export const subscribeToContentAnnouncements = async (
  callback: (announcement: ContentAnnouncement, signer: Signer, _3:DispatchMetadata) => Promise<void>
) => {
  try {
    console.log("Subscribing to content announcements...");
    
    // Setup subscription handler
    wakuDispatcher.on("announce", callback);
    
    return true;
  } catch (error) {
    console.error("Failed to subscribe to content announcements:", error);
    return false;
  }
};
