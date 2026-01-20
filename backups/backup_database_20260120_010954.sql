--
-- PostgreSQL database dump
--

\restrict Z1S1c9tgp3SZcrKJHcqEtkQZMZSczmzbgqPnqPXT86JaR26B9R4QyUwfIDsVYGq

-- Dumped from database version 14.20
-- Dumped by pg_dump version 17.7 (Debian 17.7-0+deb13u1)

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: backups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.backups (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    backup_type character varying(50) NOT NULL,
    file_size integer,
    created_by integer NOT NULL,
    status character varying(20),
    created_at timestamp without time zone
);


ALTER TABLE public.backups OWNER TO postgres;

--
-- Name: backups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.backups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.backups_id_seq OWNER TO postgres;

--
-- Name: backups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.backups_id_seq OWNED BY public.backups.id;


--
-- Name: family_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.family_members (
    id integer NOT NULL,
    user_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    gender character varying(20),
    birth_date date,
    death_date date,
    birth_place character varying(255),
    occupation character varying(100),
    bio text,
    photo_url character varying(500),
    father_id integer,
    mother_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    middle_name character varying(100),
    nickname character varying(100),
    location character varying(255),
    country character varying(100),
    social_media jsonb,
    previous_partners text
);


ALTER TABLE public.family_members OWNER TO postgres;

--
-- Name: family_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.family_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.family_members_id_seq OWNER TO postgres;

--
-- Name: family_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.family_members_id_seq OWNED BY public.family_members.id;


--
-- Name: system_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_logs (
    id integer NOT NULL,
    level character varying(20) NOT NULL,
    message text NOT NULL,
    user_id integer,
    action character varying(100),
    details json,
    ip_address character varying(50),
    created_at timestamp without time zone
);


ALTER TABLE public.system_logs OWNER TO postgres;

--
-- Name: system_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_logs_id_seq OWNER TO postgres;

--
-- Name: system_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_logs_id_seq OWNED BY public.system_logs.id;


--
-- Name: tree_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tree_views (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_default boolean,
    node_positions json,
    filter_settings json,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.tree_views OWNER TO postgres;

--
-- Name: tree_views_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tree_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tree_views_id_seq OWNER TO postgres;

--
-- Name: tree_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tree_views_id_seq OWNED BY public.tree_views.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    created_at timestamp without time zone,
    is_admin boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    permissions jsonb,
    last_login timestamp without time zone,
    onboarding_completed boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: backups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backups ALTER COLUMN id SET DEFAULT nextval('public.backups_id_seq'::regclass);


--
-- Name: family_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_members ALTER COLUMN id SET DEFAULT nextval('public.family_members_id_seq'::regclass);


--
-- Name: system_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs ALTER COLUMN id SET DEFAULT nextval('public.system_logs_id_seq'::regclass);


--
-- Name: tree_views id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tree_views ALTER COLUMN id SET DEFAULT nextval('public.tree_views_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: backups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.backups (id, filename, backup_type, file_size, created_by, status, created_at) FROM stdin;
\.


--
-- Data for Name: family_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.family_members (id, user_id, first_name, last_name, gender, birth_date, death_date, birth_place, occupation, bio, photo_url, father_id, mother_id, created_at, updated_at, middle_name, nickname, location, country, social_media, previous_partners) FROM stdin;
4	1	Josefine	Leideritz	Female	1989-01-01	\N	\N	\N	\N	\N	\N	\N	2026-01-19 04:54:35.963577	2026-01-19 04:54:35.963579	\N	\N	\N	\N	\N	\N
3	1	Maximilian	Leideritz	Male	2025-01-01	\N	\N	\N	\N	\N	1	4	2026-01-19 04:54:01.814084	2026-01-19 04:54:46.390185	\N	\N	\N	\N	\N	\N
58	1	Josephine	Torrechilla	Female	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 22:58:45.829181	2026-01-19 22:58:45.829183	\N	\N	\N	Philippines	null	\N
40	1	Jillian	Torrechilla	Female	\N	\N	\N	\N	\N	\N	19	58	2026-01-19 18:55:25.045777	2026-01-19 22:59:02.479439	\N	\N	\N	\N	\N	\N
7	1	Juliana	Torrechilla	Female	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 05:19:10.03823	2026-01-19 05:19:19.196457	\N	\N	\N	\N	\N	\N
9	1	Nhesa Mae	Patoy	Female	\N	\N	\N	\N	\N	\N	6	5	2026-01-19 06:01:48.917253	2026-01-19 06:01:48.917256	\N	\N	\N	\N	\N	\N
8	1	Serafin	Torrechilla	Male	\N	1980-01-01	\N	\N	\N	\N	\N	\N	2026-01-19 05:19:38.97454	2026-01-19 06:02:58.081589	\N	\N	\N	\N	\N	\N
10	1	Alberto	Patoy	Male	\N	2008-01-01	\N	\N	\N	\N	\N	\N	2026-01-19 06:03:40.893654	2026-01-19 06:03:40.893659	\N	\N	\N	\N	\N	\N
11	1	Teresita	Patoy	Female	\N	1994-01-01	\N	\N	\N	\N	\N	\N	2026-01-19 06:04:05.846901	2026-01-19 06:04:05.846905	\N	\N	\N	\N	\N	\N
12	1	Nida	Baterna	Female	\N	\N	\N	\N	\N	\N	8	7	2026-01-19 17:24:28.615487	2026-01-19 17:24:28.615492	\N	\N	\N	\N	\N	\N
13	1	Helen	Paclejan	Female	\N	\N	\N	\N	\N	\N	8	7	2026-01-19 17:25:02.117145	2026-01-19 17:25:02.117181	\N	\N	\N	\N	\N	\N
14	1	James	Torrechilla	Male	\N	\N	\N	\N	\N	\N	8	7	2026-01-19 17:26:10.55436	2026-01-19 17:26:10.554363	\N	\N	\N	\N	\N	\N
15	1	Susan	Delgado	Female	\N	\N	\N	\N	\N	\N	8	7	2026-01-19 17:26:56.272948	2026-01-19 17:26:56.272951	\N	\N	\N	\N	\N	\N
17	1	Jerry	Torrechilla	Male	\N	\N	\N	\N	\N	\N	8	7	2026-01-19 17:28:34.932293	2026-01-19 17:28:34.932296	\N	\N	\N	\N	\N	\N
18	1	Dave	Torrechilla	Male	\N	\N	\N	\N	\N	\N	8	7	2026-01-19 17:29:33.326275	2026-01-19 17:29:33.326286	\N	\N	\N	\N	\N	\N
19	1	Serafin Jr.	Torrechilla	Male	\N	\N	\N	\N	\N	\N	8	7	2026-01-19 17:30:11.538742	2026-01-19 17:30:11.538745	\N	\N	\N	\N	\N	\N
20	1	Amela	Torrechilla	Female	\N	\N	\N	\N	\N	\N	8	7	2026-01-19 17:50:58.25369	2026-01-19 17:50:58.253693	\N	\N	\N	\N	\N	\N
21	1	Joel	Patoy	Male	\N	\N	\N	\N	\N	\N	10	11	2026-01-19 17:52:10.706394	2026-01-19 17:52:10.706397	\N	\N	\N	\N	\N	\N
22	1	Jovelita	Tang	Female	\N	\N	\N	\N	\N	\N	10	11	2026-01-19 17:53:07.338165	2026-01-19 17:53:07.338169	\N	\N	\N	\N	\N	\N
23	1	Alberto Jr.	Patoy	Male	\N	\N	\N	\N	\N	\N	10	11	2026-01-19 17:54:48.193373	2026-01-19 17:54:48.193376	\N	\N	\N	\N	\N	\N
24	1	Zarina	Patoy	Female	\N	\N	\N	\N	\N	\N	10	11	2026-01-19 17:56:13.642944	2026-01-19 17:56:13.642948	\N	\N	\N	\N	\N	\N
26	1	Rustico	Paclejan	Male	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 18:07:03.889408	2026-01-19 18:07:03.889411	\N	\N	\N	\N	\N	\N
25	1	Roselyn	Paclejan	Female	\N	\N	\N	\N	\N	\N	26	13	2026-01-19 18:06:35.460649	2026-01-19 18:07:16.31239	\N	\N	\N	\N	\N	\N
27	1	Rochelle	Cherian	Female	\N	\N	\N	\N	\N	\N	26	13	2026-01-19 18:08:12.081459	2026-01-19 18:08:12.081462	\N	\N	\N	\N	\N	\N
28	1	Ivan	Paclejan	Male	\N	\N	\N	\N	\N	\N	26	13	2026-01-19 18:09:01.949311	2026-01-19 18:09:01.949314	\N	\N	\N	\N	\N	\N
30	1	Rayben	Baterna	Male	\N	\N	\N	\N	\N	\N	\N	12	2026-01-19 18:27:14.281913	2026-01-19 18:27:14.281917	\N	\N	\N	\N	\N	\N
33	1	Gerome	Delgado	Male	\N	\N	\N	\N	\N	\N	\N	15	2026-01-19 18:30:51.731115	2026-01-19 18:30:51.731117	\N	\N	\N	\N	\N	\N
34	1	Irene	Torrechilla	Female	\N	\N	\N	\N	\N	\N	16	\N	2026-01-19 18:33:39.294493	2026-01-19 18:33:39.294497	\N	\N	\N	\N	\N	\N
16	1	Edwin Sr.	Torrechilla	Male	\N	\N	\N	\N	\N	\N	8	7	2026-01-19 17:27:38.334915	2026-01-19 18:33:50.388115	\N	\N	\N	\N	\N	\N
35	1	Edwin Jr.	Torrechilla	Male	\N	\N	\N	\N	\N	\N	16	\N	2026-01-19 18:34:32.867501	2026-01-19 18:34:32.867506	\N	\N	\N	\N	\N	\N
36	1	Jesher	Torrechilla	Male	\N	\N	\N	\N	\N	\N	17	\N	2026-01-19 18:35:32.581493	2026-01-19 18:35:32.581497	\N	\N	\N	\N	\N	\N
64	1	Stephen	Granada	Male	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 23:21:51.198067	2026-01-19 23:21:51.198071	\N	\N	\N	Philippines	null	\N
1	1	Alser	Sugasawa	Male	2026-01-01	\N	Bacolod City	\N	\N	\N	6	5	2026-01-19 04:52:10.238535	2026-01-19 19:16:51.953472	\N	\N	Whitehorse, YT	Canada	\N	\N
43	1	Alexi Patrice	Paclejan	Female	\N	\N	Bacolod City	\N	\N	\N	\N	25	2026-01-19 19:19:08.489554	2026-01-19 19:19:08.489562	\N	Patring	Bacolod City, Negros Occidental	Philippines	\N	\N
44	1	Neomi Viola	Embile	Female	\N	\N	\N	\N	\N	\N	\N	29	2026-01-19 19:21:05.228381	2026-01-19 19:21:05.228383	Baterna	\N	\N	\N	\N	\N
29	1	Michelle	Embile	Female	\N	\N	\N	\N	\N	\N	\N	12	2026-01-19 18:26:33.717421	2026-01-19 19:21:37.314676	Baterna	\N	\N	\N	\N	\N
45	1	Angel Raveness	Baterna	Female	\N	\N	\N	\N	\N	\N	30	\N	2026-01-19 19:22:56.365515	2026-01-19 19:22:56.365519	\N	\N	\N	Philippines	\N	\N
46	1	Heaven Rangelness	Baterna	Female	\N	\N	\N	\N	\N	\N	30	\N	2026-01-19 19:29:07.884241	2026-01-19 19:29:07.884243	\N	Kai Kai	\N	Philippines	\N	\N
31	1	Jinkee	Omega	Female	\N	\N	\N	\N	\N	\N	\N	12	2026-01-19 18:28:05.145412	2026-01-19 19:39:07.226037	\N	\N	\N	Saudi Arabia	\N	\N
32	1	Gerald	Delgado	Male	\N	\N	\N	\N	\N	\N	\N	15	2026-01-19 18:30:03.158655	2026-01-19 19:39:32.628053	\N	\N	\N	Singapore	\N	\N
63	1	Stellon Blake	Granada	Male	\N	\N	\N	\N	\N	\N	64	37	2026-01-19 23:20:55.711892	2026-01-19 23:22:26.074226	\N	\N	\N	\N	null	\N
51	1	Elise	Sugasawa	Female	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 22:25:50.564896	2026-01-19 22:25:50.564899	\N	\N	\N	\N	null	Alser Sugasawa
2	1	Chase	Sugasawa	Male	2012-01-01	\N	\N	\N	\N	\N	1	51	2026-01-19 04:53:18.746027	2026-01-19 22:26:09.480644	\N	\N	\N	\N	\N	\N
52	1	Ayesha Gercille	Delgado	Female	\N	\N	\N	\N	\N	\N	33	\N	2026-01-19 22:29:55.666669	2026-01-19 22:29:55.666673	\N	\N	\N	Philippines	null	\N
53	1	Joshua	Zsohar	Male	\N	\N	\N	\N	\N	\N	\N	24	2026-01-19 22:48:11.352195	2026-01-19 22:48:11.352198	\N	\N	Whitehorse, YT	Canada	null	\N
54	1	Celine Faith	Zsohar	Female	\N	\N	Whitehorse	\N	\N	\N	\N	24	2026-01-19 22:49:53.361755	2026-01-19 22:49:53.361758	Patoy	\N	Whitehorse, YT	Canada	null	\N
55	1	Shineth	Tang-Borres	Female	\N	\N	\N	\N	\N	\N	\N	22	2026-01-19 22:51:29.390404	2026-01-19 22:51:29.390407	Patoy	\N	Whitehorse, YT	Canada	null	\N
56	1	Al Christian	Patoy	Male	\N	\N	\N	\N	\N	\N	23	\N	2026-01-19 22:53:22.809739	2026-01-19 22:53:22.809743	\N	\N	\N	Canada	null	\N
57	1	Matthew	Cherian	Male	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 22:56:30.233747	2026-01-19 22:56:30.23375	Mannampallil	\N	\N	United Kingdom	null	\N
47	1	Juliana	Cherian	Female	\N	\N	\N	\N	\N	\N	57	27	2026-01-19 19:30:27.561163	2026-01-19 22:56:57.759495	\N	\N	\N	\N	\N	\N
41	1	Jesan Paul	Torrechilla	Male	\N	\N	\N	\N	\N	\N	19	58	2026-01-19 18:56:29.864679	2026-01-19 22:59:20.463942	\N	\N	\N	\N	\N	\N
42	1	Shaira	Torrechilla	Female	\N	\N	\N	\N	\N	\N	19	58	2026-01-19 18:57:57.0951	2026-01-19 22:59:30.306119	\N	\N	\N	\N	\N	\N
59	1	Leah	Torrechilla	Female	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 23:01:02.335346	2026-01-19 23:01:02.33535	Ledesma	Diding	\N	Philippines	null	\N
37	1	Ellah Mae	Torrechilla	Female	\N	\N	\N	\N	\N	\N	18	59	2026-01-19 18:36:45.843189	2026-01-19 23:01:21.340901	\N	\N	\N	\N	\N	\N
38	1	Brylle	Torrechilla	Male	\N	\N	\N	\N	\N	\N	18	59	2026-01-19 18:37:52.915107	2026-01-19 23:01:44.058208	\N	\N	\N	\N	\N	\N
39	1	Kellah	Torrechilla	Female	\N	\N	\N	\N	\N	\N	18	59	2026-01-19 18:53:32.325797	2026-01-19 23:02:02.629025	\N	\N	\N	\N	\N	\N
60	1	Eggbert	Omega	Male	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 23:03:39.712124	2026-01-19 23:03:39.712128	\N	\N	\N	Philippines	null	\N
49	1	Cheyenne	Omega	Female	\N	\N	\N	\N	\N	\N	60	31	2026-01-19 19:38:16.863156	2026-01-19 23:03:50.626414	\N	\N	\N	\N	\N	\N
48	1	Raymond Carlo	Embile	Male	\N	\N	\N	\N	\N	\N	\N	29	2026-01-19 19:32:39.285768	2026-01-19 23:04:24.777955	Baterna	\N	\N	\N	\N	\N
5	1	Nena	Patoy	Female	\N	\N	\N	\N	\N	\N	8	7	2026-01-19 04:55:30.424942	2026-01-19 23:05:55.26769	Torrechilla	\N	Whitehorse, YT	Canada	\N	\N
6	1	Samuel	Patoy	Male	\N	\N	\N	\N	\N	\N	10	11	2026-01-19 04:56:16.185598	2026-01-19 23:06:16.770137	\N	\N	Whitehorse, YT	Canada	\N	\N
61	1	Izza Kathrina	Paclejan	Female	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 23:07:23.014402	2026-01-19 23:07:23.014406	\N	\N	Dublin	Republic of Ireland	null	\N
50	1	Adrienne 	Paclejan	Female	\N	\N	Dublin, Republic of Ireland	\N	\N	\N	28	61	2026-01-19 22:24:40.799627	2026-01-19 23:07:35.235331	\N	\N	\N	\N	null	\N
65	1	Jessa	Torrechilla	Female	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 23:24:02.344651	2026-01-19 23:24:02.344655	\N	\N	\N	Philippines	null	\N
62	1	Zosia Blare	Torrechilla	Female	\N	\N	\N	\N	\N	\N	38	65	2026-01-19 23:18:58.229286	2026-01-19 23:24:23.428246	\N	\N	\N	\N	null	\N
\.


--
-- Data for Name: system_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_logs (id, level, message, user_id, action, details, ip_address, created_at) FROM stdin;
1	INFO	Admin user 'adminalser' created during initial setup	2	admin_setup	null	192.168.65.1	2026-01-20 01:01:38.988275
\.


--
-- Data for Name: tree_views; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tree_views (id, user_id, name, description, is_default, node_positions, filter_settings, created_at, updated_at) FROM stdin;
3	1	Test Print View	\N	t	{"1": {"x": 162.3431335449219, "y": 62.97572422027588}, "2": {"x": 77.25222358703616, "y": 239.233154296875}, "3": {"x": 268.42544612884524, "y": 242.65460205078125}, "4": {"x": 376.7793156042695, "y": 63.13346862792969}, "5": {"x": 663.4595336914062, "y": -106.2611312866211}, "6": {"x": 96.76820220947275, "y": -113.25408172607422}, "7": {"x": 1447.0696411132812, "y": -356.62430572509766}, "8": {"x": 2103.4401611328126, "y": -353.9247856140137}, "9": {"x": 523.3514999389648, "y": 56.33789348602295}, "10": {"x": 243.48882751464862, "y": -329.5825653076172}, "11": {"x": -682.8951721191406, "y": -332.59664154052734}, "12": {"x": 884.9558166503907, "y": -102.19095611572266}, "13": {"x": 1030.2131958007812, "y": -104.49776458740234}, "14": {"x": 1478.720751953125, "y": -103.08322143554688}, "15": {"x": 1676.5270141601563, "y": -105.20502471923828}, "16": {"x": 2023.805419921875, "y": -99.1768798828125}, "17": {"x": 1866.7451538085938, "y": -97.0550765991211}, "18": {"x": 2405.2178955078125, "y": -81.42974090576172}, "19": {"x": 2168.60029296875, "y": -88.35015106201172}, "20": {"x": 2811.3761962890626, "y": -59.96125793457031}, "21": {"x": -879.8882345199584, "y": -119.73190307617188}, "22": {"x": -421.98472900390607, "y": -124.36939239501953}, "23": {"x": -636.5028381347656, "y": -123.77965545654297}, "24": {"x": -203.2407806396484, "y": -119.24986267089844}, "25": {"x": 1096.4447875976562, "y": 56.273887634277344}, "26": {"x": 1317.244189453125, "y": -103.8907699584961}, "27": {"x": 1226.2725830078125, "y": 59.37548828125}, "28": {"x": 1381.7654174804688, "y": 58.49314880371094}, "29": {"x": 711.4304992675782, "y": 53.17228317260742}, "30": {"x": 807.578744506836, "y": 48.55866289138794}, "31": {"x": 897.7423278808594, "y": 60.09266662597656}, "32": {"x": 1677.281005859375, "y": 80.85389709472656}, "33": {"x": 1551.2383544921877, "y": 74.82573699951172}, "34": {"x": 1985.5959228515626, "y": 94.42070007324219}, "35": {"x": 2116.9593750000004, "y": 93.00614166259766}, "36": {"x": 1847.1901000976563, "y": 92.25997924804688}, "37": {"x": 2636.417431640625, "y": 91.0144271850586}, "38": {"x": 2782.1080322265625, "y": 90.73639678955078}, "39": {"x": 2959.163623046875, "y": 91.25868225097656}, "40": {"x": 2229.989770507813, "y": 95.83414459228516}, "41": {"x": 2348.8308837890627, "y": 90.97844696044922}, "42": {"x": 2473.6435546875, "y": 92.76408386230469}, "43": {"x": 1145.9536376953124, "y": 246.27340698242188}, "44": {"x": 419.6418395996094, "y": 247.75929260253906}, "45": {"x": 881.7873840332031, "y": 246.95631408691406}, "46": {"x": 731.4113647460938, "y": 243.1375274658203}, "47": {"x": 1278.8076782226562, "y": 247.20944213867188}, "48": {"x": 585.6693542480468, "y": 238.7166748046875}, "49": {"x": 1018.6155578613282, "y": 246.51771545410156}, "50": {"x": 1406.1520751953126, "y": 245.90635681152344}, "51": {"x": -2.6561275482176825, "y": 65.08427429199219}, "52": {"x": 1553.0723388671877, "y": 244.41421508789062}, "53": {"x": -127.86932830810542, "y": 60.39411163330078}, "54": {"x": -276.70515747070294, "y": 60.849971771240234}, "55": {"x": -424.48897234993683, "y": 55.335899353027344}, "56": {"x": -635.36474609375, "y": 58.323246002197266}}	{}	2026-01-19 18:46:33.322126	2026-01-19 22:55:17.51324
1	1	Test	Test	f	{}	{}	2026-01-19 18:23:05.552708	2026-01-19 18:46:40.553605
2	1	Parsed - Test	\N	f	{"1": {"x": 44.09910518565076, "y": 315.6701354980469}, "2": {"x": 43.5466988746156, "y": 490.4384460449219}, "3": {"x": -167.5259780883789, "y": 494.272705078125}, "4": {"x": -92.51576614379883, "y": 315.4274597167969}, "6": {"x": -137.0918025970459, "y": 195.41411590576172}, "7": {"x": 706.86865234375, "y": -75.39900207519531}, "8": {"x": 1051.890869140625, "y": -77.34186935424805}, "9": {"x": 208.09125845772877, "y": 309.0945739746094}, "10": {"x": -273.9775695800781, "y": -57.42039680480957}, "11": {"x": -565.0413360595703, "y": -57.870853424072266}, "13": {"x": 712.6970879448785, "y": 205.04592895507812}, "14": {"x": 961.021484375, "y": 208.69139099121094}, "15": {"x": 1070.5011596679688, "y": 206.87905883789062}, "16": {"x": 1274.3345336914062, "y": 211.502685546875}, "17": {"x": 1577.6608276367188, "y": 214.80203247070312}, "18": {"x": 1981.1289672851562, "y": 215.9212188720703}, "19": {"x": 2322.43505859375, "y": 220.8816375732422}, "20": {"x": 2613.9344482421875, "y": 208.29115295410156}, "21": {"x": -797.3624267578125, "y": 189.8226318359375}, "22": {"x": -523.7576293945312, "y": 190.43814086914062}, "23": {"x": -677.5252075195312, "y": 197.8761444091797}, "24": {"x": -373.2237854003906, "y": 189.8226318359375}, "25": {"x": 654.5460510253906, "y": 312.7520446777344}, "26": {"x": 844.3194580078125, "y": 208.60179138183594}, "27": {"x": 768.397705078125, "y": 317.12457275390625}, "28": {"x": 887.84375, "y": 315.4372253417969}, "29": {"x": 338.3933912489149, "y": 312.61956787109375}, "30": {"x": 456.23058302859044, "y": 316.140869140625}, "31": {"x": 558.9076837033641, "y": 316.3948669433594}, "32": {"x": 1003.6365105124081, "y": 317.1377258300781}, "33": {"x": 1135.630849984976, "y": 320.2850036621094}, "34": {"x": 1242.111279296875, "y": 315.9584655761719}, "35": {"x": 1367.0928955078125, "y": 315.5225524902344}, "36": {"x": 1579.6966064453125, "y": 313.8556823730469}, "37": {"x": 1855.3588310375549, "y": 334.991455078125}, "38": {"x": 1976.8275777882543, "y": 324.9490661621094}, "39": {"x": 2102.5655436197917, "y": 320.4802551269531}, "40": {"x": 2224.8756103515625, "y": 316.15771484375}, "41": {"x": 2370.8803639131434, "y": 312.6382751464844}, "42": {"x": 2503.559534409467, "y": 306.6215515136719}, "43": {"x": 828.9572807760799, "y": 489.8635559082031}, "44": {"x": 169.9974661434398, "y": 491.36907958984375}, "45": {"x": 432.51835542566636, "y": 491.96539306640625}, "46": {"x": 580.6583042689732, "y": 489.7271728515625}, "47": {"x": 982.6283026801215, "y": 480.2790222167969}, "48": {"x": 296.4965737832559, "y": 494.2326354980469}, "49": {"x": 713.2155417417869, "y": 486.60760498046875}}	{}	2026-01-19 18:25:15.195758	2026-01-19 22:22:50.41689
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, hashed_password, created_at, is_admin, is_active, permissions, last_login, onboarding_completed, updated_at) FROM stdin;
1	Alser	email.alser@gmail.com	$2b$12$jyAqaAR2isD1jWt8Nhuwg.3EtO9RwVxNpni0W86cR9DJHuM1ryCb6	2026-01-19 04:50:27.993355	f	t	\N	\N	f	2026-01-20 00:56:19.117115
2	adminalser	email@alser.ca	$2b$12$DQWDCh78eijeklhv55dWregmDzkUonAxAbC3mO6Dx9bQLuYNygOjS	2026-01-20 01:01:38.982882	t	t	\N	2026-01-20 01:09:19.653311	f	2026-01-20 01:09:19.654485
\.


--
-- Name: backups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.backups_id_seq', 1, false);


--
-- Name: family_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.family_members_id_seq', 65, true);


--
-- Name: system_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_logs_id_seq', 1, true);


--
-- Name: tree_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tree_views_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: backups backups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backups
    ADD CONSTRAINT backups_pkey PRIMARY KEY (id);


--
-- Name: family_members family_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_pkey PRIMARY KEY (id);


--
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (id);


--
-- Name: tree_views tree_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tree_views
    ADD CONSTRAINT tree_views_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_backups_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_backups_created_at ON public.backups USING btree (created_at DESC);


--
-- Name: idx_system_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_logs_created_at ON public.system_logs USING btree (created_at DESC);


--
-- Name: idx_system_logs_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_logs_level ON public.system_logs USING btree (level);


--
-- Name: idx_system_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_logs_user_id ON public.system_logs USING btree (user_id);


--
-- Name: idx_users_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);


--
-- Name: idx_users_is_admin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_is_admin ON public.users USING btree (is_admin);


--
-- Name: ix_backups_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_backups_id ON public.backups USING btree (id);


--
-- Name: ix_family_members_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_family_members_id ON public.family_members USING btree (id);


--
-- Name: ix_system_logs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_system_logs_id ON public.system_logs USING btree (id);


--
-- Name: ix_tree_views_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tree_views_id ON public.tree_views USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: backups backups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backups
    ADD CONSTRAINT backups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: family_members family_members_father_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_father_id_fkey FOREIGN KEY (father_id) REFERENCES public.family_members(id);


--
-- Name: family_members family_members_mother_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_mother_id_fkey FOREIGN KEY (mother_id) REFERENCES public.family_members(id);


--
-- Name: family_members family_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: system_logs system_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: tree_views tree_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tree_views
    ADD CONSTRAINT tree_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict Z1S1c9tgp3SZcrKJHcqEtkQZMZSczmzbgqPnqPXT86JaR26B9R4QyUwfIDsVYGq

