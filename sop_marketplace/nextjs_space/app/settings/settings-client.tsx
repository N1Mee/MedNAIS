
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import {
  User,
  Mail,
  Briefcase,
  Trash,
  Loader2,
  Save,
  AlertCircle,
} from "lucide-react";
import { ImageUpload } from "@/components/image-upload";

interface SettingsClientProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    bio: string | null;
    role: string;
  };
}

export function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter();
  const { data: session, update } = useSession() || {};
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: user.name || "",
    bio: user.bio || "",
    role: user.role,
    image: user.image || "",
  });

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      // Update NextAuth session to reflect the new name/image in the header
      if (update) {
        await update({
          ...session,
          user: {
            ...session?.user,
            name: formData.name,
            image: formData.image,
          },
        });
      }

      toast.success("Profile updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      return;
    }

    if (
      !confirm(
        "This will permanently delete all your data including SOPs. Are you absolutely sure?"
      )
    ) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch("/api/users/me", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      toast.success("Account deleted successfully");
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Profile Picture
            </label>
            <div className="max-w-xs">
              <ImageUpload
                value={formData.image}
                onChange={(value) =>
                  setFormData({ ...formData, image: value })
                }
                onRemove={() => setFormData({ ...formData, image: "" })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              rows={4}
              placeholder="Tell others about yourself..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-700 appearance-none"
              >
                <option value="buyer">Buyer - Browse and view SOPs</option>
                <option value="seller">Seller - Create and sell SOPs</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Sellers can create and manage SOPs
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-red-200 dark:border-red-900">
        <h2 className="text-xl font-semibold mb-4 text-red-600">
          Danger Zone
        </h2>

        <div className="flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Delete Account</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Once you delete your account, there is no going back. This will
              permanently delete all your data including SOPs.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4" />
                  Delete Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
