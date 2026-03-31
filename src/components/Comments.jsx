import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageCircle, Send, Edit2, Trash2 } from 'lucide-react';
import { addComment, editComment, deleteComment } from '../features/collaboration/collaborationSlice';
import './Comments.css';

const Comments = ({ documentId }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const comments = useSelector(state => state.collaboration.comments[documentId] || []);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      documentId,
      userId: user?.id || 1,
      userName: `${user?.firstName || 'User'} ${user?.lastName || ''}`,
      userRole: user?.role || 'Professional',
      text: newComment,
      timestamp: new Date().toISOString(),
      edited: false,
    };

    dispatch(addComment({ documentId, comment }));
    setNewComment('');
  };

  const handleEditComment = (commentId) => {
    if (!editText.trim()) return;

    dispatch(editComment({ documentId, commentId, text: editText }));
    setEditingId(null);
    setEditText('');
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      dispatch(deleteComment({ documentId, commentId }));
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  return (
    <div className="comments-section">
      <div className="comments-header">
        <MessageCircle size={20} />
        <h3>Comments ({comments.length})</h3>
      </div>

      <div className="add-comment">
        <textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows="3"
        />
        <button className="btn-primary" onClick={handleAddComment} disabled={!newComment.trim()}>
          <Send size={16} />
          Post Comment
        </button>
      </div>

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">
                {comment.userName.charAt(0).toUpperCase()}
              </div>
              <div className="comment-content">
                <div className="comment-header">
                  <div>
                    <span className="comment-author">{comment.userName}</span>
                    <span className="comment-role">{comment.userRole}</span>
                  </div>
                  <div className="comment-actions">
                    {comment.userId === user?.id && (
                      <>
                        <button
                          className="icon-btn"
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditText(comment.text);
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editingId === comment.id ? (
                  <div className="edit-comment">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows="3"
                    />
                    <div className="edit-actions">
                      <button className="btn-secondary" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                      <button className="btn-primary" onClick={() => handleEditComment(comment.id)}>
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="comment-text">{comment.text}</p>
                    <span className="comment-time">
                      {getTimeAgo(comment.timestamp)}
                      {comment.edited && ' (edited)'}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
