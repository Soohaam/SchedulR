'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { createAppointmentType, updateAppointmentType, fetchAppointmentTypeById } from '@/lib/features/organizer/appointmentTypeSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldInput } from '@/components/ui/GoldInput';
import { GoldButton } from '@/components/ui/GoldButton';
import { Button } from '@/components/ui/Button';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { ArrowLeft, Save, Calendar, HelpCircle, Settings, FileText, Clock, Plus, Trash2, Upload, X, Image as ImageIcon, Users, Box } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CreateAppointmentTypePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;
  const { token } = useSelector((state: RootState) => state.auth);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
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

  // Fetch existing appointment data if in edit mode
  useEffect(() => {
    if (editId) {
      setIsFetching(true);
      dispatch(fetchAppointmentTypeById(editId))
        .unwrap()
        .then((appointment) => {
          // Pre-fill form data
          setFormData({
            title: appointment.title || '',
            description: appointment.description || '',
            duration: appointment.duration || 30,
            price: appointment.price || 0,
            type: appointment.type || 'USER',
            location: appointment.location || 'Online',
            color: appointment.color || '#C5A05C',
            introductoryMessage: appointment.introductoryMessage || '',
            confirmationMessage: appointment.confirmationMessage || '',
            manualConfirmation: appointment.manualConfirmation || false,
            requiresPayment: appointment.requiresPayment || false,
            autoAssignment: appointment.autoAssignment ?? true,
            manageCapacity: appointment.manageCapacity ?? true,
            maxBookingsPerSlot: appointment.maxBookingsPerSlot || 1,
            assignedStaffIds: appointment.assignedStaffIds || [],
            assignedResourceIds: appointment.assignedResourceIds || [],
          });

          // Pre-fill working hours
          if (appointment.workingHours && appointment.workingHours.length > 0) {
            setWorkingHours(appointment.workingHours);
          }

          // Pre-fill questions
          if (appointment.questions && appointment.questions.length > 0) {
            setQuestions(appointment.questions);
          }

          // Pre-fill cancellation policy
          if (appointment.cancellationPolicy) {
            setPolicy({
              allowCancellation: appointment.cancellationPolicy.allowCancellation ?? true,
              cancellationDeadlineHours: appointment.cancellationPolicy.cancellationDeadlineHours ?? 24,
              refundPercentage: appointment.cancellationPolicy.refundPercentage ?? 100,
              noShowPolicy: appointment.cancellationPolicy.noShowPolicy || '',
            });
          }

          // Pre-fill profile image
          if (appointment.profileImage) {
            setProfileImage(appointment.profileImage);
          }
        })
        .catch((error) => {
          console.error('Failed to fetch appointment:', error);
          alert('Failed to load appointment data');
        })
        .finally(() => {
          setIsFetching(false);
        });
    }
  }, [editId, dispatch]);

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

  const handleImageRemove = () => {
    setProfileImage(null);
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent, shouldPublish = false) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        workingHours,
        questions: questions.map((q, i) => ({ ...q, order: i })),
        cancellationPolicy: policy,
        isPublished: shouldPublish,
      };

      let appointmentId;

      if (isEditMode && editId) {
        // Update existing appointment
        const result = await dispatch(updateAppointmentType({ id: editId, data: payload })).unwrap();
        appointmentId = result.id || editId;
      } else {
        // Create new appointment
        const result = await dispatch(createAppointmentType(payload)).unwrap();
        appointmentId = result.appointmentType?.id || result.id;
      }

      // Upload image if selected
      if (selectedFile && appointmentId) {
        const imageFormData = new FormData();
        imageFormData.append('image', selectedFile);

        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organiser/appointment-types/${appointmentId}/upload-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: imageFormData,
        });
      }

      router.push('/organizer/appointments');
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} appointment type:`, error);
      alert(`Failed to ${isEditMode ? 'update' : 'create'} appointment type. Please check your inputs.`);
    } finally {
      setIsLoading(false);
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
            <h1 className="text-3xl font-bold text-primary font-['Georgia']">
              {isEditMode ? 'Edit Appointment Type' : 'Create Appointment Type'}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode ? 'Update your service details.' : 'Setup your new service.'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={(e) => handleSubmit(e, false)}
            disabled={isLoading || isFetching}
            className="font-semibold"
          >
            Save Draft
          </Button>
          <GoldButton
            onClick={(e) => handleSubmit(e, true)}
            disabled={isLoading || isFetching}
            isLoading={isLoading}
            className="min-w-[140px]"
          >
            {isEditMode ? 'Update & Publish' : 'Save & Publish'}
          </GoldButton>
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
              <GlassCard className="p-8 shadow-sm min-h-[500px]">

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
                        <GoldInput
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

                      {/* BOOK TYPE */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Book</label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-md has-[:checked]:bg-primary/5 has-[:checked]:border-primary transition-all">
                            <input
                              type="radio"
                              name="bookType"
                              className="accent-primary"
                              checked={formData.type === 'USER'}
                              onChange={() => setFormData({ ...formData, type: 'USER' })}
                            />
                            <Users className="w-4 h-4" />
                            <span>User / Staff</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-md has-[:checked]:bg-primary/5 has-[:checked]:border-primary transition-all">
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

                      {/* ASSIGNMENT TYPE */}
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
                              <span>Automatically (Round Robin)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="assignment"
                                className="accent-primary"
                                checked={!formData.autoAssignment}
                                onChange={() => setFormData({ ...formData, autoAssignment: false })}
                              />
                              <span>By visitor choice</span>
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Duration (minutes)</label>
                          <div className="relative max-w-[200px]">
                            <Clock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <GoldInput
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
                          <GoldInput
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
                        <GoldInput
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
                                  type="button"
                                  onClick={handleImageRemove}
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
                                {profileImage ? 'Change Image' : 'Choose Image'}
                              </Button>
                            </label>
                            {selectedFile && (
                              <p className="text-xs text-accent">
                                Selected: {selectedFile.name}
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
                              <GoldInput
                                type="time"
                                value={wh.startTime}
                                onChange={(e) => updateWorkingHour(index, 'startTime', e.target.value)}
                                className="w-32 h-9"
                              />
                              <span className="text-muted-foreground">-</span>
                              <GoldInput
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
                        <GoldInput
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
                      {/* Booking Settings */}
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

                      {/* Cancellation Policy */}
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
                              <GoldInput
                                type="number"
                                className="max-w-[150px]"
                                value={policy.cancellationDeadlineHours}
                                onChange={(e) => setPolicy({ ...policy, cancellationDeadlineHours: parseInt(e.target.value) })}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Refund Percentage (%)</label>
                              <GoldInput
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

                      {/* Messages */}
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

              </GlassCard>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
