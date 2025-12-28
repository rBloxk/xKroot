'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

interface Notification {
  id: string
  notification_type: string
  title: string
  message: string
  link_url: string | null
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const { authenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    if (authenticated) {
      loadNotifications()
    }
  }, [authenticated, filter])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const url = filter === 'unread' 
        ? '/api/notifications?unread_only=true'
        : '/api/notifications'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      })
      loadNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read)
      await Promise.all(
        unreadNotifications.map(n => 
          fetch(`/api/notifications/${n.id}`, { method: 'PATCH' })
        )
      )
      loadNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
            <p className="mt-4 text-gray-dark dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-gray mb-2">
                  Notifications
                </h1>
                <p className="text-gray-dark dark:text-gray-300">
                  Stay updated with your activity
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={markAllAsRead}
                  disabled={notifications.filter(n => !n.is_read).length === 0}
                  className="px-4 py-2 text-sm font-medium text-black dark:text-gray hover:bg-white/10 dark:hover:bg-gray-dark/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  Mark All Read
                </button>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-6 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-4">
            <div className="flex gap-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-black dark:bg-gray text-white dark:text-black'
                    : 'text-black dark:text-gray hover:bg-white/10 dark:hover:bg-gray-dark/10'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'unread'
                    ? 'bg-black dark:bg-gray text-white dark:text-black'
                    : 'text-black dark:text-gray hover:bg-white/10 dark:hover:bg-gray-dark/10'
                }`}
              >
                Unread
              </button>
            </div>
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 text-center">
              <p className="text-gray-dark dark:text-gray-300">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 ${
                    !notification.is_read ? 'border-blue-500 dark:border-blue-400' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        {!notification.is_read && (
                          <div className="mt-1 h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-black dark:text-gray mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-gray-dark dark:text-gray-300 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-dark dark:text-gray-300">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        >
                          Mark Read
                        </button>
                      )}
                      {notification.link_url && (
                        <Link
                          href={notification.link_url}
                          className="px-3 py-1 text-xs font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded transition-colors"
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

