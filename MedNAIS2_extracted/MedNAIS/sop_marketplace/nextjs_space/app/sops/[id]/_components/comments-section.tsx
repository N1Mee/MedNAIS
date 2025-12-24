
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface CommentsSectionProps {
  sopId: string;
}

export function CommentsSection({ sopId }: CommentsSectionProps) {
  const { data: session } = useSession() || {};
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchComments();
  }, [sopId, page]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/comments?sopId=${sopId}&page=${page}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!session?.user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (newComment.trim().length === 0) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sopId,
          content: newComment,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to post comment");
      }

      toast.success("Comment posted successfully!");
      setNewComment("");
      setPage(1);
      await fetchComments();
    } catch (error: any) {
      console.error("Error posting comment:", error);
      toast.error(error.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete comment");
      }

      toast.success("Comment deleted successfully!");
      await fetchComments();
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast.error(error.message || "Failed to delete comment");
    }
  };

  if (loading && page === 1) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6 text-[#E63946]" />
        Comments ({comments.length})
      </h2>

      {/* Comment Form */}
      {session?.user && (
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            maxLength={1000}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-800 mb-2"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {newComment.length}/1000 characters
            </p>
            <button
              onClick={handleSubmitComment}
              disabled={submitting || newComment.trim().length === 0}
              className="px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                  {comment.user.image ? (
                    <Image
                      src={comment.user.image}
                      alt={comment.user.name || "User"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold">
                      {comment.user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {comment.user.name || "Anonymous"}
                      </p>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {session?.user?.id === comment.userId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
