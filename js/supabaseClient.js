// js/supabaseClient.js
const supabaseUrl = 'https://db.rbgct.cloud'; // La IP de tu VPS
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDB9.empG3TVP0rYZ-FUYZcm08Ua-nUfhD2NXsAjTEfGs-ic'; // ¡Recuerda usar la ANON KEY (pública)!

// Inicializamos Supabase globalmente
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);