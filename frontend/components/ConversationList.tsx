'use client';

import { Conversation } from '@/lib/messaging';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationKey?: string;
}

export default function ConversationList({
  conversations,
  currentConversationKey,
}: ConversationListProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div className="w-full md:w-80 border-r bg-white overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageCircle size={24} />
          Messages
        </h2>
      </div>
      <div className="divide-y">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const conversationKey = `${conv.listingId}-${conv.otherUserId}`;
            const isActive = conversationKey === currentConversationKey;

            return (
              <Link
                key={conversationKey}
                href={`/messages/${conv.listingId}/${conv.otherUserId}`}
                className={`block p-4 hover:bg-gray-50 transition-colors ${
                  isActive ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {!conv.otherUserName || conv.otherUserName === 'Unknown User' || conv.otherUserName === 'User' 
                      ? 'User' 
                      : conv.otherUserName}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {formatTime(conv.lastMessageTime)}
                  </span>
                </div>
                {conv.listingTitle && (
                  <p className="text-xs text-gray-500 mb-1">
                    Re: {conv.listingTitle}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 truncate flex-1">
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
