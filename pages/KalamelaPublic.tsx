import React, { useState } from 'react';
import { Search, Trophy, ChevronRight, AlertCircle, FileText } from 'lucide-react';
import { Button, Card, Input, Badge } from '../components/ui';
import { RECENT_REGISTRATIONS } from '../constants';
import { useNavigate } from 'react-router-dom';

export const KalamelaPublic: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const navigate = useNavigate();

    // Mock search logic
    const result = hasSearched 
        ? RECENT_REGISTRATIONS.find(p => p.chestNumber === searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : null;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setHasSearched(true);
    };

    return (
        <div className="min-h-screen bg-bg-alt flex flex-col">
            {/* Public Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            K
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">Kalamela '24 <span className="text-primary font-normal">Results</span></h1>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
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
                        <form onSubmit={handleSearch} className="flex shadow-lg rounded-md">
                            <input 
                                type="text" 
                                placeholder="Enter Chest Number (e.g., 101)"
                                className="flex-1 min-w-0 block w-full px-4 py-4 rounded-l-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button 
                                type="submit" 
                                className="inline-flex items-center px-6 py-4 border border-transparent text-base font-medium rounded-r-md text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-white"
                            >
                                <Search className="w-5 h-5 mr-2" />
                                Search
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <main className="flex-1 -mt-16 px-4 sm:px-6 lg:px-8 pb-12">
                <div className="max-w-3xl mx-auto">
                    {!hasSearched && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-primary">
                                <div className="flex items-center mb-4">
                                    <div className="p-3 bg-blue-50 rounded-full text-primary mr-4">
                                        <Trophy className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Live Results</h3>
                                        <p className="text-sm text-gray-500">View real-time event standings</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-primary text-sm font-medium flex items-center justify-end">
                                        Browse Events <ChevronRight className="w-4 h-4 ml-1"/>
                                    </span>
                                </div>
                            </Card>

                            <Card className="hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-secondary">
                                <div className="flex items-center mb-4">
                                    <div className="p-3 bg-gray-100 rounded-full text-secondary mr-4">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">File an Appeal</h3>
                                        <p className="text-sm text-gray-500">30-min window after results</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-secondary text-sm font-medium flex items-center justify-end">
                                        Submit Appeal <ChevronRight className="w-4 h-4 ml-1"/>
                                    </span>
                                </div>
                            </Card>
                         </div>
                    )}

                    {hasSearched && !result && (
                        <div className="rounded-md bg-red-50 p-4 border border-red-200">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">No participant found</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>We couldn't find a participant with chest number "{searchTerm}". Please check and try again.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {hasSearched && result && (
                        <div className="space-y-6">
                            {/* Profile Card */}
                            <Card className="border-t-4 border-t-success">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{result.name}</h2>
                                        <div className="mt-1 flex items-center space-x-2">
                                            <Badge variant="primary">{result.category}</Badge>
                                            <Badge variant="light">{result.unit}</Badge>
                                            <span className="text-sm text-gray-500">• {result.district}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 sm:mt-0 text-right">
                                        <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Chest No</div>
                                        <div className="text-3xl font-mono font-bold text-dark">#{result.chestNumber}</div>
                                    </div>
                                </div>

                                <h3 className="text-lg font-medium text-gray-900 mb-4">Event Results</h3>
                                <div className="space-y-4">
                                    {/* Mock Result Items */}
                                    <div className="bg-gray-50 rounded-lg p-4 border border-border-color">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-md font-bold text-gray-900">Light Music (Malayalam)</h4>
                                                <p className="text-sm text-gray-500">Stage 2 • 10:30 AM</p>
                                            </div>
                                            <Badge variant="success">A Grade</Badge>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Score: <span className="font-semibold text-dark">88/100</span></span>
                                            <span className="text-gray-600">Rank: <span className="font-semibold text-dark">2nd</span></span>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 border border-border-color">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-md font-bold text-gray-900">Elocution</h4>
                                                <p className="text-sm text-gray-500">Stage 4 • 02:00 PM</p>
                                            </div>
                                            <Badge variant="warning">Pending</Badge>
                                        </div>
                                        <div className="mt-3 text-sm text-gray-500 italic">
                                            Results will be published shortly.
                                        </div>
                                    </div>
                                </div>
                            </Card>
                            
                            <div className="flex justify-center">
                                <Button variant="outline" onClick={() => { setHasSearched(false); setSearchTerm(''); }}>
                                    Search Another
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};