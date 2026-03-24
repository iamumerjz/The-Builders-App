
-- Pro profiles (extended info for labourers/professionals)
CREATE TABLE public.pro_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  profession text NOT NULL DEFAULT '',
  bio text DEFAULT '',
  hourly_rate integer NOT NULL DEFAULT 0,
  years_experience integer DEFAULT 0,
  response_time text DEFAULT '< 1 hour',
  available boolean DEFAULT true,
  skills text[] DEFAULT '{}',
  availability_schedule text[] DEFAULT '{}',
  avatar_url text DEFAULT '',
  portfolio text[] DEFAULT '{}',
  city text DEFAULT '',
  phone text DEFAULT '',
  full_name text DEFAULT '',
  top_rated boolean DEFAULT false,
  jobs_completed integer DEFAULT 0,
  repeat_clients integer DEFAULT 0,
  total_earned integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bookings
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pro_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service text NOT NULL,
  booking_date date NOT NULL,
  time_slot text NOT NULL,
  rate integer NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  payment_method text DEFAULT 'cash',
  reference_code text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Negotiations
CREATE TABLE public.negotiations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pro_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service text NOT NULL,
  listed_rate integer NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Negotiation messages
CREATE TABLE public.negotiation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id uuid REFERENCES public.negotiations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_role text NOT NULL,
  type text NOT NULL,
  amount integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pro_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating integer NOT NULL DEFAULT 5,
  text text DEFAULT '',
  job_type text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Favorites
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pro_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, pro_id)
);

-- RLS Policies
ALTER TABLE public.pro_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Pro profiles: public read, owner write
CREATE POLICY "Pro profiles are viewable by everyone" ON public.pro_profiles FOR SELECT TO public USING (true);
CREATE POLICY "Pros can insert their own profile" ON public.pro_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Pros can update their own profile" ON public.pro_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Bookings: client and pro can see their bookings, client can insert
CREATE POLICY "Users can view their bookings" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = client_id OR auth.uid() = pro_id);
CREATE POLICY "Clients can create bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can update their bookings" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = client_id OR auth.uid() = pro_id);

-- Negotiations: client and pro can see their negotiations
CREATE POLICY "Users can view their negotiations" ON public.negotiations FOR SELECT TO authenticated USING (auth.uid() = client_id OR auth.uid() = pro_id);
CREATE POLICY "Clients can create negotiations" ON public.negotiations FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can update negotiations" ON public.negotiations FOR UPDATE TO authenticated USING (auth.uid() = client_id OR auth.uid() = pro_id);

-- Negotiation messages: parties can see messages from their negotiations
CREATE POLICY "Users can view negotiation messages" ON public.negotiation_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.negotiations n WHERE n.id = negotiation_id AND (n.client_id = auth.uid() OR n.pro_id = auth.uid()))
);
CREATE POLICY "Users can send negotiation messages" ON public.negotiation_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- Reviews: public read, client insert
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT TO public USING (true);
CREATE POLICY "Clients can create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

-- Favorites: client can manage their favorites
CREATE POLICY "Users can view their favorites" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can remove favorites" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = client_id);

-- Trigger for auto-creating pro_profile on signup if is_labourer
CREATE OR REPLACE FUNCTION public.handle_new_pro_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF COALESCE((NEW.raw_user_meta_data->>'is_labourer')::boolean, false) THEN
    INSERT INTO public.pro_profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_pro
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_pro_profile();

-- Enable realtime for negotiations and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.negotiations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.negotiation_messages;

-- Update trigger for pro_profiles
CREATE TRIGGER update_pro_profiles_updated_at
  BEFORE UPDATE ON public.pro_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for bookings
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for negotiations
CREATE TRIGGER update_negotiations_updated_at
  BEFORE UPDATE ON public.negotiations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
