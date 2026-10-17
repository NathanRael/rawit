import type { Href } from "expo-router";

// Expo's generated route types currently retain the literal `index` segment,
// while the actual index routes resolve at their parent paths.
export const wifiNetworksHref = "/wifi" as Href;
export const subscribersHref = "/subscribers" as Href;
export const subscriptionsHref = "/subscriptions" as Href;

export function wifiNetworkDetailsHref(id: string): Href {
  return `/wifi/${encodeURIComponent(id)}` as Href;
}

export function subscriberDetailsHref(id: string): Href {
  return `/subscribers/${encodeURIComponent(id)}` as Href;
}

export function subscriptionDetailsHref(id: string): Href {
  return `/subscriptions/${encodeURIComponent(id)}` as Href;
}

export const settingsHref = "/settings" as Href;
