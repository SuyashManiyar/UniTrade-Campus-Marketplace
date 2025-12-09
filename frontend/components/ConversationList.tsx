'use client';

import { Conversation } from '@/lib/messaging';
import { MessageCircle, Package, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationKey?: string;
  showHeader?: boolean;
  onConversationDeleted?: (listingId: string, otherUserId: string) => void;
}

export default function ConversationList({
  conversations,
  currentConversationKey,
  showHeader = true,
  onConversationDeleted,
}: ConversationListProps) {
  
  const handleDeleteConversation = async (e: React.MouseEvent, listingId: string, otherUserId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/messages/conversation/${listingId}/${otherUserId}`);
      toast.success('Conversation deleted');
      if (onConversationDeleted) {
        onConversationDeleted(listingId, otherUserId);
      }
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  };
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'now';
  };

  const getInitials = (name: string) => {
    if (!name || name === 'User' || name === 'Unknown User') return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
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

  return (
    <div className="w-full md:w-80 border-r bg-gray-50 overflow-y-auto">
      {showHeader && (
        <div className="p-4 border-b bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <MessageCircle size={24} className="text-blue-600" />
            Messages
          </h2>
          {conversations.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
      <div>
        {conversations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={40} className="text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">No messages yet</h3>
            <p className="text-sm text-gray-500">
              Start a conversation by messaging a seller!
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const conversationKey = `${conv.listingId}-${conv.otherUserId}`;
            const isActive = conversationKey === currentConversationKey;
            const displayName = !conv.otherUserName || conv.otherUserName === 'Unknown User' 
              ? 'Unknown User' 
              : conv.otherUserName === 'User'
              ? 'Loading...'
              : conv.otherUserName;

            return (
              <div
                key={conversationKey}
                className={`relative group ${
                  isActive ? 'bg-white shadow-sm border-l-4 border-l-umass-maroon' : 'bg-gray-50'
                }`}
              >
                <Link
                  href={`/messages/${conv.listingId}/${conv.otherUserId}`}
                  className="block p-4 hover:bg-white transition-all duration-150 border-b border-gray-100"
                >
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full ${getAvatarColor(displayName)} flex items-center justify-center text-white font-semibold text-sm shadow-sm`}>
                      {getInitials(displayName)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">
                          {displayName}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTime(conv.lastMessageTime)}
                        </span>
                      </div>
                      
                      {conv.listingTitle && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <Package size={12} />
                          <span className="truncate">{conv.listingTitle}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-sm text-gray-600 truncate flex-1">
                          {conv.lastMessage}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 bg-umass-maroon text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
                
                {/* Delete Button */}
                <button
                  onClick={(e) => handleDeleteConversation(e, conv.listingId, conv.otherUserId)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-full"
                  title="Delete conversation"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
