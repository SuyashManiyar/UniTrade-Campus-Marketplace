'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ConversationList from '@/components/ConversationList';
import MessageList from '@/components/MessageList';
import MessageInput from '@/components/MessageInput';
import {
  subscribeToConversations,
  subscribeToConversation,
  sendMessage,
  markMessagesAsRead,
  Conversation,
  Message,
} from '@/lib/messaging';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { ArrowLeft, Package, ExternalLink, DollarSign, Tag } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface DecodedToken {
  id: string;
  email: string;
  name: string;
}

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.listingId as string;
  const otherUserId = params.otherUserId as string;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [otherUserName, setOtherUserName] = useState<string>('');
  const [listingTitle, setListingTitle] = useState<string>('');
  const [listingDetails, setListingDetails] = useState<any>(null);
  const [showListingBanner, setShowListingBanner] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  useEffect(() => {
    console.log('ConversationPage: Initializing with params:', { listingId, otherUserId });
    
    const token = Cookies.get('token');
    if (!token) {
      console.log('ConversationPage: No token found');
      router.push('/auth/login');
      return;
    }

    try {
      const decoded = jwtDecode<any>(token);
      console.log('ConversationPage: Decoded token:', decoded);
      
      const userId = decoded.id || decoded.userId || decoded.sub || decoded.user_id;
      if (!userId) {
        console.error('ConversationPage: No user ID in token');
        setLoading(false);
        return;
      }
      
      setUserId(userId);
      setUserName(decoded.name || 'User');
      console.log('ConversationPage: User set:', { userId, userName: decoded.name });
    } catch (error) {
      console.error('ConversationPage: Invalid token:', error);
      setLoading(false);
      router.push('/auth/login');
    }
  }, [router, listingId, otherUserId]);

  // Fetch listing and user details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        console.log('ConversationPage: Fetching details for listing and user');
        const token = Cookies.get('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        // Fetch listing details
        const listingRes = await axios.get(`${API_URL}/listings/${listingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('ConversationPage: Listing fetched:', listingRes.data.title);
        setListingTitle(listingRes.data.title);
        setListingDetails(listingRes.data);

        // Fetch other user details
        const userRes = await axios.get(`${API_URL}/users/${otherUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('ConversationPage: Other user fetched:', userRes.data.name);
        setOtherUserName(userRes.data.name);
      } catch (error) {
        console.error('ConversationPage: Error fetching details:', error);
      }
    };

    if (listingId && otherUserId) {
      fetchDetails();
    }
  }, [listingId, otherUserId]);

  // Subscribe to conversations
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToConversations(userId, async (convs) => {
      // Fetch user names and listing titles for conversations
      const conversationsWithDetails = await Promise.all(
        convs.map(async (conv) => {
          const token = Cookies.get('token');
          const API_URL = process.env.NEXT_PUBLIC_API_URL;
          let updatedConv = { ...conv };
          
          // Fetch user details
          try {
            const response = await fetch(`${API_URL}/users/${conv.otherUserId}`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: 'no-store',
            });
            
            if (response.ok) {
              const userData = await response.json();
              updatedConv.otherUserName = userData.name || 'Unknown User';
            } else {
              updatedConv.otherUserName = 'Unknown User';
            }
          } catch (err) {
            console.error('Error fetching user name:', err);
            updatedConv.otherUserName = 'Unknown User';
          }
          
          // Fetch listing details
          try {
            const response = await fetch(`${API_URL}/listings/${conv.listingId}`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: 'no-store',
            });
            
            if (response.ok) {
              const listingData = await response.json();
              updatedConv.listingTitle = listingData.title || 'Listing';
            }
          } catch (err) {
            console.error('Error fetching listing title:', err);
          }
          
          return updatedConv;
        })
      );
      
      setConversations(conversationsWithDetails);
    });

    return () => unsubscribe();
  }, [userId]);

  // Subscribe to current conversation messages
  useEffect(() => {
    if (!userId || !listingId || !otherUserId) {
      console.log('ConversationPage: Missing required data:', { userId, listingId, otherUserId });
      return;
    }

    console.log('ConversationPage: Subscribing to conversation');
    
    const unsubscribe = subscribeToConversation(
      listingId,
      userId,
      otherUserId,
      (msgs) => {
        console.log('ConversationPage: Received messages:', msgs.length);
        setMessages(msgs);
        setLoading(false);
      }
    );

    // Mark messages as read
    markMessagesAsRead(listingId, userId, otherUserId).catch(err => {
      console.error('ConversationPage: Error marking messages as read:', err);
    });

    return () => {
      console.log('ConversationPage: Unsubscribing from conversation');
      unsubscribe();
    };
  }, [userId, listingId, otherUserId]);

  // Helper function to get avatar color based on name
  const getAvatarColor = (name: string) => {
    if (!name) return 'bg-gray-500';
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleScroll = (scrollTop: number) => {
    // Show banner when scrolling up (near top), hide when scrolling down
    if (scrollTop < 50) {
      // Near the top - show banner
      setShowListingBanner(true);
    } else if (scrollTop > lastScrollTop && scrollTop > 100) {
      // Scrolling down and past threshold - hide banner
      setShowListingBanner(false);
    } else if (scrollTop < lastScrollTop && scrollTop < 200) {
      // Scrolling up - show banner
      setShowListingBanner(true);
    }
    setLastScrollTop(scrollTop);
  };

  const handleSendMessage = async (content: string) => {
    if (!userId || !otherUserId) {
      console.error('Missing user IDs');
      return;
    }
    
    // Use fallback names if not loaded yet
    const senderName = userName || 'User';
    const receiverName = otherUserName || 'User';
    
    console.log('Sending message with names:', { senderName, receiverName });

    try {
      await sendMessage(
        content,
        userId,
        otherUserId,
        listingId,
        senderName,
        receiverName
      );
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  const conversationKey = `${listingId}-${otherUserId}`;
  // const conversationKey = '0';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversation List - Hidden on mobile when viewing a conversation */}
      <div className="hidden md:block">
        <ConversationList
          conversations={conversations}
          currentConversationKey={conversationKey}
        />
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="border-b px-4 py-3 bg-white flex items-center gap-3 shadow-sm">
          <button
            onClick={() => router.push('/messages')}
            className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg -ml-2"
            title="Back to conversations"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="h-8 w-px bg-gray-300"></div>
          
          {/* User Avatar */}
          <div className={`w-10 h-10 rounded-full ${getAvatarColor(otherUserName || 'User')} flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm`}>
            {otherUserName ? otherUserName[0].toUpperCase() : '?'}
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base text-gray-900 truncate leading-tight">
              {otherUserName || 'Loading...'}
            </h2>
            {listingTitle && (
              <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                <Package size={12} />
                <span>{listingTitle}</span>
              </p>
            )}
          </div>
        </div>

        {/* Collapsible Listing Banner */}
        {listingDetails && (
          <div
            className={`border-b bg-gradient-to-r from-blue-50 to-purple-50 overflow-hidden transition-all duration-300 ease-in-out ${
              showListingBanner ? 'max-h-48' : 'max-h-14'
            }`}
          >
            {showListingBanner ? (
              // Expanded view
              <div className="p-4 flex gap-4">
                {/* Listing Image */}
                {listingDetails.images && (() => {
                  try {
                    const images = JSON.parse(listingDetails.images);
                    if (images && images.length > 0) {
                      return (
                        <div className="relative w-32 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                          <img
                            src={images[0].startsWith('/uploads/') 
                              ? `http://localhost:8080${images[0]}`
                              : images[0]}
                            alt={listingDetails.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      );
                    }
                  } catch (e) {
                    return (
                      <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package size={32} className="text-gray-400" />
                      </div>
                    );
                  }
                })()}
                
                {/* Listing Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-base text-gray-900 mb-1 truncate">
                    {listingDetails.title}
                  </h4>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-blue-600">
                      ${listingDetails.price || listingDetails.startingBid}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {listingDetails.category?.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      {listingDetails.condition?.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {listingDetails.description}
                  </p>
                  
                  <Link
                    href={`/marketplace/listings/${listingId}`}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    <ExternalLink size={14} />
                    View Full Listing
                  </Link>
                </div>
              </div>
            ) : (
              // Compact view
              <Link
                href={`/marketplace/listings/${listingId}`}
                className="px-4 py-2 flex items-center gap-3 hover:bg-blue-100/50 transition-colors"
              >
                {/* Small thumbnail */}
                {listingDetails.images && (() => {
                  try {
                    const images = JSON.parse(listingDetails.images);
                    if (images && images.length > 0) {
                      return (
                        <div className="relative w-10 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={images[0].startsWith('/uploads/') 
                              ? `http://localhost:8080${images[0]}`
                              : images[0]}
                            alt={listingDetails.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      );
                    }
                  } catch (e) {
                    return (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        <Package size={16} className="text-gray-400" />
                      </div>
                    );
                  }
                })()}
                
                {/* Compact info */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <span className="font-semibold text-sm text-gray-900 truncate">
                    {listingDetails.title}
                  </span>
                  <span className="text-sm font-bold text-blue-600 flex-shrink-0">
                    ${listingDetails.price || listingDetails.startingBid}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex-shrink-0">
                    {listingDetails.category?.replace('_', ' ')}
                  </span>
                </div>
                
                <ExternalLink size={14} className="text-gray-400 flex-shrink-0" />
              </Link>
            )}
          </div>
        )}

        {/* Messages */}
        <MessageList 
          messages={messages} 
          currentUserId={userId || ''} 
          onScroll={handleScroll}
        />

        {/* Input */}
        <MessageInput onSend={handleSendMessage} />
      </div>
    </div>
  );
}
