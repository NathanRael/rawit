-- Run in the hosted project's SQL Editor after deploying the dispatcher.
-- First create Vault secrets named rawit_project_url (for example,
-- https://your-project.supabase.co) and rawit_cron_secret. The latter must
-- match RAWIT_CRON_SECRET in Edge Function secrets. Do not put secret values here.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'rawit_project_url')
    or not exists (select 1 from vault.decrypted_secrets where name = 'rawit_cron_secret') then
    raise exception 'Create rawit_project_url and rawit_cron_secret in Vault first';
  end if;
end;
$$;

select cron.schedule(
  'rawit-email-reminders-daily',
  '0 6 * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'rawit_project_url') || '/functions/v1/dispatch-reminder-emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-rawit-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'rawit_cron_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    );
  $$
);
