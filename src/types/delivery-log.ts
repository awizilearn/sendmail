
export type DeliveryLog = {
  id: string;
  ownerId: string;
  emailKey: string;
  beneficiary: {
    name: string;
    email: string;
    initials: string;
  };
  trainer: string;
  date: string; // Appointment date string
  status: 'Delivered' | 'Failed';
  sentAt: string; // ISO timestamp
};
