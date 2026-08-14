// Copyright (c) 2026 IEEE KSB & Ahmed Fahmy
// Developed by UFUQ Tech (https://ufuq-tech.com)
// Licensed under the MIT License.

export default function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://crm.ieee-ksb.org/#webapp',
        name: 'IEEE KSB CRM',
        alternateName: ['IEEE KSB Operations Portal', 'IEEE Kafr El-Sheikh Student Branch CRM'],
        url: 'https://crm.ieee-ksb.org',
        sameAs: [
          'https://ieee-ksb.ufuq-tech.com',
          'https://ieee-ksb.org',
          'https://github.com/Ahmedfahmy8308/IEEE-CRM',
        ],
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All (Cloud & Web-based)',
        description:
          'Official Candidate Recruitment, Interview Management, and Welcome Day Operations CRM for IEEE Kafr El-Sheikh Student Branch (IEEE KSB). Engineered and maintained by UFUQ Tech.',
        inLanguage: ['en-US', 'ar-EG'],
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        author: {
          '@type': 'Person',
          '@id': 'https://ahmed-fahmy.engineer/#person',
          name: 'Ahmed Fahmy',
          jobTitle: 'Lead Software Architect',
          url: 'https://ahmed-fahmy.engineer',
          sameAs: ['https://github.com/Ahmedfahmy8308', 'https://ufuq-tech.com'],
        },
        creator: {
          '@type': 'Organization',
          '@id': 'https://ufuq-tech.com/#organization',
          name: 'UFUQ Tech',
          url: 'https://ufuq-tech.com',
          founder: {
            '@type': 'Person',
            name: 'Ahmed Fahmy',
            url: 'https://ahmed-fahmy.engineer',
          },
        },
        copyrightHolder: {
          '@type': 'Organization',
          '@id': 'https://ieee-ksb.org/#organization',
          name: 'IEEE Kafr El-Sheikh Student Branch',
          alternateName: 'IEEE KSB',
          url: 'https://ieee-ksb.org',
          parentOrganization: {
            '@type': 'Organization',
            name: 'IEEE (Institute of Electrical and Electronics Engineers)',
            url: 'https://www.ieee.org',
          },
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://ieee-ksb.org/#organization',
        name: 'IEEE Kafr El-Sheikh Student Branch',
        alternateName: 'IEEE KSB',
        url: 'https://ieee-ksb.org',
        logo: 'https://crm.ieee-ksb.org/Logo/Logo2.png',
        parentOrganization: {
          '@type': 'Organization',
          name: 'IEEE (Institute of Electrical and Electronics Engineers)',
          url: 'https://www.ieee.org',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://ufuq-tech.com/#organization',
        name: 'UFUQ Tech',
        url: 'https://ufuq-tech.com',
        founder: {
          '@type': 'Person',
          name: 'Ahmed Fahmy',
          url: 'https://ahmed-fahmy.engineer',
        },
      },
      {
        '@type': 'Person',
        '@id': 'https://ahmed-fahmy.engineer/#person',
        name: 'Ahmed Fahmy',
        jobTitle: 'Lead Software Engineer',
        url: 'https://ahmed-fahmy.engineer',
        sameAs: ['https://github.com/Ahmedfahmy8308', 'https://ufuq-tech.com'],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
