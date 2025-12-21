// Centralized query keys for cache management
export const queryKeys = {
  // Unit Admin
  units: {
    all: ['units'] as const,
    list: () => [...queryKeys.units.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.units.all, 'detail', id] as const,
    stats: () => [...queryKeys.units.all, 'stats'] as const,
  },
  members: {
    all: ['members'] as const,
    list: () => [...queryKeys.members.all, 'list'] as const,
    byUnit: (unitId: number) => [...queryKeys.members.all, 'unit', unitId] as const,
    archived: () => [...queryKeys.members.all, 'archived'] as const,
  },
  officials: {
    all: ['officials'] as const,
    list: () => [...queryKeys.officials.all, 'list'] as const,
    byUnit: (unitId: number) => [...queryKeys.officials.all, 'unit', unitId] as const,
  },
  councilors: {
    all: ['councilors'] as const,
    list: () => [...queryKeys.councilors.all, 'list'] as const,
    byUnit: (unitId: number) => [...queryKeys.councilors.all, 'unit', unitId] as const,
  },
  districts: {
    all: ['districts'] as const,
    list: () => [...queryKeys.districts.all, 'list'] as const,
    chartData: () => [...queryKeys.districts.all, 'chartData'] as const,
  },

  // Requests
  requests: {
    all: ['requests'] as const,
    transfers: () => [...queryKeys.requests.all, 'transfers'] as const,
    memberInfo: () => [...queryKeys.requests.all, 'memberInfo'] as const,
    officials: () => [...queryKeys.requests.all, 'officials'] as const,
    councilors: () => [...queryKeys.requests.all, 'councilors'] as const,
    memberAdd: () => [...queryKeys.requests.all, 'memberAdd'] as const,
    myRequests: (unitId: number) => [...queryKeys.requests.all, 'my', unitId] as const,
  },

  // Conference
  conference: {
    all: ['conference'] as const,
    list: () => [...queryKeys.conference.all, 'list'] as const,
    publicList: () => [...queryKeys.conference.all, 'publicList'] as const,
    detail: (id: number) => [...queryKeys.conference.all, 'detail', id] as const,
    delegates: () => [...queryKeys.conference.all, 'delegates'] as const,
    officialView: () => [...queryKeys.conference.all, 'officialView'] as const,
    payments: (conferenceId: number) => [...queryKeys.conference.all, 'payments', conferenceId] as const,
    adminInfo: (conferenceId: number) => [...queryKeys.conference.all, 'adminInfo', conferenceId] as const,
    officials: () => [...queryKeys.conference.all, 'officials'] as const,
    exportData: () => [...queryKeys.conference.all, 'exportData'] as const,
  },

  // Kalamela
  kalamela: {
    all: ['kalamela'] as const,
    events: {
      all: () => [...queryKeys.kalamela.all, 'events'] as const,
      individual: () => [...queryKeys.kalamela.events.all(), 'individual'] as const,
      group: () => [...queryKeys.kalamela.events.all(), 'group'] as const,
    },
    categories: {
      all: () => [...queryKeys.kalamela.all, 'categories'] as const,
      list: () => [...queryKeys.kalamela.categories.all(), 'list'] as const,
      detail: (id: number) => [...queryKeys.kalamela.categories.all(), 'detail', id] as const,
    },
    registrationFees: {
      all: () => [...queryKeys.kalamela.all, 'registrationFees'] as const,
      list: () => [...queryKeys.kalamela.registrationFees.all(), 'list'] as const,
      detail: (id: number) => [...queryKeys.kalamela.registrationFees.all(), 'detail', id] as const,
    },
    participants: (eventId: number) => [...queryKeys.kalamela.all, 'participants', eventId] as const,
    allParticipants: () => [...queryKeys.kalamela.all, 'allParticipants'] as const,
    scores: (eventId: number) => [...queryKeys.kalamela.all, 'scores', eventId] as const,
    payments: () => [...queryKeys.kalamela.all, 'payments'] as const,
    appeals: () => [...queryKeys.kalamela.all, 'appeals'] as const,
    results: () => [...queryKeys.kalamela.all, 'results'] as const,
    officialHome: () => [...queryKeys.kalamela.all, 'officialHome'] as const,
  },

  // Site Settings
  siteSettings: {
    all: ['siteSettings'] as const,
    settings: () => [...queryKeys.siteSettings.all, 'settings'] as const,
    notices: () => [...queryKeys.siteSettings.all, 'notices'] as const,
    quickLinks: () => [...queryKeys.siteSettings.all, 'quickLinks'] as const,
  },
} as const;


