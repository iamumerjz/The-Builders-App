
-- Allow anyone to see work photos (for public pro profiles)
DROP POLICY IF EXISTS "Users can view work photos for their bookings" ON public.work_photos;
CREATE POLICY "Work photos are viewable by everyone" ON public.work_photos
FOR SELECT TO public USING (true);
