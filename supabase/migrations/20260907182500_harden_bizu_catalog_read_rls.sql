-- Bizu do Concurseiro X only.
-- Harden authenticated catalog reads so students cannot retrieve unpublished content
-- through the generic /data/* API. Administrators retain full visibility.
-- Do not modify any r27_* resource.

DROP POLICY IF EXISTS bizu_catalog_read ON public.bizu_competitions;
CREATE POLICY bizu_catalog_read ON public.bizu_competitions
FOR SELECT TO authenticated
USING (published OR private.is_admin());

DROP POLICY IF EXISTS bizu_catalog_read ON public.bizu_courses;
CREATE POLICY bizu_catalog_read ON public.bizu_courses
FOR SELECT TO authenticated
USING (published OR private.is_admin());

DROP POLICY IF EXISTS bizu_catalog_read ON public.bizu_edicts;
CREATE POLICY bizu_catalog_read ON public.bizu_edicts
FOR SELECT TO authenticated
USING (published OR private.is_admin());

DROP POLICY IF EXISTS bizu_catalog_read ON public.bizu_laws;
CREATE POLICY bizu_catalog_read ON public.bizu_laws
FOR SELECT TO authenticated
USING (published OR private.is_admin());

DROP POLICY IF EXISTS bizu_catalog_read ON public.bizu_lessons;
CREATE POLICY bizu_catalog_read ON public.bizu_lessons
FOR SELECT TO authenticated
USING (published OR private.is_admin());

DROP POLICY IF EXISTS bizu_catalog_read ON public.bizu_materials;
CREATE POLICY bizu_catalog_read ON public.bizu_materials
FOR SELECT TO authenticated
USING (published OR private.is_admin());

DROP POLICY IF EXISTS bizu_catalog_read ON public.bizu_mindmaps;
CREATE POLICY bizu_catalog_read ON public.bizu_mindmaps
FOR SELECT TO authenticated
USING (published OR private.is_admin());

DROP POLICY IF EXISTS bizu_catalog_read ON public.bizu_news;
CREATE POLICY bizu_catalog_read ON public.bizu_news
FOR SELECT TO authenticated
USING (published OR private.is_admin());

DROP POLICY IF EXISTS bizu_catalog_read ON public.bizu_questions;
CREATE POLICY bizu_catalog_read ON public.bizu_questions
FOR SELECT TO authenticated
USING (published OR private.is_admin());

DROP POLICY IF EXISTS bizu_catalog_read ON public.bizu_simulations;
CREATE POLICY bizu_catalog_read ON public.bizu_simulations
FOR SELECT TO authenticated
USING (published OR private.is_admin());

DROP POLICY IF EXISTS bizu_catalog_read ON public.bizu_curriculum;
CREATE POLICY bizu_catalog_read ON public.bizu_curriculum
FOR SELECT TO authenticated
USING (active OR private.is_admin());

DROP POLICY IF EXISTS bizu_catalog_read ON public.bizu_subjects;
CREATE POLICY bizu_catalog_read ON public.bizu_subjects
FOR SELECT TO authenticated
USING (active OR private.is_admin());

DROP POLICY IF EXISTS bizu_catalog_read ON public.bizu_topics;
CREATE POLICY bizu_catalog_read ON public.bizu_topics
FOR SELECT TO authenticated
USING (active OR private.is_admin());

DROP POLICY IF EXISTS bizu_catalog_read ON public.bizu_law_articles;
CREATE POLICY bizu_catalog_read ON public.bizu_law_articles
FOR SELECT TO authenticated
USING (
  private.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.bizu_laws l
    WHERE l.id = bizu_law_articles.law_id
      AND l.published = true
  )
);
