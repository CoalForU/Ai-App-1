import { randomUUID } from "crypto";
import {
  findListingById,
  listListings,
  upsertListing,
} from "./db";
import type { Listing } from "./types";

export async function createListing(input: {
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  photoDataUrl: string;
  price: number;
}) {
  const listing: Listing = {
    id: randomUUID(),
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    condition: input.condition.trim(),
    photoDataUrl: input.photoDataUrl,
    price: input.price,
    status: "active",
    createdAt: new Date().toISOString(),
    soldAt: null,
    buyerId: null,
    buyerName: null,
  };
  await upsertListing(listing);
  return listing;
}

export async function getActiveListings() {
  const listings = await listListings();
  return listings
    .filter((l) => l.status === "active")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getListingDetail(id: string) {
  return findListingById(id);
}

export async function buyListing(input: {
  listingId: string;
  buyerId: string;
  buyerName: string;
}) {
  const listing = await findListingById(input.listingId);
  if (!listing) throw new Error("Listing not found.");
  if (listing.status !== "active") throw new Error("This listing is no longer available.");
  if (listing.sellerId === input.buyerId) {
    throw new Error("You can't buy your own listing.");
  }

  listing.status = "sold";
  listing.soldAt = new Date().toISOString();
  listing.buyerId = input.buyerId;
  listing.buyerName = input.buyerName;
  await upsertListing(listing);
  return listing;
}

export async function endListing(input: {
  listingId: string;
  sellerId: string;
}) {
  const listing = await findListingById(input.listingId);
  if (!listing) throw new Error("Listing not found.");
  if (listing.sellerId !== input.sellerId) {
    throw new Error("Only the seller can end this listing.");
  }
  if (listing.status !== "active") {
    throw new Error("This listing is already closed.");
  }
  listing.status = "ended";
  await upsertListing(listing);
  return listing;
}

export async function listSellerListings(sellerId: string) {
  const listings = await listListings();
  return listings.filter((l) => l.sellerId === sellerId);
}
