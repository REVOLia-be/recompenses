-- Index couvrants pour les clés étrangères (advisor performance « unindexed_foreign_keys »).
-- Les index (child_id) seuls deviennent redondants avec (child_id, family_id).

create index if not exists point_events_child_family_idx       on pepites.point_events (child_id, family_id);
create index if not exists point_events_created_by_idx         on pepites.point_events (created_by);

create index if not exists redemptions_child_family_idx        on pepites.redemptions (child_id, family_id);
create index if not exists redemptions_reward_family_idx       on pepites.redemptions (reward_id, family_id);
create index if not exists redemptions_created_by_idx          on pepites.redemptions (created_by);

create index if not exists mission_completions_child_family_idx   on pepites.mission_completions (child_id, family_id);
create index if not exists mission_completions_mission_family_idx on pepites.mission_completions (mission_id, family_id);
create index if not exists mission_completions_event_id_idx       on pepites.mission_completions (event_id);

drop index if exists pepites.redemptions_child_id_idx;
drop index if exists pepites.mission_completions_child_id_idx;
