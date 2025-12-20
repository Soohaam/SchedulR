'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchAppointmentTypes } from '@/lib/features/organizer/appointmentTypeSlice';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Clock, ExternalLink, Edit, MoreVertical, Copy, Globe, Upload, X, Image as ImageIcon, Calendar } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppointmentTypesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { types, isLoading } = useSelector((state: RootState) => state.appointmentType);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchAppointmentTypes());
  }, [dispatch]);

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  const openUploadModal = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setUploadModalOpen(true);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setSelectedAppointmentId(null);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedAppointmentId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organiser/appointment-types/${selectedAppointmentId}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      alert('Image uploaded successfully!');
      closeUploadModal();
      dispatch(fetchAppointmentTypes()); // Refresh list
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary font-['Georgia']">Appointments View</h1>
          </div>
          <p className="text-muted-foreground mt-2 ml-1">Manage your appointment types and availability.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Reporting</Button>
          <Button variant="outline">Settings</Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Link href="/organizer/appointments/create">
          <Button className="metallic-gold-bg text-accent-foreground shadow-lg shadow-accent/20">
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </Link>
        <div className="relative w-1/3">
          <input type="text" placeholder="Search" className="w-full bg-secondary/30 border border-border/50 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground text-center py-12">Loading appointment types...</p>
        ) : types.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border/50">
            <p className="text-muted-foreground mb-4">You haven't created any appointment types yet.</p>
            <Link href="/organizer/appointments/create">
              <Button variant="outline">Create your first one</Button>
            </Link>
          </div>
        ) : (
          types.map((type) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative"
            >
              <Card className="p-6 bg-card border-border/50 shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary flex flex-col md:flex-row items-center gap-6">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    {/* Profile Image Circle */}
                    {type.profileImage ? (
                      <img
                        src={type.profileImage}
                        alt={type.title || type.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-accent/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border-2 border-accent/20">
                        <Calendar className="w-6 h-6 text-accent/60" />
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-foreground truncate">{type.title || type.name}</h3>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground ml-15">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                      {type.duration} Min Duration
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-[10px] font-bold">R1</div>
                      <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-[10px] font-bold">R2</div>
                    </div>
                    <span className="hidden md:inline-block">
                      {type.statistics?.upcomingBookings || 0} Meeting Upcoming
                    </span>
                  </div>
                </div>

                {/* Middle: Actions */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink(type.shareLink || '')}
                    className="h-9"
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openUploadModal(type.id)}
                    className="h-9"
                  >
                    <Upload className="w-3 h-3 mr-2" />
                    Image
                  </Button>
                  <Link href={`/organizer/appointments/${type.id}`}>
                    <Button variant="outline" size="sm" className="h-9">
                      <Edit className="w-3 h-3 mr-2" />
                      Edit
                    </Button>
                  </Link>
                </div>

                {/* Right: Status Badge */}
                {type.isPublished && (
                  <div className="absolute -top-3 -right-3 md:top-auto md:bottom-auto md:right-8 transform rotate-12 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-2 border-green-600/20 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm shadow-sm pointer-events-none">
                    Published
                  </div>
                )}
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {uploadModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeUploadModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 border border-border"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary">Upload Profile Image</h2>
                <button onClick={closeUploadModal} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Preview */}
                <div className="flex justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-48 h-48 rounded-lg object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-48 h-48 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-secondary/20">
                      <ImageIcon className="w-16 h-16 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Max size: 5MB. Supported formats: JPG, PNG, GIF, WEBP
                </p>

                {/* File Input */}
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {previewUrl ? 'Change Image' : 'Choose Image'}
                  </Button>
                </label>

                {selectedFile && (
                  <p className="text-xs text-accent text-center">
                    Selected: {selectedFile.name}
                  </p>
                )}

                {/* Upload Button */}
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="w-full bg-accent text-accent-foreground"
                >
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
