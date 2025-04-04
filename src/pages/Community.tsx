/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Smile, Search, Bell, User, MessageSquare, Users, Save, 
  ArrowLeft, LogOut, Upload, Home, PlusCircle, Heart, Share2, 
  MoreHorizontal, Bookmark, ThumbsUp, MessageCircle, Globe, 
  Hash, AtSign, Link, Image as ImageIcon, Video, FileText 
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../pages/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ref, push, onValue, query, orderByChild, limitToLast, 
  update as rtdbUpdate, serverTimestamp, set as rtdbSet 
} from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, rtdb, storage } from './firebase'; // Import from firebase.ts
import { signOut } from 'firebase/auth';

interface Post {
  id: string;
  author: string;
  authorId: string;
  content: string;
  timestamp: number;
  likes?: string[];
  comments: { [key: string]: Comment };
  shares: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

interface Comment {
  id: string;
  author: string;
  authorId: string;
  content: string;
  timestamp: number;
  likes: string[];
}

interface UserProfile {
  bio: string;
  description: string;
  connections: string[];
  displayName: string;
  lastActive: number;
  isLoggedIn: boolean;
  photoURL?: string;
  status?: string;
}

interface OtherUser {
  uid: string;
  displayName: string;
  bio: string;
  lastActive: number;
  isLoggedIn: boolean;
  photoURL?: string;
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'share';
  postId: string;
  fromUserId: string;
  fromUserName: string;
  timestamp: number;
  read: boolean;
  comment?: string;
}

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `${interval}y`;
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `${interval}mo`;
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval}d`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval}h`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval}m`;
  return `${Math.floor(seconds)}s`;
};

const SocialPlatform = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'feed' | 'messages' | 'notifications' | 'profile' | 'create'>('feed');
  const [profileData, setProfileData] = useState<UserProfile>({
    bio: '',
    description: '',
    connections: [],
    displayName: '',
    lastActive: 0,
    isLoggedIn: false,
    photoURL: '',
    status: '',
  });
  const [otherUsers, setOtherUsers] = useState<OtherUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [postMedia, setPostMedia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const postsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Update user status in both /users and /publicUsers
    const updateUserStatus = async () => {
      const privateUserRef = ref(rtdb, `users/${user.uid}`);
      const publicUserRef = ref(rtdb, `publicUsers/${user.uid}`);
      const timestamp = serverTimestamp();
      const privateData = {
        lastActive: timestamp,
        isLoggedIn: true,
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL || '',
        bio: profileData.bio || '',
        description: profileData.description || '',
        connections: profileData.connections || [],
        status: profileData.status || '',
      };
      const publicData = {
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL || '',
        bio: profileData.bio || '',
        lastActive: timestamp,
        isLoggedIn: true,
      };

      try {
        await rtdbSet(privateUserRef, privateData);
        await rtdbSet(publicUserRef, publicData);
      } catch (err) {
        console.error('Error updating user status:', err);
        setError('Failed to update user status');
      }
    };
    updateUserStatus();

    // Load private user profile from /users
    const privateUserRef = ref(rtdb, `users/${user.uid}`);
    const unsubscribeProfile = onValue(privateUserRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProfileData({
          bio: data.bio || '',
          description: data.description || '',
          connections: data.connections || [],
          displayName: data.displayName || 'Anonymous',
          lastActive: data.lastActive || 0,
          isLoggedIn: data.isLoggedIn || false,
          photoURL: data.photoURL || '',
          status: data.status || '',
        });
      }
    }, (err) => {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    });

    // Load posts
    const postsRef = ref(rtdb, 'posts');
    const postsQuery = query(postsRef, orderByChild('timestamp'), limitToLast(50));
    const unsubscribePosts = onValue(postsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const fetchedPosts: Post[] = Object.entries(data).map(([id, post]: [string, any]) => ({
          id,
          author: post.author || 'Unknown',
          authorId: post.authorId || '',
          content: post.content || '',
          timestamp: post.timestamp || 0,
          likes: Array.isArray(post.likes) ? post.likes : [], // Ensure likes is always an array
          comments: post.comments || {},
          shares: post.shares || 0,
          mediaUrl: post.mediaUrl || '',
          mediaType: post.mediaType || undefined,
        }));
        setPosts(fetchedPosts.reverse());
      } else {
        setPosts([]);
      }
    }, (err) => {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    });

    // Load other users from /publicUsers
    const publicUsersRef = ref(rtdb, 'publicUsers');
    const unsubscribePublicUsers = onValue(publicUsersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList: OtherUser[] = Object.entries(data)
          .filter(([uid]) => uid !== user.uid)
          .map(([uid, userData]: [string, any]) => ({
            uid,
            displayName: userData.displayName || 'Anonymous',
            bio: userData.bio || 'No bio available',
            lastActive: userData.lastActive || 0,
            isLoggedIn: userData.isLoggedIn || false,
            photoURL: userData.photoURL || '',
          }));
        setOtherUsers(usersList);
      } else {
        setOtherUsers([]);
      }
    }, (err) => {
      console.error('Error fetching public users:', err);
      setError('Failed to load users');
    });

    // Load notifications
    const notificationsRef = ref(rtdb, `notifications/${user.uid}`);
    const unsubscribeNotifications = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationList: Notification[] = Object.entries(data).map(([id, notif]: [string, any]) => ({
          id,
          type: notif.type || 'unknown',
          postId: notif.postId || '',
          fromUserId: notif.fromUserId || '',
          fromUserName: notif.fromUserName || 'Unknown',
          timestamp: notif.timestamp || 0,
          read: notif.read || false,
          comment: notif.comment || undefined,
        }));
        setNotifications(notificationList);
      } else {
        setNotifications([]);
      }
    }, (err) => {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    });

    // Cleanup on unmount
    return () => {
      unsubscribeProfile();
      unsubscribePosts();
      unsubscribePublicUsers();
      unsubscribeNotifications();
      if (user) {
        const cleanupPrivateRef = ref(rtdb, `users/${user.uid}`);
        const cleanupPublicRef = ref(rtdb, `publicUsers/${user.uid}`);
        Promise.all([
          rtdbUpdate(cleanupPrivateRef, { isLoggedIn: false, lastActive: serverTimestamp() }),
          rtdbUpdate(cleanupPublicRef, { isLoggedIn: false, lastActive: serverTimestamp() }),
        ]).catch((err) => console.error('Error on cleanup:', err));
      }
    };
  }, [user]);

  const uploadMedia = async (file: File): Promise<string> => {
    const fileRef = storageRef(storage, `posts/${user?.uid}/${Date.now()}_${file.name}`);
    try {
      const snapshot = await uploadBytes(fileRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (err) {
      console.error('Error uploading media:', err);
      throw new Error('Failed to upload media');
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !postMedia) {
      setError('Post content or media is required');
      return;
    }
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      let mediaUrl = '';
      let mediaType: 'image' | 'video' | undefined = undefined;

      if (postMedia) {
        mediaUrl = await uploadMedia(postMedia);
        mediaType = postMedia.type.startsWith('image') ? 'image' : postMedia.type.startsWith('video') ? 'video' : undefined;
      }

      const postData = {
        author: profileData.displayName || user.displayName || 'Anonymous',
        authorId: user.uid,
        content: newPostContent.trim(),
        timestamp: serverTimestamp(),
        likes: [],
        comments: {},
        shares: 0,
        ...(mediaUrl && { mediaUrl, mediaType }),
      };

      const postsRef = ref(rtdb, 'posts');
      const newPostRef = push(postsRef);
      await rtdbSet(newPostRef, postData);

      setNewPostContent('');
      setPostMedia(null);
      setPreviewUrl(null);
      setError(null);
      setCurrentTab('feed');
    } catch (err) {
      console.error('Error creating post:', err);
      setError((err as Error).message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;

    try {
      const postRef = ref(rtdb, `posts/${postId}`);
      const snapshot = await new Promise<any>((resolve) => {
        onValue(postRef, (snap) => resolve(snap.val()), { onlyOnce: true });
      });

      if (snapshot) {
        const post = snapshot;
        const currentLikes = Array.isArray(post.likes) ? post.likes : [];
        const updatedLikes = currentLikes.includes(user.uid)
          ? currentLikes.filter((id: string) => id !== user.uid)
          : [...currentLikes, user.uid];

        await rtdbUpdate(postRef, { likes: updatedLikes });

        if (post.authorId !== user.uid && !currentLikes.includes(user.uid)) {
          const notificationRef = push(ref(rtdb, `notifications/${post.authorId}`));
          await rtdbSet(notificationRef, {
            type: 'like',
            postId,
            fromUserId: user.uid,
            fromUserName: profileData.displayName || user.displayName || 'Anonymous',
            timestamp: serverTimestamp(),
            read: false,
          });
        }
      }
    } catch (err) {
      console.error('Error liking post:', err);
      setError((err as Error).message || 'Failed to like post');
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim() || !user || !selectedPost) return;

    try {
      const commentData = {
        author: profileData.displayName || user.displayName || 'Anonymous',
        authorId: user.uid,
        content: newComment.trim(),
        timestamp: serverTimestamp(),
        likes: [],
      };

      const commentsRef = ref(rtdb, `posts/${postId}/comments`);
      const newCommentRef = push(commentsRef);
      await rtdbSet(newCommentRef, commentData);

      if (selectedPost.authorId !== user.uid) {
        const notificationRef = push(ref(rtdb, `notifications/${selectedPost.authorId}`));
        await rtdbSet(notificationRef, {
          type: 'comment',
          postId,
          fromUserId: user.uid,
          fromUserName: profileData.displayName || user.displayName || 'Anonymous',
          timestamp: serverTimestamp(),
          read: false,
          comment: newComment.substring(0, 50),
        });
      }

      setNewComment('');
      setError(null);
    } catch (err) {
      console.error('Error adding comment:', err);
      setError((err as Error).message || 'Failed to add comment');
    }
  };

  const handleSharePost = async (postId: string) => {
    if (!user) return;

    try {
      const postRef = ref(rtdb, `posts/${postId}`);
      const snapshot = await new Promise<any>((resolve) => {
        onValue(postRef, (snap) => resolve(snap.val()), { onlyOnce: true });
      });

      if (snapshot) {
        const post = snapshot;
        await rtdbUpdate(postRef, { shares: (post.shares || 0) + 1 });

        if (post.authorId !== user.uid) {
          const notificationRef = push(ref(rtdb, `notifications/${post.authorId}`));
          await rtdbSet(notificationRef, {
            type: 'share',
            postId,
            fromUserId: user.uid,
            fromUserName: profileData.displayName || user.displayName || 'Anonymous',
            timestamp: serverTimestamp(),
            read: false,
          });
        }
      }
    } catch (err) {
      console.error('Error sharing post:', err);
      setError((err as Error).message || 'Failed to share post');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPostMedia(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveMedia = () => {
    setPostMedia(null);
    setPreviewUrl(null);
  };

  const handleLogout = async () => {
    try {
      if (user) {
        const privateUserRef = ref(rtdb, `users/${user.uid}`);
        const publicUserRef = ref(rtdb, `publicUsers/${user.uid}`);
        await Promise.all([
          rtdbUpdate(privateUserRef, { isLoggedIn: false, lastActive: serverTimestamp() }),
          rtdbUpdate(publicUserRef, { isLoggedIn: false, lastActive: serverTimestamp() }),
        ]);
      }
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
      setError((err as Error).message || 'Failed to log out');
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await rtdbUpdate(ref(rtdb, `notifications/${user.uid}/${notificationId}`), {
        read: true,
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError((err as Error).message || 'Failed to update notification');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-lg text-gray-900">Please log in to access the platform</p>
        <button 
          onClick={() => navigate('/login')} 
          className="ml-4 p-2 bg-blue-600 text-white rounded-full"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans pt-9">
      {/* Top Header - Desktop */}
      {!isMobile && (
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-blue-600">NueroConnect</h1>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white w-64"
              />
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => setCurrentTab('feed')}
              className={`flex flex-col items-center p-2 ${currentTab === 'feed' ? 'text-blue-600' : 'text-gray-600'}`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs mt-1">Home</span>
            </button>
            <button 
              onClick={() => setCurrentTab('messages')}
              className={`flex flex-col items-center p-2 ${currentTab === 'messages' ? 'text-blue-600' : 'text-gray-600'}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs mt-1">Messages</span>
            </button>
            <button 
              onClick={() => setCurrentTab('notifications')}
              className={`flex flex-col items-center p-2 relative ${currentTab === 'notifications' ? 'text-blue-600' : 'text-gray-600'}`}
            >
              <Bell className="w-5 h-5" />
              <span className="text-xs mt-1">Notifications</span>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setCurrentTab('create')}
              className="hidden md:flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create</span>
            </button>
            <button 
              onClick={() => setCurrentTab('profile')}
              className="flex items-center space-x-2"
            >
              {profileData.photoURL ? (
                <img 
                  src={profileData.photoURL} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover" 
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
              {!isMobile && <span className="text-sm font-medium">{profileData.displayName}</span>}
            </button>
          </div>
        </header>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 border-b">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-600">ConnectPro</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Search className="w-5 h-5 text-gray-600" />
            <button 
              onClick={() => setCurrentTab('notifications')}
              className="relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="max-w-2xl mx-auto p-4">
            <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>
          </div>
        )}

        {currentTab === 'feed' && (
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-start space-x-3">
                {profileData.photoURL ? (
                  <img 
                    src={profileData.photoURL} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <div className="flex-1">
                  <textarea
                    placeholder="What's on your mind?"
                    className="w-full p-2 border-b border-gray-100 focus:outline-none focus:border-blue-500 resize-none"
                    rows={2}
                    onClick={() => setCurrentTab('create')}
                  />
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                      >
                        <ImageIcon className="w-5 h-5 text-green-500" />
                      </button>
                      <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <Video className="w-5 h-5 text-red-500" />
                      </button>
                      <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <FileText className="w-5 h-5 text-yellow-500" />
                      </button>
                    </div>
                    <button 
                      onClick={() => setCurrentTab('create')}
                      className="px-4 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {otherUsers.find(u => u.uid === post.authorId)?.photoURL ? (
                      <img 
                        src={otherUsers.find(u => u.uid === post.authorId)?.photoURL} 
                        alt="Author" 
                        className="w-10 h-10 rounded-full object-cover" 
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{post.author}</p>
                      <p className="text-xs text-gray-500">{getTimeAgo(post.timestamp)}</p>
                    </div>
                  </div>
                  <button className="text-gray-500 hover:bg-gray-100 p-2 rounded-full">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-4 pb-2">
                  <p className="text-gray-800">{post.content}</p>
                </div>

                {post.mediaUrl && (
                  <div className="w-full">
                    {post.mediaType === 'image' ? (
                      <img 
                        src={post.mediaUrl} 
                        alt="Post media" 
                        className="w-full max-h-96 object-cover" 
                      />
                    ) : (
                      <video 
                        src={post.mediaUrl} 
                        controls 
                        className="w-full max-h-96"
                      />
                    )}
                  </div>
                )}

                <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      <span>{post.likes?.length || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="w-4 h-4" />
                      <span>{Object.keys(post.comments).length}</span>
                    </div>
                  </div>
                  <div>
                    <span>{post.shares} shares</span>
                  </div>
                </div>

                <div className="px-4 py-2 border-t border-gray-100 grid grid-cols-3">
                  <button 
                    onClick={() => handleLikePost(post.id)}
                    className={`flex items-center justify-center space-x-2 py-2 rounded-lg ${post.likes?.includes(user?.uid || '') ? 'text-blue-600' : 'text-gray-600'}`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                    <span>Like</span>
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedPost(post);
                      setCurrentTab('messages');
                    }}
                    className="flex items-center justify-center space-x-2 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Comment</span>
                  </button>
                  <button 
                    onClick={() => handleSharePost(post.id)}
                    className="flex items-center justify-center space-x-2 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                </div>

                {selectedPost?.id === post.id && (
                  <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                    <div className="max-h-48 overflow-y-auto space-y-3">
                      {Object.entries(post.comments).map(([id, comment]: [string, any]) => (
                        <div key={id} className="flex space-x-2">
                          {otherUsers.find(u => u.uid === comment.authorId)?.photoURL ? (
                            <img 
                              src={otherUsers.find(u => u.uid === comment.authorId)?.photoURL} 
                              alt="Commenter" 
                              className="w-8 h-8 rounded-full object-cover" 
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="bg-white p-2 rounded-lg">
                              <p className="font-medium text-sm">{comment.author}</p>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1 px-2">
                              <span>{getTimeAgo(comment.timestamp)}</span>
                              <button>Like</button>
                              <button>Reply</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center space-x-2">
                      {profileData.photoURL ? (
                        <img 
                          src={profileData.photoURL} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full object-cover" 
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 flex items-center bg-white rounded-full px-3 py-1">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          className="flex-1 text-sm focus:outline-none"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        />
                        <button 
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-1 text-gray-500 hover:text-blue-500"
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={postsEndRef} />
          </div>
        )}

        {currentTab === 'messages' && (
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Messages</h2>
              <div className="space-y-3">
                {otherUsers.map((user) => (
                  <div 
                    key={user.uid} 
                    className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                    onClick={() => setCurrentTab('feed')}
                  >
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="User" 
                        className="w-12 h-12 rounded-full object-cover" 
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-sm text-gray-500 truncate">{user.bio}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${user.isLoggedIn ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'notifications' && (
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Notifications</h2>
              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`flex items-start space-x-3 p-2 rounded-lg ${!notification.read ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className={`p-2 rounded-full ${!notification.read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                        {notification.type === 'like' && <Heart className="w-5 h-5" />}
                        {notification.type === 'comment' && <MessageCircle className="w-5 h-5" />}
                        {notification.type === 'share' && <Share2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm">
                          {notification.type === 'like' && (
                            <span><span className="font-medium">{notification.fromUserName}</span> liked your post</span>
                          )}
                          {notification.type === 'comment' && (
                            <span><span className="font-medium">{notification.fromUserName}</span> commented on your post: "{notification.comment}..."</span>
                          )}
                          {notification.type === 'share' && (
                            <span><span className="font-medium">{notification.fromUserName}</span> shared your post</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{getTimeAgo(notification.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Bell className="w-12 h-12 text-gray-300" />
                  <p className="text-gray-500 mt-2">No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'profile' && (
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              <div className="px-4 pb-4 relative">
                <div className="flex justify-between items-start">
                  <div className="flex items-end space-x-4 -mt-12">
                    {profileData.photoURL ? (
                      <img 
                        src={profileData.photoURL} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full border-4 border-white object-cover" 
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 rounded-full border-4 border-white flex items-center justify-center">
                        <User className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold">{profileData.displayName}</h2>
                      <p className="text-gray-600">{profileData.bio}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded-full text-sm flex items-center space-x-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-4 space-y-4">
              <h3 className="font-semibold">About</h3>
              <p className="text-gray-700">{profileData.description || 'No description provided.'}</p>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Globe className="w-4 h-4" />
                <span>Indonesia</span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <h3 className="font-semibold">Connections</h3>
                <div className="flex flex-wrap gap-3 mt-2">
                  {otherUsers.slice(0, 6).map((user) => (
                    <div key={user.uid} className="flex flex-col items-center">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="Connection" 
                          className="w-12 h-12 rounded-full object-cover" 
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                      <span className="text-xs mt-1">{user.displayName.split(' ')[0]}</span>
                    </div>
                  ))}
                  {otherUsers.length > 6 && (
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs">+{otherUsers.length - 6}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-4 space-y-4">
              <h3 className="font-semibold">Your Posts</h3>
              {posts.filter(p => p.authorId === user?.uid).length > 0 ? (
                posts
                  .filter(p => p.authorId === user?.uid)
                  .map((post) => (
                    <div key={post.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <p className="text-gray-800">{post.content}</p>
                      {post.mediaUrl && (
                        <div className="mt-2">
                          {post.mediaType === 'image' ? (
                            <img 
                              src={post.mediaUrl} 
                              alt="Post media" 
                              className="w-full h-48 object-cover rounded-lg" 
                            />
                          ) : (
                            <video 
                              src={post.mediaUrl} 
                              controls 
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>{post.likes?.length || 0} likes</span>
                          <span>{Object.keys(post.comments).length} comments</span>
                          <span>{post.shares} shares</span>
                        </div>
                        <span>{getTimeAgo(post.timestamp)}</span>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 text-center py-4">You haven't posted anything yet.</p>
              )}
            </div>
          </div>
        )}

        {currentTab === 'create' && (
          <div className="max-w-2xl mx-auto p-4">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Create Post</h2>
                <button 
                  onClick={() => setCurrentTab('feed')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-start space-x-3">
                {profileData.photoURL ? (
                  <img 
                    src={profileData.photoURL} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <div className="flex-1">
                  <textarea
                    placeholder="What's on your mind?"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                    rows={4}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                  />
                  
                  {previewUrl && (
                    <div className="mt-3 relative">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg" 
                      />
                      <button 
                        onClick={handleRemoveMedia}
                        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <Video className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <FileText className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={handleCreatePost}
                      disabled={loading || (!newPostContent.trim() && !postMedia)}
                      className={`px-4 py-2 rounded-full ${loading || (!newPostContent.trim() && !postMedia) ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      {loading ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="h-16 bg-white shadow-t flex justify-around items-center">
          <button 
            onClick={() => setCurrentTab('feed')}
            className={`flex flex-col items-center p-2 ${currentTab === 'feed' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button 
            onClick={() => setCurrentTab('messages')}
            className={`flex flex-col items-center p-2 ${currentTab === 'messages' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs mt-1">Messages</span>
          </button>
          <button 
            onClick={() => setCurrentTab('create')}
            className="flex flex-col items-center p-2 text-gray-600"
          >
            <PlusCircle className="w-6 h-6" />
            <span className="text-xs mt-1">Create</span>
          </button>
          <button 
            onClick={() => setCurrentTab('notifications')}
            className={`flex flex-col items-center p-2 relative ${currentTab === 'notifications' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <Bell className="w-6 h-6" />
            <span className="text-xs mt-1">Notifications</span>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setCurrentTab('profile')}
            className={`flex flex-col items-center p-2 ${currentTab === 'profile' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </nav>
      )}

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            ref={emojiPickerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 right-4 bg-white rounded-lg shadow-lg z-10"
          >
            <EmojiPicker
              onEmojiClick={(emoji) => {
                if (currentTab === 'create') {
                  setNewPostContent((prev) => prev + emoji.emoji);
                } else if (selectedPost) {
                  setNewComment((prev) => prev + emoji.emoji);
                }
                setShowEmojiPicker(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default SocialPlatform;