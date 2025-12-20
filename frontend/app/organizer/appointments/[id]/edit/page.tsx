'use client';

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { fetchAppointmentTypeById, updateAppointmentType, publishAppointmentType, unpublishAppointmentType } from '@/lib/features/organizer/appointmentTypeSlice';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { ArrowLeft, Save, Calendar, HelpCircle, Settings, FileText, Clock, Plus, Trash2, Globe, Lock, Users, Box, Upload, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function EditAppointmentTypePage({ params }: { params: { id: string } }) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { token } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  // Dynamic Data
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    price: 0,
    type: 'USER',
    location: 'Online',
    color: '#C5A05C',
    introductoryMessage: '',
    confirmationMessage: '',
    manualConfirmation: false,
    requiresPayment: false,
    autoAssignment: true,
    manageCapacity: true,
    maxBookingsPerSlot: 1,
    assignedStaffIds: [] as string[],
    assignedResourceIds: [] as string[],
  });

  const [isPublished, setIsPublished] = useState(false);
  const [shareLink, setShareLink] = useState('');

  // Schedule State
  const [workingHours, setWorkingHours] = useState(
    DAYS.map((day, index) => ({
      dayOfWeek: index,
      isWorking: index >= 1 && index <= 5, // Mon-Fri default
      startTime: '09:00',
      endTime: '17:00',
    }))
  );

  // Questions State
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState({ text: '', type: 'SHORT_TEXT', required: false });

  // Policy State
  const [policy, setPolicy] = useState({
    allowCancellation: true,
    cancellationDeadlineHours: 24,
    refundPercentage: 100,
    noShowPolicy: '',
  });

  // Image Upload State
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await dispatch(fetchAppointmentTypeById(params.id)).unwrap();

        // Populate General Data
        setFormData({
          title: data.title || '',
          description: data.description || '',
          duration: data.duration || 30,
          price: data.price ? parseFloat(data.price) : 0,
          type: data.type || 'USER',
          location: data.location || '',
          color: data.color || '#C5A05C',
          introductoryMessage: data.introductoryMessage || '',
          confirmationMessage: data.confirmationMessage || '',
          manualConfirmation: data.manualConfirmation || false,
          requiresPayment: data.requiresPayment || false,
          autoAssignment: data.autoAssignment ?? true,
          manageCapacity: data.manageCapacity ?? true,
          maxBookingsPerSlot: data.maxBookingsPerSlot || 1,
          assignedStaffIds: data.hosts ? data.hosts.map((h: any) => h.id) : [],
          assignedResourceIds: data.resources ? data.resources.map((r: any) => r.id) : [],
        });

        setIsPublished(data.isPublished || false);
        setShareLink(data.shareLink || '');

        // Populate Working Hours
        if (data.workingHours && data.workingHours.length > 0) {
          const hoursMap = new Array(7).fill(null).map((_, i) => ({
            dayOfWeek: i,
            isWorking: false,
            startTime: '09:00',
            endTime: '17:00'
          }));

          data.workingHours.forEach((wh: any) => {
            hoursMap[wh.dayOfWeek] = {
              dayOfWeek: wh.dayOfWeek,
              isWorking: wh.isWorking,
              startTime: wh.startTime,
              endTime: wh.endTime,
            };
          });
          setWorkingHours(hoursMap);
        }

        // Populate Questions
        if (data.questions) {
          setQuestions(data.questions);
        }

        // Populate Policy
        if (data.cancellationPolicy) {
          setPolicy({
            allowCancellation: data.cancellationPolicy.allowCancellation,
            cancellationDeadlineHours: data.cancellationPolicy.cancellationDeadlineHours || 24,
            refundPercentage: data.cancellationPolicy.refundPercentage || 100,
            noShowPolicy: data.cancellationPolicy.noShowPolicy || '',
          });
        }

        // Set profile image if exists
        if (data.profileImage) {
          setProfileImage(data.profileImage);
        }

      } catch (error) {
        console.error('Failed to load appointment type:', error);
        alert('Failed to load appointment type details.');
      } finally {
        setIsFetching(false);
      }
    };

    if (params.id) {
      loadData();
    }
  }, [dispatch, params.id]);

  // Fetch Staff and Resources
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const [staffRes, resourceRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organiser/staff`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organiser/resources`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setStaffMembers(staffRes.data.data || []);
        setResources(resourceRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch staff/resources:', error);
      }
    };
    fetchData();
  }, [token]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organiser/appointment-types/${params.id}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setProfileImage(data.profileImage);
      setSelectedFile(null);
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageDelete = async () => {
    if (!profileImage) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organiser/appointment-types/${params.id}/image`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Delete failed');

      setProfileImage(null);
      setSelectedFile(null);
      alert('Image deleted successfully!');
    } catch (error) {
      console.error('Image delete error:', error);
      alert('Failed to delete image');
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        workingHours,
        questions: questions.map((q, i) => ({ ...q, order: i })),
        cancellationPolicy: policy,
      };

      await dispatch(updateAppointmentType({ id: params.id, data: payload })).unwrap();
      router.push('/organizer/appointments');
    } catch (error) {
      console.error('Failed to update appointment type:', error);
      alert('Failed to update appointment type. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishToggle = async () => {
    try {
      if (isPublished) {
        await dispatch(unpublishAppointmentType(params.id)).unwrap();
        setIsPublished(false);
      } else {
        await dispatch(publishAppointmentType(params.id)).unwrap();
        setIsPublished(true);
      }
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      alert('Failed to update publish status.');
    }
  };

  const addQuestion = () => {
    if (!newQuestion.text) return;
    setQuestions([...questions, {
      questionText: newQuestion.text,
      questionType: newQuestion.type,
      isRequired: newQuestion.required
    }]);
    setNewQuestion({ text: '', type: 'SHORT_TEXT', required: false });
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateWorkingHour = (index: number, field: string, value: any) => {
    const newHours = [...workingHours];
    newHours[index] = { ...newHours[index], [field]: value };
    setWorkingHours(newHours);
  };

  if (isFetching) {
    return <div className="text-center py-12 text-muted-foreground">Loading details...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/organizer/appointments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-primary font-['Georgia']">Edit Appointment Type</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              Modify your service details.
              {isPublished && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Published
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* NEW: Meetings Button */}
          <Link href={`/organizer/meetings?type=${params.id}`}>
            <Button variant="outline">
              Meetings
            </Button>
          </Link>

          {isPublished ? (
            <Button
              variant="outline"
              onClick={handlePublishToggle}
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              <Lock className="w-4 h-4 mr-2" /> Unpublish
            </Button>
          ) : (
            <Button
              onClick={handlePublishToggle}
              variant="outline"
            >
              <Globe className="w-4 h-4 mr-2" /> Publish
            </Button>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="metallic-gold-bg text-accent-foreground shadow-lg shadow-accent/20 min-w-[120px]"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
            {!isLoading && <Save className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
          {[
            { id: 'general', label: 'General Info', icon: FileText },
            { id: 'schedule', label: 'Availability', icon: Calendar },
            { id: 'questions', label: 'Questions', icon: HelpCircle },
            { id: 'options', label: 'Options & Policy', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-primary/10 text-primary border-l-4 border-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-8 bg-card border-border/50 shadow-sm min-h-[500px]">

                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-accent" />
                      General Information
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Title</label>
                        <Input
                          required
                          placeholder="e.g. Dental Consultation"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="max-w-md"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Description</label>
                        <textarea
                          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Describe the service..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>

                      {/* NEW: Book Type (User vs Resource) */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Book</label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="bookType"
                              className="accent-primary"
                              checked={formData.type === 'USER'}
                              onChange={() => setFormData({ ...formData, type: 'USER' })}
                            />
                            <Users className="w-4 h-4" />
                            <span>User</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="bookType"
                              className="accent-primary"
                              checked={formData.type === 'RESOURCE'}
                              onChange={() => setFormData({ ...formData, type: 'RESOURCE' })}
                            />
                            <Box className="w-4 h-4" />
                            <span>Resources</span>
                          </label>
                        </div>
                      </div>

                      {/* HOST/RESOURCE SELECTION */}
                      {formData.type === 'USER' ? (
                        <div className="space-y-2">
                          <MultiSelect
                            label="Available Staff (Hosts)"
                            placeholder="Select staff members..."
                            options={staffMembers.map(s => ({ id: s.id, label: s.name, subLabel: s.email }))}
                            selected={formData.assignedStaffIds}
                            onChange={(selected) => setFormData({ ...formData, assignedStaffIds: selected })}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <MultiSelect
                            label="Available Resources"
                            placeholder="Select resources..."
                            options={resources.map(r => ({ id: r.id, label: r.name, subLabel: r.description }))}
                            selected={formData.assignedResourceIds}
                            onChange={(selected) => setFormData({ ...formData, assignedResourceIds: selected })}
                          />
                        </div>
                      )}

                      {/* NEW: Assignment Type (Wireframe: Automatically vs By Visitor) */}
                      {formData.type === 'USER' && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Assignment</label>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="assignment"
                                className="accent-primary"
                                checked={formData.autoAssignment}
                                onChange={() => setFormData({ ...formData, autoAssignment: true })}
                              />
                              <span>Automatically</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="assignment"
                                className="accent-primary"
                                checked={!formData.autoAssignment}
                                onChange={() => setFormData({ ...formData, autoAssignment: false })}
                              />
                              <span>By visitor</span>
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Duration (minutes)</label>
                          <div className="relative max-w-[200px]">
                            <Clock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="number"
                              min="5"
                              className="pl-9"
                              value={formData.duration}
                              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Price ($)</label>
                          <Input
                            type="number"
                            min="0"
                            className="max-w-[200px]"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Location</label>
                        <Input
                          placeholder="e.g. Clinic, Zoom, Google Meet"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="max-w-md"
                        />
                      </div>

                      {/* Profile Image Upload */}
                      <div className="pt-4 border-t border-border">
                        <label className="text-sm font-medium mb-3 block">Profile Image</label>
                        <div className="flex items-start gap-6">
                          {/* Image Preview */}
                          <div className="flex-shrink-0">
                            {profileImage ? (
                              <div className="relative group">
                                <img
                                  src={profileImage}
                                  alt="Profile"
                                  className="w-32 h-32 rounded-lg object-cover border-2 border-border"
                                />
                                <button
                                  onClick={handleImageDelete}
                                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-secondary/20">
                                <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>

                          {/* Upload Controls */}
                          <div className="flex-1 space-y-3">
                            <p className="text-xs text-muted-foreground">
                              Upload an image for your appointment type. Max size: 5MB. Supported formats: JPG, PNG, GIF, WEBP
                            </p>
                            <div className="flex gap-2">
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageSelect}
                                  className="hidden"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                                  }}
                                >
                                  <Upload className="w-4 h-4" />
                                  Choose Image
                                </Button>
                              </label>
                              {selectedFile && (
                                <Button
                                  type="button"
                                  onClick={handleImageUpload}
                                  disabled={isUploadingImage}
                                  size="sm"
                                  className="bg-accent text-accent-foreground"
                                >
                                  {isUploadingImage ? 'Uploading...' : 'Upload'}
                                </Button>
                              )}
                            </div>
                            {selectedFile && !isUploadingImage && (
                              <p className="text-xs text-accent">
                                Selected: {selectedFile.name} - Click "Upload" to save
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCHEDULE TAB */}
                {activeTab === 'schedule' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-accent" />
                      Weekly Availability
                    </h2>
                    <div className="space-y-4 border rounded-lg p-4 bg-background/50">
                      {workingHours.map((wh, index) => (
                        <div key={index} className="flex items-center gap-4 py-3 border-b border-border/40 last:border-0">
                          <div className="w-32 flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={wh.isWorking}
                              onChange={(e) => updateWorkingHour(index, 'isWorking', e.target.checked)}
                              className="w-4 h-4 accent-primary"
                            />
                            <span className={`text-sm font-medium ${wh.isWorking ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {DAYS[wh.dayOfWeek]}
                            </span>
                          </div>
                          {wh.isWorking ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={wh.startTime}
                                onChange={(e) => updateWorkingHour(index, 'startTime', e.target.value)}
                                className="w-32 h-9"
                              />
                              <span className="text-muted-foreground">-</span>
                              <Input
                                type="time"
                                value={wh.endTime}
                                onChange={(e) => updateWorkingHour(index, 'endTime', e.target.value)}
                                className="w-32 h-9"
                              />
                              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Unavailable</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* QUESTIONS TAB */}
                {activeTab === 'questions' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-accent" />
                      Booking Questions
                    </h2>

                    <div className="space-y-4 mb-8">
                      {questions.length === 0 ? (
                        <p className="text-muted-foreground text-sm italic">No custom questions added yet.</p>
                      ) : (
                        questions.map((q, i) => (
                          <div key={i} className="flex items-center justify-between p-3 border rounded-md bg-secondary/20">
                            <div>
                              <p className="font-medium text-sm">{q.questionText}</p>
                              <span className="text-xs text-muted-foreground uppercase">{q.questionType} • {q.isRequired ? 'Required' : 'Optional'}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeQuestion(i)} className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-4 bg-secondary/10 rounded-lg border border-border/50 space-y-4">
                      <h3 className="text-sm font-semibold">Add New Question</h3>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Question</label>
                        <Input
                          value={newQuestion.text}
                          onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                          placeholder="e.g. Any allergies?"
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-xs font-medium mb-1 block">Type</label>
                          <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={newQuestion.type}
                            onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
                          >
                            <option value="SHORT_TEXT">Short Text</option>
                            <option value="LONG_TEXT">Long Text</option>
                            <option value="YES_NO">Yes/No</option>
                            <option value="NUMBER">Number</option>
                          </select>
                        </div>
                        <div className="flex items-end pb-2">
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newQuestion.required}
                              onChange={(e) => setNewQuestion({ ...newQuestion, required: e.target.checked })}
                              className="w-4 h-4 accent-primary"
                            />
                            Required
                          </label>
                        </div>
                      </div>
                      <Button onClick={addQuestion} variant="secondary" className="w-full">
                        <Plus className="w-4 h-4 mr-2" /> Add Question
                      </Button>
                    </div>
                  </div>
                )}

                {/* OPTIONS TAB */}
                {activeTab === 'options' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-accent" />
                      Options & Policy
                    </h2>

                    <div className="space-y-6">

                      {/* NEW: Options Features (Manual Confirmation, Paid Booking) */}
                      <div className="space-y-4">
                        <h3 className="text-md font-medium border-b pb-2">Booking Settings</h3>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="manualConfirmation"
                              checked={formData.manualConfirmation}
                              onChange={(e) => setFormData({ ...formData, manualConfirmation: e.target.checked })}
                              className="w-4 h-4 accent-primary"
                            />
                            <label htmlFor="manualConfirmation" className="text-sm">Manual confirmation required</label>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="requiresPayment"
                              checked={formData.requiresPayment}
                              onChange={(e) => setFormData({ ...formData, requiresPayment: e.target.checked })}
                              className="w-4 h-4 accent-primary"
                            />
                            <label htmlFor="requiresPayment" className="text-sm">Requires payment (Paid Booking)</label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-md font-medium border-b pb-2">Cancellation Policy</h3>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="allowCancel"
                            checked={policy.allowCancellation}
                            onChange={(e) => setPolicy({ ...policy, allowCancellation: e.target.checked })}
                            className="w-4 h-4 accent-primary"
                          />
                          <label htmlFor="allowCancel" className="text-sm">Allow customers to cancel</label>
                        </div>

                        {policy.allowCancellation && (
                          <div className="pl-6 space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-1 block">Cancellation Deadline (hours before)</label>
                              <Input
                                type="number"
                                className="max-w-[150px]"
                                value={policy.cancellationDeadlineHours}
                                onChange={(e) => setPolicy({ ...policy, cancellationDeadlineHours: parseInt(e.target.value) })}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Refund Percentage (%)</label>
                              <Input
                                type="number"
                                className="max-w-[150px]"
                                min="0" max="100"
                                value={policy.refundPercentage}
                                onChange={(e) => setPolicy({ ...policy, refundPercentage: parseInt(e.target.value) })}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-md font-medium border-b pb-2">Messages</h3>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Introductory Message</label>
                          <p className="text-xs text-muted-foreground mb-2">Shown on the booking page.</p>
                          <textarea
                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.introductoryMessage}
                            onChange={(e) => setFormData({ ...formData, introductoryMessage: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Confirmation Message</label>
                          <p className="text-xs text-muted-foreground mb-2">Sent in the confirmation email.</p>
                          <textarea
                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.confirmationMessage}
                            onChange={(e) => setFormData({ ...formData, confirmationMessage: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
