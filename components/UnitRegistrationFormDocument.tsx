import React, { useCallback, useEffect, useRef } from 'react';
import { ChurchLogo, LogoImage, YouthLogo } from './SiteLogos';

export interface RegistrationFormCouncilor {
  name: string;
  phone: string;
}

export interface RegistrationFormMember {
  name: string;
  gender?: string;
  dob?: string;
  age?: number;
  number?: string;
  qualification?: string;
  bloodGroup?: string;
  locationInfo?: string;
}

export interface RegistrationFormOfficials {
  presidentDesignation?: string;
  presidentName?: string;
  presidentPhone?: string;
  vicePresidentName?: string;
  vicePresidentPhone?: string;
  secretaryName?: string;
  secretaryPhone?: string;
  jointSecretaryName?: string;
  jointSecretaryPhone?: string;
  treasurerName?: string;
  treasurerPhone?: string;
}

export interface UnitRegistrationFormDocumentProps {
  registrationNumber: string;
  clergyDistrict: string;
  unitName: string;
  registrationYear: number;
  membersCount: number;
  officials: RegistrationFormOfficials | null;
  councilors: RegistrationFormCouncilor[];
  members: RegistrationFormMember[];
  unitRegistrationFee: number;
  unitMemberFee: number;
  totalAmount: number;
  youthLogoUrl?: string | null;
  churchLogoUrl?: string | null;
  onLogoLoad?: () => void;
}

export const formatRegistrationYearLabel = (registrationYear: number): string =>
  `${registrationYear - 1}-${registrationYear}`;

export const formatSubmissionDeadline = (registrationYear: number): string =>
  `30th of June ${registrationYear - 1}`;

export const formatRegistrationAgeReferenceLabel = (registrationYear: number): string => {
  const day = String(30).padStart(2, '0');
  const month = String(6).padStart(2, '0');
  return `${day}-${month}-${registrationYear - 1}`;
};

const formatDob = (dob?: string): string => {
  if (!dob) return '';
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return dob;
  return date.toLocaleDateString('en-GB').replace(/\//g, '-');
};

const formatPhone = (phone?: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+91 ${digits.slice(2)}`;
  return phone.startsWith('+') ? phone : `+91 ${phone}`;
};

const formatGender = (gender?: string): string => {
  if (!gender) return '';
  const normalized = gender.toUpperCase();
  if (normalized === 'M' || normalized === 'MALE') return 'M';
  if (normalized === 'F' || normalized === 'FEMALE') return 'F';
  return gender;
};

export const UnitRegistrationFormDocument: React.FC<UnitRegistrationFormDocumentProps> = ({
  registrationNumber,
  clergyDistrict,
  unitName,
  registrationYear,
  membersCount,
  officials,
  councilors,
  members,
  unitRegistrationFee,
  unitMemberFee,
  totalAmount,
  youthLogoUrl,
  churchLogoUrl,
  onLogoLoad,
}) => {
  const registrationYearLabel = formatRegistrationYearLabel(registrationYear);
  const submissionDeadline = formatSubmissionDeadline(registrationYear);
  const ageReferenceLabel = formatRegistrationAgeReferenceLabel(registrationYear);
  const logosLoadedRef = useRef(0);

  const handleLogoLoad = useCallback(() => {
    logosLoadedRef.current += 1;
    if (logosLoadedRef.current >= 2) {
      onLogoLoad?.();
    }
  }, [onLogoLoad]);

  useEffect(() => {
    if (!youthLogoUrl && !churchLogoUrl) {
      onLogoLoad?.();
    }
  }, [youthLogoUrl, churchLogoUrl, onLogoLoad]);

  return (
    <div className="p-8 max-w-[210mm] mx-auto print:p-5" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="text-right mb-6">
        <table className="inline-block border border-borderColor">
          <tbody>
            <tr>
              <th className="border border-borderColor px-4 py-2 bg-gray-100">
                Unit Registration Number: {registrationNumber}
              </th>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
          <LogoImage
            src={youthLogoUrl}
            fallback={<YouthLogo className="w-20 h-20" />}
            className="w-20 h-20 flex items-center justify-center"
            imageClassName="max-w-full max-h-full w-auto h-auto"
            onLoad={handleLogoLoad}
          />
        </div>
        <div className="text-center flex-1 mx-4">
          <h1 className="text-2xl font-bold text-textDark mb-1">YOUTH MOVEMENT</h1>
          <h2 className="text-base font-semibold text-textDark mb-2">CSI MADHYA KERALA DIOCESE</h2>
          <br />
          <h3 className="text-base font-bold text-textDark">UNIT REGISTRATION FORM</h3>
        </div>
        <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
          <LogoImage
            src={churchLogoUrl}
            fallback={<ChurchLogo className="w-20 h-20" />}
            className="w-20 h-20 flex items-center justify-center"
            imageClassName="max-w-full max-h-full w-auto h-auto"
            onLoad={handleLogoLoad}
          />
        </div>
      </div>
      <br />

      <div className="mb-6 break-inside-avoid">
        <h3 className="text-left text-lg font-bold text-textDark mb-4">UNIT DETAILS</h3>
        <div className="space-y-3">
          <div className="border border-borderColor p-2">
            <label className="text-sm text-textMuted">Clergy District</label>
            <p className="font-medium">{clergyDistrict}</p>
          </div>
          <div className="border border-borderColor p-2">
            <label className="text-sm text-textMuted">Unit Name</label>
            <p className="font-medium">{unitName}</p>
          </div>
          <div className="border border-borderColor p-2">
            <label className="text-sm text-textMuted">Registration Year</label>
            <p className="font-medium">{registrationYearLabel}</p>
          </div>
          <div className="border border-borderColor p-2">
            <label className="text-sm text-textMuted">No of Members</label>
            <p className="font-medium">{membersCount}</p>
          </div>
        </div>
      </div>
      <br />

      {officials && (
        <div className="mb-6 break-inside-avoid">
          <h3 className="text-left text-lg font-bold text-textDark mb-4">UNIT OFFICIALS</h3>
          <table className="w-full border-collapse border border-borderColor">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-borderColor px-3 py-2 text-left">Designation</th>
                <th className="border border-borderColor px-3 py-2 text-left">Name</th>
                <th className="border border-borderColor px-3 py-2 text-left">Contact No.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-borderColor px-3 py-2">President</td>
                <td className="border border-borderColor px-3 py-2">
                  {officials.presidentDesignation ? `${officials.presidentDesignation} ` : ''}
                  {officials.presidentName}
                </td>
                <td className="border border-borderColor px-3 py-2">{officials.presidentPhone}</td>
              </tr>
              <tr>
                <td className="border border-borderColor px-3 py-2">Vice President</td>
                <td className="border border-borderColor px-3 py-2">{officials.vicePresidentName}</td>
                <td className="border border-borderColor px-3 py-2">{officials.vicePresidentPhone}</td>
              </tr>
              <tr>
                <td className="border border-borderColor px-3 py-2">Secretary</td>
                <td className="border border-borderColor px-3 py-2">{officials.secretaryName}</td>
                <td className="border border-borderColor px-3 py-2">{officials.secretaryPhone}</td>
              </tr>
              <tr>
                <td className="border border-borderColor px-3 py-2">Joint Secretary</td>
                <td className="border border-borderColor px-3 py-2">{officials.jointSecretaryName}</td>
                <td className="border border-borderColor px-3 py-2">{officials.jointSecretaryPhone}</td>
              </tr>
              <tr>
                <td className="border border-borderColor px-3 py-2">Treasurer</td>
                <td className="border border-borderColor px-3 py-2">{officials.treasurerName}</td>
                <td className="border border-borderColor px-3 py-2">{officials.treasurerPhone}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <br />
      <br />

      <div className="mb-6 break-inside-avoid">
        <h3 className="text-left text-lg font-bold text-textDark mb-4">COUNCILORS</h3>
        <table className="w-full border-collapse border border-borderColor">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-borderColor px-3 py-2 text-left w-16">No.</th>
              <th className="border border-borderColor px-3 py-2 text-left">Name</th>
              <th className="border border-borderColor px-3 py-2 text-left">Contact No.</th>
            </tr>
          </thead>
          <tbody>
            {councilors.map((councilor, index) => (
              <tr key={`${councilor.name}-${index}`}>
                <td className="border border-borderColor px-3 py-2">{index + 1}</td>
                <td className="border border-borderColor px-3 py-2">{councilor.name}</td>
                <td className="border border-borderColor px-3 py-2">{formatPhone(councilor.phone)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <br />
      <br />

      <div className="mb-6">
        <h3 className="text-left text-lg font-bold text-textDark mb-4">UNIT MEMBERS</h3>
        <table className="w-full border-collapse border border-borderColor text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-borderColor px-2 py-2 text-left w-8">No.</th>
              <th className="border border-borderColor px-2 py-2 text-left">Name</th>
              <th className="border border-borderColor px-2 py-2 text-left w-12">Gender</th>
              <th className="border border-borderColor px-2 py-2 text-left w-24">DOB</th>
              <th className="border border-borderColor px-2 py-2 text-left w-10">Age</th>
              <th className="border border-borderColor px-2 py-2 text-left">Contact No.</th>
              <th className="border border-borderColor px-2 py-2 text-left">Qualification</th>
              <th className="border border-borderColor px-2 py-2 text-left w-14">Blood<br />Group</th>
              <th className="border border-borderColor px-2 py-2 text-left">Location Info</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <tr key={`${member.name}-${index}`}>
                <td className="border border-borderColor px-2 py-2">{index + 1}</td>
                <td className="border border-borderColor px-2 py-2">{member.name}</td>
                <td className="border border-borderColor px-2 py-2">{formatGender(member.gender)}</td>
                <td className="border border-borderColor px-2 py-2">{formatDob(member.dob)}</td>
                <td className="border border-borderColor px-2 py-2 text-center">
                  {member.age !== undefined && member.age !== null ? member.age : ''}
                </td>
                <td className="border border-borderColor px-2 py-2">{formatPhone(member.number)}</td>
                <td className="border border-borderColor px-2 py-2">{member.qualification || ''}</td>
                <td className="border border-borderColor px-2 py-2 text-center">{member.bloodGroup || ''}</td>
                <td className="border border-borderColor px-2 py-2">{member.locationInfo || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-textMuted mt-2 italic">
          Note: Age shown is calculated as on {ageReferenceLabel}.
        </p>
      </div>
      <br />

      <div className="mb-6 break-inside-avoid">
        <h3 className="text-left text-lg font-bold text-textDark mb-4">DECLARATION</h3>
        <p className="text-sm text-textDark text-justify leading-relaxed mb-6">
          I hereby declare that all the above-mentioned information provided by me is true and accurate to the best of my knowledge and belief.
          Additionally, I am submitting a payment of Rs.{totalAmount}/-{' '}
          <i>
            (incl. unit reg. fee - Rs.{unitRegistrationFee}/- & Rs.{unitMemberFee}/- for {membersCount} members)
          </i>.
          Please register the above unit and its members for the year {registrationYearLabel}.
        </p>
        <div className="flex justify-between items-start mt-16">
          <div className="flex-1">
            <p className="mb-4">Date: </p>
            <div className="mt-12"></div>
            <p className="mb-4">Place: </p>
          </div>
          <div className="flex-1 text-center">
            <div className="mt-12"></div>
            <div className="mt-12"></div>
            <p><i>(seal)</i></p>
          </div>
          <div className="flex-1 text-center">
            <div className="mt-12"></div>
            <div className="mt-4"></div>
            <p className="font-medium">Signature of Unit President</p>
            <p className="text-sm mt-1"><i>(Vicar/Catechist/ Reader)</i></p>
          </div>
        </div>
      </div>
      <br />

      <div className="mb-8 break-inside-avoid">
        <h3 className="text-left text-lg font-bold text-textDark mb-4">INSTRUCTIONS</h3>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            <strong>SUBMIT</strong> the hard copy of the generated form to the Youth Office before {submissionDeadline} by post or in person.
          </p>
          <p>Form should be duly signed by the Unit President (Vicar/Catechist/ Reader).</p>
          <p>If there is any Manipulation or Over writing in the submitted form, form and unit registration will be terminated.</p>
          <div className="mt-12 space-y-1">
            <p><strong>Postal Address:</strong></p>
            <p>THE GENERAL SECRETARY</p>
            <p>HEADQUARTERS CSI MKD YOUTH MOVEMENT</p>
            <p>CSI YOUTH CENTRE CHANGANASSERY</p>
            <p>KOTTAYAM KERALA - 686101</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const registrationFormPrintStyles = `
  @media print {
    .no-print {
      display: none !important;
    }

    body {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
      font-family: Arial, sans-serif;
    }

    img {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    .break-inside-avoid {
      page-break-inside: avoid;
    }

    table {
      page-break-inside: auto;
      margin-bottom: 20px;
    }

    tr {
      page-break-inside: avoid;
      page-break-before: auto;
      page-break-after: auto;
    }

    thead {
      display: table-header-group;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 8px;
    }

    th {
      background-color: #f2f2f2;
    }
  }

  table {
    border-collapse: collapse;
  }
`;
