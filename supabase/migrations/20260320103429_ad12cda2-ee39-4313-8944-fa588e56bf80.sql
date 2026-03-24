-- Work photos table (pro uploads after completing work)
CREATE TABLE public.work_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  photo_url text NOT NULL,
  caption text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.work_photos ENABLE ROW LEVEL SECURITY;

-- Anyone involved in the booking can view work photos
CREATE POLICY "Users can view work photos for their bookings"
ON public.work_photos FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = work_photos.booking_id
    AND (b.client_id = auth.uid() OR b.pro_id = auth.uid())
  )
);

-- Users can upload work photos for their bookings
CREATE POLICY "Users can upload work photos"
ON public.work_photos FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = uploaded_by
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = work_photos.booking_id
    AND (b.client_id = auth.uid() OR b.pro_id = auth.uid())
  )
);

-- Review photos table
CREATE TABLE public.review_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review photos are viewable by everyone"
ON public.review_photos FOR SELECT TO public
USING (true);

CREATE POLICY "Users can add review photos"
ON public.review_photos FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.id = review_photos.review_id
    AND r.client_id = auth.uid()
  )
);

-- Create work-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('work-photos', 'work-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload work photos to storage"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'work-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Work photos are publicly accessible"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'work-photos');

CREATE POLICY "Users can delete their work photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'work-photos' AND (storage.foldername(name))[1] = auth.uid()::text);