import { useState, useEffect } from 'react';
import { getAdminProfile, saveAdminProfile } from '@/lib/store';

const AdminProfile = () => {
  const [profile, setProfile] = useState(getAdminProfile());

  useEffect(() => {
    setProfile(getAdminProfile());
  }, []);

  if (!profile) return <div>No profile found</div>;

  const handleChange = (field: string, value: string) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    saveAdminProfile(updated);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange('photo', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-6">Admin Profile</h2>

      <div className="flex items-center gap-6 mb-6">
        <img
          src={profile.photo || 'https://via.placeholder.com/100'}
          className="w-24 h-24 rounded-full object-cover"
        />
        <input type="file" onChange={handlePhoto} />
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-500">Name</label>
          <input
            value={profile.name}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        <div>
          <label className="text-sm text-gray-500">Email</label>
          <input
            value={profile.email}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        <div>
          <label className="text-sm text-gray-500">Phone</label>
          <input
            value={profile.phone || ''}
            onChange={e => handleChange('phone', e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter phone number"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
