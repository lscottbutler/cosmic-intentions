--
-- PostgreSQL database dump
--

\restrict pcrD6LRg502Q3qEWVVdlxfm6BAwBvSztRCDXO6K94Hjh3SdB7w1iZxMBV3CCj61

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.10 (Ubuntu 17.10-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP EVENT TRIGGER IF EXISTS pgrst_drop_watch;
DROP EVENT TRIGGER IF EXISTS pgrst_ddl_watch;
DROP EVENT TRIGGER IF EXISTS issue_pg_net_access;
DROP EVENT TRIGGER IF EXISTS issue_pg_graphql_access;
DROP EVENT TRIGGER IF EXISTS issue_pg_cron_access;
DROP EVENT TRIGGER IF EXISTS issue_graphql_placeholder;
DROP EVENT TRIGGER IF EXISTS ensure_rls;
DROP PUBLICATION IF EXISTS supabase_realtime_messages_publication;
DROP PUBLICATION IF EXISTS supabase_realtime;
DROP POLICY IF EXISTS "vision update own" ON storage.objects;
DROP POLICY IF EXISTS "vision insert own" ON storage.objects;
DROP POLICY IF EXISTS "public read content" ON public.content_blocks;
DROP POLICY IF EXISTS "public read" ON public.content_blocks;
DROP POLICY IF EXISTS "owner writes score" ON public.user_scores;
DROP POLICY IF EXISTS "owner updates score" ON public.user_scores;
DROP POLICY IF EXISTS own ON public.activity_log;
DROP POLICY IF EXISTS "authed write content" ON public.content_blocks;
DROP POLICY IF EXISTS "authed can read scores" ON public.user_scores;
DROP POLICY IF EXISTS "auth write" ON public.content_blocks;
DROP POLICY IF EXISTS "anon can join waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Users can update own intentions" ON public.intentions;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own intentions" ON public.intentions;
DROP POLICY IF EXISTS "Users can insert own intentions" ON public.intentions;
ALTER TABLE IF EXISTS ONLY storage.vector_indexes DROP CONSTRAINT IF EXISTS vector_indexes_bucket_id_fkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads_parts DROP CONSTRAINT IF EXISTS s3_multipart_uploads_parts_upload_id_fkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads_parts DROP CONSTRAINT IF EXISTS s3_multipart_uploads_parts_bucket_id_fkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads DROP CONSTRAINT IF EXISTS s3_multipart_uploads_bucket_id_fkey;
ALTER TABLE IF EXISTS ONLY storage.objects DROP CONSTRAINT IF EXISTS "objects_bucketId_fkey";
ALTER TABLE IF EXISTS ONLY public.user_scores DROP CONSTRAINT IF EXISTS user_scores_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.roadmap_items DROP CONSTRAINT IF EXISTS roadmap_items_content_id_fkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE IF EXISTS ONLY public.intentions DROP CONSTRAINT IF EXISTS intentions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.daily_log DROP CONSTRAINT IF EXISTS daily_log_roadmap_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.activity_log DROP CONSTRAINT IF EXISTS activity_log_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.webauthn_credentials DROP CONSTRAINT IF EXISTS webauthn_credentials_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.webauthn_challenges DROP CONSTRAINT IF EXISTS webauthn_challenges_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.sso_domains DROP CONSTRAINT IF EXISTS sso_domains_sso_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.sessions DROP CONSTRAINT IF EXISTS sessions_oauth_client_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.saml_relay_states DROP CONSTRAINT IF EXISTS saml_relay_states_sso_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.saml_relay_states DROP CONSTRAINT IF EXISTS saml_relay_states_flow_state_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.saml_providers DROP CONSTRAINT IF EXISTS saml_providers_sso_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_session_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.one_time_tokens DROP CONSTRAINT IF EXISTS one_time_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_consents DROP CONSTRAINT IF EXISTS oauth_consents_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_consents DROP CONSTRAINT IF EXISTS oauth_consents_client_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_authorizations DROP CONSTRAINT IF EXISTS oauth_authorizations_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_authorizations DROP CONSTRAINT IF EXISTS oauth_authorizations_client_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_factors DROP CONSTRAINT IF EXISTS mfa_factors_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_challenges DROP CONSTRAINT IF EXISTS mfa_challenges_auth_factor_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_amr_claims DROP CONSTRAINT IF EXISTS mfa_amr_claims_session_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.identities DROP CONSTRAINT IF EXISTS identities_user_id_fkey;
DROP TRIGGER IF EXISTS update_objects_updated_at ON storage.objects;
DROP TRIGGER IF EXISTS protect_objects_delete ON storage.objects;
DROP TRIGGER IF EXISTS protect_buckets_delete ON storage.buckets;
DROP TRIGGER IF EXISTS enforce_bucket_name_length_trigger ON storage.buckets;
DROP TRIGGER IF EXISTS tr_check_filters ON realtime.subscription;
DROP INDEX IF EXISTS storage.vector_indexes_name_bucket_id_idx;
DROP INDEX IF EXISTS storage.name_prefix_search;
DROP INDEX IF EXISTS storage.idx_objects_bucket_id_name_lower;
DROP INDEX IF EXISTS storage.idx_objects_bucket_id_name;
DROP INDEX IF EXISTS storage.idx_multipart_uploads_list;
DROP INDEX IF EXISTS storage.buckets_analytics_unique_name_idx;
DROP INDEX IF EXISTS storage.bucketid_objname;
DROP INDEX IF EXISTS storage.bname;
DROP INDEX IF EXISTS realtime.subscription_subscription_id_entity_filters_action_filter_selec;
DROP INDEX IF EXISTS realtime.messages_inserted_at_topic_index;
DROP INDEX IF EXISTS realtime.ix_realtime_subscription_entity;
DROP INDEX IF EXISTS auth.webauthn_credentials_user_id_idx;
DROP INDEX IF EXISTS auth.webauthn_credentials_credential_id_key;
DROP INDEX IF EXISTS auth.webauthn_challenges_user_id_idx;
DROP INDEX IF EXISTS auth.webauthn_challenges_expires_at_idx;
DROP INDEX IF EXISTS auth.users_is_anonymous_idx;
DROP INDEX IF EXISTS auth.users_instance_id_idx;
DROP INDEX IF EXISTS auth.users_instance_id_email_idx;
DROP INDEX IF EXISTS auth.users_email_partial_key;
DROP INDEX IF EXISTS auth.user_id_created_at_idx;
DROP INDEX IF EXISTS auth.unique_phone_factor_per_user;
DROP INDEX IF EXISTS auth.sso_providers_resource_id_pattern_idx;
DROP INDEX IF EXISTS auth.sso_providers_resource_id_idx;
DROP INDEX IF EXISTS auth.sso_domains_sso_provider_id_idx;
DROP INDEX IF EXISTS auth.sso_domains_domain_idx;
DROP INDEX IF EXISTS auth.sessions_user_id_idx;
DROP INDEX IF EXISTS auth.sessions_oauth_client_id_idx;
DROP INDEX IF EXISTS auth.sessions_not_after_idx;
DROP INDEX IF EXISTS auth.saml_relay_states_sso_provider_id_idx;
DROP INDEX IF EXISTS auth.saml_relay_states_for_email_idx;
DROP INDEX IF EXISTS auth.saml_relay_states_created_at_idx;
DROP INDEX IF EXISTS auth.saml_providers_sso_provider_id_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_updated_at_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_session_id_revoked_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_parent_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_instance_id_user_id_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_instance_id_idx;
DROP INDEX IF EXISTS auth.recovery_token_idx;
DROP INDEX IF EXISTS auth.reauthentication_token_idx;
DROP INDEX IF EXISTS auth.one_time_tokens_user_id_token_type_key;
DROP INDEX IF EXISTS auth.one_time_tokens_token_hash_hash_idx;
DROP INDEX IF EXISTS auth.one_time_tokens_relates_to_hash_idx;
DROP INDEX IF EXISTS auth.oauth_consents_user_order_idx;
DROP INDEX IF EXISTS auth.oauth_consents_active_user_client_idx;
DROP INDEX IF EXISTS auth.oauth_consents_active_client_idx;
DROP INDEX IF EXISTS auth.oauth_clients_deleted_at_idx;
DROP INDEX IF EXISTS auth.oauth_auth_pending_exp_idx;
DROP INDEX IF EXISTS auth.mfa_factors_user_id_idx;
DROP INDEX IF EXISTS auth.mfa_factors_user_friendly_name_unique;
DROP INDEX IF EXISTS auth.mfa_challenge_created_at_idx;
DROP INDEX IF EXISTS auth.idx_user_id_auth_method;
DROP INDEX IF EXISTS auth.idx_oauth_client_states_created_at;
DROP INDEX IF EXISTS auth.idx_auth_code;
DROP INDEX IF EXISTS auth.identities_user_id_idx;
DROP INDEX IF EXISTS auth.identities_email_idx;
DROP INDEX IF EXISTS auth.flow_state_created_at_idx;
DROP INDEX IF EXISTS auth.factor_id_created_at_idx;
DROP INDEX IF EXISTS auth.email_change_token_new_idx;
DROP INDEX IF EXISTS auth.email_change_token_current_idx;
DROP INDEX IF EXISTS auth.custom_oauth_providers_provider_type_idx;
DROP INDEX IF EXISTS auth.custom_oauth_providers_identifier_idx;
DROP INDEX IF EXISTS auth.custom_oauth_providers_enabled_idx;
DROP INDEX IF EXISTS auth.custom_oauth_providers_created_at_idx;
DROP INDEX IF EXISTS auth.confirmation_token_idx;
DROP INDEX IF EXISTS auth.audit_logs_instance_id_idx;
ALTER TABLE IF EXISTS ONLY storage.vector_indexes DROP CONSTRAINT IF EXISTS vector_indexes_pkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads DROP CONSTRAINT IF EXISTS s3_multipart_uploads_pkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads_parts DROP CONSTRAINT IF EXISTS s3_multipart_uploads_parts_pkey;
ALTER TABLE IF EXISTS ONLY storage.objects DROP CONSTRAINT IF EXISTS objects_pkey;
ALTER TABLE IF EXISTS ONLY storage.migrations DROP CONSTRAINT IF EXISTS migrations_pkey;
ALTER TABLE IF EXISTS ONLY storage.migrations DROP CONSTRAINT IF EXISTS migrations_name_key;
ALTER TABLE IF EXISTS ONLY storage.buckets_vectors DROP CONSTRAINT IF EXISTS buckets_vectors_pkey;
ALTER TABLE IF EXISTS ONLY storage.buckets DROP CONSTRAINT IF EXISTS buckets_pkey;
ALTER TABLE IF EXISTS ONLY storage.buckets_analytics DROP CONSTRAINT IF EXISTS buckets_analytics_pkey;
ALTER TABLE IF EXISTS ONLY realtime.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY realtime.subscription DROP CONSTRAINT IF EXISTS pk_subscription;
ALTER TABLE IF EXISTS realtime.messages DROP CONSTRAINT IF EXISTS messages_payload_exclusive;
ALTER TABLE IF EXISTS ONLY realtime.messages_2026_04_15 DROP CONSTRAINT IF EXISTS messages_2026_04_15_pkey;
ALTER TABLE IF EXISTS ONLY realtime.messages_2026_04_14 DROP CONSTRAINT IF EXISTS messages_2026_04_14_pkey;
ALTER TABLE IF EXISTS ONLY realtime.messages_2026_04_13 DROP CONSTRAINT IF EXISTS messages_2026_04_13_pkey;
ALTER TABLE IF EXISTS ONLY realtime.messages_2026_04_12 DROP CONSTRAINT IF EXISTS messages_2026_04_12_pkey;
ALTER TABLE IF EXISTS ONLY realtime.messages_2026_04_11 DROP CONSTRAINT IF EXISTS messages_2026_04_11_pkey;
ALTER TABLE IF EXISTS ONLY realtime.messages_2026_04_10 DROP CONSTRAINT IF EXISTS messages_2026_04_10_pkey;
ALTER TABLE IF EXISTS ONLY realtime.messages_2026_04_09 DROP CONSTRAINT IF EXISTS messages_2026_04_09_pkey;
ALTER TABLE IF EXISTS ONLY realtime.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE IF EXISTS ONLY public.waitlist DROP CONSTRAINT IF EXISTS waitlist_pkey;
ALTER TABLE IF EXISTS ONLY public.waitlist DROP CONSTRAINT IF EXISTS waitlist_email_key;
ALTER TABLE IF EXISTS ONLY public.user_scores DROP CONSTRAINT IF EXISTS user_scores_pkey;
ALTER TABLE IF EXISTS ONLY public.user_content DROP CONSTRAINT IF EXISTS user_content_pkey;
ALTER TABLE IF EXISTS ONLY public.roadmap_items DROP CONSTRAINT IF EXISTS roadmap_items_pkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.intentions DROP CONSTRAINT IF EXISTS intentions_pkey;
ALTER TABLE IF EXISTS ONLY public.daily_log DROP CONSTRAINT IF EXISTS daily_log_pkey;
ALTER TABLE IF EXISTS ONLY public.content_blocks DROP CONSTRAINT IF EXISTS content_blocks_pkey;
ALTER TABLE IF EXISTS ONLY public.bts_context DROP CONSTRAINT IF EXISTS bts_context_pkey;
ALTER TABLE IF EXISTS ONLY public.activity_log DROP CONSTRAINT IF EXISTS activity_log_pkey;
ALTER TABLE IF EXISTS ONLY auth.webauthn_credentials DROP CONSTRAINT IF EXISTS webauthn_credentials_pkey;
ALTER TABLE IF EXISTS ONLY auth.webauthn_challenges DROP CONSTRAINT IF EXISTS webauthn_challenges_pkey;
ALTER TABLE IF EXISTS ONLY auth.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY auth.users DROP CONSTRAINT IF EXISTS users_phone_key;
ALTER TABLE IF EXISTS ONLY auth.sso_providers DROP CONSTRAINT IF EXISTS sso_providers_pkey;
ALTER TABLE IF EXISTS ONLY auth.sso_domains DROP CONSTRAINT IF EXISTS sso_domains_pkey;
ALTER TABLE IF EXISTS ONLY auth.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY auth.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY auth.saml_relay_states DROP CONSTRAINT IF EXISTS saml_relay_states_pkey;
ALTER TABLE IF EXISTS ONLY auth.saml_providers DROP CONSTRAINT IF EXISTS saml_providers_pkey;
ALTER TABLE IF EXISTS ONLY auth.saml_providers DROP CONSTRAINT IF EXISTS saml_providers_entity_id_key;
ALTER TABLE IF EXISTS ONLY auth.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_token_unique;
ALTER TABLE IF EXISTS ONLY auth.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;
ALTER TABLE IF EXISTS ONLY auth.one_time_tokens DROP CONSTRAINT IF EXISTS one_time_tokens_pkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_consents DROP CONSTRAINT IF EXISTS oauth_consents_user_client_unique;
ALTER TABLE IF EXISTS ONLY auth.oauth_consents DROP CONSTRAINT IF EXISTS oauth_consents_pkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_clients DROP CONSTRAINT IF EXISTS oauth_clients_pkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_client_states DROP CONSTRAINT IF EXISTS oauth_client_states_pkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_authorizations DROP CONSTRAINT IF EXISTS oauth_authorizations_pkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_authorizations DROP CONSTRAINT IF EXISTS oauth_authorizations_authorization_id_key;
ALTER TABLE IF EXISTS ONLY auth.oauth_authorizations DROP CONSTRAINT IF EXISTS oauth_authorizations_authorization_code_key;
ALTER TABLE IF EXISTS ONLY auth.mfa_factors DROP CONSTRAINT IF EXISTS mfa_factors_pkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_factors DROP CONSTRAINT IF EXISTS mfa_factors_last_challenged_at_key;
ALTER TABLE IF EXISTS ONLY auth.mfa_challenges DROP CONSTRAINT IF EXISTS mfa_challenges_pkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_amr_claims DROP CONSTRAINT IF EXISTS mfa_amr_claims_session_id_authentication_method_pkey;
ALTER TABLE IF EXISTS ONLY auth.instances DROP CONSTRAINT IF EXISTS instances_pkey;
ALTER TABLE IF EXISTS ONLY auth.identities DROP CONSTRAINT IF EXISTS identities_provider_id_provider_unique;
ALTER TABLE IF EXISTS ONLY auth.identities DROP CONSTRAINT IF EXISTS identities_pkey;
ALTER TABLE IF EXISTS ONLY auth.flow_state DROP CONSTRAINT IF EXISTS flow_state_pkey;
ALTER TABLE IF EXISTS ONLY auth.custom_oauth_providers DROP CONSTRAINT IF EXISTS custom_oauth_providers_pkey;
ALTER TABLE IF EXISTS ONLY auth.custom_oauth_providers DROP CONSTRAINT IF EXISTS custom_oauth_providers_identifier_key;
ALTER TABLE IF EXISTS ONLY auth.audit_log_entries DROP CONSTRAINT IF EXISTS audit_log_entries_pkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_amr_claims DROP CONSTRAINT IF EXISTS amr_id_pk;
ALTER TABLE IF EXISTS auth.refresh_tokens ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS storage.vector_indexes;
DROP TABLE IF EXISTS storage.s3_multipart_uploads_parts;
DROP TABLE IF EXISTS storage.s3_multipart_uploads;
DROP TABLE IF EXISTS storage.objects;
DROP TABLE IF EXISTS storage.migrations;
DROP TABLE IF EXISTS storage.buckets_vectors;
DROP TABLE IF EXISTS storage.buckets_analytics;
DROP TABLE IF EXISTS storage.buckets;
DROP TABLE IF EXISTS realtime.subscription;
DROP TABLE IF EXISTS realtime.schema_migrations;
DROP TABLE IF EXISTS realtime.messages_2026_04_15;
DROP TABLE IF EXISTS realtime.messages_2026_04_14;
DROP TABLE IF EXISTS realtime.messages_2026_04_13;
DROP TABLE IF EXISTS realtime.messages_2026_04_12;
DROP TABLE IF EXISTS realtime.messages_2026_04_11;
DROP TABLE IF EXISTS realtime.messages_2026_04_10;
DROP TABLE IF EXISTS realtime.messages_2026_04_09;
DROP TABLE IF EXISTS realtime.messages;
DROP TABLE IF EXISTS public.waitlist;
DROP TABLE IF EXISTS public.user_scores;
DROP TABLE IF EXISTS public.user_content;
DROP TABLE IF EXISTS public.roadmap_items;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.intentions;
DROP TABLE IF EXISTS public.daily_log;
DROP TABLE IF EXISTS public.content_blocks;
DROP TABLE IF EXISTS public.bts_context;
DROP TABLE IF EXISTS public.activity_log;
DROP TABLE IF EXISTS auth.webauthn_credentials;
DROP TABLE IF EXISTS auth.webauthn_challenges;
DROP TABLE IF EXISTS auth.users;
DROP TABLE IF EXISTS auth.sso_providers;
DROP TABLE IF EXISTS auth.sso_domains;
DROP TABLE IF EXISTS auth.sessions;
DROP TABLE IF EXISTS auth.schema_migrations;
DROP TABLE IF EXISTS auth.saml_relay_states;
DROP TABLE IF EXISTS auth.saml_providers;
DROP SEQUENCE IF EXISTS auth.refresh_tokens_id_seq;
DROP TABLE IF EXISTS auth.refresh_tokens;
DROP TABLE IF EXISTS auth.one_time_tokens;
DROP TABLE IF EXISTS auth.oauth_consents;
DROP TABLE IF EXISTS auth.oauth_clients;
DROP TABLE IF EXISTS auth.oauth_client_states;
DROP TABLE IF EXISTS auth.oauth_authorizations;
DROP TABLE IF EXISTS auth.mfa_factors;
DROP TABLE IF EXISTS auth.mfa_challenges;
DROP TABLE IF EXISTS auth.mfa_amr_claims;
DROP TABLE IF EXISTS auth.instances;
DROP TABLE IF EXISTS auth.identities;
DROP TABLE IF EXISTS auth.flow_state;
DROP TABLE IF EXISTS auth.custom_oauth_providers;
DROP TABLE IF EXISTS auth.audit_log_entries;
DROP FUNCTION IF EXISTS storage.update_updated_at_column();
DROP FUNCTION IF EXISTS storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text);
DROP FUNCTION IF EXISTS storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text);
DROP FUNCTION IF EXISTS storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text);
DROP FUNCTION IF EXISTS storage.protect_delete();
DROP FUNCTION IF EXISTS storage.operation();
DROP FUNCTION IF EXISTS storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text);
DROP FUNCTION IF EXISTS storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text);
DROP FUNCTION IF EXISTS storage.get_size_by_bucket();
DROP FUNCTION IF EXISTS storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text);
DROP FUNCTION IF EXISTS storage.foldername(name text);
DROP FUNCTION IF EXISTS storage.filename(name text);
DROP FUNCTION IF EXISTS storage.extension(name text);
DROP FUNCTION IF EXISTS storage.enforce_bucket_name_length();
DROP FUNCTION IF EXISTS storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb);
DROP FUNCTION IF EXISTS storage.allow_only_operation(expected_operation text);
DROP FUNCTION IF EXISTS storage.allow_any_operation(expected_operations text[]);
DROP FUNCTION IF EXISTS realtime.wal2json_escape_identifier(name text);
DROP FUNCTION IF EXISTS realtime.topic();
DROP FUNCTION IF EXISTS realtime.to_regrole(role_name text);
DROP FUNCTION IF EXISTS realtime.subscription_check_filters();
DROP FUNCTION IF EXISTS realtime.send_binary(payload bytea, event text, topic text, private boolean);
DROP FUNCTION IF EXISTS realtime.send(payload jsonb, event text, topic text, private boolean);
DROP FUNCTION IF EXISTS realtime.quote_wal2json(entity regclass);
DROP FUNCTION IF EXISTS realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer);
DROP FUNCTION IF EXISTS realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]);
DROP FUNCTION IF EXISTS realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text);
DROP FUNCTION IF EXISTS realtime."cast"(val text, type_ regtype);
DROP FUNCTION IF EXISTS realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]);
DROP FUNCTION IF EXISTS realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text);
DROP FUNCTION IF EXISTS realtime.apply_rls(wal jsonb, max_record_bytes integer);
DROP FUNCTION IF EXISTS public.rls_auto_enable();
DROP FUNCTION IF EXISTS public.increment_user_score(uid uuid, pts integer);
DROP FUNCTION IF EXISTS pgbouncer.get_auth(p_usename text);
DROP FUNCTION IF EXISTS graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb);
DROP FUNCTION IF EXISTS extensions.set_graphql_placeholder();
DROP FUNCTION IF EXISTS extensions.pgrst_drop_watch();
DROP FUNCTION IF EXISTS extensions.pgrst_ddl_watch();
DROP FUNCTION IF EXISTS extensions.grant_pg_net_access();
DROP FUNCTION IF EXISTS extensions.grant_pg_graphql_access();
DROP FUNCTION IF EXISTS extensions.grant_pg_cron_access();
DROP FUNCTION IF EXISTS auth.uid();
DROP FUNCTION IF EXISTS auth.role();
DROP FUNCTION IF EXISTS auth.jwt();
DROP FUNCTION IF EXISTS auth.email();
DROP TYPE IF EXISTS storage.buckettype;
DROP TYPE IF EXISTS realtime.wal_rls;
DROP TYPE IF EXISTS realtime.wal_column;
DROP TYPE IF EXISTS realtime.user_defined_filter;
DROP TYPE IF EXISTS realtime.equality_op;
DROP TYPE IF EXISTS realtime.action;
DROP TYPE IF EXISTS auth.one_time_token_type;
DROP TYPE IF EXISTS auth.oauth_response_type;
DROP TYPE IF EXISTS auth.oauth_registration_type;
DROP TYPE IF EXISTS auth.oauth_client_type;
DROP TYPE IF EXISTS auth.oauth_authorization_status;
DROP TYPE IF EXISTS auth.factor_type;
DROP TYPE IF EXISTS auth.factor_status;
DROP TYPE IF EXISTS auth.code_challenge_method;
DROP TYPE IF EXISTS auth.aal_level;
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS supabase_vault;
DROP EXTENSION IF EXISTS pgcrypto;
DROP EXTENSION IF EXISTS pg_stat_statements;
DROP SCHEMA IF EXISTS vault;
DROP SCHEMA IF EXISTS storage;
DROP SCHEMA IF EXISTS realtime;
DROP SCHEMA IF EXISTS pgbouncer;
DROP SCHEMA IF EXISTS graphql_public;
DROP SCHEMA IF EXISTS graphql;
DROP SCHEMA IF EXISTS extensions;
DROP SCHEMA IF EXISTS auth;
--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in',
    'like',
    'ilike',
    'is',
    'match',
    'imatch',
    'isdistinct'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: -
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: increment_user_score(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_user_score(uid uuid, pts integer) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    AS $$
  UPDATE user_scores
  SET total_score = total_score + pts,
      updated_at  = now()
  WHERE user_id = uid;
$$;


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
/*
Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
*/
declare
    op_symbol text = (
        case
            when op = 'eq' then '='
            when op = 'neq' then '!='
            when op = 'lt' then '<'
            when op = 'lte' then '<='
            when op = 'gt' then '>'
            when op = 'gte' then '>='
            when op = 'in' then '= any'
            else 'UNKNOWN OP'
        end
    );
    res boolean;
begin
    execute format(
        'select %L::'|| type_::text || ' ' || op_symbol
        || ' ( %L::'
        || (
            case
                when op = 'in' then type_::text || '[]'
                else type_::text end
        )
        || ')', val_1, val_2) into res;
    return res;
end;
$$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
/*
Should the record be visible (true) or filtered out (false) after *filters* are applied
*/
    select
        -- Default to allowed when no filters present
        $2 is null -- no filters. this should not happen because subscriptions has a default
        or array_length($2, 1) is null -- array length of an empty array is null
        or bool_and(
            coalesce(
                realtime.check_equality_op(
                    op:=f.op,
                    type_:=coalesce(
                        col.type_oid::regtype, -- null when wal2json version <= 2.4
                        col.type_name::regtype
                    ),
                    -- cast jsonb to text
                    val_1:=col.value #>> '{}',
                    val_2:=f.value
                ),
                false -- if null, filter does not match
            )
        )
    from
        unnest(filters) f
        join unnest(columns) col
            on f.column_name = col.name;
$_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: send_binary(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(a.attname order by a.attnum),
            '{}'::text[]
        )
        from
            pg_catalog.pg_attribute a
        where
            a.attrelid = new.entity
            and a.attnum > 0
            and not a.attisdropped
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                a.attrelid,
                a.attnum,
                'SELECT'
            );
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;

        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        else
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value),
        '{}'
    ) from unnest(new.filters) f;

    new.selected_columns = (
        select array_agg(c order by c)
        from unnest(new.selected_columns) c
    );

    return new;
end;
$$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_claims_allowlist text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    event_type text NOT NULL,
    metadata jsonb,
    points integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: bts_context; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bts_context (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    bts_context text
);


--
-- Name: bts_context_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.bts_context ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.bts_context_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: content_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_blocks (
    slug text NOT NULL,
    body text DEFAULT ''::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: daily_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    roadmap_item_id uuid,
    log_date date DEFAULT CURRENT_DATE,
    week_number integer,
    action_completed boolean DEFAULT false,
    streak_day integer DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: intentions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intentions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text,
    datestart text,
    target_date text,
    reviews integer DEFAULT 0,
    "position" integer DEFAULT 0,
    mindset_data jsonb,
    achievers_data text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    data jsonb,
    words jsonb,
    mindset jsonb,
    achievers jsonb,
    start_date text,
    bbfw jsonb,
    the_map jsonb,
    image_url text,
    roadmap_ai jsonb,
    active_danger_zone text
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    name text,
    mission text,
    lifegol text,
    "values" text,
    beliefs text,
    attitudes text,
    stoicism text,
    traits text,
    tone text,
    authors text,
    obstacles text,
    why text,
    context text,
    spirituality text DEFAULT 'universe'::text,
    anthropic_key text,
    eleven_key text,
    voice_id text,
    updated_at timestamp with time zone DEFAULT now(),
    bts_authors text,
    is_member boolean DEFAULT false,
    pegboard jsonb,
    bts_context text,
    bts_obstacles text,
    bts_why text,
    bts_tone text,
    pb_stoicism text,
    pb_traits text,
    pb_eleven text,
    pb_voiceid text,
    pb_attitudes text,
    pb_beliefs text,
    pb_values text,
    pb_lifegol text,
    pb_mission text,
    pb_name text,
    openai_api_key text DEFAULT ''::text,
    openai_voice text DEFAULT 'alloy'::text,
    viz_quick_sessions integer DEFAULT 0 NOT NULL,
    wins jsonb DEFAULT '[]'::jsonb
);


--
-- Name: roadmap_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roadmap_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    content_id uuid,
    week integer NOT NULL,
    phase integer NOT NULL,
    focus text,
    daily_action text,
    milestone text,
    is_complete boolean DEFAULT false,
    completed_at timestamp with time zone,
    CONSTRAINT roadmap_items_phase_check CHECK (((phase >= 1) AND (phase <= 3))),
    CONSTRAINT roadmap_items_week_check CHECK (((week >= 1) AND (week <= 12)))
);


--
-- Name: user_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    user_name text,
    goal text NOT NULL,
    belief_system text,
    core_blueprint jsonb,
    text_manifest jsonb,
    viz_script text,
    pipeline_version text DEFAULT '3.1'::text,
    generated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_scores (
    user_id uuid NOT NULL,
    display_name text,
    total_score integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: waitlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.waitlist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    source text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
)
PARTITION BY RANGE (inserted_at);


--
-- Name: messages_2026_04_09; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_04_09 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
);


--
-- Name: messages_2026_04_10; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_04_10 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
);


--
-- Name: messages_2026_04_11; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_04_11 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
);


--
-- Name: messages_2026_04_12; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_04_12 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
);


--
-- Name: messages_2026_04_13; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_04_13 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
);


--
-- Name: messages_2026_04_14; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_04_14 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
);


--
-- Name: messages_2026_04_15; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_04_15 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages_2026_04_09; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_04_09 FOR VALUES FROM ('2026-04-09 00:00:00') TO ('2026-04-10 00:00:00');


--
-- Name: messages_2026_04_10; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_04_10 FOR VALUES FROM ('2026-04-10 00:00:00') TO ('2026-04-11 00:00:00');


--
-- Name: messages_2026_04_11; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_04_11 FOR VALUES FROM ('2026-04-11 00:00:00') TO ('2026-04-12 00:00:00');


--
-- Name: messages_2026_04_12; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_04_12 FOR VALUES FROM ('2026-04-12 00:00:00') TO ('2026-04-13 00:00:00');


--
-- Name: messages_2026_04_13; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_04_13 FOR VALUES FROM ('2026-04-13 00:00:00') TO ('2026-04-14 00:00:00');


--
-- Name: messages_2026_04_14; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_04_14 FOR VALUES FROM ('2026-04-14 00:00:00') TO ('2026-04-15 00:00:00');


--
-- Name: messages_2026_04_15; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_04_15 FOR VALUES FROM ('2026-04-15 00:00:00') TO ('2026-04-16 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at, custom_claims_allowlist) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
868440e8-823b-4ca9-8e3b-385af4fb8879	868440e8-823b-4ca9-8e3b-385af4fb8879	{"sub": "868440e8-823b-4ca9-8e3b-385af4fb8879", "email": "lscottbutler+eric@gmail.com", "full_name": "Eric", "email_verified": false, "phone_verified": false}	email	2026-04-27 02:14:39.754473+00	2026-04-27 02:14:39.754528+00	2026-04-27 02:14:39.754528+00	5c8044fe-faf4-47f2-811b-56eec2bf76d8
0fa88179-af12-4659-ad95-c6ae5fbc23e1	0fa88179-af12-4659-ad95-c6ae5fbc23e1	{"sub": "0fa88179-af12-4659-ad95-c6ae5fbc23e1", "email": "lscottbutler@gmail.com", "full_name": "Biscuit", "email_verified": false, "phone_verified": false}	email	2026-04-27 05:16:11.938254+00	2026-04-27 05:16:11.9383+00	2026-04-27 05:16:11.9383+00	4476310e-a0f6-4a89-9ed6-bc0d3a255961
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
c6964f65-6b8b-41dc-9434-f5170b1088ab	2026-07-15 04:14:25.337624+00	2026-07-15 04:14:25.337624+00	password	242c3ecd-eb9a-428a-a339-1c97a046a104
4fcd1fe8-eb94-4ce1-baee-36b26ecfbed2	2026-07-15 04:14:54.142431+00	2026-07-15 04:14:54.142431+00	password	61a95c37-5b77-4d0f-88d6-e0ee0be64aba
de9bfd84-c9dc-4194-9e22-11a792f66730	2026-07-15 04:15:08.644254+00	2026-07-15 04:15:08.644254+00	password	fb4d83ba-9512-4f38-ab6f-734266ac9d47
c6fc937f-7f6d-4875-befe-08984018ad05	2026-07-15 07:22:55.504721+00	2026-07-15 07:22:55.504721+00	password	51d9a021-83f4-43fa-bc7c-e77eb0bd5879
77bd7187-b16e-473c-9994-04ba7dce5789	2026-07-15 07:46:14.105921+00	2026-07-15 07:46:14.105921+00	password	2314fed3-9a7d-47ab-8937-18dbe71bb719
7aeb3746-61bf-454f-8e43-053e16a19c76	2026-07-16 13:13:45.647082+00	2026-07-16 13:13:45.647082+00	password	95136536-bf29-4863-9f1e-7593d294a4cb
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	1019	dvaou2ijz6im	0fa88179-af12-4659-ad95-c6ae5fbc23e1	f	2026-07-15 04:14:25.335206+00	2026-07-15 04:14:25.335206+00	\N	c6964f65-6b8b-41dc-9434-f5170b1088ab
00000000-0000-0000-0000-000000000000	1020	2zojglgwpa5d	0fa88179-af12-4659-ad95-c6ae5fbc23e1	f	2026-07-15 04:14:54.141192+00	2026-07-15 04:14:54.141192+00	\N	4fcd1fe8-eb94-4ce1-baee-36b26ecfbed2
00000000-0000-0000-0000-000000000000	1021	xhzhw56tyjil	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-15 04:15:08.638072+00	2026-07-15 05:13:12.445227+00	\N	de9bfd84-c9dc-4194-9e22-11a792f66730
00000000-0000-0000-0000-000000000000	1022	z7ouslca7nbp	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-15 05:13:12.451193+00	2026-07-15 06:11:30.721856+00	xhzhw56tyjil	de9bfd84-c9dc-4194-9e22-11a792f66730
00000000-0000-0000-0000-000000000000	1025	xbwavett233k	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-15 07:46:14.103397+00	2026-07-15 09:17:13.332906+00	\N	77bd7187-b16e-473c-9994-04ba7dce5789
00000000-0000-0000-0000-000000000000	1026	ov4n6nvlqgok	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-15 09:17:13.338545+00	2026-07-15 10:26:13.113614+00	xbwavett233k	77bd7187-b16e-473c-9994-04ba7dce5789
00000000-0000-0000-0000-000000000000	1027	zo5bb5c2grsy	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-15 10:26:13.11833+00	2026-07-15 14:59:33.657502+00	ov4n6nvlqgok	77bd7187-b16e-473c-9994-04ba7dce5789
00000000-0000-0000-0000-000000000000	1024	ypai5veguaid	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-15 07:22:55.477462+00	2026-07-16 00:25:28.212919+00	\N	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1023	rrvbx3irxwhq	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-15 06:11:30.728972+00	2026-07-16 00:26:20.54387+00	z7ouslca7nbp	de9bfd84-c9dc-4194-9e22-11a792f66730
00000000-0000-0000-0000-000000000000	1029	7f43km7yjmvc	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-16 00:25:28.236045+00	2026-07-16 01:25:57.933472+00	ypai5veguaid	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1031	n537kvrwb6sh	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-16 01:25:57.937785+00	2026-07-16 02:24:05.082093+00	7f43km7yjmvc	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1032	2uebjtd6exnl	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-16 02:24:05.097451+00	2026-07-16 03:22:40.07012+00	n537kvrwb6sh	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1033	wblcbnui5g6b	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-16 03:22:40.087444+00	2026-07-16 04:20:39.995522+00	2uebjtd6exnl	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1034	mgyfrif2bhzn	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-16 04:20:40.013359+00	2026-07-16 05:18:51.557156+00	wblcbnui5g6b	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1035	tyfmz2ynkxwj	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-16 05:18:51.581448+00	2026-07-16 06:17:11.111829+00	mgyfrif2bhzn	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1030	zqcd6ftcxtde	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-16 00:26:20.54468+00	2026-07-16 06:54:14.22208+00	rrvbx3irxwhq	de9bfd84-c9dc-4194-9e22-11a792f66730
00000000-0000-0000-0000-000000000000	1037	cu3ce7z44ehy	0fa88179-af12-4659-ad95-c6ae5fbc23e1	f	2026-07-16 06:54:14.229301+00	2026-07-16 06:54:14.229301+00	zqcd6ftcxtde	de9bfd84-c9dc-4194-9e22-11a792f66730
00000000-0000-0000-0000-000000000000	1036	ofexsrysrx2l	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-16 06:17:11.128464+00	2026-07-16 07:32:22.352938+00	tyfmz2ynkxwj	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1038	l5n33lkvnnbq	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-16 07:32:22.367918+00	2026-07-16 08:30:27.993574+00	ofexsrysrx2l	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1039	6l4cglyemezg	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-16 08:30:28.008543+00	2026-07-16 12:47:47.374358+00	l5n33lkvnnbq	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1040	flcesp6dkaqe	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-16 12:47:47.402387+00	2026-07-16 13:46:08.728696+00	6l4cglyemezg	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1041	j46hgl73rxoh	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-16 13:13:45.643554+00	2026-07-16 14:12:03.510319+00	\N	7aeb3746-61bf-454f-8e43-053e16a19c76
00000000-0000-0000-0000-000000000000	1043	jxj3nw2yphlm	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-16 14:12:03.517406+00	2026-07-16 15:10:33.906201+00	j46hgl73rxoh	7aeb3746-61bf-454f-8e43-053e16a19c76
00000000-0000-0000-0000-000000000000	1044	qd5ym65rfdi5	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-16 15:10:33.917902+00	2026-07-16 23:19:27.363947+00	jxj3nw2yphlm	7aeb3746-61bf-454f-8e43-053e16a19c76
00000000-0000-0000-0000-000000000000	1045	bcruwirqn7y4	0fa88179-af12-4659-ad95-c6ae5fbc23e1	f	2026-07-16 23:19:27.383662+00	2026-07-16 23:19:27.383662+00	qd5ym65rfdi5	7aeb3746-61bf-454f-8e43-053e16a19c76
00000000-0000-0000-0000-000000000000	1042	tcgltz3p6xne	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-16 13:46:08.733569+00	2026-07-16 23:35:26.512621+00	flcesp6dkaqe	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1046	bt7o4l4mam2k	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-16 23:35:26.517553+00	2026-07-17 00:38:49.17471+00	tcgltz3p6xne	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1047	ujxogjqzc7bx	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-17 00:38:49.193875+00	2026-07-17 01:37:04.673965+00	bt7o4l4mam2k	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1048	6ncuj7ig7siu	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-17 01:37:04.689271+00	2026-07-17 02:35:20.001199+00	ujxogjqzc7bx	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1049	uyqzjtr6yk3l	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-17 02:35:20.011268+00	2026-07-17 03:33:43.780071+00	6ncuj7ig7siu	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1050	jut3rmn3d63v	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-17 03:33:43.788007+00	2026-07-17 04:31:50.33058+00	uyqzjtr6yk3l	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1051	lbtv4c5mejcm	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-17 04:31:50.335619+00	2026-07-17 05:30:20.488825+00	jut3rmn3d63v	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1052	xgoqu6bjlpn2	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-17 05:30:20.496668+00	2026-07-17 06:50:16.70643+00	lbtv4c5mejcm	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1028	7uluij3tj6ox	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-15 14:59:33.671267+00	2026-07-17 10:08:09.357069+00	zo5bb5c2grsy	77bd7187-b16e-473c-9994-04ba7dce5789
00000000-0000-0000-0000-000000000000	1054	edhkefnnw7os	0fa88179-af12-4659-ad95-c6ae5fbc23e1	f	2026-07-17 10:08:09.363921+00	2026-07-17 10:08:09.363921+00	7uluij3tj6ox	77bd7187-b16e-473c-9994-04ba7dce5789
00000000-0000-0000-0000-000000000000	1053	mfb5ov2shwbx	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-17 06:50:16.713846+00	2026-07-17 10:39:04.328312+00	xgoqu6bjlpn2	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1055	iquoktkspuqb	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-17 10:39:04.33462+00	2026-07-17 11:37:34.246399+00	mfb5ov2shwbx	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1056	poruk25ntnrd	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-17 11:37:34.251214+00	2026-07-17 12:35:53.583962+00	iquoktkspuqb	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1057	cujnbyvfjj57	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-17 12:35:53.588941+00	2026-07-17 13:34:04.385189+00	poruk25ntnrd	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1058	cqemtw6gpa3v	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-17 13:34:04.391934+00	2026-07-17 14:32:34.675183+00	cujnbyvfjj57	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1059	x7qefunwtjzn	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-17 14:32:34.680183+00	2026-07-17 15:31:04.454973+00	cqemtw6gpa3v	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1060	m6sinrxgpxj2	0fa88179-af12-4659-ad95-c6ae5fbc23e1	t	2026-07-17 15:31:04.460874+00	2026-07-17 16:29:34.461932+00	x7qefunwtjzn	c6fc937f-7f6d-4875-befe-08984018ad05
00000000-0000-0000-0000-000000000000	1061	2qjyreo75otl	0fa88179-af12-4659-ad95-c6ae5fbc23e1	f	2026-07-17 16:29:34.468964+00	2026-07-17 16:29:34.468964+00	m6sinrxgpxj2	c6fc937f-7f6d-4875-befe-08984018ad05
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
20260302000000
20260625000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
7aeb3746-61bf-454f-8e43-053e16a19c76	0fa88179-af12-4659-ad95-c6ae5fbc23e1	2026-07-16 13:13:45.619924+00	2026-07-16 23:19:27.401693+00	\N	aal1	\N	2026-07-16 23:19:27.401595	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	58.11.189.209	\N	\N	\N	\N	\N
c6964f65-6b8b-41dc-9434-f5170b1088ab	0fa88179-af12-4659-ad95-c6ae5fbc23e1	2026-07-15 04:14:25.326229+00	2026-07-15 04:14:25.326229+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	58.11.189.209	\N	\N	\N	\N	\N
4fcd1fe8-eb94-4ce1-baee-36b26ecfbed2	0fa88179-af12-4659-ad95-c6ae5fbc23e1	2026-07-15 04:14:54.140159+00	2026-07-15 04:14:54.140159+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	58.11.189.209	\N	\N	\N	\N	\N
77bd7187-b16e-473c-9994-04ba7dce5789	0fa88179-af12-4659-ad95-c6ae5fbc23e1	2026-07-15 07:46:14.091231+00	2026-07-17 10:08:09.375887+00	\N	aal1	\N	2026-07-17 10:08:09.375783	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	49.230.146.144	\N	\N	\N	\N	\N
c6fc937f-7f6d-4875-befe-08984018ad05	0fa88179-af12-4659-ad95-c6ae5fbc23e1	2026-07-15 07:22:55.442643+00	2026-07-17 16:29:34.482041+00	\N	aal1	\N	2026-07-17 16:29:34.481938	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	58.11.189.209	\N	\N	\N	\N	\N
de9bfd84-c9dc-4194-9e22-11a792f66730	0fa88179-af12-4659-ad95-c6ae5fbc23e1	2026-07-15 04:15:08.618738+00	2026-07-16 06:54:14.242893+00	\N	aal1	\N	2026-07-16 06:54:14.242791	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	58.11.189.209	\N	\N	\N	\N	\N
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	0fa88179-af12-4659-ad95-c6ae5fbc23e1	authenticated	authenticated	lscottbutler@gmail.com	$2a$10$XMkXToy3rf6GLPozKtwjYujoN3PObLb8nrBWOrahmyPinnUT.Bkt2	2026-04-27 05:16:11.944701+00	\N		\N		\N			\N	2026-07-16 13:13:45.61868+00	{"provider": "email", "providers": ["email"]}	{"sub": "0fa88179-af12-4659-ad95-c6ae5fbc23e1", "email": "lscottbutler@gmail.com", "full_name": "Biscuit", "email_verified": true, "phone_verified": false}	\N	2026-04-27 05:16:11.924654+00	2026-07-17 16:29:34.471292+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	868440e8-823b-4ca9-8e3b-385af4fb8879	authenticated	authenticated	lscottbutler+eric@gmail.com	$2a$10$f7OirmB.9bbwX2AzIGIlPOJnkKa32XTqfH/ctmgBY28fFVJzM31RW	2026-04-27 02:14:39.757501+00	\N		\N		\N			\N	2026-05-29 00:52:38.824204+00	{"provider": "email", "providers": ["email"]}	{"sub": "868440e8-823b-4ca9-8e3b-385af4fb8879", "email": "lscottbutler+eric@gmail.com", "full_name": "Eric", "email_verified": true, "phone_verified": false}	\N	2026-04-27 02:14:39.741495+00	2026-05-29 00:52:38.850103+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.webauthn_challenges (id, user_id, challenge_type, session_data, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.webauthn_credentials (id, user_id, credential_id, public_key, attestation_type, aaguid, sign_count, transports, backup_eligible, backed_up, friendly_name, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_log (id, user_id, event_type, metadata, points, created_at) FROM stdin;
19dfe6fd-6204-43a5-8b73-f2fe9d8af9b3	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-03 05:29:38.999+00
8f0d4be6-e929-402f-99d4-20d2af80040e	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-04 10:11:00.773+00
edc0d08c-3f85-4266-a1bb-c455fab9db0e	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "4-9-0"}	5	2026-06-04 11:39:14.716+00
865770f8-347d-4112-855d-1c966948def8	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "4-9-0"}	5	2026-06-04 11:39:17.036+00
056ad64b-c417-463d-a494-602092184f77	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "4-8-0"}	5	2026-06-04 11:39:27.438+00
b0e13307-900d-4851-85aa-cf24d93ed78e	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "4-8-0"}	5	2026-06-04 11:39:29.192+00
925c4831-abf8-4348-8b1a-fe34b84ed73f	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "4-7-0"}	5	2026-06-04 12:35:32.936+00
8ec30147-5917-4486-8cb5-3e916beeef95	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "4-9-0"}	5	2026-06-04 12:48:31.57+00
c1a2a886-9954-4285-a665-bc0b342abc0e	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "4-9-0"}	5	2026-06-04 12:48:32.688+00
7d9d1eda-b152-4080-9d8e-86d69f9d8bae	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "4-9-0"}	5	2026-06-04 12:48:34.509+00
95d723e7-79fc-4b0e-a8bb-3a83e9daf9ba	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "4-9-0"}	5	2026-06-04 12:48:35.28+00
64373319-051c-4214-8dd4-c605055ae1b1	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "4-9-0"}	5	2026-06-04 12:48:35.863+00
16660e37-4903-4095-8619-6c7d4a895a8c	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "4-7-0"}	5	2026-06-04 12:49:19.389+00
939dbfb5-d766-45f0-a5c8-4f8d2bff560c	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-04 23:10:56.123+00
c9c6a880-7d43-4b67-a928-5e106c80ee4b	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-05 01:07:59.993+00
69f90035-fb9e-43dd-8ae5-6fd38f261d45	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-05 23:06:32.071+00
d5811c60-1126-4f20-a3a8-d94b005a1e0a	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-06 03:15:05.077+00
5a761498-d218-45a6-9370-47c84c96dd46	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-06 04:35:47.502+00
52b48c9e-1887-4de8-8484-739f856aaae2	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "4-8-0"}	5	2026-06-06 04:55:02.851+00
2a20ab18-b726-4a6b-9ab4-5400f91e3acf	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "Visualize the joy the watch will bring you daily.", "component": 2, "intention": "i am the owner of a rolex submariner"}	5	2026-06-06 07:09:10.541+00
3ca92485-632d-4620-9571-62ef606ef2b2	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "Engage in daily reflection to combat negative thoughts.", "component": 3, "intention": "i am the owner of a rolex submariner"}	5	2026-06-06 07:09:28.518+00
9079b141-c700-4a19-9138-376c5ae33771	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "Identify potential income streams or side hustles.", "component": 4, "intention": "i am the owner of a rolex submariner"}	5	2026-06-06 07:09:36.092+00
3fbfbb40-8bd8-4538-a841-68cc9b6f5613	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "Join a community of watch enthusiasts for support.", "component": 5, "intention": "i am the owner of a rolex submariner"}	5	2026-06-06 07:09:42.242+00
24b09eea-409c-4f4a-94de-4ee75a462dad	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "Surround yourself with imagery of the Rolex Submariner.", "component": 6, "intention": "i am the owner of a rolex submariner"}	5	2026-06-06 07:10:02.434+00
dcf21722-516e-404a-8bd0-b78127e5bef3	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "Join a local watch club for shared goals.", "component": 7, "intention": "i am the owner of a rolex submariner"}	5	2026-06-06 07:10:16.998+00
99dd554a-96ea-46ff-a0e4-598a031b5657	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "Identify potential challenges and plan solutions.", "component": 8, "intention": "i am the owner of a rolex submariner"}	5	2026-06-06 07:10:33.335+00
f7cf9ac0-6a99-4213-9d1e-6a065c3a4361	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "Adopt a mindset of abundance and luxury.", "component": 9, "intention": "i am the owner of a rolex submariner"}	5	2026-06-06 07:10:41.488+00
de26bfdf-1586-4b44-a6fd-f418869118e7	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "Set a savings goal for the watch based on your budget.", "component": 1, "intention": "i am the owner of a rolex submariner"}	5	2026-06-06 07:28:15.469+00
d0c5a16d-ca18-4be8-9105-6d997a23722b	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-06 23:09:33.33+00
466ec155-3113-4558-8f90-d0a18fbaa518	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-06 23:33:50.863+00
c60f3687-99b0-458c-bbf5-f6d78a0c00e2	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "J1 — Write: What are the top 3 fears I have about launching "}	5	2026-06-07 00:32:32.096+00
252a7aea-550f-4c81-90b2-868b4699bf2b	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-07 06:43:38.602+00
83589fae-dcf6-48d4-bc84-6cbcf746a0ed	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "Research and identify the exact model of Submariner you want"}	5	2026-06-07 06:46:52.81+00
f99d8be3-bd89-46d2-a87c-2d77548cb1d9	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-08 01:14:16.151+00
11165f15-c3bb-421c-b199-8e003f3bebd9	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-09 01:54:14.685+00
6002f4cf-a85f-41b5-a3da-7f9a7c67a481	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-09 14:02:54.62+00
2b3708c5-f479-4e17-ab19-e52d2b44568f	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-10 01:34:15.645+00
6a9a0ffb-d726-49b4-b58b-90271327534f	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-10 02:26:06.623+00
3bff72ba-3b7a-4fc8-9bd8-28a6625acdad	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "By Friday I will have outlined a detailed savings plan speci"}	5	2026-06-10 04:38:25.139+00
fc60d2da-31b7-457c-871d-6e9cb3608e84	0fa88179-af12-4659-ad95-c6ae5fbc23e1	map_todo	{"todo": "Master the art of storytelling as a comedic tool"}	5	2026-06-10 11:08:36.134+00
768b7c20-46a1-4cc4-86a0-c7af6191ef6c	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-10 23:02:41.645+00
5ad71d9a-2670-4364-a235-8331034615b9	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-11 14:21:26.639+00
cb1d80d9-f37d-4f3b-a383-a5e1b205a5d3	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-12 00:09:27.971+00
6080af7c-6e45-4934-85db-ed6515238c12	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-12 10:07:37.475+00
601a4ac6-d3a3-4cfb-af58-702e76c7d6d9	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-12 23:34:20.162+00
8de8c98b-4268-4f26-8e87-ffa83df7b992	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-13 16:00:05.222+00
fc129234-19b2-47ee-a8ea-962ac555faf2	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-13 22:49:58.078+00
186080da-a389-44a1-8d9c-6bf89ee1e16a	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-13 23:25:59.034+00
d545fd8f-a038-46d0-8ef8-ab66d35a0f14	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-14 23:07:27.291+00
ce3dc428-c2c7-4695-b050-a7688634eb9e	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-15 03:01:09.028+00
9ca3dc07-4a75-464a-9538-ba94c1b4952a	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-15 22:55:40.814+00
3e3179bf-edf0-4fbc-8536-43391801c5e9	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-16 15:01:58.954+00
f8b699c9-c92c-40c1-8873-552f25159b87	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-17 00:32:36.058+00
34216a27-3c58-42df-afc1-8aed9ad78644	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-17 06:05:45.735+00
43dbe885-f805-4d2d-ba7c-fd4bab24be4f	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-18 00:24:44.727+00
15f0d558-2a90-49d0-abe9-047c15d8835e	0fa88179-af12-4659-ad95-c6ae5fbc23e1	login	{}	2	2026-06-18 03:02:34.403+00
\.


--
-- Data for Name: bts_context; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bts_context (id, created_at, bts_context) FROM stdin;
\.


--
-- Data for Name: content_blocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.content_blocks (slug, body, updated_at) FROM stdin;
site-wide-1	<a class="css-9mylee" href="https://www.nytimes.com/2026/05/28/technology/sell-house-with-ai-no-realtor.html" data-uri="nyt://article/55288f21-fd2c-5746-8a16-dae225daeb77" aria-hidden="false" style="border: 0px; text-size-adjust: 100%; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-variant-alternates: inherit; font-variant-position: inherit; font-variant-emoji: inherit; font-stretch: inherit; font-size: 16px; line-height: inherit; font-family: &quot;Times New Roman&quot;; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; text-decoration: none; color: black; outline: transparent solid 1.92px; outline-offset: 0.125rem; background-color: rgb(255, 255, 255);"><div class="css-1lvvmm" style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; display: grid; column-gap: calc(1px + 2rem); grid-template-columns: repeat(14, 1fr);"><div span="5" class="css-f52tr7 e17qa79g0" style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; min-width: 0px; position: relative; grid-column: span 5;"><div class="tpl-lb css-0" data-tpl="lb" style="position: relative; isolation: isolate; border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="story-wrapper css-1cjc0ec" data-tpl="sli" style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; display: flex; flex-direction: column; justify-content: stretch; gap: 0px; --tpl-story-list-item-poster-overlay-color: transparent; --tpl-story-list-item-poster-text-shadow-color: transparent; --tpl-story-list-item-poster-gradient-color: transparent; --tpl-story-list-itemContentMediaGap: 0; --tpl-story-list-itemContentInnerGap: 0; --tpl-story-list-itemTopLabelMarginBottom: 0.25rem; --tpl-story-list-itemActionsGap: 0; --tpl-story-list-outerPaddingHorizontal: 0; --tpl-story-list-itemOuterPaddingTop: 0; --tpl-story-list-itemOuterPaddingBottom: 0; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-1ep04sb" style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; display: flex; gap: 0px; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-direction: column-reverse;"><div style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-grow: 1;"><div class="css-1jwi144" data-tpl="slic" style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; display: flex; gap: 0px; flex-direction: column; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-sarx3u" data-tpl="bo" style="border: 0px; text-size-adjust: 100%; font-style: normal; font-variant: normal; font-size-adjust: none; font-language-override: normal; font-kerning: auto; font-optical-sizing: auto; font-feature-settings: normal; font-variation-settings: normal; font-stretch: normal; font-size: 1rem; line-height: 1.39; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, serif; vertical-align: baseline; color: rgb(90, 90, 90); outline: transparent solid 1.92px; outline-offset: 0.125rem;"><p class="summary-class css-crclbt" style="margin: 0.5rem 0px 0px; border: 0px; text-size-adjust: 100%; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; font-size: 0.875rem; line-height: 1.1875rem; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, &quot;Songti SC&quot;, simsun, serif; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; letter-spacing: 0.1px; -webkit-font-smoothing: auto;"><span style="color: rgb(54, 54, 54); font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, serif; font-size: 20px; letter-spacing: normal; display: inline !important;">The opening itself will be a star-studded party, concert and celebration, the rare event that is expected to draw four former presidents — George W. Bush, Bill Clinton and Joseph R. Biden Jr., along with Barack Obama himself.&nbsp;</span></p></div></div></div></div></div></div></div></div></a>	2026-07-09 03:05:49.244+00
dashboard-welcome	<a class="css-9mylee" href="https://www.nytimes.com/2026/05/28/technology/sell-house-with-ai-no-realtor.html" data-uri="nyt://article/55288f21-fd2c-5746-8a16-dae225daeb77" aria-hidden="false" style="border: 0px; text-size-adjust: 100%; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-variant-alternates: inherit; font-variant-position: inherit; font-variant-emoji: inherit; font-stretch: inherit; line-height: inherit; font-family: &quot;Times New Roman&quot;; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; text-decoration: none; outline: transparent solid 1.92px; outline-offset: 0.125rem; background-color: rgb(255, 255, 255);"><div class="css-1lvvmm" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; display: grid; column-gap: calc(1px + 2rem); grid-template-columns: repeat(14, 1fr);"><div span="5" class="css-f52tr7 e17qa79g0" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; min-width: 0px; position: relative; grid-column: span 5;"><div class="tpl-lb css-0" data-tpl="lb" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; position: relative; isolation: isolate; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="story-wrapper css-1cjc0ec" data-tpl="sli" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; flex-direction: column; justify-content: stretch; gap: 0px; --tpl-story-list-item-poster-overlay-color: transparent; --tpl-story-list-item-poster-text-shadow-color: transparent; --tpl-story-list-item-poster-gradient-color: transparent; --tpl-story-list-itemContentMediaGap: 0; --tpl-story-list-itemContentInnerGap: 0; --tpl-story-list-itemTopLabelMarginBottom: 0.25rem; --tpl-story-list-itemActionsGap: 0; --tpl-story-list-outerPaddingHorizontal: 0; --tpl-story-list-itemOuterPaddingTop: 0; --tpl-story-list-itemOuterPaddingBottom: 0; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-1ep04sb" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; gap: 0px; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-direction: column-reverse;"><div style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-grow: 1;"><div class="css-1jwi144" data-tpl="slic" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; gap: 0px; flex-direction: column; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-sarx3u" data-tpl="bo" style="border: 0px; text-size-adjust: 100%; font-style: normal; font-variant: normal; font-size-adjust: none; font-language-override: normal; font-kerning: auto; font-optical-sizing: auto; font-feature-settings: normal; font-variation-settings: normal; font-stretch: normal; line-height: 1.39; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, serif; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><p class="summary-class css-crclbt" style="margin: 0.5rem 0px 0px; border: 0px; text-size-adjust: 100%; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: 1.1875rem; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, &quot;Songti SC&quot;, simsun, serif; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; -webkit-font-smoothing: auto;"><font color="#363636"><span style="font-size: 20px;">ewqrwerqwerqwerqwer</span></font></p></div></div></div></div></div></div></div></div></a>	2026-07-09 03:05:42.824+00
home-video-1	<strong><span style="color: rgb(54, 54, 54); font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, serif; font-size: 20px; font-weight: 400; background-color: rgb(255, 255, 255); display: inline !important;">The opening itself will be a star-studded party, concert and celebration, the rare event that is expected to draw four former presidents — George W. Bush, Bill Clinton and Joseph R. Biden Jr., along with Barack Obama himself.&nbsp;</span></strong>	2026-07-09 03:05:31.911+00
home-section-1	<a class="css-9mylee" href="https://www.nytimes.com/2026/05/28/technology/sell-house-with-ai-no-realtor.html" data-uri="nyt://article/55288f21-fd2c-5746-8a16-dae225daeb77" aria-hidden="false" style="border: 0px; text-size-adjust: 100%; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-variant-alternates: inherit; font-variant-position: inherit; font-variant-emoji: inherit; font-stretch: inherit; font-size: 16px; line-height: inherit; font-family: &quot;Times New Roman&quot;; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; text-decoration: none; color: black; outline: transparent solid 1.92px; outline-offset: 0.125rem; background-color: rgb(255, 255, 255);"><div class="css-1lvvmm" style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; display: grid; column-gap: calc(1px + 2rem); grid-template-columns: repeat(14, 1fr);"><div span="5" class="css-f52tr7 e17qa79g0" style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; min-width: 0px; position: relative; grid-column: span 5;"><div class="tpl-lb css-0" data-tpl="lb" style="position: relative; isolation: isolate; border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="story-wrapper css-1cjc0ec" data-tpl="sli" style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; display: flex; flex-direction: column; justify-content: stretch; gap: 0px; --tpl-story-list-item-poster-overlay-color: transparent; --tpl-story-list-item-poster-text-shadow-color: transparent; --tpl-story-list-item-poster-gradient-color: transparent; --tpl-story-list-itemContentMediaGap: 0; --tpl-story-list-itemContentInnerGap: 0; --tpl-story-list-itemTopLabelMarginBottom: 0.25rem; --tpl-story-list-itemActionsGap: 0; --tpl-story-list-outerPaddingHorizontal: 0; --tpl-story-list-itemOuterPaddingTop: 0; --tpl-story-list-itemOuterPaddingBottom: 0; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-1ep04sb" style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; display: flex; gap: 0px; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-direction: column-reverse;"><div style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-grow: 1;"><div class="css-1jwi144" data-tpl="slic" style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; display: flex; gap: 0px; flex-direction: column; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-sarx3u" data-tpl="bo" style="border: 0px; text-size-adjust: 100%; font-style: normal; font-variant: normal; font-size-adjust: none; font-language-override: normal; font-kerning: auto; font-optical-sizing: auto; font-feature-settings: normal; font-variation-settings: normal; font-stretch: normal; font-size: 1rem; line-height: 1.39; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, serif; vertical-align: baseline; color: rgb(90, 90, 90); outline: transparent solid 1.92px; outline-offset: 0.125rem;"><p class="summary-class css-crclbt" style="margin: 0.5rem 0px 0px; border: 0px; text-size-adjust: 100%; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; font-size: 0.875rem; line-height: 1.1875rem; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, &quot;Songti SC&quot;, simsun, serif; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; letter-spacing: 0.1px; -webkit-font-smoothing: auto;"><span style="color: rgb(54, 54, 54); font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, serif; font-size: 20px; letter-spacing: normal; display: inline !important;">The opening itself will be a star-studded party, concert and celebration, the rare event that is expected to draw four former presidents — George W. Bush, Bill Clinton and Joseph R. Biden Jr., along with Barack Obama himself.&nbsp;</span></p></div></div></div></div></div></div></div></div></a>	2026-07-09 03:05:35.008+00
home-section-2	<a class="css-9mylee" href="https://www.nytimes.com/2026/05/28/technology/sell-house-with-ai-no-realtor.html" data-uri="nyt://article/55288f21-fd2c-5746-8a16-dae225daeb77" aria-hidden="false" style="border: 0px; text-size-adjust: 100%; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-variant-alternates: inherit; font-variant-position: inherit; font-variant-emoji: inherit; font-stretch: inherit; line-height: inherit; font-family: &quot;Times New Roman&quot;; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; text-decoration: none; outline: transparent solid 1.92px; outline-offset: 0.125rem; background-color: rgb(255, 255, 255);"><div class="css-1lvvmm" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; display: grid; column-gap: calc(1px + 2rem); grid-template-columns: repeat(14, 1fr);"><div span="5" class="css-f52tr7 e17qa79g0" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; min-width: 0px; position: relative; grid-column: span 5;"><div class="tpl-lb css-0" data-tpl="lb" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; position: relative; isolation: isolate; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="story-wrapper css-1cjc0ec" data-tpl="sli" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; flex-direction: column; justify-content: stretch; gap: 0px; --tpl-story-list-item-poster-overlay-color: transparent; --tpl-story-list-item-poster-text-shadow-color: transparent; --tpl-story-list-item-poster-gradient-color: transparent; --tpl-story-list-itemContentMediaGap: 0; --tpl-story-list-itemContentInnerGap: 0; --tpl-story-list-itemTopLabelMarginBottom: 0.25rem; --tpl-story-list-itemActionsGap: 0; --tpl-story-list-outerPaddingHorizontal: 0; --tpl-story-list-itemOuterPaddingTop: 0; --tpl-story-list-itemOuterPaddingBottom: 0; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-1ep04sb" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; gap: 0px; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-direction: column-reverse;"><div style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-grow: 1;"><div class="css-1jwi144" data-tpl="slic" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; gap: 0px; flex-direction: column; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-sarx3u" data-tpl="bo" style="border: 0px; text-size-adjust: 100%; font-style: normal; font-variant: normal; font-size-adjust: none; font-language-override: normal; font-kerning: auto; font-optical-sizing: auto; font-feature-settings: normal; font-variation-settings: normal; font-stretch: normal; line-height: 1.39; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, serif; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><p class="summary-class css-crclbt" style="margin: 0.5rem 0px 0px; border: 0px; text-size-adjust: 100%; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: 1.1875rem; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, &quot;Songti SC&quot;, simsun, serif; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; -webkit-font-smoothing: auto;"><font color="#363636"><span style="font-size: 20px;">asdfasdf</span></font></p></div></div></div></div></div></div></div></div></a>	2026-07-09 03:05:39.043+00
lib_stoic	You have power over your mind — not outside events. Realize this, and you will find strength.\nWe suffer more often in imagination than in reality.\nIt is not what happens to you, but how you react to it, that matters.\nThe happiness of your life depends upon the quality of your thoughts.\nThe obstacle is the way — what stands in the way becomes the way.\nWaste no more time arguing what a good person should be. Be one.\nHe who fears death will never do anything worthy of a living person.\nYou are disturbed not by things, but by the view you take of them.\nFirst say to yourself what you would be; then do what you must do.\nIf it is not right, do not do it; if it is not true, do not say it.	2026-07-14 09:29:34.41+00
home-welcome	<div class="css-1lvvmm" style="border: 0px; text-size-adjust: 100%; font-variant: inherit; font-stretch: inherit; font-size: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; text-decoration: none; color: black; outline: transparent solid 1.92px; outline-offset: 0.125rem; background-color: rgb(255, 255, 255); display: grid; column-gap: calc(1px + 2rem); grid-template-columns: repeat(14, 1fr);"><div span="5" class="css-f52tr7 e17qa79g0" style="font-variant: inherit; font-stretch: inherit; font-size: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; min-width: 0px; position: relative; grid-column: span 5;"><div class="tpl-lb css-0" data-tpl="lb" style="font-variant: inherit; font-stretch: inherit; font-size: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; position: relative; isolation: isolate; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="story-wrapper css-1cjc0ec" data-tpl="sli" style="font-variant: inherit; font-stretch: inherit; font-size: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; flex-direction: column; justify-content: stretch; gap: 0px; --tpl-story-list-item-poster-overlay-color: transparent; --tpl-story-list-item-poster-text-shadow-color: transparent; --tpl-story-list-item-poster-gradient-color: transparent; --tpl-story-list-itemContentMediaGap: 0; --tpl-story-list-itemContentInnerGap: 0; --tpl-story-list-itemTopLabelMarginBottom: 0.25rem; --tpl-story-list-itemActionsGap: 0; --tpl-story-list-outerPaddingHorizontal: 0; --tpl-story-list-itemOuterPaddingTop: 0; --tpl-story-list-itemOuterPaddingBottom: 0; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-1ep04sb" style="font-variant: inherit; font-stretch: inherit; font-size: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; gap: 0px; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-direction: column-reverse;"><div style="font-variant: inherit; font-stretch: inherit; font-size: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-grow: 1;"><div class="css-1jwi144" data-tpl="slic" style="font-variant: inherit; font-stretch: inherit; font-size: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; gap: 0px; flex-direction: column; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-sarx3u" data-tpl="bo" style="border: 0px; text-size-adjust: 100%; font-variant: normal; font-size-adjust: none; font-language-override: normal; font-kerning: auto; font-optical-sizing: auto; font-feature-settings: normal; font-variation-settings: normal; font-stretch: normal; font-size: 1rem; line-height: 1.39; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, serif; vertical-align: baseline; color: rgb(90, 90, 90); outline: transparent solid 1.92px; outline-offset: 0.125rem;"><p class="summary-class css-crclbt" style="margin: 0.5rem 0px 0px; border: 0px; text-size-adjust: 100%; font-variant: inherit; font-stretch: inherit; font-size: 0.875rem; line-height: 1.1875rem; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, &quot;Songti SC&quot;, simsun, serif; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; letter-spacing: 0.1px; -webkit-font-smoothing: auto;"><span style="color: rgb(54, 54, 54); font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, serif; font-size: 20px; letter-spacing: normal; font-variant-ligatures: inherit; font-variant-caps: inherit; display: inline !important;"><i><span style="color: rgb(227, 227, 227); font-family: &quot;Google Sans Flex&quot;, &quot;Google Sans&quot;, &quot;Helvetica Neue&quot;, sans-serif; font-size: 17px; font-style: normal; white-space: pre-wrap; background-color: rgb(15, 15, 15); display: inline !important;">"When you wake up in the morning, tell yourself: The people I deal with today will be meddling, ungrateful, arrogant, dishonest, jealous, and surly... I have seen the beauty of good, and the ugliness of evil, and </span><span data-path-to-node="7,0" data-index-in-node="213" style="font-weight: 700; --gds-type-scale-default-wght: &quot;wght&quot; 540; font-variation-settings: &quot;ROND&quot; 0, &quot;slnt&quot; 0, &quot;wdth&quot; 92, &quot;wght&quot; 540; font-synthesis-weight: none; color: rgb(227, 227, 227); font-family: &quot;Google Sans Flex&quot;, &quot;Google Sans&quot;, &quot;Helvetica Neue&quot;, sans-serif; font-size: 17px; font-style: normal; white-space: pre-wrap; background-color: rgb(15, 15, 15);">I have recognized that the wrongdoer has a nature related to my own</span><span style="color: rgb(227, 227, 227); font-family: &quot;Google Sans Flex&quot;, &quot;Google Sans&quot;, &quot;Helvetica Neue&quot;, sans-serif; font-size: 17px; font-style: normal; white-space: pre-wrap; background-color: rgb(15, 15, 15); display: inline !important;">... None of them can hurt me."</span></i></span></p></div></div></div></div></div></div></div></div>	2026-07-09 03:04:22.091+00
home-section-3	<a class="css-9mylee" href="https://www.nytimes.com/2026/05/28/technology/sell-house-with-ai-no-realtor.html" data-uri="nyt://article/55288f21-fd2c-5746-8a16-dae225daeb77" aria-hidden="false" style="border: 0px; text-size-adjust: 100%; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-variant-alternates: inherit; font-variant-position: inherit; font-variant-emoji: inherit; font-stretch: inherit; line-height: inherit; font-family: &quot;Times New Roman&quot;; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; text-decoration: none; outline: transparent solid 1.92px; outline-offset: 0.125rem; background-color: rgb(255, 255, 255);"><div class="css-1lvvmm" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; display: grid; column-gap: calc(1px + 2rem); grid-template-columns: repeat(14, 1fr);"><div span="5" class="css-f52tr7 e17qa79g0" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; min-width: 0px; position: relative; grid-column: span 5;"><div class="tpl-lb css-0" data-tpl="lb" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; position: relative; isolation: isolate; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="story-wrapper css-1cjc0ec" data-tpl="sli" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; flex-direction: column; justify-content: stretch; gap: 0px; --tpl-story-list-item-poster-overlay-color: transparent; --tpl-story-list-item-poster-text-shadow-color: transparent; --tpl-story-list-item-poster-gradient-color: transparent; --tpl-story-list-itemContentMediaGap: 0; --tpl-story-list-itemContentInnerGap: 0; --tpl-story-list-itemTopLabelMarginBottom: 0.25rem; --tpl-story-list-itemActionsGap: 0; --tpl-story-list-outerPaddingHorizontal: 0; --tpl-story-list-itemOuterPaddingTop: 0; --tpl-story-list-itemOuterPaddingBottom: 0; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-1ep04sb" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; gap: 0px; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-direction: column-reverse;"><div style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-grow: 1;"><div class="css-1jwi144" data-tpl="slic" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; gap: 0px; flex-direction: column; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-sarx3u" data-tpl="bo" style="border: 0px; text-size-adjust: 100%; font-style: normal; font-variant: normal; font-size-adjust: none; font-language-override: normal; font-kerning: auto; font-optical-sizing: auto; font-feature-settings: normal; font-variation-settings: normal; font-stretch: normal; line-height: 1.39; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, serif; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><p class="summary-class css-crclbt" style="margin: 0.5rem 0px 0px; border: 0px; text-size-adjust: 100%; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: 1.1875rem; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, &quot;Songti SC&quot;, simsun, serif; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; -webkit-font-smoothing: auto;"><font color="#363636"><span style="font-size: 20px;">adsfffasdfasd</span></font></p></div></div></div></div></div></div></div></div></a>	2026-07-09 03:05:41.046+00
dashboard-note-1	<a class="css-9mylee" href="https://www.nytimes.com/2026/05/28/technology/sell-house-with-ai-no-realtor.html" data-uri="nyt://article/55288f21-fd2c-5746-8a16-dae225daeb77" aria-hidden="false" style="border: 0px; text-size-adjust: 100%; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-variant-alternates: inherit; font-variant-position: inherit; font-variant-emoji: inherit; font-stretch: inherit; line-height: inherit; font-family: &quot;Times New Roman&quot;; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; text-decoration: none; outline: transparent solid 1.92px; outline-offset: 0.125rem; background-color: rgb(255, 255, 255);"><div class="css-1lvvmm" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; display: grid; column-gap: calc(1px + 2rem); grid-template-columns: repeat(14, 1fr);"><div span="5" class="css-f52tr7 e17qa79g0" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; min-width: 0px; position: relative; grid-column: span 5;"><div class="tpl-lb css-0" data-tpl="lb" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; position: relative; isolation: isolate; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="story-wrapper css-1cjc0ec" data-tpl="sli" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; flex-direction: column; justify-content: stretch; gap: 0px; --tpl-story-list-item-poster-overlay-color: transparent; --tpl-story-list-item-poster-text-shadow-color: transparent; --tpl-story-list-item-poster-gradient-color: transparent; --tpl-story-list-itemContentMediaGap: 0; --tpl-story-list-itemContentInnerGap: 0; --tpl-story-list-itemTopLabelMarginBottom: 0.25rem; --tpl-story-list-itemActionsGap: 0; --tpl-story-list-outerPaddingHorizontal: 0; --tpl-story-list-itemOuterPaddingTop: 0; --tpl-story-list-itemOuterPaddingBottom: 0; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-1ep04sb" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; gap: 0px; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-direction: column-reverse;"><div style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-grow: 1;"><div class="css-1jwi144" data-tpl="slic" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; gap: 0px; flex-direction: column; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-sarx3u" data-tpl="bo" style="border: 0px; text-size-adjust: 100%; font-style: normal; font-variant: normal; font-size-adjust: none; font-language-override: normal; font-kerning: auto; font-optical-sizing: auto; font-feature-settings: normal; font-variation-settings: normal; font-stretch: normal; line-height: 1.39; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, serif; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><p class="summary-class css-crclbt" style="margin: 0.5rem 0px 0px; border: 0px; text-size-adjust: 100%; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: 1.1875rem; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, &quot;Songti SC&quot;, simsun, serif; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; -webkit-font-smoothing: auto;"><font color="#363636"><span style="font-size: 20px;">41212341234123412341234123</span></font></p></div></div></div></div></div></div></div></div></a>	2026-07-09 03:05:44.872+00
site-wide-2	<a class="css-9mylee" href="https://www.nytimes.com/2026/05/28/technology/sell-house-with-ai-no-realtor.html" data-uri="nyt://article/55288f21-fd2c-5746-8a16-dae225daeb77" aria-hidden="false" style="border: 0px; text-size-adjust: 100%; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-variant-alternates: inherit; font-variant-position: inherit; font-variant-emoji: inherit; font-stretch: inherit; font-size: 16px; line-height: inherit; font-family: &quot;Times New Roman&quot;; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; text-decoration: none; color: black; outline: transparent solid 1.92px; outline-offset: 0.125rem; background-color: rgb(255, 255, 255);"><div class="css-1lvvmm" style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; display: grid; column-gap: calc(1px + 2rem); grid-template-columns: repeat(14, 1fr);"><div span="5" class="css-f52tr7 e17qa79g0" style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; min-width: 0px; position: relative; grid-column: span 5;"><div class="tpl-lb css-0" data-tpl="lb" style="position: relative; isolation: isolate; border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="story-wrapper css-1cjc0ec" data-tpl="sli" style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; display: flex; flex-direction: column; justify-content: stretch; gap: 0px; --tpl-story-list-item-poster-overlay-color: transparent; --tpl-story-list-item-poster-text-shadow-color: transparent; --tpl-story-list-item-poster-gradient-color: transparent; --tpl-story-list-itemContentMediaGap: 0; --tpl-story-list-itemContentInnerGap: 0; --tpl-story-list-itemTopLabelMarginBottom: 0.25rem; --tpl-story-list-itemActionsGap: 0; --tpl-story-list-outerPaddingHorizontal: 0; --tpl-story-list-itemOuterPaddingTop: 0; --tpl-story-list-itemOuterPaddingBottom: 0; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-1ep04sb" style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; display: flex; gap: 0px; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-direction: column-reverse;"><div style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-grow: 1;"><div class="css-1jwi144" data-tpl="slic" style="border: 0px; text-size-adjust: 100%; font: inherit; vertical-align: baseline; display: flex; gap: 0px; flex-direction: column; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-sarx3u" data-tpl="bo" style="border: 0px; text-size-adjust: 100%; font-style: normal; font-variant: normal; font-size-adjust: none; font-language-override: normal; font-kerning: auto; font-optical-sizing: auto; font-feature-settings: normal; font-variation-settings: normal; font-stretch: normal; font-size: 1rem; line-height: 1.39; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, serif; vertical-align: baseline; color: rgb(90, 90, 90); outline: transparent solid 1.92px; outline-offset: 0.125rem;"><p class="summary-class css-crclbt" style="margin: 0.5rem 0px 0px; border: 0px; text-size-adjust: 100%; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; font-size: 0.875rem; line-height: 1.1875rem; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, &quot;Songti SC&quot;, simsun, serif; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; letter-spacing: 0.1px; -webkit-font-smoothing: auto;"><span style="color: rgb(54, 54, 54); font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, serif; font-size: 20px; letter-spacing: normal; display: inline !important;">The opening itself will be a star-studded party, concert and celebration, the rare event that is expected to draw four former presidents — George W. Bush, Bill Clinton and Joseph R. Biden Jr., along with Barack Obama himself.&nbsp;</span></p></div></div></div></div></div></div></div></div></a>	2026-07-09 03:05:52.229+00
dashboard-note-2	<a class="css-9mylee" href="https://www.nytimes.com/2026/05/28/technology/sell-house-with-ai-no-realtor.html" data-uri="nyt://article/55288f21-fd2c-5746-8a16-dae225daeb77" aria-hidden="false" style="border: 0px; text-size-adjust: 100%; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-variant-alternates: inherit; font-variant-position: inherit; font-variant-emoji: inherit; font-stretch: inherit; line-height: inherit; font-family: &quot;Times New Roman&quot;; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; text-decoration: none; outline: transparent solid 1.92px; outline-offset: 0.125rem; background-color: rgb(255, 255, 255);"><div class="css-1lvvmm" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; display: grid; column-gap: calc(1px + 2rem); grid-template-columns: repeat(14, 1fr);"><div span="5" class="css-f52tr7 e17qa79g0" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; min-width: 0px; position: relative; grid-column: span 5;"><div class="tpl-lb css-0" data-tpl="lb" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; position: relative; isolation: isolate; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="story-wrapper css-1cjc0ec" data-tpl="sli" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; flex-direction: column; justify-content: stretch; gap: 0px; --tpl-story-list-item-poster-overlay-color: transparent; --tpl-story-list-item-poster-text-shadow-color: transparent; --tpl-story-list-item-poster-gradient-color: transparent; --tpl-story-list-itemContentMediaGap: 0; --tpl-story-list-itemContentInnerGap: 0; --tpl-story-list-itemTopLabelMarginBottom: 0.25rem; --tpl-story-list-itemActionsGap: 0; --tpl-story-list-outerPaddingHorizontal: 0; --tpl-story-list-itemOuterPaddingTop: 0; --tpl-story-list-itemOuterPaddingBottom: 0; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-1ep04sb" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; gap: 0px; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-direction: column-reverse;"><div style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; flex-grow: 1;"><div class="css-1jwi144" data-tpl="slic" style="font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; border: 0px; text-size-adjust: 100%; vertical-align: baseline; display: flex; gap: 0px; flex-direction: column; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><div class="css-sarx3u" data-tpl="bo" style="border: 0px; text-size-adjust: 100%; font-style: normal; font-variant: normal; font-size-adjust: none; font-language-override: normal; font-kerning: auto; font-optical-sizing: auto; font-feature-settings: normal; font-variation-settings: normal; font-stretch: normal; line-height: 1.39; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, serif; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem;"><p class="summary-class css-crclbt" style="margin: 0.5rem 0px 0px; border: 0px; text-size-adjust: 100%; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: 1.1875rem; font-family: nyt-imperial, georgia, &quot;times new roman&quot;, times, &quot;Songti SC&quot;, simsun, serif; font-optical-sizing: inherit; font-size-adjust: inherit; font-kerning: inherit; font-feature-settings: inherit; font-variation-settings: inherit; font-language-override: inherit; vertical-align: baseline; outline: transparent solid 1.92px; outline-offset: 0.125rem; -webkit-font-smoothing: auto;"><font color="#363636"><span style="font-size: 20px;">Great to see you back here today.&nbsp; Awesome effort.</span></font></p></div></div></div></div></div></div></div></div></a>	2026-07-09 03:44:45.661+00
\.


--
-- Data for Name: daily_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daily_log (id, user_id, roadmap_item_id, log_date, week_number, action_completed, streak_day, notes, created_at) FROM stdin;
\.


--
-- Data for Name: intentions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.intentions (id, user_id, title, datestart, target_date, reviews, "position", mindset_data, achievers_data, created_at, updated_at, data, words, mindset, achievers, start_date, bbfw, the_map, image_url, roadmap_ai, active_danger_zone) FROM stdin;
c2a9754c-29a7-4737-a720-47d25cd0db8c	868440e8-823b-4ca9-8e3b-385af4fb8879	I AM EARNING AT LEAST $10,000 PER MONTH WITH COSMIC INTENTIONS SUBSCRIPTIONS.	\N	\N	0	0	\N	\N	2026-05-02 00:28:04.442713+00	2026-05-28 08:00:46.165+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	{"beliefs": ["Success is inevitable", "I deserve this", "Action creates results", "I am ready", "My time is now"], "roadmap": ["Define your core vision with complete clarity", "Build a daily non-negotiable routine", "Execute one keystone habit every morning", "Track your wins weekly — never miss twice", "Find a mentor or accountability partner", "Remove one major distraction this week", "Celebrate every milestone, no matter how small"], "attitudes": [{"body": "I show up every day no matter what.", "title": "Relentless"}, {"body": "I appreciate how far I've come.", "title": "Grateful"}, {"body": "I take action before I'm ready.", "title": "Bold"}, {"body": "I eliminate what doesn't serve me.", "title": "Focused"}], "meditation": "You are exactly where you need to be. Breathe deeply and trust the process.", "affirmations": ["I am unstoppable", "I am focused", "I am wealthy", "I am healthy", "I am free", "I am clear"]}	\N	\N	\N	\N	\N	\N	\N
096d8392-80f7-4f0a-8527-6b2e85e7079a	0fa88179-af12-4659-ad95-c6ae5fbc23e1	I AM THE PROUD OWNER OF A XIAOMI SU 7	\N	2027-07-02	0	0	\N	\N	2026-06-14 05:42:23.377982+00	2026-07-17 03:15:24.711+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	{"stoic": ["I focus on what I can control and let go of what I cannot.", "I embrace challenges as opportunities for growth and learning.", "I practice gratitude for what I have, knowing it is enough.", "I remain calm and composed in the face of setbacks.", "I understand that true wealth comes from within and is reflected in my experiences."], "quotes": ["Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful. — Albert Schweitzer", "The only limit to our realization of tomorrow will be our doubts of today. — Franklin D. Roosevelt", "Success usually comes to those who are too busy to be looking for it. — Henry David Thoreau", "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt", "Do not wait to strike till the iron is hot, but make it hot by striking. — William Butler Yeats"], "beliefs": ["I believe that I can achieve my dreams through commitment and hard work.", "I believe that luxury is a reward for my efforts and resilience.", "I believe that my achievements are deserving of celebration.", "I believe that my taste for quality reflects my character.", "I believe that success is not just about material possessions, but the journey to acquire them."], "attitudes": [{"body": "I recognize that success is not a destination but a continuous journey.", "title": "Embrace Success"}, {"body": "I take time to celebrate my successes, big and small, knowing they lead to greater rewards.", "title": "Celebrate Achievements"}, {"body": "I appreciate the finer things in life as a testament to my hard work and perseverance.", "title": "Gratitude for Luxury"}, {"body": "I cultivate a mindset that attracts wealth and abundance into my life.", "title": "Wealth Mindset"}], "meditation": "Inhale deeply and visualize the joy of owning my Rolex Submariner, feeling gratitude for my journey.", "affirmations": ["I am worthy of luxury and success.", "My hard work attracts wealth and abundance.", "Every moment, I embody the prestige of my Rolex Submariner.", "I am grateful for the success that allows me to own this masterpiece.", "I enjoy the finer things in life and attract them effortlessly.", "Owning my Rolex Submariner is a reflection of my dedication and perseverance."]}	\N	2026-07-02	{"_format": 4, "daily_ops": ["Develop and finalize the core concept and features of the star fighter, ensuring that it aligns with the vivid vision of ownership and operational capability.", "Engage in prototype velocity activities by sketching initial designs or models that bring the star fighter concept closer to tangible reality.", "Initiate discussions with potential collaborators or stakeholders to gather insights and build a compelling narrative around the star fighter idea shipping."], "identity_phrase": "YOU ARE EXECUTING CONCEPT", "friction_warning": "The single most predictable failure point for you is allowing procrastination to delay your progress, trapping your concept in an endless loop of ideation without execution.", "weekly_milestone": "Secure a commitment from a key partner or investor who shares the vision of the star fighter, demonstrating concept closure and proof of momentum.", "strategy_narrative": "YOU ARE EXECUTING CONCEPT, and as you step into the reality of being the owner of a star fighter, imagine the exhilarating rush of piloting your own vessel, the engine's roar beneath you, the stars stretching out like a canvas of potential, where every flight is a testament to your vision brought to life, a powerful symbol of your journey from idea to tangible impact in the world; the satisfaction of closing the loop on your dream is an emotional fuel that drives you forward, ensuring that every concept birthed in your mind transforms into a reality that deserves to exist, delivering the thrill of launch discipline as you navigate through each phase with defined gates and deadlines, holding yourself accountable to the prototype velocity that will propel you toward success. But let's be honest with each other: the Procrastination Pit can pull you back, keeping your dreams grounded, and neglecting budgeting may threaten your trajectory, while isolation from community risks leaving you without vital support, and distraction by alternatives can divert your focus from the star fighter you are destined to own; each of these challenges is a moment where your identity as a builder who ships must become your shield, allowing you to push through and scale upward, embracing the discomfort as part of your growth. Now, I challenge you to open THE INNER CITADEL and run a visualization session right now, because every moment spent refining your vision is a step closer to that exhilarating reality of ownership and impact you seek."}	{"locks": {}, "checks": {}, "mindset": {"prayer": "I set the intention to align my actions and thoughts with the reality of owning a star fighter. May my path be illuminated with opportunities and support as I pursue this dream. I trust in my ability to manifest this reality and embrace the journey ahead with courage and gratitude.", "toInstall": ["I am capable and deserving of owning a star fighter.", "I attract the resources and opportunities I need.", "My skills and connections are continually growing.", "I am living my dream of owning a star fighter."], "recitations": ["I am the proud owner of a star fighter.", "My dreams are within my reach.", "I am worthy of my desires.", "I am a master of my destiny.", "Every day, I take steps towards my goal.", "I am surrounded by opportunities.", "I attract success effortlessly.", "I am ready for the adventures that await me."], "currentAttitudes": ["I am not skilled enough to own a star fighter.", "Owning a star fighter is only for the wealthy.", "I don't have the connections to make this happen.", "It's unrealistic for someone like me to achieve this goal."]}, "terrain": [{"j": null, "text": "Understand the financial aspects of owning a star fighter.", "isJournal": false}, {"j": null, "text": "Gain knowledge about the technology and mechanics of star fighters.", "isJournal": false}, {"j": null, "text": "Build a network within the aviation and space industries.", "isJournal": false}, {"j": null, "text": "Develop negotiation skills for purchasing high-value items.", "isJournal": false}, {"j": null, "text": "Learn about the maintenance and upkeep required for a star fighter.", "isJournal": false}, {"j": 10, "text": "J10 — Write: My personal mission statement regarding my journey to owning a star fighter.", "isJournal": true}], "practice": {"gratitudeItems": ["I am grateful for my passion for aviation.", "I appreciate the resources that help me learn and grow.", "I am thankful for the supportive people in my life.", "I value the opportunities that come my way every day.", "I am grateful for my determination to pursue my dreams."], "weeklyQuestion": "What fears are holding me back from taking significant steps towards owning my star fighter?", "meditationFocus": "I sit quietly, feeling the cockpit of my star fighter around me. I close my eyes and breathe deeply, imagining the sound of the engines and the vastness of space outside. I visualize my hands on the controls, feeling powerful and free. I embrace the excitement and gratitude of owning my star fighter, knowing it is my reality.", "vizAffirmations": ["I visualize myself piloting my star fighter through the stars.", "I see myself confidently discussing my star fighter with experts.", "I envision the thrill of owning and mastering my star fighter.", "I imagine the pride I feel as a star fighter owner.", "I picture the community I build around my passion for star fighters.", "I visualize successful negotiations leading to my ownership.", "I see the joy of sharing my star fighter with friends and family.", "I imagine the adventures I will embark on with my star fighter."]}, "thisWeek": [{"j": null, "text": "By Friday I will have researched three different models of star fighters, including specifications and pricing.", "isJournal": false}, {"j": null, "text": "By Friday I will have written a detailed budget plan for purchasing a star fighter, including potential financing options.", "isJournal": false}, {"j": null, "text": "By Friday I will have joined three online forums or communities focused on star fighter ownership and maintenance.", "isJournal": false}, {"j": 1, "text": "J1 — Write: Reflect on what owning a star fighter means to me and how it aligns with my personal values.", "isJournal": true}], "thisMonth": [{"j": null, "text": "Research the different types of star fighters available in the market.", "isJournal": false}, {"j": 6, "text": "J6 — Write: 10 reasons why owning a star fighter is a worthy goal.", "isJournal": true}, {"j": null, "text": "Connect with at least three industry experts or enthusiasts.", "isJournal": false}, {"j": null, "text": "Attend a workshop or seminar related to aviation or space technology.", "isJournal": false}, {"j": null, "text": "Create a vision board dedicated to my star fighter goal.", "isJournal": false}, {"j": null, "text": "Develop a financial plan outlining steps to afford a star fighter.", "isJournal": false}], "dangerZones": [{"j": 2, "title": "Procrastination Pit", "pitfall": "I often delay researching or planning due to overwhelm. This leads to missed opportunities and stagnation in my goal.", "warning": "Feeling anxious about the amount of information I need to gather.", "ifTrigger": "IF I feel overwhelmed and avoid my research tasks.", "thenAction": "THEN I will set a timer for 25 minutes and focus solely on one research task.", "journalText": "J2 — Write: Describe a recent experience where I procrastinated and its impact on my goals."}, {"j": 3, "title": "Neglecting Budgeting", "pitfall": "Ignoring my budget leads to unrealistic expectations and financial strain. This can derail my entire goal of owning a star fighter.", "warning": "Not wanting to look at my current financial status.", "ifTrigger": "IF I find myself avoiding my budget planning session.", "thenAction": "THEN I will schedule a specific time to review my finances with no distractions.", "journalText": "J3 — Write: Explore my feelings about budgeting and how it relates to my goal."}, {"j": 4, "title": "Isolation from Community", "pitfall": "Avoiding engagement with communities can result in missed advice and support. This can leave me feeling lost and unsupported.", "warning": "Feeling reluctant to join discussions or forums.", "ifTrigger": "IF I hesitate to post or engage in an online community.", "thenAction": "THEN I will commit to posting one question or sharing one insight in a forum today.", "journalText": "J4 — Write: Reflect on my experiences engaging with communities related to my goals."}, {"j": 5, "title": "Distraction by Alternatives", "pitfall": "Getting distracted by other interests can pull me away from my star fighter goal. This dilutes my focus and commitment.", "warning": "Feeling tempted to pursue unrelated hobbies or interests.", "ifTrigger": "IF I find myself spending more time on non-related activities.", "thenAction": "THEN I will remind myself of my goal and write down why I want to own a star fighter.", "journalText": "J5 — Write: Identify distractions that pull me away from my goal."}]}	https://images.pexels.com/photos/34661684/pexels-photo-34661684.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940	{"_myV2": true, "_rmV2": true, "codes": {"0": 1, "1": 2, "2": 3, "3": 4, "4": 5, "5": 6, "6": 7, "7": 8, "8": 9, "9": 10}, "tasks": ["Research and document the specifications and features of the Xiaomi SU 7 to understand its unique selling points and technological advantages.", "Identify the key competitors of the Xiaomi SU 7 in the Bangkok market and analyze their pricing, features, and market positioning.", "Confirm the dates and location of the Spring Auto Show in Bangkok and determine if the Xiaomi SU 7 will be showcased there.", "Investigate the official Xiaomi channels in Bangkok to ascertain the exact release date and sale locations for the Xiaomi SU 7.", "Subscribe to Xiaomi's official newsletters and follow their local Bangkok social media accounts for real-time updates on product launches and promotions.", "Set up Google Alerts with keywords like 'Xiaomi SU 7 Bangkok sale' to receive instant notifications about any news or announcements.", "Contact local Xiaomi dealerships in Bangkok to inquire about pre-order options and early-bird promotions for the Xiaomi SU 7.", "Plan a visit to the Spring Auto Show to experience the Xiaomi SU 7 firsthand and gather promotional material and direct insights.", "Evaluate financing options available in Bangkok for purchasing the Xiaomi SU 7, including bank loans and dealership financing plans.", "Create a detailed purchase timeline, incorporating all gathered information, to ensure timely decision-making and avoid last-minute rushes."], "_rmSeq": 10, "_codeSeq": 4, "intention": "I AM THE PROUD OWNER OF A XIAOMI SU 7", "resources": [{"url": "https://www.youtube.com/watch?v=xD3VLMxI5og", "type": "video", "title": "All New 2026 Xiaomi SU7 Launch – Lei Jun’s Full Keynote Address", "pinned": true, "subtitle": "Xiaomi Global", "thumbnail": "https://i.ytimg.com/vi/xD3VLMxI5og/mqdefault.jpg"}, {"url": "https://www.mi.com", "type": "source", "title": "Xiaomi", "pinned": true, "subtitle": "Official source"}, {"url": "https://www.bangkok-motorshow.com", "type": "source", "title": "Bangkok International Motor Show", "pinned": true, "subtitle": "Official source"}, {"url": "https://www.youtube.com/watch?v=DEvSwcQ77I0", "type": "video", "title": "The SHOCKING Story of Xiaomi's Billionaire Founder: Lei Jun", "subtitle": "Lei Jun", "thumbnail": "https://i.ytimg.com/vi/DEvSwcQ77I0/mqdefault.jpg"}, {"url": "https://www.youtube.com/watch?v=hSkTkP20ot8", "type": "video", "title": "Hugo Barra of Xiaomi talks strategy and new Mi products", "subtitle": "Hugo Barra", "thumbnail": "https://i.ytimg.com/vi/hSkTkP20ot8/mqdefault.jpg"}, {"url": "https://www.youtube.com/watch?v=awhZnFCPk_8", "type": "video", "title": "Xiaomi President & co-founder Bin Lin shows foldable phone", "subtitle": "Lin Bin", "thumbnail": "https://i.ytimg.com/vi/awhZnFCPk_8/mqdefault.jpg"}, {"url": "https://bangkok-motorshow.com", "type": "source", "title": "Bangkok International Motor Show", "subtitle": "Official source"}, {"url": "https://www.google.com/search?q=Xiaomi%20market%20strategy%20and%20growth%20analysis", "type": "article", "title": "Xiaomi's Market Strategy", "subtitle": "Article"}, {"url": "https://www.google.com/search?q=Xiaomi%20product%20launch%20timeline%20and%20strategy", "type": "article", "title": "Xiaomi Product Launches", "subtitle": "Article"}, {"url": "https://www.google.com/search?q=Xiaomi%20global%20expansion%20podcast%20interview%20podcast", "type": "podcast", "title": "Xiaomi's Global Expansion", "subtitle": "Podcast"}], "userTasks": [{"id": 1784179134210, "code": 1, "done": false, "text": "when is the spring auto show here in bkk", "children": [{"id": 1784188265153, "code": 1, "done": false, "text": "The official name of the event is the Bangkok International Motor Show."}, {"id": 1784187778758, "code": 2, "done": false, "text": "It is typically held at the IMPACT Challenger Hall in Muang Thong Thani, Nonthaburi, Bangkok."}, {"id": 1784188173733, "code": 3, "done": false, "text": "The event is usually organized by Grand Prix International."}, {"id": 1784188761730, "code": 4, "done": false, "text": "It generally takes place in March or April each year."}, {"id": 1784187837706, "code": 5, "done": false, "text": "For the exact schedule, visit the official Bangkok International Motor Show website."}], "_childSeq": 5}, {"id": 1783218716235, "code": 2, "done": true, "text": "WHEN DO THEY GO ON SALE IN BANGKOK?", "children": [{"id": 1783232637580, "code": 1, "done": true, "text": "Search 'Xiaomi SU 7 Bangkok release date' on Google for news articles."}], "_childSeq": 1}, {"id": 1784249566815, "code": 3, "done": false, "text": "CHECK ABOUT FINANCING FROM KASAKORN BANK"}, {"id": 1784250867091, "code": 4, "done": false, "text": "BUY A CAMERA TO SHOOT CAR SHOW IMAGES"}], "danger_zone": "Procrastination Pit — I often delay researching or planning due to overwhelm. This leads to missed opportunities and stagnation in my goal."}	\N
2e00af0e-d85d-4d8c-acc1-552621df6be2	868440e8-823b-4ca9-8e3b-385af4fb8879	I AM PERFECT EYE HEALTH	\N	\N	0	0	\N	\N	2026-04-29 01:32:46.846065+00	2026-05-28 08:00:46.166+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	{"beliefs": ["Success is inevitable", "I deserve this", "Action creates results", "I am ready", "My time is now"], "roadmap": ["Define your core vision with complete clarity", "Build a daily non-negotiable routine", "Execute one keystone habit every morning", "Track your wins weekly — never miss twice", "Find a mentor or accountability partner", "Remove one major distraction this week", "Celebrate every milestone, no matter how small"], "attitudes": [{"body": "I show up every day no matter what.", "title": "Relentless"}, {"body": "I appreciate how far I've come.", "title": "Grateful"}, {"body": "I take action before I'm ready.", "title": "Bold"}, {"body": "I eliminate what doesn't serve me.", "title": "Focused"}], "meditation": "You are exactly where you need to be. Breathe deeply and trust the process.", "affirmations": ["I am unstoppable", "I am focused", "I am wealthy", "I am healthy", "I am free", "I am clear"]}	{"beliefs": ["Success is inevitable", "I deserve this", "Action creates results", "I am ready", "My time is now"], "roadmap": ["Define your core vision with complete clarity", "Build a daily non-negotiable routine", "Execute one keystone habit every morning", "Track your wins weekly — never miss twice", "Find a mentor or accountability partner", "Remove one major distraction this week", "Celebrate every milestone, no matter how small"], "attitudes": [{"body": "I show up every day no matter what.", "title": "Relentless"}, {"body": "I appreciate how far I've come.", "title": "Grateful"}, {"body": "I take action before I'm ready.", "title": "Bold"}, {"body": "I eliminate what doesn't serve me.", "title": "Focused"}], "meditation": "You are exactly where you need to be. Breathe deeply and trust the process.", "affirmations": ["I am unstoppable", "I am focused", "I am wealthy", "I am healthy", "I am free", "I am clear"]}	\N	\N	\N	\N	\N	\N
912ceb35-f8b8-475e-b2b1-a6821042d496	868440e8-823b-4ca9-8e3b-385af4fb8879	I AM FIT AND TRIM AT MY IDEAL WEIGHT OF 68 KILOS	\N	\N	0	0	\N	\N	2026-04-30 04:48:37.466346+00	2026-05-28 08:00:46.166+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	{"beliefs": ["Success is inevitable", "I deserve this", "Action creates results", "I am ready", "My time is now"], "roadmap": ["Define your core vision with complete clarity", "Build a daily non-negotiable routine", "Execute one keystone habit every morning", "Track your wins weekly — never miss twice", "Find a mentor or accountability partner", "Remove one major distraction this week", "Celebrate every milestone, no matter how small"], "attitudes": [{"body": "I show up every day no matter what.", "title": "Relentless"}, {"body": "I appreciate how far I've come.", "title": "Grateful"}, {"body": "I take action before I'm ready.", "title": "Bold"}, {"body": "I eliminate what doesn't serve me.", "title": "Focused"}], "meditation": "You are exactly where you need to be. Breathe deeply and trust the process.", "affirmations": ["I am unstoppable", "I am focused", "I am wealthy", "I am healthy", "I am free", "I am clear"]}	{"beliefs": ["Success is inevitable", "I deserve this", "Action creates results", "I am ready", "My time is now"], "roadmap": ["Define your core vision with complete clarity", "Build a daily non-negotiable routine", "Execute one keystone habit every morning", "Track your wins weekly — never miss twice", "Find a mentor or accountability partner", "Remove one major distraction this week", "Celebrate every milestone, no matter how small"], "attitudes": [{"body": "I show up every day no matter what.", "title": "Relentless"}, {"body": "I appreciate how far I've come.", "title": "Grateful"}, {"body": "I take action before I'm ready.", "title": "Bold"}, {"body": "I eliminate what doesn't serve me.", "title": "Focused"}], "meditation": "You are exactly where you need to be. Breathe deeply and trust the process.", "affirmations": ["I am unstoppable", "I am focused", "I am wealthy", "I am healthy", "I am free", "I am clear"]}	\N	\N	\N	\N	\N	\N
8e4714ce-bb03-4e1e-ba38-9a74dbfdac2c	0fa88179-af12-4659-ad95-c6ae5fbc23e1	I AM 200 Founder Subscriptions sold before launch.	\N	\N	0	0	\N	\N	2026-07-08 13:37:14.295844+00	2026-07-17 03:15:24.711+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	\N	\N	\N	\N	\N	https://images.pexels.com/photos/7430714/pexels-photo-7430714.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940	\N	\N
6d2bb993-808d-4dd8-9e01-67ee60ba272c	868440e8-823b-4ca9-8e3b-385af4fb8879	I AM THE PROUD OWNER OF COSMIC INTENTIONS, A COMMUNITY OF 1000 PLUS MEMBERS AND GROWING FAST.	\N	\N	0	0	\N	\N	2026-04-30 09:09:28.322715+00	2026-05-28 08:00:46.166+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	{"beliefs": ["Success is inevitable", "I deserve this", "Action creates results", "I am ready", "My time is now"], "roadmap": ["Define your core vision with complete clarity", "Build a daily non-negotiable routine", "Execute one keystone habit every morning", "Track your wins weekly — never miss twice", "Find a mentor or accountability partner", "Remove one major distraction this week", "Celebrate every milestone, no matter how small"], "attitudes": [{"body": "I show up every day no matter what.", "title": "Relentless"}, {"body": "I appreciate how far I've come.", "title": "Grateful"}, {"body": "I take action before I'm ready.", "title": "Bold"}, {"body": "I eliminate what doesn't serve me.", "title": "Focused"}], "meditation": "You are exactly where you need to be. Breathe deeply and trust the process.", "affirmations": ["I am unstoppable", "I am focused", "I am wealthy", "I am healthy", "I am free", "I am clear"]}	{"beliefs": ["Success is inevitable", "I deserve this", "Action creates results", "I am ready", "My time is now"], "roadmap": ["Define your core vision with complete clarity", "Build a daily non-negotiable routine", "Execute one keystone habit every morning", "Track your wins weekly — never miss twice", "Find a mentor or accountability partner", "Remove one major distraction this week", "Celebrate every milestone, no matter how small"], "attitudes": [{"body": "I show up every day no matter what.", "title": "Relentless"}, {"body": "I appreciate how far I've come.", "title": "Grateful"}, {"body": "I take action before I'm ready.", "title": "Bold"}, {"body": "I eliminate what doesn't serve me.", "title": "Focused"}], "meditation": "You are exactly where you need to be. Breathe deeply and trust the process.", "affirmations": ["I am unstoppable", "I am focused", "I am wealthy", "I am healthy", "I am free", "I am clear"]}	\N	\N	\N	\N	\N	\N
d6845cdf-d8e4-4b19-9e47-e33981ca2e8f	868440e8-823b-4ca9-8e3b-385af4fb8879	I AM I HAVE at least $100,000 in savings.	\N	\N	0	0	\N	\N	2026-05-01 10:36:53.178121+00	2026-05-28 08:00:46.166+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	\N	\N	\N	\N	\N	\N	\N	\N
0d3e611f-9783-4f9a-bfda-c86bb4c7a71a	0fa88179-af12-4659-ad95-c6ae5fbc23e1	I AM FOCUSED.	\N	\N	0	0	\N	\N	2026-07-03 02:53:28.40984+00	2026-07-17 03:15:24.711+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	{"media": {"youtube": ["Arnold's official channel — 'How to Visualize Success'", "Joe Rogan Experience interview clips"], "articles": ["Tim Ferriss blog — Arnold's 6 rules of success", "Forbes — Arnold on long-term goal setting"], "podcasts": ["Tim Ferriss Show — Arnold episodes", "The School of Greatness — Lewis Howes interview"]}, "quotes": ["The only way to do great work is to love what you do. — Steve Jobs", "Whether you think you can or you think you can't, you're right. — Henry Ford", "It always seems impossible until it's done. — Nelson Mandela", "Success is not final, failure is not fatal: the courage to continue is what counts. — Winston Churchill", "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt"], "beliefs": ["Success is inevitable", "I deserve this", "Action creates results", "I am ready", "My time is now"], "roadmap": ["Define your core vision with complete clarity", "Build a daily non-negotiable routine", "Execute one keystone habit every morning", "Track your wins weekly — never miss twice", "Find a mentor or accountability partner", "Remove one major distraction this week", "Celebrate every milestone, no matter how small"], "achiever": {"name": "Arnold Schwarzenegger", "tagline": "Bodybuilder, actor, governor — a textbook case of vision-led reinvention across three industries."}, "attitudes": [{"body": "I show up every day no matter what.", "title": "Relentless"}, {"body": "I appreciate how far I've come.", "title": "Grateful"}, {"body": "I take action before I'm ready.", "title": "Bold"}, {"body": "I eliminate what doesn't serve me.", "title": "Focused"}], "meditation": "You are exactly where you need to be. Breathe deeply and trust the process.", "risks_taken": ["Left home country at 21 with no English to pursue a niche sport", "Walked away from peak bodybuilding fame to break into Hollywood", "Ran for office without prior political experience"], "affirmations": ["I am unstoppable", "I am focused", "I am wealthy", "I am healthy", "I am free", "I am clear"], "critical_skills": ["Public speaking and on-camera presence", "Long-horizon goal setting with weekly milestones", "Negotiation and self-promotion without arrogance"], "mindset_attitudes": ["Treat the goal as already done — only execution remains", "Pain is a signal, not a stop sign", "Reps over motivation: the work is the meditation"], "networking_strategy": ["Showed up in person — gyms, sets, parties — never just letters", "Became useful to mentors before asking for anything", "Stacked relationships across industries he hadn't entered yet"]}	\N	\N	\N	\N	https://images.pexels.com/photos/723501/pexels-photo-723501.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940	\N	\N
6f64dff7-fca8-47d8-b13b-1c2a6d0b1cb8	868440e8-823b-4ca9-8e3b-385af4fb8879	I AM MAKING AT LEAST $1,000 PER MONTH WITH MY FB SIDE HUSTLE.	\N	\N	0	0	\N	\N	2026-04-30 04:51:21.381221+00	2026-05-28 08:00:46.166+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	\N	\N	\N	\N	\N	\N	\N	\N
4dca2260-b0ff-4616-bb19-760a639e02bc	868440e8-823b-4ca9-8e3b-385af4fb8879	I AM IN PERFECT PHYSICAL AND MENTAL HEALTH.	\N	\N	0	0	\N	\N	2026-04-30 04:53:06.735694+00	2026-05-28 08:00:46.166+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	\N	\N	\N	\N	\N	\N	\N	\N
bea9d575-4496-471e-9f47-630c19c42535	0fa88179-af12-4659-ad95-c6ae5fbc23e1	I AM PREMEIRING COSMIC INTENTIONS GLOBALLY THIS SEPTEMBER.	\N	2026-09-01	0	0	\N	\N	2026-04-27 05:21:45.972293+00	2026-07-17 03:15:24.711+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	{"beliefs": ["I believe my body knows how to reach and maintain my ideal weight.", "I trust the process of my healthy journey.", "I am deserving of a healthy and vibrant life.", "I believe in the power of my mind to create positive change.", "I am capable of achieving my health goals with consistency and joy."], "attitudes": [{"body": "I welcome change as a natural part of my journey toward my ideal weight.", "title": "Embrace Change"}, {"body": "I choose joy in every step I take toward my healthy lifestyle.", "title": "Choose Joy"}, {"body": "I celebrate every small victory on my path to maintaining my ideal weight.", "title": "Celebrate Progress"}, {"body": "I am grateful for my body and all it allows me to experience.", "title": "Practice Gratitude"}], "meditation": "I breathe in positivity and exhale any doubts about my health.", "affirmations": ["I am maintaining my ideal weight of 68 kilos effortlessly.", "Every day, I make choices that support my health and wellbeing.", "I feel great in my body and embrace my healthy lifestyle.", "I love and appreciate my body for all it does for me.", "I am in control of my choices and I choose to nourish myself.", "I radiate confidence and vitality at my ideal weight."]}	{"media": {"youtube": ["J.J. Virgin's YouTube Channel", "The Virgin Diet: Lose Up to 7 Pounds in 7 Days"], "articles": ["MindBodyGreen + How to Maintain Your Ideal Weight", "Health.com + J.J. Virgin's Weight Loss Tips"], "podcasts": ["The J.J. Virgin Show + Episode on Weight Management", "The Model Health Show + Episode on Nutrition"]}, "roadmap": ["Set a specific goal weight and timeline for achieving it.", "Create a personalized nutrition plan that includes whole foods.", "Incorporate regular exercise into your routine, focusing on enjoyment.", "Join a local or online health community for support.", "Track your progress weekly to stay accountable.", "Practice mindfulness or meditation to reduce stress-related eating.", "Celebrate small victories to maintain motivation."], "achiever": {"name": "J.J. Virgin", "tagline": "Nutrition and fitness expert who transformed her health and body while inspiring millions."}, "risks_taken": ["Invested in personal training and nutrition coaching", "Started her own health-focused business", "Shared her journey publicly despite criticism"], "missionControl": {"items": [{"why": "Visualization has been shown to improve motivation and performance (Taylor, 1998).", "flag": null, "action": "Visualize yourself at 68 kilos every morning.", "category": "Mindset", "deepDive": null}, {"why": "Tracking food intake can lead to a 15% reduction in calories consumed (Gillespie et al., 2015).", "flag": null, "action": "Maintain a food diary for a week.", "category": "Habit", "deepDive": null}, {"why": "A clutter-free environment reduces temptation and promotes healthier choices (Wansink, 2010).", "flag": null, "action": "Remove junk food from your home.", "category": "Environment", "deepDive": null}, {"why": "Social support enhances weight loss success rates by 20% (Wing & Jeffery, 1999).", "flag": null, "action": "Join a weight maintenance support group.", "category": "Social", "deepDive": null}, {"why": "Regular monitoring can keep you accountable and decrease the likelihood of weight gain (Klem et al., 2000).", "flag": null, "action": "Track your weight weekly on a spreadsheet.", "category": "Accountability", "deepDive": null}, {"why": "Strength training can boost metabolism and help maintain weight loss (Westcott, 2012).", "flag": null, "action": "Incorporate strength training at least twice a week.", "category": "Habit", "deepDive": null}, {"why": "Affirmations can significantly impact self-efficacy and motivation (Bandura, 1997).", "flag": "deeper", "action": "Adopt a mantra: 'I am my ideal weight.'", "category": "Mindset", "deepDive": ""}, {"why": "Meal planning is associated with healthier eating patterns and weight control (Garnett et al., 2015).", "flag": null, "action": "Plan your meals for the week every Sunday.", "category": "Habit", "deepDive": null}, {"why": "Drinking water can help reduce calorie intake and promote weight loss (Davy et al., 2008).", "flag": null, "action": "Replace sugary drinks with water.", "category": "Habit", "deepDive": null}, {"why": "Staying hydrated can help control appetite and improve metabolism (Popkin et al., 2010).", "flag": null, "action": "Set a reminder to drink water every hour.", "category": "Habit", "deepDive": null}, {"why": "Eating healthy 80% of the time allows for flexibility and can lead to better adherence (Vander Wal et al., 2008).", "flag": null, "action": "Follow the 80/20 rule when eating.", "category": "Strategy", "deepDive": null}, {"why": "Recognizing achievements can enhance motivation and positive behavior change (Schunk, 2003).", "flag": null, "action": "Celebrate small wins by treating yourself non-food rewards.", "category": "Milestone", "deepDive": null}, {"why": "Excessive screen time is linked to weight gain due to sedentary behavior (Hale & Guan, 2015).", "flag": null, "action": "Limit screen time to less than 2 hours a day.", "category": "Warning", "deepDive": null}, {"why": "Walking can burn additional calories and improve overall health (Tudor-Locke et al., 2011).", "flag": null, "action": "Incorporate a daily walk of at least 30 minutes.", "category": "Habit", "deepDive": null}, {"why": "Smaller dish sizes can help control portion sizes and reduce calorie intake (Wansink & van Ittersum, 2013).", "flag": null, "action": "Use smaller plates for meals.", "category": "Environment", "deepDive": null}, {"why": "Realistic and specific goals can lead to better outcomes (Locke & Latham, 2002).", "flag": null, "action": "Set a monthly weight goal of +/- 1 kilo.", "category": "Milestone", "deepDive": null}, {"why": "Reducing alcohol can lead to weight loss due to lower calorie intake (Schoenfeld & Aragon, 2018).", "flag": null, "action": "Limit alcohol consumption to weekends only.", "category": "Habit", "deepDive": null}, {"why": "Mindful eating has been linked to reduced caloric intake and improved weight control (Mason et al., 2016).", "flag": null, "action": "Practice mindful eating by focusing on every bite.", "category": "Habit", "deepDive": null}, {"why": "Having someone to share goals with can enhance commitment and success (Harkin et al., 2016).", "flag": null, "action": "Find an accountability partner with similar goals.", "category": "Social", "deepDive": null}, {"why": "Increased knowledge about nutrition can positively influence weight management behaviors (Contento, 2008).", "flag": null, "action": "Read a book on nutrition every month.", "category": "Strategy", "deepDive": null}, {"why": "Visualization techniques can increase motivation and goal achievement (Miller, 2012).", "flag": null, "action": "Create a vision board of your ideal lifestyle.", "category": "Mindset", "deepDive": null}, {"why": "Home-cooked meals tend to be healthier and lower in calories than restaurant food (Stern et al., 2013).", "flag": null, "action": "Cook at home at least five days a week.", "category": "Habit", "deepDive": null}, {"why": "Trying new activities can keep exercise fresh and exciting, improving adherence (Ryan & Deci, 2000).", "flag": null, "action": "Engage in a new physical activity every month.", "category": "Habit", "deepDive": null}, {"why": "Investing in quality food can improve diet quality and help maintain weight (Drewnowski & Almiron-Roig, 2010).", "flag": null, "action": "Dedicate a portion of your budget to healthy foods.", "category": "Strategy", "deepDive": null}, {"why": "Reminders can help reinforce healthy habits and choices (Gollwitzer et al., 2009).", "flag": null, "action": "Set reminders for healthy snacks instead of junk food.", "category": "Accountability", "deepDive": null}, {"why": "Processed foods are often high in unhealthy fats and sugars, leading to weight gain (Monteiro et al., 2013).", "flag": null, "action": "Limit processed foods to once a week.", "category": "Habit", "deepDive": null}, {"why": "Challenges can provide motivation and create a sense of community, enhancing adherence (Buchan et al., 2017).", "flag": null, "action": "Participate in a fitness challenge.", "category": "Social", "deepDive": null}, {"why": "Focusing on health rather than weight can lead to more sustainable changes (Peters et al., 2016).", "flag": null, "action": "Shift your focus from weight loss to health gain.", "category": "Mindset", "deepDive": null}, {"why": "Convenience can lead to healthier eating patterns (Cohen et al., 2012).", "flag": null, "action": "Use a meal delivery service for healthy options.", "category": "Strategy", "deepDive": null}, {"why": "High sugar intake is linked to obesity and metabolic issues (Te Morenga et al., 2013).", "flag": null, "action": "Limit added sugars to less than 25 grams per day.", "category": "Warning", "deepDive": null}, {"why": "Learning cooking skills can improve dietary habits and promote healthier eating (Guthrie, 2011).", "flag": null, "action": "Participate in weekly cooking classes.", "category": "Habit", "deepDive": null}, {"why": "Meal prepping can help save time and reduce unhealthy eating choices during the week (Harris et al., 2015).", "flag": null, "action": "Engage in weekly meal prepping.", "category": "Habit", "deepDive": null}, {"why": "Reaching daily step goals can significantly improve overall health and manage weight (Tudor-Locke et al., 2010).", "flag": null, "action": "Set a daily step goal of 10,000 steps.", "category": "Habit", "deepDive": null}, {"why": "Understanding your triggers can help you manage emotional eating effectively (Herman & Polivy, 2008).", "flag": null, "action": "Identify and avoid your emotional eating triggers.", "category": "Warning", "deepDive": null}, {"why": "Self-reflection can enhance self-awareness and improve decision-making (Schön, 1983).", "flag": null, "action": "Engage in regular self-reflection on your weight journey.", "category": "Mindset", "deepDive": null}, {"why": "Learning from others' experiences can provide motivation and practical strategies (Schneider et al., 2012).", "flag": null, "action": "Read success stories of others who maintained weight.", "category": "Strategy", "deepDive": null}, {"why": "Poor sleep is associated with weight gain and obesity (Cappuccio et al., 2008).", "flag": null, "action": "Commit to a consistent sleep schedule.", "category": "Habit", "deepDive": null}, {"why": "Eating out often can lead to higher calorie intake and poor food choices (Fraser et al., 2010).", "flag": null, "action": "Limit dining out to once a week.", "category": "Habit", "deepDive": null}, {"why": "A personal mantra can reinforce commitment and keep you focused on your goals (Dweck, 2006).", "flag": null, "action": "Create a personal weight maintenance mantra.", "category": "Mindset", "deepDive": null}, {"why": "Wearable fitness trackers can enhance physical activity levels and weight management (Finkelstein et al., 2016).", "flag": null, "action": "Invest in a fitness tracker.", "category": "Strategy", "deepDive": null}, {"why": "Whole foods are generally lower in calories and more nutritious (Bleich et al., 2017).", "flag": null, "action": "Cook with whole ingredients instead of processed ones.", "category": "Habit", "deepDive": null}, {"why": "Clarifying your motivations can enhance commitment and goal persistence (Deci & Ryan, 2000).", "flag": null, "action": "Reflect on the reasons you want to maintain weight.", "category": "Mindset", "deepDive": null}], "generatedAt": "2026-06-01T01:40:13.977Z"}, "critical_skills": ["Nutrition planning", "Personal training", "Public speaking"], "mindset_attitudes": ["Focus on progress, not perfection", "Embrace a growth mindset", "Cultivate resilience against setbacks"], "networking_strategy": ["Joined health and wellness communities", "Collaborated with other fitness experts", "Attended health expos and workshops"]}	2019-06-01	{"components": [{"quote": "“The only place success comes before work is in the dictionary.” — Vince Lombardi", "action": "Research healthy recipes online that align with your weight maintenance goals."}, {"quote": "“Success is not the key to happiness. Happiness is the key to success.” — Albert Schweitzer", "action": "Find an online community or forum that supports weight maintenance and share your journey."}, {"quote": "“Believe you can and you're halfway there.” — Theodore Roosevelt", "action": "Watch motivational videos or talks from weight loss and maintenance experts to reinforce your belief."}, {"quote": "“Plans are nothing; planning is everything.” — Dwight D. Eisenhower", "action": "Create a detailed weekly meal plan using an app that allows tracking of calorie intake."}, {"quote": "“What gets measured gets managed.” — Peter Drucker", "action": "Set reminders on your phone to check in on your progress at the end of each week."}, {"quote": "“You cannot change your destination overnight, but you can change your direction overnight.” — Jim Rohn", "action": "Organize your kitchen to make healthy snacks more accessible than unhealthy ones."}, {"quote": "“Accountability breeds response-ability.” — Stephen R. Covey", "action": "Find an accountability partner online who shares similar weight goals to keep each other motivated."}, {"quote": "“It's not whether you get knocked down, it's whether you get up.” — Vince Lombardi", "action": "Set up a resilience plan for overcoming cravings or setbacks, like having a healthy alternative on hand."}, {"quote": "“Success usually comes to those who are too busy to be looking for it.” — Henry David Thoreau", "action": "Engage in online forums or social media groups focused on healthy living to align with others who share your goals."}], "eternal_problems": [{"action": "Your Digital Vision Board for this goal is already built inside Cosmic Intentions. Open it now and run a visualization session — that IS your vivid vision practice. Do it daily.", "insight": "Imagine the feeling of effortlessly maintaining your ideal weight of 68 kilos, where you wake up each day feeling light, energetic, and confident in your skin. The evenings, once filled with snacking temptations, transform into moments of mindful relaxation, and the weekends become opportunities for nourishing meals rather than bingeing. Your body feels like a well-tuned instrument, responding beautifully to your choices. Embrace this vision and remember that this is your reality to step into. Challenge yourself to take this vision seriously and commit to it daily."}, {"action": "Reflect on your motivations in a focused session on Cosmic Intentions; visualize how your ideal weight enhances your life experience.", "insight": "The reason behind your commitment to maintaining your ideal weight goes beyond mere numbers; it’s about vitality, confidence, and the joy of feeling your best. When social events arise, reframe them not as temptations but as opportunities to showcase your strength and choices, finding joy in the connections rather than the food. This deeper purpose fuels your journey even in times of pressure. Stand firm in your why, and let it guide you through any challenging moments."}, {"action": "Set up a simple meal plan for the week using an online app to streamline your healthy eating choices.", "insight": "To maintain your ideal weight amidst work stress, it’s essential to have a clear plan in place. When the pressure mounts, commit to a simple if/then strategy: if you feel overwhelmed, then take a five-minute break to focus on your breath or stretch. This will help you stay grounded and maintain your healthy choices during challenging times. Your plan is your ally; trust it and stay committed."}, {"action": "Use a tracking app to log your meals and feelings about your weight weekly to identify patterns.", "insight": "Regularly checking your progress is vital to staying on track. Make it a routine to assess how you're feeling physically and emotionally about your weight each week. This feedback loop will not only confirm your commitment but also provide insights into what works best for you. Acknowledge your progress, however small, and keep pushing forward with confidence."}, {"action": "Declutter your workspace and kitchen by removing any temptations and replacing them with healthy options.", "insight": "Designing your environment is key to maintaining your ideal weight. Create a space at home that supports your healthy choices, whether it's organizing your kitchen for easy meal prep or having healthy snacks readily available. This proactive approach minimizes reliance on willpower alone and sets you up for success daily. Take charge of your surroundings and make them work for you."}, {"action": "Identify three affirmations that reflect your ideal weight and repeat them daily using Cosmic Intentions.", "insight": "As you maintain your ideal weight, you’re not just achieving a number; you are evolving into the person who naturally embodies health and vitality. Embrace this identity as a healthy individual who makes choices aligned with your goals. Your self-perception is a powerful part of this journey, so step into this identity with confidence and intention."}]}	{"checks": {}, "mindset": {"prayer": "As I embrace my ideal weight of 68 kilos, I ask for strength and determination to make choices that honor my body. May I find joy in movement and gratitude in nourishment. I am grateful for the energy and vitality that come with this weight. I trust the process of becoming my healthiest self.", "toInstall": ["I effortlessly maintain my ideal weight.", "I enjoy nourishing my body with healthy foods.", "Exercise is a joyful part of my life.", "Feeling great at this weight is my reality."], "recitations": ["I am at my ideal weight of 68 kilos.", "I love my body and how it feels.", "I am in control of my choices.", "Health and vitality are my birthright.", "Every day, I choose foods that nourish me.", "I celebrate my body’s strength and grace."], "currentAttitudes": ["I struggle to maintain my weight.", "I can't resist unhealthy foods.", "Exercise is a chore.", "I don't think I can feel great at this weight."]}, "terrain": [{"j": null, "text": "Learn about nutrition and the impact of food on health.", "isJournal": false}, {"j": 10, "text": "J10 — Write: List my top 5 healthy habits and how they support my ideal weight.", "isJournal": true}, {"j": null, "text": "Develop a consistent workout routine that I enjoy.", "isJournal": false}, {"j": null, "text": "Understand the importance of mental health in weight maintenance.", "isJournal": false}, {"j": null, "text": "Master meal prepping for my ideal weight.", "isJournal": false}, {"j": null, "text": "Cultivate mindfulness in eating habits.", "isJournal": false}], "practice": {"gratitudeItems": ["My body for its strength and resilience.", "My ability to make healthy choices.", "The support of friends and family.", "The energy I have to engage in activities I love.", "The delicious, nutritious food available to me."], "weeklyQuestion": "What limiting beliefs am I still holding onto that prevent me from fully embracing my ideal weight?", "meditationFocus": "I sit quietly, feeling the ground beneath me. I breathe in deeply, filling my lungs with fresh air and envisioning my body at 68 kilos. I feel light, vibrant, and full of energy. I appreciate every part of my journey, knowing that I am becoming my healthiest self.", "vizAffirmations": ["I see myself at 68 kilos, feeling vibrant and healthy.", "I visualize myself enjoying healthy meals with ease.", "I imagine my workouts bringing me joy and energy.", "I see myself confidently wearing clothes that reflect my ideal weight.", "I visualize my daily choices aligning with my health goals.", "I picture my reflection and feel proud of my progress.", "I imagine myself surrounded by supportive people who uplift my journey.", "I see my life filled with energy and vitality."]}, "thisWeek": [{"j": null, "text": "By Friday I will have tracked my daily food intake using a meal logging app to ensure I stay within my caloric limits.", "isJournal": false}, {"j": null, "text": "By Friday I will have completed three 30-minute workout sessions focused on strength training at home.", "isJournal": false}, {"j": null, "text": "By Friday I will have prepared five healthy, balanced meals in advance to avoid last-minute unhealthy eating.", "isJournal": false}, {"j": 1, "text": "J1 — Write: What emotions or triggers led to past weight gain and how can I address them this week?", "isJournal": true}], "thisMonth": [{"j": null, "text": "Create a meal plan that aligns with my ideal weight.", "isJournal": false}, {"j": 6, "text": "J6 — Write: Reflect on how I feel at my ideal weight.", "isJournal": true}, {"j": null, "text": "Complete 15 workouts this month.", "isJournal": false}, {"j": null, "text": "Try three new healthy recipes.", "isJournal": false}, {"j": null, "text": "Track my daily water intake and aim for 2 liters.", "isJournal": false}], "dangerZones": [{"j": 2, "title": "Evening Snacking", "pitfall": "Evenings are my weak point; I often reach for unhealthy snacks while watching TV. This mindless eating sabotages my weight maintenance efforts.", "warning": "I start feeling restless and crave something crunchy or sweet.", "ifTrigger": "IF I feel restless in the evening while watching TV", "thenAction": "THEN I will drink a glass of water and wait for 15 minutes before deciding to snack.", "journalText": "J2 — Write: Reflect on how evening snacking impacts my weight and identify healthier alternatives."}, {"j": 3, "title": "Social Events", "pitfall": "At social gatherings, I often indulge in unhealthy food and drinks, leading me to overeat. This can derail my progress significantly.", "warning": "I start feeling pressured to eat what others are having, especially if it's high-calorie.", "ifTrigger": "IF I am at a social event and offered food", "thenAction": "THEN I will politely decline and choose to drink water instead.", "journalText": "J3 — Write: How do I handle food offers at social events without feeling guilty?"}, {"j": 4, "title": "Work Stress", "pitfall": "When work stress peaks, I tend to snack mindlessly at my desk, using food as a coping mechanism. This leads to unnecessary calorie intake.", "warning": "I feel overwhelmed and automatically reach for snacks at my desk.", "ifTrigger": "IF I feel overwhelmed with work tasks", "thenAction": "THEN I will take a 5-minute break to walk around and clear my mind instead of snacking.", "journalText": "J4 — Write: Explore healthier stress management techniques to replace snacking."}, {"j": 5, "title": "Weekend Binge", "pitfall": "Weekends often lead to binge eating because I relax my diet rules. This causes fluctuations in my weight.", "warning": "I start to feel a sense of freedom that leads to poor food choices.", "ifTrigger": "IF it is the weekend and I feel like celebrating", "thenAction": "THEN I will plan my meals in advance and stick to them, allowing for one small treat only.", "journalText": "J5 — Write: How can I set boundaries for myself during weekends to maintain my weight?"}]}	https://images.pexels.com/photos/12498767/pexels-photo-12498767.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940	{"ui": {"plan": true, "proven": true}, "done": {"0": true, "1": true, "2": false}, "_myV2": true, "_rmV2": true, "codes": {"0": 1, "1": 2, "2": 3, "3": 4, "4": 5, "5": 6, "6": 7, "7": 8, "8": 9, "9": 10}, "locks": {"0": true, "1": true}, "tasks": ["Analyze the profiles of your first 200 Founder Subscription buyers to understand their demographics and motivations.", "Study successful global premieres of similar digital products to identify key marketing and engagement tactics.", "Define the unique value proposition of 'Cosmic Intentions' and how it differentiates from other offerings in the market.", "Set a specific price point for Founder Subscriptions based on competitive analysis and perceived value.", "Develop a targeted advertising campaign using data-driven insights to reach demographics similar to your initial 200 subscribers.", "Create a compelling scarcity model for your Founder Subscription that emphasizes limited availability and exclusive benefits.", "Design a structured evening routine that replaces unhealthy snacking with planned, nutritious alternatives, such as pre-portioned healthy snacks.", "Establish a partnership with a global influencer whose audience aligns with your target market to amplify the premiere announcement.", "Deploy an email marketing sequence that builds anticipation and provides exclusive content leading up to the launch.", "Organize a virtual launch event that includes interactive elements to engage your audience and encourage immediate subscriptions."], "_rmSeq": 10, "_codeSeq": 0, "intention": "I AM PREMEIRING COSMIC INTENTIONS GLOBALLY THIS SEPTEMBER.", "resources": [{"url": "https://www.youtube.com/watch?v=CK6uYrvD8qc", "type": "video", "title": "How to build a brand in 7mins | Gary Vaynerchuk", "subtitle": "Gary Vaynerchuk", "thumbnail": "https://i.ytimg.com/vi/CK6uYrvD8qc/mqdefault.jpg"}, {"url": "https://www.youtube.com/watch?v=RcGkHrPSzDc", "type": "video", "title": "Try THIS the Next Time You Have an Uncomfortable Conversation | Simon Sinek", "subtitle": "Simon Sinek", "thumbnail": "https://i.ytimg.com/vi/RcGkHrPSzDc/mqdefault.jpg"}, {"url": "https://www.youtube.com/watch?v=j9DBv8CdMtM", "type": "video", "title": "Seth Godin teaches how to launch a product - What it means to make a difference | BEHIND THE BRAND", "subtitle": "Seth Godin", "thumbnail": "https://i.ytimg.com/vi/j9DBv8CdMtM/mqdefault.jpg"}, {"url": "https://www.hubspot.com", "type": "source", "title": "HubSpot", "subtitle": "Official source"}, {"url": "https://neilpatel.com", "type": "source", "title": "Neil Patel", "subtitle": "Official source"}, {"url": "https://www.google.com/search?q=How%20to%20Successfully%20Launch%20a%20Product%20globally%20strategy", "type": "article", "title": "How to Successfully Launch a Product", "subtitle": "Article"}, {"url": "https://www.google.com/search?q=Effective%20Marketing%20Strategies%20for%20Global%20Product%20Launch", "type": "article", "title": "Effective Marketing Strategies for Global Product Launch", "subtitle": "Article"}, {"url": "https://www.google.com/search?q=The%20Tim%20Ferriss%20Show%20product%20launch%20strategies%20podcast", "type": "podcast", "title": "The Tim Ferriss Show: Product Launch Strategies", "subtitle": "Podcast"}], "userTasks": [], "danger_zone": "Evening Snacking — Evenings are my weak point; I often reach for unhealthy snacks while watching TV. This mindless eating sabotages my weight maintenance efforts."}	\N
d1c0af7f-8d70-4748-9e65-3c7dd8207bdf	0fa88179-af12-4659-ad95-c6ae5fbc23e1	I AM ONE OF THE FUNNIEST PEOPLE EVER.	\N	2026-06-30	0	0	\N	\N	2026-05-31 05:02:12.837273+00	2026-07-17 03:15:24.711+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	{"stoic": ["I will not let fear of judgment prevent me from being my fun-loving self.", "I choose to laugh in the face of adversity and challenge.", "I recognize that every moment is an opportunity for joy.", "I focus on what I can control: my attitude towards fun.", "I will celebrate the small victories that bring joy to my day."], "quotes": ["The most wasted of days is one without laughter. — E.E. Cummings", "Life is either a daring adventure or nothing at all. — Helen Keller", "Laughter is timeless, imagination has no age, and dreams are forever. — Walt Disney", "The only thing better than singing is more singing. — Ella Fitzgerald", "A day without laughter is a day wasted. — Charlie Chaplin"], "beliefs": ["Laughter is a powerful tool for connection.", "Joy is contagious, and I spread it wherever I am.", "Being fun enhances my relationships and brings happiness to others.", "Life is too short to take seriously; I choose to enjoy it.", "My uniqueness is what makes me fun and engaging."], "attitudes": [{"body": "I let go of my inhibitions and embrace my playful side, showing the world that fun is essential.", "title": "Embrace Playfulness"}, {"body": "I find humor and joy in everyday moments, turning the mundane into adventures.", "title": "Seek Joy in the Ordinary"}, {"body": "I uplift those around me, sharing smiles and laughter to create a joyful atmosphere.", "title": "Encourage Others to Laugh"}, {"body": "I welcome unexpected experiences and see them as opportunities for fun and excitement.", "title": "Celebrate Spontaneity"}], "meditation": "In every moment, I choose to invite joy and fun into my life.", "affirmations": ["I radiate joy and laughter wherever I go.", "My playful spirit attracts fun and adventure.", "I find humor in every situation.", "I am unapologetically myself, and that's incredibly fun.", "Every interaction I have is filled with joy and positivity.", "I embrace spontaneity and let my inner child play."]}	\N	2026-06-29	{"_format": 3, "components": [{"quote": "The only limit to our realization of tomorrow will be our doubts of today.", "action": "Articulate a clear, vivid vision of your comedic persona, where every laugh you evoke becomes a stepping stone in building your influence, income, and impact, reinforcing your identity as one of the funniest people on earth."}, {"quote": "Your time is limited, so don’t waste it living someone else’s life.", "action": "Connect deeply with your compelling why, identifying the emotional satisfaction you derive from making others laugh and the joy of connecting with people through humor, allowing that to fuel your journey."}, {"quote": "What we fear doing most is usually what we most need to do.", "action": "Cultivate unwavering belief in your ability to make people laugh effortlessly, mastering objection responses to any doubts that arise, so that your trust architecture is fortified against negativity."}, {"quote": "Success is not final, failure is not fatal: It is the courage to continue that counts.", "action": "Design a comprehensive plan that includes distinct stages of your comedic craft, where each performance and interaction is treated as a unique opportunity to refine your pipeline discipline and elevate your humor."}, {"quote": "If you can’t measure it, you can’t improve it.", "action": "Establish feedback loops that track your comedic growth, measuring audience reactions and laughter rates as a scoreboard that reflects your conversion rates and pipeline velocity."}, {"quote": "The best way to predict the future is to create it.", "action": "Curate an environment that places you consistently in front of diverse audiences, ensuring that access to potential laughter catalysts is a cornerstone of your great selling journey."}, {"quote": "Discipline is the bridge between goals and accomplishment.", "action": "Implement a solid accountability framework that encourages you to share your comedic experiments with trusted peers, enhancing your resilience through constructive feedback and support."}, {"quote": "Fall seven times, stand up eight.", "action": "Develop resilience by embracing constructive criticism as a tool for growth, viewing setbacks as opportunities to refine your humor and strengthen your identity alignment as a master persuader."}, {"quote": "Whatever you are, be a good one.", "action": "Fully embody the identity of a masterful comedian who brings joy to others, recognizing that genuine service through laughter is the hallmark of your success as one of the funniest people on earth."}], "identity_phrase": "YOU ARE GREAT SALES PERSON", "strategy_narrative": "You are great sales person, and imagine a life where laughter flows effortlessly from you, where each moment shared with friends or strangers becomes a journey of joy, a symphony of giggles and smiles that echoes long after the punchline lands. Your ability to connect deeply with others transforms mundane interactions into moments of magic, where your humor not only entertains but uplifts, creating a ripple effect of happiness that enriches both your life and those around you. The love of connection fuels your journey, as you find immense satisfaction in helping others see the brighter side of life, changing their day with just a well-timed joke or a clever observation. To achieve this, envision a complete sales system in your humor practice, where you treat every interaction as a pipeline stage, mastering your own techniques for follow-ups and closing routines, ensuring that laughter is not just spontaneous but crafted with intention and discipline. Regularly tracking your progress becomes your personal scoreboard, where you monitor your conversion rates of smiles and laughter, cultivating mastery in the art of comedy as you refine your craft. Surrounding yourself with the right people—those who appreciate your humor and encourage your growth—creates an environment rich with opportunity, allowing you to thrive and shine as a master of fun. But let's be honest with each other: avoiding feedback can stifle your growth, overthinking jokes can steal the spontaneity of your wit, fear of failure might hold you back from taking risks, and neglecting practice could keep your humor from evolving; these are all live-fire resistance training moments where embracing your identity as a great sales person becomes your shield, guiding you through challenges and helping you scale your comedic potential. So, I challenge you to open THE INNER CITADEL and run a visualization session right now, picturing yourself as that funny, effortless person, making the world laugh with conviction and joy."}	{"locks": {}, "checks": {}, "mindset": {"prayer": "I set the intention to embrace my gift of humor and to share it generously with the world. May I inspire joy and laughter in those I meet, and may my unique perspective bring lightness to heavy hearts. I am grateful for the ability to connect with others through laughter.", "toInstall": ["I have a natural ability to make people laugh.", "My humor resonates with a wide audience.", "I embrace my unique style of comedy.", "I effortlessly bring joy to others."], "recitations": ["I am the life of the party.", "Laughter flows easily from me.", "I find humor in everyday situations.", "I naturally uplift those around me.", "I am an extraordinary comedian.", "My presence brings joy and laughter."], "currentAttitudes": ["I am not funny enough to make people laugh.", "My jokes often fall flat.", "I am too serious to be funny.", "People won't find me entertaining."]}, "terrain": [{"j": null, "text": "Study comedic timing and delivery techniques.", "isJournal": false}, {"j": null, "text": "Learn about different types of humor: observational, dark, slapstick.", "isJournal": false}, {"j": null, "text": "Master the art of storytelling in comedy.", "isJournal": false}, {"j": null, "text": "Develop a unique comedic persona that reflects my identity.", "isJournal": false}, {"j": 10, "text": "J10 — Write: Reflect on my progress in mastering humor each week.", "isJournal": true}], "practice": {"gratitudeItems": ["I am grateful for my sense of humor.", "I appreciate the laughter shared with friends.", "I am thankful for the joy I bring to others.", "I value the moments of laughter in my life.", "I am grateful for the support of those who encourage my comedy."], "weeklyQuestion": "What fears hold me back from fully embracing my comedic talents?", "meditationFocus": "In this moment, I feel the warmth of laughter surrounding me. I visualize myself in a room full of smiling faces, each person radiating joy. I hear the sound of laughter echoing back to me, and I feel a sense of connection and happiness. My heart is light, and I embrace the joy that my humor brings to the world.", "vizAffirmations": ["I visualize myself making a crowd erupt with laughter.", "I see myself confidently delivering jokes.", "I imagine the joy my humor brings to others.", "I picture strangers approaching me for a laugh.", "I envision my laughter echoing in joyful spaces.", "I see myself embracing comedy as my identity.", "I imagine creating comedy that inspires connection.", "I visualize being recognized as a top comedian."]}, "thisWeek": [{"j": null, "text": "By Friday I will have completed five online comedy writing prompts to generate new material.", "isJournal": false}, {"j": null, "text": "By Friday I will have watched and analyzed three stand-up specials to understand different comedic styles.", "isJournal": false}, {"j": null, "text": "By Friday I will have shared three original jokes with friends or family for feedback.", "isJournal": false}, {"j": 1, "text": "J1 — Write: Reflect on the feedback received from sharing jokes and identify which ones resonated most and why.", "isJournal": true}], "thisMonth": [{"j": null, "text": "Attend an improv class to enhance spontaneity in humor.", "isJournal": false}, {"j": 6, "text": "J6 — Write: 10 new jokes based on daily observations.", "isJournal": true}, {"j": null, "text": "Perform a short stand-up routine at an open mic night.", "isJournal": false}, {"j": null, "text": "Watch and analyze three classic comedians for inspiration.", "isJournal": false}, {"j": null, "text": "Create a social media account dedicated to sharing humorous content.", "isJournal": false}], "dangerZones": [{"j": 2, "title": "Avoiding Feedback", "pitfall": "Neglecting to ask for feedback can stunt your growth as a comedian. Without external perspectives, you might miss out on valuable insights.", "warning": "Feeling defensive when someone critiques your humor.", "ifTrigger": "IF I hesitate to share my jokes for fear of criticism,", "thenAction": "THEN I will share at least one joke with a trusted friend immediately.", "journalText": "J2 — Write: Describe a time I avoided feedback. What was the outcome?"}, {"j": 3, "title": "Overthinking Jokes", "pitfall": "Spending too much time perfecting one joke can lead to frustration and inaction. Comedy thrives on spontaneity, not perfectionism.", "warning": "Getting stuck in a loop of rewriting the same joke.", "ifTrigger": "IF I find myself overthinking a single joke for more than 30 minutes,", "thenAction": "THEN I will set it aside and write three new jokes instead.", "journalText": "J3 — Write: What joke did I overthink, and how did it feel to let it go?"}, {"j": 4, "title": "Fear of Failure", "pitfall": "Letting the fear of not being funny prevent me from trying new material is crippling. It's essential to embrace failure as part of the learning process.", "warning": "Feeling anxious or avoiding writing altogether.", "ifTrigger": "IF I feel paralyzed by the fear of being unfunny,", "thenAction": "THEN I will write down my fears and then perform the material regardless of how I feel.", "journalText": "J4 — Write: What fears did I acknowledge, and how did performing help?"}, {"j": 5, "title": "Neglecting Practice", "pitfall": "Not dedicating time to practice can lead to stagnation in comedic skills. Comedy, like any craft, requires consistent effort.", "warning": "Not setting aside time to rehearse new material.", "ifTrigger": "IF I skip practice sessions for two consecutive days,", "thenAction": "THEN I will schedule a dedicated 30-minute practice session immediately.", "journalText": "J5 — Write: What did I practice, and how did it feel to rehearse?"}]}	https://images.pexels.com/photos/36729918/pexels-photo-36729918.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940	{"ui": {"plan": true, "proven": true}, "tasks": ["Identify five friends or acquaintances who have a good sense of humor.", "Reach out to them and ask for honest feedback on your comedic style.", "Prepare a short set of jokes or a funny story to share with them.", "Schedule a time to perform your set in front of them.", "Perform your set and gauge their reactions during the performance.", "Ask for specific feedback immediately after your performance.", "Take notes on their suggestions and insights.", "Implement at least one piece of feedback in your next performance.", "Join a local comedy group or class to receive formal feedback.", "Keep a feedback journal to track your growth and insights over time."], "intention": "I AM ONE OF THE FUNNEST PEOPLE EVER.", "danger_zone": "Avoiding Feedback — Neglecting to ask for feedback can stunt your growth as a comedian. Without external perspectives, you might miss out on valuable insights."}	\N
cffd83c0-d4f7-433c-adcd-69cad920d142	868440e8-823b-4ca9-8e3b-385af4fb8879	I AM HAPPILY MARRIED TO COCO, WE ARE IN LOVE.	\N	\N	0	0	\N	\N	2026-05-08 09:41:50.140311+00	2026-05-28 08:00:46.166+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	\N	{"beliefs": ["Success is inevitable", "I deserve this", "Action creates results", "I am ready", "My time is now"], "roadmap": ["Define your core vision with complete clarity", "Build a daily non-negotiable routine", "Execute one keystone habit every morning", "Track your wins weekly — never miss twice", "Find a mentor or accountability partner", "Remove one major distraction this week", "Celebrate every milestone, no matter how small"], "attitudes": [{"body": "I show up every day no matter what.", "title": "Relentless"}, {"body": "I appreciate how far I've come.", "title": "Grateful"}, {"body": "I take action before I'm ready.", "title": "Bold"}, {"body": "I eliminate what doesn't serve me.", "title": "Focused"}], "meditation": "You are exactly where you need to be. Breathe deeply and trust the process.", "affirmations": ["I am unstoppable", "I am focused", "I am wealthy", "I am healthy", "I am free", "I am clear"]}	\N	\N	\N	\N	\N	\N
2574b789-383b-4a48-a3bd-108a8a5dee89	0fa88179-af12-4659-ad95-c6ae5fbc23e1	I AM building my mailing list and will have my 500 potential users email address on or before launch day.	\N	2026-08-15	0	0	\N	\N	2026-07-03 05:20:58.75718+00	2026-07-17 03:15:24.711+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	\N	\N	2026-07-03	\N	\N	https://images.pexels.com/photos/5426403/pexels-photo-5426403.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940	{"ui": {"plan": true, "proven": true}, "_myV2": true, "tasks": [], "_codeSeq": 1, "intention": "I AM building my mailing list and will have my 500 potential users email address on or before launch day.", "userTasks": [{"id": 1783266401021, "code": 1, "done": false, "text": "Scrape 500 emails from Facebook forums?", "children": [{"id": 1783266510026, "code": 1, "done": false, "text": "Install a web scraping tool like Octoparse or Scrapy on your computer."}, {"id": 1783266659471, "code": 2, "done": false, "text": "Identify specific Facebook groups or forums relevant to your target audience."}, {"id": 1783266446027, "code": 3, "done": false, "text": "Log into Facebook and navigate to the selected groups or forums."}, {"id": 1783267225157, "code": 4, "done": false, "text": "Use the web scraping tool to extract email addresses from public posts or comments, ensuring compliance with privacy policies."}, {"id": 1783267208173, "code": 5, "done": false, "text": "Export the scraped email addresses to a CSV file for organization and future use.", "children": [{"id": 1783267327368, "code": 1, "done": false, "text": "Open the text file or database containing the scraped email addresses."}, {"id": 1783267223676, "code": 2, "done": false, "text": "Launch Microsoft Excel or Google Sheets on your computer."}, {"id": 1783267407466, "code": 3, "done": false, "text": "Copy the list of email addresses from the text file or database."}, {"id": 1783267159450, "code": 4, "done": false, "text": "Paste the copied email addresses into the first column of the spreadsheet."}, {"id": 1783266780702, "code": 5, "done": false, "text": "Click on 'File' and then select 'Save As' or 'Download' from the menu."}, {"id": 1783266898142, "code": 6, "done": false, "text": "Choose 'CSV (Comma delimited)' as the file format and click 'Save' or 'Export'."}], "_childSeq": 6}], "_childSeq": 5}]}	\N
6cbd4b34-e2dc-4469-bcef-16aeb4b2c639	0fa88179-af12-4659-ad95-c6ae5fbc23e1	I AM LAUNCHING COSMIC INTENTIONS TO A WELCOMING WORLDWIDE AUDIENCE.	\N	2026-09-01	0	0	\N	\N	2026-06-03 04:58:00.163367+00	2026-07-17 03:15:24.711+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	{"stoic": ["I focus on what I can control and let go of what I cannot.", "I remind myself that obstacles are opportunities for growth.", "I practice patience, knowing that great things take time.", "I accept challenges as part of my journey toward fulfillment.", "I maintain a calm mind in the face of uncertainty."], "quotes": ["The only limit to our realization of tomorrow will be our doubts of today. — Franklin D. Roosevelt", "Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful. — Albert Schweitzer", "Your work is to discover your world and then with all your heart give yourself to it. — Buddha", "What lies behind us and what lies before us are tiny matters compared to what lies within us. — Ralph Waldo Emerson", "Act as if what you do makes a difference. It does. — William James"], "beliefs": ["I believe that my gifts are meant to serve and uplift others.", "I trust that my efforts will yield fruitful results by the set deadline.", "I am worthy of success and joy in my endeavors.", "I believe in the power of positive intention to manifest my goals.", "I can learn and grow from any challenges I may face during this journey."], "attitudes": [{"body": "I accept that perfection is unattainable and focus on progress instead.", "title": "Embracing Imperfection"}, {"body": "I appreciate each step I take toward onboarding my first customer.", "title": "Gratitude for the Journey"}, {"body": "I believe in my skills and creativity to attract the right clients.", "title": "Confidence in My Abilities"}, {"body": "I expect success and remain open to all possibilities that come my way.", "title": "Positive Expectation"}], "meditation": "I breathe in possibilities and exhale doubt, welcoming success.", "affirmations": ["I am fully capable of attracting my first customer by August first.", "Every action I take brings me closer to my cosmic intentions.", "I embrace the journey of onboarding my first customer with joy and enthusiasm.", "I am open to receiving abundant opportunities and connections.", "My creativity and curiosity will guide me in serving my customers.", "I trust the universe to align the right circumstances for my success."]}	{"media": {"youtube": ["Tony Robbins - Unleash the Power Within", "Tony Robbins - How to Create Lasting Change"], "articles": ["Forbes - Tony Robbins' Tips for Personal Development", "Inc. - The Secrets of Tony Robbins' Success"], "podcasts": ["The Tony Robbins Podcast - Episode on Personal Growth", "The Tim Ferriss Show - Episode with Tony Robbins"]}, "roadmap": ["Identify your unique gifts and strengths through reflection.", "Research successful personal development tools and their key features.", "Create a detailed plan outlining your product's vision and mission.", "Build a prototype or outline of your personal development tool.", "Gather feedback from potential users to refine your concept.", "Establish an online presence through social media and a website.", "Launch your personal development tool and promote it actively."], "achiever": {"name": "Tony Robbins", "tagline": "World-renowned life coach and author who transformed personal development through innovative strategies."}, "risks_taken": ["Quit a stable job to pursue coaching", "Invested in personal development events", "Challenged traditional coaching methods"], "critical_skills": ["Public speaking", "Emotional intelligence", "Strategic planning"], "mindset_attitudes": ["Growth mindset", "Resilience in the face of failure", "Focus on serving others"], "networking_strategy": ["Attend personal development seminars", "Engage with influencers on social media", "Collaborate with other coaches"]}	2021-09-01	{"components": [{"quote": "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt", "action": "Open Cosmic Intentions and refine your vision for the tool's impact."}, {"quote": "The only way to do great work is to love what you do. - Steve Jobs", "action": "Write down your personal mission statement for Cosmic Intentions."}, {"quote": "Success usually comes to those who are too busy to be looking for it. - Henry David Thoreau", "action": "Research the top personal development tools and analyze their strengths."}, {"quote": "What gets measured gets managed. - Peter Drucker", "action": "Set up a daily feedback mechanism to track your progress."}, {"quote": "You cannot swim for new horizons until you have courage to lose sight of the shore. - William Faulkner", "action": "Create a distraction-free zone in your workspace."}, {"quote": "Surround yourself with only people who are going to lift you higher. - Oprah Winfrey", "action": "Connect with a mentor in the personal development field online."}, {"quote": "It’s not whether you get knocked down, it’s whether you get up. - Vince Lombardi", "action": "Implement a daily resilience practice, such as meditation or affirmations."}, {"quote": "You become what you believe. - Oprah Winfrey", "action": "Visualize your identity as the owner of Cosmic Intentions every morning."}, {"quote": "Alone we can do so little; together we can do so much. - Helen Keller", "action": "Join an online community focused on personal development."}], "eternal_problems": [{"action": "Your Digital Vision Board for this goal is already built inside Cosmic Intentions. Open it now and run a visualization session — that IS your vivid vision practice. Do it daily.", "insight": "Imagine waking up each day as the proud owner of Cosmic Intentions, where you see your tool empowering individuals around the globe, transforming lives with every interaction. Feel the sense of fulfillment as you witness your creation become a beacon of personal growth, resonating with countless people. This is not just a dream; it's your reality waiting to unfold. Embrace the feelings of pride and joy that come with this achievement and let them propel you forward."}, {"action": "Identify three ways your tool can enrich lives and list them in Cosmic Intentions today.", "insight": "Your journey to owning Cosmic Intentions is fueled by a deep desire to impact lives positively. Reflect on the moments when you helped others grow and the fulfillment that brings you. This emotional connection is your anchor during challenging times. Whenever perfectionism creeps in, remind yourself that progress is better than perfection, and every step counts towards your ultimate goal."}, {"action": "Outline three specific tasks you can accomplish this week to move towards your goal and schedule them in your calendar.", "insight": "To stay on track in your journey, you need a clear and actionable plan that fits seamlessly into your daily routine. This is where potential distractions can threaten your focus. If you find yourself drifting, pre-commit to a specific time each day dedicated solely to advancing this goal. For instance, if you feel distracted during the afternoon, then commit to working on your tool in the morning instead."}, {"action": "Set a reminder to review your progress weekly and ask for feedback from someone in your network.", "insight": "Feedback is essential in ensuring you’re making progress toward Cosmic Intentions. Regularly check in with your metrics and how users respond to your tool. This data will inform your decisions and adjustments, keeping you aligned with your vision. Challenge yourself to seek constructive feedback from a trusted peer who understands your mission."}, {"action": "Rearrange your workspace to reflect your commitment to Cosmic Intentions and remove any distractions.", "insight": "Designing your environment for success means creating a workspace that inspires creativity and productivity. Everything around you, from your desk setup to your digital tools, should support your mission. If you feel overwhelmed, take a moment to declutter your space and eliminate distractions, creating an atmosphere conducive to your creative processes."}, {"action": "List three characteristics of successful entrepreneurs and integrate them into your daily routine.", "insight": "As you work towards being the owner of Cosmic Intentions, embody the identity of someone who is already successful in this role. This shift in mindset will guide your actions and decisions. Whenever self-doubt arises, remind yourself that you are capable of this achievement and align your daily habits with this identity."}]}	{"locks": {}, "checks": {}, "mindset": {"prayer": "I set the intention to fully embody my role as the proud owner of Cosmic Intentions. I ask for clarity, strength, and the guidance to create a personal development tool that resonates with people worldwide. May I attract the right opportunities and connections to bring my vision to life, and may I remain open to growth and learning on this journey.", "toInstall": ["I am a visionary creator capable of making a significant impact.", "Success is my birthright, and I embrace it fully.", "I possess the skills and knowledge to share my vision with the world.", "I am worthy of recognition and celebrate my achievements."], "recitations": ["I am the proud owner of Cosmic Intentions, and my impact is profound.", "I attract opportunities that align with my purpose.", "Every day, I grow in confidence and capability.", "I am committed to my journey of personal development.", "My vision inspires others to transform their lives.", "I am grateful for the abundance that flows into my life."], "currentAttitudes": ["I am not capable of creating something that matters.", "Success is reserved for others, not for me.", "I don't have the skills necessary to market my ideas effectively.", "I am not deserving of recognition or success."]}, "terrain": [{"j": 1, "text": "Understanding the psychology of personal development.", "isJournal": false}, {"j": 2, "text": "Mastering effective communication and marketing strategies.", "isJournal": false}, {"j": 3, "text": "Building a brand that resonates with my audience.", "isJournal": false}, {"j": 4, "text": "Developing a deep understanding of user feedback and iterations.", "isJournal": true}, {"j": 5, "text": "Creating engaging content that inspires and educates.", "isJournal": false}, {"j": 6, "text": "Networking and relationship-building within the industry.", "isJournal": false}, {"j": 7, "text": "J10 — Write: A personal mission statement for Cosmic Intentions.", "isJournal": true}], "practice": {"gratitudeItems": ["I am grateful for the skills and knowledge I possess.", "I appreciate the support of my friends and family.", "I am thankful for the opportunities that come my way.", "I honor the lessons learned from past experiences.", "I am grateful for my passion for personal development."], "weeklyQuestion": "What fear is holding me back from fully embracing my role as the owner of Cosmic Intentions?", "meditationFocus": "I close my eyes and breathe deeply, envisioning myself standing strong as the owner of Cosmic Intentions. I feel the energy of my purpose flowing through me, igniting my passion and creativity. I embrace the support of my community, feeling their encouragement and love surrounding me. I am here, present, and ready to make a difference in the world of personal development.", "vizAffirmations": ["I see myself successfully launching Cosmic Intentions.", "I visualize a community thriving around my personal development tool.", "I imagine the positive impact my tool has on people's lives.", "I feel the excitement of achieving my goals.", "I see myself receiving testimonials from satisfied users.", "I visualize networking with influential figures in the industry.", "I imagine celebrating my milestones with others who support me.", "I see my brand recognized and respected globally."]}, "thisWeek": [{"j": null, "text": "By Friday I will have completed a detailed market analysis of existing personal development tools, identifying at least five competitors and their unique selling propositions.", "isJournal": false}, {"j": null, "text": "By Friday I will have outlined a unique value proposition for Cosmic Intentions, detailing what sets it apart from competitors.", "isJournal": false}, {"j": null, "text": "By Friday I will have created a prototype of the Cosmic Intentions tool, including a basic user interface and initial content.", "isJournal": false}, {"j": null, "text": "By Friday I will have drafted a marketing strategy that includes at least three social media platforms and two types of content to promote Cosmic Intentions.", "isJournal": false}, {"j": 1, "text": "J1 — Write: Reflect on what personal development means to me and how Cosmic Intentions can embody that meaning.", "isJournal": true}], "thisMonth": [{"j": 1, "text": "Launch the first promotional campaign for Cosmic Intentions.", "isJournal": false}, {"j": 2, "text": "Host a webinar explaining the benefits of Cosmic Intentions.", "isJournal": false}, {"j": 3, "text": "Collaborate with at least three influencers in the personal development space.", "isJournal": false}, {"j": 4, "text": "Gather feedback from early users and iterate on the tool.", "isJournal": true}, {"j": 5, "text": "Create a comprehensive marketing strategy for the next quarter.", "isJournal": true}, {"j": 6, "text": "J6 — Write: A reflection on my journey so far and the lessons learned.", "isJournal": true}], "dangerZones": [{"j": 2, "title": "Procrastination Trap", "pitfall": "I often delay starting new projects until I feel completely ready. This leads to missed deadlines and stagnation.", "warning": "Feeling overwhelmed by the scope of work required.", "ifTrigger": "IF I find myself avoiding work on Cosmic Intentions for more than two days.", "thenAction": "THEN I will set a timer for 25 minutes and work on one small task related to the project.", "journalText": "J2 — Write: Describe a recent instance of procrastination and how it affected my progress."}, {"j": 3, "title": "Perfectionism Paralysis", "pitfall": "I tend to obsess over making everything perfect before sharing it, which prevents me from moving forward.", "warning": "Spending excessive time tweaking minor details instead of focusing on getting things done.", "ifTrigger": "IF I find myself reworking the same content multiple times without making tangible progress.", "thenAction": "THEN I will commit to sharing a draft with at least one trusted individual for feedback.", "journalText": "J3 — Write: Reflect on how perfectionism has hindered my past projects."}, {"j": 4, "title": "Distraction Dilemma", "pitfall": "I easily get sidetracked by social media and other distractions while working from home.", "warning": "Noticing that my focus shifts away from work tasks to scrolling through social feeds.", "ifTrigger": "IF I catch myself spending more than 15 minutes on social media during work hours.", "thenAction": "THEN I will close all social media tabs and use a focus app to block distractions for the next hour.", "journalText": "J4 — Write: Identify my biggest distractions and plan how to mitigate them."}, {"j": 5, "title": "Fear of Rejection", "pitfall": "I often hesitate to share my ideas for fear of criticism or rejection, which stifles creativity.", "warning": "Feeling anxious or hesitant to share progress updates with peers or potential users.", "ifTrigger": "IF I find myself avoiding outreach to potential users or mentors.", "thenAction": "THEN I will send at least one outreach email or message to seek feedback or collaboration.", "journalText": "J5 — Write: Explore my feelings around sharing my work and the fear of rejection."}]}	https://images.pexels.com/photos/27089525/pexels-photo-27089525.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940	{"_myV2": true, "_rmV2": true, "codes": {"0": 1, "1": 2, "2": 3, "3": 4, "4": 5, "5": 6, "6": 7, "7": 8, "8": 9, "9": 10}, "tasks": ["Identify and define the core concept of 'Cosmic Intentions' and how it aligns with current global trends and audience interests.", "Analyze successful global product launches similar to 'Cosmic Intentions', focusing on their approach to audience engagement and market adaptation.", "Map out potential worldwide audience demographics and cultural nuances that may impact the reception of 'Cosmic Intentions'.", "Establish a clear and realistic timeline for the launch, breaking it down into critical phases to combat procrastination.", "Create a detailed content calendar that outlines specific deadlines for each phase to maintain momentum and accountability.", "Develop a minimum viable product (MVP) version of 'Cosmic Intentions' to test audience reactions and gather feedback before full-scale launch.", "Choose and secure partnerships with influencers or industry leaders who align with the 'Cosmic Intentions' brand to expand reach.", "Design a pre-launch marketing campaign utilizing email marketing and targeted social media ads to build anticipation and collect leads.", "Set up an analytics framework to monitor key performance indicators (KPIs) in real-time, enabling quick adjustments and informed decision-making.", "Schedule regular project review meetings to assess progress, address obstacles, and ensure alignment with initial goals and timelines."], "_rmSeq": 10, "_codeSeq": 1, "intention": "I AM LAUNCHING COSMIC INTENTIONS TO A WELCOMING WORLDWIDE AUDIENCE.", "userTasks": [{"id": 1784258104245, "code": 1, "done": false, "text": "testing one two three"}], "danger_zone": "Procrastination Trap — I often delay starting new projects until I feel completely ready. This leads to missed deadlines and stagnation."}	\N
58f4e534-b094-48e7-90ac-3b31e7014421	0fa88179-af12-4659-ad95-c6ae5fbc23e1	I AM PERFECT EYE HEALTH	\N	2026-07-29	0	0	\N	\N	2026-06-29 03:13:45.815075+00	2026-07-17 03:15:24.711+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	\N	\N	2026-06-29	\N	\N	https://images.pexels.com/photos/1458422/pexels-photo-1458422.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940	{"ui": {"plan": true, "proven": true, "provenMore": true}, "done": {"1": true}, "_myV2": true, "_rmV2": true, "codes": {"0": 1, "1": 2, "2": 3, "3": 4, "4": 5, "5": 6, "6": 7, "7": 8, "8": 9, "9": 10}, "locks": {"3": true}, "tasks": ["Schedule an eye exam with an optometrist.", "Purchase blue light blocking glasses.", "Reduce screen time by 30 minutes today.", "Practice the 20-20-20 rule for eye strain relief.", "Incorporate more leafy greens and carrots into your diet.", "Stay hydrated by drinking at least 8 glasses of water today.", "Wear sunglasses when exposed to sunlight.", "Limit intake of sugar and processed foods.", "Perform eye exercises for 10 minutes.", "Get at least 7 hours of sleep tonight."], "_rmSeq": 10, "_codeSeq": 3, "intention": "I AM PERFECT EYE HEALTH", "userTasks": [{"id": 1782916293566, "code": 1, "done": false, "text": "I will put drops in each eye every four hours", "children": [{"id": 1784208654734, "code": 1, "done": false, "text": "Locate your eye drop bottle and ensure it is within its expiration date."}, {"id": 1784208175923, "code": 2, "done": false, "text": "Wash your hands thoroughly with soap and water."}, {"id": 1784208099817, "code": 3, "done": false, "text": "Tilt your head back slightly and pull down your lower eyelid to create a small pocket."}, {"id": 1784208651662, "code": 4, "done": false, "text": "Hold the dropper above your eye and squeeze out a prescribed number of drops."}, {"id": 1784208151440, "code": 5, "done": false, "text": "Close your eye gently and press your finger to the inside corner of your eye for one minute."}, {"id": 1784207961593, "code": 6, "done": false, "text": "Repeat the process for the other eye."}], "_childSeq": 6}, {"id": 1782916332799, "code": 2, "done": false, "text": "Set timer on pc with a pop up to put in the drops."}, {"id": 1782916422901, "code": 3, "done": false, "text": "Add my accessment of my eye health to my Healther Tracker Spreadsheet."}], "danger_zone": ""}	\N
2eec83b3-ad2c-4e4c-a121-25b2bed430ea	0fa88179-af12-4659-ad95-c6ae5fbc23e1	I AM THE PROUD OWNER OF A RME DAC AND WIFIMAN KILLER HEADPHONES.	\N	2027-02-02	0	0	\N	\N	2026-06-14 12:28:15.515112+00	2026-07-17 03:15:24.711+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	{"stoic": ["I focus on what I can control and let go of what I cannot.", "I remind myself that obstacles are merely opportunities in disguise.", "I practice patience, knowing that my efforts will yield results in due time.", "I cultivate inner peace regardless of external circumstances.", "I embrace change, understanding that it is a natural part of life’s journey."], "quotes": ["The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt", "Success is not the key to happiness. Happiness is the key to success. — Albert Schweitzer", "Believe you can and you're halfway there. — Theodore Roosevelt", "What lies behind us and what lies before us are tiny matters compared to what lies within us. — Ralph Waldo Emerson", "Your time is limited, don't waste it living someone else's life. — Steve Jobs"], "beliefs": ["I believe that I can manifest my desires through focused intention.", "I believe that owning a Tesla Model S is a reflection of my hard work and dedication.", "I believe that the universe supports my journey toward this goal.", "I believe that I will overcome any obstacles in my path to owning my Tesla Model S.", "I believe that my Tesla Model S will enhance my life and the lives of others."], "attitudes": [{"body": "I choose to see opportunities and possibilities everywhere I look.", "title": "Abundance Mindset"}, {"body": "I approach each day with excitement, knowing my Tesla Model S is on its way.", "title": "Joyful Expectation"}, {"body": "I express gratitude for the journey and the experiences that lead me to my Tesla Model S.", "title": "Gratitude"}, {"body": "I embrace challenges as stepping stones toward my goal of owning a Tesla Model S.", "title": "Resilience"}], "meditation": "Inhale deeply, envision the joy of your Tesla Model S, and exhale any doubts.", "affirmations": ["I am worthy of owning a Tesla Model S and I attract abundance into my life.", "Every day, I take steps toward my goal of owning a Tesla Model S.", "I embrace the joy and freedom that comes with driving my Tesla Model S.", "I am aligned with the energy of success and prosperity.", "I visualize myself in my Tesla Model S, feeling grateful and fulfilled.", "I deserve to experience the innovation and luxury of my Tesla Model S."]}	\N	2026-07-02	{"_format": 4, "daily_ops": ["Engage with three potential clients today, focusing on building trust architecture and sharing your value narrative to inspire their decision-making process.", "Follow up with every lead in your pipeline, utilizing objection mastery to address any concerns and reinforce your closing conviction.", "Review your sales metrics to assess pipeline velocity and identify areas for improvement, ensuring you are consistently on track to amplify your impact."], "identity_phrase": "YOU ARE GREAT SALES PERSON", "friction_warning": "The most predictable failure point for you pursuing this goal lies in your tendency to avoid financial planning, which could prevent you from making the necessary investments to achieve ownership of the Tesla Model S.", "weekly_milestone": "Secure a commitment from a client that results in a significant sale, demonstrating your mastery in closing and moving closer to owning your Tesla Model S.", "strategy_narrative": "YOU ARE GREAT SALES PERSON, and envision life as the proud owner of a Tesla Model S — imagine the exhilarating feeling of gliding silently down the road, the sleek design turning heads, and the power of the technology at your fingertips, symbolizing not just a car but the culmination of your hard work and dedication to world-class selling that amplifies your influence, income, and impact. This journey is fueled by your love of connection, the profound satisfaction that comes from helping others make transformative decisions, reflecting your genuine desire to serve through selling. To achieve this, you need a credible plan rooted in a complete sales system, where every stage of your pipeline is meticulously managed, follow-ups are effortlessly integrated into your daily routine, and closing becomes a habit driven by conviction. As you track your progress, let your feedback loops serve as your sales scoreboard, continuously measuring conversion rates, pipeline velocity, and revenue signal mastery to ensure you are always growing and improving. Surround yourself with an environment designed for success, strategically placing you in front of the right people and creating access that fuels your selling prowess. But let's be honest with each other: avoiding financial planning, procrastinating on research, ignoring community insights, and underestimating charging needs are real dangers that could derail your progress, and recognizing these as live-fire resistance training moments is key; this is where your identity as a master persuader becomes your shield as you scale toward your goal. Now, I challenge you to open THE INNER CITADEL and run a visualization session right now, embracing the journey ahead with confidence and clarity as you step into your future as a Tesla Model S owner."}	{"locks": {}, "checks": {}, "mindset": {"prayer": "I set my sacred intention to align my thoughts, actions, and beliefs with the reality of owning a Tesla Model S. I am grateful for the abundance in my life and the opportunities that come my way. I trust in my ability to manifest this goal and inspire those around me. May I embrace this journey with confidence and joy.", "toInstall": ["I am financially capable of owning a Tesla Model S.", "I am deserving of luxury and high-quality experiences.", "I attract abundance and opportunities effortlessly.", "Owning a Tesla is a reflection of my success and values."], "recitations": ["I am the proud owner of a Tesla Model S.", "Every day, I attract the financial resources to maintain my vehicle.", "I am grateful for the opportunities that lead me to my Tesla.", "I embody success and abundance in my life.", "I am deserving of luxurious experiences.", "Owning my Tesla empowers me to inspire others."], "currentAttitudes": ["I can't afford a Tesla Model S.", "It's too difficult to maintain a luxury car.", "Owning a Tesla is only for wealthy people.", "I'm not deserving of such a high-quality vehicle."]}, "terrain": [{"j": null, "text": "Financial literacy and investment strategies.", "isJournal": false}, {"j": null, "text": "Understanding electric vehicle maintenance.", "isJournal": false}, {"j": null, "text": "Network building with like-minded individuals.", "isJournal": false}, {"j": null, "text": "Mastering the art of visualization for goal setting.", "isJournal": false}, {"j": null, "text": "Learning about sustainable living and technology.", "isJournal": false}, {"j": 10, "text": "J10 — Write: Reflect on my journey towards owning a Tesla Model S.", "isJournal": true}], "practice": {"gratitudeItems": ["I am grateful for my current reliable vehicle.", "I appreciate the financial opportunities available to me.", "I am thankful for the support of my family and friends.", "I acknowledge the progress I've made in my career.", "I am grateful for the technology that makes electric cars possible."], "weeklyQuestion": "What fears or doubts are holding me back from taking actionable steps towards owning my Tesla Model S?", "meditationFocus": "I close my eyes and visualize myself in my Tesla Model S, feeling the soft leather seats supporting me. I breathe in the fresh air as I drive along a scenic route, feeling a sense of freedom and accomplishment. Each breath fills me with gratitude for the journey I am on and the success I am manifesting. I hear the gentle hum of the electric engine, a reminder of my commitment to sustainability and innovation.", "vizAffirmations": ["I see myself driving my Tesla Model S with pride.", "I feel the smooth acceleration and luxury of the ride.", "I visualize my Tesla parked in my driveway, a symbol of my success.", "I hear the quiet hum of my Tesla as I drive through the city.", "I embrace the freedom and joy that comes with owning my Tesla.", "I feel the admiration of others as I drive my Tesla Model S.", "I visualize sharing my journey and inspiring others.", "I see myself maintaining my financial health while enjoying my Tesla."]}, "thisWeek": [{"j": null, "text": "By Friday I will have researched the total cost of ownership for a Tesla Model S, including insurance, maintenance, and charging costs.", "isJournal": false}, {"j": null, "text": "By Friday I will have created a savings plan detailing how much money I need to save each month to afford a Tesla Model S within the next two years.", "isJournal": false}, {"j": null, "text": "By Friday I will have joined at least one online Tesla owner community or forum to gather insights and advice from current owners.", "isJournal": false}, {"j": 1, "text": "J1 — Write: Reflect on how owning a Tesla Model S aligns with my personal values and lifestyle.", "isJournal": true}], "thisMonth": [{"j": null, "text": "Research financing options for a Tesla Model S.", "isJournal": false}, {"j": 6, "text": "J6 — Write: What does owning a Tesla Model S mean to me?", "isJournal": true}, {"j": null, "text": "Create a savings plan to allocate funds for the car.", "isJournal": false}, {"j": null, "text": "Connect with Tesla owners and learn from their experiences.", "isJournal": false}, {"j": null, "text": "Visualize myself driving my Tesla Model S daily.", "isJournal": false}], "dangerZones": [{"j": 2, "title": "Avoiding Financial Planning", "pitfall": "Ignoring the cost implications can lead to financial strain. Without a clear plan, I risk being unprepared for ownership expenses.", "warning": "Feeling overwhelmed by expenses or ignoring my budget.", "ifTrigger": "IF I start feeling anxious about finances.", "thenAction": "THEN I will immediately review my savings plan and adjust my budget accordingly.", "journalText": "J2 — Write: What specific fears do I have regarding the financial aspect of owning a Tesla?"}, {"j": 3, "title": "Procrastination on Research", "pitfall": "Putting off research means missing out on critical information that could influence my decision. Delaying this step can lead to regret later.", "warning": "Finding excuses to not engage in research or feeling too busy.", "ifTrigger": "IF I find myself avoiding research tasks.", "thenAction": "THEN I will block out 30 minutes each day this week to focus solely on Tesla research.", "journalText": "J3 — Write: What specific research tasks am I avoiding and why?"}, {"j": 4, "title": "Ignoring Community Insights", "pitfall": "Neglecting to engage with current owners means missing valuable firsthand experiences. This lack of insight could lead to uninformed choices.", "warning": "Not feeling motivated to connect with others or dismissing their advice.", "ifTrigger": "IF I avoid engaging with the Tesla community.", "thenAction": "THEN I will post a question in the community forum about ownership experiences.", "journalText": "J4 — Write: What are my feelings about feedback from current Tesla owners?"}, {"j": 5, "title": "Underestimating Charging Needs", "pitfall": "Not understanding charging requirements could lead to inconvenience and frustration. This can deter me from making a confident purchase decision.", "warning": "Feeling uncertain or confused about charging logistics.", "ifTrigger": "IF I start questioning charging options.", "thenAction": "THEN I will research and document charging stations in my area and their availability.", "journalText": "J5 — Write: How do I feel about the charging infrastructure for Tesla in my area?"}]}	https://images.pexels.com/photos/26957121/pexels-photo-26957121.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940	{"ui": {"plan": true, "proven": true}, "done": {"2": true}, "locks": {}, "tasks": ["Identify your daily driving distance to estimate charging needs.", "Determine if home charging installation is feasible.", "Consult with an electrician about installing a home charging station.", "Calculate the cost of installing a home charging station.", "Check local incentives for electric vehicle charging installations.", "Review Tesla's range and charging times for the Model S.", "Join Tesla owner forums to ask about charging experiences.", "Create a charging plan based on your findings and daily routine."], "intention": "I AM THE PROUD OWNER OF A TESLA MODEL S", "danger_zone": "Underestimating Charging Needs — Not understanding charging requirements could lead to inconvenience and frustration. This can deter me from making a confident purchase decision."}	Underestimating Charging Needs
3112004b-1948-4678-8a0f-6fb25b42e89e	0fa88179-af12-4659-ad95-c6ae5fbc23e1	I HAVE sold 200 Cosmic Intentions Founder Subscriptions before it's worldwide launch.	\N	2026-09-04	0	0	\N	\N	2026-07-03 05:41:27.853658+00	2026-07-17 03:15:24.711+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	\N	\N	2026-07-04	\N	\N	https://images.pexels.com/photos/7430714/pexels-photo-7430714.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940	{"_myV2": true, "_rmV2": true, "codes": {"0": 1, "1": 2, "2": 3, "3": 4, "4": 5, "5": 6, "6": 7, "7": 8, "8": 9, "9": 10}, "tasks": ["Research how founder subscriptions work online.", "Create a list of key features and benefits of the Cosmic Intentions Founder Subscription.", "Identify target demographics for potential founders.", "Use LinkedIn to search for individuals interested in founder opportunities.", "Join relevant LinkedIn groups focused on startups and founder initiatives.", "Craft a concise outreach message to connect with potential founders.", "Send connection requests to at least 50 individuals on LinkedIn.", "Post about the Cosmic Intentions Founder Subscription in relevant LinkedIn groups.", "Schedule a virtual meeting with interested individuals to explain the subscription.", "Follow up with all leads after initial contact to encourage sign-ups."], "_rmSeq": 10, "_codeSeq": 2, "intention": "I HAVE sold 200 Cosmic Intentions Founder Subscriptions before it's worldwide launch.", "userTasks": [{"id": 1783212932798, "code": 1, "done": false, "text": "HOW DO FOUNDER SUBSCRIPTONS WORK?"}, {"id": 1783212967940, "code": 2, "done": false, "text": "WHERE DO I FIND THESE FOUNDERS? LINKDIN?"}], "danger_zone": ""}	\N
8287b984-d481-4232-a3fb-9e80c9c96ab3	0fa88179-af12-4659-ad95-c6ae5fbc23e1	I AM LUCKY IN LIFE.	\N	\N	0	0	\N	\N	2026-07-01 22:59:15.724267+00	2026-07-17 03:15:24.711+00	\N	{"quotes": "", "beliefs": "", "mission": "", "insights": "", "affirmations": ""}	\N	\N	\N	\N	\N	https://images.pexels.com/photos/6835014/pexels-photo-6835014.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940	\N	\N
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, name, mission, lifegol, "values", beliefs, attitudes, stoicism, traits, tone, authors, obstacles, why, context, spirituality, anthropic_key, eleven_key, voice_id, updated_at, bts_authors, is_member, pegboard, bts_context, bts_obstacles, bts_why, bts_tone, pb_stoicism, pb_traits, pb_eleven, pb_voiceid, pb_attitudes, pb_beliefs, pb_values, pb_lifegol, pb_mission, pb_name, openai_api_key, openai_voice, viz_quick_sessions, wins) FROM stdin;
868440e8-823b-4ca9-8e3b-385af4fb8879	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	humanist	\N	\N	\N	2026-05-28 08:00:48.831+00		t	\N					“When you wake up in the morning, tell yourself: the people I deal with today will be meddling, ungrateful, arrogant… but I cannot be harmed by them, nor can I hate them.”	Persistence, An Eye For Good Design, I AM Smart, I AM A Good Listener, I AM Creative, I AM Disciplined, Trauma Survivor	3f64bf97aa7b42cab16ef6ef80fdff1835d26baf0d69022a	U9VgC8Xinl7nnNsyDd3J	Imperfect action beats perfect planning.  No panic, no ego spirals, no emotional decisions.  You show up daily whether you full like it or not.  I trust my process.  Win or Lose--I stay steady.	I can figure anything out.  I am responsible for my life.  Action Creates Clarity,  I AM One Of The Luckiest People In The World, Discomfort Is Growth, Consistency Beats Intensity, Focus Creates Results, Everything Is Figureoutable,	Integrity, Ownership, Discipline, Growth, Courage, Focus, Excellence, Resilience, Contribution	I AM easing the burden of those less fortunate.	Discover my gifts. Serve humanity.	Scott	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	alloy	0	[]
0fa88179-af12-4659-ad95-c6ae5fbc23e1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	universe	\N	\N	\N	2026-07-16 05:33:12.79+00		f	\N		FEAR OF FAILURE  ---  STRIVING FOR PERFECTION  ---	SELF EFFACACY ---  EASING THE BURDENS OF THOSE THAT I LOVE  ---  I AM DOING THIS FOR MORE EXOTIC EXPERIENCES  ---	ENCOURAGING  -- SARCASTIC  ---  FIRM  ---  FAIR  ---	Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.	I am the most curious person on earth.  I am creative with a keen eye for style and design.  I live by the Golden Rule.			I am one of the luckiest people in the world.	I am sympothetic toward those less fortunae.  I am not my thoughts.	I do what I say I'm going to do. Honesty,	Experience Joy	Discover My gifts.  Serve Humanity	Scotty		alloy	2	[{"ts": 1784176205568, "src": "task-3-u1783218716235", "date": "2026-07-16", "goal": "I AM THE PROUD OWNER OF A XIAOMI SU 7", "text": "✓ WHEN DO THEY GO ON SALE IN BANGKOK?", "category": ""}, {"ts": 1783819330538, "src": "task-1-0", "date": "2026-07-12", "goal": "I AM PREMEIRING COSMIC INTENTIONS GLOBALLY THIS SEPTEMBER.", "text": "✓ Analyze the profiles of your first 200 Founder Subscription buyers to understand their demographics and motivations.", "category": ""}, {"ts": 1783817845207, "src": "task-1-1", "date": "2026-07-12", "goal": "I AM PREMEIRING COSMIC INTENTIONS GLOBALLY THIS SEPTEMBER.", "text": "✓ Study successful global premieres of similar digital products to identify key marketing and engagement tactics.", "category": ""}]
\.


--
-- Data for Name: roadmap_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roadmap_items (id, user_id, content_id, week, phase, focus, daily_action, milestone, is_complete, completed_at) FROM stdin;
\.


--
-- Data for Name: user_content; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_content (id, user_id, user_name, goal, belief_system, core_blueprint, text_manifest, viz_script, pipeline_version, generated_at) FROM stdin;
\.


--
-- Data for Name: user_scores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_scores (user_id, display_name, total_score, updated_at) FROM stdin;
0fa88179-af12-4659-ad95-c6ae5fbc23e1	Biscuit	187	2026-06-18 03:02:36.331764+00
\.


--
-- Data for Name: waitlist; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.waitlist (id, email, source, created_at) FROM stdin;
059454c4-08cd-445a-9f0b-d702dedc9573	deploy-test@cosmicintentions.com	deploy-verify	2026-07-02 03:58:38.981429+00
f4bcfe99-cd45-4de4-a11b-76f1983ae698	lscottbutler@gmail.com	iam-generator	2026-07-02 06:09:22.722989+00
68a14571-8b16-4d2c-8406-1046bf6de174	mmproducer@gmail.com	iam-generator	2026-07-03 01:00:12.339541+00
\.


--
-- Data for Name: messages_2026_04_09; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2026_04_09 (topic, extension, payload, event, private, updated_at, inserted_at, id, binary_payload) FROM stdin;
\.


--
-- Data for Name: messages_2026_04_10; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2026_04_10 (topic, extension, payload, event, private, updated_at, inserted_at, id, binary_payload) FROM stdin;
\.


--
-- Data for Name: messages_2026_04_11; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2026_04_11 (topic, extension, payload, event, private, updated_at, inserted_at, id, binary_payload) FROM stdin;
\.


--
-- Data for Name: messages_2026_04_12; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2026_04_12 (topic, extension, payload, event, private, updated_at, inserted_at, id, binary_payload) FROM stdin;
\.


--
-- Data for Name: messages_2026_04_13; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2026_04_13 (topic, extension, payload, event, private, updated_at, inserted_at, id, binary_payload) FROM stdin;
\.


--
-- Data for Name: messages_2026_04_14; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2026_04_14 (topic, extension, payload, event, private, updated_at, inserted_at, id, binary_payload) FROM stdin;
\.


--
-- Data for Name: messages_2026_04_15; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2026_04_15 (topic, extension, payload, event, private, updated_at, inserted_at, id, binary_payload) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-04-06 05:37:59
20211116045059	2026-04-06 05:38:00
20211116050929	2026-04-06 05:38:01
20211116051442	2026-04-06 05:38:01
20211116212300	2026-04-06 05:38:02
20211116213355	2026-04-06 05:38:03
20211116213934	2026-04-06 05:38:03
20211116214523	2026-04-06 05:38:04
20211122062447	2026-04-06 05:38:05
20211124070109	2026-04-06 05:38:06
20211202204204	2026-04-06 05:38:06
20211202204605	2026-04-06 05:38:07
20211210212804	2026-04-06 05:38:09
20211228014915	2026-04-06 05:38:10
20220107221237	2026-04-06 05:38:11
20220228202821	2026-04-06 05:38:11
20220312004840	2026-04-06 05:38:12
20220603231003	2026-04-06 05:38:13
20220603232444	2026-04-06 05:38:14
20220615214548	2026-04-06 05:38:15
20220712093339	2026-04-06 05:38:15
20220908172859	2026-04-06 05:38:16
20220916233421	2026-04-06 05:38:17
20230119133233	2026-04-06 05:38:17
20230128025114	2026-04-06 05:38:18
20230128025212	2026-04-06 05:38:19
20230227211149	2026-04-06 05:38:20
20230228184745	2026-04-06 05:38:21
20230308225145	2026-04-06 05:38:21
20230328144023	2026-04-06 05:38:22
20231018144023	2026-04-06 05:38:23
20231204144023	2026-04-06 05:38:24
20231204144024	2026-04-06 05:38:25
20231204144025	2026-04-06 05:38:25
20240108234812	2026-04-06 05:38:26
20240109165339	2026-04-06 05:38:27
20240227174441	2026-04-06 05:38:28
20240311171622	2026-04-06 05:38:29
20240321100241	2026-04-06 05:38:31
20240401105812	2026-04-06 05:38:33
20240418121054	2026-04-06 05:38:34
20240523004032	2026-04-06 05:38:36
20240618124746	2026-04-06 05:38:37
20240801235015	2026-04-06 05:38:37
20240805133720	2026-04-06 05:38:38
20240827160934	2026-04-06 05:38:39
20240919163303	2026-04-06 05:38:40
20240919163305	2026-04-06 05:38:41
20241019105805	2026-04-06 05:38:41
20241030150047	2026-04-06 05:38:44
20241108114728	2026-04-06 05:38:45
20241121104152	2026-04-06 05:38:46
20241130184212	2026-04-06 05:38:46
20241220035512	2026-04-06 05:38:47
20241220123912	2026-04-06 05:38:48
20241224161212	2026-04-06 05:38:48
20250107150512	2026-04-06 05:38:49
20250110162412	2026-04-06 05:38:50
20250123174212	2026-04-06 05:38:50
20250128220012	2026-04-06 05:38:51
20250506224012	2026-04-06 05:38:52
20250523164012	2026-04-06 05:38:52
20250714121412	2026-04-06 05:38:53
20250905041441	2026-04-06 05:38:54
20251103001201	2026-04-06 05:38:54
20251120212548	2026-04-06 05:38:55
20251120215549	2026-04-06 05:38:56
20260218120000	2026-04-06 05:38:57
20260326120000	2026-04-10 02:46:50
20260514120000	2026-06-03 05:26:10
20260527120000	2026-06-03 05:26:12
20260528120000	2026-06-03 05:26:13
20260603120000	2026-06-05 01:08:07
20260605120000	2026-06-17 04:28:28
20260606110000	2026-06-17 04:28:29
20260616120000	2026-06-29 00:04:02
20260624120000	2026-06-29 00:04:04
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter, selected_columns) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
vision-images	vision-images	\N	2026-06-17 04:39:08.564787+00	2026-06-17 04:39:08.564787+00	t	f	\N	\N	\N	STANDARD
goal-audio	goal-audio	\N	2026-06-30 03:21:00.581911+00	2026-06-30 03:21:00.581911+00	t	f	\N	\N	\N	STANDARD
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-04-06 05:38:03.207759
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-04-06 05:38:03.223399
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2026-04-06 05:38:03.233048
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-04-06 05:38:03.251788
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-04-06 05:38:03.275258
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-04-06 05:38:03.284947
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-04-06 05:38:03.295416
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-04-06 05:38:03.304719
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-04-06 05:38:03.313714
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-04-06 05:38:03.323084
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-04-06 05:38:03.332405
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-04-06 05:38:03.3417
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-04-06 05:38:03.352082
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-04-06 05:38:03.362108
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-04-06 05:38:03.371719
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-04-06 05:38:03.400624
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-04-06 05:38:03.409698
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-04-06 05:38:03.418798
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-04-06 05:38:03.427754
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-04-06 05:38:03.438145
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-04-06 05:38:03.4473
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-04-06 05:38:03.457973
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-04-06 05:38:03.476719
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-04-06 05:38:03.496992
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-04-06 05:38:03.506375
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-04-06 05:38:03.515525
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-04-06 05:38:03.5245
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-04-06 05:38:03.533064
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-04-06 05:38:03.541471
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-04-06 05:38:03.549769
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-04-06 05:38:03.558216
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-04-06 05:38:03.566707
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-04-06 05:38:03.575204
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-04-06 05:38:03.5836
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-04-06 05:38:03.592024
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-04-06 05:38:03.600483
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-04-06 05:38:03.609138
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-04-06 05:38:03.617693
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-04-06 05:38:03.627298
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-04-06 05:38:03.639871
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-04-06 05:38:03.648464
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-04-06 05:38:03.657266
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-04-06 05:38:03.665919
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-04-06 05:38:03.674531
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-04-06 05:38:03.683306
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-04-06 05:38:03.692524
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-04-06 05:38:03.706998
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-04-06 05:38:03.716514
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-04-06 05:38:03.725385
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-04-06 05:38:03.751011
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-04-06 05:38:03.761605
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-04-06 05:38:04.111679
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-04-06 05:38:04.114725
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-04-06 05:38:04.130846
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-04-06 05:38:04.135945
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-04-06 05:38:04.139115
57	s3-multipart-uploads-metadata	f127886e00d1b374fadbc7c6b31e09336aad5287	2026-04-17 09:37:38.565397
58	operation-ergonomics	00ca5d483b3fe0d522133d9002ccc5df98365120	2026-04-17 09:37:38.590771
56	fix-optimized-search-function	b823ed1e418101032fa01374edc9a436e54e3ed4	2026-04-06 05:38:04.149077
59	drop-unused-functions	38456f13e39691c2bbb4b5151d0d1cdbabd4a8c4	2026-05-21 10:39:13.892392
60	optimize-existing-functions-again	db35e1c91a9201e59f4fef8d972c2f277d68b157	2026-05-21 10:39:13.900477
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata, metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1061, true);


--
-- Name: bts_context_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bts_context_id_seq', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (id);


--
-- Name: bts_context bts_context_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bts_context
    ADD CONSTRAINT bts_context_pkey PRIMARY KEY (id);


--
-- Name: content_blocks content_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_blocks
    ADD CONSTRAINT content_blocks_pkey PRIMARY KEY (slug);


--
-- Name: daily_log daily_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_log
    ADD CONSTRAINT daily_log_pkey PRIMARY KEY (id);


--
-- Name: intentions intentions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intentions
    ADD CONSTRAINT intentions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: roadmap_items roadmap_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmap_items
    ADD CONSTRAINT roadmap_items_pkey PRIMARY KEY (id);


--
-- Name: user_content user_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_content
    ADD CONSTRAINT user_content_pkey PRIMARY KEY (id);


--
-- Name: user_scores user_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_scores
    ADD CONSTRAINT user_scores_pkey PRIMARY KEY (user_id);


--
-- Name: waitlist waitlist_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_email_key UNIQUE (email);


--
-- Name: waitlist waitlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_04_09 messages_2026_04_09_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_04_09
    ADD CONSTRAINT messages_2026_04_09_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_04_10 messages_2026_04_10_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_04_10
    ADD CONSTRAINT messages_2026_04_10_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_04_11 messages_2026_04_11_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_04_11
    ADD CONSTRAINT messages_2026_04_11_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_04_12 messages_2026_04_12_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_04_12
    ADD CONSTRAINT messages_2026_04_12_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_04_13 messages_2026_04_13_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_04_13
    ADD CONSTRAINT messages_2026_04_13_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_04_14 messages_2026_04_14_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_04_14
    ADD CONSTRAINT messages_2026_04_14_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_04_15 messages_2026_04_15_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_04_15
    ADD CONSTRAINT messages_2026_04_15_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_04_09_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_04_09_inserted_at_topic_idx ON realtime.messages_2026_04_09 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_04_10_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_04_10_inserted_at_topic_idx ON realtime.messages_2026_04_10 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_04_11_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_04_11_inserted_at_topic_idx ON realtime.messages_2026_04_11 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_04_12_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_04_12_inserted_at_topic_idx ON realtime.messages_2026_04_12 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_04_13_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_04_13_inserted_at_topic_idx ON realtime.messages_2026_04_13 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_04_14_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_04_14_inserted_at_topic_idx ON realtime.messages_2026_04_14 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_04_15_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_04_15_inserted_at_topic_idx ON realtime.messages_2026_04_15 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_selec; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: messages_2026_04_09_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_04_09_inserted_at_topic_idx;


--
-- Name: messages_2026_04_09_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_04_09_pkey;


--
-- Name: messages_2026_04_10_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_04_10_inserted_at_topic_idx;


--
-- Name: messages_2026_04_10_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_04_10_pkey;


--
-- Name: messages_2026_04_11_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_04_11_inserted_at_topic_idx;


--
-- Name: messages_2026_04_11_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_04_11_pkey;


--
-- Name: messages_2026_04_12_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_04_12_inserted_at_topic_idx;


--
-- Name: messages_2026_04_12_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_04_12_pkey;


--
-- Name: messages_2026_04_13_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_04_13_inserted_at_topic_idx;


--
-- Name: messages_2026_04_13_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_04_13_pkey;


--
-- Name: messages_2026_04_14_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_04_14_inserted_at_topic_idx;


--
-- Name: messages_2026_04_14_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_04_14_pkey;


--
-- Name: messages_2026_04_15_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_04_15_inserted_at_topic_idx;


--
-- Name: messages_2026_04_15_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_04_15_pkey;


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: activity_log activity_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: daily_log daily_log_roadmap_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_log
    ADD CONSTRAINT daily_log_roadmap_item_id_fkey FOREIGN KEY (roadmap_item_id) REFERENCES public.roadmap_items(id) ON DELETE CASCADE;


--
-- Name: intentions intentions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intentions
    ADD CONSTRAINT intentions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: roadmap_items roadmap_items_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmap_items
    ADD CONSTRAINT roadmap_items_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.user_content(id) ON DELETE CASCADE;


--
-- Name: user_scores user_scores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_scores
    ADD CONSTRAINT user_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: intentions Users can insert own intentions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own intentions" ON public.intentions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: intentions Users can manage own intentions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own intentions" ON public.intentions USING ((auth.uid() = user_id));


--
-- Name: profiles Users can manage own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own profile" ON public.profiles USING ((auth.uid() = id));


--
-- Name: intentions Users can update own intentions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own intentions" ON public.intentions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: activity_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

--
-- Name: waitlist anon can join waitlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "anon can join waitlist" ON public.waitlist FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: content_blocks auth write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "auth write" ON public.content_blocks USING ((auth.role() = 'authenticated'::text));


--
-- Name: user_scores authed can read scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "authed can read scores" ON public.user_scores FOR SELECT TO authenticated USING (true);


--
-- Name: content_blocks authed write content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "authed write content" ON public.content_blocks TO authenticated USING (true) WITH CHECK (true);


--
-- Name: bts_context; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bts_context ENABLE ROW LEVEL SECURITY;

--
-- Name: content_blocks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_log ENABLE ROW LEVEL SECURITY;

--
-- Name: intentions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.intentions ENABLE ROW LEVEL SECURITY;

--
-- Name: activity_log own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY own ON public.activity_log USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_scores owner updates score; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owner updates score" ON public.user_scores FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_scores owner writes score; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "owner writes score" ON public.user_scores FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: content_blocks public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read" ON public.content_blocks FOR SELECT USING (true);


--
-- Name: content_blocks public read content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read content" ON public.content_blocks FOR SELECT TO authenticated, anon USING (true);


--
-- Name: roadmap_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;

--
-- Name: user_content; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_content ENABLE ROW LEVEL SECURITY;

--
-- Name: user_scores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: waitlist; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: objects vision insert own; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "vision insert own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'vision-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects vision update own; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "vision update own" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'vision-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: -
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: ensure_rls; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
         WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
   EXECUTE FUNCTION public.rls_auto_enable();


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict pcrD6LRg502Q3qEWVVdlxfm6BAwBvSztRCDXO6K94Hjh3SdB7w1iZxMBV3CCj61

