"use client";

const CHANNEL_NAME = "auction_sync_channel";

export const channel = new BroadcastChannel(CHANNEL_NAME);

export const send = (data: any) => {
  channel.postMessage(data);
};
