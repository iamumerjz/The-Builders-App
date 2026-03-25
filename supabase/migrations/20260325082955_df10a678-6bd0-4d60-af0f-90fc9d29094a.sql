CREATE OR REPLACE FUNCTION public.user_can_access_booking(_booking_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = _booking_id
      AND (_user_id = b.client_id OR _user_id = b.pro_id)
  );
$$;

DROP POLICY IF EXISTS "Users can upload work photos" ON public.work_photos;
CREATE POLICY "Users can upload work photos"
ON public.work_photos
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = uploaded_by
  AND public.user_can_access_booking(booking_id, auth.uid())
);

DROP POLICY IF EXISTS "Users can view work photos for their bookings" ON public.work_photos;
CREATE POLICY "Users can view work photos for their bookings"
ON public.work_photos
FOR SELECT
TO authenticated
USING (public.user_can_access_booking(booking_id, auth.uid()));