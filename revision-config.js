/* ============================================================================
   revision-config.js — Credenciales de Supabase para recolectar comentarios.
   ----------------------------------------------------------------------------
   Reemplazá los dos valores de abajo por los de tu proyecto Supabase.
   Los encontrás en: Supabase Dashboard → Project Settings → API
     - url     = "Project URL"        (ej. https://abcd1234.supabase.co)
     - anonKey = "anon public" key    (NO el service_role — ese nunca va al front)

   La anon key es pública por diseño: la seguridad la da la política RLS
   (solo-INSERT) definida en supabase/revision_comentario.sql.

   Estos comentarios son feedback sobre los mockups, NO contienen PII de
   clientes — por eso es seguro enviarlos al cloud (ver CLAUDE.md del repo app).

   Mientras no completes esto, los comentarios se guardan en localStorage y
   podés exportarlos con doble-click en el botón "?".
   ========================================================================== */
window.REVISION_SUPABASE = {
  url: 'https://nxrxietezcmkdaxbmtjf.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cnhpZXRlemNta2RheGJtdGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzMwMDMsImV4cCI6MjA5Njg0OTAwM30.022u05yLjS8guzktKSTHDX0Obto9bhDqCl1nkFFg4qo'
};
