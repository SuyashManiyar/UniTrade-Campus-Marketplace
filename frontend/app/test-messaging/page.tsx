'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

export default function TestMessaging() {
  const [status, setStatus] = useState('Testing Firebase connection...');
  const [messages, setMessages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testFirebase();
  }, []);

  const testFirebase = async () => {
    try {
      // Test 1: Check if Firebase is initialized
      setStatus('✓ Firebase initialized');

      // Test 2: Try to read from Firestore
      const messagesRef = collection(db, 'messages');
      const snapshot = await getDocs(messagesRef);
      setStatus(`✓ Firestore connected. Found ${snapshot.size} messages`);
      
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);

    } catch (err: any) {
      console.error('Firebase test error:', err);
      setError(err.message);
      setStatus('✗ Firebase connection failed');
    }
  };

  const sendTestMessage = async () => {
    try {
      setStatus('Sending test message...');
      const messagesRef = collection(db, 'messages');
      
      await addDoc(messagesRef, {
        content: 'Test message from test page',
        senderId: 'test-user-1',
        receiverId: 'test-user-2',
        listingId: 'test-listing',
        senderName: 'Test User 1',
        receiverName: 'Test User 2',
        isRead: false,
        createdAt: serverTimestamp(),
      });

      setStatus('✓ Test message sent successfully!');
      testFirebase(); // Refresh messages
    } catch (err: any) {
      console.error('Send test message error:', err);
      setError(err.message);
      setStatus('✗ Failed to send test message');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Firebase Messaging Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <p className={`text-lg ${error ? 'text-red-600' : 'text-green-600'}`}>
            {status}
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-semibold">Error:</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <button
            onClick={sendTestMessage}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Send Test Message
          </button>
          <button
            onClick={testFirebase}
            className="ml-4 bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
          >
            Refresh Messages
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Messages in Firestore ({messages.length})
          </h2>
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages found. Try sending a test message!</p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className="p-3 bg-gray-50 rounded border">
                  <p className="font-semibold">{msg.senderName} → {msg.receiverName}</p>
                  <p className="text-sm text-gray-600">{msg.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Listing: {msg.listingId} | Read: {msg.isRead ? 'Yes' : 'No'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-900 mb-2">Firebase Configuration</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set'}</p>
            <p>Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Not set'}</p>
            <p>API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓ Set' : '✗ Not set'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
