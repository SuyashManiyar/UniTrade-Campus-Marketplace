'use client';

import { Conversation } from '@/lib/messaging';
import { MessageCircle, Package } from 'lucide-react';
import Link from 'next/link';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationKey?: string;
  showHeader?: boolean;
}

export default function ConversationList({
  conversations,
  currentConversationKey,
  showHeader = true,
}: ConversationListProps) {
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
            const displayName = !conv.otherUserName || conv.otherUserName === 'Unknown User' || conv.otherUserName === 'User' 
              ? 'User' 
              : conv.otherUserName;

            return (
              <Link
                key={conversationKey}
                href={`/messages/${conv.listingId}/${conv.otherUserId}`}
                className={`block p-4 hover:bg-white transition-all duration-150 border-b border-gray-100 ${
                  isActive ? 'bg-white shadow-sm border-l-4 border-l-blue-600' : 'bg-gray-50'
                }`}
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
                        <span className="flex-shrink-0 bg-blue-600 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
