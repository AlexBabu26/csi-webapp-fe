import React, { useState } from 'react';
import { FileSpreadsheet, Download, CheckCircle } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

export const ConferenceExport: React.FC = () => {
  const { addToast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await api.exportConferenceDataOfficial();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conference-delegates-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addToast('Export successful! File downloaded.', 'success');
    } catch (error: any) {
      addToast(error.message || 'Failed to export data', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Export Data</h1>
        <p className="text-gray-500 mt-1">Download your conference registration data</p>
      </div>

      {/* Export Card */}
      <Card className="p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileSpreadsheet className="w-10 h-10 text-green-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Export to Excel</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Download a complete Excel file containing all your registered delegates, 
          their food preferences, accommodation requirements, and payment status.
        </p>

        <Button
          onClick={handleExport}
          disabled={exporting}
          isLoading={exporting}
          size="lg"
        >
          <Download className="w-5 h-5 mr-2" />
          {exporting ? 'Generating...' : 'Download Excel File'}
        </Button>
      </Card>

      {/* What's Included */}
      <Card className="p-6">
        <h4 className="font-semibold text-gray-800 mb-4">What's included in the export?</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'Delegate names and contact details',
            'Gender information',
            'Food preferences (Veg/Non-Veg)',
            'Accommodation requirements',
            'Registration status',
            'Payment status and amount'
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-600">{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

