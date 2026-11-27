export interface Mentor {
  _id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  expertise: string[];
  socials: {
    linkedin?: string;
    twitter?: string;
  };
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  icon?: string;
  image_url?: string | null;
  is_read: boolean;
  redirect_url?: string | null;
  created_at: string;
  read_at?: string | null;
}


export interface UserProfile {
  avatar_url: string | null;
  contact_no?: string;
  gender?: string;
  college?: string;
  course?: string;
  branch?: string;
  graduation_year?: string;
  current_address?: string;
  state?: string;
  city?: string;
  education?: string;
  skills?: string[];
  career_interests?: string[];
  social_media?: string;
}

export interface User {
  user_id: string;
  role?: string;
  full_name: string;
  email: string;
  provider?: string;
  email_verified?: boolean;
  profile_completed: string | null;
  is_profile_completed?: boolean;
  profile: UserProfile;
}

export interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  duration: string;
  stipend: string;
  description: string;
  requirements: string;
  status: "Active" | "Inactive";
  createdAt: string;

  // ✅ ADD THESE
  imageUrl?: string;
  public_id?: string;
}

export interface Ad {
  _id: string;
  placement?: "hero" | "modal";
  image: string;
  height?: string;
  width?: string;
  buttonText?: string;
  buttonLink?: string;
  buttonColor?: string;
  buttonBg?: string;
  buttonSize?: string;
  buttonBorderRadius?: string;
  autoCloseSeconds?: number;
  active?: boolean;
  order?: number;
  views?: number;
  clicks?: number;
}
