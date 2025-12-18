
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Badge, Select, Skeleton } from '../components/ui';
import { Button } from '../components/ui/Button';
import { DataTable, ColumnDef } from '../components/DataTable';
import { api } from '../services/api';
import { getAuthToken } from '../services/auth';
import { Save, RefreshCw, ChevronLeft, RotateCcw, AlertTriangle, Award } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import { ScoreEntry as ScoreEntryType, EventItem } from '../types';

// Grade color mapping
const getGradeVariant = (grade: string): 'success' | 'primary' | 'warning' | 'danger' | 'secondary' => {
    switch (grade.toUpperCase()) {
        case 'A':
        case 'A+':
            return 'success';
        case 'B':
        case 'B+':
            return 'primary';
        case 'C':
        case 'C+':
            return 'warning';
        case 'D':
        case 'F':
            return 'danger';
        default:
            return 'secondary';
    }
};

// Calculate grade based on total score
const calculateGrade = (total: number): string => {
    if (total >= 90) return 'A+';
    if (total >= 80) return 'A';
    if (total >= 70) return 'B+';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C+';
    if (total >= 35) return 'C';
    return 'F';
};

// Editable cell component
interface EditableCellProps {
    value: number;
    maxScore: number;
    onChange: (value: number) => void;
    error?: string;
    ariaLabel: string;
}

const EditableCell: React.FC<EditableCellProps> = ({ value, maxScore, onChange, error, ariaLabel }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value) || 0;
        setLocalValue(newValue);
    };

    const handleBlur = () => {
        onChange(localValue);
    };

    return (
        <div>
            <input
                type="number"
                className={`w-20 rounded-md border px-2 py-1.5 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
                    error ? 'border-danger' : 'border-borderColor'
                }`}
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
                max={maxScore}
                min={0}
                aria-label={ariaLabel}
            />
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
    );
};

export const ScoreEntry: React.FC = () => {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [scores, setScores] = useState<ScoreEntryType[]>([]);
    const [originalScores, setOriginalScores] = useState<ScoreEntryType[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [loadingScores, setLoadingScores] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
    
    const { addToast } = useToast();
    const navigate = useNavigate();

    // Fetch Events on mount
    useEffect(() => {
        const fetchEvents = async () => {
            const token = getAuthToken();
            try {
                const response = await api.getEvents(token);
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
            const token = getAuthToken();
            setLoadingScores(true);
            try {
                const response = await api.getScores(selectedEventId, token);
                setScores(response.data);
                setOriginalScores(JSON.parse(JSON.stringify(response.data)));
                setHasChanges(false);
                setValidationErrors({});
            } catch (e) {
                addToast("Failed to load scores for selected event", "error");
            } finally {
                setLoadingScores(false);
            }
        };

        fetchScores();
    }, [selectedEventId, addToast]);

    const validateScore = useCallback((value: number, maxScore: number, field: string, chestNumber: string): boolean => {
        const key = `${chestNumber}-${field}`;
        if (value < 0) {
            setValidationErrors(prev => ({ ...prev, [key]: 'Score cannot be negative' }));
            return false;
        }
        if (value > maxScore) {
            setValidationErrors(prev => ({ ...prev, [key]: `Max score is ${maxScore}` }));
            return false;
        }
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[key];
            return newErrors;
        });
        return true;
    }, []);

    const handleScoreChange = useCallback((chestNumber: string, field: 'judge1' | 'judge2' | 'judge3', value: number) => {
        const maxScores: {[key: string]: number} = { judge1: 35, judge2: 35, judge3: 30 };
        
        validateScore(value, maxScores[field], field, chestNumber);
        
        setScores(prevScores => {
            return prevScores.map(score => {
                if (score.chestNumber === chestNumber) {
                    const updatedScore = { ...score, [field]: value };
                    updatedScore.total = updatedScore.judge1 + updatedScore.judge2 + updatedScore.judge3;
                    updatedScore.grade = calculateGrade(updatedScore.total);
                    return updatedScore;
                }
                return score;
            });
        });
        setHasChanges(true);
    }, [validateScore]);

    const handleSave = async () => {
        // Check for validation errors
        if (Object.keys(validationErrors).length > 0) {
            addToast("Please fix validation errors before saving", "error");
            return;
        }

        const token = getAuthToken();
        setIsSubmitting(true);
        try {
            await api.saveScores(selectedEventId, scores, token);
            addToast("Scores saved successfully!", "success");
            setOriginalScores(JSON.parse(JSON.stringify(scores)));
            setHasChanges(false);
        } catch (err: any) {
            addToast(err.message || "Failed to save scores", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setScores(JSON.parse(JSON.stringify(originalScores)));
        setHasChanges(false);
        setValidationErrors({});
        addToast("Changes discarded", "info");
    };

    const handleBack = () => {
        if (hasChanges) {
            if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                navigate('/admin/dashboard');
            }
        } else {
            navigate('/admin/dashboard');
        }
    };

    // Define table columns
    const columns = useMemo<ColumnDef<ScoreEntryType, any>[]>(
        () => [
            {
                accessorKey: 'chestNumber',
                header: 'Chest No',
                cell: ({ row }) => (
                    <span className="font-mono font-bold text-textDark">
                        #{row.original.chestNumber}
                    </span>
                ),
                size: 100,
            },
            {
                accessorKey: 'name',
                header: 'Participant',
                cell: ({ row }) => (
                    <span className="font-medium text-textDark">{row.original.name}</span>
                ),
            },
            {
                accessorKey: 'judge1',
                header: 'Judge 1 (35)',
                cell: ({ row }) => (
                    <EditableCell
                        value={row.original.judge1}
                        maxScore={35}
                        onChange={(value) => handleScoreChange(row.original.chestNumber, 'judge1', value)}
                        error={validationErrors[`${row.original.chestNumber}-judge1`]}
                        ariaLabel={`Judge 1 score for ${row.original.name}`}
                    />
                ),
                enableSorting: true,
                size: 130,
            },
            {
                accessorKey: 'judge2',
                header: 'Judge 2 (35)',
                cell: ({ row }) => (
                    <EditableCell
                        value={row.original.judge2}
                        maxScore={35}
                        onChange={(value) => handleScoreChange(row.original.chestNumber, 'judge2', value)}
                        error={validationErrors[`${row.original.chestNumber}-judge2`]}
                        ariaLabel={`Judge 2 score for ${row.original.name}`}
                    />
                ),
                enableSorting: true,
                size: 130,
            },
            {
                accessorKey: 'judge3',
                header: 'Judge 3 (30)',
                cell: ({ row }) => (
                    <EditableCell
                        value={row.original.judge3}
                        maxScore={30}
                        onChange={(value) => handleScoreChange(row.original.chestNumber, 'judge3', value)}
                        error={validationErrors[`${row.original.chestNumber}-judge3`]}
                        ariaLabel={`Judge 3 score for ${row.original.name}`}
                    />
                ),
                enableSorting: true,
                size: 130,
            },
            {
                accessorKey: 'total',
                header: 'Total',
                cell: ({ row }) => (
                    <span className="font-bold text-primary text-lg">{row.original.total}</span>
                ),
                size: 80,
            },
            {
                accessorKey: 'grade',
                header: 'Grade',
                cell: ({ row }) => (
                    <Badge variant={getGradeVariant(row.original.grade)} className="text-sm px-3 py-1">
                        {row.original.grade}
                    </Badge>
                ),
                size: 80,
            },
        ],
        [handleScoreChange, validationErrors]
    );

    const eventOptions = events.map(e => ({
        value: e.id,
        label: `${e.name} (${e.type}) - ${e.status}`
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    className="pl-0"
                    onClick={handleBack}
                    aria-label="Go back to dashboard"
                 >
                    <ChevronLeft className="w-5 h-5 mr-1" /> Back
                 </Button>
                 <div>
                     <h1 className="text-2xl font-bold text-textDark">Score Entry</h1>
                     <p className="text-sm text-textMuted">Enter and verify marks for finished events.</p>
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

            <Card noPadding className="overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-borderColor flex flex-wrap justify-between items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                         <Badge variant="primary">Max Score: 100</Badge>
                         <Badge variant="warning">Min Pass: 35</Badge>
                         {hasChanges && (
                            <Badge variant="danger" className="animate-pulse">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Unsaved Changes
                            </Badge>
                         )}
                    </div>
                    <div className="flex gap-2">
                        {hasChanges && (
                            <Button variant="outline" onClick={handleCancel} disabled={loadingScores}>
                                <RotateCcw className="w-4 h-4 mr-2" /> Cancel
                            </Button>
                        )}
                        <Button 
                            variant="primary" 
                            onClick={handleSave} 
                            isLoading={isSubmitting} 
                            disabled={loadingScores || !hasChanges || Object.keys(validationErrors).length > 0}
                        >
                            {!isSubmitting && <Save className="w-4 h-4 mr-2" />} Save Scores
                        </Button>
                    </div>
                </div>
                
                <div className="p-4">
                    <DataTable
                        data={scores}
                        columns={columns}
                        isLoading={loadingScores}
                        showSearch={true}
                        showPagination={true}
                        showRowSelection={false}
                        searchPlaceholder="Search by chest number or name..."
                        pageSize={10}
                        emptyMessage="No scores found for this event"
                        emptyIcon={<Award className="w-8 h-8 text-textMuted" />}
                    />
                </div>
            </Card>
        </div>
    );
};
