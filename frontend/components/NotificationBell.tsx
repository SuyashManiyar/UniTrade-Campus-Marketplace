'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Notification {
    id: string
    title: string
    message: string
    type: string
    listingId?: string
    isRead: boolean
    createdAt: string
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchNotifications()

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)

        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications')
            setNotifications(response.data.notifications)
            setUnreadCount(response.data.unreadCount)
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        }
    }

    const markAsRead = async (notificationId: string) => {
        try {
            await api.put(`/notifications/${notificationId}/read`)
            setNotifications(notifications.map(n =>
                n.id === notificationId ? { ...n, isRead: true } : n
            ))
            setUnreadCount(Math.max(0, unreadCount - 1))
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            setLoading(true)
            await api.put('/notifications/mark-all-read')
            setNotifications(notifications.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
            toast.success('All notifications marked as read')
        } catch (error) {
            toast.error('Failed to mark all as read')
        } finally {
            setLoading(false)
        }
    }

    const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await api.delete(`/notifications/${notificationId}`)
            setNotifications(notifications.filter(n => n.id !== notificationId))
            if (!notifications.find(n => n.id === notificationId)?.isRead) {
                setUnreadCount(Math.max(0, unreadCount - 1))
            }
            toast.success('Notification deleted')
        } catch (error) {
            toast.error('Failed to delete notification')
        }
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'LISTING_SOLD':
                return ''
            case 'LISTING_CANCELLED':
                return '❌'
            case 'BID_OUTBID':
                return '⚡'
            default:
                return '📢'
        }
    }

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (seconds < 60) return 'Just now'
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
        return date.toLocaleDateString()
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                title="Notifications"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                disabled={loading}
                                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="text-4xl mb-2">🔔</div>
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''
                                            }`}
                                        onClick={() => {
                                            if (!notification.isRead) {
                                                markAsRead(notification.id)
                                            }
                                            if (notification.listingId) {
                                                window.location.href = `/marketplace/listings/${notification.listingId}`
                                            }
                                        }}
                                    >
                                        <div className="flex items-start space-x-3">
                                            {/* Icon */}
                                            <div className="text-2xl flex-shrink-0">
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {notification.title}
                                                    </p>
                                                    {!notification.isRead && (
                                                        <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-gray-500">
                                                        {formatTimeAgo(notification.createdAt)}
                                                    </span>
                                                    <button
                                                        onClick={(e) => deleteNotification(notification.id, e)}
                                                        className="text-xs text-red-600 hover:text-red-800"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-gray-200 text-center">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
