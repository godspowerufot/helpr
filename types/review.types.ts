export type ReviewPublic = {
  id: number;
  booking_id: number;
  listing_id: number;
  rating: number;
  comment: string;
  customer_name: string;
  created_at: string;
};

export type ReviewList = {
  items: ReviewPublic[];
  total: number;
};

export type ReviewCreate = {
  rating: number;
  comment: string;
};
