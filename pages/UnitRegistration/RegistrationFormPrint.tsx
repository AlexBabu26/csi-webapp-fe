import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Link, Navigate, useSearchParams } from 'react-router-dom';

import { ArrowLeft, Download } from 'lucide-react';

import { Button } from '../../components/ui';

import { UnitRegistrationFormDocument } from '../../components/UnitRegistrationFormDocument';

import { useApplicationForm, useUnitPaymentStatus } from '../../hooks/queries';

import { useSiteSettings } from '../../hooks/queries/useSiteSettings';

import { generatePdfFromElement } from '../../services/generatePdf';

import { useToast } from '../../components/Toast';

import { hasSubmittedDeclaration } from './utils';

import { mapApplicationFormToDocument } from './utils/registrationFormMapper';



export const RegistrationFormPrint: React.FC = () => {

  const [searchParams] = useSearchParams();

  const autoDownload = searchParams.get('download') === '1';

  const { data: formData, isLoading } = useApplicationForm();

  const { data: paymentData, isLoading: paymentLoading } = useUnitPaymentStatus();

  const { data: siteSettings, isLoading: settingsLoading } = useSiteSettings();

  const { addToast } = useToast();

  const [downloading, setDownloading] = useState(false);

  const hasDownloadedRef = useRef(false);

  const formRef = useRef<HTMLDivElement>(null);



  const handleLogoLoad = useCallback(() => {}, []);



  const registrationPdfFilename = formData

    ? `${formData.user_data.username.replace(/\//g, '-')}-registration-form.pdf`

    : 'registration-form.pdf';



  const handleDownloadPdf = async () => {

    if (!formRef.current) return;

    try {

      setDownloading(true);

      await generatePdfFromElement(formRef.current, { filename: registrationPdfFilename });

      addToast('Registration form downloaded', 'success');

    } catch (error) {

      console.error('Failed to generate registration form PDF', error);

      addToast('Failed to download registration form', 'error');

    } finally {

      setDownloading(false);

    }

  };



  useEffect(() => {

    if (!autoDownload || isLoading || !formData || hasDownloadedRef.current) return;



    hasDownloadedRef.current = true;

    void handleDownloadPdf();

  }, [autoDownload, formData, isLoading]);



  if (isLoading || settingsLoading || paymentLoading) {

    return (

      <div className="min-h-screen bg-white p-8">

        <p className="text-center text-textMuted">Loading registration form...</p>

      </div>

    );

  }



  if (!formData) {

    return (

      <div className="min-h-screen bg-white p-8">

        <p className="text-center text-textMuted">Unable to load registration form.</p>

      </div>

    );

  }



  if (!hasSubmittedDeclaration(formData.registration_status)) {

    return <Navigate to="/register/wizard" replace />;

  }

  const isPaid = (paymentData?.overall_status ?? 'not_submitted') === 'approved';
  if (!isPaid) {
    return <Navigate to="/register/complete" replace />;
  }



  const documentProps = mapApplicationFormToDocument(formData);




  return (

    <div className="min-h-screen bg-white">

      <div className="no-print p-4 bg-gray-50 border-b border-borderColor flex items-center justify-between">

        <Link to="/register/complete">

          <Button variant="outline" size="sm">

            <ArrowLeft className="w-4 h-4 mr-2" />

            Back

          </Button>

        </Link>

        <div className="flex items-center gap-3">

          <Button variant="primary" size="sm" onClick={handleDownloadPdf} isLoading={downloading}>

            <Download className="w-4 h-4 mr-2" />

            Download PDF

          </Button>

        </div>

      </div>



      <div className="no-print px-4 py-3 bg-blue-50 border-b border-blue-100 text-sm text-blue-900">

        Use <strong>Download PDF</strong> to save the registration form directly to your device.

        Use <strong>Print Form</strong> if you need a physical copy.

      </div>



      <div ref={formRef}>

        <UnitRegistrationFormDocument

          {...documentProps}

          youthLogoUrl={siteSettings?.logo_secondary_url}

          churchLogoUrl={siteSettings?.logo_primary_url}

          onLogoLoad={handleLogoLoad}

        />

      </div>




    </div>

  );

};


