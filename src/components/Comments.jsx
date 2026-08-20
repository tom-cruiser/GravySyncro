import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { MessageCircle, Send, Edit2, Trash2, CornerDownRight, X, Eye } from 'lucide-react';
import api from '../config/api';
import { logout } from '../features/auth/authSlice';
import './Comments.css';

const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now - time) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

const ThreadNode = ({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  replyTargetId,
  setReplyTargetId,
  replyText,
  setReplyText,
  editingId,
  setEditingId,
  editText,
  setEditText,
}) => {
  const isAuthor = comment.author?._id?.toString() === currentUserId?.toString();

  return (
    <div className="comment-thread-node">
      <div className="comment-item">
        <div className="comment-avatar">
          {comment.author?.firstName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="comment-content">
          <div className="comment-header">
            <div>
              <span className="comment-author">
                {comment.author?.firstName} {comment.author?.lastName}
              </span>
              <span className="comment-role">{comment.author?.role || 'Member'}</span>
            </div>
            <div className="comment-actions">
              <button
                type="button"
                className="icon-btn"
                onClick={() => {
                  setReplyTargetId(comment._id);
                  setReplyText('');
                }}
                title="Reply"
              >
                <CornerDownRight size={14} />
              </button>
              {isAuthor && (
                <>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => {
                      setEditingId(comment._id);
                      setEditText(comment.text);
                    }}
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onDelete(comment._id)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {editingId === comment._id ? (
            <div className="edit-comment">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows="3"
              />
              <div className="edit-actions">
                <button className="btn-secondary" type="button" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
                <button className="btn-primary" type="button" onClick={() => onEdit(comment._id)}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="comment-text">{comment.text}</p>
              <span className="comment-time">
                {formatTimeAgo(comment.createdAt)}
                {comment.edited && ' (edited)'}
              </span>
            </>
          )}
        </div>
      </div>

      {replyTargetId === comment._id && (
        <div className="reply-box">
          <textarea
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows="2"
          />
          <div className="reply-actions">
            <button className="btn-secondary" type="button" onClick={() => setReplyTargetId(null)}>
              Cancel
            </button>
            <button className="btn-primary" type="button" onClick={() => onReply(comment._id)} disabled={!replyText.trim()}>
              Reply
            </button>
          </div>
        </div>
      )}

      {Array.isArray(comment.replies) && comment.replies.length > 0 && (
        <div className="comment-thread-replies">
          {comment.replies.map((reply) => (
            <ThreadNode
              key={reply._id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              replyTargetId={replyTargetId}
              setReplyTargetId={setReplyTargetId}
              replyText={replyText}
              setReplyText={setReplyText}
              editingId={editingId}
              setEditingId={setEditingId}
              editText={editText}
              setEditText={setEditText}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Comments = ({
  documentId,
  resourceId,
  resourceType = 'document',
  onClose,
  canPreview = false,
  onOpenPreview,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTargetId, setReplyTargetId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const targetId = resourceId || documentId;
  const isVideo = resourceType === 'video';
  const isAudio = resourceType === 'audio';

  const loadComments = useCallback(async () => {
    if (!targetId || !token) return;

    setLoading(true);
    try {
      const url = isAudio
        ? api.endpoints.comments.listAudio(targetId)
        : isVideo
          ? api.endpoints.comments.listVideo(targetId)
          : api.endpoints.comments.list(targetId);
      const response = await axios.get(url, authHeaders);
      setComments(response.data?.data?.comments || []);
    } catch (error) {
      if (error?.response?.status === 401) {
        dispatch(logout());
        navigate('/login');
      }
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [targetId, token, isVideo, isAudio, authHeaders, dispatch, navigate]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (!targetId || !token) return undefined;

    const socketBaseUrl = (api.API_URL || '').replace(/\/api(?:\/v\d+)?\/?$/i, '');
    const socket = io(socketBaseUrl || window.location.origin, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('authenticate', { token });
    });

    const handleCommentChanged = ({ resourceType: eventType, resourceId }) => {
      const sameType = eventType === resourceType;
      const sameResource = String(resourceId) === String(targetId);

      if (sameType && sameResource) {
        loadComments();
      }
    };

    socket.on('comment:changed', handleCommentChanged);

    return () => {
      socket.off('comment:changed', handleCommentChanged);
      socket.disconnect();
    };
  }, [targetId, token, resourceType, loadComments]);

  const postComment = async ({ text, parentId = null }) => {
    if (!text.trim() || !targetId) return;

    try {
      const url = isAudio
        ? api.endpoints.comments.createAudio(targetId)
        : isVideo
          ? api.endpoints.comments.createVideo(targetId)
          : api.endpoints.comments.create(targetId);
      await axios.post(
        url,
        parentId ? { text, parentId } : { text },
        authHeaders,
      );
      setNewComment('');
      setReplyText('');
      setReplyTargetId(null);
      await loadComments();
    } catch (error) {
      if (error?.response?.status === 401) {
        dispatch(logout());
        navigate('/login');
      }
    }
  };

  const handleAddComment = async () => {
    await postComment({ text: newComment });
  };

  const handleReply = async (parentId) => {
    await postComment({ text: replyText, parentId });
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;

    try {
      await axios.patch(
        api.endpoints.comments.update(commentId),
        { content: editText },
        authHeaders,
      );
      setEditingId(null);
      setEditText('');
      await loadComments();
    } catch (error) {
      if (error?.response?.status === 401) {
        dispatch(logout());
        navigate('/login');
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await axios.delete(api.endpoints.comments.delete(commentId), authHeaders);
      await loadComments();
    } catch (error) {
      if (error?.response?.status === 401) {
        dispatch(logout());
        navigate('/login');
      }
    }
  };

  const totalComments = useMemo(() => {
    const countNodes = (nodes = []) => nodes.reduce((count, node) => count + 1 + countNodes(node.replies || []), 0);
    return countNodes(comments);
  }, [comments]);

  return (
    <div className="comments-section comments-sidebar">
      <div className="comments-header">
        <MessageCircle size={20} />
        <h3>Conversation ({totalComments})</h3>
        {canPreview && onOpenPreview && (
          <button className="btn-secondary comments-preview-btn" type="button" onClick={onOpenPreview}>
            <Eye size={15} />
            Preview
          </button>
        )}
        {onClose && (
          <button className="close-btn" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        )}
      </div>

      <div className="add-comment">
        <textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows="3"
        />
        <button className="btn-primary" type="button" onClick={handleAddComment} disabled={!newComment.trim()}>
          <Send size={16} />
          Post Comment
        </button>
      </div>

      <div className="comments-list">
        {loading ? (
          <p className="no-comments">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment.</p>
        ) : (
          comments.map((comment) => (
            <ThreadNode
              key={comment._id}
              comment={comment}
              currentUserId={user?._id || user?.id}
              onReply={handleReply}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              replyTargetId={replyTargetId}
              setReplyTargetId={setReplyTargetId}
              replyText={replyText}
              setReplyText={setReplyText}
              editingId={editingId}
              setEditingId={setEditingId}
              editText={editText}
              setEditText={setEditText}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
