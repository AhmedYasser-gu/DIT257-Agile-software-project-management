"use client";

import { useQuery } from "convex/react";
import { api } from "@/convexApi";
import Link from "next/link";

export default function ReviewsPage() {
  const donors = useQuery(api.functions.reviews.listDonorsWithReviews);

  if (donors === undefined) return <p className="p-6">Loading businesses...</p>;
  if (donors.length === 0)
    return <p className="p-6">No businesses available.</p>;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Business Reviews</h1>
      <ul className="space-y-6">
        {donors.map((donor: (typeof donors)[number]) => (
          <li
            key={donor._id}
            className="p-5 border rounded-lg shadow-sm hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col max-w-full overflow-hidden">
                <h2 className="text-xl font-semibold truncate">
                  {donor.business_name}
                </h2>
                <p
                  className="text-gray-600 dark:text-gray-300 truncate max-w-full overflow-hidden text-ellipsis"
                  title={donor.address}
                >
                  {donor.address}
                </p>
              </div>
              <div className="text-right">
                {donor.avgRating !== null ? (
                  <>
                    <p className="font-bold text-lg">
                      ⭐ {donor.avgRating.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      ({donor.reviewCount} review
                      {donor.reviewCount !== 1 && "s"})
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-300">No reviews yet</p>
                )}
              </div>
            </div>

            {/* Show last 2 reviews preview */}
            {donor.reviews
              .slice(0, 2)
              .map((review: (typeof donor.reviews)[number]) => (
                <div
                  key={review._id}
                  className="mt-3 p-3 border rounded bg-gray-50"
                >
                  <p className="font-medium">⭐ {review.rating}</p>
                  <p>{review.comment}</p>
                  {review.response && (
                    <div className="mt-2 p-2 border-l-4 border-blue-500 bg-white">
                      <p className="text-sm font-semibold">
                        {donor.business_name} replied:
                      </p>
                      <p>{review.response.response}</p>
                    </div>
                  )}
                </div>
              ))}

            <Link
              href={`/reviews/${donor._id}`}
              className="inline-block mt-4 text-blue-600 hover:underline"
            >
              View All Reviews →
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
