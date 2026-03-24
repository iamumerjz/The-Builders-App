export interface Professional {
  id: string;
  user_id: string;
  name: string;
  profession: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  city: string;
  available: boolean;
  availability: string[];
  yearsExperience: number;
  jobsCompleted: number;
  responseTime: string;
  repeatClients: number;
  bio: string;
  skills: string[];
  portfolio: string[];
  topRated?: boolean;
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  jobType: string;
}

export interface Testimonial {
  id: string;
  text: string;
  author: string;
  jobType: string;
  rating: number;
}

export const categories = [
  { name: "Carpenter", icon: "Hammer" },
  { name: "Plumber", icon: "Wrench" },
  { name: "Electrician", icon: "Zap" },
  { name: "Painter", icon: "Paintbrush" },
  { name: "Mason", icon: "Blocks" },
  { name: "Welder", icon: "Flame" },
  { name: "Roofer", icon: "Home" },
  { name: "HVAC", icon: "Wind" },
  { name: "Landscaper", icon: "Trees" },
  { name: "Interior Designer", icon: "Palette" },
] as const;

export const testimonials: Testimonial[] = [
  { id: "1", text: "The Builders completely changed how I find contractors. Found a fantastic electrician in 10 minutes — booked and done!", author: "Hira Noor", jobType: "Electrical Work", rating: 5 },
  { id: "2", text: "The bargaining feature is genius. I got a great rate on my bathroom remodel and the plumber was top-tier.", author: "Kamran Shahid", jobType: "Bathroom Remodel", rating: 5 },
  { id: "3", text: "As a homeowner, I've tried every platform. The Builders' verified pros and real reviews make all the difference.", author: "Zainab Iqbal", jobType: "Kitchen Renovation", rating: 5 },
];

export const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];
