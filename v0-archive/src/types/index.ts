export interface EventSummary {
  id: string;
  title: string;
  coverUrl: string;
  startDate: Date;
  endDate: Date;
  priceKrw: number | null;
  attendeeCap: number | null;
  hostHandle: string;
  location: {
    address: string;
    naverMapUrl: string;
  };
  attendees: {
    id: string;
    status: 'attending' | 'considering' | 'not_attending';
    paymentStatus: 'pending' | 'paid' | 'failed' | null;
  }[];
}

export interface User {
  id: string;
  username: string;
  furryName?: string;
  profilePicture?: string;
  email: string;
  createdAt: Date;
}