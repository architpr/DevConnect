"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Loader2, Bell, CheckCircle, XCircle, Mail, Trash2, Microscope } from "lucide-react"
import Link from "next/link"

type Notification = {
    id: string
    type: 'application_accepted' | 'application_rejected' | 'research_application_update'
    title: string
    message: string
    post_title: string
    team_lead_email: string
    team_lead_name: string
    is_read: boolean
    created_at: string
}

export default function NotificationsPage() {
    const { user } = useAuth()
    const supabase = createClient()

    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user) return

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching notifications:', error)
            } else if (data) {
                setNotifications(data as Notification[])
            }
            setLoading(false)
        }

        fetchNotifications()
    }, [user, supabase])

    const markAsRead = async (notificationId: string) => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)

        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        )
    }

    const deleteNotification = async (notificationId: string) => {
        await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)

        setNotifications(prev => prev.filter(n => n.id !== notificationId))
    }

    const markAllAsRead = async () => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user?.id)

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    }

    const unreadCount = notifications.filter(n => !n.is_read).length

    const isAccepted = (notification: Notification) => {
        if (notification.type === 'application_accepted') return true
        if (notification.type === 'research_application_update') {
            return notification.title.toLowerCase().includes('accepted') || notification.message.toLowerCase().includes('accepted')
        }
        return false
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center flex-col gap-4">
                <Loader2 className="animate-spin text-purple-500 h-8 w-8" />
                <p className="text-gray-400">Loading notifications...</p>
            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                        Notifications
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Stay updated on your team applications
                        {unreadCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                                {unreadCount} new
                            </span>
                        )}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" onClick={markAllAsRead} className="w-full sm:w-auto">
                        Mark all as read
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <Card className="text-center py-16 bg-gradient-to-br from-gray-500/5 to-gray-600/5 border-gray-500/20">
                    <CardContent>
                        <Bell className="mx-auto h-16 w-16 text-gray-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">No Notifications</h2>
                        <p className="text-gray-400 max-w-md mx-auto">
                            When team leads respond to your applications, you&apos;ll see updates here.
                        </p>
                        <Link href="/feed" className="mt-4 inline-block">
                            <Button className="mt-4">Browse Teams</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {notifications.map(notification => (
                        <Card
                            key={notification.id}
                            className={`transition-all duration-300 hover:border-white/20 ${!notification.is_read
                                    ? 'border-blue-500/30 bg-blue-500/5'
                                    : 'border-white/10'
                                }`}
                            onClick={() => !notification.is_read && markAsRead(notification.id)}
                        >
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start">
                                    {/* Icon */}
                                    <div className={`w-fit p-3 rounded-xl ${isAccepted(notification)
                                            ? 'bg-green-500/20'
                                            : 'bg-red-500/20'
                                        }`}>
                                        {notification.type === 'research_application_update' ? (
                                            <Microscope className="h-6 w-6 text-cyan-400" />
                                        ) : isAccepted(notification) ? (
                                            <CheckCircle className="h-6 w-6 text-green-400" />
                                        ) : (
                                            <XCircle className="h-6 w-6 text-red-400" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-lg leading-tight">{notification.title}</h3>
                                            {!notification.is_read && (
                                                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">NEW</span>
                                            )}
                                        </div>
                                        <p className="text-gray-400 mb-3">{notification.message}</p>

                                        {/* Team Details */}
                                        <div className="p-4 bg-white/5 rounded-lg space-y-2">
                                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                                <span className="text-gray-500">Post:</span>
                                                <span className="font-medium">{notification.post_title}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                                <span className="text-gray-500">Team Lead:</span>
                                                <span className="font-medium">{notification.team_lead_name}</span>
                                            </div>
                                            {isAccepted(notification) && (
                                                <div className="mt-3 flex min-w-0 items-center gap-2">
                                                    <Mail className="h-4 w-4 shrink-0 text-blue-400" />
                                                    <a
                                                        href={`mailto:${notification.team_lead_email}`}
                                                        className="truncate text-blue-400 transition-colors hover:text-blue-300 hover:underline"
                                                    >
                                                        {notification.team_lead_email}
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {/* Timestamp */}
                                        <p className="text-xs text-gray-500 mt-3">
                                            {new Date(notification.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>

                                    {/* Delete Button */}
                                    <Button
                                        variant="ghost"
                                        className="h-9 w-9 self-start p-0 text-gray-500 hover:text-red-400 sm:justify-self-end"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            deleteNotification(notification.id)
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
