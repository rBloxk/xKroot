'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
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

export default function Notifications() {
  const { authenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (authenticated) {
      loadNotifications()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [authenticated])

  const loadNotifications = async () => {
    if (!authenticated) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/notifications?unread_only=true&limit=10')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
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

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    setIsOpen(false)
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg hover:bg-white/10 dark:hover:bg-gray-dark/10 transition-colors ${
          isOpen
            ? 'text-black dark:text-white'
            : 'text-gray-600 dark:text-gray-600'
        }`}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="m16.899,20c-.465,2.279-2.485,4-4.899,4s-4.435-1.721-4.899-4h9.799Zm3.601-13c1.93,0,3.5-1.57,3.5-3.5s-1.57-3.5-3.5-3.5-3.5,1.57-3.5,3.5,1.57,3.5,3.5,3.5Zm.24,1.988c-.08.003-.159.012-.24.012-3.033,0-5.5-2.467-5.5-5.5,0-.904.223-1.756.612-2.509-1.182-.635-2.526-.991-3.936-.991C7.775,0,4.398,2.709,3.552,6.516l-2.35,7.597c-.597,1.93.846,3.886,2.866,3.886h15.656c2.08,0,3.529-2.065,2.821-4.021l-1.806-4.992Z"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] shadow-lg z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-300 dark:border-[#333333]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black dark:text-gray">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="text-sm text-gray-dark dark:text-gray-300">
                    {unreadCount} unread
                  </span>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-[#333333]">
              {isLoading ? (
                <div className="p-4 text-center text-gray-dark dark:text-gray-300">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-dark dark:text-gray-300">
                  No new notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {notification.link_url ? (
                      <Link href={notification.link_url} className="block">
                        <div className="flex items-start gap-3">
                          {!notification.is_read && (
                            <div className="mt-1 h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-black dark:text-gray">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-dark dark:text-gray-300 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-dark dark:text-gray-300 mt-1">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3">
                        {!notification.is_read && (
                          <div className="mt-1 h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-black dark:text-gray">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-dark dark:text-gray-300 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-dark dark:text-gray-300 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-300 dark:border-[#333333]">
                <Link
                  href="/notifications"
                  className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

