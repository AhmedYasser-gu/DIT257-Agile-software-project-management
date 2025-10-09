"use client";

import { useParams } from "next/navigation";
import type { Id } from "../../../../../backend/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convexApi";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useToast } from "@/components/Toast/ToastContext";

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DonorReviewsPage() {
  const { donorId } = useParams<{ donorId: string }>();
  const { user, isLoaded } = useUser();
  const toast = useToast();

  const data = useQuery(api.functions.reviews.listReviewsForDonor, {
    donorId: donorId as unknown as Id<"donors">,
  });

  const receiver = useQuery(
    api.functions.reviews.getReceiverByUser,
    isLoaded && user ? { userId: user.id } : "skip"
  );

  const isOwner = useQuery(
    api.functions.reviews.isDonorOwner,
    isLoaded && user ? { userId: user.id, donorId: donorId as unknown as Id<"donors"> } : "skip"
  );

  const addReview = useMutation(api.functions.reviews.addReview);
  const updateReview = useMutation(api.functions.reviews.updateReview);
  const deleteReview = useMutation(api.functions.reviews.deleteReview);
  const addOrUpdateResponse = useMutation(api.functions.reviews.addOrUpdateResponse);
  const deleteResponse = useMutation(api.functions.reviews.deleteResponse);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editingResponse, setEditingResponse] = useState<string | null>(null);

  if (data === undefined) return <p className="p-6">Loading business...</p>;
  if (!data) return <p className="p-6">Business not found</p>;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiver) return toast.error("You must be a receiver to post a review");

    try {
      await addReview({
        donor_id: donorId as unknown as Id<"donors">,
        reciever_id: receiver._id,
        rating,
        comment,
      });
      toast.success("Review posted!");
      setComment("");
      setRating(5);
    } catch (err) {
      toast.error("Failed to post review");
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      {/* Business Info */}
      <h1 className="text-3xl font-bold mb-2">{data.donor.business_name}</h1>
      <p className="text-gray-600 mb-6">{data.donor.address}</p>

      {/* Post review if user has not already reviewed */}
      {receiver &&
        !data.reviews.some((r) => r.reciever_id === receiver._id) && (
          <form onSubmit={handleSubmitReview} className="mb-6 space-y-2 p-4 border rounded shadow-sm">
            <h2 className="text-xl font-semibold">Leave a Review</h2>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="border p-2 rounded"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {"⭐".repeat(n)} ({n})
                </option>
              ))}
            </select>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your review..."
              className="w-full border p-2 rounded text-sm"
              rows={3}
            />
            <button
              type="submit"
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Post Review
            </button>
          </form>
        )}

      {/* Reviews List */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Reviews</h2>
        {data.reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          <ul className="space-y-4">
            {data.reviews.map((r) => {
              const isOwnerOfReview = receiver && r.reciever_id === receiver._id;

              return (
                <li key={r._id} className="p-4 border rounded bg-gray-50 space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="font-medium">{r.name}</span>
                    <span>{formatDate(r._creationTime)}</span>
                  </div>

                  {/* Review content / edit mode */}
                  {editingReview !== r._id ? (
                    <>
                      <p className="font-medium">{ "⭐".repeat(r.rating) } ({r.rating})</p>
                      <p>{r.comment}</p>
                      {isOwnerOfReview && (
                        <div className="flex gap-2 mt-2">
                          <button
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            onClick={() => setEditingReview(r._id)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                            onClick={async () => {
                              await deleteReview({ reviewId: r._id });
                              toast.success("Review deleted");
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const newRating = Number(
                          (form.elements.namedItem("rating") as HTMLSelectElement).value
                        );
                        const newComment = (
                          form.elements.namedItem("comment") as HTMLTextAreaElement
                        ).value;
                        try {
                          await updateReview({ reviewId: r._id, rating: newRating, comment: newComment });
                          toast.success("Review updated!");
                          setEditingReview(null);
                        } catch {
                          toast.error("Failed to update review");
                        }
                      }}
                      className="space-y-2"
                    >
                      <select
                        name="rating"
                        defaultValue={r.rating}
                        className="border p-2 rounded"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {"⭐".repeat(n)} ({n})
                          </option>
                        ))}
                      </select>
                      <textarea
                        name="comment"
                        defaultValue={r.comment}
                        className="w-full border p-2 rounded text-sm"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingReview(null)}
                          className="px-3 py-1 bg-gray-300 rounded text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Donor response section */}
                  {isOwner && (
                    <div className="mt-2 p-3 border-l-4 border-blue-500 bg-white rounded">
                      {r.response && editingResponse !== r._id ? (
                        <>
                          <p className="text-sm font-semibold">{data.donor.business_name} replied:</p>
                          <p className="mt-1">{r.response.response}</p>
                          <div className="flex gap-2 mt-2">
                            <button
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                              onClick={() => setEditingResponse(r._id)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                              onClick={async () => {
                                if (r.response?._id) {
                                  await deleteResponse({ responseId: r.response._id });
                                  toast.success("Response deleted");
                                }
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      ) : (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            const responseText = (form.elements.namedItem("response") as HTMLTextAreaElement).value;
                            try {
                              await addOrUpdateResponse({
                                reviewId: r._id,
                                donorId: donorId as unknown as Id<"donors">,
                                response: responseText,
                              });
                              toast.success(r.response ? "Response updated!" : "Response posted!");
                              setEditingResponse(null);
                            } catch {
                              toast.error("Failed to post response");
                            }
                          }}
                        >
                          <textarea
                            name="response"
                            defaultValue={r.response?.response ?? ""}
                            placeholder="Write your response..."
                            className="w-full border p-2 rounded text-sm"
                            rows={2}
                          />
                          <div className="mt-2 flex gap-2">
                            <button
                              type="submit"
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              {r.response ? "Save" : "Post Response"}
                            </button>
                            {r.response && (
                              <button
                                type="button"
                                onClick={() => setEditingResponse(null)}
                                className="px-3 py-1 bg-gray-300 rounded text-sm hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {!isOwner && r.response && (
                    <div className="mt-2 p-3 border-l-4 border-blue-500 bg-white rounded">
                      <p className="text-sm font-semibold">{data.donor.business_name} replied:</p>
                      <p className="mt-1">{r.response.response}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
