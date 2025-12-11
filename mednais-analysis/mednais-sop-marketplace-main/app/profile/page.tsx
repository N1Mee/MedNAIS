'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, X, User as UserIcon, Mail, MapPin, Globe, Twitter, Linkedin, Github, Calendar, FileText, ShoppingBag, Star, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  twitter: string | null;
  linkedin: string | null;
  github: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    sops: number;
    purchasedSOPs: number;
    ratings: number;
    executions: number;
  };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    twitter: '',
    linkedin: '',
    github: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          twitter: data.twitter || '',
          linkedin: data.linkedin || '',
          github: data.github || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError('');

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, avatar_url: data.avatar_url } : null);
        setSuccess('Avatar updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to upload avatar');
      }
    } catch (error) {
      setError('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      });

      if (response.ok) {
        setProfile(prev => prev ? { ...prev, avatar_url: null } : null);
        setSuccess('Avatar removed successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError('Failed to remove avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-[#E63946]" />
        </div>
      </PageLayout>
    );
  }

  if (!profile) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">Profile not found</p>
        </div>
      </PageLayout>
    );
  }

  const initials = profile.name?.split(' ').map(n => n[0]).join('').toUpperCase() || profile.email[0].toUpperCase();

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-500 mt-1">Manage your personal information and preferences</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar & Stats */}
          <div className="space-y-6">
            {/* Avatar Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.name || ''} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={uploadingAvatar}
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload
                  </Button>
                  
                  {profile.avatar_url && (
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={uploadingAvatar}
                      onClick={handleRemoveAvatar}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                
                <p className="text-xs text-gray-500 text-center">
                  JPG, PNG or WebP. Max 5MB.
                </p>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>SOPs Created</span>
                  </div>
                  <span className="font-semibold">{profile?._count?.sops || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ShoppingBag className="h-4 w-4" />
                    <span>SOPs Purchased</span>
                  </div>
                  <span className="font-semibold">{profile?._count?.purchasedSOPs || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Play className="h-4 w-4" />
                    <span>Executions</span>
                  </div>
                  <span className="font-semibold">{profile?._count?.executions || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Star className="h-4 w-4" />
                    <span>Reviews Given</span>
                  </div>
                  <span className="font-semibold">{profile?._count?.ratings || 0}</span>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Member since {
                        profile?.createdAt 
                          ? formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })
                          : 'recently'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your profile information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        value={profile.email}
                        disabled
                        className="pl-10 bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500">{formData.bio.length}/500</p>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="San Francisco, CA"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://yourwebsite.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Social Links</h3>
                    
                    {/* Twitter */}
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter</Label>
                      <div className="relative">
                        <Twitter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="twitter"
                          value={formData.twitter}
                          onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                          placeholder="@username"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* LinkedIn */}
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="linkedin"
                          value={formData.linkedin}
                          onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                          placeholder="linkedin.com/in/username"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* GitHub */}
                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub</Label>
                      <div className="relative">
                        <Github className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="github"
                          value={formData.github}
                          onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                          placeholder="github.com/username"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/dashboard')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-[#E63946] hover:bg-[#D62839] text-white"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
