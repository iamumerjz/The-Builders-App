CREATE POLICY "Users can delete their own work photos"
ON public.work_photos
FOR DELETE
TO authenticated
USING (auth.uid() = uploaded_by);