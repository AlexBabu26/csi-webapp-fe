import React, { useState } from 'react';
import { Search, Trophy, ChevronRight, AlertCircle, FileText, ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { SiteSettings } from '../types';
import { useSiteSettings } from '../hooks/queries';

// Interface for participant search result with event scores
interface ParticipantResult {
    id: number;
    name: string;
    chestNumber: string;
    unit: string;
    district: string;
    category: string;
    eventResults: EventResult[];
}

interface EventResult {
    eventName: string;
    eventType: 'INDIVIDUAL' | 'GROUP';
    marks: number | null;
    grade: string | null;
    position: number | null;
    status: 'SCORED' | 'PENDING';
}

export const KalamelaPublic: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [searching, setSearching] = useState(false);
    const [result, setResult] = useState<ParticipantResult | null>(null);
    const navigate = useNavigate();
    
    // Use TanStack Query for site settings
    const { data: siteSettings } = useSiteSettings();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setHasSearched(true);
        setSearching(true);
        
        try {
            const response = await api.findParticipantByChestNumber(searchTerm);
            // Transform API response to our interface
            const data = response.data;
            if (data) {
                const participantResult: ParticipantResult = {
                    id: data.id || data.participant_id,
                    name: data.name || data.member_name || `Participant ${data.id}`,
                    chestNumber: data.chest_number || searchTerm,
                    unit: data.unit_name || data.unit || 'N/A',
                    district: data.district_name || data.district || 'N/A',
                    category: data.seniority_category || data.category || 'N/A',
                    eventResults: (data.event_results || data.scores || []).map((score: any) => ({
                        eventName: score.event_name || score.eventName || 'Unknown Event',
                        eventType: score.event_type || score.eventType || 'INDIVIDUAL',
                        marks: score.marks ?? score.awarded_marks ?? null,
                        grade: score.grade || null,
                        position: score.position || null,
                        status: (score.marks !== undefined && score.marks !== null) || 
                                (score.awarded_marks !== undefined && score.awarded_marks !== null) 
                                ? 'SCORED' : 'PENDING',
                    })),
                };
                setResult(participantResult);
            } else {
                setResult(null);
            }
        } catch (err) {
            console.error('Search failed', err);
            setResult(null);
        } finally {
            setSearching(false);
        }
    };

    // Helper to get grade badge variant
    const getGradeBadgeVariant = (grade: string | null): 'success' | 'warning' | 'danger' | 'light' => {
        if (!grade) return 'light';
        switch (grade.toUpperCase()) {
            case 'A': return 'success';
            case 'B': return 'warning';
            case 'C': return 'danger';
            default: return 'light';
        }
    };

    // Helper to format position
    const formatPosition = (position: number | null): string => {
        if (!position) return '-';
        const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';
        return `${position}${suffix}`;
    };

    return (
        <div className="min-h-screen bg-bgLight flex flex-col">
            {/* Public Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        {/* Back to Home Button */}
                        <button 
                            onClick={() => navigate('/')}
                            className="flex items-center text-textMuted hover:text-primary transition-colors mr-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                            aria-label="Back to Home"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            K
                        </div>
                        <h1 className="text-xl font-bold text-textDark">Kalamela '24 <span className="text-primary font-normal">Results</span></h1>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => navigate('/login?portal=kalamela')}>
                        Official Login
                    </Button>
                </div>
            </header>

            {/* Hero Section */}
            <div className="bg-primary pb-24 pt-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                        Check Your Results
                    </h2>
                    <p className="mt-3 text-xl text-blue-100">
                        Enter your Chest Number to view scores, grades, and appeal status.
                    </p>
                    <div className="mt-8 relative max-w-xl mx-auto">
                        <form onSubmit={handleSearch} className="flex shadow-lg rounded-md overflow-hidden">
                            <input 
                                type="text" 
                                placeholder="Enter Chest Number (e.g., S001-01-001)"
                                className="flex-1 min-w-0 block w-full px-4 py-4 bg-white text-textDark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                disabled={searching}
                            />
                            <button 
                                type="submit" 
                                disabled={searching}
                                className="inline-flex items-center px-6 py-4 border border-transparent text-base font-medium text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {searching ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5 mr-2" />
                                        Search
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <main className="flex-1 -mt-16 px-4 sm:px-6 lg:px-8 pb-12">
                <div className="max-w-3xl mx-auto">
                    {!hasSearched && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {/* Live Results Card - Fully Clickable */}
                                <button
                                    onClick={() => alert('Live Results feature coming soon!')}
                                    className="bg-white p-6 rounded-md border border-borderColor shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-t-4 border-t-primary text-left group hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                >
                                    <div className="flex items-center mb-4">
                                        <div className="p-3 bg-blue-50 rounded-full text-primary mr-4 group-hover:bg-primary group-hover:text-white transition-colors">
                                            <Trophy className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-textDark">Live Results</h3>
                                            <p className="text-sm text-textMuted">View real-time event standings</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-primary text-sm font-medium flex items-center justify-end group-hover:translate-x-1 transition-transform">
                                            Browse Events <ChevronRight className="w-4 h-4 ml-1"/>
                                        </span>
                                    </div>
                                </button>

                                {/* File Appeal Card - Fully Clickable */}
                                <button
                                    onClick={() => alert('Appeal feature coming soon!')}
                                    className="bg-white p-6 rounded-md border border-borderColor shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-t-4 border-t-secondary text-left group hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
                                >
                                    <div className="flex items-center mb-4">
                                        <div className="p-3 bg-gray-100 rounded-full text-textMuted mr-4 group-hover:bg-secondary group-hover:text-white transition-colors">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-textDark">File an Appeal</h3>
                                            <p className="text-sm text-textMuted">30-min window after results</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-textMuted text-sm font-medium flex items-center justify-end group-hover:translate-x-1 transition-transform">
                                            Submit Appeal <ChevronRight className="w-4 h-4 ml-1"/>
                                        </span>
                                    </div>
                                </button>
                            </div>

                            {/* Event Highlights Section */}
                            <div className="bg-white rounded-md border border-borderColor shadow-sm p-6">
                                <h3 className="font-bold text-lg text-textDark mb-4 flex items-center">
                                    <Calendar className="w-5 h-5 mr-2 text-primary" />
                                    Upcoming Events Today
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-bgLight rounded-md">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-success rounded-full mr-3 animate-pulse"></div>
                                            <div>
                                                <p className="font-medium text-sm text-textDark">Light Music (Malayalam)</p>
                                                <p className="text-xs text-textMuted flex items-center mt-0.5">
                                                    <MapPin className="w-3 h-3 mr-1" /> Stage 2
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="success">Live</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-bgLight rounded-md">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-warning rounded-full mr-3"></div>
                                            <div>
                                                <p className="font-medium text-sm text-textDark">Elocution (English)</p>
                                                <p className="text-xs text-textMuted flex items-center mt-0.5">
                                                    <MapPin className="w-3 h-3 mr-1" /> Stage 4
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-textMuted">2:00 PM</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-bgLight rounded-md">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                                            <div>
                                                <p className="font-medium text-sm text-textDark">Group Song</p>
                                                <p className="text-xs text-textMuted flex items-center mt-0.5">
                                                    <MapPin className="w-3 h-3 mr-1" /> Main Auditorium
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-textMuted">4:30 PM</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {hasSearched && !result && (
                        <div className="rounded-md bg-red-50 p-6 border border-red-200">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="h-8 w-8 text-red-400" aria-hidden="true" />
                                </div>
                                <h3 className="text-lg font-medium text-red-800 mb-2">No participant found</h3>
                                <p className="text-sm text-red-700 mb-4">
                                    We couldn't find a participant with chest number "<strong>{searchTerm}</strong>". Please check and try again.
                                </p>
                                <Button variant="outline" size="sm" onClick={() => { setHasSearched(false); setSearchTerm(''); }}>
                                    Try Another Search
                                </Button>
                            </div>
                        </div>
                    )}

                    {hasSearched && result && (
                        <div className="space-y-6">
                            {/* Profile Card */}
                            <Card className="border-t-4 border-t-success">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-textDark">{result.name}</h2>
                                        <div className="mt-1 flex items-center space-x-2">
                                            <Badge variant="primary">{result.category}</Badge>
                                            <Badge variant="light">{result.unit}</Badge>
                                            <span className="text-sm text-textMuted">• {result.district}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 sm:mt-0 text-right">
                                        <div className="text-xs text-textMuted uppercase tracking-wide font-semibold">Chest No</div>
                                        <div className="text-3xl font-mono font-bold text-textDark">#{result.chestNumber}</div>
                                    </div>
                                </div>

                                <h3 className="text-lg font-medium text-textDark mb-4">Event Results</h3>
                                <div className="space-y-4">
                                    {result.eventResults && result.eventResults.length > 0 ? (
                                        result.eventResults.map((event, index) => (
                                            <div key={index} className="bg-bgLight rounded-lg p-4 border border-borderColor">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-md font-bold text-textDark">{event.eventName}</h4>
                                                        <p className="text-sm text-textMuted">{event.eventType === 'GROUP' ? 'Group Event' : 'Individual Event'}</p>
                                                    </div>
                                                    {event.status === 'SCORED' ? (
                                                        <Badge variant={getGradeBadgeVariant(event.grade)}>
                                                            {event.grade ? `${event.grade} Grade` : 'Scored'}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="warning">Pending</Badge>
                                                    )}
                                                </div>
                                                {event.status === 'SCORED' ? (
                                                    <div className="mt-3 flex items-center justify-between text-sm">
                                                        <span className="text-textMuted">
                                                            Score: <span className="font-semibold text-textDark">{event.marks ?? '-'}/100</span>
                                                        </span>
                                                        <span className="text-textMuted">
                                                            Rank: <span className="font-semibold text-textDark">{formatPosition(event.position)}</span>
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="mt-3 text-sm text-textMuted italic">
                                                        Results will be published shortly.
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-bgLight rounded-lg p-4 border border-borderColor text-center">
                                            <p className="text-textMuted">No event participations found for this chest number.</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                            
                            <div className="flex justify-center">
                                <Button variant="outline" onClick={() => { setHasSearched(false); setSearchTerm(''); setResult(null); }}>
                                    Search Another
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <Footer siteSettings={siteSettings} />
        </div>
    );
};
