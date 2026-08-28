-- Telemetry for a rejected echo attempt (EchoRejectedError, MR-5). The child
-- never sees this — submitPractice silently downgrades to practice-mode
-- scoring — but a rejection means the app's own echoIsDue guess was wrong,
-- which is exactly the class of bug that must not become invisible. This
-- table is the thing to query on launch day if echoes look off.
create table if not exists echo_rejections (
  id serial primary key,
  user_id text not null,
  child_id text not null,
  kanji text not null,
  session_id text not null,
  clause text not null,
  message text not null,
  almost_at timestamptz,
  attempted_at timestamptz not null,
  delta_hours double precision,
  created_at timestamptz not null default now()
);

create index if not exists echo_rejections_child_idx on echo_rejections (child_id, created_at desc);
