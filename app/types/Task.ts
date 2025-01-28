export type Task = {
  id: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'assigned';
  work_mode: 'physical' | 'remote';
  name: string;
  bids_count: number;
  bids: { price: number; bidder_image: string }[];
  budget: number;
  category?: string;
  location?: string;
  posted_at?: string;
  assignment?: {
    id: number;
    status: string;
    task_doer: {
      id: number;
      name: string;
      image: string;
    };
    agreed_price: number;
  };
}; 