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
import { ArrowLeft, Package } from 'lucide-react';
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

    const unsubscribe = subscribeToConversations(userId, (convs) => {
      setConversations(convs);
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

  // const conversationKey = `${listingId}-${otherUserId}`;
  const conversationKey = '0';

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
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm">
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

        {/* Messages */}
        <MessageList messages={messages} currentUserId={userId || ''} />

        {/* Input */}
        <MessageInput onSend={handleSendMessage} />
      </div>
    </div>
  );
}
