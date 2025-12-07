'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConversationList from '@/components/ConversationList';
import { subscribeToConversations, Conversation } from '@/lib/messaging';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { MessageCircle, ArrowLeft } from 'lucide-react';

interface DecodedToken {
  id: string;
  email: string;
  name: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      router.push('/auth/login');
      return;
    }

    try {
      const decoded = jwtDecode<any>(token);
      console.log('Decoded token:', decoded);
      console.log('Token keys:', Object.keys(decoded));
      
      // Try different possible field names
      const userId = decoded.id || decoded.userId || decoded.sub || decoded.user_id;
      
      if (!userId) {
        console.error('No user ID found in token. Token contents:', decoded);
        setError('User ID not found in authentication token');
        return;
      }
      
      setUserId(userId);
      console.log('User ID set to:', userId);
    } catch (error) {
      console.error('Invalid token:', error);
      setError('Invalid authentication token');
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    console.log('Subscribing to conversations for user:', userId);
    
    try {
      const unsubscribe = subscribeToConversations(userId, async (convs) => {
        console.log('Received conversations:', convs);
        console.log('Starting to fetch user and listing details...');
        
        // Fetch user names and listing titles for conversations
        const conversationsWithDetails = await Promise.all(
          convs.map(async (conv) => {
            const token = Cookies.get('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            let updatedConv = { ...conv };
            
            // Always fetch user details to override any "User" or "Unknown User" values
            try {
              console.log('Fetching user details for:', conv.otherUserId);
              const response = await fetch(`${API_URL}/users/${conv.otherUserId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              if (response.ok) {
                const userData = await response.json();
                console.log('Fetched user name:', userData.name);
                updatedConv.otherUserName = userData.name || 'Unknown User';
              } else {
                console.error('Failed to fetch user:', response.status);
                // Keep the original name if fetch fails
                if (!updatedConv.otherUserName || updatedConv.otherUserName === 'User') {
                  updatedConv.otherUserName = 'Unknown User';
                }
              }
            } catch (err) {
              console.error('Error fetching user name:', err);
              // Keep the original name if fetch fails
              if (!updatedConv.otherUserName || updatedConv.otherUserName === 'User') {
                updatedConv.otherUserName = 'Unknown User';
              }
            }
            
            // Always fetch listing details
            try {
              console.log('Fetching listing details for:', conv.listingId);
              const response = await fetch(`${API_URL}/listings/${conv.listingId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              if (response.ok) {
                const listingData = await response.json();
                console.log('Fetched listing title:', listingData.title);
                updatedConv.listingTitle = listingData.title || 'Listing';
              } else {
                console.error('Failed to fetch listing:', response.status);
              }
            } catch (err) {
              console.error('Error fetching listing title:', err);
            }
            
            return updatedConv;
          })
        );
        
        console.log('Finished fetching details. Final conversations:', conversationsWithDetails);
        
        // Filter out any conversations that still have "User" as the name after fetching
        const validConversations = conversationsWithDetails.filter(
          conv => conv.otherUserName && conv.otherUserName !== 'User' && conv.otherUserName !== 'Unknown User'
        );
        
        console.log('Valid conversations after filtering:', validConversations);
        
        // Force update by creating new array reference
        setConversations([...validConversations]);
        setLoading(false);
      });

      return () => {
        console.log('Unsubscribing from conversations');
        unsubscribe();
      };
    } catch (err: any) {
      console.error('Error subscribing to conversations:', err);
      setError(err.message || 'Failed to load conversations');
      setLoading(false);
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Messages</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Link
              href="/test-messaging"
              className="block w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Firebase Connection
            </Link>
            <Link
              href="/marketplace"
              className="block w-full bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="px-8">
          <div className="flex items-center h-16 gap-3">
            <Link 
              href="/marketplace" 
              className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg -ml-2"
              title="Back to Marketplace"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <MessageCircle size={22} className="text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4rem)]">
        <ConversationList conversations={conversations} showHeader={false} />
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center p-8">
            <MessageCircle size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Select a conversation to start messaging</p>
            <p className="text-sm text-gray-400">
              {conversations.length === 0 
                ? 'No conversations yet. Message a seller to get started!' 
                : `You have ${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
