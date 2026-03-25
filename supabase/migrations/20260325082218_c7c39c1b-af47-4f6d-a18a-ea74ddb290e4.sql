DROP POLICY IF EXISTS "Users can upload work photos" ON public.work_photos;

CREATE POLICY "Users can upload work photos"
ON public.work_photos
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = uploaded_by
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id
    AND (b.client_id = auth.uid() OR b.pro_id = auth.uid())
  )
);