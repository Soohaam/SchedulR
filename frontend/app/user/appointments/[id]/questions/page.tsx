'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

interface Question {
    id: string;
    question: string;
    type: 'TEXT' | 'TEXTAREA' | 'RADIO' | 'CHECKBOX';
    required: boolean;
    options?: string[];
    order: number;
}

export default function QuestionsPage() {
    const router = useRouter();
    const params = useParams();
    const appointmentId = params?.id as string;
    const { user } = useSelector((state: RootState) => state.auth);

    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [loading, setLoading] = useState(true);
    const [bookingData, setBookingData] = useState<any>(null);

    useEffect(() => {
        // Get booking data from sessionStorage
        const stored = sessionStorage.getItem('bookingData');
        if (!stored) {
            router.push(`/user/appointments/${appointmentId}/book`);
            return;
        }

        const data = JSON.parse(stored);
        setBookingData(data);
        fetchQuestions();
    }, [appointmentId]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/v1/appointments/${appointmentId}/details`);
            const fetchedQuestions = response.data.appointmentType.questions || [];
            setQuestions(fetchedQuestions.sort((a: Question, b: Question) => a.order - b.order));
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId: string, value: string | string[]) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleContinue = () => {
        // Validate required questions
        const unanswered = questions.filter(q =>
            q.required && (!answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0))
        );

        if (unanswered.length > 0) {
            alert('Please answer all required questions');
            return;
        }

        // Format answers for backend
        const formattedAnswers = questions.map(q => ({
            questionId: q.id,
            question: q.question,
            answer: Array.isArray(answers[q.id])
                ? answers[q.id].join(', ')
                : answers[q.id] || ''
        }));

        // Update booking data with answers
        const updatedBookingData = {
            ...bookingData,
            answers: formattedAnswers
        };

        sessionStorage.setItem('bookingData', JSON.stringify(updatedBookingData));

        // Navigate to payment or confirmation based on requiresPayment
        if (bookingData.appointment.requiresPayment) {
            router.push(`/user/appointments/${appointmentId}/payment`);
        } else {
            router.push(`/user/appointments/${appointmentId}/confirm`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/user/appointments/${appointmentId}/book`)}
                        className="flex items-center gap-2 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-primary">Additional Information</h1>
                    <p className="text-muted-foreground mt-1">Please answer the following questions</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {questions.length === 0 ? (
                    <Card className="p-8 text-center">
                        <HelpCircle className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-primary mb-2">No questions required</h3>
                        <p className="text-muted-foreground mb-6">You can proceed directly to the next step</p>
                        <Button onClick={handleContinue} className="bg-accent text-accent-foreground">
                            Continue
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {questions.map((question, index) => (
                            <motion.div
                                key={question.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <Card className="p-6">
                                    <label className="block mb-4">
                                        <div className="flex items-start gap-2 mb-3">
                                            <span className="text-lg font-semibold text-primary">
                                                {index + 1}. {question.question}
                                            </span>
                                            {question.required && (
                                                <span className="text-red-500 text-sm">*</span>
                                            )}
                                        </div>

                                        {question.type === 'TEXT' && (
                                            <Input
                                                type="text"
                                                value={(answers[question.id] as string) || ''}
                                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                placeholder="Your answer"
                                                required={question.required}
                                                className="bg-background"
                                            />
                                        )}

                                        {question.type === 'TEXTAREA' && (
                                            <textarea
                                                value={(answers[question.id] as string) || ''}
                                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                placeholder="Your answer"
                                                required={question.required}
                                                rows={4}
                                                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                            />
                                        )}

                                        {question.type === 'RADIO' && question.options && (
                                            <div className="space-y-2">
                                                {question.options.map((option, optIndex) => (
                                                    <label key={optIndex} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name={question.id}
                                                            value={option}
                                                            checked={answers[question.id] === option}
                                                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                            className="w-4 h-4 text-accent"
                                                        />
                                                        <span className="text-foreground">{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {question.type === 'CHECKBOX' && question.options && (
                                            <div className="space-y-2">
                                                {question.options.map((option, optIndex) => (
                                                    <label key={optIndex} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            value={option}
                                                            checked={(answers[question.id] as string[] || []).includes(option)}
                                                            onChange={(e) => {
                                                                const current = (answers[question.id] as string[]) || [];
                                                                const newValue = e.target.checked
                                                                    ? [...current, option]
                                                                    : current.filter(v => v !== option);
                                                                handleAnswerChange(question.id, newValue);
                                                            }}
                                                            className="w-4 h-4 text-accent"
                                                        />
                                                        <span className="text-foreground">{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </label>
                                </Card>
                            </motion.div>
                        ))}

                        <div className="flex justify-end gap-4 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/user/appointments/${appointmentId}/book`)}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleContinue}
                                className="bg-accent text-accent-foreground hover:bg-accent/90"
                            >
                                Continue to {bookingData?.appointment?.requiresPayment ? 'Payment' : 'Confirmation'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
