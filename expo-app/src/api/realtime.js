import AsyncStorage from "@react-native-async-storage/async-storage";
import { IMAGE_BASE } from "./client";

const REVERB_KEY = process.env.EXPO_PUBLIC_REVERB_KEY || "sonix-reverb";
const WS_HOST = process.env.EXPO_PUBLIC_WS_HOST || "sonix-api.runsite.app";
const WS_PORT = process.env.EXPO_PUBLIC_WS_PORT || 443;
const FORCE_TLS = true;

const MAX_RECONNECT_ATTEMPTS = 8;
const BASE_DELAY = 1000;
const MAX_DELAY = 30000;

const STATUS = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  DISCONNECTED: "disconnected",
  ERROR: "error",
};

function computeDelay(attempt) {
  return Math.min(MAX_DELAY, BASE_DELAY * 2 ** (attempt - 1));
}

class RealtimeManager {
  constructor() {
    this.echo = null;
    this.token = null;
    this.status = STATUS.DISCONNECTED;
    this.subscribers = new Set();
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.manualDisconnect = false;
    this.netInfoUnsub = null;
    this.appStateUnsub = null;
    this.subscriptions = new Map();
    this.initialized = false;
  }

  _setStatus(status) {
    if (this.status === status) return;
    this.status = status;
    this.subscribers.forEach((cb) => {
      try {
        cb(status);
      } catch (e) {
        // Ignore listener errors to avoid breaking the state machine.
      }
    });
  }

  _bindConnection() {
    try {
      const connector = this.echo?.connector?.pusher;
      if (!connector || !connector.connection) return;
      const conn = connector.connection;
      const events = ["connecting", "connected", "unavailable", "failed", "disconnected", "error"];
      events.forEach((evt) => {
        conn.bind(evt, () => this._handleConnectionEvent(evt));
      });
    } catch (e) {
      // Non-fatal; status will be reported through init failure paths.
    }
  }

  _handleConnectionEvent(evt) {
    switch (evt) {
      case "connecting":
        this._setStatus(STATUS.CONNECTING);
        break;
      case "connected":
        this.reconnectAttempts = 0;
        this._setStatus(STATUS.CONNECTED);
        break;
      case "unavailable":
        this._setStatus(STATUS.RECONNECTING);
        this._scheduleReconnect();
        break;
      case "failed":
        this._setStatus(STATUS.ERROR);
        this._scheduleReconnect();
        break;
      case "disconnected":
        if (this.manualDisconnect) {
          this._setStatus(STATUS.DISCONNECTED);
        } else {
          this._setStatus(STATUS.RECONNECTING);
          this._scheduleReconnect();
        }
        break;
      case "error":
        this._setStatus(STATUS.ERROR);
        this._scheduleReconnect();
        break;
      default:
        break;
    }
  }

  async init() {
    if (this.echo) return this.echo;
    if (this.initialized) return this.echo;
    this.initialized = true;
    this.manualDisconnect = false;

    try {
      this.token = await AsyncStorage.getItem("token");
      if (!this.token) {
        this._setStatus(STATUS.DISCONNECTED);
        return null;
      }

      this._setStatus(STATUS.CONNECTING);

      const Echo = (await import("laravel-echo")).default;
      const Pusher = (await import("pusher-js")).default;

      this.echo = new Echo({
        broadcaster: "pusher",
        client: Pusher,
        key: REVERB_KEY,
        wsHost: WS_HOST,
        wsPort: WS_PORT,
        wssPort: WS_PORT,
        forceTLS: FORCE_TLS,
        disableStats: true,
        enabledTransports: ["ws", "wss"],
        authEndpoint: `${IMAGE_BASE}/api/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/json",
          },
        },
      });

      this._bindConnection();
      this._bindSystemListeners();
      return this.echo;
    } catch (e) {
      this.echo = null;
      this._setStatus(STATUS.ERROR);
      return null;
    } finally {
      // init is complete (success or failure); allow future re-inits only via disconnect.
      if (!this.echo) this.initialized = false;
    }
  }

  _bindSystemListeners() {
    if (this.netInfoUnsub && this.appStateUnsub) return;
    try {
      const NetInfo = require("@react-native-community/netinfo").default;
      this.netInfoUnsub = NetInfo.addEventListener((state) => {
        if (state.isConnected && this.status !== STATUS.CONNECTED) {
          this.reconnect();
        }
      });
    } catch (e) {
      // NetInfo optional; skip if unavailable.
    }
    try {
      const { AppState } = require("react-native");
      this.appStateUnsub = AppState.addEventListener("change", (nextState) => {
        if (nextState === "active" && this.status !== STATUS.CONNECTED) {
          this.reconnect();
        }
      });
    } catch (e) {
      // AppState optional; skip if unavailable.
    }
  }

  _scheduleReconnect() {
    if (this.manualDisconnect) return;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
    if (this.reconnectTimer) return;

    this.reconnectAttempts += 1;
    const delay = computeDelay(this.reconnectAttempts);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnect();
    }, delay);
  }

  onStatus(cb) {
    if (typeof cb !== "function") return () => {};
    this.subscribers.add(cb);
    // Notify immediately with current status.
    try {
      cb(this.status);
    } catch (e) {
      // Ignore.
    }
    return () => {
      this.subscribers.delete(cb);
    };
  }

  subscribePresence(channelName, userId, callbacks = {}) {
    if (!this.echo) return null;
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName);
    }
    try {
      const channel = this.echo.join(channelName);
      this.subscriptions.set(channelName, channel);
      if (callbacks.onHere) channel.here((users) => callbacks.onHere(users));
      if (callbacks.onJoining) channel.joining((user) => callbacks.onJoining(user));
      if (callbacks.onLeaving) channel.leaving((user) => callbacks.onLeaving(user));
      return channel;
    } catch (e) {
      return null;
    }
  }

  listen(channelName, event, cb) {
    if (!this.echo) return null;
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName);
    }
    try {
      const channel = this.echo.private(channelName);
      channel.listen(event, cb);
      this.subscriptions.set(channelName, channel);
      return channel;
    } catch (e) {
      return null;
    }
  }

  leave(channelName) {
    if (!this.echo) return;
    try {
      this.echo.leave(channelName);
      if (typeof this.echo.leaveChannel === "function") {
        this.echo.leaveChannel(channelName);
      }
    } catch (e) {
      // Ignore.
    }
    this.subscriptions.delete(channelName);
  }

  getEcho() {
    return this.echo || null;
  }

  disconnect() {
    this.manualDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
    if (this.netInfoUnsub) {
      this.netInfoUnsub();
      this.netInfoUnsub = null;
    }
    if (this.appStateUnsub) {
      this.appStateUnsub();
      this.appStateUnsub = null;
    }
    if (this.echo) {
      try {
        Array.from(this.subscriptions.keys()).forEach((ch) => {
          try {
            this.echo.leave(ch);
          } catch (e) {
            // Ignore.
          }
        });
        this.echo.disconnect();
      } catch (e) {
        // Ignore.
      }
    }
    this.subscriptions.clear();
    this.echo = null;
    this.initialized = false;
    this._setStatus(STATUS.DISCONNECTED);
  }

  reconnect() {
    if (this.manualDisconnect) return;
    this.manualDisconnect = false;
    this.reconnectAttempts = 0;
    this.disconnect();
    this.init();
  }
}

const realtime = new RealtimeManager();
export default realtime;
export { realtime, STATUS };

// Compatibility with the old websocket.js API.
export const getEcho = () => realtime.getEcho();
export const disconnectEcho = () => realtime.disconnect();
