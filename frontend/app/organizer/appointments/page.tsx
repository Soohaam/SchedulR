'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchAppointmentTypes, publishAppointmentType, unpublishAppointmentType, deleteAppointmentType } from '@/lib/features/organizer/appointmentTypeSlice';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Clock, ExternalLink, Edit, MoreVertical, Copy, Globe, Upload, X, Image as ImageIcon, Calendar, Trash2 } from 'lucide-react';
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
          <div className="text-center py-16">
            <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-accent border-t-transparent shadow-lg" />
            <p className="text-muted-foreground mt-4 text-lg font-medium">Loading your appointments...</p>
          </div>
        ) : types.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-primary/5 to-accent/5 animate-pulse" />
            <Calendar className="w-24 h-24 text-accent/30 mx-auto mb-6 relative z-10" />
            <p className="text-muted-foreground mb-6 text-lg font-medium relative z-10">You haven't created any appointment types yet.</p>
            <Link href="/organizer/appointments/create">
              <Button className="bg-gradient-to-r from-accent via-accent/90 to-accent/80 hover:from-accent/90 hover:via-accent/80 hover:to-accent/70 text-accent-foreground shadow-xl shadow-accent/30 hover:shadow-2xl hover:shadow-accent/40 transition-all duration-300 hover:scale-105 relative z-10 text-base px-6 py-6">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Appointment
              </Button>
            </Link>
          </motion.div>
        ) : (
          types.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ scale: 1.01 }}
              className="group relative"
            >
              <Card className="p-6 bg-gradient-to-br from-card/95 via-card/85 to-card/75 backdrop-blur-xl border-border/50 shadow-lg hover:shadow-2xl transition-all duration-300 border-l-4 border-l-accent hover:border-l-primary flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-accent/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Left: Info */}
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center gap-4 mb-2">
                    {/* Profile Image Circle */}
                    {type.profileImage ? (
                      <motion.img
                        whileHover={{ scale: 1.15, rotate: 8 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        src={type.profileImage}
                        alt={type.title || type.name}
                        className="w-16 h-16 rounded-full object-cover border-3 border-accent/50 shadow-xl shadow-accent/20 ring-2 ring-accent/20"
                      />
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: -8 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-accent/40 via-accent/25 to-accent/15 flex items-center justify-center border-3 border-accent/40 shadow-xl shadow-accent/15 ring-2 ring-accent/20"
                      >
                        <Calendar className="w-8 h-8 text-accent" />
                      </motion.div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors duration-300 truncate mb-1">
                        {type.title || type.name}
                      </h3>
                      {/* Published Badge - Inline */}
                      {type.isPublished && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
                          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-md shadow-emerald-500/20"
                        >
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                          Live
                        </motion.span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground ml-20">
                    <motion.span whileHover={{ scale: 1.05 }} className="flex items-center gap-2 font-semibold bg-accent/10 px-3 py-1.5 rounded-full">
                      <Clock className="w-4 h-4 text-accent" />
                      {type.duration} Min
                    </motion.span>
                    <div className="flex items-center gap-2">
                      <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/15 flex items-center justify-center text-xs font-bold border border-primary/30 shadow-md">R1</motion.div>
                      <motion.div whileHover={{ scale: 1.1, rotate: -5 }} className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/30 to-accent/15 flex items-center justify-center text-xs font-bold border border-accent/30 shadow-md">R2</motion.div>
                    </div>
                    <motion.span whileHover={{ scale: 1.05 }} className="hidden md:inline-flex items-center gap-2 font-semibold bg-primary/10 px-3 py-1.5 rounded-full">
                      <Calendar className="w-4 h-4 text-primary" />
                      {type.statistics?.upcomingBookings || 0} Upcoming
                    </motion.span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0 relative z-10">
                  {/* Publish/Unpublish Button */}
                  {type.isPublished ? (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Unpublish this appointment? Customers won\'t be able to book it.')) {
                            dispatch(unpublishAppointmentType(type.id));
                          }
                        }}
                        className="h-10 border-2 border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/60 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Unpublish
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dispatch(publishAppointmentType(type.id))}
                        className="h-10 border-2 border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 hover:border-green-500/60 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Publish
                      </Button>
                    </motion.div>
                  )}

                  {/* Share Button */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyLink(type.shareLink || '')}
                      className="h-10 hover:bg-accent/15 hover:border-accent/60 hover:text-accent transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </motion.div>

                  {/* Image Upload Button */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUploadModal(type.id)}
                      className="h-10 hover:bg-primary/15 hover:border-primary/60 hover:text-primary transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Image
                    </Button>
                  </motion.div>

                  {/* Edit Button */}
                  <Link href={`/organizer/appointments/create?edit=${type.id}`}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 hover:bg-blue-500/15 hover:border-blue-500/60 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </motion.div>
                  </Link>

                  {/* Delete Button */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete "${type.title || type.name}"? This cannot be undone!`)) {
                          dispatch(deleteAppointmentType(type.id));
                        }
                      }}
                      className="h-10 border-2 border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 hover:border-red-500/60 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </motion.div>
                </div>
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
