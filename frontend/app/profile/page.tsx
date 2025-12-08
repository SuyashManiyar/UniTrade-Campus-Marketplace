'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

interface ProfileData {
    name: string
    pronouns?: string
    major?: string
    location?: string
    bio?: string
    rating?: number
    ratingCount?: number
}

export default function ProfilePage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [profileData, setProfileData] = useState<ProfileData | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        pronouns: '',
        major: '',
        location: '',
        bio: ''
    })

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/login')
            return
        }

        if (user) {
            fetchProfile()
        }
    }, [user, isLoading, router])

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/profile')
            const profile = response.data
            setProfileData(profile)
            setFormData({
                name: profile.name || '',
                pronouns: profile.pronouns || '',
                major: profile.major || '',
                location: profile.location || '',
                bio: profile.bio || ''
            })
        } catch (error) {
            toast.error('Failed to fetch profile')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            await api.put('/users/profile', formData)
            toast.success('Profile updated successfully!')
            setEditing(false)
            fetchProfile()
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        fetchProfile()
        setEditing(false)
    }

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-umass-maroon"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link href="/marketplace" className="text-xl font-bold text-umass-maroon">
                                UniTrade
                            </Link>
                            <Link href="/marketplace/listings" className="text-gray-700 hover:text-umass-maroon">
                                Browse Listings
                            </Link>
                            <Link href="/marketplace/my-listings" className="text-gray-700 hover:text-umass-maroon">
                                My Listings
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {user.name}!</span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Back Button */}
                    <Link
                        href="/marketplace/listings"
                        className="text-umass-maroon hover:text-red-800 mb-6 inline-block"
                    >
                        ← Back to Marketplace
                    </Link>

                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                                    <p className="text-gray-600 mt-1">{user.email}</p>
                                </div>
                                {!editing && (
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="bg-umass-maroon text-white px-4 py-2 rounded-md hover:bg-red-800"
                                    >
                                        ✏️ Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {editing ? (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Pronouns
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.pronouns}
                                            onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                                            placeholder="e.g., they/them, she/her, he/him"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Major
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.major}
                                            onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                                            placeholder="e.g., Computer Science"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="e.g., Southwest, Orchard Hill"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Bio
                                        </label>
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            placeholder="Tell others about yourself..."
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                                        />
                                    </div>

                                    <div className="flex space-x-3 pt-4 border-t">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-1 bg-umass-maroon text-white py-2 px-4 rounded-md hover:bg-red-800 disabled:opacity-50"
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            disabled={saving}
                                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                                            <p className="text-lg text-gray-900">{formData.name || 'Not set'}</p>
                                        </div>

                                        {formData.pronouns && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Pronouns</label>
                                                <p className="text-lg text-gray-900">{formData.pronouns}</p>
                                            </div>
                                        )}

                                        {formData.major && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Major</label>
                                                <p className="text-lg text-gray-900">{formData.major}</p>
                                            </div>
                                        )}

                                        {formData.location && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                                                <p className="text-lg text-gray-900">{formData.location}</p>
                                            </div>
                                        )}
                                    </div>

                                    {formData.bio && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Bio</label>
                                            <p className="text-gray-900 whitespace-pre-wrap">{formData.bio}</p>
                                        </div>
                                    )}

                                    {!formData.pronouns && !formData.major && !formData.location && !formData.bio && (
                                        <div className="text-center py-8 text-gray-500">
                                            <p className="mb-4">Your profile is incomplete</p>
                                            <button
                                                onClick={() => setEditing(true)}
                                                className="bg-umass-maroon text-white px-6 py-2 rounded-md hover:bg-red-800"
                                            >
                                                Complete Your Profile
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Account Info */}
                    <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Account Information</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                                <p className="text-gray-900">{user.email}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
                                <p className="text-gray-900">{user.role}</p>
                            </div>
                            {profileData?.rating && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Rating</label>
                                    <div className="flex items-center">
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={`text-lg ${i < Math.round(profileData.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                        <span className="text-gray-700 ml-2">
                                            {profileData.rating.toFixed(1)} ({profileData.ratingCount} reviews)
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
