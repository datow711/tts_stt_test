// js/supabaseClient.js

const SUPABASE_URL = 'https://uoftjfcuwhlfunxgpoki.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZnRqZmN1d2hsZnVueGdwb2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTMxNjQsImV4cCI6MjA3NDM4OTE2NH0.kZL86PIhHzBR4J2BeEDdBWVF4-KQxONpMO7KBWQovM0';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
