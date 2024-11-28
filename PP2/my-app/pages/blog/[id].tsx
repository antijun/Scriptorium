import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  tags?: { tag: string }[];
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
}

const BlogDetail = () => {
  const router = useRouter();
  const { id } = router.query; // Fetch dynamic route parameter
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchBlog = async () => {
      try {
        const response = await axios.get(`/api/visitors/fetchFromLink?id=${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        setBlog(response.data);
      } catch (err: any) {
        console.error("Error fetching blog post:", err);
        setError(err.response?.data?.error || "Failed to fetch the blog post.");
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/visitors/commentsSorted?id=${id}`
        );
        setComments(response.data);
      } catch (err: any) {
        console.error("Error fetching comments:", err);
        setCommentError("Failed to fetch comments.");
      } finally {
        setLoadingComments(false);
      }
    };

    fetchBlog();
    fetchComments();
  }, [id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
  
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setCommentError("You must be logged in to add comments.");
      return;
    }
  
    try {
      await axios.post(`/api/posts/${id}/comments`, { content: newComment }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setComments((prev) => [
        ...prev,
        { id: `${Date.now()}`, content: newComment, createdAt: new Date().toISOString() },
      ]);
      setNewComment("");
    } catch (err: any) {
      console.error("Error adding comment:", err);
      setCommentError("Failed to add comment.");
    }
  };
  

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline ml-2">{error}</span>
        <span
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
          onClick={() => setError(null)}
        >
          <svg
            className="fill-current h-6 w-6 text-red-500"
            role="button"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <title>Close</title>
            <path d="M14.348 14.849a1 1 0 01-1.414 0L10 11.914l-2.934 2.935a1 1 0 01-1.414-1.414l2.935-2.934-2.935-2.934a1 1 0 011.414-1.414L10 8.086l2.934-2.935a1 1 0 011.414 1.414l-2.935 2.934 2.935 2.934a1 1 0 010 1.414z" />
          </svg>
        </span>
      </div>
    );

  if (!blog)
    return <p className="text-center text-gray-500 mt-4">Blog post not found.</p>;

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white shadow-md rounded-md p-6">
        <h1 className="text-4xl font-bold mb-6 text-blue-600">{blog.title}</h1>
        <p className="text-gray-700 mb-8 leading-relaxed">{blog.content}</p>
        {blog.tags && blog.tags.length > 0 && (
          <div className="mb-6">
            <strong className="text-gray-600">Tags:</strong>
            <div className="flex flex-wrap mt-2">
              {blog.tags.map((tag) => (
                <span
                  key={tag.tag}
                  className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm mr-2 mb-2"
                >
                  {tag.tag}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-gray-500">
              <strong>Upvotes:</strong> {blog.upvotes} | <strong>Downvotes:</strong>{" "}
              {blog.downvotes}
            </p>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-gray-100 shadow-md rounded-md p-6 mt-6">
        <h2 className="text-2xl font-bold mb-4">Comments</h2>

        {loadingComments ? (
          <p>Loading comments...</p>
        ) : commentError ? (
          <p className="text-red-500">{commentError}</p>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="mb-4">
              <p className="text-gray-700">{comment.content}</p>
              <p className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        )}

        <div className="mt-6">
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={3}
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          ></textarea>
          <button
            onClick={handleAddComment}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Post Comment
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;