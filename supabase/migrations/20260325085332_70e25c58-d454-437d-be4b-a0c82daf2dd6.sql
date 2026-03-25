
-- Add SELECT policy for users to read their own avatars (needed for upsert)
CREATE POLICY "Users can read their own avatar"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
