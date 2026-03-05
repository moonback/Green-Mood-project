-- Track authenticated user devices/sessions for self-management in Profile page
CREATE TABLE IF NOT EXISTS public.user_active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  device_name text,
  user_agent text,
  ip_address text,
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_id)
);

ALTER TABLE public.user_active_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_self_select" ON public.user_active_sessions;
CREATE POLICY "sessions_self_select"
  ON public.user_active_sessions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "sessions_self_insert" ON public.user_active_sessions;
CREATE POLICY "sessions_self_insert"
  ON public.user_active_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "sessions_self_update" ON public.user_active_sessions;
CREATE POLICY "sessions_self_update"
  ON public.user_active_sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "sessions_self_delete" ON public.user_active_sessions;
CREATE POLICY "sessions_self_delete"
  ON public.user_active_sessions FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_user_active_sessions_user_last_seen
  ON public.user_active_sessions(user_id, last_seen DESC);
