import React, { useState, useEffect } from 'react';
import { Upload, X, Save, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { compressImage, getImageUrl } from '../lib/imageUtils';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ProfileView: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .maybeSingle();
          
        if (profile?.avatar_url) {
          setAvatar(getImageUrl(`avatars/${profile.avatar_url}`));
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading profile:', err);
      toast.error('Fehler beim Laden des Profils');
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const compressedFile = await compressImage(file);
      const fileName = `${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Update profile with new avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: fileName,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      setAvatar(getImageUrl(`avatars/${fileName}`));
      toast.success('Profilbild wurde aktualisiert');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast.error('Fehler beim Hochladen des Profilbilds');
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (profile?.avatar_url) {
        // Delete the old avatar file
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([profile.avatar_url]);

        if (deleteError) throw deleteError;
      }

      // Update profile to remove avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatar(null);
      toast.success('Profilbild wurde entfernt');
    } catch (err) {
      console.error('Error removing avatar:', err);
      toast.error('Fehler beim Entfernen des Profilbilds');
    }
  };

  const handleUpdateEmail = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({ email });
      
      if (error) throw error;
      
      toast.success('Eine Bestätigungs-E-Mail wurde gesendet');
    } catch (err) {
      console.error('Error updating email:', err);
      toast.error('Fehler beim Aktualisieren der E-Mail-Adresse');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Die Passwörter stimmen nicht überein');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;
      
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Passwort wurde aktualisiert');
    } catch (err) {
      console.error('Error updating password:', err);
      toast.error('Fehler beim Aktualisieren des Passworts');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      navigate('/');
      toast.success('Du wurdest erfolgreich abgemeldet');
    } catch (err) {
      console.error('Error signing out:', err);
      toast.error('Fehler beim Abmelden');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Profil</h1>

      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Profilbild</h2>
          <div className="flex items-center space-x-6">
            <div className="relative">
              {avatar ? (
                <div className="relative">
                  <img
                    src={avatar}
                    alt="Profilbild"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <label className="flex-1">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
              <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer text-center">
                Bild auswählen
              </div>
            </label>
          </div>
        </div>

        {/* Email Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">E-Mail-Adresse</h2>
          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="E-Mail-Adresse"
            />
            <button
              onClick={handleUpdateEmail}
              disabled={saving}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              E-Mail-Adresse aktualisieren
            </button>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Passwort ändern</h2>
          <div className="space-y-4">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Neues Passwort"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Passwort bestätigen"
            />
            <button
              onClick={handleUpdatePassword}
              disabled={saving || !newPassword || !confirmPassword}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Passwort aktualisieren
            </button>
          </div>
        </div>

        {/* Logout Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Abmelden</h2>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Abmelden
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;