
import React, { useState, useEffect } from 'react';
import { Card, Table, TableRow, TableCell, Input, Button, Badge, Select, Skeleton } from '../components/ui';
import { api } from '../services/api';
import { Save, RefreshCw, ChevronLeft } from 'lucide-react';
import { useToast } from '../components/Toast';
import { ScoreEntry as ScoreEntryType, EventItem } from '../types';

export const ScoreEntry: React.FC = () => {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [scores, setScores] = useState<ScoreEntryType[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [loadingScores, setLoadingScores] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { addToast } = useToast();

    // Fetch Events on mount
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await api.getEvents();
                setEvents(response.data);
                if (response.data.length > 0) {
                    setSelectedEventId(response.data[0].id);
                }
            } catch (e) {
                addToast("Failed to load events", "error");
            } finally {
                setLoadingEvents(false);
            }
        };
        fetchEvents();
    }, [addToast]);

    // Fetch scores when event changes
    useEffect(() => {
        if (!selectedEventId) return;

        const fetchScores = async () => {
            setLoadingScores(true);
            try {
                const response = await api.getScores(selectedEventId);
                setScores(response.data);
            } catch (e) {
                addToast("Failed to load scores for selected event", "error");
            } finally {
                setLoadingScores(false);
            }
        };

        fetchScores();
    }, [selectedEventId, addToast]);

    const handleScoreChange = (index: number, field: string, value: string) => {
        const newScores = [...scores];
        // @ts-ignore
        newScores[index][field] = Number(value);
        // Auto calculate total
        newScores[index].total = newScores[index].judge1 + newScores[index].judge2 + newScores[index].judge3;
        setScores(newScores);
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await api.saveScores(selectedEventId, scores);
            addToast("Scores saved successfully!", "success");
        } catch (err: any) {
            addToast(err.message || "Failed to save scores", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const eventOptions = events.map(e => ({
        value: e.id,
        label: `${e.name} (${e.type}) - ${e.status}`
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                 <Button variant="ghost" size="sm" className="pl-0">
                    <ChevronLeft className="w-5 h-5 mr-1" /> Back
                 </Button>
                 <div>
                     <h1 className="text-2xl font-bold text-gray-900">Score Entry</h1>
                     <p className="text-sm text-gray-500">Enter and verify marks for finished events.</p>
                 </div>
            </div>

            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2">
                        {loadingEvents ? (
                            <Skeleton className="h-10 w-full" />
                        ) : (
                            <Select 
                                label="Select Event"
                                options={eventOptions}
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                className="mb-0"
                            />
                        )}
                    </div>
                    <div>
                        <Button variant="secondary" className="w-full mb-[2px]" onClick={() => setSelectedEventId(selectedEventId)}>
                            <RefreshCw className="w-4 h-4 mr-2" /> Reload
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="bg-white rounded-[6px] shadow-card border border-border-color overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-border-color flex justify-between items-center">
                    <div className="flex space-x-2">
                         <Badge variant="primary">Max Score: 100</Badge>
                         <Badge variant="warning">Min Pass: 35</Badge>
                    </div>
                    <Button variant="primary" onClick={handleSave} isLoading={isSubmitting} disabled={loadingScores}>
                        {!isSubmitting && <Save className="w-4 h-4 mr-2" />} Save Scores
                    </Button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Chest No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Judge 1 (35)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Judge 2 (35)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Judge 3 (30)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Grade</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loadingScores ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-12" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-8" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-12" /></td>
                                    </tr>
                                ))
                            ) : (
                                scores.map((row, index) => (
                                <tr key={row.chestNumber} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        #{row.chestNumber}
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap">
                                        <input 
                                            type="number" 
                                            className="w-20 rounded-[6px] border border-border-color px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
                                            value={row.judge1}
                                            onChange={(e) => handleScoreChange(index, 'judge1', e.target.value)}
                                            max={35}
                                        />
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap">
                                        <input 
                                            type="number" 
                                            className="w-20 rounded-[6px] border border-border-color px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
                                            value={row.judge2}
                                            onChange={(e) => handleScoreChange(index, 'judge2', e.target.value)}
                                            max={35}
                                        />
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap">
                                        <input 
                                            type="number" 
                                            className="w-20 rounded-[6px] border border-border-color px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
                                            value={row.judge3}
                                            onChange={(e) => handleScoreChange(index, 'judge3', e.target.value)}
                                            max={30}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                                        {row.total}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge variant={row.total >= 80 ? 'success' : 'secondary'}>{row.grade}</Badge>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
