'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { createAppointmentType } from '@/lib/features/organizer/appointmentTypeSlice';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Calendar, HelpCircle, Settings, FileText, Clock, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CreateAppointmentTypePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

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

      await dispatch(createAppointmentType(payload)).unwrap();
      router.push('/organizer/appointments');
    } catch (error) {
      console.error('Failed to create appointment type:', error);
      alert('Failed to create appointment type. Please check your inputs.');
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
            <h1 className="text-3xl font-bold text-primary font-['Georgia']">Create Appointment Type</h1>
            <p className="text-muted-foreground">Setup your new service.</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="metallic-gold-bg text-accent-foreground shadow-lg shadow-accent/20 min-w-[120px]"
        >
          {isLoading ? 'Saving...' : 'Save & Publish'}
          {!isLoading && <Save className="w-4 h-4 ml-2" />}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
          {[
            { id: 'general', label: 'General Info', icon: FileText },
            { id: 'schedule', label: 'Availability', icon: Calendar },
            { id: 'questions', label: 'Questions', icon: HelpCircle },
            { id: 'options', label: 'Options/Policy', icon: Settings },
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
