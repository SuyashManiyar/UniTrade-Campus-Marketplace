import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  listingId: string;
  isRead: boolean;
  createdAt: Timestamp | Date;
  senderName?: string;
  receiverName?: string;
}

export interface Conversation {
  listingId: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  listingTitle?: string;
  listingImage?: string;
}

// Send a message
export const sendMessage = async (
  content: string,
  senderId: string,
  receiverId: string,
  listingId: string,
  senderName: string,
  receiverName: string
) => {
  try {
    const messageData = {
      content,
      senderId,
      receiverId,
      listingId,
      senderName,
      receiverName,
      isRead: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'messages'), messageData);
    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Subscribe to messages in a conversation
export const subscribeToConversation = (
  listingId: string,
  userId: string,
  otherUserId: string,
  callback: (messages: Message[]) => void
) => {
  console.log('subscribeToConversation: Setting up for', { listingId, userId, otherUserId });
  
  const messagesRef = collection(db, 'messages');
  
  // Simple query without orderBy to avoid index requirement
  const q = query(
    messagesRef,
    where('listingId', '==', listingId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      console.log('subscribeToConversation: Received snapshot with', snapshot.size, 'messages');
      
      // Filter and sort client-side
      const messages: Message[] = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((message: any) => {
          return (
            (message.senderId === userId && message.receiverId === otherUserId) ||
            (message.senderId === otherUserId && message.receiverId === userId)
          );
        })
        .sort((a: any, b: any) => {
          const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
          const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
          return timeA - timeB; // ascending order
        }) as Message[];
      
      console.log('subscribeToConversation: Filtered to', messages.length, 'messages');
      callback(messages);
    },
    (error) => {
      console.error('subscribeToConversation: Error:', error);
      callback([]);
    }
  );
};

// Subscribe to all conversations for a user
export const subscribeToConversations = (
  userId: string,
  callback: (conversations: Conversation[]) => void
) => {
  console.log('Setting up conversation subscription for user:', userId);
  
  const messagesRef = collection(db, 'messages');
  
  // Simple query to get all messages (we'll filter client-side)
  const q = query(messagesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      console.log('Received snapshot with', snapshot.size, 'messages');
      
      try {
        const allMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];

        console.log('All messages:', allMessages);

        // Filter messages where user is sender or receiver
        const userMessages = allMessages.filter(
          (msg) => msg.senderId === userId || msg.receiverId === userId
        );

        console.log('User messages:', userMessages.length);

        const conversationMap = new Map<string, Conversation>();

        userMessages.forEach((message) => {
          const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
          const otherUserName = message.senderId === userId ? message.receiverName : message.senderName;
          const key = `${message.listingId}-${otherUserId}`;

          if (!conversationMap.has(key)) {
            conversationMap.set(key, {
              listingId: message.listingId,
              otherUserId,
              otherUserName: otherUserName || 'Unknown User',
              lastMessage: message.content,
              lastMessageTime: message.createdAt instanceof Timestamp 
                ? message.createdAt.toDate() 
                : new Date(message.createdAt),
              unreadCount: 0,
            });
          }

          // Count unread messages
          if (message.receiverId === userId && !message.isRead) {
            const conv = conversationMap.get(key)!;
            conv.unreadCount++;
          }
        });

        const conversations = Array.from(conversationMap.values());
        console.log('Processed conversations:', conversations);
        callback(conversations);
      } catch (error) {
        console.error('Error processing conversations:', error);
        callback([]);
      }
    },
    (error) => {
      console.error('Firestore subscription error:', error);
      callback([]);
    }
  );
};

// Mark messages as read
export const markMessagesAsRead = async (
  listingId: string,
  userId: string,
  otherUserId: string
) => {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('listingId', '==', listingId),
      where('senderId', '==', otherUserId),
      where('receiverId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map((document) =>
      updateDoc(doc(db, 'messages', document.id), { isRead: true })
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};
